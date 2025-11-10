import type { ISSTResource, IResourceNode, IResourceGroup } from "@sst-toolkit/shared/types/sst";

export function parseState(state: { latest: { resources: ISSTResource[] } }): IResourceNode[] {
  const resources = state.latest.resources;
  const resourceMap = new Map<string, ISSTResource>();
  const childrenMap = new Map<string | undefined, ISSTResource[]>();

  resources.forEach((resource) => {
    resourceMap.set(resource.urn, resource);
    const parentUrn = resource.parent;
    if (!childrenMap.has(parentUrn)) {
      childrenMap.set(parentUrn, []);
    }
    childrenMap.get(parentUrn)?.push(resource);
  });

  function buildTree(parentUrn: string | undefined): IResourceNode[] {
    const childResources = childrenMap.get(parentUrn) || [];
    return childResources.map((resource) => ({
      resource,
      children: buildTree(resource.urn),
    }));
  }

  const rootResources = childrenMap.get(undefined) || [];
  const rootNodes = rootResources.map((resource) => ({
    resource,
    children: buildTree(resource.urn),
  }));

  return rootNodes;
}

export function groupResourcesByParent(
  resources: ISSTResource[]
): IResourceGroup[] {
  const groups = new Map<string | null, IResourceGroup>();
  const resourceMap = new Map<string, ISSTResource>();

  resources.forEach((resource) => {
    resourceMap.set(resource.urn, resource);
  });

  resources.forEach((resource) => {
    const parentUrn = resource.parent || null;
    const parentResource = parentUrn ? resourceMap.get(parentUrn) || null : null;

    if (!groups.has(parentUrn)) {
      groups.set(parentUrn, {
        parentUrn,
        parentResource,
        resources: [],
      });
    }

    groups.get(parentUrn)?.resources.push(resource);
  });

  return Array.from(groups.values()).sort((a, b) => {
    if (a.parentUrn === null) return -1;
    if (b.parentUrn === null) return 1;
    return (a.parentResource?.type || "").localeCompare(b.parentResource?.type || "");
  });
}

export function getResourceName(resource: ISSTResource): string {
  const urnParts = resource.urn.split("::");
  return urnParts[urnParts.length - 1] || resource.urn;
}

export function getResourceTypeDisplay(type: string): string {
  const parts = type.split(":");
  return parts[parts.length - 1] || type;
}

/**
 * Normalize category name to combine similar categories
 * e.g., "AWS Storage" -> "Storage", "SST Storage" -> "Storage"
 */
function normalizeCategoryName(category: string): string {
  // Remove "AWS " or "SST " prefix and normalize
  const normalized = category.replace(/^(AWS|SST)\s+/i, "").trim();
  
  // Map common variations to standard names
  const categoryMap: Record<string, string> = {
    "bucket": "Storage",
    "s3": "Storage",
    "function": "Function",
    "lambda": "Function",
    "apigateway": "API",
    "api": "API",
    "table": "Database",
    "dynamodb": "Database",
    "rds": "Database",
    "database": "Database",
    "queue": "Queue",
    "sqs": "Queue",
    "bus": "Event Bus",
    "eventbridge": "Event Bus",
    "topic": "Notification",
    "sns": "Notification",
    "stream": "Stream",
    "kinesis": "Stream",
    "cluster": "Container",
    "ecs": "Container",
    "distribution": "CDN",
    "cloudfront": "CDN",
    "domain": "DNS",
    "route53": "DNS",
    "certificate": "Certificate",
    "acm": "Certificate",
    "role": "IAM",
    "iam": "IAM",
    "policy": "IAM",
    "secret": "Secret",
    "secretsmanager": "Secret",
    "parameter": "Parameter",
    "ssm": "Parameter",
    "log": "Monitoring",
    "cloudwatch": "Monitoring",
    "alarm": "Monitoring",
    "metric": "Monitoring",
    "dashboard": "Monitoring",
    "vpc": "Network",
    "subnet": "Network",
    "network": "Network",
    "securitygroup": "Network",
    "redis": "Cache",
    "elasticache": "Cache",
    "cognito": "Auth",
    "userpool": "Auth",
    "identitypool": "Auth",
  };
  
  const lowerNormalized = normalized.toLowerCase();
  return categoryMap[lowerNormalized] || normalized;
}

