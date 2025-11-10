/**
 * AWS Resource Cost Estimation
 * Provides estimated monthly costs for AWS resources based on typical usage patterns
 * 
 * Note: These are rough estimates based on AWS pricing as of 2024
 * Actual costs may vary based on usage, region, and pricing tiers
 */

import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/shared/utils/state";

/**
 * Estimated monthly costs per resource type (USD)
 * Based on typical usage patterns and AWS pricing
 */
const COST_ESTIMATES: Record<string, { base: number; perUnit?: number; unit?: string }> = {
  // Compute
  Function: { base: 0.20, perUnit: 0.0000166667, unit: "GB-second" }, // Lambda: $0.20 per 1M requests + $0.0000166667 per GB-second
  Container: { base: 10.00, perUnit: 0.04, unit: "vCPU-hour" }, // ECS Fargate: ~$10 base + $0.04 per vCPU-hour
  
  // Storage
  Storage: { base: 0.023, perUnit: 0.023, unit: "GB-month" }, // S3 Standard: $0.023 per GB/month
  
  // Database
  Database: { base: 0.25, perUnit: 0.00025, unit: "RCU" }, // DynamoDB: $0.25 per million RCU + storage
  Cache: { base: 0.017, perUnit: 0.017, unit: "GB-hour" }, // ElastiCache: ~$0.017 per GB-hour
  
  // Networking
  API: { base: 3.50, perUnit: 0.000001, unit: "request" }, // API Gateway: $3.50 per million requests
  CDN: { base: 0.085, perUnit: 0.085, unit: "GB-transfer" }, // CloudFront: $0.085 per GB (first 10TB)
  DNS: { base: 0.50, perUnit: 0.40, unit: "hosted-zone" }, // Route53: $0.50 per hosted zone + $0.40 per million queries
  Network: { base: 0.01, perUnit: 0.01, unit: "GB-transfer" }, // VPC Data Transfer: ~$0.01 per GB
  
  // Messaging
  Queue: { base: 0.40, perUnit: 0.0000004, unit: "request" }, // SQS: $0.40 per million requests
  "Event Bus": { base: 1.00, perUnit: 0.000001, unit: "event" }, // EventBridge: $1.00 per million events
  Notification: { base: 0.50, perUnit: 0.0000005, unit: "notification" }, // SNS: $0.50 per million notifications
  Stream: { base: 0.015, perUnit: 0.015, unit: "shard-hour" }, // Kinesis: $0.015 per shard-hour
  
  // Security
  Certificate: { base: 0.00 }, // ACM: Free for public certificates
  IAM: { base: 0.00 }, // IAM: Free
  Secret: { base: 0.40, perUnit: 0.40, unit: "secret-month" }, // Secrets Manager: $0.40 per secret per month
  Parameter: { base: 0.00 }, // SSM Parameter Store: Free (standard)
  Auth: { base: 0.0055, perUnit: 0.0055, unit: "MAU" }, // Cognito: $0.0055 per MAU
  
  // Monitoring
  Monitoring: { base: 0.50, perUnit: 0.50, unit: "metric" }, // CloudWatch: $0.50 per custom metric per month
  
  // Other
  Link: { base: 0.00 }, // SST Link: No cost
  Pulumi: { base: 0.00 }, // Pulumi resources: Cost depends on underlying resource
  Other: { base: 0.00 },
};

/**
 * Estimate monthly cost for a resource
 */
export function estimateResourceCost(resource: ISSTResource): number {
  const category = State.getResourceTypeCategory(resource.type, resource);
  const subCategory = category.includes(" > ") 
    ? category.split(" > ")[1] 
    : category;
  
  const estimate = COST_ESTIMATES[subCategory] || COST_ESTIMATES.Other || { base: 0 };
  
  if (!estimate) {
    return 0;
  }
  
  // Base cost
  let cost = estimate.base;
  
  // Add per-unit costs if applicable
  if (estimate.perUnit) {
    // Estimate usage based on resource type
    const usage = estimateUsage(resource, subCategory);
    cost += usage * (estimate.perUnit || 0);
  }
  
  return Math.max(0, cost);
}

