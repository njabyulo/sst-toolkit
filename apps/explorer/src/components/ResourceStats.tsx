import { useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";

interface IResourceStatsProps {
  resources: ISSTResource[];
  pendingOperationsResources?: ISSTResource[];
}

/**
 * Color palette optimized for data visualization
 * Colorblind-friendly with good contrast
 */
const COLOR_PALETTE = {
  // Primary colors for sub-categories (colorblind-friendly)
  subCategories: [
    { name: "Function", color: "hsl(220, 70%, 50%)" },      // Blue
    { name: "API", color: "hsl(280, 65%, 55%)" },            // Purple
    { name: "Storage", color: "hsl(200, 75%, 45%)" },        // Cyan
    { name: "Database", color: "hsl(160, 60%, 45%)" },        // Teal
    { name: "Queue", color: "hsl(30, 80%, 55%)" },            // Orange
    { name: "Event Bus", color: "hsl(340, 70%, 55%)" },       // Pink
    { name: "Notification", color: "hsl(15, 85%, 55%)" },      // Red-orange
    { name: "Stream", color: "hsl(180, 70%, 45%)" },          // Aqua
    { name: "Container", color: "hsl(260, 60%, 55%)" },        // Indigo
    { name: "CDN", color: "hsl(40, 80%, 55%)" },             // Yellow-orange
    { name: "DNS", color: "hsl(210, 70%, 50%)" },               // Sky blue
    { name: "Certificate", color: "hsl(100, 50%, 45%)" },     // Green
    { name: "IAM", color: "hsl(0, 70%, 50%)" },                // Red
    { name: "Secret", color: "hsl(320, 60%, 50%)" },           // Magenta
    { name: "Parameter", color: "hsl(140, 55%, 45%)" },        // Green-cyan
    { name: "Monitoring", color: "hsl(25, 75%, 50%)" },         // Orange-red
    { name: "Network", color: "hsl(240, 65%, 50%)" },           // Blue-purple
    { name: "Cache", color: "hsl(50, 80%, 55%)" },             // Yellow
    { name: "Auth", color: "hsl(300, 60%, 50%)" },            // Pink-purple
    { name: "Link", color: "hsl(190, 60%, 45%)" },             // Blue-cyan
    { name: "Pulumi", color: "hsl(270, 50%, 50%)" },          // Purple
    { name: "Other", color: "hsl(0, 0%, 60%)" },                // Gray
  ],
  // Provider-specific color modifiers
  providers: {
    SST: { base: 0, saturation: 1.0, lightness: 1.0 },      // Full saturation for SST
    AWS: { base: 0, saturation: 0.85, lightness: 0.95 },    // Slightly muted for AWS
    Other: { base: 0, saturation: 0.5, lightness: 0.8 },     // Muted for Others
  },
  // Provider colors for stacked/grouped charts
  providerColors: {
    SST: "hsl(220, 80%, 55%)",      // Bright blue
    AWS: "hsl(30, 75%, 50%)",        // Orange
    Other: "hsl(0, 0%, 60%)",        // Gray
  },
};

// Cache for category extraction to avoid repeated string operations
const categoryColorCache = new Map<string, string>();

/**
 * Get color for a category, considering provider and sub-category
 */
function getCategoryColor(category: string, provider: string): string {
  // Extract sub-category from hierarchical format "SST > Function" -> "Function"
  // Use cached extraction for better performance
  let subCategory: string;
  if (categoryColorCache.has(category)) {
    subCategory = categoryColorCache.get(category)!;
  } else {
    subCategory = category.includes(" > ") 
      ? category.split(" > ")[1] 
      : category;
    categoryColorCache.set(category, subCategory);
  }
  
  // Find matching sub-category color
  const subCategoryColor = COLOR_PALETTE.subCategories.find(
    (item) => item.name === subCategory
  );
  
  if (subCategoryColor) {
    // Apply provider-specific modifications
    const providerMod = COLOR_PALETTE.providers[provider as keyof typeof COLOR_PALETTE.providers] || COLOR_PALETTE.providers.Other;
    
    // Parse HSL color
    const hslMatch = subCategoryColor.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const [, h, s, l] = hslMatch;
      const hue = parseInt(h);
      const saturation = Math.min(100, parseInt(s) * providerMod.saturation);
      const lightness = Math.min(100, parseInt(l) * providerMod.lightness);
      
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    return subCategoryColor.color;
  }
  
  // Fallback: generate color based on category hash
  const hash = category.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = Math.abs(hash) % 360;
  const providerMod = COLOR_PALETTE.providers[provider as keyof typeof COLOR_PALETTE.providers] || COLOR_PALETTE.providers.Other;
  
  return `hsl(${hue}, ${Math.floor(70 * providerMod.saturation)}%, ${Math.floor(50 * providerMod.lightness)}%)`;
}


export function ResourceStats({ resources, pendingOperationsResources = [] }: IResourceStatsProps) {
  // Helper function to filter resources to match Explorer structure: only root nodes and direct children
  const filterResourcesForStats = useCallback((resourcesToFilter: ISSTResource[]) => {
    // Build a set of all resource URNs to check parent relationships
    const allUrns = new Set(resourcesToFilter.map((r) => r.urn));
    // Build a map of URN to resource for O(1) lookups
    const urnToResource = new Map<string, ISSTResource>();
    resourcesToFilter.forEach((resource) => {
      urnToResource.set(resource.urn, resource);
    });
    
    // Process all resources, but only include those that are either:
    // 1. Root nodes (no parent), OR
    // 2. Direct children of root nodes (parent exists but parent's parent doesn't exist in our list)
    return resourcesToFilter.filter((resource) => {
      const hasParent = resource.parent !== undefined && resource.parent !== null;
      
      if (hasParent && resource.parent) {
        // Check if this resource's parent is also in our resource list
        const parentExists = allUrns.has(resource.parent);
        if (parentExists) {
          // Check if the parent itself has a parent (meaning this is a nested child)
          const parentResource = urnToResource.get(resource.parent);
          if (parentResource && parentResource.parent !== undefined && parentResource.parent !== null) {
            // This is a nested child (child of a child), skip it - it will appear under its parent
            return false;
          }
        }
      }
      
      return true;
    });
  }, []);

  // Filter regular resources (non-pending)
  const filteredRegularResources = useMemo(() => {
    return filterResourcesForStats(resources);
  }, [resources, filterResourcesForStats]);

  // Filter pending operations resources
  const filteredPendingResources = useMemo(() => {
    // Create a Set of URNs from regular resources to avoid duplicates
    const resourceUrns = new Set(resources.map((r) => r.urn));
    // Get unique pending resources that aren't already in regular resources
    const uniquePendingResources = pendingOperationsResources.filter(
      (r) => !resourceUrns.has(r.urn)
    );
    return filterResourcesForStats(uniquePendingResources);
  }, [resources, pendingOperationsResources, filterResourcesForStats]);

  // Combine regular resources with pending operations resources for total stats
  // This helps users understand that pending operations resources exist and aren't orphaned
  const allResourcesForStats = useMemo(() => {
    // Create a Set of URNs from regular resources to avoid duplicates
    const resourceUrns = new Set(resources.map((r) => r.urn));
    // Add pending operations resources that aren't already in regular resources
    const uniquePendingResources = pendingOperationsResources.filter(
      (r) => !resourceUrns.has(r.urn)
    );
    return [...resources, ...uniquePendingResources];
  }, [resources, pendingOperationsResources]);

  // Filter combined resources
  const filteredResources = useMemo(() => {
    return filterResourcesForStats(allResourcesForStats);
  }, [allResourcesForStats, filterResourcesForStats]);

  // Calculate provider statistics for deployed resources
  const deployedProviderStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRegularResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      counts.set(provider, (counts.get(provider) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRegularResources]);

  // Calculate provider statistics for pending resources
  const pendingProviderStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredPendingResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      counts.set(provider, (counts.get(provider) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPendingResources]);

  // Calculate category statistics for deployed resources
  const deployedCategoryStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const categoryCache = new Map<string, string>();
    
    filteredRegularResources.forEach((resource) => {
      const category = State.getResourceTypeCategory(resource.type, resource);
      
      // Extract sub-category (everything after " > ") - same as Explorer
      let subCategory: string;
      if (categoryCache.has(category)) {
        subCategory = categoryCache.get(category)!;
      } else {
        subCategory = category.includes(" > ") 
          ? category.split(" > ")[1] 
          : category;
        categoryCache.set(category, subCategory);
      }
      
      categoryCounts.set(subCategory, (categoryCounts.get(subCategory) || 0) + 1);
    });
    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRegularResources]);

  // Calculate category statistics for pending resources
  const pendingCategoryStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const categoryCache = new Map<string, string>();
    
    filteredPendingResources.forEach((resource) => {
      const category = State.getResourceTypeCategory(resource.type, resource);
      
      // Extract sub-category (everything after " > ") - same as Explorer
      let subCategory: string;
      if (categoryCache.has(category)) {
        subCategory = categoryCache.get(category)!;
      } else {
        subCategory = category.includes(" > ") 
          ? category.split(" > ")[1] 
          : category;
        categoryCache.set(category, subCategory);
      }
      
      categoryCounts.set(subCategory, (categoryCounts.get(subCategory) || 0) + 1);
    });
    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredPendingResources]);

  // Note: We're removing the combined categoryStats - showing deployed and pending separately

  // Calculate sub-category statistics with provider breakdown for deployed resources
  const deployedSubCategoryStats = useMemo(() => {
    const subCategoryMap = new Map<string, { SST: number; AWS: number; Other: number }>();
    const categoryCache = new Map<string, string>();
    
    filteredRegularResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      const category = State.getResourceTypeCategory(resource.type, resource);
      let subCategory: string;
      if (categoryCache.has(category)) {
        subCategory = categoryCache.get(category)!;
      } else {
        subCategory = category.includes(" > ") 
          ? category.split(" > ")[1] 
          : category;
        categoryCache.set(category, subCategory);
      }
      
      if (!subCategoryMap.has(subCategory)) {
        subCategoryMap.set(subCategory, { SST: 0, AWS: 0, Other: 0 });
      }
      
      const stats = subCategoryMap.get(subCategory)!;
      stats[provider as keyof typeof stats]++;
    });
    
    return Array.from(subCategoryMap.entries())
      .map(([subCategory, counts]) => ({
        subCategory,
        ...counts,
        total: counts.SST + counts.AWS + counts.Other,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredRegularResources]);

  // Calculate sub-category statistics with provider breakdown for pending resources
  const pendingSubCategoryStats = useMemo(() => {
    const subCategoryMap = new Map<string, { SST: number; AWS: number; Other: number }>();
    const categoryCache = new Map<string, string>();
    
    filteredPendingResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      const category = State.getResourceTypeCategory(resource.type, resource);
      let subCategory: string;
      if (categoryCache.has(category)) {
        subCategory = categoryCache.get(category)!;
      } else {
        subCategory = category.includes(" > ") 
          ? category.split(" > ")[1] 
          : category;
        categoryCache.set(category, subCategory);
      }
      
      if (!subCategoryMap.has(subCategory)) {
        subCategoryMap.set(subCategory, { SST: 0, AWS: 0, Other: 0 });
      }
      
      const stats = subCategoryMap.get(subCategory)!;
      stats[provider as keyof typeof stats]++;
    });
    
    return Array.from(subCategoryMap.entries())
      .map(([subCategory, counts]) => ({
        subCategory,
        ...counts,
        total: counts.SST + counts.AWS + counts.Other,
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [filteredPendingResources]);

  const totalResources = useMemo(() => {
    return filteredResources.length;
  }, [filteredResources]);

  const regularResourcesCount = useMemo(() => {
    return filteredRegularResources.length;
  }, [filteredRegularResources]);

  const pendingResourcesCount = useMemo(() => {
    return filteredPendingResources.length;
  }, [filteredPendingResources]);


  // Generate colors for deployed categories
  const deployedColors = useMemo(() => {
    return deployedCategoryStats.map(({ category }) => {
      const providerCounts = new Map<string, number>();
      filteredRegularResources.forEach((resource) => {
        const fullCategory = State.getResourceTypeCategory(resource.type, resource);
        const subCat = fullCategory.includes(" > ") 
          ? fullCategory.split(" > ")[1] 
          : fullCategory;
        if (subCat === category) {
          const provider = State.getResourceProvider(resource.type);
          providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
        }
      });
      const mostCommonProvider = Array.from(providerCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Other";
      const hierarchicalCategory = `${mostCommonProvider} > ${category}`;
      return getCategoryColor(hierarchicalCategory, mostCommonProvider);
    });
  }, [deployedCategoryStats, filteredRegularResources]);

  // Generate colors for pending categories
  const pendingColors = useMemo(() => {
    return pendingCategoryStats.map(({ category }) => {
      const providerCounts = new Map<string, number>();
      filteredPendingResources.forEach((resource) => {
        const fullCategory = State.getResourceTypeCategory(resource.type, resource);
        const subCat = fullCategory.includes(" > ") 
          ? fullCategory.split(" > ")[1] 
          : fullCategory;
        if (subCat === category) {
          const provider = State.getResourceProvider(resource.type);
          providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
        }
      });
      const mostCommonProvider = Array.from(providerCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Other";
      const hierarchicalCategory = `${mostCommonProvider} > ${category}`;
      return getCategoryColor(hierarchicalCategory, mostCommonProvider);
    });
  }, [pendingCategoryStats, filteredPendingResources]);

  const deployedChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    deployedCategoryStats.forEach(({ category }, index) => {
      config[category] = {
        label: category,
        color: deployedColors[index],
      };
    });
    return config;
  }, [deployedCategoryStats, deployedColors]);

  const pendingChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    pendingCategoryStats.forEach(({ category }, index) => {
      config[category] = {
        label: category,
        color: pendingColors[index],
      };
    });
    return config;
  }, [pendingCategoryStats, pendingColors]);

  // Provider chart configs
  const deployedProviderChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    deployedProviderStats.forEach(({ provider }) => {
      config[provider] = {
        label: provider,
        color: COLOR_PALETTE.providerColors[provider as keyof typeof COLOR_PALETTE.providerColors] || COLOR_PALETTE.providerColors.Other,
      };
    });
    return config;
  }, [deployedProviderStats]);

  const pendingProviderChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    pendingProviderStats.forEach(({ provider }) => {
      config[provider] = {
        label: provider,
        color: COLOR_PALETTE.providerColors[provider as keyof typeof COLOR_PALETTE.providerColors] || COLOR_PALETTE.providerColors.Other,
      };
    });
    return config;
  }, [pendingProviderStats]);

  // Custom tooltip formatters
  const deployedBarTooltipFormatter = (value: number) => {
    const percentage = regularResourcesCount > 0 
      ? ((value / regularResourcesCount) * 100).toFixed(1)
      : "0";
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  const pendingBarTooltipFormatter = (value: number) => {
    const percentage = pendingResourcesCount > 0 
      ? ((value / pendingResourcesCount) * 100).toFixed(1)
      : "0";
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  const pieLabelFormatter = ({ percent, category }: { category: string; percent: number }) => {
    if (percent < 0.05) return "";
    const shortCategory = category.includes(" > ") 
      ? category.split(" > ")[1] 
      : category;
    return `${shortCategory}: ${(percent * 100).toFixed(0)}%`;
  };

  const deployedPieTooltipFormatter = (value: number) => {
    const percentage = regularResourcesCount > 0
      ? ((value / regularResourcesCount) * 100).toFixed(1)
      : "0";
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  const pendingPieTooltipFormatter = (value: number) => {
    const percentage = pendingResourcesCount > 0
      ? ((value / pendingResourcesCount) * 100).toFixed(1)
      : "0";
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Deployed Resources</CardDescription>
            <CardTitle className="text-3xl">{regularResourcesCount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Currently deployed
            </div>
          </CardContent>
        </Card>
        {pendingResourcesCount > 0 && (
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardDescription>Pending Resources</CardDescription>
              <CardTitle className="text-3xl">{pendingResourcesCount.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                Awaiting deployment
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Resources</CardDescription>
            <CardTitle className="text-3xl">{totalResources.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {pendingResourcesCount > 0
                ? `${regularResourcesCount} deployed + ${pendingResourcesCount} pending`
                : "All deployed"}
            </div>
          </CardContent>
        </Card>
        {deployedProviderStats.map(({ provider, count }) => (
          <Card key={provider}>
            <CardHeader className="pb-2">
              <CardDescription>{provider} Resources (Deployed)</CardDescription>
              <CardTitle className="text-3xl">{count.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {regularResourcesCount > 0 ? ((count / regularResourcesCount) * 100).toFixed(1) : "0"}% of deployed
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployed Resources Charts Section */}
      {regularResourcesCount > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Deployed Resources</h2>
            <span className="text-sm text-muted-foreground">({regularResourcesCount.toLocaleString()} resources)</span>
          </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deployed Provider Distribution */}
        <Card>
          <CardHeader>
                <CardTitle>Provider Distribution (Deployed)</CardTitle>
                <CardDescription>Breakdown by provider for deployed resources</CardDescription>
          </CardHeader>
          <CardContent>
                <ChartContainer config={deployedProviderChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                      data={deployedProviderStats}
                  dataKey="count"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  label={({ percent, provider }) => 
                    percent >= 0.05 ? `${provider}: ${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                  className="text-xs font-medium"
                >
                      {deployedProviderStats.map(({ provider }, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLOR_PALETTE.providerColors[provider as keyof typeof COLOR_PALETTE.providerColors] || COLOR_PALETTE.providerColors.Other}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                          formatter={(value) => [deployedPieTooltipFormatter(value as number), ""]}
                      labelFormatter={(label) => (
                        <span className="font-semibold">{label}</span>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      className="flex-wrap justify-center gap-4"
                      nameKey="provider"
                    />
                  }
                  verticalAlign="bottom"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

            {/* Deployed Category Breakdown */}
        <Card>
          <CardHeader>
                <CardTitle>Category Breakdown (Deployed)</CardTitle>
                <CardDescription>Distribution by category for deployed resources</CardDescription>
          </CardHeader>
          <CardContent>
                <ChartContainer config={deployedChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                      data={deployedCategoryStats}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  label={pieLabelFormatter}
                  labelLine={false}
                  className="text-xs font-medium"
                >
                      {deployedCategoryStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                          fill={deployedColors[index]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                          formatter={(value, name) => [deployedPieTooltipFormatter(value as number), name]}
                      labelFormatter={(label) => (
                        <span className="font-semibold">{label}</span>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent
                      className="flex-wrap justify-center gap-4"
                      nameKey="category"
                    />
                  }
                  verticalAlign="bottom"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

            {/* Deployed Provider Breakdown by Category */}
        <Card>
          <CardHeader>
                <CardTitle>Provider Breakdown by Category (Deployed)</CardTitle>
                <CardDescription>SST vs AWS distribution within each category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={deployedProviderChartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={deployedSubCategoryStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                      type="category"
                      dataKey="subCategory"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={100}
                      className="text-xs"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [value?.toLocaleString() || "0", ""]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent
                          className="flex-wrap justify-center gap-4"
                        />
                      }
                    />
                    <Bar
                      dataKey="SST"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.SST}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="AWS"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.AWS}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Other"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.Other}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Deployed Resource Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Distribution (Deployed)</CardTitle>
                <CardDescription>{regularResourcesCount.toLocaleString()} deployed resources by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={deployedChartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={deployedCategoryStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      className="text-xs"
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [deployedBarTooltipFormatter(value as number), name]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="count"
                      radius={[8, 8, 0, 0]}
                      className="fill-primary"
                    >
                      {deployedCategoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={deployedColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Pending Resources Charts Section */}
      {pendingResourcesCount > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Pending Resources</h2>
            <span className="text-sm text-yellow-600 dark:text-yellow-400">({pendingResourcesCount.toLocaleString()} resources)</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Provider Distribution */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle>Provider Distribution (Pending)</CardTitle>
                <CardDescription>Breakdown by provider for pending resources</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pendingProviderChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={pendingProviderStats}
                      dataKey="count"
                      nameKey="provider"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      label={({ percent, provider }) => 
                        percent >= 0.05 ? `${provider}: ${(percent * 100).toFixed(0)}%` : ""
                      }
                      labelLine={false}
                      className="text-xs font-medium"
                    >
                      {pendingProviderStats.map(({ provider }, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLOR_PALETTE.providerColors[provider as keyof typeof COLOR_PALETTE.providerColors] || COLOR_PALETTE.providerColors.Other}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [pendingPieTooltipFormatter(value as number), ""]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent
                          className="flex-wrap justify-center gap-4"
                          nameKey="provider"
                        />
                      }
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pending Category Breakdown */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle>Category Breakdown (Pending)</CardTitle>
                <CardDescription>Distribution by category for pending resources</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pendingChartConfig} className="h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={pendingCategoryStats}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={30}
                      label={pieLabelFormatter}
                      labelLine={false}
                      className="text-xs font-medium"
                    >
                      {pendingCategoryStats.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={pendingColors[index]}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [pendingPieTooltipFormatter(value as number), name]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent
                          className="flex-wrap justify-center gap-4"
                          nameKey="category"
                        />
                      }
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pending Provider Breakdown by Category */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle>Provider Breakdown by Category (Pending)</CardTitle>
                <CardDescription>SST vs AWS distribution within each category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pendingProviderChartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={pendingSubCategoryStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                      type="category"
                      dataKey="subCategory"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={100}
                      className="text-xs"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [value?.toLocaleString() || "0", ""]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent
                          className="flex-wrap justify-center gap-4"
                        />
                      }
                    />
                    <Bar
                      dataKey="SST"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.SST}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="AWS"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.AWS}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Other"
                      stackId="provider"
                      fill={COLOR_PALETTE.providerColors.Other}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pending Resource Distribution */}
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardHeader>
                <CardTitle>Resource Distribution (Pending)</CardTitle>
                <CardDescription>{pendingResourcesCount.toLocaleString()} pending resources by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={pendingChartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={pendingCategoryStats}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      className="text-xs"
                      interval={0}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [pendingBarTooltipFormatter(value as number), name]}
                          labelFormatter={(label) => (
                            <span className="font-semibold">{label}</span>
                          )}
                        />
                      }
                    />
                    <Bar
                      dataKey="count"
                      radius={[8, 8, 0, 0]}
                      className="fill-primary"
                    >
                      {pendingCategoryStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={pendingColors[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

    </div>
  );
}
