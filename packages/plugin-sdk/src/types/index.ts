import type { ISSTState, ISSTResource } from "@sst-toolkit/shared/types/sst";
import type { IWorkflowNode, IWorkflow } from "@sst-toolkit/shared/types/workflow";
import type { ReactNode } from "react";

export interface IPlugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  
  hooks?: {
    onStateLoad?: (state: ISSTState) => void | Promise<void>;
    onNodeRender?: (node: IWorkflowNode) => ReactNode;
    onWorkflowBuild?: (workflow: IWorkflow) => IWorkflow;
    onResourceSelect?: (resource: ISSTResource) => void;
  };
  
  commands?: ICommand[];
  components?: IComponent[];
  analyzers?: IAnalyzer[];
  
  dependencies?: string[];
  peerDependencies?: string[];
}

export interface ICommand {
  name: string;
  description: string;
  handler: (...args: unknown[]) => Promise<void> | void;
}

export interface IComponent {
  name: string;
  type: "visual" | "analysis" | "custom";
  render: (props: Record<string, unknown>) => ReactNode;
}

export interface IAnalyzer {
  name: string;
  description: string;
  analyze: (resources: ISSTResource[]) => Promise<IAnalysisResult> | IAnalysisResult;
}

export interface IAnalysisResult {
  summary: string;
  details: Record<string, unknown>;
  recommendations?: string[];
}




