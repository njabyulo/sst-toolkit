/**
 * Security Resource Finder
 * Finds IAM roles, policies, and other security resources
 * 
 * Note: IAM is a global service. We use Resource Groups Tagging API first,
 * then fall back to direct IAM API queries if needed.
 */

import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
} from "@aws-sdk/client-resource-groups-tagging-api";
import { IAMClient, ListRolesCommand, ListRoleTagsCommand } from "@aws-sdk/client-iam";
import { createClientConfig, parseResourceARN } from "@sst-toolkit/shared/utils/cli/base";
import type { IResourceFinder, IFinderOptions, IResource } from "@sst-toolkit/shared/types/cli/resources";

export class SecurityResourceFinder implements IResourceFinder {
  async find(options: IFinderOptions): Promise<IResource[]> {
    // Support both legacy (stage/app) and new (tags) format
    const tags = options.tags || [];
    if (options.stage && options.app) {
      // Legacy format: convert to tags
      tags.push({ key: "sst:stage", value: options.stage });
      tags.push({ key: "sst:app", value: options.app });
    }
    
    if (tags.length === 0) {
      // Default to legacy behavior if no tags provided
      tags.push({ key: "sst:stage", value: "dev" });
      tags.push({ key: "sst:app", value: "insights" });
    }

    const tagMatch = options.tagMatch || "AND";
    
    // Try Resource Groups Tagging API first (IAM is global - use us-east-1)
    const iamOptions: IFinderOptions = {
      ...options,
      region: "us-east-1",
      tags,
      tagMatch,
    };

    const resources: IResource[] = [];
    
    // First, try Resource Groups Tagging API
    const taggingClient = new ResourceGroupsTaggingAPIClient(createClientConfig(iamOptions));
    let paginationToken: string | undefined;

    do {
      // Build TagFilters for AWS API
      const tagFilters = tags.map(tag => ({
        Key: tag.key,
        Values: [tag.value],
      }));

      const command = new GetResourcesCommand({
        TagFilters: tagFilters,
        PaginationToken: paginationToken,
      });

      const response = await taggingClient.send(command);

      if (response.ResourceTagMappingList) {
        for (const resource of response.ResourceTagMappingList) {
          if (!resource.ResourceARN) continue;

          // Optimize tag lookup with Map (O(1) instead of O(n))
          const resourceTags = resource.Tags || [];
          const tagMap = new Map(resourceTags.map(tag => [tag.Key || "", tag.Value || ""]));
          
          // Apply tag matching logic (AND or OR)
          let matches = false;
          if (tagMatch === "AND") {
            matches = tags.every(tag => tagMap.get(tag.key) === tag.value);
          } else {
            matches = tags.some(tag => tagMap.get(tag.key) === tag.value);
          }

          if (matches) {
            const parsed = parseResourceARN(resource.ResourceARN);
            if (parsed && parsed.service === "iam") {
              resources.push(parsed);
            }
          }
        }
      }

      paginationToken = response.PaginationToken;
    } while (paginationToken);

    // Fallback: Query IAM directly if Resource Groups Tagging API didn't find roles
    // This handles cases where Resource Groups Tagging API doesn't return IAM resources
    if (resources.length === 0 || resources.every(r => r.resourceType !== "role")) {
      const iamClient = new IAMClient(createClientConfig({ region: "us-east-1", awsProfile: options.awsProfile }));
      let marker: string | undefined;
      const allRoles: Array<{ RoleName: string; Arn: string }> = [];
      const existingArns = new Set(resources.map(r => r.arn));

      // First, collect all roles (single paginated query)
      do {
        const listRolesResponse = await iamClient.send(
          new ListRolesCommand({ Marker: marker })
        );

        if (listRolesResponse.Roles) {
          for (const role of listRolesResponse.Roles) {
            if (role.RoleName && role.Arn) {
              allRoles.push({ RoleName: role.RoleName, Arn: role.Arn });
            }
          }
        }

        marker = listRolesResponse.Marker;
      } while (marker);

      // Parallelize tag queries (N queries in parallel with concurrency limit)
      const { Concurrency } = await import("@sst-toolkit/shared/utils/concurrency");
      const pLimit = Concurrency.pLimit;
      
      const roleResults = await pLimit(
        allRoles,
        async (role) => {
          if (!role.RoleName || !role.Arn) return null;

          try {
          const tagsResponse = await iamClient.send(
            new ListRoleTagsCommand({ RoleName: role.RoleName })
          );

          const roleTags = tagsResponse.Tags || [];
          // Optimize tag lookup with Map
          const tagMap = new Map(roleTags.map(tag => [tag.Key || "", tag.Value || ""]));
          
          // Apply tag matching logic (AND or OR)
          let matches = false;
          if (tagMatch === "AND") {
            matches = tags.every(tag => tagMap.get(tag.key) === tag.value);
          } else {
            matches = tags.some(tag => tagMap.get(tag.key) === tag.value);
          }

          if (matches) {
              const parsed = parseResourceARN(role.Arn);
              if (parsed && parsed.service === "iam" && parsed.resourceType === "role") {
                // Avoid duplicates using Set
                if (!existingArns.has(parsed.arn)) {
                  existingArns.add(parsed.arn);
                  return parsed;
                }
              }
            }
          } catch (error) {
            // Skip roles we can't access
          }
          return null;
        },
        20 // Process 20 roles concurrently
      );

      // Filter out null results and add to resources
      for (const result of roleResults) {
        if (result) {
          resources.push(result);
        }
      }
    }

    return resources;
  }
}

export const findSecurityResources = async (options: IFinderOptions = {}) => {
  const finder = new SecurityResourceFinder();
  return finder.find(options);
};

