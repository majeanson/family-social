"use client";

import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { useBirthdayReminders } from "./use-birthday-reminders";
import type { FamilyEvent, Person, ReminderTiming } from "@/types";
import { REMINDER_TIMING_CONFIG, DEFAULT_NOTIFICATION_SETTINGS } from "@/types";

export type ReminderType = "birthday" | "event";

export interface DueReminder {
  id: string; // Unique ID for this reminder instance
  type: ReminderType;
  title: string;
  date: Date;
  daysUntil: number;
  isToday: boolean;
  event?: FamilyEvent;
  person?: Person;
  timing: ReminderTiming;
}

/**
 * Calculate the next occurrence of a date (for recurring events/birthdays)
 */
function getNextOccurrence(dateStr: string): { date: Date; daysUntil: number } {
  const eventDate = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Try this year's occurrence
  let nextDate = new Date(
    now.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );

  // If it's passed, use next year
  if (nextDate < today) {
    nextDate = new Date(
      now.getFullYear() + 1,
      eventDate.getMonth(),
      eventDate.getDate()
    );
  }

  const daysUntil = Math.floor(
    (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return { date: nextDate, daysUntil };
}

/**
 * Check if a reminder should be shown based on timing configuration
 */
function shouldShowReminder(daysUntil: number, timing: ReminderTiming): boolean {
  const config = REMINDER_TIMING_CONFIG[timing];
  return daysUntil <= config.days;
}

/**
 * Hook to get all due reminders (both events and birthdays)
 */
export function useEventReminders(): DueReminder[] {
  const { events, settings } = useDataStore();
  const notifications = settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS;

  // Get birthday reminders using existing hook
  const birthdayReminders = useBirthdayReminders(
    REMINDER_TIMING_CONFIG[notifications.birthdayTiming].days,
    100
  );

  return useMemo(() => {
    const reminders: DueReminder[] = [];

    // Skip if notifications are disabled
    if (!notifications.enabled) {
      return reminders;
    }

    // Add birthday reminders
    if (notifications.birthdayReminders) {
      for (const { person, info } of birthdayReminders) {
        if (shouldShowReminder(info.daysUntil, notifications.birthdayTiming)) {
          reminders.push({
            id: `birthday-${person.id}-${new Date().getFullYear()}`,
            type: "birthday",
            title: `${person.nickname || person.firstName}'s Birthday`,
            date: new Date(
              new Date().getFullYear(),
              new Date(person.birthday!).getMonth(),
              new Date(person.birthday!).getDate()
            ),
            daysUntil: info.daysUntil,
            isToday: info.isToday,
            person,
            timing: notifications.birthdayTiming,
          });
        }
      }
    }

    // Add event reminders
    if (notifications.eventReminders) {
      for (const event of events) {
        // Skip events without reminders configured
        if (!event.reminder) continue;

        const timing = event.reminder.timing;
        const currentYear = new Date().getFullYear();

        // Check if reminder was already dismissed for this occurrence
        if (event.reminder.dismissed && event.reminder.lastDismissedYear === currentYear) {
          continue;
        }

        let daysUntil: number;
        let nextDate: Date;
        let isToday: boolean;

        if (event.recurring) {
          // For recurring events, find next occurrence
          const occurrence = getNextOccurrence(event.date);
          daysUntil = occurrence.daysUntil;
          nextDate = occurrence.date;
          isToday = daysUntil === 0;
        } else {
          // For one-time events
          const eventDate = new Date(event.date);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          // Skip past events
          if (eventDate < today) continue;

          daysUntil = Math.floor(
            (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          nextDate = eventDate;
          isToday = daysUntil === 0;
        }

        // Check if reminder should be shown
        if (shouldShowReminder(daysUntil, timing)) {
          reminders.push({
            id: `event-${event.id}-${currentYear}`,
            type: "event",
            title: event.title,
            date: nextDate,
            daysUntil,
            isToday,
            event,
            timing,
          });
        }
      }
    }

    // Sort by days until (most urgent first)
    return reminders.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events, notifications, birthdayReminders]);
}

/**
 * Hook to dismiss a reminder
 */
export function useDismissReminder() {
  const { updateEvent } = useDataStore();

  return (reminder: DueReminder) => {
    if (reminder.type === "event" && reminder.event) {
      updateEvent(reminder.event.id, {
        reminder: {
          ...reminder.event.reminder!,
          dismissed: true,
          lastDismissedYear: new Date().getFullYear(),
        },
      });
    }
    // For birthdays, we don't persist dismissal (they reset each year)
  };
}
