import type { FormTemplate } from "@/types";

// Simple and robust base64 encoding (no compression - more reliable)
function toBase64(str: string): string {
  // Use TextEncoder for proper UTF-8 handling
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Make base64 URL-safe
function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(urlSafe: string): string {
  let base64 = urlSafe.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
}

// Encode form template to a URL-safe string
export function encodeFormTemplate(template: FormTemplate): string {
  const minified = {
    n: template.name,
    d: template.description || "",
    f: template.fields.map((f) => ({
      k: f.fieldKey,
      l: f.label,
      r: f.required ? 1 : 0,
      t: f.type,
    })),
  };
  const json = JSON.stringify(minified);
  return toUrlSafe(toBase64(json));
}

// Decode form template from URL-safe string
export function decodeFormTemplate(encoded: string): FormTemplate | null {
  try {
    // Handle legacy formats with version prefix
    let toDecode = encoded;
    if (encoded[0] === "0" || encoded[0] === "1") {
      toDecode = encoded.slice(1);
    }

    const base64 = fromUrlSafe(toDecode);
    let json: string;

    try {
      // Try new UTF-8 decoding first
      json = fromBase64(base64);
    } catch {
      // Fall back to legacy decoding for old links
      try {
        json = decodeURIComponent(escape(atob(base64)));
      } catch {
        json = decodeURIComponent(atob(base64));
      }
    }

    const minified = JSON.parse(json);

    return {
      id: "shared",
      name: minified.n,
      description: minified.d,
      fields: minified.f.map((f: { k: string; l: string; r: number; t: string }, idx: number) => ({
        id: `field-${idx}`,
        fieldKey: f.k,
        label: f.l,
        required: f.r === 1,
        order: idx,
        type: f.t,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to decode form template:", error);
    return null;
  }
}

// Generate a shareable URL for a form
export function generateShareableUrl(template: FormTemplate, baseUrl?: string): string {
  const encoded = encodeFormTemplate(template);
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/share/form?data=${encoded}`;
}

// Person response data structure (minimal for URL encoding)
export interface PersonResponseData {
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  photo?: string;
  notes?: string;
}

// Encode person response data for import URL
export function encodePersonResponse(data: PersonResponseData): string {
  // Use very short keys to minimize URL length
  const minified: Record<string, string> = { f: data.firstName };
  if (data.lastName) minified.l = data.lastName;
  if (data.nickname) minified.n = data.nickname;
  if (data.email) minified.e = data.email;
  if (data.phone) minified.p = data.phone;
  if (data.birthday) minified.b = data.birthday;
  if (data.notes) minified.o = data.notes;
  // Skip photo - too large for URLs

  const json = JSON.stringify(minified);
  return toUrlSafe(toBase64(json));
}

// Decode person response data from import URL
export function decodePersonResponse(encoded: string): PersonResponseData | null {
  try {
    // Handle legacy formats with version prefix
    let toDecode = encoded;
    if (encoded[0] === "0" || encoded[0] === "1") {
      toDecode = encoded.slice(1);
    }

    const base64 = fromUrlSafe(toDecode);
    let json: string;

    try {
      // Try new UTF-8 decoding first
      json = fromBase64(base64);
    } catch {
      // Fall back to legacy decoding for old links
      try {
        json = decodeURIComponent(escape(atob(base64)));
      } catch {
        json = decodeURIComponent(atob(base64));
      }
    }

    const minified = JSON.parse(json);

    return {
      firstName: minified.f,
      lastName: minified.l,
      nickname: minified.n,
      email: minified.e,
      phone: minified.p,
      birthday: minified.b,
      notes: minified.o,
    };
  } catch (error) {
    console.error("Failed to decode person response:", error);
    return null;
  }
}

// Generate an import URL that auto-adds a person when clicked
export function generateImportUrl(data: PersonResponseData, baseUrl?: string): string {
  const encoded = encodePersonResponse(data);
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/import?data=${encoded}`;
}
