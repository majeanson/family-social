/**
 * Response parsing utilities for importing form responses
 */

import { v4 as uuid } from "uuid";
import type { PersonFormData, CustomField } from "@/types";
import { isValidEmail, isValidPhone, isValidBirthday } from "./utils";

// Known field keys (lowercase) for text format
const KNOWN_TEXT_FIELD_KEYS = new Set([
  "first name", "firstname", "name",
  "last name", "lastname",
  "nickname", "nick",
  "email", "e-mail",
  "phone", "telephone", "mobile",
  "birthday", "birth date", "birthdate",
  "photo",
  "notes", "dietary restrictions",
]);

// Known field keys for JSON format (case-insensitive matching)
const KNOWN_JSON_FIELD_KEYS = new Set([
  "first name", "firstname",
  "last name", "lastname",
  "nickname",
  "email",
  "phone",
  "birthday", "birth date", "birthdate",
  "photo",
  "notes", "dietary restrictions",
]);

/**
 * Parse text format response (from Copy Text / Native Share)
 */
export function parseTextResponse(text: string): PersonFormData | null {
  try {
    const lines = text.split("\n");
    const data: Record<string, string> = {};
    const originalKeys: Record<string, string> = {};

    for (const line of lines) {
      // Skip empty lines, separators, and headers
      if (!line.trim() || line.startsWith("---") || line.startsWith("📋") ||
          line.startsWith("Submitted:") || line.startsWith("Sent via")) {
        continue;
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const originalKey = line.substring(0, colonIndex).trim();
        const key = originalKey.toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        if (value && value !== "(not provided)") {
          data[key] = value;
          originalKeys[key] = originalKey;
        }
      }
    }

    // Map common field names
    const firstName = data["first name"] || data["firstname"] || data["name"]?.split(" ")[0] || "";
    if (!firstName) return null;

    // Extract custom fields (fields not in known keys)
    const customFields: CustomField[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (!KNOWN_TEXT_FIELD_KEYS.has(key)) {
        customFields.push({
          id: uuid(),
          label: originalKeys[key] || key,
          value,
          type: "text",
        });
      }
    }

    // Validate and sanitize fields
    const email = data["email"] || data["e-mail"] || "";
    const phone = data["phone"] || data["telephone"] || data["mobile"] || "";
    const birthday = data["birthday"] || data["birth date"] || data["birthdate"] || "";

    return {
      firstName,
      lastName: data["last name"] || data["lastname"] || data["name"]?.split(" ").slice(1).join(" ") || "",
      nickname: data["nickname"] || data["nick"] || "",
      email: isValidEmail(email) ? email : "",
      phone: isValidPhone(phone) ? phone : "",
      birthday: isValidBirthday(birthday) ? birthday : "",
      notes: data["notes"] || data["dietary restrictions"] || "",
      tags: [],
      customFields,
    };
  } catch {
    return null;
  }
}

/**
 * Parse JSON format response
 */
export function parseJSONResponse(json: string): PersonFormData | null {
  try {
    const parsed = JSON.parse(json);
    const responses = parsed.responses || parsed;

    const firstName = responses["First Name"] || responses["firstName"] || responses.firstName || "";
    if (!firstName) return null;

    // Extract custom fields (fields not in known keys)
    const customFields: CustomField[] = [];
    for (const [key, value] of Object.entries(responses)) {
      const keyLower = key.toLowerCase();
      if (!KNOWN_JSON_FIELD_KEYS.has(keyLower) && typeof value === "string" && value.trim()) {
        customFields.push({
          id: uuid(),
          label: key,
          value: value,
          type: "text",
        });
      }
    }

    // Validate and sanitize fields
    const email = responses["Email"] || responses["email"] || "";
    const phone = responses["Phone"] || responses["phone"] || "";
    const birthday = responses["Birthday"] || responses["birthday"] || responses["Birth Date"] || "";

    return {
      firstName,
      lastName: responses["Last Name"] || responses["lastName"] || responses.lastName || "",
      nickname: responses["Nickname"] || responses["nickname"] || "",
      email: isValidEmail(email) ? email : "",
      phone: isValidPhone(phone) ? phone : "",
      birthday: isValidBirthday(birthday) ? birthday : "",
      notes: responses["Notes"] || responses["notes"] || responses["Dietary Restrictions"] || "",
      tags: [],
      customFields,
    };
  } catch {
    return null;
  }
}

/**
 * Try to parse a response string (tries JSON first, then text format)
 */
export function parseResponse(input: string): PersonFormData | null {
  // Try JSON first
  let result = parseJSONResponse(input);
  if (result) return result;

  // Fall back to text format
  return parseTextResponse(input);
}
