/**
 * Storage Resource Finder
 * Finds S3 buckets, DynamoDB tables, SQS queues, ElastiCache, and RDS
 */

import { findResourcesByTags } from "../resources/base.js";
import type { IResourceFinder } from "../resources/interfaces.js";
import type { IFinderOptions } from "../resources/types.js";

export class StorageResourceFinder implements IResourceFinder {
  private readonly services = ["s3", "dynamodb", "sqs", "elasticache", "rds"];

  async find(options: IFinderOptions) {
    const allResources = await Promise.all(
      this.services.map((service) => findResourcesByTags(options, service))
    );
    return allResources.flat();
  }
}

export const findStorageResources = async (options: IFinderOptions = {}) => {
  const finder = new StorageResourceFinder();
  return finder.find(options);
};

