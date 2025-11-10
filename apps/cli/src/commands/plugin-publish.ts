import { execSync } from "child_process";

export interface IPluginPublishOptions {
  pluginPath?: string;
  dryRun?: boolean;
}

export async function publishPlugin(options: IPluginPublishOptions = {}): Promise<void> {
  const { pluginPath = process.cwd(), dryRun = false } = options;
  
  try {
    execSync("pnpm build", { cwd: pluginPath, stdio: "inherit" });
    
    if (dryRun) {
      execSync("npm publish --dry-run", { cwd: pluginPath, stdio: "inherit" });
      process.stdout.write("✅ Dry run completed\n");
    } else {
      execSync("npm publish", { cwd: pluginPath, stdio: "inherit" });
      process.stdout.write("✅ Plugin published successfully\n");
    }
  } catch (error) {
    throw new Error(`Failed to publish plugin: ${error instanceof Error ? error.message : String(error)}`);
  }
}

