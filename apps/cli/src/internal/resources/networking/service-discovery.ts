/**
 * Service Discovery Resource Remover
 * Removes AWS Service Discovery namespaces
 */

import { ServiceDiscoveryClient, DeleteNamespaceCommand } from "@aws-sdk/client-servicediscovery";
import type { IResource, IRemoverOptions, IRemoverResult } from "../../resources/types.js";
import { createClientConfig } from "../../resources/base.js";

/**
 * Remove Service Discovery namespace
 */
export async function removeServiceDiscoveryResource(
  resource: IResource,
  options: IRemoverOptions = {}
): Promise<IRemoverResult> {
  if (resource.service !== "servicediscovery") {
    return { success: false, error: `Expected servicediscovery service, got ${resource.service}` };
  }

  if (resource.resourceType !== "namespace") {
    return { success: false, error: `Unknown Service Discovery resource type: ${resource.resourceType}` };
  }

  const region = options.region || resource.region || "us-east-1";
  const dryRun = options.dryRun || false;

  if (dryRun) {
    console.log(`  [DRY RUN] Would delete Service Discovery namespace: ${resource.resourceId}`);
    return { success: true };
  }

  try {
    const client = new ServiceDiscoveryClient(createClientConfig({ region, awsProfile: options.awsProfile }));
    
    await client.send(
      new DeleteNamespaceCommand({
        Id: resource.resourceId,
      })
    );
    
    console.log(`  ✓ Deleted Service Discovery namespace: ${resource.resourceId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("ResourceNotFoundException") ||
      errorMessage.includes("NamespaceNotFound")
    ) {
      return { success: true };
    }
    return { success: false, error: errorMessage };
  }
}

