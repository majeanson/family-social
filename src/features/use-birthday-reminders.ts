"use client";

import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { getBirthdayInfo, type BirthdayInfo } from "@/lib/date-utils";
import type { Person } from "@/types";

export interface UpcomingBirthday {
  person: Person;
  info: BirthdayInfo;
}

/**
 * Hook to get upcoming birthdays sorted by date
 * @param days - Number of days to look ahead (default 30)
 * @param limit - Maximum number of birthdays to return (default 10)
 */
export function useBirthdayReminders(days = 30, limit = 10): UpcomingBirthday[] {
  const { people } = useDataStore();

  return useMemo(() => {
    const upcoming: UpcomingBirthday[] = [];

    for (const person of people) {
      if (!person.birthday) continue;

      const info = getBirthdayInfo(person.birthday);
      if (!info) continue;

      // Include if today or within the specified days
      if (info.isToday || (info.daysUntil > 0 && info.daysUntil <= days)) {
        upcoming.push({ person, info });
      }
    }

    // Sort by days until (today first, then ascending)
    upcoming.sort((a, b) => a.info.daysUntil - b.info.daysUntil);

    return upcoming.slice(0, limit);
  }, [people, days, limit]);
}

/**
 * Get count of birthdays in the next N days
 */
export function useBirthdayCount(days = 7): number {
  const upcoming = useBirthdayReminders(days, 100);
  return upcoming.length;
}
