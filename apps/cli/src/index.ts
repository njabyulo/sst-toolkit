#!/usr/bin/env node

import { Command } from "commander";
import { Utils } from "@sst-toolkit/shared";
import type { ISSTState } from "@sst-toolkit/shared/types/sst";

const parseResourceRelationships = Utils.Relationships.parseResourceRelationships;

const program = new Command();

program
  .name("sst-toolkit")
  .description("Toolkit for exploring, visualizing, and extending SST")
  .version("1.0.0");

program
  .command("explore")
  .description("Explore SST state")
  .argument("<state-file>", "Path to SST state JSON file")
  .action(async (stateFile: string) => {
    try {
      const state = (await import(stateFile)) as { default: ISSTState };
      const resources = state.default.latest.resources;
      const relationships = parseResourceRelationships(resources);
      
      process.stdout.write(`Found ${resources.length} resources\n`);
      process.stdout.write(`Found ${relationships.length} relationships\n`);
    } catch (error) {
      process.stderr.write(`Failed to explore state: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

program
  .command("plugin")
  .description("Manage plugins")
  .command("list", "List installed plugins")
  .command("install", "Install a plugin")
  .command("remove", "Remove a plugin");

if (process.argv.length <= 3) {
  program.help();
  process.exit(0);
}

program.exitOverride((err) => {
  if (err.code === "commander.helpDisplayed" || err.code === "commander.version") {
    process.exit(0);
  }
  if (err.code === "commander.missingArgument" || err.code === "commander.unknownCommand") {
    process.exit(err.exitCode || 1);
  }
  process.exit(0);
});

program.parse();

