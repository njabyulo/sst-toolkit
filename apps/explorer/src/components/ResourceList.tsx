import { useState, useMemo, useCallback, memo } from "react";
import { ChevronRight, ChevronDown, Package, Server, Database, Link as LinkIcon, Zap, Search, Bell, Activity, Globe, Shield, Key, Network, Cloud } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import type { IResourceNode } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";

interface IResourceListProps {
  nodes: IResourceNode[];
  onSelectResource: (resource: IResourceNode["resource"]) => void;
  selectedUrn?: string;
}

// Cache for category extraction to avoid repeated string operations
const categoryCache = new Map<string, string>();

function extractSubCategory(category: string): string {
  if (categoryCache.has(category)) {
    return categoryCache.get(category)!;
  }
  const subCategory = category.includes(" > ") 
    ? category.split(" > ")[1] 
    : category;
  categoryCache.set(category, subCategory);
  return subCategory;
}

export const ResourceIcon = memo(function ResourceIcon({ type, resource }: { type: string; resource?: IResourceNode["resource"] }) {
  const category = State.getResourceTypeCategory(type, resource);
  const iconClass = "size-4";
  
  // Extract sub-category from hierarchical format "SST > Function" -> "Function"
  const subCategory = extractSubCategory(category);
  
  switch (subCategory) {
    case "Function":
      return <Zap className={iconClass} />;
    case "API":
      return <Server className={iconClass} />;
    case "Database":
    case "Storage":
      return <Database className={iconClass} />;
    case "Queue":
    case "Event Bus":
    case "Stream":
      return <Activity className={iconClass} />;
    case "Notification":
      return <Bell className={iconClass} />;
    case "Monitoring":
      return <Activity className={iconClass} />;
    case "Network":
      return <Network className={iconClass} />;
    case "IAM":
    case "Certificate":
    case "Secret":
    case "Parameter":
      return <Shield className={iconClass} />;
    case "Auth":
      return <Key className={iconClass} />;
    case "CDN":
    case "DNS":
      return <Globe className={iconClass} />;
    case "Container":
    case "Cache":
      return <Cloud className={iconClass} />;
    case "Link":
      return <LinkIcon className={iconClass} />;
    case "Pulumi":
      return <Package className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
});

const ResourceItem = memo(function ResourceItem({
  node,
  level = 0,
  onSelectResource,
  selectedUrn,
}: {
  node: IResourceNode;
  level?: number;
  onSelectResource: (resource: IResourceNode["resource"]) => void;
  selectedUrn?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const isSelected = node.resource.urn === selectedUrn;
  
  // Memoize expensive calculations
  const resourceName = useMemo(() => State.getResourceName(node.resource), [node.resource]);
  const typeDisplay = useMemo(() => State.getResourceTypeDisplay(node.resource.type), [node.resource.type]);
  const category = useMemo(() => State.getResourceTypeCategory(node.resource.type, node.resource), [node.resource]);
  const subCategory = useMemo(() => extractSubCategory(category), [category]);
  
  const handleClick = useCallback(() => {
    onSelectResource(node.resource);
  }, [onSelectResource, node.resource]);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent hover:text-accent-foreground"
        } [content-visibility:auto] [contain-intrinsic-size:0_56px]`}
        style={{ paddingLeft: `${12 + level * 20}px` }}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-background/20 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="size-5" />}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ResourceIcon type={node.resource.type} resource={node.resource} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{typeDisplay}</p>
              <p className="text-xs opacity-80">{category}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{resourceName}</div>
          <div className="text-xs opacity-70 truncate">{typeDisplay}</div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs px-2 py-0.5 rounded bg-background/20">
                {subCategory}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Resource Category</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <ResourceItem
              key={child.resource.urn}
              node={child}
              level={level + 1}
              onSelectResource={onSelectResource}
              selectedUrn={selectedUrn}
            />
          ))}
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo
  return (
    prevProps.node.resource.urn === nextProps.node.resource.urn &&
    prevProps.selectedUrn === nextProps.selectedUrn &&
    prevProps.level === nextProps.level &&
    prevProps.node.children.length === nextProps.node.children.length
  );
});

function flattenNodes(nodes: IResourceNode[]): IResourceNode[] {
  const result: IResourceNode[] = [];
  function traverse(node: IResourceNode) {
    result.push(node);
    node.children.forEach(traverse);
  }
  nodes.forEach(traverse);
  return result;
}

export function ResourceList({
  nodes,
  onSelectResource,
  selectedUrn,
}: IResourceListProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  
  // Memoize callback to prevent unnecessary re-renders
  const handleSelectResource = useCallback((resource: IResourceNode["resource"]) => {
    onSelectResource(resource);
  }, [onSelectResource]);
  
  const handleCommandSelect = useCallback((resource: IResourceNode["resource"]) => {
    onSelectResource(resource);
    setIsCommandOpen(false);
  }, [onSelectResource]);

  const allResources = useMemo(() => {
    const flattened = flattenNodes(nodes);
    // Deduplicate by URN
    const seen = new Set<string>();
    return flattened.filter((node) => {
      if (seen.has(node.resource.urn)) {
        return false;
      }
      seen.add(node.resource.urn);
      return true;
    });
  }, [nodes]);

  const resourcesByCategory = useMemo(() => {
    // Group by category (Function, API, Storage, etc.), then by resource type within each category
    // Include root nodes and their direct children, but not deeper nested children
    const byCategory = new Map<string, Map<string, IResourceNode[]>>();
    // Build a set of all resource URNs to check parent relationships
    const allUrns = new Set(allResources.map((node) => node.resource.urn));
    // Build a map of URN to node for O(1) lookups (optimize from O(n²) to O(n))
    const urnToNode = new Map<string, IResourceNode>();
    allResources.forEach((node) => {
      urnToNode.set(node.resource.urn, node);
    });
    
    // Process all resources, but only include those that are either:
    // 1. Root nodes (no parent), OR
    // 2. Direct children of root nodes (parent exists but parent's parent doesn't exist in our list)
    allResources.forEach((node) => {
      const hasParent = node.resource.parent !== undefined && node.resource.parent !== null;
      
      if (hasParent && node.resource.parent) {
        // Check if this resource's parent is also in our resource list
        const parentExists = allUrns.has(node.resource.parent);
        if (parentExists) {
          // Check if the parent itself has a parent (meaning this is a nested child)
          // Use Map lookup instead of find() for O(1) instead of O(n)
          const parentNode = urnToNode.get(node.resource.parent);
          if (parentNode && parentNode.resource.parent !== undefined && parentNode.resource.parent !== null) {
            // This is a nested child (child of a child), skip it - it will appear under its parent
            return;
          }
        }
      }
      
      const category = State.getResourceTypeCategory(node.resource.type, node.resource);
      
      // Extract sub-category (everything after " > ") - use cached extraction
      const subCategory = extractSubCategory(category);
      
      // Get the resource type display name (e.g., ApiGatewayWebSocket, ApiGatewayWebSocketRoute, etc.)
      const resourceType = State.getResourceTypeDisplay(node.resource.type);
      
      if (!byCategory.has(subCategory)) {
        byCategory.set(subCategory, new Map());
      }
      
      const categoryMap = byCategory.get(subCategory)!;
      if (!categoryMap.has(resourceType)) {
        categoryMap.set(resourceType, []);
      }
      
      categoryMap.get(resourceType)?.push(node);
    });
    
    // Convert to structure: [category, [type, nodes[]][]][]
    return Array.from(byCategory.entries())
      .map(([category, types]) => [
        category,
        Array.from(types.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      ] as [string, [string, IResourceNode[]][]])
      .sort((a, b) => a[0].localeCompare(b[0])); // Sort categories alphabetically
  }, [allResources]);

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                {nodes.length} top-level resource{nodes.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCommandOpen(true)}
                    className="h-8 w-8"
                  >
                    <Search className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search resources (⌘K)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0">
          {resourcesByCategory.length > 0 ? (
            <Accordion type="multiple" className="space-y-2">
              {resourcesByCategory.map(([category, types]) => (
                <AccordionItem key={category} value={category} className="border-none">
                  <AccordionTrigger className="py-2 text-sm font-semibold">
                    {category} ({types.reduce((sum, [, nodes]) => sum + nodes.length, 0)})
                  </AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple" className="space-y-1 ml-4">
                      {types.map(([resourceType, nodes]) => (
                        <AccordionItem key={`${category}-${resourceType}`} value={`${category}-${resourceType}`} className="border-none">
                          <AccordionTrigger className="py-1.5 text-xs font-medium">
                            {resourceType} ({nodes.length})
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-1">
                              {nodes.map((node) => (
                                <ResourceItem
                                  key={node.resource.urn}
                                  node={node}
                                  onSelectResource={handleSelectResource}
                                  selectedUrn={selectedUrn}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No resources found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CommandDialog
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        title="Search Resources"
        description="Search and navigate to resources"
      >
        <CommandInput placeholder="Search resources..." />
        <CommandList>
          <CommandEmpty>No resources found.</CommandEmpty>
          <CommandGroup heading="Resources">
            {allResources.map((node) => {
              const name = State.getResourceName(node.resource);
              const type = State.getResourceTypeDisplay(node.resource.type);
              const category = State.getResourceTypeCategory(node.resource.type, node.resource);
              return (
                <CommandItem
                  key={node.resource.urn}
                  value={`${name} ${type} ${category}`}
                  onSelect={() => handleCommandSelect(node.resource)}
                  className="flex items-center gap-2"
                >
                  <ResourceIcon type={node.resource.type} resource={node.resource} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{type}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted">{category}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
