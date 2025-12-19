import type { FormTemplate } from "@/types";

// Simple LZ-based compression for shorter URLs
function compressString(input: string): string {
  const dict: Record<string, number> = {};
  const result: number[] = [];
  let dictSize = 256;
  let w = "";

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const wc = w + c;
    if (dict[wc] !== undefined) {
      w = wc;
    } else {
      result.push(w.length > 1 ? dict[w] : w.charCodeAt(0));
      dict[wc] = dictSize++;
      w = c;
    }
  }
  if (w) {
    result.push(w.length > 1 ? dict[w] : w.charCodeAt(0));
  }

  // Convert to binary string then base64
  const bytes = new Uint8Array(result.length * 2);
  for (let i = 0; i < result.length; i++) {
    bytes[i * 2] = (result[i] >> 8) & 0xff;
    bytes[i * 2 + 1] = result[i] & 0xff;
  }
  return btoa(String.fromCharCode(...bytes));
}

function decompressString(compressed: string): string {
  const bytes = Uint8Array.from(atob(compressed), c => c.charCodeAt(0));
  const codes: number[] = [];
  for (let i = 0; i < bytes.length; i += 2) {
    codes.push((bytes[i] << 8) | bytes[i + 1]);
  }

  const dict: string[] = [];
  for (let i = 0; i < 256; i++) {
    dict[i] = String.fromCharCode(i);
  }

  let w = String.fromCharCode(codes[0]);
  let result = w;
  let dictSize = 256;

  for (let i = 1; i < codes.length; i++) {
    const k = codes[i];
    const entry = k < dictSize ? dict[k] : w + w[0];
    result += entry;
    dict[dictSize++] = w + entry[0];
    w = entry;
  }
  return result;
}

// Encode form template to a URL-safe string
export function encodeFormTemplate(template: FormTemplate): string {
  const minified = {
    n: template.name,
    d: template.description,
    f: template.fields.map((f) => ({
      k: f.fieldKey,
      l: f.label,
      r: f.required ? 1 : 0,
      t: f.type,
    })),
  };
  const json = JSON.stringify(minified);

  // Try compression, fall back to simple encoding if it doesn't help
  try {
    const compressed = compressString(json);
    // Make URL-safe
    return "1" + compressed.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    // Fallback: simple base64 encoding
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return "0" + base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}

// Decode form template from URL-safe string
export function decodeFormTemplate(encoded: string): FormTemplate | null {
  try {
    const version = encoded[0];
    let base64 = encoded.slice(1).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let json: string;
    if (version === "1") {
      // Compressed format
      json = decompressString(base64);
    } else if (version === "0") {
      // Simple base64 format
      json = decodeURIComponent(escape(atob(base64)));
    } else {
      // Legacy format (no version prefix) - try old decoding
      let legacyBase64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
      while (legacyBase64.length % 4) {
        legacyBase64 += "=";
      }
      json = decodeURIComponent(atob(legacyBase64));
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

  try {
    const compressed = compressString(json);
    return "1" + compressed.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return "0" + base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}

// Decode person response data from import URL
export function decodePersonResponse(encoded: string): PersonResponseData | null {
  try {
    const version = encoded[0];
    let base64 = encoded.slice(1).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    let json: string;
    if (version === "1") {
      json = decompressString(base64);
    } else if (version === "0") {
      json = decodeURIComponent(escape(atob(base64)));
    } else {
      return null;
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
