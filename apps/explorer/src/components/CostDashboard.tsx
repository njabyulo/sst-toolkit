import { useMemo } from "react";
import { DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "~/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import { getTotalCost, getCostBreakdown, getProviderCostBreakdown, formatCost, estimateResourceCost } from "~/lib/cost-estimator";
import * as State from "@sst-toolkit/core/state";

interface ICostDashboardProps {
  resources: ISSTResource[];
}

const COLOR_PALETTE = {
  SST: "hsl(220, 80%, 55%)",
  AWS: "hsl(30, 75%, 50%)",
  Other: "hsl(0, 0%, 60%)",
};

export function CostDashboard({ resources }: ICostDashboardProps) {
  // Filter resources to ensure no duplicates in cost calculation
  // Only count actual AWS billable resources, not SST wrapper resources that have children
  const filteredResources = useMemo(() => {
    // Build a map of URN to resource for O(1) lookups
    const urnToResource = new Map<string, ISSTResource>();
    // Build a map of parent URN to children count
    const parentToChildren = new Map<string, number>();
    
    resources.forEach((resource) => {
      urnToResource.set(resource.urn, resource);
      if (resource.parent) {
        parentToChildren.set(resource.parent, (parentToChildren.get(resource.parent) || 0) + 1);
      }
    });
    
    // Filter resources to avoid duplicates:
    // 1. Only count actual AWS resources (type starts with "aws:") OR
    // 2. SST resources that don't have children (leaf nodes)
    // This ensures we don't count both the wrapper and its children
    return resources.filter((resource) => {
      // Always include actual AWS resources (they are billable)
      if (resource.type.startsWith("aws:")) {
        return true;
      }
      
      // For SST wrapper resources, only include if they don't have children
      // (meaning they are leaf nodes, not wrappers with actual AWS resources as children)
      const hasChildren = parentToChildren.has(resource.urn);
      if (hasChildren) {
        // This is a wrapper resource with children, exclude it
        // The children (actual AWS resources) will be counted instead
        return false;
      }
      
      // Include SST resources without children (leaf nodes)
      return true;
    });
  }, [resources]);

  const totalCost = useMemo(() => getTotalCost(filteredResources), [filteredResources]);
  const categoryBreakdown = useMemo(() => getCostBreakdown(filteredResources), [filteredResources]);
  const providerBreakdown = useMemo(() => getProviderCostBreakdown(filteredResources), [filteredResources]);
  
  // Calculate cost per resource
  const avgCostPerResource = useMemo(() => {
    return filteredResources.length > 0 ? totalCost / filteredResources.length : 0;
  }, [totalCost, filteredResources.length]);
  
  // Find most expensive categories
  const topCostCategories = useMemo(() => {
    return categoryBreakdown.slice(0, 5);
  }, [categoryBreakdown]);
  
  // Find most expensive resources
  const topCostResources = useMemo(() => {
    return filteredResources
      .map((resource) => ({
        resource,
        cost: estimateResourceCost(resource),
      }))
      .filter((item) => item.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }, [filteredResources]);
  
  // Provider cost chart config
  const providerChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    providerBreakdown.forEach(({ provider }) => {
      config[provider] = {
        label: provider,
        color: COLOR_PALETTE[provider as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.Other,
      };
    });
    return config;
  }, [providerBreakdown]);
  
  // Category cost chart config
  const categoryChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    categoryBreakdown.forEach(({ category }, index) => {
      const hue = (index * 137.508) % 360; // Golden angle for color distribution
      config[category] = {
        label: category,
        color: `hsl(${hue}, 70%, 50%)`,
      };
    });
    return config;
  }, [categoryBreakdown]);

  return (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estimated Monthly Cost</CardDescription>
            <CardTitle className="text-3xl">{formatCost(totalCost)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Based on typical usage patterns</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Resources</CardDescription>
            <CardTitle className="text-3xl">{filteredResources.length.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Avg: {formatCost(avgCostPerResource)} per resource
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cost by Provider</CardDescription>
            <CardTitle className="text-2xl">
              {providerBreakdown.map(({ provider, cost }) => (
                <div key={provider} className="flex items-center gap-2">
                  <Badge variant={provider === "SST" ? "default" : provider === "AWS" ? "secondary" : "outline"}>
                    {provider}
                  </Badge>
                  <span>{formatCost(cost)}</span>
                </div>
              ))}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Cost Category</CardDescription>
            <CardTitle className="text-xl">
              {topCostCategories.length > 0 ? (
                <div>
                  <div className="font-semibold">
                    {topCostCategories[0].category}
                  </div>
                  <div className="text-2xl mt-1">{formatCost(topCostCategories[0].cost)}</div>
                </div>
              ) : (
                "N/A"
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cost Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
            <CardDescription>
              Estimated monthly cost breakdown by provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerChartConfig} className="h-[300px] w-full">
              <PieChart>
                <Pie
                  data={providerBreakdown}
                  dataKey="cost"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={30}
                  label={({ provider, percent }) => 
                    percent >= 0.05 ? `${provider}: ${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                  className="text-xs font-medium"
                >
                  {providerBreakdown.map(({ provider }, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLOR_PALETTE[provider as keyof typeof COLOR_PALETTE] || COLOR_PALETTE.Other}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [formatCost(value as number), ""]}
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

        {/* Category Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost by Category</CardTitle>
            <CardDescription>
              Top 10 categories by estimated monthly cost
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
              <BarChart
                data={categoryBreakdown.slice(0, 10)}
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
                  tickFormatter={(value) => formatCost(value)}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={120}
                  className="text-xs"
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [formatCost(value as number), ""]}
                      labelFormatter={(label) => (
                        <span className="font-semibold">{label}</span>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="cost"
                  radius={[0, 4, 4, 0]}
                  className="fill-primary"
                >
                  {categoryBreakdown.slice(0, 10).map((_item, index) => {
                    const hue = (index * 137.508) % 360;
                    return (
                      <Cell key={`cell-${index}`} fill={`hsl(${hue}, 70%, 50%)`} />
                    );
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Cost Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Most Expensive Resources</CardTitle>
          <CardDescription>
            Top 10 resources by estimated monthly cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topCostResources.map(({ resource, cost }, index) => {
              const provider = State.getResourceProvider(resource.type);
              const category = State.getResourceTypeCategory(resource.type, resource);
              const subCategory = category.includes(" > ") 
                ? category.split(" > ")[1] 
                : category;
              
              return (
                <div
                  key={resource.urn}
                  className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{resource.urn.split("::").pop()}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Badge variant={provider === "SST" ? "default" : provider === "AWS" ? "secondary" : "outline"} className="text-xs">
                          {provider}
                        </Badge>
                        <span className="truncate">{subCategory}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCost(cost)}</div>
                    <div className="text-xs text-muted-foreground">per month</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cost Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Cost Estimates Disclaimer
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200">
                These are rough estimates based on typical AWS usage patterns and pricing as of 2024. 
                Actual costs may vary significantly based on actual usage, region, pricing tiers, 
                reserved capacity, and other factors. Use these estimates as a guide for budgeting 
                and cost planning, but verify with actual AWS billing for accurate costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

