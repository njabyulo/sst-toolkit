import { execSync } from "child_process";

export interface IPluginTestOptions {
  pluginPath?: string;
  projectRoot?: string;
}

export async function testPlugin(options: IPluginTestOptions = {}): Promise<void> {
  const { projectRoot = process.cwd() } = options;
  
  try {
    execSync("pnpm test", { cwd: projectRoot, stdio: "inherit" });
    process.stdout.write("✅ Plugin tests passed\n");
  } catch (error) {
    throw new Error(`Failed to test plugin: ${error instanceof Error ? error.message : String(error)}`);
  }
}

