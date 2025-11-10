import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/core/state";

interface IResourceStatsProps {
  resources: ISSTResource[];
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


export function ResourceStats({ resources }: IResourceStatsProps) {
  // Filter resources to match Explorer structure: only root nodes and direct children
  // This ensures charts show the same counts as Explorer
  const filteredResources = useMemo(() => {
    // Build a set of all resource URNs to check parent relationships
    const allUrns = new Set(resources.map((r) => r.urn));
    // Build a map of URN to resource for O(1) lookups
    const urnToResource = new Map<string, ISSTResource>();
    resources.forEach((resource) => {
      urnToResource.set(resource.urn, resource);
    });
    
    // Process all resources, but only include those that are either:
    // 1. Root nodes (no parent), OR
    // 2. Direct children of root nodes (parent exists but parent's parent doesn't exist in our list)
    return resources.filter((resource) => {
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
  }, [resources]);

  // Calculate provider statistics
  const providerStats = useMemo(() => {
    const counts = new Map<string, number>();
    filteredResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      counts.set(provider, (counts.get(provider) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredResources]);

  // Calculate category statistics using Explorer structure (sub-category only)
  const categoryStats = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const categoryCache = new Map<string, string>();
    
    filteredResources.forEach((resource) => {
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
  }, [filteredResources]);

  // Calculate sub-category statistics with provider breakdown
  const subCategoryStats = useMemo(() => {
    const subCategoryMap = new Map<string, { SST: number; AWS: number; Other: number }>();
    // Cache for category extraction to avoid repeated string operations
    const categoryCache = new Map<string, string>();
    
    filteredResources.forEach((resource) => {
      const provider = State.getResourceProvider(resource.type);
      const category = State.getResourceTypeCategory(resource.type, resource);
      // Use cached extraction for better performance
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
      .slice(0, 15); // Top 15 sub-categories
  }, [filteredResources]);

  const totalResources = useMemo(() => {
    return filteredResources.length;
  }, [filteredResources]);


  // Generate colors for each category (using sub-category from Explorer structure)
  const colors = useMemo(() => {
    return categoryStats.map(({ category }) => {
      // For Explorer structure, we use sub-category directly, so we need to find a representative provider
      // We'll use the most common provider for this sub-category
      const providerCounts = new Map<string, number>();
      filteredResources.forEach((resource) => {
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
      
      // Create a hierarchical category for color calculation
      const hierarchicalCategory = `${mostCommonProvider} > ${category}`;
      return getCategoryColor(hierarchicalCategory, mostCommonProvider);
    });
  }, [categoryStats, filteredResources]);

  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    categoryStats.forEach(({ category }, index) => {
      config[category] = {
        label: category,
        color: colors[index],
      };
    });
    return config;
  }, [categoryStats, colors]);

  // Provider chart config
  const providerChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    providerStats.forEach(({ provider }) => {
      config[provider] = {
        label: provider,
        color: COLOR_PALETTE.providerColors[provider as keyof typeof COLOR_PALETTE.providerColors] || COLOR_PALETTE.providerColors.Other,
      };
    });
    return config;
  }, [providerStats]);

  // Custom tooltip formatter for bar chart
  const barTooltipFormatter = (value: number) => {
    const percentage = ((value / totalResources) * 100).toFixed(1);
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  // Custom label formatter for pie chart (only show if slice is large enough)
  const pieLabelFormatter = ({ percent, category }: { category: string; percent: number }) => {
    // Only show label if slice is >= 5%
    if (percent < 0.05) return "";
    // Show shortened category name for better readability
    const shortCategory = category.includes(" > ") 
      ? category.split(" > ")[1] 
      : category;
    return `${shortCategory}: ${(percent * 100).toFixed(0)}%`;
  };

  // Custom tooltip formatter for pie chart
  const pieTooltipFormatter = (value: number) => {
    const percentage = ((value / totalResources) * 100).toFixed(1);
    return `${value.toLocaleString()} (${percentage}%)`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Resources</CardDescription>
            <CardTitle className="text-3xl">{totalResources.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        {providerStats.map(({ provider, count }) => (
          <Card key={provider}>
            <CardHeader className="pb-2">
              <CardDescription>{provider} Resources</CardDescription>
              <CardTitle className="text-3xl">{count.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {((count / totalResources) * 100).toFixed(1)}% of total
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Distribution</CardTitle>
            <CardDescription>
              Breakdown by provider (SST vs AWS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={providerStats}
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
                  {providerStats.map(({ provider }, index) => (
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
                      formatter={(value) => [pieTooltipFormatter(value as number), ""]}
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

        {/* Category Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>
              Percentage distribution of resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={categoryStats}
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
                  {categoryStats.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index]}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [pieTooltipFormatter(value as number), name]}
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

        {/* Stacked Bar Chart - Provider Breakdown by Sub-Category */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Breakdown by Category</CardTitle>
            <CardDescription>
              SST vs AWS distribution within each sub-category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerChartConfig} className="h-[350px] w-full">
              <BarChart
                data={subCategoryStats}
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

        {/* Grouped Bar Chart - Provider Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Provider Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison of SST vs AWS by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerChartConfig} className="h-[350px] w-full">
              <BarChart
                data={subCategoryStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="subCategory"
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
                  fill={COLOR_PALETTE.providerColors.SST}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="AWS"
                  fill={COLOR_PALETTE.providerColors.AWS}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="Other"
                  fill={COLOR_PALETTE.providerColors.Other}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Resource Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Distribution</CardTitle>
            <CardDescription>
              {totalResources.toLocaleString()} total resources by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart
                data={categoryStats}
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
                  tickFormatter={(value) => {
                    // Category is already sub-category from Explorer structure
                    return value;
                  }}
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
                      formatter={(value, name) => [barTooltipFormatter(value as number), name]}
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
                  {categoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
