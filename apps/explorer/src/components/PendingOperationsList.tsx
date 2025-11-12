import { useState, useMemo, useCallback, memo } from "react";
import { Clock, Search, ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import type { IPendingOperation, ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";
import { ResourceIcon } from "./ResourceList";

interface IPendingOperationsListProps {
  operations: IPendingOperation[];
  onSelectResource: (resource: ISSTResource) => void;
  selectedUrn?: string;
}

function getOperationTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "creating":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "updating":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "deleting":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "replacing":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

function getOperationTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const PendingOperationItem = memo(function PendingOperationItem({
  operation,
  onSelectResource,
  selectedUrn,
}: {
  operation: IPendingOperation;
  onSelectResource: (resource: ISSTResource) => void;
  selectedUrn?: string;
}) {
  const resource = operation.resource;
  const name = State.getResourceName(resource);
  const typeDisplay = State.getResourceTypeDisplay(resource.type);
  const category = State.getResourceTypeCategory(resource.type, resource);
  const subCategory = category.includes(" > ") ? category.split(" > ")[1] : category;
  const isSelected = resource.urn === selectedUrn;

  const handleClick = useCallback(() => {
    onSelectResource(resource);
  }, [onSelectResource, resource]);

  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50 cursor-pointer border border-transparent"
      }`}
      onClick={handleClick}
    >
      <ResourceIcon type={resource.type} resource={resource} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          <Badge
            variant="outline"
            className={`text-xs border ${getOperationTypeColor(operation.type)}`}
          >
            {getOperationTypeLabel(operation.type)}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate">{typeDisplay}</div>
        <div className="text-xs text-muted-foreground truncate">{subCategory}</div>
      </div>
    </div>
  );
});

export function PendingOperationsList({
  operations,
  onSelectResource,
  selectedUrn,
}: IPendingOperationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOperations = useMemo(() => {
    if (!searchQuery) return operations;

    const lowerQuery = searchQuery.toLowerCase();
    return operations.filter((op) => {
      const name = State.getResourceName(op.resource);
      const type = State.getResourceTypeDisplay(op.resource.type);
      const category = State.getResourceTypeCategory(op.resource.type, op.resource);
      return (
        name.toLowerCase().includes(lowerQuery) ||
        type.toLowerCase().includes(lowerQuery) ||
        category.toLowerCase().includes(lowerQuery) ||
        op.resource.urn.toLowerCase().includes(lowerQuery) ||
        op.type.toLowerCase().includes(lowerQuery)
      );
    });
  }, [operations, searchQuery]);

  const operationsByType = useMemo(() => {
    const grouped = new Map<string, IPendingOperation[]>();
    filteredOperations.forEach((op) => {
      const type = op.type;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)?.push(op);
    });
    return Array.from(grouped.entries())
      .map(([type, ops]) => ({ type, operations: ops }))
      .sort((a, b) => b.operations.length - a.operations.length);
  }, [filteredOperations]);

  const operationsByCategory = useMemo(() => {
    const grouped = new Map<string, IPendingOperation[]>();
    filteredOperations.forEach((op) => {
      const category = State.getResourceTypeCategory(op.resource.type, op.resource);
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)?.push(op);
    });
    return Array.from(grouped.entries())
      .map(([category, ops]) => ({ category, operations: ops }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredOperations]);

  if (operations.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Pending Operations
          </CardTitle>
          <CardDescription>Operations that are pending execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="size-12 mx-auto mb-4 opacity-50" />
            <p>No pending operations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Pending Operations
            </CardTitle>
            <CardDescription>
              {filteredOperations.length} of {operations.length} pending operation
              {operations.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search operations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredOperations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No operations match your search</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-2" defaultValue={["by-type"]}>
            <AccordionItem value="by-type" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold">
                By Operation Type ({operationsByType.length})
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="space-y-1 ml-4">
                  {operationsByType.map(({ type, operations: ops }) => (
                    <AccordionItem
                      key={type}
                      value={type}
                      className="border-none"
                    >
                      <AccordionTrigger className="py-1.5 text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs border ${getOperationTypeColor(type)}`}
                          >
                            {getOperationTypeLabel(type)}
                          </Badge>
                          <span className="text-muted-foreground">
                            ({ops.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1">
                          {ops.map((operation) => (
                            <PendingOperationItem
                              key={operation.resource.urn}
                              operation={operation}
                              onSelectResource={onSelectResource}
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

            <AccordionItem value="by-category" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-semibold">
                By Resource Category ({operationsByCategory.length})
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="space-y-1 ml-4">
                  {operationsByCategory.map(({ category, operations: ops }) => (
                    <AccordionItem
                      key={category}
                      value={category}
                      className="border-none"
                    >
                      <AccordionTrigger className="py-1.5 text-xs font-medium">
                        {category} ({ops.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1">
                          {ops.map((operation) => (
                            <PendingOperationItem
                              key={operation.resource.urn}
                              operation={operation}
                              onSelectResource={onSelectResource}
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
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

