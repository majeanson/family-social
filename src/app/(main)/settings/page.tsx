"use client";

import { useRef } from "react";
import { useDataStore } from "@/stores/data-store";
import {
  downloadJSON,
  importFromFile,
  getStorage,
  supportsFileSystemAccess,
  FileSystemStorageAdapter,
} from "@/services/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Download,
  Upload,
  FolderOpen,
  Trash2,
  HardDrive,
  Cloud,
  AlertTriangle,
} from "lucide-react";
import type { AppSettings } from "@/types";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    exportData,
    loadData,
    resetData,
    people,
    relationships,
    formTemplates,
    lastSaved,
  } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    downloadJSON(data);
    toast.success("Data exported successfully!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await importFromFile(file);
    if (data) {
      loadData(data);
      toast.success("Data imported successfully!");
    } else {
      toast.error("Failed to import data. Please check the file format.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChangeFile = async () => {
    if (supportsFileSystemAccess()) {
      const adapter = new FileSystemStorageAdapter();
      const handle = await adapter.openExistingFile();
      if (handle) {
        const data = await adapter.read();
        if (data) {
          loadData(data);
          toast.success("Switched to new data file!");
        }
      }
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all data? This action cannot be undone."
      )
    ) {
      resetData();
      toast.success("All data has been reset");
    }
  };

  const storageType = getStorage().getStorageType();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and data
        </p>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Data Summary
          </CardTitle>
          <CardDescription>
            Overview of your stored data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{people.length}</div>
              <div className="text-sm text-muted-foreground">People</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{relationships.length}</div>
              <div className="text-sm text-muted-foreground">Relationships</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{formTemplates.length}</div>
              <div className="text-sm text-muted-foreground">Form Templates</div>
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
                  <FolderOpen className="h-3 w-3 mr-1" />
                  File
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
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

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Customize how data is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(value: AppSettings["defaultView"]) =>
                  updateSettings({ defaultView: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="graph">Graph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Sort</Label>
              <Select
                value={settings.sortBy}
                onValueChange={(value: AppSettings["sortBy"]) =>
                  updateSettings({ sortBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="createdAt">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or reset your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>

          {supportsFileSystemAccess() && (
            <Button
              variant="outline"
              onClick={handleChangeFile}
              className="w-full"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Different File
            </Button>
          )}

          <Separator />

          <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your data including people,
                  relationships, and form templates.
                </p>
                <Button variant="destructive" size="sm" onClick={handleReset}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
