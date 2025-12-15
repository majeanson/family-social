import { get, set, del } from "idb-keyval";
import type { DataStore } from "@/types";
import { DATA_STORE_VERSION } from "@/types";
import { validateDataStore, hasValidStructure } from "@/lib/validation";

const FILE_HANDLE_KEY = "family-data-file-handle";
const DATA_KEY = "family-data";

// Storage error types for better handling
export type StorageErrorType = "quota_exceeded" | "private_browsing" | "permission_denied" | "unknown";

export interface StorageError {
  type: StorageErrorType;
  message: string;
}

export interface StorageAdapter {
  isAvailable(): boolean;
  read(): Promise<DataStore | null>;
  write(data: DataStore): Promise<boolean>;
  clear(): Promise<void>;
  getStorageType(): "file" | "indexeddb";
  getLastError?(): StorageError | null;
}

// Check if File System Access API is available
export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== "undefined" &&
    "showSaveFilePicker" in window &&
    "showOpenFilePicker" in window
  );
}

// File System Access API adapter
class FileSystemStorageAdapter implements StorageAdapter {
  private fileHandle: FileSystemFileHandle | null = null;

  isAvailable(): boolean {
    return supportsFileSystemAccess();
  }

  getStorageType(): "file" {
    return "file";
  }

  async requestFileAccess(): Promise<FileSystemFileHandle | null> {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "family-data.json",
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      this.fileHandle = handle;
      await set(FILE_HANDLE_KEY, handle);
      return handle;
    } catch {
      return null;
    }
  }

  async openExistingFile(): Promise<FileSystemFileHandle | null> {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON Files",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      this.fileHandle = handle;
      await set(FILE_HANDLE_KEY, handle);
      return handle;
    } catch {
      return null;
    }
  }

  async getStoredHandle(): Promise<FileSystemFileHandle | null> {
    if (this.fileHandle) return this.fileHandle;

    try {
      const handle = await get<FileSystemFileHandle>(FILE_HANDLE_KEY);
      if (!handle) return null;

      const permission = await handle.queryPermission({ mode: "readwrite" });
      if (permission === "granted") {
        this.fileHandle = handle;
        return handle;
      }

      const newPermission = await handle.requestPermission({ mode: "readwrite" });
      if (newPermission === "granted") {
        this.fileHandle = handle;
        return handle;
      }

      return null;
    } catch {
      return null;
    }
  }

  async hasStoredHandle(): Promise<boolean> {
    const handle = await get<FileSystemFileHandle>(FILE_HANDLE_KEY);
    return !!handle;
  }

  async read(): Promise<DataStore | null> {
    try {
      const handle = await this.getStoredHandle();
      if (!handle) return null;

      const file = await handle.getFile();
      const text = await file.text();
      const data = JSON.parse(text) as DataStore;

      if (data.version !== DATA_STORE_VERSION) {
        console.warn("Data version mismatch, may need migration");
      }

      return data;
    } catch {
      return null;
    }
  }

  async write(data: DataStore): Promise<boolean> {
    try {
      const handle = await this.getStoredHandle();
      if (!handle) return false;

      const writable = await handle.createWritable();
      const json = JSON.stringify(data, null, 2);
      await writable.write(json);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    this.fileHandle = null;
    await del(FILE_HANDLE_KEY);
  }
}

// Detect specific storage error types
function detectStorageError(error: unknown): StorageError {
  if (error instanceof DOMException) {
    // QuotaExceededError
    if (error.name === "QuotaExceededError" || error.code === 22) {
      return {
        type: "quota_exceeded",
        message: "Storage quota exceeded. Please delete some data or export and clear old data.",
      };
    }
    // Private browsing mode in some browsers
    if (error.name === "InvalidStateError") {
      return {
        type: "private_browsing",
        message: "Storage is unavailable in private browsing mode. Please use a regular browser window.",
      };
    }
    // Permission denied
    if (error.name === "NotAllowedError") {
      return {
        type: "permission_denied",
        message: "Storage access was denied. Please check your browser settings.",
      };
    }
  }
  return {
    type: "unknown",
    message: "Failed to access storage. Please try again.",
  };
}

// IndexedDB adapter (fallback for iOS and unsupported browsers)
class IndexedDBStorageAdapter implements StorageAdapter {
  private lastError: StorageError | null = null;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }

  getStorageType(): "indexeddb" {
    return "indexeddb";
  }

  getLastError(): StorageError | null {
    return this.lastError;
  }

  async read(): Promise<DataStore | null> {
    try {
      this.lastError = null;
      const data = await get<DataStore>(DATA_KEY);
      return data || null;
    } catch (error) {
      this.lastError = detectStorageError(error);
      console.error("IndexedDB read error:", this.lastError.message);
      return null;
    }
  }

  async write(data: DataStore): Promise<boolean> {
    try {
      this.lastError = null;
      await set(DATA_KEY, data);
      return true;
    } catch (error) {
      this.lastError = detectStorageError(error);
      console.error("IndexedDB write error:", this.lastError.message);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      this.lastError = null;
      await del(DATA_KEY);
    } catch (error) {
      this.lastError = detectStorageError(error);
      console.error("IndexedDB clear error:", this.lastError.message);
    }
  }
}

// Factory to create the appropriate adapter
export function createStorageAdapter(): StorageAdapter {
  if (supportsFileSystemAccess()) {
    return new FileSystemStorageAdapter();
  }
  return new IndexedDBStorageAdapter();
}

// Export/Import utilities (work universally)
export function exportToJSON(data: DataStore): string {
  return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
}

export function downloadJSON(data: DataStore, filename = "family-data.json"): void {
  const json = exportToJSON(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  data?: DataStore;
  error?: string;
}

export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, error: "Invalid JSON format" };
    }

    // Quick structure check first
    if (!hasValidStructure(parsed)) {
      return { success: false, error: "Missing required fields (version, people)" };
    }

    // Full validation with Zod
    const validation = validateDataStore(parsed);

    if (!validation.success) {
      return { success: false, error: validation.error };
    }

    return { success: true, data: validation.data as DataStore };
  } catch {
    return { success: false, error: "Failed to read file" };
  }
}

// Singleton instance
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = createStorageAdapter();
  }
  return storageInstance;
}

// Re-export FileSystemStorageAdapter for direct file handle operations
export { FileSystemStorageAdapter };
