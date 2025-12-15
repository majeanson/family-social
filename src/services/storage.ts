import { get, set, del } from "idb-keyval";
import type { DataStore } from "@/types";
import { DATA_STORE_VERSION } from "@/types";

const FILE_HANDLE_KEY = "family-data-file-handle";
const DATA_KEY = "family-data";

export interface StorageAdapter {
  isAvailable(): boolean;
  read(): Promise<DataStore | null>;
  write(data: DataStore): Promise<boolean>;
  clear(): Promise<void>;
  getStorageType(): "file" | "indexeddb";
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

// IndexedDB adapter (fallback for iOS and unsupported browsers)
class IndexedDBStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    return typeof window !== "undefined" && "indexedDB" in window;
  }

  getStorageType(): "indexeddb" {
    return "indexeddb";
  }

  async read(): Promise<DataStore | null> {
    try {
      const data = await get<DataStore>(DATA_KEY);
      return data || null;
    } catch {
      return null;
    }
  }

  async write(data: DataStore): Promise<boolean> {
    try {
      await set(DATA_KEY, data);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    await del(DATA_KEY);
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

export async function importFromFile(file: File): Promise<DataStore | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as DataStore;

    if (!data.version || !Array.isArray(data.people)) {
      throw new Error("Invalid data format");
    }

    return data;
  } catch {
    return null;
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
