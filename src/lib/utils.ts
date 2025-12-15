import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
  // Ambers
  "amber-500": "#f59e0b",
  // Oranges
  "orange-500": "#f97316",
  // Roses
  "rose-500": "#f43f5e",
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
