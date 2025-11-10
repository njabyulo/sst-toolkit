import { execSync } from "child_process";

export interface IPluginInstallOptions {
  plugin: string;
  dev?: boolean;
  projectRoot?: string;
}

export async function installPlugin(options: IPluginInstallOptions): Promise<void> {
  const { plugin, dev = false, projectRoot = process.cwd() } = options;
  
  try {
    const command = dev ? `pnpm add -D ${plugin}` : `pnpm add ${plugin}`;
    execSync(command, { cwd: projectRoot, stdio: "inherit" });
    process.stdout.write(`✅ Installed plugin: ${plugin}\n`);
  } catch (error) {
    throw new Error(`Failed to install plugin: ${error instanceof Error ? error.message : String(error)}`);
  }
}

