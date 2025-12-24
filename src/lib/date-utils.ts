/**
 * Date utility functions for birthday calculations and formatting
 */

export interface BirthdayInfo {
  display: string;
  shortDisplay: string;
  age: number;
  ageDisplay: string; // Formatted age (e.g., "2 years old", "6 months old", "3 weeks old")
  upcomingAgeDisplay: string; // Age they will be on next birthday (e.g., "Turning 3 in 6 days")
  daysUntil: number;
  isToday: boolean;
  isUpcoming: boolean; // Within 30 days
}

/**
 * Format age appropriately based on how old someone is
 * - < 1 month: show weeks
 * - < 1 year: show months
 * - >= 1 year: show years
 */
function formatAge(birthDate: Date, today: Date): { age: number; ageDisplay: string } {
  const diffMs = today.getTime() - birthDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Calculate months difference
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months += today.getMonth() - birthDate.getMonth();
  if (today.getDate() < birthDate.getDate()) {
    months--;
  }

  // Calculate years
  let years = today.getFullYear() - birthDate.getFullYear();
  const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (thisYearBirthday > today) {
    years--;
  }

  // Less than 1 month old - show weeks
  if (months < 1) {
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 0) {
      return { age: 0, ageDisplay: "newborn" };
    }
    return { age: 0, ageDisplay: `${weeks} ${weeks === 1 ? "week" : "weeks"} old` };
  }

  // Less than 1 year old - show months
  if (years < 1) {
    return { age: 0, ageDisplay: `${months} ${months === 1 ? "month" : "months"} old` };
  }

  // 1 year or older - show years
  return { age: years, ageDisplay: `${years} ${years === 1 ? "year" : "years"} old` };
}

/**
 * Create a date for a specific year with the same month/day, handling leap year edge case.
 * If date doesn't exist (e.g., Feb 29 in non-leap year), uses Feb 28.
 */
function createDateInYear(year: number, month: number, day: number): Date {
  const date = new Date(year, month, day);
  // If the month rolled over (e.g., Feb 29 -> Mar 1), use last day of intended month
  if (date.getMonth() !== month) {
    return new Date(year, month + 1, 0); // Last day of the intended month
  }
  return date;
}

/**
 * Calculate comprehensive birthday information
 */
export function getBirthdayInfo(birthday: string | undefined): BirthdayInfo | null {
  if (!birthday) return null;

  try {
    const date = new Date(birthday + "T00:00:00");
    if (isNaN(date.getTime())) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisYear = today.getFullYear();

    // Calculate age with proper formatting for infants
    const { age, ageDisplay } = formatAge(date, today);

    // Calculate days until next birthday (handles leap year - Feb 29 shows as Feb 28)
    let nextBirthday = createDateInYear(thisYear, date.getMonth(), date.getDate());
    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday = createDateInYear(thisYear + 1, date.getMonth(), date.getDate());
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const daysUntil = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isToday = daysUntil === 0 || (today.getMonth() === date.getMonth() && today.getDate() === date.getDate());

    // Calculate the age they will be on their next birthday
    const upcomingAge = nextBirthday.getFullYear() - date.getFullYear();
    let upcomingAgeDisplay = ageDisplay;

    if (isToday) {
      upcomingAgeDisplay = `Turning ${upcomingAge} today!`;
    } else if (daysUntil === 1) {
      upcomingAgeDisplay = `Turning ${upcomingAge} tomorrow`;
    } else if (daysUntil <= 30) {
      upcomingAgeDisplay = `Turning ${upcomingAge} in ${daysUntil} days`;
    }

    return {
      display: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      shortDisplay: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      age,
      ageDisplay,
      upcomingAgeDisplay,
      daysUntil: isToday ? 0 : daysUntil,
      isToday,
      isUpcoming: daysUntil <= 30 && daysUntil > 0,
    };
  } catch {
    return null;
  }
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// Alias for backwards compatibility
export const formatDateDisplay = formatDate;

/**
 * Calculate the next occurrence of an annual date (for recurring events/birthdays)
 * Used for events that occur on the same month/day each year
 * Handles leap year edge case (Feb 29 birthdays show as Feb 28 in non-leap years)
 */
export function getNextOccurrence(dateStr: string): { date: Date; year: number; daysUntil: number } {
  const eventDate = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Try this year's occurrence (handles leap year)
  let nextDate = createDateInYear(
    now.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate()
  );

  // If it's passed, use next year
  if (nextDate < today) {
    nextDate = createDateInYear(
      now.getFullYear() + 1,
      eventDate.getMonth(),
      eventDate.getDate()
    );
  }

  const daysUntil = Math.floor(
    (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return { date: nextDate, year: nextDate.getFullYear(), daysUntil };
}

/**
 * Get ordinal suffix for a number (e.g., 1st, 2nd, 3rd, 4th)
 */
export function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Get relative time string (e.g., "2 days ago", "in 5 days")
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get birthday as day-of-year (1-366) for sorting by upcoming birthday
 * January 1 = 1, December 31 = 365/366
 * Returns a value relative to today so upcoming birthdays sort first
 */
export function getBirthdaySortValue(birthday: string | undefined): number {
  if (!birthday) return 999; // No birthday goes to end

  try {
    const date = new Date(birthday + "T00:00:00");
    if (isNaN(date.getTime())) return 999;

    const today = new Date();
    const month = date.getMonth();
    const day = date.getDate();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();

    // Calculate day of year for the birthday (ignoring year)
    const birthdayDayOfYear = getDayOfYear(month, day);
    const todayDayOfYear = getDayOfYear(todayMonth, todayDay);

    // Calculate days until birthday (wrapping around year)
    let daysUntil = birthdayDayOfYear - todayDayOfYear;
    if (daysUntil < 0) {
      daysUntil += 366; // Add a year's worth of days
    }

    return daysUntil;
  } catch {
    return 999;
  }
}

/**
 * Get day of year for a given month and day
 */
function getDayOfYear(month: number, day: number): number {
  // Days in each month (using leap year to handle Feb 29)
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 0; i < month; i++) {
    dayOfYear += daysInMonth[i];
  }
  return dayOfYear;
}
