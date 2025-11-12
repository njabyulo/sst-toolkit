import { useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid } from "recharts";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";
import { ProviderDistributionChart } from "./stats/ProviderDistributionChart";
import { CategoryBreakdownChart } from "./stats/CategoryBreakdownChart";
import { StatsCard } from "./stats/StatsCard";

interface IResourceStatsProps {
  resources: ISSTResource[];
  pendingOperationsResources?: ISSTResource[];
}

/**
 * Color palette optimized for data visualization
 * Colorblind-friendly with good contrast
 */
// Primary colors for sub-categories (colorblind-friendly)
// Using Map for O(1) lookup instead of array.find() which is O(n)
const SUB_CATEGORY_COLORS = new Map<string, string>([
  ["Function", "hsl(220, 70%, 50%)"],      // Blue
  ["API", "hsl(280, 65%, 55%)"],            // Purple
  ["Storage", "hsl(200, 75%, 45%)"],        // Cyan
  ["Database", "hsl(160, 60%, 45%)"],        // Teal
  ["Queue", "hsl(30, 80%, 55%)"],            // Orange
  ["Event Bus", "hsl(340, 70%, 55%)"],       // Pink
  ["Notification", "hsl(15, 85%, 55%)"],      // Red-orange
  ["Stream", "hsl(180, 70%, 45%)"],          // Aqua
  ["Container", "hsl(260, 60%, 55%)"],        // Indigo
  ["CDN", "hsl(40, 80%, 55%)"],             // Yellow-orange
  ["DNS", "hsl(210, 70%, 50%)"],               // Sky blue
  ["Certificate", "hsl(100, 50%, 45%)"],     // Green
  ["IAM", "hsl(0, 70%, 50%)"],                // Red
  ["Secret", "hsl(320, 60%, 50%)"],           // Magenta
  ["Parameter", "hsl(140, 55%, 45%)"],        // Green-cyan
  ["Monitoring", "hsl(25, 75%, 50%)"],         // Orange-red
  ["Network", "hsl(240, 65%, 50%)"],           // Blue-purple
  ["Cache", "hsl(50, 80%, 55%)"],             // Yellow
  ["Auth", "hsl(300, 60%, 50%)"],            // Pink-purple
  ["Link", "hsl(190, 60%, 45%)"],             // Blue-cyan
  ["Pulumi", "hsl(270, 50%, 50%)"],          // Purple
  ["Other", "hsl(0, 0%, 60%)"],                // Gray
]);

