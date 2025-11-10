import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { MoreHorizontal, ArrowUpDown, Search, Download, Filter, ChevronDown, ChevronRight, X, ChevronLeft, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/shared/utils/state";
import { ResourceIcon } from "./ResourceList";

interface IResourceTableProps {
  resources: ISSTResource[];
  onSelectResource: (resource: ISSTResource) => void;
  selectedUrn?: string;
}

type SortField = "name" | "type" | "category" | "provider";
type SortDirection = "asc" | "desc";
type GroupByField = "none" | "category" | "provider" | "type" | "status";

interface IGroupedData {
  key: string;
  label: string;
  count: number;
  resources: ISSTResource[];
  isExpanded: boolean;
}

export function ResourceTable({ resources, onSelectResource, selectedUrn }: IResourceTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [groupBy, setGroupBy] = useState<GroupByField>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const groupByRef = useRef<GroupByField>("none");
  
  // Column filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSort = useCallback((field: SortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDir) => prevDir === "asc" ? "desc" : "asc");
        return prevField;
      } else {
        setSortDirection("asc");
        return field;
      }
    });
  }, []);

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return newExpanded;
    });
  }, []);

  const expandAllGroups = useCallback(() => {
    setExpandedGroups((prev) => {
      if (groupedData && groupedData.length > 0) {
        const allKeys = new Set(groupedData.map((g) => g.key));
        return allKeys;
      }
      return prev;
    });
  }, [groupedData]);

  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    resources.forEach((r) => types.add(State.getResourceTypeDisplay(r.type)));
    return Array.from(types).sort();
  }, [resources]);

  const uniqueProviders = useMemo(() => {
    const providers = new Set<string>();
    resources.forEach((r) => providers.add(State.getResourceProvider(r.type)));
    return Array.from(providers).sort();
  }, [resources]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    resources.forEach((r) => {
      const category = State.getResourceTypeCategory(r.type, r);
      categories.add(category.includes(" > ") ? category.split(" > ")[1] : category);
    });
    return Array.from(categories).sort();
  }, [resources]);

  const filteredAndSorted = useMemo(() => {
    let filtered = resources.filter((resource) => {
      // Global search
      if (searchQuery) {
        const name = State.getResourceName(resource);
        const type = State.getResourceTypeDisplay(resource.type);
        const category = State.getResourceTypeCategory(resource.type, resource);
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          name.toLowerCase().includes(lowerQuery) ||
          type.toLowerCase().includes(lowerQuery) ||
          category.toLowerCase().includes(lowerQuery) ||
          resource.urn.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // Column filters
      if (typeFilter !== "all") {
        if (State.getResourceTypeDisplay(resource.type) !== typeFilter) return false;
      }
      if (providerFilter !== "all") {
        if (State.getResourceProvider(resource.type) !== providerFilter) return false;
      }
      if (categoryFilter !== "all") {
        const category = State.getResourceTypeCategory(resource.type, resource);
        const displayCategory = category.includes(" > ") ? category.split(" > ")[1] : category;
        if (displayCategory !== categoryFilter) return false;
      }
      if (statusFilter !== "all") {
        const isCustom = resource.custom ? "custom" : "standard";
        if (isCustom !== statusFilter) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case "name":
          aValue = State.getResourceName(a);
          bValue = State.getResourceName(b);
          break;
        case "type":
          aValue = State.getResourceTypeDisplay(a.type);
          bValue = State.getResourceTypeDisplay(b.type);
          break;
        case "category":
          aValue = State.getResourceTypeCategory(a.type, a);
          bValue = State.getResourceTypeCategory(b.type, b);
          break;
        case "provider":
          aValue = State.getResourceProvider(a.type);
          bValue = State.getResourceProvider(b.type);
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [resources, searchQuery, sortField, sortDirection, typeFilter, providerFilter, categoryFilter, statusFilter]);

  // Group data if grouping is enabled
  const groupedData = useMemo(() => {
    if (groupBy === "none") {
      return null;
    }

    const groups = new Map<string, ISSTResource[]>();
    
    filteredAndSorted.forEach((resource) => {
      let groupKey: string;
      let groupLabel: string;

      switch (groupBy) {
        case "category":
          const category = State.getResourceTypeCategory(resource.type, resource);
          groupKey = category;
          // Extract sub-category (everything after " > ")
          groupLabel = category.includes(" > ") ? category.split(" > ")[1] : category;
          break;
        case "provider":
          groupKey = State.getResourceProvider(resource.type);
          groupLabel = groupKey;
          break;
        case "type":
          groupKey = State.getResourceTypeDisplay(resource.type);
          groupLabel = groupKey;
          break;
        case "status":
          groupKey = resource.custom ? "Custom" : "Standard";
          groupLabel = groupKey;
          break;
        default:
          return;
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)?.push(resource);
    });

    const grouped: IGroupedData[] = Array.from(groups.entries())
      .map(([key, resources]) => ({
        key,
        label: key,
        count: resources.length,
        resources,
        isExpanded: expandedGroups.has(key),
      }))
      .sort((a, b) => {
        // Sort groups by count (descending) then by label
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
      });

    return grouped;
  }, [filteredAndSorted, groupBy, expandedGroups]);

  // Pagination
  const displayData = useMemo(() => {
    if (groupedData) {
      // For grouped data, flatten expanded groups
      const flattened: (ISSTResource | IGroupedData)[] = [];
      groupedData.forEach((group) => {
        flattened.push(group);
        if (group.isExpanded) {
          flattened.push(...group.resources);
        }
      });
      return flattened;
    }
    return filteredAndSorted;
  }, [groupedData, filteredAndSorted]);

  const totalPages = useMemo(() => {
    if (groupedData) {
      // For grouped view, don't paginate
      return 1;
    }
    return Math.ceil(filteredAndSorted.length / pageSize);
  }, [filteredAndSorted.length, pageSize, groupedData]);

  const paginatedData = useMemo(() => {
    if (groupedData) {
      return displayData;
    }
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return displayData.slice(start, end);
  }, [displayData, currentPage, pageSize, groupedData]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Auto-expand all groups when grouping is first enabled
  useEffect(() => {
    if (groupBy !== "none" && groupedData && groupedData.length > 0) {
      // Only auto-expand if groupBy just changed (not if it was already set)
      if (groupByRef.current !== groupBy) {
        const allKeys = new Set(groupedData.map((g) => g.key));
        setExpandedGroups(allKeys);
        groupByRef.current = groupBy;
      }
    } else if (groupBy === "none") {
      if (expandedGroups.size > 0) {
        setExpandedGroups(new Set());
      }
      groupByRef.current = "none";
    }
  }, [groupBy, groupedData, expandedGroups.size]);

  const clearFilters = useCallback(() => {
    setTypeFilter("all");
    setProviderFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  }, []);

  const hasActiveFilters = typeFilter !== "all" || providerFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all" || searchQuery !== "";

  const getProviderBadgeVariant = (provider: string) => {
    switch (provider) {
      case "SST":
        return "default";
      case "AWS":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    if (category.includes("Function")) return "default";
    if (category.includes("Storage")) return "secondary";
    if (category.includes("Database")) return "outline";
    if (category.includes("API")) return "default";
    return "outline";
  };

  const ColumnFilter = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void;
    options: string[];
  }) => {
    const isActive = value !== "all";
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1"
          >
            <Filter className={`h-3 w-3 ${isActive ? "" : "opacity-50"}`} />
            {label}
            {isActive && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                1
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 bg-background" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filter by {label}</h4>
              {isActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onChange("all")}
                >
                  Clear
                </Button>
              )}
            </div>
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder={`All ${label}`} />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">All {label}</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderResourceRow = (resource: ISSTResource) => {
    const name = State.getResourceName(resource);
    const type = State.getResourceTypeDisplay(resource.type);
    const category = State.getResourceTypeCategory(resource.type, resource);
    const provider = State.getResourceProvider(resource.type);
    const isSelected = resource.urn === selectedUrn;

    return (
      <TableRow
        key={resource.urn}
        className={isSelected ? "bg-primary/10" : "cursor-pointer hover:bg-muted/50"}
        onClick={() => onSelectResource(resource)}
      >
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                <ResourceIcon type={resource.type} resource={resource} />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {resource.urn.split("::").pop()}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm">{type}</span>
        </TableCell>
        <TableCell>
          <Badge variant={getProviderBadgeVariant(provider)}>
            {provider}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={getCategoryBadgeVariant(category)}>
            {category.includes(" > ") ? category.split(" > ")[1] : category}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={resource.custom ? "default" : "outline"}>
            {resource.custom ? "Custom" : "Standard"}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSelectResource(resource)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(resource.urn);
                }}
              >
                Copy URN
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  const dataStr = JSON.stringify(resource, null, 2);
                  const dataBlob = new Blob([dataStr], { type: "application/json" });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${State.getResourceName(resource)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    );
  };

  const renderGroupRow = (group: IGroupedData) => {
    return (
      <TableRow key={`group-${group.key}`} className="bg-muted/30">
        <TableCell colSpan={6}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleGroup(group.key)}
            >
              {group.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            <span className="font-semibold">{group.label}</span>
            <Badge variant="outline" className="ml-2">
              {group.count} {group.count === 1 ? "resource" : "resources"}
            </Badge>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resources</CardTitle>
            <CardDescription>
              {filteredAndSorted.length} of {resources.length} resources
              {groupedData && ` • ${groupedData.length} groups`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByField)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="category">Group by Category</SelectItem>
                <SelectItem value="provider">Group by Provider</SelectItem>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
              </SelectContent>
            </Select>
            {groupedData && groupedData.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAllGroups}
                  className="h-9"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAllGroups}
                  className="h-9"
                >
                  Collapse All
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const dataStr = JSON.stringify(resources, null, 2);
                const dataBlob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "resources.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto flex flex-col">
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search name or resource ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ColumnFilter
              label="Type"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setCurrentPage(1);
              }}
              options={uniqueTypes}
            />
            <ColumnFilter
              label="Provider"
              value={providerFilter}
              onChange={(v) => {
                setProviderFilter(v);
                setCurrentPage(1);
              }}
              options={uniqueProviders}
            />
            <ColumnFilter
              label="Category"
              value={categoryFilter}
              onChange={(v) => {
                setCategoryFilter(v);
                setCurrentPage(1);
              }}
              options={uniqueCategories}
            />
            <ColumnFilter
              label="Status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
              options={["Custom", "Standard"]}
            />
          </div>
        </div>

        <div className="rounded-md border flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => handleSort("name")}
                  >
                    RESOURCE NAME
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => handleSort("type")}
                  >
                    TYPE
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => handleSort("provider")}
                  >
                    PROVIDER
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 -ml-3"
                    onClick={() => handleSort("category")}
                  >
                    CATEGORY
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">STATUS</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No resources found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => {
                  // Check if item is a group by checking if it has the IGroupedData structure
                  if (groupedData && typeof item === "object" && "key" in item && "count" in item && "resources" in item) {
                    // It's a group
                    return renderGroupRow(item as IGroupedData);
                  } else {
                    // It's a resource
                    return renderResourceRow(item as ISSTResource);
                  }
                })
              )}
            </TableBody>
          </Table>
        </div>

        {!groupedData && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

