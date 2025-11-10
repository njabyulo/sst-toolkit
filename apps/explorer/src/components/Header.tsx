import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/shared/utils/state";

interface IHeaderProps {
  onResourceSelect?: (resource: ISSTResource) => void;
  allResources?: ISSTResource[];
}

export function Header({ onResourceSelect, allResources = [] }: IHeaderProps) {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredResources = allResources.filter((resource) => {
    if (!searchQuery) return false;
    const name = State.getResourceName(resource);
    const lowerQuery = searchQuery.toLowerCase();
    return (
      name.toLowerCase().includes(lowerQuery) ||
      resource.type.toLowerCase().includes(lowerQuery) ||
      resource.urn.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          {/* Global Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources (⌘K)..."
              className="pl-9"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                setSearchQuery(value);
                if (value) {
                  setIsCommandOpen(true);
                }
              }}
              onFocus={() => {
                if (searchQuery) {
                  setIsCommandOpen(true);
                }
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                  e.preventDefault();
                  setIsCommandOpen(true);
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Search resources..." value={searchQuery} onValueChange={handleSearch} />
        <CommandList>
          <CommandEmpty>No resources found.</CommandEmpty>
          <CommandGroup heading="Resources">
            {filteredResources.slice(0, 10).map((resource) => {
              const name = State.getResourceName(resource);
              return (
                <CommandItem
                  key={resource.urn}
                  value={`${name} ${resource.type}`}
                  onSelect={() => {
                    onResourceSelect?.(resource);
                    setIsCommandOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">{resource.type}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