const COLOR_PALETTE = {
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
  
  // Find matching sub-category color (O(1) lookup with Map)
  const subCategoryColor = SUB_CATEGORY_COLORS.get(subCategory);
  
  if (subCategoryColor) {
    // Apply provider-specific modifications
    const providerMod = COLOR_PALETTE.providers[provider as keyof typeof COLOR_PALETTE.providers] || COLOR_PALETTE.providers.Other;
    
    // Parse HSL color
    const hslMatch = subCategoryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const [, h, s, l] = hslMatch;
      const hue = parseInt(h);
      const saturation = Math.min(100, parseInt(s) * providerMod.saturation);
      const lightness = Math.min(100, parseInt(l) * providerMod.lightness);
      
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    
    return subCategoryColor;
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

  // Calculate category statistics for deployed resources (optimized: single pass with provider tracking)
  const deployedCategoryStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const categoryToProvider = new Map<string, Map<string, number>>(); // Track provider counts per category
    const categoryToMostCommonProvider = new Map<string, { provider: string; count: number }>(); // Track most common provider per category
    const categoryCache = new Map<string, string>();
    
    filteredRegularResources.forEach((resource) => {
      const category = State.getResourceTypeCategory(resource.type, resource);
      const provider = State.getResourceProvider(resource.type);
      
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
      
      // Track provider for this category (for color calculation)
      if (!categoryToProvider.has(subCategory)) {
        categoryToProvider.set(subCategory, new Map());
      }
      const providerMap = categoryToProvider.get(subCategory)!;
      const newCount = (providerMap.get(provider) || 0) + 1;
      providerMap.set(provider, newCount);
      
      // Track most common provider (O(1) update during pass)
      const currentMostCommon = categoryToMostCommonProvider.get(subCategory);
      if (!currentMostCommon || newCount > currentMostCommon.count) {
        categoryToMostCommonProvider.set(subCategory, { provider, count: newCount });
      }
    });
    
    const stats = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Store provider mapping and most common provider for later use in color calculation
    (stats as Array<{ category: string; count: number; providerMap?: Map<string, number>; mostCommonProvider?: string }>).forEach(stat => {
      stat.providerMap = categoryToProvider.get(stat.category);
      stat.mostCommonProvider = categoryToMostCommonProvider.get(stat.category)?.provider || "Other";
    });
    
    return stats;
  }, [filteredRegularResources]);

  // Calculate category statistics for pending resources (optimized: single pass with provider tracking)
  const pendingCategoryStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const categoryToProvider = new Map<string, Map<string, number>>(); // Track provider counts per category
    const categoryToMostCommonProvider = new Map<string, { provider: string; count: number }>(); // Track most common provider per category
    const categoryCache = new Map<string, string>();
    
    filteredPendingResources.forEach((resource) => {
      const category = State.getResourceTypeCategory(resource.type, resource);
      const provider = State.getResourceProvider(resource.type);
      
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
      
      // Track provider for this category (for color calculation)
      if (!categoryToProvider.has(subCategory)) {
        categoryToProvider.set(subCategory, new Map());
      }
      const providerMap = categoryToProvider.get(subCategory)!;
      const newCount = (providerMap.get(provider) || 0) + 1;
      providerMap.set(provider, newCount);
      
      // Track most common provider (O(1) update during pass)
      const currentMostCommon = categoryToMostCommonProvider.get(subCategory);
      if (!currentMostCommon || newCount > currentMostCommon.count) {
        categoryToMostCommonProvider.set(subCategory, { provider, count: newCount });
      }
    });
    
    const stats = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    
    // Store provider mapping and most common provider for later use in color calculation
    (stats as Array<{ category: string; count: number; providerMap?: Map<string, number>; mostCommonProvider?: string }>).forEach(stat => {
      stat.providerMap = categoryToProvider.get(stat.category);
      stat.mostCommonProvider = categoryToMostCommonProvider.get(stat.category)?.provider || "Other";
    });
    
    return stats;
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


  // Generate colors for deployed categories (optimized: use pre-computed most common provider)
  const deployedColors = useMemo(() => {
    return deployedCategoryStats.map((stat) => {
      const category = stat.category;
      const mostCommonProvider = (stat as { mostCommonProvider?: string }).mostCommonProvider || "Other";
      const hierarchicalCategory = `${mostCommonProvider} > ${category}`;
      return getCategoryColor(hierarchicalCategory, mostCommonProvider);
    });
  }, [deployedCategoryStats]);

  // Generate colors for pending categories (optimized: use pre-computed most common provider)
  const pendingColors = useMemo(() => {
    return pendingCategoryStats.map((stat) => {
      const category = stat.category;
      const mostCommonProvider = (stat as { mostCommonProvider?: string }).mostCommonProvider || "Other";
      const hierarchicalCategory = `${mostCommonProvider} > ${category}`;
      return getCategoryColor(hierarchicalCategory, mostCommonProvider);
    });
  }, [pendingCategoryStats]);

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
        <StatsCard
          title="Deployed Resources"
          value={regularResourcesCount}
          description="Currently deployed"
        />
        {pendingResourcesCount > 0 && (
          <StatsCard
            title="Pending Resources"
            value={pendingResourcesCount}
            description="Awaiting deployment"
            className="border-yellow-500/20 bg-yellow-500/5"
          />
        )}
        <StatsCard
          title="Total Resources"
          value={totalResources}
          description={
            pendingResourcesCount > 0
              ? `${regularResourcesCount} deployed + ${pendingResourcesCount} pending`
              : "All deployed"
          }
        />
        {deployedProviderStats.map(({ provider, count }) => (
          <StatsCard
            key={provider}
            title={`${provider} Resources (Deployed)`}
            value={count}
            description={
              regularResourcesCount > 0
                ? `${((count / regularResourcesCount) * 100).toFixed(1)}% of deployed`
                : "0% of deployed"
            }
          />
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
            <ProviderDistributionChart
              title="Provider Distribution (Deployed)"
              description="Breakdown by provider for deployed resources"
              data={deployedProviderStats}
              config={deployedProviderChartConfig}
              tooltipFormatter={deployedPieTooltipFormatter}
              providerColors={COLOR_PALETTE.providerColors}
            />

                {/* Deployed Category Breakdown */}
                <CategoryBreakdownChart
                  title="Category Breakdown (Deployed)"
                  description="Distribution by category for deployed resources"
                  data={deployedCategoryStats}
                  config={deployedChartConfig}
                  colors={deployedColors}
                  tooltipFormatter={deployedPieTooltipFormatter}
                />

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
            <ProviderDistributionChart
              title="Provider Distribution (Pending)"
              description="Breakdown by provider for pending resources"
              data={pendingProviderStats}
              config={pendingProviderChartConfig}
              tooltipFormatter={pendingPieTooltipFormatter}
              providerColors={COLOR_PALETTE.providerColors}
              className="border-yellow-500/20 bg-yellow-500/5"
            />

                {/* Pending Category Breakdown */}
                <CategoryBreakdownChart
                  title="Category Breakdown (Pending)"
                  description="Distribution by category for pending resources"
                  data={pendingCategoryStats}
                  config={pendingChartConfig}
                  colors={pendingColors}
                  tooltipFormatter={pendingPieTooltipFormatter}
                  className="border-yellow-500/20 bg-yellow-500/5"
                />

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
