import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ResourceList } from "~/components/ResourceList";
import { ResourceDetail } from "~/components/ResourceDetail";
import { ResourceStats } from "~/components/ResourceStats";
import { CostDashboard } from "~/components/CostDashboard";
import { WorkflowCanvas } from "~/components/workflow/WorkflowCanvas";
import * as State from "@sst-toolkit/shared/utils/state";
import * as Relationships from "@sst-toolkit/shared/utils/relationships";
import * as Workflow from "@sst-toolkit/shared/utils/workflow";
import type { ISSTState, ISSTResource } from "@sst-toolkit/shared/types/sst";
import { Spinner } from "~/components/ui/spinner";

function App() {
  const [state, setState] = useState<ISSTState | null>(null);
  const [selectedResource, setSelectedResource] = useState<ISSTResource | null>(null);
  const [nodes, setNodes] = useState<ReturnType<typeof State.parseState>>([]);

  useEffect(() => {
    async function loadState() {
      try {
        const response = await fetch("/misc/state.json");
        if (!response.ok) {
          throw new Error(`Failed to load state: ${response.statusText}`);
        }
        const parsedState = (await response.json()) as ISSTState;
        setState(parsedState);
        const parsedNodes = State.parseState(parsedState);
        setNodes(parsedNodes);
      } catch (error) {
        console.error("Failed to parse state:", error);
      }
    }
    loadState();
  }, []);

  // Memoize callback to prevent unnecessary re-renders - must be before conditional return
  const handleResourceSelect = useCallback((resource: ISSTResource) => {
    setSelectedResource(resource);
  }, []);

  // Memoize allResources - must be before conditional return
  const allResources = useMemo(() => {
    return state?.latest.resources ?? [];
  }, [state?.latest.resources]);

  // Build workflow from resources
  const workflow = useMemo(() => {
    if (allResources.length === 0) {
      return { nodes: [], edges: [] };
    }
    const relationships = Relationships.parseResourceRelationships(allResources);
    return Workflow.buildWorkflow(allResources, relationships);
  }, [allResources]);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Spinner className="size-8 mx-auto" />
          <p className="text-muted-foreground">Loading state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">SST State Visualizer</h1>
            <p className="text-muted-foreground">
              Stack: <span className="font-mono">{state.stack}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Version: {state.latest.manifest.version} • Last updated:{" "}
              {new Date(state.latest.manifest.time).toLocaleString()}
            </p>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ResourceStats resources={allResources} />
            </TabsContent>

            <TabsContent value="explorer" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-200px)]">
                <div className="overflow-hidden">
                  <ResourceList
                    nodes={nodes}
                    onSelectResource={handleResourceSelect}
                    selectedUrn={selectedResource?.urn}
                  />
                </div>
                <div className="sticky top-0 h-full overflow-hidden">
                  <ResourceDetail resource={selectedResource} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-6">
              <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
                <WorkflowCanvas
                  nodes={workflow.nodes}
                  edges={workflow.edges}
                  onNodeSelect={(nodeId) => {
                    const resource = allResources.find((r) => r.urn === nodeId);
                    if (resource) {
                      handleResourceSelect(resource);
                    }
                  }}
                  selectedNodeId={selectedResource?.urn}
                />
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <CostDashboard resources={allResources} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default App;
