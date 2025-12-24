import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { RELATIONSHIP_CONFIG, type RelationshipType } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get relationship color from settings or default config
 */
export function getRelationshipColor(
  type: RelationshipType,
  customColors?: Record<string, string>
): string {
  if (customColors && customColors[type]) {
    return customColors[type];
  }
  return RELATIONSHIP_CONFIG[type]?.color || "bg-gray-400";
}

/**
 * Get hex color for relationship from settings or default
 */
export function getRelationshipHex(
  type: RelationshipType,
  customColors?: Record<string, string>
): string {
  const colorClass = getRelationshipColor(type, customColors);
  return getTailwindHex(colorClass);
}

/**
 * Get initials from first and last name
 */
export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
}

/**
 * Tailwind color class to hex color mapping
 * Used for canvas/SVG elements that don't support Tailwind classes
 */
export const TAILWIND_COLORS: Record<string, string> = {
  // Blues
  "blue-300": "#93c5fd",
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  // Pinks
  "pink-400": "#f472b6",
  "pink-500": "#ec4899",
  // Purples
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  // Indigos
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  // Violets
  "violet-500": "#8b5cf6",
  // Cyans
  "cyan-500": "#06b6d4",
  // Teals
  "teal-500": "#14b8a6",
  // Greens
  "green-500": "#22c55e",
  // Emeralds
  "emerald-500": "#10b981",
  // Ambers
  "amber-500": "#f59e0b",
  // Oranges
  "orange-500": "#f97316",
  // Roses
  "rose-500": "#f43f5e",
  // Reds
  "red-500": "#ef4444",
  // Grays
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
};

/**
 * Get hex color from Tailwind class name
 */
export function getTailwindHex(colorClass: string): string {
  const color = colorClass.replace("bg-", "");
  return TAILWIND_COLORS[color] || TAILWIND_COLORS["gray-400"];
}

/**
 * Family color palette for distinct family groups
 * Re-exported from types for convenience
 */
export { DEFAULT_FAMILY_COLORS as FAMILY_COLORS } from "@/types/data-store";
export type { FamilyColorConfig } from "@/types/data-store";

/**
 * All available color options for customization
 */
