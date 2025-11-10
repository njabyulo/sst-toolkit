import { execSync } from "child_process";

export interface IPluginRemoveOptions {
  plugin: string;
  projectRoot?: string;
}

export async function removePlugin(options: IPluginRemoveOptions): Promise<void> {
  const { plugin, projectRoot = process.cwd() } = options;
  
  try {
    execSync(`pnpm remove ${plugin}`, { cwd: projectRoot, stdio: "inherit" });
    process.stdout.write(`✅ Removed plugin: ${plugin}\n`);
  } catch (error) {
    throw new Error(`Failed to remove plugin: ${error instanceof Error ? error.message : String(error)}`);
  }
}

