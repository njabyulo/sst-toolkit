import * as fs from "fs/promises";
import * as path from "path";

export async function listPlugins(projectRoot: string = process.cwd()): Promise<void> {
  try {
    const packageJsonPath = path.join(projectRoot, "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const plugins: string[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      if (name.startsWith("@sst/") || name.includes("sst-") || name.includes("sst.")) {
        plugins.push(`${name}@${version}`);
      }
    }

    if (plugins.length === 0) {
      process.stdout.write("No plugins found.\n");
      return;
    }

    process.stdout.write(`Found ${plugins.length} plugin(s):\n`);
    for (const plugin of plugins) {
      process.stdout.write(`  - ${plugin}\n`);
    }
  } catch (error) {
    throw new Error(`Failed to list plugins: ${error instanceof Error ? error.message : String(error)}`);
  }
}

