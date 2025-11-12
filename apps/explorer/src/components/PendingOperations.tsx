import { useMemo, useState, useCallback } from "react";
import { Clock, Search, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import type { IPendingOperation, ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";
import { ResourceIcon } from "./ResourceList";

interface IPendingOperationsProps {
  operations: IPendingOperation[];
  onSelectResource?: (resource: ISSTResource) => void;
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

export function PendingOperations({
  operations,
  onSelectResource,
  selectedUrn,
}: IPendingOperationsProps) {
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

  const handleResourceClick = useCallback(
    (resource: ISSTResource) => {
      onSelectResource?.(resource);
    },
    [onSelectResource]
  );

  if (operations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Pending Operations
          </CardTitle>
          <CardDescription>Operations that are pending execution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="size-12 mx-auto mb-4 opacity-50" />
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
      <CardContent className="flex-1 overflow-auto flex flex-col space-y-4">
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[150px]">Operation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.map((operation) => {
                  const resource = operation.resource;
                  const name = State.getResourceName(resource);
                  const typeDisplay = State.getResourceTypeDisplay(resource.type);
                  const category = State.getResourceTypeCategory(resource.type, resource);
                  const subCategory = category.includes(" > ")
                    ? category.split(" > ")[1]
                    : category;
                  const isSelected = resource.urn === selectedUrn;

                  return (
                    <TableRow
                      key={resource.urn}
                      className={
                        isSelected
                          ? "bg-primary/10 cursor-pointer"
                          : onSelectResource
                            ? "cursor-pointer hover:bg-muted/50"
                            : ""
                      }
                      onClick={() => handleResourceClick(resource)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ResourceIcon type={resource.type} resource={resource} />
                          <div className="flex flex-col">
                            <span className="font-medium">{name}</span>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                              {resource.urn.split("::").pop()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{typeDisplay}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subCategory}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getOperationTypeColor(operation.type)}
                        >
                          {getOperationTypeLabel(operation.type)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {operationsByType.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Grouped by Operation Type</h3>
            <Accordion type="multiple" className="space-y-2">
              {operationsByType.map(({ type, operations: ops }) => (
                <AccordionItem key={type} value={type} className="border rounded-lg px-4">
                  <AccordionTrigger className="py-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={getOperationTypeColor(type)}
                      >
                        {getOperationTypeLabel(type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {ops.length} operation{ops.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pt-2">
                      {ops.map((operation) => {
                        const resource = operation.resource;
                        const name = State.getResourceName(resource);
                        const typeDisplay = State.getResourceTypeDisplay(resource.type);
                        const isSelected = resource.urn === selectedUrn;

                        return (
                          <div
                            key={resource.urn}
                            className={`flex items-center justify-between p-2 rounded-md ${
                              isSelected
                                ? "bg-primary/10"
                                : onSelectResource
                                  ? "hover:bg-muted/50 cursor-pointer"
                                  : ""
                            }`}
                            onClick={() => handleResourceClick(resource)}
                          >
                            <div className="flex items-center gap-2">
                              <ResourceIcon type={resource.type} resource={resource} />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {typeDisplay}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

