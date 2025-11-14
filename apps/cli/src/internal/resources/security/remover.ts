/**
 * Security Resource Remover
 * Removes IAM roles and policies
 */

import { IAMClient, DeleteRoleCommand, ListAttachedRolePoliciesCommand, DetachRolePolicyCommand, ListRolePoliciesCommand, DeleteRolePolicyCommand } from "@aws-sdk/client-iam";
import type { IResource, IRemoverOptions, IRemoverResult } from "../../resources/types.js";
import { createClientConfig } from "../../resources/base.js";
import { BaseResourceRemover } from "../../utils/remover-base.js";

export class SecurityResourceRemover extends BaseResourceRemover {
  async remove(resource: IResource, options: IRemoverOptions = {}): Promise<IRemoverResult> {
    try {
      switch (resource.service) {
        case "iam":
          return await this.removeIAM(resource, options);

        default:
          return { success: false, error: `Unknown security service: ${resource.service}` };
      }
    } catch (error) {
      return this.handleError(error, resource);
    }
  }

  private async removeIAM(resource: IResource, options: IRemoverOptions): Promise<IRemoverResult> {
    // IAM is global, so region doesn't matter, but we'll use us-east-1
    const client = new IAMClient(createClientConfig({ region: "us-east-1", awsProfile: options.awsProfile }));

    if (resource.resourceType === "role") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          // Detach all managed policies first
          const attachedPolicies = await client.send(
            new ListAttachedRolePoliciesCommand({
              RoleName: resource.resourceId,
            })
          );

          if (attachedPolicies.AttachedPolicies) {
            for (const policy of attachedPolicies.AttachedPolicies) {
              await client.send(
                new DetachRolePolicyCommand({
                  RoleName: resource.resourceId,
                  PolicyArn: policy.PolicyArn!,
                })
              );
            }
          }

          // Delete all inline policies
          const inlinePolicies = await client.send(
            new ListRolePoliciesCommand({
              RoleName: resource.resourceId,
            })
          );

          if (inlinePolicies.PolicyNames) {
            for (const policyName of inlinePolicies.PolicyNames) {
              await client.send(
                new DeleteRolePolicyCommand({
                  RoleName: resource.resourceId,
                  PolicyName: policyName,
                })
              );
            }
          }

          // Delete the role
          await client.send(
            new DeleteRoleCommand({
              RoleName: resource.resourceId,
            })
          );
        },
        "IAM role"
      );
    }

    return { success: false, error: `Unknown IAM resource type: ${resource.resourceType}` };
  }
}

export const removeSecurityResource = async (resource: IResource, options: IRemoverOptions = {}) => {
  const remover = new SecurityResourceRemover();
  return remover.remove(resource, options);
};