/**
 * Estimate usage for a resource based on type and configuration
 */
function estimateUsage(_resource: ISSTResource, subCategory: string): number {
  switch (subCategory) {
    case "Function":
      // Estimate: 1M requests/month, 512MB memory, 1s duration
      return 1000000 * 0.5 * 1; // requests * GB * seconds
      
    case "Storage":
      // Estimate: 10GB storage
      return 10;
      
    case "Database":
      // Estimate: 100 RCU
      return 100;
      
    case "API":
      // Estimate: 1M requests/month
      return 1000000;
      
    case "Queue":
      // Estimate: 1M requests/month
      return 1000000;
      
    case "Event Bus":
      // Estimate: 1M events/month
      return 1000000;
      
    case "Notification":
      // Estimate: 1M notifications/month
      return 1000000;
      
    case "CDN":
      // Estimate: 100GB transfer/month
      return 100;
      
    case "Network":
      // Estimate: 10GB transfer/month
      return 10;
      
    case "Cache":
      // Estimate: 1GB, 730 hours/month
      return 1 * 730;
      
    case "Stream":
      // Estimate: 1 shard, 730 hours/month
      return 1 * 730;
      
    case "Auth":
      // Estimate: 1000 MAU
      return 1000;
      
    case "Secret":
      // Estimate: 1 secret
      return 1;
      
    case "Monitoring":
      // Estimate: 10 custom metrics
      return 10;
      
    default:
      return 0;
  }
}

/**
 * Get cost breakdown by category
 */
export function getCostBreakdown(resources: ISSTResource[]): Array<{ category: string; cost: number; count: number }> {
  const breakdown = new Map<string, { cost: number; count: number }>();
  // Cache for category extraction
  const categoryCache = new Map<string, string>();
  
  resources.forEach((resource) => {
    const fullCategory = State.getResourceTypeCategory(resource.type, resource);
    
    // Extract sub-category (everything after " > ") - same as Explorer
    let subCategory: string;
    if (categoryCache.has(fullCategory)) {
      subCategory = categoryCache.get(fullCategory)!;
    } else {
      subCategory = fullCategory.includes(" > ") 
        ? fullCategory.split(" > ")[1] 
        : fullCategory;
      categoryCache.set(fullCategory, subCategory);
    }
    
    const cost = estimateResourceCost(resource);
    
    if (!breakdown.has(subCategory)) {
      breakdown.set(subCategory, { cost: 0, count: 0 });
    }
    
    const entry = breakdown.get(subCategory)!;
    entry.cost += cost;
    entry.count += 1;
  });
  
  return Array.from(breakdown.entries())
    .map(([category, data]) => ({
      category,
      cost: data.cost,
      count: data.count,
    }))
    .sort((a, b) => b.cost - a.cost);
}

/**
 * Get cost breakdown by provider
 */
export function getProviderCostBreakdown(resources: ISSTResource[]): Array<{ provider: string; cost: number; count: number }> {
  const breakdown = new Map<string, { cost: number; count: number }>();
  
  resources.forEach((resource) => {
    const provider = State.getResourceProvider(resource.type);
    const cost = estimateResourceCost(resource);
    
    if (!breakdown.has(provider)) {
      breakdown.set(provider, { cost: 0, count: 0 });
    }
    
    const entry = breakdown.get(provider)!;
    entry.cost += cost;
    entry.count += 1;
  });
  
  return Array.from(breakdown.entries())
    .map(([provider, data]) => ({
      provider,
      cost: data.cost,
      count: data.count,
    }))
    .sort((a, b) => b.cost - a.cost);
}

/**
 * Get total estimated monthly cost
 */
export function getTotalCost(resources: ISSTResource[]): number {
  return resources.reduce((total, resource) => {
    return total + estimateResourceCost(resource);
  }, 0);
}

/**
 * Format cost as currency
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return "< $0.01";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cost);
}

