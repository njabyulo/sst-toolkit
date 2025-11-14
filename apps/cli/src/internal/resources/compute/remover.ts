/**
 * Compute Resource Remover
 * Removes Lambda functions and event source mappings
 */

import { LambdaClient, DeleteFunctionCommand, DeleteEventSourceMappingCommand } from "@aws-sdk/client-lambda";
import type { IResource, IRemoverOptions, IRemoverResult } from "../../resources/types.js";
import { createClientConfig } from "../../resources/base.js";
import { BaseResourceRemover } from "../../utils/remover-base.js";

export class ComputeResourceRemover extends BaseResourceRemover {
  async remove(resource: IResource, options: IRemoverOptions = {}): Promise<IRemoverResult> {
    if (resource.service !== "lambda") {
      return { success: false, error: `Expected lambda service, got ${resource.service}` };
    }

    const region = options.region || resource.region || "us-east-1";
    const client = new LambdaClient(createClientConfig({ region, awsProfile: options.awsProfile }));

    if (resource.resourceType === "function") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteFunctionCommand({
              FunctionName: resource.resourceId,
            })
          );
        },
        "Lambda function"
      );
    }

    if (resource.resourceType === "event-source-mapping") {
      return this.executeRemoval(
        resource,
        options,
        async () => {
          await client.send(
            new DeleteEventSourceMappingCommand({
              UUID: resource.resourceId,
            })
          );
        },
        "Lambda event source mapping"
      );
    }

    return { success: false, error: `Unknown Lambda resource type: ${resource.resourceType}` };
  }
}

export const removeComputeResource = async (resource: IResource, options: IRemoverOptions = {}) => {
  const remover = new ComputeResourceRemover();
  return remover.remove(resource, options);
};

