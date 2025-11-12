import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, X, Command } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Badge } from "~/components/ui/badge";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";
import { ResourceIcon } from "./ResourceList";

interface IGlobalSearchProps {
  resources: ISSTResource[];
  pendingOperationsResources?: ISSTResource[];
  onSelectResource: (resource: ISSTResource) => void;
}

interface ISearchResult {
  resource: ISSTResource;
  matchType: "urn" | "type" | "category" | "name";
  score: number;
}

export function GlobalSearch({
  resources,
  pendingOperationsResources = [],
  onSelectResource,
}: IGlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const allResources = useMemo(() => {
    return [...resources, ...pendingOperationsResources];
  }, [resources, pendingOperationsResources]);

  // Create Set of pending operation URNs for O(1) lookup
  const pendingUrnsSet = useMemo(() => {
    return new Set(pendingOperationsResources.map((r) => r.urn));
  }, [pendingOperationsResources]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    const results: ISearchResult[] = [];

    for (const resource of allResources) {
      const urn = resource.urn.toLowerCase();
      const type = resource.type.toLowerCase();
      const category = State.getResourceTypeCategory(resource.type, resource).toLowerCase();
      const name = State.getResourceName(resource).toLowerCase();

      let matchType: ISearchResult["matchType"] | null = null;
      let score = 0;

      if (urn.includes(query)) {
        matchType = "urn";
        score = urn.startsWith(query) ? 100 : 50;
      } else if (name.includes(query)) {
        matchType = "name";
        score = name.startsWith(query) ? 90 : 40;
      } else if (type.includes(query)) {
        matchType = "type";
        score = type.startsWith(query) ? 80 : 30;
      } else if (category.includes(query)) {
        matchType = "category";
        score = category.startsWith(query) ? 70 : 20;
      }

      if (matchType) {
        results.push({
          resource,
          matchType,
          score,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 50);
  }, [allResources, searchQuery]);

  const handleSelect = useCallback(
    (resource: ISSTResource) => {
      onSelectResource(resource);
      setOpen(false);
      setSearchQuery("");
    },
    [onSelectResource]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isPending = useCallback(
    (resource: ISSTResource) => {
      return pendingUrnsSet.has(resource.urn);
    },
    [pendingUrnsSet]
  );

  return (
    <>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search resources... (⌘K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search resources by name, type, URN, or category..." />
        <CommandList>
          <CommandEmpty>No resources found.</CommandEmpty>
          <CommandGroup heading={`${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}>
            {searchResults.map((result) => {
              const resource = result.resource;
              const provider = State.getResourceProvider(resource.type);
              const category = State.getResourceTypeCategory(resource.type, resource);
              const name = State.getResourceName(resource);

              return (
                <CommandItem
                  key={resource.urn}
                  onSelect={() => handleSelect(resource)}
                  className="flex items-center gap-3 py-3"
                >
                  <ResourceIcon type={resource.type} resource={resource} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{name}</span>
                      {isPending(resource) && (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                          Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {category}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {resource.type}
                    </div>
                  </div>
                  <Badge variant={provider === "SST" ? "default" : provider === "AWS" ? "secondary" : "outline"}>
                    {provider}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

