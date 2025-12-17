import { useState, useCallback, useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import type { Person } from "@/types";

export interface FocusState {
  /** Currently focused person ID */
  focusPersonId: string | null;
  /** The focused person object */
  focusPerson: Person | null;
  /** Set focus to a specific person */
  setFocus: (personId: string) => void;
  /** Clear focus (reset to primary user or default) */
  clearFocus: () => void;
  /** Navigate to the previous person in history */
  goBack: () => void;
  /** Whether back navigation is available */
  canGoBack: boolean;
  /** Navigation history */
  history: string[];
}

/**
 * Hook to manage focus state for person-centric visualization.
 * Tracks the currently focused person and navigation history.
 */
export function useFocusState(): FocusState {
  const { people, settings } = useDataStore();
  const [history, setHistory] = useState<string[]>([]);

  // Current focus is the last item in history, or primary user, or first person
  const focusPersonId = useMemo(() => {
    if (history.length > 0) {
      return history[history.length - 1];
    }
    if (settings.primaryUserId && people.some((p) => p.id === settings.primaryUserId)) {
      return settings.primaryUserId;
    }
    if (people.length > 0) {
      return people[0].id;
    }
    return null;
  }, [history, settings.primaryUserId, people]);

  const focusPerson = useMemo(() => {
    if (!focusPersonId) return null;
    return people.find((p) => p.id === focusPersonId) || null;
  }, [focusPersonId, people]);

  const setFocus = useCallback((personId: string) => {
    setHistory((prev) => {
      // Don't add if already focused
      if (prev.length > 0 && prev[prev.length - 1] === personId) {
        return prev;
      }
      // Limit history to 20 items to prevent memory issues
      const newHistory = [...prev, personId];
      if (newHistory.length > 20) {
        return newHistory.slice(-20);
      }
      return newHistory;
    });
  }, []);

  const clearFocus = useCallback(() => {
    setHistory([]);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return [];
      return prev.slice(0, -1);
    });
  }, []);

  const canGoBack = history.length > 1;

  return {
    focusPersonId,
    focusPerson,
    setFocus,
    clearFocus,
    goBack,
    canGoBack,
    history,
  };
}

/**
 * Calculate visual properties based on degree of separation from focus.
 */
export interface DegreeStyles {
  scale: number;
  opacity: number;
  width: number;
  showGlow: boolean;
}

export function getDegreeStyles(degree: number): DegreeStyles {
  if (degree === 0) {
    return { scale: 1.05, opacity: 1, width: 180, showGlow: true };
  }
  if (degree === 1) {
    return { scale: 1, opacity: 1, width: 160, showGlow: false };
  }
  if (degree === 2) {
    return { scale: 0.95, opacity: 0.85, width: 150, showGlow: false };
  }
  // degree 3+
  return { scale: 0.9, opacity: 0.7, width: 140, showGlow: false };
}
