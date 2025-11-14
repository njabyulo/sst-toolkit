/**
 * Base Resource Finder
 * Common functionality for finding resources with SST tags
 */

import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
} from "@aws-sdk/client-resource-groups-tagging-api";
import type { IResource, IFinderOptions } from "../../../types/cli/resources";

/**
 * Create AWS client config with profile support
 * Priority: Environment variables > Profile > Default credential chain
 */
export function createClientConfig(options: IFinderOptions): {
  region: string;
  credentials?: () => Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken?: string }>;
} {
  const region = options.region || "us-east-1";
  
  // Check if credentials are available via environment variables
  const hasEnvCredentials = 
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY;
  
  if (hasEnvCredentials) {
    // Use environment variables directly (highest priority)
    return {
      region,
      credentials: async () => ({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }),
    };
  }
  
  // Use profile if specified and not "default" (which would use default chain anyway)
  if (options.awsProfile && options.awsProfile !== "default") {
    return {
      region,
      credentials: async () => {
        const { fromIni } = await import("@aws-sdk/credential-providers");
        const provider = fromIni({ profile: options.awsProfile });
        return provider();
      },
    };
  }
  
  // Let AWS SDK use default credential chain (checks env vars, profiles, IAM roles, etc.)
  return {
    region,
  };
}

/**
 * Find all resources with tags (base implementation)
 * Filters by service and resource type
 * Supports flexible tag matching (AND/OR)
 */
export async function findResourcesByTags(
  options: IFinderOptions,
  filterService?: string,
  filterResourceType?: string
): Promise<IResource[]> {
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

  const client = new ResourceGroupsTaggingAPIClient(createClientConfig(options));
  const resources: IResource[] = [];
  let paginationToken: string | undefined;

  do {
    try {
      // Build tag filters based on tagMatch strategy
      const tagFilters: Array<{ Key: string; Values: string[] }> = [];
      
      if (options.tagMatch === "OR") {
        // OR: Each tag is a separate filter (union)
        for (const tag of tags) {
          tagFilters.push({
            Key: tag.key,
            Values: [tag.value],
          });
        }
      } else {
        // AND: All tags must match (intersection)
        for (const tag of tags) {
          tagFilters.push({
            Key: tag.key,
            Values: [tag.value],
          });
        }
      }

      const command = new GetResourcesCommand({
        TagFilters: tagFilters.length > 0 ? tagFilters : undefined,
        ResourceTypeFilters: filterService ? [`${filterService}:*`] : undefined,
        PaginationToken: paginationToken,
      });

      const response = await client.send(command);
      
      if (response.ResourceTagMappingList) {
        for (const mapping of response.ResourceTagMappingList) {
          if (!mapping.ResourceARN) continue;

          const parsed = parseResourceARN(mapping.ResourceARN);
          if (!parsed) continue;

          // Apply service filter if specified
          if (filterService && parsed.service !== filterService) {
            continue;
          }

          // Apply resource type filter if specified
          if (filterResourceType && parsed.resourceType !== filterResourceType) {
            continue;
          }

          // For AND matching, verify all tags are present
          if (options.tagMatch === "AND" && mapping.Tags) {
            const tagMap = new Map(
              mapping.Tags.map((tag) => [tag.Key || "", tag.Value || ""])
            );
            const allTagsMatch = tags.every((tag) => tagMap.get(tag.key) === tag.value);
            if (!allTagsMatch) {
              continue;
            }
          }

          resources.push({
            arn: mapping.ResourceARN,
            service: parsed.service,
            region: parsed.region,
            resourceId: parsed.resourceId,
            resourceType: parsed.resourceType,
          });
        }
      }

      paginationToken = response.PaginationToken;
    } catch (error) {
      // Handle specific AWS errors
      if (error instanceof Error) {
        if (error.message.includes("InvalidParameterValueException")) {
          // Some services don't support Resource Groups Tagging API
          // Return empty array instead of throwing
          break;
        }
        throw error;
      }
      throw error;
    }
  } while (paginationToken);

  return resources;
}

/**
 * Parse AWS Resource ARN into components
 */
