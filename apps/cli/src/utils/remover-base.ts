/**
 * Base Resource Remover
 * Common functionality for all removers (DRY, SRP)
 */

import type { IResource, IRemoverOptions, IRemoverResult } from "../resources/types.js";
import { logger } from "./logger.js";

/**
 * Base class for resource removers
 * Implements common patterns: dry-run, error handling, logging
 */
export abstract class BaseResourceRemover {
  /**
   * Execute removal with common error handling
   */
  protected async executeRemoval(
    resource: IResource,
    options: IRemoverOptions,
    removalFn: () => Promise<void>,
    resourceTypeName: string
  ): Promise<IRemoverResult> {
    if (options.dryRun) {
      logger.log(`  [DRY RUN] Would delete ${resourceTypeName}: ${resource.resourceId}`);
      return { success: true };
    }

    try {
      await removalFn();
      logger.success(`  ✓ Deleted ${resourceTypeName}: ${resource.resourceId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error, resource);
    }
  }

  /**
   * Handle common error cases
   */
  protected handleError(error: unknown, _resource: IResource): IRemoverResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Common "not found" errors - resource already deleted
    const notFoundErrors = [
      "ResourceNotFoundException",
      "NotFoundException",
      "NoSuchFunction",
      "NoSuchBucket",
      "NoSuchEntity",
      "AWS.SimpleQueueService.NonExistentQueue",
      "InvalidRouteTableID.NotFound",
      "does not exist", // Generic AWS error message (e.g., "The security group 'sg-xxx' does not exist")
      "InvalidGroup.NotFound", // EC2 security group not found
      "InvalidSecurityGroupID.NotFound", // EC2 security group not found
    ];

    if (notFoundErrors.some((err) => errorMessage.includes(err))) {
      return { success: true };
    }

    return { success: false, error: errorMessage };
  }

  /**
   * Abstract method - each remover implements its own removal logic
   */
  abstract remove(resource: IResource, options: IRemoverOptions): Promise<IRemoverResult>;
}

