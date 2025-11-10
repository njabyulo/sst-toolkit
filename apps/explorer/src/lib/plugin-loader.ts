export interface IPluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  types?: string;
}

export async function loadInstalledPlugins(): Promise<IPluginMetadata[]> {
  try {
    const response = await fetch("/package.json");
    if (!response.ok) {
      return [];
    }
    const packageJson = await response.json();
    
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const plugins: IPluginMetadata[] = [];

    for (const [name, version] of Object.entries(dependencies)) {
      if (name.startsWith("@sst/") || name.includes("sst-") || name.includes("sst.")) {
        plugins.push({
          name,
          version: version as string,
        });
      }
    }

    return plugins;
  } catch (error) {
    return [];
  }
}

export function validatePlugin(plugin: IPluginMetadata): boolean {
  return !!(plugin.name && plugin.version);
}

