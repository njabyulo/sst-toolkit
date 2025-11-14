/**
 * Resources Delete Command
 * Deletes AWS resources by tags
 */

import * as InternalResources from "../../internal/resources/index.js";
import { ResourceRouter } from "../../utils/router.js";
import { logger, colors } from "../../utils/logger.js";
import { requireConfirmation } from "../../utils/confirmation.js";
import type { IFinderOptions, IRemoverOptions } from "../../resources/types.js";
import { buildResourceGraph } from "../../resources/graph.js";
import type { ITagFilter } from "./find.js";

export interface IDeleteCommandOptions {
  tags: ITagFilter[];
  tagMatch: "AND" | "OR";
  region?: string;
  awsProfile?: string;
  dryRun?: boolean;
  force?: boolean;
}

export async function deleteResources(options: IDeleteCommandOptions): Promise<void> {
  // Display header
  logger.log("\n" + "=".repeat(60), colors.cyan);
  logger.log("🗑️  DELETING AWS RESOURCES", colors.bright + colors.cyan);
  logger.log("=".repeat(60), colors.cyan);
  logger.log(`Region:   ${options.region || "us-east-1"}`);
  logger.log(`Profile:  ${options.awsProfile || "default"}`);
  if (options.dryRun) {
    logger.warn("⚠️  DRY RUN MODE - No resources will be deleted");
  }
  logger.log("=".repeat(60) + "\n", colors.cyan);

  // Initialize services (Dependency Injection)
  const finders = [
    new InternalResources.Compute.ComputeResourceFinder(),
    new InternalResources.Storage.StorageResourceFinder(),
    new InternalResources.Networking.NetworkingResourceFinder(),
    new InternalResources.Security.SecurityResourceFinder(),
  ];
  const router = new ResourceRouter();
  const cleanupService = new InternalResources.Services.CleanupService(finders, router);

  // Build finder options from tags
  const finderOptions: IFinderOptions = {
    region: options.region,
    awsProfile: options.awsProfile,
    tags: options.tags,
    tagMatch: options.tagMatch,
  };

  // Find resources
  logger.info(`Searching for resources with ${options.tagMatch} tags:`);
  for (const tag of options.tags) {
    logger.log(`  - ${tag.key}=${tag.value}`);
  }
  console.log("");

  let resources;
  try {
    resources = await cleanupService.findResources(finderOptions);
  } catch (err) {
    logger.error(`Failed to find resources: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (resources.length === 0) {
    logger.success("✅ No resources found matching the criteria");
    return;
  }

  logger.warn(`Found ${resources.length} resource(s)`);
  console.log("");

  // Group by service for display
  const byService = resources.reduce((acc, resource) => {
    if (!acc[resource.service]) {
      acc[resource.service] = [];
    }
    acc[resource.service].push(resource);
    return acc;
  }, {} as Record<string, typeof resources>);

  logger.log("Resources to delete:");
  for (const [service, serviceResources] of Object.entries(byService)) {
    logger.log(`  ${service}: ${(serviceResources as typeof resources).length} resource(s)`, colors.gray);
  }
  console.log("");

  // Show dependency information if any
  const graph = buildResourceGraph(resources);
  const resourcesWithDeps = Array.from(graph.nodes.values()).filter(
    (node) => node.dependencies.size > 0 || node.dependents.size > 0
  );
  if (resourcesWithDeps.length > 0 && !options.dryRun) {
    logger.info("Dependency graph analysis:");
    for (const node of resourcesWithDeps) {
      if (node.dependencies.size > 0) {
        logger.log(`  ${node.resource.arn.substring(0, 60)}...`, colors.gray);
        logger.log(`    depends on: ${node.dependencies.size} resource(s)`, colors.gray);
      }
    }
    console.log("");
  }

  // Confirmation
  const confirmed = await requireConfirmation(resources.length, options.dryRun || false);
  if (!confirmed) {
    logger.warn("❌ Operation cancelled");
    return;
  }
  if (!options.dryRun) {
    console.log("");
  }

  // Delete resources
  logger.info("Removing resources in optimal order (dependencies first)...");
  console.log("");

  const removerOptions: IRemoverOptions = {
    region: options.region,
    awsProfile: options.awsProfile,
    dryRun: options.dryRun || false,
  };

  const { successCount, failureCount } = await cleanupService.cleanupResources(
    resources,
    removerOptions
  );

  // Summary
  console.log("");
  logger.log("=".repeat(60), options.dryRun ? colors.cyan : colors.green);
  if (options.dryRun) {
    logger.info("DRY RUN COMPLETE");
  } else {
    logger.success("✅ DELETION COMPLETE");
  }
  logger.log("=".repeat(60), options.dryRun ? colors.cyan : colors.green);
  logger.log(`Total resources:  ${resources.length}`);
  logger.log(`Successful:       ${successCount}`);
  if (failureCount > 0) {
    logger.log(`Failed:           ${failureCount}`, colors.red);
  }
  logger.log("=".repeat(60), options.dryRun ? colors.cyan : colors.green);
  console.log("");

  if (options.dryRun) {
    logger.info("💡 Run without --dry-run to actually delete these resources");
  }
  console.log("");
}

