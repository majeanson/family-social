/**
 * Event types for family milestones and important dates
 */

export type EventType =
  | "anniversary"
  | "wedding"
  | "graduation"
  | "birth"
  | "move"
  | "job_change"
  | "retirement"
  | "death"
  | "custom";

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string }> = {
  anniversary: { label: "Anniversary", icon: "Heart", color: "bg-pink-500" },
  wedding: { label: "Wedding", icon: "Gem", color: "bg-purple-500" },
  graduation: { label: "Graduation", icon: "GraduationCap", color: "bg-blue-500" },
  birth: { label: "Birth", icon: "Baby", color: "bg-green-500" },
  move: { label: "Move", icon: "Home", color: "bg-orange-500" },
  job_change: { label: "Job Change", icon: "Briefcase", color: "bg-cyan-500" },
  retirement: { label: "Retirement", icon: "Palmtree", color: "bg-yellow-500" },
  death: { label: "Passing", icon: "Heart", color: "bg-gray-500" },
  custom: { label: "Custom", icon: "Calendar", color: "bg-slate-500" },
};

export type ReminderTiming = "same_day" | "1_day" | "3_days" | "1_week" | "2_weeks";

export const REMINDER_TIMING_CONFIG: Record<ReminderTiming, { label: string; days: number }> = {
  same_day: { label: "Same day", days: 0 },
  "1_day": { label: "1 day before", days: 1 },
  "3_days": { label: "3 days before", days: 3 },
  "1_week": { label: "1 week before", days: 7 },
  "2_weeks": { label: "2 weeks before", days: 14 },
};

export interface EventReminder {
  timing: ReminderTiming;
  dismissed?: boolean; // Has user dismissed this reminder for this occurrence
  lastDismissedYear?: number; // Track which year's reminder was dismissed
}

export interface FamilyEvent {
  id: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  type: EventType;
  description?: string;
  personIds: string[]; // People associated with this event
  recurring?: {
    frequency: "yearly" | "monthly";
    endDate?: string;
  };
  customTypeName?: string; // For type="custom"
  reminder?: EventReminder; // Optional reminder for this event
  createdAt: string;
  updatedAt: string;
}

export interface FamilyEventFormData {
  title: string;
  date: string;
  type: EventType;
  description?: string;
  personIds: string[];
  recurring?: {
    frequency: "yearly" | "monthly";
    endDate?: string;
  };
  customTypeName?: string;
  reminder?: EventReminder;
}
