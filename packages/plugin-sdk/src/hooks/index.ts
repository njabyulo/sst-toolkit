export interface IPluginHooks {
  onStateLoad?: (state: unknown) => void | Promise<void>;
  onNodeRender?: (node: unknown) => unknown;
  onWorkflowBuild?: (workflow: unknown) => unknown;
  onResourceSelect?: (resource: unknown) => void;
}




