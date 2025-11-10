export interface IPluginInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  downloads?: number;
  rating?: number;
}

export async function searchPlugins(_query: string): Promise<IPluginInfo[]> {
  // Query parameter intentionally unused - search logic to be implemented
  void _query;
  return [];
}

export async function getPluginInfo(_name: string): Promise<IPluginInfo | null> {
  // Name parameter intentionally unused - plugin info logic to be implemented
  void _name;
  return null;
}

export async function browsePlugins(_category?: string): Promise<IPluginInfo[]> {
  // Category parameter intentionally unused - browse logic to be implemented
  void _category;
  return [];
}

