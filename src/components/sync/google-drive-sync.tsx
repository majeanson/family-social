"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Upload,
  Download,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  isGoogleDriveConfigured,
  loadGoogleApis,
  initTokenClient,
  tryRestoreToken,
  isAuthenticated,
  requestAccessWithConsent,
  signOut,
  downloadFromDrive,
  uploadToDrive,
  getLastSyncTime,
} from "@/services/google-drive";

type SyncStatus = "idle" | "syncing" | "uploading" | "downloading" | "error";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// Exponential backoff retry utility
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  initialDelay: number = INITIAL_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth errors (they need user intervention)
      if (lastError.message.includes("auth") || lastError.message.includes("401")) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

export function GoogleDriveSync() {
  const { exportData, loadData, hasUnsavedChanges } = useDataStore();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google APIs
  useEffect(() => {
    async function init() {
      const configured = isGoogleDriveConfigured();
      setIsConfigured(configured);

      if (!configured) {
        setIsLoading(false);
        return;
      }

      try {
        await loadGoogleApis();

        // Try to restore existing token
        const hasToken = tryRestoreToken();
        if (hasToken && isAuthenticated()) {
          setIsConnected(true);
          // Get last sync time
          const syncTime = await getLastSyncTime();
          setLastSyncTime(syncTime);
        }

        // Initialize token client for future auth
        initTokenClient(
          () => {
            setIsConnected(true);
            setError(null);
            toast.success("Connected to Google Drive!");
          },
          (err) => {
            setError(err);
            toast.error("Failed to connect to Google Drive");
          }
        );
      } catch (err) {
        console.error("Failed to initialize Google APIs:", err);
        setError("Failed to load Google APIs");
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const handleConnect = useCallback(() => {
    requestAccessWithConsent();
  }, []);

  const handleDisconnect = useCallback(() => {
    signOut();
    setIsConnected(false);
    setLastSyncTime(null);
    toast.success("Disconnected from Google Drive");
  }, []);

  const handleUpload = useCallback(async () => {
    setSyncStatus("uploading");
    setError(null);

    try {
      const data = exportData();
      const success = await withRetry(async () => {
        const result = await uploadToDrive(data);
        if (!result) throw new Error("Upload failed");
        return result;
      });

      if (success) {
        setLastSyncTime(new Date());
        toast.success("Data uploaded to Google Drive!");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload data";
      setError(message.includes("auth") ? "Please reconnect to Google Drive" : "Failed to upload data. Please try again.");
      toast.error("Failed to upload to Google Drive");
    } finally {
      setSyncStatus("idle");
    }
  }, [exportData]);

  const handleDownload = useCallback(async () => {
    setSyncStatus("downloading");
    setError(null);

    try {
      const data = await withRetry(() => downloadFromDrive());

      if (data) {
        loadData(data);
        setLastSyncTime(new Date());
        toast.success("Data downloaded from Google Drive!");
      } else {
        toast.info("No data found in Google Drive");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download data";
      setError(message.includes("auth") ? "Please reconnect to Google Drive" : "Failed to download data. Please try again.");
      toast.error("Failed to download from Google Drive");
    } finally {
      setSyncStatus("idle");
    }
  }, [loadData]);

  const handleSync = useCallback(async () => {
    setSyncStatus("syncing");
    setError(null);

    try {
      const driveTime = await withRetry(() => getLastSyncTime());
      const localData = exportData();

      if (!driveTime) {
        // No data in Drive, upload local
        await withRetry(async () => {
          const result = await uploadToDrive(localData);
          if (!result) throw new Error("Upload failed");
          return result;
        });
        toast.success("Data synced to Google Drive!");
      } else if (hasUnsavedChanges) {
        // Local changes, upload
        await withRetry(async () => {
          const result = await uploadToDrive(localData);
          if (!result) throw new Error("Upload failed");
          return result;
        });
        toast.success("Local changes synced to Google Drive!");
      } else {
        // Download from Drive
        const driveData = await withRetry(() => downloadFromDrive());
        if (driveData) {
          loadData(driveData);
          toast.success("Data synced from Google Drive!");
        }
      }

      setLastSyncTime(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message.includes("auth") ? "Please reconnect to Google Drive" : "Sync failed. Please try again.");
      toast.error("Failed to sync with Google Drive");
    } finally {
      setSyncStatus("idle");
    }
  }, [exportData, loadData, hasUnsavedChanges]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-muted-foreground" />
            Google Drive Sync
          </CardTitle>
          <CardDescription>
            Cloud sync is not configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-4 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              To enable Google Drive sync, set the <code className="bg-muted px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> environment variable.
            </p>
            <p className="text-xs text-muted-foreground">
              You&apos;ll need to create a Google Cloud project and OAuth credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Google Drive Sync
          {isConnected && (
            <Badge variant="default" className="ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your data is synced with Google Drive"
            : "Connect to sync your data across devices"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {isConnected ? (
          <>
            {lastSyncTime && (
              <p className="text-sm text-muted-foreground">
                Last synced: {lastSyncTime.toLocaleString()}
              </p>
            )}

            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                variant="default"
                onClick={handleSync}
                disabled={syncStatus !== "idle"}
              >
                {syncStatus === "syncing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync
              </Button>

              <Button
                variant="outline"
                onClick={handleUpload}
                disabled={syncStatus !== "idle"}
              >
                {syncStatus === "uploading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload
              </Button>

              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={syncStatus !== "idle"}
              >
                {syncStatus === "downloading" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} className="w-full">
            <Cloud className="mr-2 h-4 w-4" />
            Connect to Google Drive
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Your data is stored in a private app folder that only you can access.
        </p>
      </CardContent>
    </Card>
  );
}
