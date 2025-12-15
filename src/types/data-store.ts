import type { Person } from "./person";
import type { Relationship } from "./relationship";
import type { FormTemplate } from "./form-template";

export interface DataStore {
  version: string;
  people: Person[];
  relationships: Relationship[];
  formTemplates: FormTemplate[];
  settings: AppSettings;
  exportedAt?: string;
}

export interface FamilyColorConfig {
  bg: string;
  hex: string;
  light: string;
  border: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  defaultView: "cards" | "graph";
  sortBy: "firstName" | "lastName" | "birthday" | "createdAt";
  sortOrder: "asc" | "desc";
  familyColors?: FamilyColorConfig[];
  relationshipColors?: Record<string, string>;
  primaryUserId?: string; // ID of the "Me" person
}

// Default family color palette
export const DEFAULT_FAMILY_COLORS: FamilyColorConfig[] = [
  { bg: "bg-blue-500", hex: "#3b82f6", light: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-800" },
  { bg: "bg-emerald-500", hex: "#10b981", light: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-purple-500", hex: "#a855f7", light: "bg-purple-50 dark:bg-purple-950/50", border: "border-purple-200 dark:border-purple-800" },
  { bg: "bg-orange-500", hex: "#f97316", light: "bg-orange-50 dark:bg-orange-950/50", border: "border-orange-200 dark:border-orange-800" },
  { bg: "bg-pink-500", hex: "#ec4899", light: "bg-pink-50 dark:bg-pink-950/50", border: "border-pink-200 dark:border-pink-800" },
  { bg: "bg-cyan-500", hex: "#06b6d4", light: "bg-cyan-50 dark:bg-cyan-950/50", border: "border-cyan-200 dark:border-cyan-800" },
  { bg: "bg-amber-500", hex: "#f59e0b", light: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800" },
  { bg: "bg-rose-500", hex: "#f43f5e", light: "bg-rose-50 dark:bg-rose-950/50", border: "border-rose-200 dark:border-rose-800" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  defaultView: "cards",
  sortBy: "firstName",
  sortOrder: "asc",
  familyColors: DEFAULT_FAMILY_COLORS,
};

export const DATA_STORE_VERSION = "1.0.0";

export function createEmptyDataStore(): DataStore {
  return {
    version: DATA_STORE_VERSION,
    people: [],
    relationships: [],
    formTemplates: [],
    settings: DEFAULT_SETTINGS,
  };
}