export const COLOR_OPTIONS = [
  { name: "Blue", bg: "bg-blue-500", hex: "#3b82f6", light: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-800" },
  { name: "Emerald", bg: "bg-emerald-500", hex: "#10b981", light: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800" },
  { name: "Purple", bg: "bg-purple-500", hex: "#a855f7", light: "bg-purple-50 dark:bg-purple-950/50", border: "border-purple-200 dark:border-purple-800" },
  { name: "Orange", bg: "bg-orange-500", hex: "#f97316", light: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800" },
  { name: "Pink", bg: "bg-pink-500", hex: "#ec4899", light: "bg-pink-50 dark:bg-pink-950/50", border: "border-pink-200 dark:border-pink-800" },
  { name: "Cyan", bg: "bg-cyan-500", hex: "#06b6d4", light: "bg-cyan-50 dark:bg-cyan-950/50", border: "border-cyan-200 dark:border-cyan-800" },
  { name: "Amber", bg: "bg-amber-500", hex: "#f59e0b", light: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800" },
  { name: "Rose", bg: "bg-rose-500", hex: "#f43f5e", light: "bg-rose-50 dark:bg-rose-950/50", border: "border-rose-200 dark:border-rose-800" },
  { name: "Indigo", bg: "bg-indigo-500", hex: "#6366f1", light: "bg-indigo-50 dark:bg-indigo-950/50", border: "border-indigo-200 dark:border-indigo-800" },
  { name: "Teal", bg: "bg-teal-500", hex: "#14b8a6", light: "bg-teal-50 dark:bg-teal-950/50", border: "border-teal-200 dark:border-teal-800" },
  { name: "Red", bg: "bg-red-500", hex: "#ef4444", light: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800" },
  { name: "Green", bg: "bg-green-500", hex: "#22c55e", light: "bg-green-50 dark:bg-green-950/50", border: "border-green-200 dark:border-green-800" },
];

/**
 * Relationship color options (simpler, just bg class needed)
 */
export const RELATIONSHIP_COLOR_OPTIONS = [
  { name: "Blue", bg: "bg-blue-500" },
  { name: "Blue Light", bg: "bg-blue-400" },
  { name: "Blue Dark", bg: "bg-blue-600" },
  { name: "Pink", bg: "bg-pink-500" },
  { name: "Pink Light", bg: "bg-pink-400" },
  { name: "Purple", bg: "bg-purple-500" },
  { name: "Purple Light", bg: "bg-purple-400" },
  { name: "Indigo", bg: "bg-indigo-500" },
  { name: "Indigo Light", bg: "bg-indigo-400" },
  { name: "Violet", bg: "bg-violet-500" },
  { name: "Cyan", bg: "bg-cyan-500" },
  { name: "Teal", bg: "bg-teal-500" },
  { name: "Green", bg: "bg-green-500" },
  { name: "Amber", bg: "bg-amber-500" },
  { name: "Orange", bg: "bg-orange-500" },
  { name: "Rose", bg: "bg-rose-500" },
  { name: "Red", bg: "bg-red-500" },
  { name: "Gray", bg: "bg-gray-500" },
];

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * Accepts various formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  // Remove all whitespace and common separators for length check
  const digits = phone.replace(/[\s\-\(\)\.\+]/g, "");
  // Must have between 7 and 15 digits (international range)
  if (digits.length < 7 || digits.length > 15) return false;
  // Must contain only digits after stripping separators
  return /^\d+$/.test(digits);
}

/**
 * Validate birthday (not in the future, reasonable range)
 */
export function isValidBirthday(birthday: string): { valid: boolean; error?: string } {
  if (!birthday) return { valid: true }; // Optional field

  const date = new Date(birthday);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (date > today) {
    return { valid: false, error: "Birthday cannot be in the future" };
  }

  // Reasonable age range (150 years)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return { valid: false, error: "Please enter a valid birthday" };
  }

  return { valid: true };
}

/**
 * Sanitize a string for use in filenames
 * Removes/replaces characters that are problematic in filenames
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // Remove illegal characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w\-]/g, "") // Remove non-word characters except hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 100) // Limit length
    || "file"; // Fallback if empty
}

/**
 * Simple fuzzy matching - checks if all characters of query appear in text in order
 * Returns match score (higher is better) or -1 if no match
 */
export function fuzzyMatch(text: string, query: string): number {
  if (!query) return 1;
  if (!text) return -1;

  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 100;

  // Contains match gets good score
  if (textLower.includes(queryLower)) {
    // Bonus if at start of word
    if (textLower.startsWith(queryLower)) return 90;
    if (textLower.includes(` ${queryLower}`)) return 85;
    return 80;
  }

  // Fuzzy match - all characters in order
  let textIndex = 0;
  let queryIndex = 0;
  let score = 0;
  let consecutiveBonus = 0;

  while (textIndex < textLower.length && queryIndex < queryLower.length) {
    if (textLower[textIndex] === queryLower[queryIndex]) {
      queryIndex++;
      score += 10 + consecutiveBonus;
      consecutiveBonus = Math.min(consecutiveBonus + 5, 20); // Reward consecutive matches
    } else {
      consecutiveBonus = 0;
    }
    textIndex++;
  }

  // All query characters found?
  if (queryIndex === queryLower.length) {
    // Normalize score based on length ratio
    const lengthRatio = queryLower.length / textLower.length;
    return Math.round(score * lengthRatio);
  }

  return -1; // No match
}

/**
 * Search across all fields of a person
 * Returns match score or -1 if no match
 */
export function searchPerson(
  person: {
    firstName: string;
    lastName: string;
    nickname?: string;
    email?: string;
    phone?: string;
    notes?: string;
    tags: string[];
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    customFields?: Array<{ label: string; value: string }>;
  },
  query: string
): number {
  if (!query.trim()) return 1;

  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  let totalScore = 0;
  let matchedTerms = 0;

  for (const term of searchTerms) {
    let bestScore = -1;

    // Check all fields
    const fields = [
      { value: person.firstName, weight: 3 },
      { value: person.lastName, weight: 3 },
      { value: person.nickname, weight: 2 },
      { value: person.email, weight: 1 },
      { value: person.phone, weight: 1 },
      { value: person.notes, weight: 0.5 },
      { value: person.address?.city, weight: 1.5 },
      { value: person.address?.state, weight: 1 },
      { value: person.address?.country, weight: 1 },
      { value: person.address?.street, weight: 0.5 },
      { value: person.address?.postalCode, weight: 0.5 },
    ];

    // Check main fields
    for (const field of fields) {
      if (field.value) {
        const score = fuzzyMatch(field.value, term);
        if (score > 0) {
          bestScore = Math.max(bestScore, score * field.weight);
        }
      }
    }

    // Check tags
    for (const tag of person.tags) {
      const score = fuzzyMatch(tag, term);
      if (score > 0) {
        bestScore = Math.max(bestScore, score * 2);
      }
    }

    // Check custom fields
    if (person.customFields) {
      for (const field of person.customFields) {
        const labelScore = fuzzyMatch(field.label, term);
        const valueScore = fuzzyMatch(field.value, term);
        if (labelScore > 0) bestScore = Math.max(bestScore, labelScore * 0.5);
        if (valueScore > 0) bestScore = Math.max(bestScore, valueScore * 0.5);
      }
    }

    // Check full name
    const fullName = `${person.firstName} ${person.lastName}`.trim();
    const fullNameScore = fuzzyMatch(fullName, term);
    if (fullNameScore > 0) {
      bestScore = Math.max(bestScore, fullNameScore * 3);
    }

    if (bestScore > 0) {
      totalScore += bestScore;
      matchedTerms++;
    }
  }

  // All terms must match
  if (matchedTerms < searchTerms.length) return -1;

  return totalScore / searchTerms.length;
}

/**
 * Format an address for display
 */
export function formatAddress(address?: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string | null {
  if (!address) return null;

  const parts: string[] = [];

  if (address.street) parts.push(address.street);

  const cityStateParts: string[] = [];
  if (address.city) cityStateParts.push(address.city);
  if (address.state) cityStateParts.push(address.state);
  if (cityStateParts.length > 0) {
    let cityState = cityStateParts.join(", ");
    if (address.postalCode) cityState += ` ${address.postalCode}`;
    parts.push(cityState);
  } else if (address.postalCode) {
    parts.push(address.postalCode);
  }

  if (address.country) parts.push(address.country);

  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Format address as single line
 */
export function formatAddressLine(address?: {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): string | null {
  if (!address) return null;

  const parts: string[] = [];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country && !address.state) parts.push(address.country);

  return parts.length > 0 ? parts.join(", ") : null;
}
