import { Command } from "commander";
import * as Commands from "./commands";

const program = new Command();

program
  .name("sst-toolkit")
  .description("Toolkit for exploring, visualizing, and extending SST")
  .version("1.0.0");

const resourcesCommand = program
  .command("resources")
  .description("Manage AWS resources");

resourcesCommand
  .command("find")
  .description("Find AWS resources by tags")
  .option("--tagMatch <match>", "Tag matching logic (AND or OR)", "AND")
  .option("--region <region>", "AWS region", process.env.AWS_REGION || "us-east-1")
  .option("--profile <profile>", "AWS profile (defaults to AWS_PROFILE env var or 'default')", process.env.AWS_PROFILE || "default")
  .allowUnknownOption()
  .action(async (options: { tagMatch?: string; region?: string; profile?: string }) => {
    try {
      const args = process.argv;
      const findIndex = args.indexOf("find");
      const tags: Array<{ key: string; value: string }> = [];
      let profile = options.profile;

      for (let i = findIndex + 1; i < args.length; i++) {
        if (args[i] === "--tag" && i + 2 < args.length) {
          tags.push({ key: args[i + 1], value: args[i + 2] });
          i += 2;
        } else if (args[i] === "--profile" && i + 1 < args.length) {
          profile = args[i + 1];
          i++;
        } else if (args[i] === "--tagMatch" || args[i] === "--region") {
          i++;
        } else if (args[i].startsWith("--")) {
          // Other options, skip
        }
      }

      // Use AWS_PROFILE env var if no profile was explicitly provided
      if (!profile || profile === "default") {
        profile = process.env.AWS_PROFILE || undefined;
      }

      if (tags.length === 0) {
        process.stderr.write("Error: --tag KEY VALUE is required for find command\n");
        process.stderr.write("Example: sst-toolkit resources find --tag sst:stage dev --tag sst:app insights\n");
        process.exit(1);
      }

      await Commands.Resources.findResources({
        tags,
        tagMatch: (options.tagMatch?.toUpperCase() || "AND") as "AND" | "OR",
        region: options.region,
        awsProfile: profile,
      });
    } catch (error) {
      process.stderr.write(`Failed to find resources: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

resourcesCommand
  .command("delete")
  .description("Delete AWS resources by tags")
  .option("--tagMatch <match>", "Tag matching logic (AND or OR)", "AND")
  .option("--region <region>", "AWS region", process.env.AWS_REGION || "us-east-1")
  .option("--profile <profile>", "AWS profile (defaults to AWS_PROFILE env var or 'default')", process.env.AWS_PROFILE || "default")
  .option("--dry-run", "Preview changes without deleting", false)
  .option("--force, -f", "Skip confirmation prompts", false)
  .allowUnknownOption()
  .action(async (options: { tagMatch?: string; region?: string; profile?: string; dryRun?: boolean; force?: boolean }) => {
    try {
      const args = process.argv;
      const deleteIndex = args.indexOf("delete");
      const tags: Array<{ key: string; value: string }> = [];
      let dryRun = false;
      let force = false;
      let profile = options.profile;

      for (let i = deleteIndex + 1; i < args.length; i++) {
        if (args[i] === "--tag" && i + 2 < args.length) {
          tags.push({ key: args[i + 1], value: args[i + 2] });
          i += 2;
        } else if (args[i] === "--profile" && i + 1 < args.length) {
          profile = args[i + 1];
          i++;
        } else if (args[i] === "--dry-run") {
          dryRun = true;
        } else if (args[i] === "--force" || args[i] === "-f") {
          force = true;
        } else if (args[i] === "--tagMatch" || args[i] === "--region") {
          i++;
        } else if (args[i].startsWith("--")) {
          // Other options, skip
        }
      }

      // Use AWS_PROFILE env var if no profile was explicitly provided
      if (!profile || profile === "default") {
        profile = process.env.AWS_PROFILE || undefined;
      }

      if (tags.length === 0) {
        process.stderr.write("Error: --tag KEY VALUE is required for delete command\n");
        process.stderr.write("Example: sst-toolkit resources delete --tag sst:stage dev --tag sst:app insights\n");
        process.exit(1);
      }

      await Commands.Resources.deleteResources({
        tags,
        tagMatch: (options.tagMatch?.toUpperCase() || "AND") as "AND" | "OR",
        region: options.region,
        awsProfile: profile,
        dryRun: dryRun || options.dryRun || false,
        force: force || options.force || false,
      });
    } catch (error) {
      process.stderr.write(`Failed to delete resources: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

const generateCommand = program
  .command("generate")
  .description("Generate components and adapters");

generateCommand
  .command("component")
  .description("Generate a component from template")
  .argument("<name>", "Component name (e.g., MyComponent)")
  .option("-t, --template <template>", "Template to use (basic, aws, cloudflare)", "basic")
  .option("-n, --namespace <namespace>", "Namespace for the component", "example")
  .option("-o, --output <dir>", "Output directory", process.cwd())
  .action(async (name: string, options: { template?: string; namespace?: string; output?: string }) => {
    try {
      await Commands.Generate.generateComponent({
        name,
        template: (options.template || "basic") as "basic" | "aws" | "cloudflare",
        namespace: options.namespace || "example",
        outputDir: options.output,
      });
      process.stdout.write(`✅ Generated component "${name}"\n`);
    } catch (error) {
      process.stderr.write(`Failed to generate component: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

generateCommand
  .command("adapter")
  .description("Generate an adapter from template")
  .argument("<name>", "Adapter name (e.g., MyAdapter)")
  .option("-n, --namespace <namespace>", "Namespace for the adapter", "example")
  .option("-o, --output <dir>", "Output directory", process.cwd())
  .action(async (name: string, options: { namespace?: string; output?: string }) => {
    try {
      await Commands.Generate.generateAdapter({
        name,
        namespace: options.namespace || "example",
        outputDir: options.output,
      });
      process.stdout.write(`✅ Generated adapter "${name}"\n`);
    } catch (error) {
      process.stderr.write(`Failed to generate adapter: ${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    }
  });

if (process.argv.length <= 2) {
  program.help();
  process.exit(0);
}

program.exitOverride((err: any) => {
  if (err.code === "commander.helpDisplayed" || err.code === "commander.version") {
    process.exit(0);
  }
  if (err.code === "commander.missingArgument" || err.code === "commander.unknownCommand") {
    process.exit(err.exitCode || 1);
  }
  process.exit(0);
});

program.parse();
