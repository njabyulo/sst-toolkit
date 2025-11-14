/**
 * Resources Find Command
 * Finds AWS resources by tags
 */

import * as InternalResources from "../../internal/resources/index.js";
import { ResourceRouter } from "../../utils/router.js";
import { logger, colors } from "../../utils/logger.js";
import type { IFinderOptions } from "../../resources/types.js";
import { buildResourceGraph } from "../../resources/graph.js";

export interface ITagFilter {
  key: string;
  value: string;
}

export interface IFindCommandOptions {
  tags: ITagFilter[];
  tagMatch: "AND" | "OR";
  region?: string;
  awsProfile?: string;
}

export async function findResources(options: IFindCommandOptions): Promise<void> {
  // Display header
  logger.log("\n" + "=".repeat(60), colors.cyan);
  logger.log("🔍 FINDING AWS RESOURCES", colors.bright + colors.cyan);
  logger.log("=".repeat(60), colors.cyan);
  logger.log(`Region:   ${options.region || "us-east-1"}`);
  logger.log(`Profile:  ${options.awsProfile || "default"}`);
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

  logger.log("Resources found:");
  for (const [service, serviceResources] of Object.entries(byService)) {
    logger.log(`  ${service}: ${(serviceResources as typeof resources).length} resource(s)`, colors.gray);
  }
  console.log("");

  // Show dependency information if any
  const graph = buildResourceGraph(resources);
  const resourcesWithDeps = Array.from(graph.nodes.values()).filter(
    (node) => node.dependencies.size > 0 || node.dependents.size > 0
  );
  if (resourcesWithDeps.length > 0) {
    logger.info("Dependency graph analysis:");
    for (const node of resourcesWithDeps) {
      if (node.dependencies.size > 0) {
        logger.log(`  ${node.resource.arn.substring(0, 60)}...`, colors.gray);
        logger.log(`    depends on: ${node.dependencies.size} resource(s)`, colors.gray);
      }
    }
    console.log("");
  }

  // Display resource ARNs
  logger.info("Resource ARNs:");
  for (const resource of resources) {
    logger.log(`  ${resource.arn}`, colors.gray);
  }
  console.log("");

  logger.log("=".repeat(60), colors.cyan);
  logger.success("✅ FIND COMPLETE");
  logger.log("=".repeat(60), colors.cyan);
  console.log("");
}

