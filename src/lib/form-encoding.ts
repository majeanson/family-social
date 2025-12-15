import type { FormTemplate } from "@/types";

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
  // Use base64 encoding that's URL-safe
  const base64 = btoa(encodeURIComponent(json));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Decode form template from URL-safe string
export function decodeFormTemplate(encoded: string): FormTemplate | null {
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const json = decodeURIComponent(atob(base64));
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
