import type { Person } from "./person";
import type { Relationship } from "./relationship";
import type { FormTemplate } from "./form-template";
import type { FamilyEvent, ReminderTiming } from "./event";

export interface DataStore {
  version: string;
  people: Person[];
  relationships: Relationship[];
  formTemplates: FormTemplate[];
  events: FamilyEvent[];
  settings: AppSettings;
  exportedAt?: string;
}

export interface FamilyColorConfig {
  bg: string;
  hex: string;
  light: string;
  border: string;
}

export interface NotificationSettings {
  enabled: boolean;
  birthdayReminders: boolean;
  birthdayTiming: ReminderTiming;
  eventReminders: boolean;
  defaultEventTiming: ReminderTiming;
}

// Custom theme color configuration
export interface ThemeColors {
  primary?: string;       // Main action color (buttons, links)
  secondary?: string;     // Secondary buttons/actions
  accent?: string;        // Highlight/accent color
  card?: string;          // Card backgrounds
  background?: string;    // Page background
  muted?: string;         // Subtle backgrounds
}

export interface CustomTheme {
  light: ThemeColors;
  dark: ThemeColors;
}

// Preset theme options
export type ThemePreset = "default" | "ocean" | "forest" | "sunset" | "lavender" | "custom";

export const THEME_PRESETS: Record<ThemePreset, CustomTheme> = {
  default: {
    light: {},
    dark: {},
  },
  ocean: {
    light: {
      primary: "#0284c7",    // sky-600
      accent: "#0ea5e9",     // sky-500
      card: "#f0f9ff",       // sky-50
    },
    dark: {
      primary: "#38bdf8",    // sky-400
      accent: "#0ea5e9",     // sky-500
      card: "#0c4a6e",       // sky-900
    },
  },
  forest: {
    light: {
      primary: "#15803d",    // green-700
      accent: "#22c55e",     // green-500
      card: "#f0fdf4",       // green-50
    },
    dark: {
      primary: "#4ade80",    // green-400
      accent: "#22c55e",     // green-500
      card: "#14532d",       // green-900
    },
  },
  sunset: {
    light: {
      primary: "#ea580c",    // orange-600
      accent: "#f97316",     // orange-500
      card: "#fff7ed",       // orange-50
    },
    dark: {
      primary: "#fb923c",    // orange-400
      accent: "#f97316",     // orange-500
      card: "#7c2d12",       // orange-900
    },
  },
  lavender: {
    light: {
      primary: "#7c3aed",    // violet-600
      accent: "#8b5cf6",     // violet-500
      card: "#f5f3ff",       // violet-50
    },
    dark: {
      primary: "#a78bfa",    // violet-400
      accent: "#8b5cf6",     // violet-500
      card: "#4c1d95",       // violet-900
    },
  },
  custom: {
    light: {},
    dark: {},
  },
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  birthdayReminders: true,
  birthdayTiming: "1_week",
  eventReminders: true,
  defaultEventTiming: "1_day",
};

export interface AppSettings {
  theme: "light" | "dark" | "system";
  defaultView: "cards" | "graph";
  sortBy: "firstName" | "lastName" | "birthday" | "createdAt";
  sortOrder: "asc" | "desc";
  familyColors?: FamilyColorConfig[];
  relationshipColors?: Record<string, string>;
  primaryUserId?: string; // ID of the "Me" person
  familyNames?: Record<string, string>; // Custom family names keyed by group root ID
  notifications?: NotificationSettings;
  themePreset?: ThemePreset;
  customTheme?: CustomTheme;
  tabsBackground?: string; // Custom background color for tab bar
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
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};

export const DATA_STORE_VERSION = "1.0.0";

export function createEmptyDataStore(): DataStore {
  return {
    version: DATA_STORE_VERSION,
    people: [],
    relationships: [],
    formTemplates: [],
    events: [],
    settings: DEFAULT_SETTINGS,
  };
}
