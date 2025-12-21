"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDataStore } from "@/stores/data-store";
import {
  getStorage,
  supportsFileSystemAccess,
  FileSystemStorageAdapter,
} from "@/services/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderOpen, Download, HardDrive } from "lucide-react";

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const { loadData, exportData, isLoaded, hasUnsavedChanges, markSaved } =
    useDataStore();
  const [showSetup, setShowSetup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const isSavingRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize storage on mount
  useEffect(() => {
    async function init() {
      const storage = getStorage();
      const data = await storage.read();

      if (data) {
        loadData(data);
      } else {
        // No existing data - show setup dialog if file system is supported
        if (supportsFileSystemAccess()) {
          setShowSetup(true);
        } else {
          // IndexedDB fallback - just start fresh
          loadData({
            version: "1.0.0",
            people: [],
            relationships: [],
            formTemplates: [],
            events: [],
            settings: {
              theme: "system",
              defaultView: "cards",
              sortBy: "firstName",
              sortOrder: "asc",
            },
          });
        }
      }
      setIsInitializing(false);
    }
    init();
  }, [loadData]);

  // Auto-save when data changes (with race condition protection)
  useEffect(() => {
    if (!isLoaded || !hasUnsavedChanges) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      // Prevent overlapping saves
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        const storage = getStorage();
        // Capture data at save time from store
        const data = exportData();
        const success = await storage.write(data);
        if (success) {
          markSaved();
        }
      } finally {
        isSavingRef.current = false;
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isLoaded, hasUnsavedChanges, exportData, markSaved]);

  const handleCreateNew = useCallback(async () => {
    if (supportsFileSystemAccess()) {
      const adapter = new FileSystemStorageAdapter();
      const handle = await adapter.requestFileAccess();
      if (handle) {
        loadData({
          version: "1.0.0",
          people: [],
          relationships: [],
          formTemplates: [],
          events: [],
          settings: {
            theme: "system",
            defaultView: "cards",
            sortBy: "firstName",
            sortOrder: "asc",
          },
        });
        setShowSetup(false);
      }
    }
  }, [loadData]);

  const handleOpenExisting = useCallback(async () => {
    if (supportsFileSystemAccess()) {
      const adapter = new FileSystemStorageAdapter();
      const handle = await adapter.openExistingFile();
      if (handle) {
        const data = await adapter.read();
        if (data) {
          loadData(data);
          setShowSetup(false);
        }
      }
    }
  }, [loadData]);

  const handleUseLocal = useCallback(() => {
    loadData({
      version: "1.0.0",
      people: [],
      relationships: [],
      formTemplates: [],
      events: [],
      settings: {
        theme: "system",
        defaultView: "cards",
        sortBy: "firstName",
        sortOrder: "asc",
      },
    });
    setShowSetup(false);
  }, [loadData]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {children}

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to Family Social</DialogTitle>
            <DialogDescription>
              Choose how you want to store your family data. You can always
              export your data later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={handleCreateNew}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                <span className="font-semibold">Create New File</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Save to a JSON file on your computer. You own your data.
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={handleOpenExisting}
            >
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <span className="font-semibold">Open Existing File</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Load data from an existing family-data.json file.
              </span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={handleUseLocal}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                <span className="font-semibold">Use Browser Storage</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Store data in your browser. Export anytime to backup.
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
