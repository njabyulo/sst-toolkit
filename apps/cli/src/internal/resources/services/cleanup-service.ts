/**
 * Cleanup Service
 * Orchestrates resource cleanup (SRP, DIP)
 */

import type { IResource, IFinderOptions, IRemoverOptions, IResourceFinder, IResourceRouter } from "@sst-toolkit/shared/types/cli/resources";
import { getOptimalDeletionOrder, buildResourceGraph } from "@sst-toolkit/shared/utils/cli/graph";
import { logger } from "@sst-toolkit/shared/utils/cli/logger";
import { pLimit } from "@sst-toolkit/shared/utils/concurrency";

export interface ICleanupService {
  findResources(options: IFinderOptions): Promise<IResource[]>;
  cleanupResources(
    resources: IResource[],
    options: IRemoverOptions
  ): Promise<{ successCount: number; failureCount: number }>;
}

export class CleanupService implements ICleanupService {
  constructor(
    private finders: IResourceFinder[],
    private router: IResourceRouter
  ) {}

  async findResources(options: IFinderOptions): Promise<IResource[]> {
    const allResources = await Promise.all(
      this.finders.map((finder) => finder.find(options))
    );
    return allResources.flat();
  }

  async cleanupResources(
    resources: IResource[],
    options: IRemoverOptions
  ): Promise<{ successCount: number; failureCount: number }> {
    const graph = buildResourceGraph(resources);
    const deletionOrder = getOptimalDeletionOrder(resources);

    let successCount = 0;
    let failureCount = 0;
    const failedResources: IResource[] = [];
    const processedArns = new Set<string>();
    const failedArns = new Set<string>(); // Use Set for O(1) lookup

    // Group resources by dependency level for parallel processing
    const independentResources: IResource[] = [];
    const dependentResources: IResource[] = [];

    for (const resource of deletionOrder) {
      const node = graph.nodes.get(resource.arn);
      if (node && node.dependencies.size > 0) {
        dependentResources.push(resource);
      } else {
        independentResources.push(resource);
      }
    }

    // Process independent resources in parallel (no dependencies)
    if (independentResources.length > 0) {
      const results = await pLimit(
        independentResources,
        async (resource) => {
          const result = await this.router.route(resource, options);
          return { resource, result };
        },
        10 // Process 10 independent resources concurrently
      );

      for (const { resource, result } of results) {
        if (result.success) {
          successCount++;
          processedArns.add(resource.arn);
        } else {
          failureCount++;
          failedResources.push(resource);
          failedArns.add(resource.arn);
          logger.error(`  ✗ Failed to delete ${resource.arn}: ${result.error || "Unknown error"}`);
        }
      }
    }

    // Process dependent resources sequentially (respecting dependencies)
    for (const resource of dependentResources) {
      const node = graph.nodes.get(resource.arn);
      
      // Check if dependencies are satisfied
      if (node && node.dependencies.size > 0) {
        const unmetDeps = Array.from(node.dependencies).filter(
          (depArn) => !processedArns.has(depArn) && !failedArns.has(depArn)
        );
        
        if (unmetDeps.length > 0 && !options.dryRun) {
          logger.warn(`  ⚠️  Skipping ${resource.arn.substring(0, 60)}... (dependencies not met)`);
          continue;
        }
      }

      const result = await this.router.route(resource, options);

      if (result.success) {
        successCount++;
        processedArns.add(resource.arn);
      } else {
        failureCount++;
        failedResources.push(resource);
        failedArns.add(resource.arn);
        logger.error(`  ✗ Failed to delete ${resource.arn}: ${result.error || "Unknown error"}`);
      }
    }

    // Retry failed resources that might have been blocked by dependencies (in parallel)
    if (failedResources.length > 0 && !options.dryRun) {
      logger.warn(`\nRetrying ${failedResources.length} failed resource(s)...`);
      
      const retryResults = await pLimit(
        failedResources,
        async (resource) => {
          const node = graph.nodes.get(resource.arn);
          const unmetDeps = node
            ? Array.from(node.dependencies).filter((depArn) => !processedArns.has(depArn))
            : [];
          
          if (unmetDeps.length === 0) {
            const result = await this.router.route(resource, options);
            return { resource, result, shouldRemove: result.success };
          }
          return { resource, result: { success: false, error: "Dependencies not met" }, shouldRemove: false };
        },
        10 // Retry 10 resources concurrently
      );

      for (const { resource, result, shouldRemove } of retryResults) {
        if (result.success) {
          successCount++;
          failureCount--;
          processedArns.add(resource.arn);
          failedArns.delete(resource.arn);
          if (shouldRemove) {
            const index = failedResources.findIndex((r) => r.arn === resource.arn);
            if (index >= 0) {
              failedResources.splice(index, 1);
            }
          }
        }
      }
    }

    return { successCount, failureCount };
  }
}

