/**
 * Google Drive Sync Service
 *
 * Uses Google Identity Services for OAuth and Google Drive REST API for file operations.
 * Stores a single JSON file in the app's Google Drive folder.
 */

import type { DataStore } from "@/types";

// Configuration
const SCOPES = "https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";
const FILE_NAME = "famolo-data.json";

// Types for Google API
interface TokenClient {
  requestAccessToken: (config?: { prompt?: string }) => void;
  callback: (response: TokenResponse) => void;
}

interface TokenResponse {
  access_token: string;
  error?: string;
  expires_in: number;
}

interface GoogleFile {
  id: string;
  name: string;
  modifiedTime: string;
}

// State
let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiresAt: number = 0;
let isGoogleApiLoaded = false;
let isGisLoaded = false;

// Get Client ID from environment
function getClientId(): string | null {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
}

// Check if Google Drive sync is configured
export function isGoogleDriveConfigured(): boolean {
  return !!getClientId();
}

// Load Google API scripts dynamically
export async function loadGoogleApis(): Promise<boolean> {
  const clientId = getClientId();
  if (!clientId) {
    console.warn("Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment.");
    return false;
  }

  // Load Google API client
  if (!isGoogleApiLoaded) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load("client", async () => {
          try {
            await window.gapi.client.init({
              discoveryDocs: [DISCOVERY_DOC],
            });
            isGoogleApiLoaded = true;
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Load Google Identity Services
  if (!isGisLoaded) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        isGisLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return true;
}

// Initialize the token client
export function initTokenClient(onSuccess: () => void, onError: (error: string) => void): void {
  const clientId = getClientId();
  if (!clientId || !isGisLoaded) return;

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (response: TokenResponse) => {
      if (response.error) {
        onError(response.error);
        return;
      }
      accessToken = response.access_token;
      tokenExpiresAt = Date.now() + response.expires_in * 1000;
      // Store token in localStorage for persistence
      localStorage.setItem("google_drive_token", JSON.stringify({
        token: accessToken,
        expiresAt: tokenExpiresAt,
      }));
      onSuccess();
    },
  });
}

// Try to restore token from localStorage
export function tryRestoreToken(): boolean {
  try {
    const stored = localStorage.getItem("google_drive_token");
    if (stored) {
      const { token, expiresAt } = JSON.parse(stored);
      if (expiresAt > Date.now() + 60000) { // At least 1 minute left
        accessToken = token;
        tokenExpiresAt = expiresAt;
        return true;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return false;
}

// Check if we have a valid token
export function isAuthenticated(): boolean {
  return !!accessToken && tokenExpiresAt > Date.now();
}

// Request access token (shows consent popup)
export function requestAccess(): void {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

// Request access with consent prompt
export function requestAccessWithConsent(): void {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  }
}

// Sign out
export function signOut(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null;
      tokenExpiresAt = 0;
      localStorage.removeItem("google_drive_token");
    });
  }
}

// Find the data file in Google Drive
async function findDataFile(): Promise<GoogleFile | null> {
  if (!accessToken) return null;

  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${FILE_NAME}'&fields=files(id,name,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to search files");

    const data = await response.json();
    return data.files?.[0] || null;
  } catch (error) {
    console.error("Error finding data file:", error);
    return null;
  }
}

// Download data from Google Drive
export async function downloadFromDrive(): Promise<DataStore | null> {
  if (!accessToken) return null;

  try {
    const file = await findDataFile();
    if (!file) return null;

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to download file");

    const data = await response.json();
    return data as DataStore;
  } catch (error) {
    console.error("Error downloading from Drive:", error);
    return null;
  }
}

// Upload data to Google Drive
export async function uploadToDrive(data: DataStore): Promise<boolean> {
  if (!accessToken) return false;

  try {
    const existingFile = await findDataFile();
    const metadata = {
      name: FILE_NAME,
      mimeType: "application/json",
      parents: existingFile ? undefined : ["appDataFolder"],
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append(
      "file",
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    );

    const url = existingFile
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

    const response = await fetch(url, {
      method: existingFile ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) throw new Error("Failed to upload file");

    return true;
  } catch (error) {
    console.error("Error uploading to Drive:", error);
    return false;
  }
}

// Get last sync time from Drive
export async function getLastSyncTime(): Promise<Date | null> {
  if (!accessToken) return null;

  try {
    const file = await findDataFile();
    if (!file) return null;
    return new Date(file.modifiedTime);
  } catch {
    return null;
  }
}

// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: { discoveryDocs: string[] }) => Promise<void>;
      };
    };
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
          }) => TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}
