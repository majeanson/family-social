/**
 * Date utility functions for birthday calculations and formatting
 */

export interface BirthdayInfo {
  display: string;
  shortDisplay: string;
  age: number;
  daysUntil: number;
  isToday: boolean;
  isUpcoming: boolean; // Within 30 days
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

    // Calculate age
    let age = thisYear - date.getFullYear();
    const thisYearBirthday = new Date(thisYear, date.getMonth(), date.getDate());
    thisYearBirthday.setHours(0, 0, 0, 0);

    if (thisYearBirthday > today) {
      age--;
    }

    // Calculate days until next birthday
    let nextBirthday = new Date(thisYear, date.getMonth(), date.getDate());
    nextBirthday.setHours(0, 0, 0, 0);

    if (nextBirthday < today) {
      nextBirthday = new Date(thisYear + 1, date.getMonth(), date.getDate());
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isToday = daysUntil === 0 || (today.getMonth() === date.getMonth() && today.getDate() === date.getDate());

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