/**
 * Get the provider level (SST or AWS) from resource type
 */
export function getResourceProvider(type: string): "SST" | "AWS" | "Other" {
  if (type.startsWith("sst:")) return "SST";
  if (type.startsWith("pulumi:aws:") || type.includes("aws:")) return "AWS";
  if (type.startsWith("pulumi:")) return "Other";
  return "Other";
}

/**
 * Get the sub-category (service type) from resource
 */
function getResourceSubCategory(
  type: string,
  resource?: ISSTResource
): string {
  // Direct pattern matches (most specific first)
  if (type.startsWith("sst:aws:Function")) return "Function";
  if (type.startsWith("sst:aws:ApiGateway")) return "API";
  if (type.startsWith("sst:aws:Bucket")) return "Storage";
  if (type.startsWith("sst:aws:Queue")) return "Queue";
  if (type.startsWith("sst:aws:Bus")) return "Event Bus";
  if (type.startsWith("sst:aws:Table")) return "Database";
  if (type.startsWith("sst:sst:LinkRef")) return "Link";
  if (type.startsWith("pulumi:")) return "Pulumi";

  // Parse type string for more patterns
  const typeParts = type.split(":");
  const lastPart = typeParts[typeParts.length - 1]?.toLowerCase() || "";
  const secondLastPart = typeParts[typeParts.length - 2]?.toLowerCase() || "";

  // AWS service patterns from type string
  if (type.includes("aws:")) {
    // Check for common AWS services in the type string
    if (lastPart.includes("function") || lastPart.includes("lambda")) return "Function";
    if (lastPart.includes("apigateway") || lastPart.includes("api")) return "API";
    if (lastPart.includes("bucket") || lastPart.includes("s3")) return "Storage";
    if (lastPart.includes("queue") || lastPart.includes("sqs")) return "Queue";
    if (lastPart.includes("table") || lastPart.includes("dynamodb")) return "Database";
    if (lastPart.includes("bus") || lastPart.includes("eventbridge")) return "Event Bus";
    if (lastPart.includes("topic") || lastPart.includes("sns")) return "Notification";
    if (lastPart.includes("stream") || lastPart.includes("kinesis")) return "Stream";
    if (lastPart.includes("cluster") || lastPart.includes("ecs")) return "Container";
    if (lastPart.includes("distribution") || lastPart.includes("cloudfront")) return "CDN";
    if (lastPart.includes("domain") || lastPart.includes("route53")) return "DNS";
    if (lastPart.includes("certificate") || lastPart.includes("acm")) return "Certificate";
    if (lastPart.includes("role") || lastPart.includes("iam")) return "IAM";
    if (lastPart.includes("policy")) return "IAM";
    if (lastPart.includes("secret") || lastPart.includes("secretsmanager")) return "Secret";
    if (lastPart.includes("parameter") || lastPart.includes("ssm")) return "Parameter";
    if (lastPart.includes("log") || lastPart.includes("cloudwatch")) return "Monitoring";
    if (lastPart.includes("alarm")) return "Monitoring";
    if (lastPart.includes("metric")) return "Monitoring";
    if (lastPart.includes("dashboard")) return "Monitoring";
    if (lastPart.includes("vpc") || lastPart.includes("subnet") || lastPart.includes("network")) return "Network";
    if (lastPart.includes("securitygroup")) return "Network";
    if (lastPart.includes("redis") || lastPart.includes("elasticache")) return "Cache";
    if (lastPart.includes("rds") || lastPart.includes("database")) return "Database";
    if (lastPart.includes("cognito") || lastPart.includes("userpool")) return "Auth";
    if (lastPart.includes("cognito") || lastPart.includes("identitypool")) return "Auth";
  }

  // Analyze outputs/inputs for service indicators
  if (resource) {
    const outputs = resource.outputs || {};
    const inputs = resource.inputs || {};
    const allData = { ...outputs, ...inputs };

    // Check for AWS service identifiers in outputs/inputs
    const dataString = JSON.stringify(allData).toLowerCase();
    
    if (dataString.includes("lambda") || dataString.includes("functionname")) return "Function";
    if (dataString.includes("apigateway") || dataString.includes("restapiid") || dataString.includes("apiendpoint")) return "API";
    if (dataString.includes("bucketname") || dataString.includes("s3bucket")) return "Storage";
    if (dataString.includes("queueurl") || dataString.includes("sqs")) return "Queue";
    if (dataString.includes("tablename") || dataString.includes("dynamodb")) return "Database";
    if (dataString.includes("eventbus") || dataString.includes("eventbridge")) return "Event Bus";
    if (dataString.includes("topicarn") || dataString.includes("sns")) return "Notification";
    if (dataString.includes("streamarn") || dataString.includes("kinesis")) return "Stream";
    if (dataString.includes("clusterarn") || dataString.includes("ecs")) return "Container";
    if (dataString.includes("distributionid") || dataString.includes("cloudfront")) return "CDN";
    if (dataString.includes("hostedzoneid") || dataString.includes("route53")) return "DNS";
    if (dataString.includes("certificatearn") || dataString.includes("acm")) return "Certificate";
    if (dataString.includes("rolearn") || dataString.includes("iamrole")) return "IAM";
    if (dataString.includes("policyarn")) return "IAM";
    if (dataString.includes("secretarn") || dataString.includes("secretsmanager")) return "Secret";
    if (dataString.includes("parameterarn") || dataString.includes("ssm")) return "Parameter";
    if (dataString.includes("loggroup") || dataString.includes("cloudwatch")) return "Monitoring";
    if (dataString.includes("alarmarn")) return "Monitoring";
    if (dataString.includes("vpcid") || dataString.includes("subnetid")) return "Network";
    if (dataString.includes("securitygroupid")) return "Network";
    if (dataString.includes("redis") || dataString.includes("elasticache")) return "Cache";
    if (dataString.includes("dbinstance") || dataString.includes("rds")) return "Database";
    if (dataString.includes("userpoolid") || dataString.includes("cognito")) return "Auth";
  }

  // Check URN for patterns
  if (resource?.urn) {
    const urnLower = resource.urn.toLowerCase();
    if (urnLower.includes("function") || urnLower.includes("lambda")) return "Function";
    if (urnLower.includes("api") || urnLower.includes("apigateway")) return "API";
    if (urnLower.includes("bucket") || urnLower.includes("s3")) return "Storage";
    if (urnLower.includes("queue") || urnLower.includes("sqs")) return "Queue";
    if (urnLower.includes("table") || urnLower.includes("dynamodb")) return "Database";
    if (urnLower.includes("bus") || urnLower.includes("eventbridge")) return "Event Bus";
  }

  // Generic patterns from type parts
  if (secondLastPart === "aws") {
    // It's an AWS resource but we couldn't categorize it specifically
    const category = `AWS ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`;
    return normalizeCategoryName(category);
  }

  if (type.startsWith("sst:")) {
    // It's an SST resource but we couldn't categorize it
    const category = `SST ${lastPart.charAt(0).toUpperCase() + lastPart.slice(1)}`;
    return normalizeCategoryName(category);
  }

  // Fallback to "Other" if we can't determine
  return "Other";
}

/**
 * Get hierarchical category: "SST > Function" or "AWS > Storage"
 * Level 1: SST or AWS
 * Level 2+: Sub-category (Function, Storage, etc.)
 */
export function getResourceTypeCategory(
  type: string,
  resource?: ISSTResource
): string {
  const provider = getResourceProvider(type);
  const subCategory = getResourceSubCategory(type, resource);
  
  if (provider === "Other") {
    return subCategory;
  }
  
  return `${provider} > ${subCategory}`;
}

