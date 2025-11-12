import { useState, useEffect, useMemo } from "react";
import { FileText, Calendar, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

interface IStateFile {
  filename: string;
  displayName: string;
  timestamp?: Date;
  isDefault: boolean;
}

interface IStateFileSelectorProps {
  onFileChange: (filename: string) => void;
  currentFile: string;
}

async function fetchStateFileInfo(filename: string): Promise<{ time?: string; version?: string } | null> {
  try {
    const response = await fetch(`/misc/${filename}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      time: data.latest?.manifest?.time,
      version: data.latest?.manifest?.version,
    };
  } catch {
    return null;
  }
}

export function StateFileSelector({ onFileChange, currentFile }: IStateFileSelectorProps) {
  const [availableFiles, setAvailableFiles] = useState<IStateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState<{ time?: string; version?: string } | null>(null);

  useEffect(() => {
    async function loadAvailableFiles() {
      try {
        // Try to fetch a list of available state files
        // For now, we'll hardcode known files and check if they exist
        const knownFiles: IStateFile[] = [
          { filename: "state.json", displayName: "Current State", isDefault: true },
          {
            filename: "state-2025-11-09T15:59:05.json",
            displayName: "State (Nov 9, 2025)",
            isDefault: false,
          },
        ];

        const existingFiles: IStateFile[] = [];
        for (const file of knownFiles) {
          try {
            const info = await fetchStateFileInfo(file.filename);
            if (info) {
              existingFiles.push({
                ...file,
                timestamp: info.time ? new Date(info.time) : undefined,
              });
            }
          } catch {
            // Skip files that don't exist or can't be loaded
          }
        }

        setAvailableFiles(existingFiles);
      } catch (error) {
        console.error("Failed to load state files:", error);
        setAvailableFiles([]);
      } finally {
        setLoading(false);
      }
    }

    loadAvailableFiles();
  }, []);

  useEffect(() => {
    async function loadCurrentFileInfo() {
      const info = await fetchStateFileInfo(currentFile);
      setFileInfo(info);
    }
    loadCurrentFileInfo();
  }, [currentFile]);

  // Create Map for O(1) lookup instead of array.find() which is O(n)
  const filesMap = useMemo(() => {
    return new Map(availableFiles.map((f) => [f.filename, f]));
  }, [availableFiles]);

  const currentFileData = useMemo(() => {
    return filesMap.get(currentFile);
  }, [filesMap, currentFile]);

  if (loading) {
    return null;
  }

  if (availableFiles.length <= 1) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <CardTitle className="text-sm">State File</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Switch between different state snapshots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={currentFile} onValueChange={onFileChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableFiles.map((file) => (
              <SelectItem key={file.filename} value={file.filename}>
                <div className="flex items-center justify-between w-full">
                  <span>{file.displayName}</span>
                  {file.isDefault && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fileInfo && (
          <div className="text-xs text-muted-foreground space-y-1">
            {fileInfo.time && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(fileInfo.time).toLocaleString()}
                </span>
              </div>
            )}
            {fileInfo.version && (
              <div>Version: {fileInfo.version}</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

