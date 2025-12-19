"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { v4 as uuid } from "uuid";
import type {
  Person,
  PersonFormData,
  Relationship,
  FormTemplate,
  DataStore,
  AppSettings,
} from "@/types";
import {
  DEFAULT_SETTINGS,
  DATA_STORE_VERSION,
  createEmptyDataStore,
  RELATIONSHIP_INVERSES,
} from "@/types";
import {
  MOCK_PEOPLE,
  MOCK_RELATIONSHIPS,
  MOCK_FORM_TEMPLATES,
  hasMockData,
  filterOutMockData,
} from "@/lib/mock-data";

interface DataState {
  // Data
  people: Person[];
  relationships: Relationship[];
  formTemplates: FormTemplate[];
  settings: AppSettings;

  // Status
  isLoaded: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  hasMockData: boolean;

  // Actions - People
  addPerson: (data: PersonFormData) => string;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getPersonById: (id: string) => Person | undefined;

  // Actions - Relationships
  addRelationship: (
    personAId: string,
    personBId: string,
    type: Relationship["type"],
    label?: string
  ) => string;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;
  getRelationshipsForPerson: (personId: string) => Relationship[];

  // Actions - Form Templates
  addFormTemplate: (
    name: string,
    fields: FormTemplate["fields"],
    description?: string
  ) => string;
  updateFormTemplate: (id: string, updates: Partial<FormTemplate>) => void;
  deleteFormTemplate: (id: string) => void;

  // Actions - Data Management
  loadData: (data: DataStore) => void;
  exportData: () => DataStore;
  resetData: () => void;
  markSaved: () => void;
  clearMockData: () => void;
  loadMockData: () => void;

  // Actions - Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Actions - Primary User ("Me")
  setPrimaryUser: (personId: string) => void;
  clearPrimaryUser: () => void;
  getPrimaryUser: () => Person | undefined;
}

