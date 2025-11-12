import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ResourceList } from "~/components/ResourceList";
import { ResourceDetail } from "~/components/ResourceDetail";
import { ResourceStats } from "~/components/ResourceStats";
import { CostDashboard } from "~/components/CostDashboard";
import { WorkflowCanvas } from "~/components/workflow/WorkflowCanvas";
import { PendingOperationsList } from "~/components/PendingOperationsList";
import { StateFileSelector } from "~/components/StateFileSelector";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { GlobalSearch } from "~/components/GlobalSearch";
import {
  PluginMarketplace,
  InstalledPlugins,
  PluginDependencies,
  PluginManager,
  PluginDetail,
} from "~/components/plugin";
import { loadInstalledPlugins, type IPluginMetadata } from "~/lib/plugin-loader";
import * as State from "@sst-toolkit/core/state";
import * as Relationships from "@sst-toolkit/core/relationships";
import * as Workflow from "@sst-toolkit/core/workflow";
import type { ISSTState, ISSTResource } from "@sst-toolkit/shared/types/sst";
import { Spinner } from "~/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

function App() {
  const [state, setState] = useState<ISSTState | null>(null);
  const [selectedResource, setSelectedResource] = useState<ISSTResource | null>(null);
  const [nodes, setNodes] = useState<ReturnType<typeof State.parseState>>([]);
  const [plugins, setPlugins] = useState<IPluginMetadata[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<IPluginMetadata | null>(null);
  const [stateFile, setStateFile] = useState<string>("state.json");
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadState() {
      setIsLoading(true);
      setLoadingError(null);
      try {
        const response = await fetch(`/misc/${stateFile}`);
        if (!response.ok) {
          throw new Error(`Failed to load state file: ${response.statusText}`);
        }
        const parsedState = (await response.json()) as ISSTState;
        setState(parsedState);
        const parsedNodes = State.parseState(parsedState);
        setNodes(parsedNodes);
        setLoadingError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load state file";
        setLoadingError(errorMessage);
        console.error("Failed to parse state:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadState();
  }, [stateFile]);

  useEffect(() => {
    async function loadPlugins() {
      try {
        const installedPlugins = await loadInstalledPlugins();
        setPlugins(installedPlugins);
      } catch (error) {
        console.error("Failed to load plugins:", error);
      }
    }
    loadPlugins();
  }, []);

  // Memoize callback to prevent unnecessary re-renders - must be before conditional return
  const handleResourceSelect = useCallback((resource: ISSTResource) => {
    setSelectedResource(resource);
  }, []);

  // Memoize allResources - must be before conditional return
  const allResources = useMemo(() => {
    return state?.latest?.resources ?? [];
  }, [state?.latest?.resources]);

  // Memoize pendingOperations - must be before conditional return
  const pendingOperations = useMemo(() => {
    return state?.latest.pending_operations ?? [];
  }, [state?.latest.pending_operations]);

  // Extract resources from pending operations for stats
  const pendingOperationsResources = useMemo(() => {
    return pendingOperations.map((op) => op.resource);
  }, [pendingOperations]);

  // Build workflow from resources
  const workflow = useMemo(() => {
    if (allResources.length === 0) {
      return { nodes: [], edges: [] };
    }
    const relationships = Relationships.parseResourceRelationships(allResources);
    return Workflow.buildWorkflow(allResources, relationships);
  }, [allResources]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Spinner className="size-8 mx-auto" />
          <p className="text-muted-foreground">Loading state...</p>
        </div>
      </div>
    );
  }

  if (loadingError || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Failed to Load State</CardTitle>
            </div>
            <CardDescription>
              Unable to load the state file. Please check that the file exists and is valid.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingError && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-mono text-muted-foreground">{loadingError}</p>
              </div>
            )}
            <div className="flex gap-2">
              <StateFileSelector
                currentFile={stateFile}
                onFileChange={setStateFile}
              />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Make sure you have exported your SST state:</p>
              <code className="block p-2 bg-muted rounded text-xs">
                npx sst state export --stage dev &gt; apps/explorer/public/misc/state.json
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h1 className="text-3xl font-bold">SST State Visualizer</h1>
                  <p className="text-muted-foreground">
                    Stack: <span className="font-mono">{state.stack}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Version: {state.latest.manifest.version} • Last updated:{" "}
                    {new Date(state.latest.manifest.time).toLocaleString()}
                  </p>
                </div>
                <div className="w-64">
                  <StateFileSelector
                    currentFile={stateFile}
                    onFileChange={setStateFile}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <GlobalSearch
                  resources={allResources}
                  pendingOperationsResources={pendingOperationsResources}
                  onSelectResource={handleResourceSelect}
                />
              </div>
            </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="explorer">Explorer</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              {pendingOperations.length > 0 && (
                <TabsTrigger value="pending">Pending Operations</TabsTrigger>
              )}
              <TabsTrigger value="plugins">Plugins</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ResourceStats
                resources={allResources}
                pendingOperationsResources={pendingOperationsResources}
              />
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

            {pendingOperations.length > 0 && (
              <TabsContent value="pending" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-200px)]">
                  <div className="overflow-hidden">
                    <PendingOperationsList
                      operations={pendingOperations}
                      onSelectResource={handleResourceSelect}
                      selectedUrn={selectedResource?.urn}
                    />
                  </div>
                  <div className="sticky top-0 h-full overflow-hidden">
                    <ResourceDetail resource={selectedResource} />
                  </div>
                </div>
              </TabsContent>
            )}

            <TabsContent value="plugins" className="space-y-6">
              <Tabs defaultValue="marketplace" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                  <TabsTrigger value="installed">Installed</TabsTrigger>
                  <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                  <TabsTrigger value="manager">Manager</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-6">
                  {selectedPlugin ? (
                    <PluginDetail
                      plugin={selectedPlugin}
                      onClose={() => setSelectedPlugin(null)}
                    />
                  ) : (
                    <PluginMarketplace
                      plugins={[]}
                      onView={(plugin) => setSelectedPlugin(plugin)}
                    />
                  )}
                </TabsContent>

                <TabsContent value="installed" className="space-y-6">
                  <InstalledPlugins plugins={plugins} />
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-6">
                  <PluginDependencies plugins={plugins} />
                </TabsContent>

                <TabsContent value="manager" className="space-y-6">
                  <PluginManager plugins={plugins} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
    </ErrorBoundary>
  );
}

export default App;