export function parseResourceARN(arn: string): IResource | null {
  try {
    const parts = arn.split(":");
    if (parts.length < 6) return null;

    const service = parts[2];
    const region = parts[3];
    const resourcePart = parts.slice(5).join(":");

    let resourceType = "";
    let resourceId = "";

    switch (service) {
      case "lambda":
        if (resourcePart.includes("function:")) {
          resourceType = "function";
          resourceId = resourcePart.split("function:")[1];
        } else if (resourcePart.includes("event-source-mapping")) {
          resourceType = "event-source-mapping";
          resourceId = resourcePart.split("event-source-mapping:")[1];
        } else {
          return null;
        }
        break;

      case "dynamodb":
        if (resourcePart.includes("table/")) {
          resourceType = "table";
          resourceId = resourcePart.split("table/")[1];
        } else {
          return null;
        }
        break;

      case "s3":
        resourceType = "bucket";
        resourceId = resourcePart.replace(/^:::/, "");
        break;

      case "sqs":
        resourceType = "queue";
        resourceId = resourcePart;
        break;

      case "events":
        if (resourcePart.includes("rule/")) {
          resourceType = "rule";
          resourceId = resourcePart.split("rule/")[1];
        } else if (resourcePart.includes("event-bus/")) {
          resourceType = "event-bus";
          resourceId = resourcePart.split("event-bus/")[1];
        } else {
          return null;
        }
        break;

      case "apigateway":
        if (resourcePart.includes("/apis/")) {
          resourceType = "api";
          resourceId = resourcePart.split("/apis/")[1].split("/")[0];
        } else {
          return null;
        }
        break;

      case "logs":
        if (resourcePart.includes("log-group:")) {
          resourceType = "log-group";
          resourceId = resourcePart.split("log-group:")[1].split(":")[0];
        } else {
          return null;
        }
        break;

      case "ec2":
        if (resourcePart.includes("route-table/")) {
          resourceType = "route-table";
          resourceId = resourcePart.split("route-table/")[1];
        } else if (resourcePart.includes("vpc/")) {
          resourceType = "vpc";
          resourceId = resourcePart.split("vpc/")[1];
        } else if (resourcePart.includes("subnet/")) {
          resourceType = "subnet";
          resourceId = resourcePart.split("subnet/")[1];
        } else if (resourcePart.includes("security-group/")) {
          resourceType = "security-group";
          resourceId = resourcePart.split("security-group/")[1];
        } else if (resourcePart.includes("internet-gateway/")) {
          resourceType = "internet-gateway";
          resourceId = resourcePart.split("internet-gateway/")[1];
        } else if (resourcePart.includes("nat-gateway/")) {
          resourceType = "nat-gateway";
          resourceId = resourcePart.split("nat-gateway/")[1];
        } else {
          return null;
        }
        break;

      case "servicediscovery":
        if (resourcePart.includes("namespace/")) {
          resourceType = "namespace";
          resourceId = resourcePart.split("namespace/")[1];
        } else {
          return null;
        }
        break;

      case "iam":
        if (resourcePart.includes("role/")) {
          resourceType = "role";
          resourceId = resourcePart.split("role/")[1];
        } else if (resourcePart.includes("policy/")) {
          resourceType = "policy";
          resourceId = resourcePart.split("policy/")[1];
        } else if (resourcePart.includes("instance-profile/")) {
          resourceType = "instance-profile";
          resourceId = resourcePart.split("instance-profile/")[1];
        } else {
          return null;
        }
        break;

      case "elasticache":
        if (resourcePart.includes("replicationgroup:")) {
          resourceType = "replication-group";
          resourceId = resourcePart.split("replicationgroup:")[1];
        } else if (resourcePart.includes("cluster:")) {
          resourceType = "cluster";
          resourceId = resourcePart.split("cluster:")[1];
        } else {
          return null;
        }
        break;

      case "rds":
        if (resourcePart.includes("cluster:")) {
          resourceType = "cluster";
          resourceId = resourcePart.split("cluster:")[1];
        } else if (resourcePart.includes("db:")) {
          resourceType = "db";
          resourceId = resourcePart.split("db:")[1];
        } else if (resourcePart.includes("snapshot:")) {
          resourceType = "snapshot";
          resourceId = resourcePart.split("snapshot:")[1];
        } else {
          return null;
        }
        break;

      case "cloudwatch":
        if (resourcePart.includes("alarm:")) {
          resourceType = "alarm";
          resourceId = resourcePart.split("alarm:")[1];
        } else if (resourcePart.includes("dashboard:")) {
          resourceType = "dashboard";
          resourceId = resourcePart.split("dashboard:")[1];
        } else {
          return null;
        }
        break;

      default:
        resourceType = "unknown";
        resourceId = resourcePart;
    }

    return {
      arn,
      service,
      region,
      resourceId,
      resourceType,
    };
  } catch (error) {
    console.error(`Failed to parse ARN: ${arn}`, error);
    return null;
  }
}

