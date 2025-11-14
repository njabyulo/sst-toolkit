/**
 * Storage Resource Remover
 * Removes S3 buckets, DynamoDB tables, SQS queues, ElastiCache, and RDS
 */

import { DynamoDBClient, DeleteTableCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, DeleteBucketCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { SQSClient, GetQueueUrlCommand, DeleteQueueCommand } from "@aws-sdk/client-sqs";
import { ElastiCacheClient, DeleteReplicationGroupCommand, DeleteCacheClusterCommand } from "@aws-sdk/client-elasticache";
import { RDSClient, DeleteDBClusterCommand, DeleteDBInstanceCommand, DeleteDBSnapshotCommand } from "@aws-sdk/client-rds";
import type { IResource, IRemoverOptions, IRemoverResult } from "../resources/types.js";
import { createClientConfig } from "../resources/base.js";
import { BaseResourceRemover } from "../utils/remover-base.js";

export class StorageResourceRemover extends BaseResourceRemover {
  async remove(resource: IResource, options: IRemoverOptions = {}): Promise<IRemoverResult> {
    const region = options.region || resource.region || "us-east-1";

    try {
      switch (resource.service) {
        case "dynamodb":
          return await this.removeDynamoDB(resource, region, options);

        case "s3":
          return await this.removeS3(resource, region, options);

        case "sqs":
          return await this.removeSQS(resource, region, options);

        case "elasticache":
          return await this.removeElastiCache(resource, region, options);

        case "rds":
          return await this.removeRDS(resource, region, options);

        default:
          return { success: false, error: `Unknown storage service: ${resource.service}` };
      }
    } catch (error) {
      return this.handleError(error, resource);
    }
  }

  private async removeDynamoDB(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    if (resource.resourceType !== "table") {
      return { success: false, error: `Unknown DynamoDB resource type: ${resource.resourceType}` };
    }

    const client = new DynamoDBClient(createClientConfig({ region, awsProfile: options.awsProfile }));
    return this.executeRemoval(
      resource,
      options,
      async () => {
        await client.send(
          new DeleteTableCommand({
            TableName: resource.resourceId,
          })
        );
      },
      "DynamoDB table"
    );
  }

  private async removeS3(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    if (resource.resourceType !== "bucket") {
      return { success: false, error: `Unknown S3 resource type: ${resource.resourceType}` };
    }

    const s3Region = region || "us-east-1";
    const client = new S3Client({
      ...createClientConfig({ region: s3Region, awsProfile: options.awsProfile }),
      region: s3Region,
    });

    // Empty bucket first (before dry-run check)
    if (!options.dryRun) {
      try {
        let continuationToken: string | undefined;
        do {
          const listResponse = await client.send(
            new ListObjectsV2Command({
              Bucket: resource.resourceId,
              ContinuationToken: continuationToken,
            })
          );

          if (listResponse.Contents && listResponse.Contents.length > 0) {
            await client.send(
              new DeleteObjectsCommand({
                Bucket: resource.resourceId,
                Delete: {
                  Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
                },
              })
            );
          }

          continuationToken = listResponse.NextContinuationToken;
        } while (continuationToken);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("NoSuchBucket")) {
          // Log warning but continue
        }
      }
    }

    // Delete bucket
    return this.executeRemoval(
      resource,
      options,
      async () => {
        try {
          await client.send(
            new DeleteBucketCommand({
              Bucket: resource.resourceId,
            })
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("Invalid endpoint") && region !== "us-east-1") {
            // Retry with us-east-1
            const usEast1Client = new S3Client(createClientConfig({ region: "us-east-1", awsProfile: options.awsProfile }));
            await usEast1Client.send(
              new DeleteBucketCommand({
                Bucket: resource.resourceId,
              })
            );
          } else {
            throw error;
          }
        }
      },
      "S3 bucket"
    );
  }

  private async removeSQS(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    if (resource.resourceType !== "queue") {
      return { success: false, error: `Unknown SQS resource type: ${resource.resourceType}` };
    }

    const client = new SQSClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    return this.executeRemoval(
      resource,
      options,
      async () => {
        const queueUrlResponse = await client.send(
          new GetQueueUrlCommand({
            QueueName: resource.resourceId,
          })
        );

        if (!queueUrlResponse.QueueUrl) {
          throw new Error("Queue URL not found");
        }

        await client.send(
          new DeleteQueueCommand({
            QueueUrl: queueUrlResponse.QueueUrl,
          })
        );
      },
      "SQS queue"
    );
  }

  private async removeElastiCache(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    const client = new ElastiCacheClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    if (resource.resourceType === "replication-group") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteReplicationGroupCommand({
              ReplicationGroupId: resource.resourceId,
            })
          );
        },
        "ElastiCache replication group"
      );
    }

    if (resource.resourceType === "cluster") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteCacheClusterCommand({
              CacheClusterId: resource.resourceId,
            })
          );
        },
        "ElastiCache cluster"
      );
    }

    return { success: false, error: `Unknown ElastiCache resource type: ${resource.resourceType}` };
  }

  private async removeRDS(
    resource: IResource,
    region: string,
    options: IRemoverOptions
  ): Promise<IRemoverResult> {
    const client = new RDSClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    if (resource.resourceType === "cluster") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteDBClusterCommand({
              DBClusterIdentifier: resource.resourceId,
              SkipFinalSnapshot: true,
            })
          );
        },
        "RDS cluster"
      );
    }

    if (resource.resourceType === "db") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteDBInstanceCommand({
              DBInstanceIdentifier: resource.resourceId,
              SkipFinalSnapshot: true,
            })
          );
        },
        "RDS database"
      );
    }

    if (resource.resourceType === "snapshot") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteDBSnapshotCommand({
              DBSnapshotIdentifier: resource.resourceId,
            })
          );
        },
        "RDS snapshot"
      );
    }

    return { success: false, error: `Unknown RDS resource type: ${resource.resourceType}` };
  }
}

export const removeStorageResource = async (resource: IResource, options: IRemoverOptions = {}) => {
  const remover = new StorageResourceRemover();
  return remover.remove(resource, options);
};

