/**
 * Networking Resource Remover
 * Removes API Gateway APIs, EventBridge rules, CloudWatch Log Groups, and EC2 route tables
 */

import { EventBridgeClient, DeleteRuleCommand, RemoveTargetsCommand, ListTargetsByRuleCommand, DeleteEventBusCommand } from "@aws-sdk/client-eventbridge";
import { ApiGatewayV2Client, DeleteApiCommand } from "@aws-sdk/client-apigatewayv2";
import { CloudWatchLogsClient, DeleteLogGroupCommand } from "@aws-sdk/client-cloudwatch-logs";
import { CloudWatchClient, DeleteAlarmsCommand, DeleteDashboardsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DeleteRouteTableCommand, DisassociateRouteTableCommand, DescribeRouteTablesCommand, DeleteVpcCommand, DeleteSubnetCommand, DeleteSecurityGroupCommand, DetachInternetGatewayCommand, DeleteInternetGatewayCommand, DeleteNatGatewayCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import type { IResource, IRemoverOptions, IRemoverResult } from "../../resources/types.js";
import { createClientConfig } from "../../resources/base.js";
import { BaseResourceRemover } from "../../utils/remover-base.js";
import { removeServiceDiscoveryResource } from "./service-discovery.js";

export class NetworkingResourceRemover extends BaseResourceRemover {
  async remove(resource: IResource, options: IRemoverOptions = {}): Promise<IRemoverResult> {
    const region = options.region || resource.region || "us-east-1";

    try {
      switch (resource.service) {
        case "events":
          return await this.removeEventBridge(resource, region, options);

        case "apigateway":
          return await this.removeAPIGateway(resource, region, options);

        case "logs":
          return await this.removeCloudWatchLogs(resource, region, options);

        case "ec2":
          return await this.removeEC2(resource, region, options);

        case "servicediscovery":
          return await removeServiceDiscoveryResource(resource, options);

        case "cloudwatch":
          return await this.removeCloudWatch(resource, region, options);

        default:
          return { success: false, error: `Unknown networking service: ${resource.service}` };
      }
    } catch (error) {
      return this.handleError(error, resource);
    }
  }

  private async removeEventBridge(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    const client = new EventBridgeClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    if (resource.resourceType === "event-bus") {
      // Can't delete default bus
      if (resource.resourceId === "default") {
        return { success: false, error: "Cannot delete default EventBridge bus" };
      }

      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteEventBusCommand({
              Name: resource.resourceId,
            })
          );
        },
        "EventBridge bus"
      );
    }

    if (resource.resourceType !== "rule") {
      return { success: false, error: `Unknown EventBridge resource type: ${resource.resourceType}` };
    }

    // Remove all targets first (required before deleting rule)
    if (!options.dryRun) {
      try {
        const targetsResponse = await client.send(
          new ListTargetsByRuleCommand({
            Rule: resource.resourceId,
          })
        );

        if (targetsResponse.Targets && targetsResponse.Targets.length > 0) {
          const targetIds = targetsResponse.Targets.map((t) => t.Id).filter((id): id is string => typeof id === "string" && id.length > 0);
          
          if (targetIds.length > 0) {
            const removeTargetsResponse = await client.send(
              new RemoveTargetsCommand({
                Rule: resource.resourceId,
                Ids: targetIds,
              })
            );

            if (removeTargetsResponse.FailedEntryCount && removeTargetsResponse.FailedEntryCount > 0) {
              // Log warning but continue
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("ResourceNotFoundException")) {
          // Log warning but continue
        }
      }
    }

    // Delete the rule
    return this.executeRemoval(
      resource,
      options,
      async () => {
        try {
          await client.send(
            new DeleteRuleCommand({
              Name: resource.resourceId,
            })
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("has targets")) {
            // Retry after a longer wait
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await client.send(
              new DeleteRuleCommand({
                Name: resource.resourceId,
              })
            );
          } else {
            throw error;
          }
        }
      },
      "EventBridge rule"
    );
  }

  private async removeAPIGateway(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    if (resource.resourceType !== "api") {
      return { success: false, error: `Unknown API Gateway resource type: ${resource.resourceType}` };
    }

    const client = new ApiGatewayV2Client(createClientConfig({ region, awsProfile: options.awsProfile }));
    return this.executeRemoval(
      resource,
      options,
      async () => {
        await client.send(
          new DeleteApiCommand({
            ApiId: resource.resourceId,
          })
        );
      },
      "API Gateway API"
    );
  }

  private async removeCloudWatchLogs(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    if (resource.resourceType !== "log-group") {
      return { success: false, error: `Unknown CloudWatch Logs resource type: ${resource.resourceType}` };
    }

    const client = new CloudWatchLogsClient(createClientConfig({ region, awsProfile: options.awsProfile }));
    return this.executeRemoval(
      resource,
      options,
      async () => {
        await client.send(
          new DeleteLogGroupCommand({
            logGroupName: resource.resourceId,
          })
        );
      },
      "CloudWatch log group"
    );
  }

  private async removeEC2(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    const client = new EC2Client(createClientConfig({ region, awsProfile: options.awsProfile }));

    switch (resource.resourceType) {
      case "route-table":
        return this.executeRemoval(
          resource,
          options,
          async () => {
            // Disassociate all route table associations first
            try {
              const describeResponse = await client.send(
                new DescribeRouteTablesCommand({
                  RouteTableIds: [resource.resourceId],
                })
              );

              if (describeResponse.RouteTables?.[0]?.Associations) {
                for (const association of describeResponse.RouteTables[0].Associations || []) {
                  if (association.RouteTableAssociationId && !association.Main) {
                    await client.send(
                      new DisassociateRouteTableCommand({
                        AssociationId: association.RouteTableAssociationId,
                      })
                    );
                  }
                }
              }
            } catch (error) {
              // Ignore if no associations
            }

            await client.send(
              new DeleteRouteTableCommand({
                RouteTableId: resource.resourceId,
              })
            );
          },
          "EC2 route table"
        );

      case "nat-gateway":
        return this.executeRemoval(
          resource,
          options,
          async () => {
            await client.send(
              new DeleteNatGatewayCommand({
                NatGatewayId: resource.resourceId,
              })
            );
          },
          "EC2 NAT gateway"
        );

      case "internet-gateway":
        return this.executeRemoval(
          resource,
          options,
          async () => {
            // Detach from VPCs first
            try {
              const igwResponse = await client.send(
                new DescribeInternetGatewaysCommand({
                  InternetGatewayIds: [resource.resourceId],
                })
              );

              if (igwResponse.InternetGateways?.[0]?.Attachments) {
                for (const attachment of igwResponse.InternetGateways[0].Attachments || []) {
                  if (attachment.VpcId) {
                    await client.send(
                      new DetachInternetGatewayCommand({
                        InternetGatewayId: resource.resourceId,
                        VpcId: attachment.VpcId,
                      })
                    );
                  }
                }
              }
            } catch (error) {
              // Ignore if already detached
            }

            await client.send(
              new DeleteInternetGatewayCommand({
                InternetGatewayId: resource.resourceId,
              })
            );
          },
          "EC2 internet gateway"
        );

      case "subnet":
        return this.executeRemoval(
          resource,
          options,
          async () => {
            await client.send(
              new DeleteSubnetCommand({
                SubnetId: resource.resourceId,
              })
            );
          },
          "EC2 subnet"
        );

      case "security-group":
        // Can't delete default security group
        if (!options.dryRun) {
          try {
            const sgResponse = await client.send(
              new DescribeSecurityGroupsCommand({
                GroupIds: [resource.resourceId],
              })
            );

            if (sgResponse.SecurityGroups?.[0]?.GroupName === "default") {
              return { success: false, error: "Cannot delete default security group" };
            }
          } catch (error) {
            // Ignore if not found
          }
        }

        return this.executeRemoval(
          resource,
          options,
          async () => {
            await client.send(
              new DeleteSecurityGroupCommand({
                GroupId: resource.resourceId,
              })
            );
          },
          "EC2 security group"
        );

      case "vpc":
        return this.executeRemoval(
          resource,
          options,
          async () => {
            // VPCs must be deleted after all dependent resources
            // This is handled by dependency graph
            await client.send(
              new DeleteVpcCommand({
                VpcId: resource.resourceId,
              })
            );
          },
          "EC2 VPC"
        );

      default:
        return { success: false, error: `Unknown EC2 resource type: ${resource.resourceType}` };
    }
  }

  private async removeCloudWatch(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    const client = new CloudWatchClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    if (resource.resourceType === "alarm") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteAlarmsCommand({
              AlarmNames: [resource.resourceId],
            })
          );
        },
        "CloudWatch alarm"
      );
    }

    if (resource.resourceType === "dashboard") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteDashboardsCommand({
              DashboardNames: [resource.resourceId],
            })
          );
        },
        "CloudWatch dashboard"
      );
    }

    return { success: false, error: `Unknown CloudWatch resource type: ${resource.resourceType}` };
  }
}

export const removeNetworkingResource = async (resource: IResource, options: IRemoverOptions = {}) => {
  const remover = new NetworkingResourceRemover();
  return remover.remove(resource, options);
};