export const useDataStore = create<DataState>()(
  immer((set, get) => ({
    // Initial state - start with mock data
    people: MOCK_PEOPLE,
    relationships: MOCK_RELATIONSHIPS,
    formTemplates: MOCK_FORM_TEMPLATES,
    settings: DEFAULT_SETTINGS,
    isLoaded: false,
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    hasMockData: true,

    // People actions
    addPerson: (data) => {
      const id = uuid();
      const now = new Date().toISOString();
      set((state) => {
        // Clear mock data when user starts entering their own
        if (state.hasMockData) {
          const filtered = filterOutMockData(state.people, state.relationships, state.formTemplates);
          state.people = filtered.people;
          state.relationships = filtered.relationships;
          state.formTemplates = filtered.formTemplates;
          state.hasMockData = false;
        }
        state.people.push({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        });
        state.hasUnsavedChanges = true;
      });
      return id;
    },

    updatePerson: (id, updates) => {
      set((state) => {
        const index = state.people.findIndex((p) => p.id === id);
        if (index !== -1) {
          state.people[index] = {
            ...state.people[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          state.hasUnsavedChanges = true;
        }
      });
    },

    deletePerson: (id) => {
      set((state) => {
        state.people = state.people.filter((p) => p.id !== id);
        state.relationships = state.relationships.filter(
          (r) => r.personAId !== id && r.personBId !== id
        );
        // Clear primaryUserId if deleting the "Me" person
        if (state.settings.primaryUserId === id) {
          state.settings.primaryUserId = undefined;
        }
        state.hasUnsavedChanges = true;
      });
    },

    getPersonById: (id) => {
      return get().people.find((p) => p.id === id);
    },

    // Relationship actions
    addRelationship: (personAId, personBId, type, label) => {
      // Prevent self-relationships
      if (personAId === personBId) {
        console.warn("Cannot create a relationship between a person and themselves");
        return "";
      }
      const id = uuid();
      const now = new Date().toISOString();
      set((state) => {
        state.relationships.push({
          id,
          personAId,
          personBId,
          type,
          reverseType: RELATIONSHIP_INVERSES[type],
          label,
          createdAt: now,
          updatedAt: now,
        });
        state.hasUnsavedChanges = true;
      });
      return id;
    },

    updateRelationship: (id, updates) => {
      set((state) => {
        const index = state.relationships.findIndex((r) => r.id === id);
        if (index !== -1) {
          const newType = updates.type || state.relationships[index].type;
          state.relationships[index] = {
            ...state.relationships[index],
            ...updates,
            reverseType: RELATIONSHIP_INVERSES[newType],
            updatedAt: new Date().toISOString(),
          };
          state.hasUnsavedChanges = true;
        }
      });
    },

    deleteRelationship: (id) => {
      set((state) => {
        state.relationships = state.relationships.filter((r) => r.id !== id);
        state.hasUnsavedChanges = true;
      });
    },

    getRelationshipsForPerson: (personId) => {
      return get().relationships.filter(
        (r) => r.personAId === personId || r.personBId === personId
      );
    },

    // Form Template actions
    addFormTemplate: (name, fields, description) => {
      const id = uuid();
      const now = new Date().toISOString();
      set((state) => {
        // Clear mock data when user starts creating their own forms
        if (state.hasMockData) {
          const filtered = filterOutMockData(state.people, state.relationships, state.formTemplates);
          state.people = filtered.people;
          state.relationships = filtered.relationships;
          state.formTemplates = filtered.formTemplates;
          state.hasMockData = false;
        }
        state.formTemplates.push({
          id,
          name,
          description,
          fields,
          createdAt: now,
          updatedAt: now,
        });
        state.hasUnsavedChanges = true;
      });
      return id;
    },

    updateFormTemplate: (id, updates) => {
      set((state) => {
        const index = state.formTemplates.findIndex((f) => f.id === id);
        if (index !== -1) {
          state.formTemplates[index] = {
            ...state.formTemplates[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          state.hasUnsavedChanges = true;
        }
      });
    },

    deleteFormTemplate: (id) => {
      set((state) => {
        state.formTemplates = state.formTemplates.filter((f) => f.id !== id);
        state.hasUnsavedChanges = true;
      });
    },

    // Data Management
    loadData: (data) => {
      set((state) => {
        const people = data.people || [];
        const relationships = data.relationships || [];
        const formTemplates = data.formTemplates || [];

        // Check if loaded data has real (non-mock) content
        const hasRealData = people.length > 0 || relationships.length > 0 || formTemplates.length > 0;
        const containsMockData = hasMockData(people, relationships, formTemplates);

        if (hasRealData && !containsMockData) {
          // User has real data - use it and don't show mock
          state.people = people;
          // Clean up orphaned relationships (pointing to deleted people)
          const personIds = new Set(people.map((p) => p.id));
          state.relationships = relationships.filter(
            (r) => personIds.has(r.personAId) && personIds.has(r.personBId)
          );
          state.formTemplates = formTemplates;
          state.hasMockData = false;
        } else if (containsMockData) {
          // Data contains mock - keep it
          state.people = people;
          state.relationships = relationships;
          state.formTemplates = formTemplates;
          state.hasMockData = true;
        } else {
          // No data - load mock data
          state.people = MOCK_PEOPLE;
          state.relationships = MOCK_RELATIONSHIPS;
          state.formTemplates = MOCK_FORM_TEMPLATES;
          state.hasMockData = true;
        }

        state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
        state.isLoaded = true;
        state.hasUnsavedChanges = false;
      });
    },

    exportData: () => {
      const state = get();
      return {
        version: DATA_STORE_VERSION,
        people: state.people,
        relationships: state.relationships,
        formTemplates: state.formTemplates,
        settings: state.settings,
      };
    },

    resetData: () => {
      set((state) => {
        const empty = createEmptyDataStore();
        state.people = empty.people;
        state.relationships = empty.relationships;
        state.formTemplates = empty.formTemplates;
        state.settings = empty.settings;
        state.hasMockData = false;
        state.hasUnsavedChanges = true;
      });
    },

    markSaved: () => {
      set((state) => {
        state.hasUnsavedChanges = false;
        state.lastSaved = new Date();
      });
    },

    clearMockData: () => {
      set((state) => {
        if (state.hasMockData) {
          const filtered = filterOutMockData(state.people, state.relationships, state.formTemplates);
          state.people = filtered.people;
          state.relationships = filtered.relationships;
          state.formTemplates = filtered.formTemplates;
          state.hasMockData = false;
          state.hasUnsavedChanges = true;
        }
      });
    },

    loadMockData: () => {
      set((state) => {
        state.people = MOCK_PEOPLE;
        state.relationships = MOCK_RELATIONSHIPS;
        state.formTemplates = MOCK_FORM_TEMPLATES;
        state.hasMockData = true;
        state.hasUnsavedChanges = false;
      });
    },

    // Settings
    updateSettings: (updates) => {
      set((state) => {
        state.settings = { ...state.settings, ...updates };
        state.hasUnsavedChanges = true;
      });
    },

    // Primary User ("Me") actions
    setPrimaryUser: (personId) => {
      set((state) => {
        state.settings.primaryUserId = personId;
        state.hasUnsavedChanges = true;
      });
    },

    clearPrimaryUser: () => {
      set((state) => {
        state.settings.primaryUserId = undefined;
        state.hasUnsavedChanges = true;
      });
    },

    getPrimaryUser: () => {
      const state = get();
      if (!state.settings.primaryUserId) return undefined;
      return state.people.find((p) => p.id === state.settings.primaryUserId);
    },
  }))
);
