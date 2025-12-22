import { z } from "zod";

// Custom field schema
const customFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  type: z.enum(["text", "date", "url", "number"]),
});

// Person schema
const personSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string(),
  nickname: z.string().optional(),
  photo: z.string().optional(),
  birthday: z.string().optional(),
  notes: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  customFields: z.array(customFieldSchema).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Relationship type enum
const relationshipTypeSchema = z.enum([
  "parent",
  "child",
  "sibling",
  "spouse",
  "partner",
  "grandparent",
  "grandchild",
  "aunt_uncle",
  "niece_nephew",
  "cousin",
  "in_law",
  "step_family",
  "friend",
  "colleague",
  "other",
]);

// Relationship schema
const relationshipSchema = z.object({
  id: z.string(),
  personAId: z.string(),
  personBId: z.string(),
  type: relationshipTypeSchema,
  reverseType: relationshipTypeSchema.optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Form field schema
const formFieldSchema = z.object({
  id: z.string(),
  fieldKey: z.string(),
  label: z.string(),
  required: z.boolean(),
  order: z.number(),
  type: z.enum(["text", "date", "email", "phone", "photo", "textarea"]),
});

// Form template schema
const formTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Event type enum
const eventTypeSchema = z.enum([
  "anniversary",
  "wedding",
  "graduation",
  "birth",
  "move",
  "job_change",
  "retirement",
  "death",
  "custom",
]);

// Reminder timing enum
const reminderTimingSchema = z.enum([
  "same_day",
  "1_day",
  "3_days",
  "1_week",
  "2_weeks",
]);

// Event reminder schema
const eventReminderSchema = z.object({
  timing: reminderTimingSchema,
  dismissed: z.boolean().optional(),
  lastDismissedYear: z.number().optional(),
});

// Family event schema
const familyEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Event title is required"),
  date: z.string(),
  type: eventTypeSchema,
  description: z.string().optional(),
  personIds: z.array(z.string()),
  recurring: z.object({
    frequency: z.enum(["yearly", "monthly"]),
    endDate: z.string().optional(),
  }).optional(),
  customTypeName: z.string().optional(),
  reminder: eventReminderSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Family color config schema
const familyColorConfigSchema = z.object({
  bg: z.string(),
  hex: z.string(),
  light: z.string(),
  border: z.string(),
});

// Notification settings schema
const notificationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  birthdayReminders: z.boolean().default(true),
  birthdayTiming: reminderTimingSchema.default("1_week"),
  eventReminders: z.boolean().default(true),
  defaultEventTiming: reminderTimingSchema.default("1_day"),
});

// App settings schema
const appSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  defaultView: z.enum(["cards", "graph"]).default("cards"),
  sortBy: z.enum(["firstName", "lastName", "birthday", "createdAt"]).default("firstName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  familyColors: z.array(familyColorConfigSchema).optional(),
  relationshipColors: z.record(z.string(), z.string()).optional(),
  primaryUserId: z.string().optional(),
  familyNames: z.record(z.string(), z.string()).optional(),
  notifications: notificationSettingsSchema.optional(),
});

// Main data store schema
export const dataStoreSchema = z.object({
  version: z.string(),
  people: z.array(personSchema),
  relationships: z.array(relationshipSchema),
  formTemplates: z.array(formTemplateSchema),
  events: z.array(familyEventSchema).default([]),
  settings: appSettingsSchema,
  exportedAt: z.string().optional(),
});

// Type inference
export type ValidatedDataStore = z.infer<typeof dataStoreSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validate data store with detailed error reporting
export function validateDataStore(data: unknown): ValidationResult<ValidatedDataStore> {
  try {
    const result = dataStoreSchema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    // Format error message (without exposing internal details)
    const issues = result.error.issues;
    const firstIssue = issues[0];
    const path = firstIssue?.path.join(".") || "unknown";

    return {
      success: false,
      error: `Invalid data format: problem at "${path}"`,
    };
  } catch {
    return {
      success: false,
      error: "Failed to validate data format",
    };
  }
}

// Basic structure check for quick validation
export function hasValidStructure(data: unknown): data is { version: string; people: unknown[] } {
  return (
    typeof data === "object" &&
    data !== null &&
    "version" in data &&
    typeof (data as Record<string, unknown>).version === "string" &&
    "people" in data &&
    Array.isArray((data as Record<string, unknown>).people)
  );
}
