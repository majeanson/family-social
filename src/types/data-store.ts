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

export interface AppSettings {
  theme: "light" | "dark" | "system";
  defaultView: "cards" | "graph";
  sortBy: "firstName" | "lastName" | "birthday" | "createdAt";
  sortOrder: "asc" | "desc";
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  defaultView: "cards",
  sortBy: "firstName",
  sortOrder: "asc",
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
