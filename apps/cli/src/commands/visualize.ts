import * as Relationships from "@sst-toolkit/core/relationships";
import * as Workflow from "@sst-toolkit/core/workflow";
import type { ISSTState } from "@sst-toolkit/shared/types/sst";
import * as fs from "fs/promises";
import * as path from "path";

export interface IVisualizeOptions {
  stateFile: string;
  output?: string;
  format?: "json" | "image";
}

export async function visualize(options: IVisualizeOptions): Promise<void> {
  const { stateFile, output, format = "json" } = options;
  
  try {
    const state = (await import(stateFile)) as { default: ISSTState };
    const resources = state.default.latest.resources;
    
    const relationships = Relationships.parseResourceRelationships(resources);
    const workflow = Workflow.buildWorkflow(resources, relationships);
    
    if (format === "json") {
      const outputPath = output || path.join(process.cwd(), "visualization.json");
      await fs.writeFile(outputPath, JSON.stringify(workflow, null, 2), "utf-8");
      process.stdout.write(`✅ Visualization saved to ${outputPath}\n`);
    } else {
      process.stdout.write("Image format not yet implemented\n");
      process.stdout.write(`Found ${resources.length} resources\n`);
      process.stdout.write(`Found ${relationships.length} relationships\n`);
    }
  } catch (error) {
    throw new Error(`Failed to visualize: ${error instanceof Error ? error.message : String(error)}`);
  }
}

