import { useState, memo, useMemo } from "react";
import { Calendar, Code, FileText, Hash, Maximize2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import * as State from "@sst-toolkit/shared/utils/state";

interface IResourceDetailProps {
  resource: ISSTResource | null;
}

const DetailRow = memo(function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b last:border-0">
      <div className="text-xs font-medium text-muted-foreground truncate">{label}</div>
      <div className="text-xs break-words font-mono">{value}</div>
    </div>
  );
});

// Define important fields once outside component to avoid recreation
const IMPORTANT_FIELDS = [
  "action",
  "function",
  "principal",
  "sourceArn",
  "statementId",
  "roleArn",
  "policyArn",
  "bucketName",
  "queueUrl",
  "tableName",
  "apiEndpoint",
  "functionName",
  "eventSourceArn",
  "eventSourceToken",
  "functionUrlAuthType",
  "id",
  "arn",
  "name",
  "url",
  "endpoint",
] as const;

const IMPORTANT_FIELDS_SET = new Set(IMPORTANT_FIELDS);

const ResourceDetailContent = memo(function ResourceDetailContent({ resource }: { resource: ISSTResource }) {
  const category = useMemo(() => State.getResourceTypeCategory(resource.type, resource), [resource.type, resource]);
  
  // Extract important fields from outputs and inputs
  const allData = useMemo(() => ({ ...(resource.outputs || {}), ...(resource.inputs || {}) }), [resource.outputs, resource.inputs]);
  
  // Get important fields that exist in the data
  const importantData = useMemo(() => {
    const result: Array<{ key: string; value: unknown }> = [];
    IMPORTANT_FIELDS.forEach((field) => {
      const value = allData[field];
      if (value !== undefined && value !== null && value !== "") {
        result.push({ key: field, value });
      }
    });
    return result;
  }, [allData]);
  
  // Get remaining fields (not in important list) - use Set for O(1) lookup
  const remainingFields = useMemo(() => {
    return Object.entries(allData)
      .filter(([key]) => !IMPORTANT_FIELDS_SET.has(key))
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [allData]);

  return (
    <div className="space-y-0">
      <div className="space-y-0">
        <DetailRow label="URN" value={resource.urn} />
        <DetailRow label="Type" value={resource.type} />
        <DetailRow label="Category" value={category} />
        <DetailRow label="Custom" value={resource.custom ? "Yes" : "No"} />
        {resource.id && <DetailRow label="ID" value={resource.id} />}
        {resource.created && (
          <DetailRow
            label="Created"
            value={
              <span className="flex items-center gap-2">
                <Calendar className="size-3" />
                {new Date(resource.created).toLocaleString()}
              </span>
            }
          />
        )}
        {resource.modified && (
          <DetailRow
            label="Modified"
            value={
              <span className="flex items-center gap-2">
                <Calendar className="size-3" />
                {new Date(resource.modified).toLocaleString()}
              </span>
            }
          />
        )}
        {resource.parent && <DetailRow label="Parent" value={resource.parent} />}
        {resource.sourcePosition && (
          <DetailRow
            label="Source"
            value={
              <span className="flex items-center gap-2">
                <Code className="size-3" />
                {resource.sourcePosition}
              </span>
            }
          />
        )}
        
        {/* Important fields from outputs/inputs */}
        {importantData.length > 0 && (
          <>
            {importantData.map(({ key, value }) => (
              <DetailRow
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                value={
                  typeof value === "string" ? (
                    <span className="break-all">{value}</span>
                  ) : typeof value === "object" && value !== null ? (
                    <pre className="bg-muted p-1.5 rounded text-xs overflow-auto max-w-full whitespace-pre-wrap break-words">
                      <code>{JSON.stringify(value, null, 2)}</code>
                    </pre>
                  ) : (
                    String(value)
                  )
                }
              />
            ))}
          </>
        )}
        
        {/* Remaining fields (if any) */}
        {remainingFields.length > 0 && (
          <>
            {remainingFields.map(([key, value]) => (
              <DetailRow
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                value={
                  typeof value === "string" ? (
                    <span className="break-all">{value}</span>
                  ) : typeof value === "object" && value !== null ? (
                    <pre className="bg-muted p-1.5 rounded text-xs overflow-auto max-w-full whitespace-pre-wrap break-words">
                      <code>{JSON.stringify(value, null, 2)}</code>
                    </pre>
                  ) : (
                    String(value)
                  )
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

export function ResourceDetail({ resource }: IResourceDetailProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!resource) {
    return (
      <Card className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="size-12 mx-auto mb-4 opacity-50" />
          <p>Select a resource to view details</p>
        </div>
      </Card>
    );
  }

  const resourceName = State.getResourceName(resource);
  const typeDisplay = State.getResourceTypeDisplay(resource.type);

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Hash className="size-5" />
                {resourceName}
              </CardTitle>
              <CardDescription>{typeDisplay}</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                  <Maximize2 className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Hash className="size-5" />
                    {resourceName}
                  </DialogTitle>
                  <DialogDescription>{typeDisplay}</DialogDescription>
                </DialogHeader>
                <ResourceDetailContent resource={resource} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0">
          <ResourceDetailContent resource={resource} />
        </CardContent>
      </Card>
    </>
  );
}
