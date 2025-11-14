/**
 * Resource Router
 * Routes resources to appropriate removers (Strategy pattern, OCP, DIP)
 */

import type { IResource, IRemoverOptions, IRemoverResult } from "../resources/types.js";
import type { IResourceRouter } from "../resources/interfaces.js";
import { removeComputeResource } from "../compute/remover.js";
import { removeStorageResource } from "../storage/remover.js";
import { removeNetworkingResource } from "../networking/remover.js";
import { removeSecurityResource } from "../security/remover.js";

/**
 * Service-to-category mapping
 */
const SERVICE_CATEGORY_MAP: Record<string, (resource: IResource, options: IRemoverOptions) => Promise<IRemoverResult>> = {
  lambda: removeComputeResource,
  dynamodb: removeStorageResource,
  s3: removeStorageResource,
  sqs: removeStorageResource,
  elasticache: removeStorageResource,
  rds: removeStorageResource,
  events: removeNetworkingResource,
  apigateway: removeNetworkingResource,
  logs: removeNetworkingResource,
  ec2: removeNetworkingResource,
  servicediscovery: removeNetworkingResource,
  cloudwatch: removeNetworkingResource,
  iam: removeSecurityResource,
};

export class ResourceRouter implements IResourceRouter {
  async route(resource: IResource, options: IRemoverOptions): Promise<IRemoverResult> {
    const remover = SERVICE_CATEGORY_MAP[resource.service];
    
    if (!remover) {
      return { success: false, error: `Unknown service: ${resource.service}` };
    }

    return remover(resource, options);
  }
}

