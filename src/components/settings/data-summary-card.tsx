"use client";

import { useDataStore } from "@/stores/data-store";
import { getStorage } from "@/services/storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HardDrive, FolderOpen, Cloud } from "lucide-react";

export function DataSummaryCard() {
  const { people, relationships, formTemplates, events, lastSaved } = useDataStore();
  const storageType = getStorage().getStorageType();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" aria-hidden="true" />
          Data Summary
        </CardTitle>
        <CardDescription>
          Overview of your stored data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{people.length}</div>
            <div className="text-sm text-muted-foreground">People</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{relationships.length}</div>
            <div className="text-sm text-muted-foreground">Relationships</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{events.length}</div>
            <div className="text-sm text-muted-foreground">Events</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{formTemplates.length}</div>
            <div className="text-sm text-muted-foreground">Templates</div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-sm font-medium">Storage Type</div>
            <div className="text-sm text-muted-foreground">
              {storageType === "file" ? "Local File" : "Browser Storage"}
            </div>
          </div>
          <Badge variant={storageType === "file" ? "default" : "secondary"}>
            {storageType === "file" ? (
              <>
                <FolderOpen className="h-3 w-3 mr-1" aria-hidden="true" />
                File
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 mr-1" aria-hidden="true" />
                Browser
              </>
            )}
          </Badge>
        </div>

        {lastSaved && (
          <div className="text-sm text-muted-foreground">
            Last saved: {lastSaved.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
