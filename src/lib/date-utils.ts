/**
 * Date utility functions for birthday calculations and formatting
 */

export interface BirthdayInfo {
  display: string;
  shortDisplay: string;
  age: number;
  ageDisplay: string; // Formatted age (e.g., "2 years old", "6 months old", "3 weeks old")
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
      ageDisplay,
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
