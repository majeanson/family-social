"use client";

import { useState, useEffect, useCallback } from "react";
import { useDataStore } from "@/stores/data-store";

const TOUR_STORAGE_KEY = "famolo-tour-completed";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  highlight?: string; // Optional: element to highlight
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Famolo!",
    description: "Your private family & friends relationship manager. This tour will show you around the app. We've loaded some sample data so you can explore the features.",
    icon: "Sparkles",
  },
  {
    id: "people",
    title: "People Directory",
    description: "The home page shows all your people as cards. You can see their photo, birthday, relationships, and quick info at a glance. Tap any card to view their full profile.",
    icon: "Users",
  },
  {
    id: "relationships",
    title: "Relationship Connections",
    description: "Each person can have multiple relationships - family, friends, colleagues. The app automatically detects families and can suggest missing connections like in-laws or cousins.",
    icon: "Heart",
  },
  {
    id: "graph",
    title: "Visual Family Tree",
    description: "The Graph page visualizes your family tree. Tap on anyone to center the view on them. Double-tap to open their profile. Pink lines show spouses, gray lines show parent-child connections.",
    icon: "Network",
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    description: "The Dashboard shows upcoming birthdays, events, and reminders. It's your quick glance at what's happening in your family circle.",
    icon: "LayoutDashboard",
  },
  {
    id: "events",
    title: "Events & Milestones",
    description: "Track important dates like anniversaries, graduations, and family gatherings. Set reminders so you never miss a celebration.",
    icon: "Calendar",
  },
  {
    id: "me",
    title: "Set Yourself as 'Me'",
    description: "Go to Settings > Profile to set yourself as the primary user. This lets the app show relationships from your perspective - 'My mom', 'My cousin', etc.",
    icon: "Crown",
  },
  {
    id: "privacy",
    title: "Your Data, Your Control",
    description: "All data is stored locally on your device - we never see it. You can backup to Google Drive, export as JSON, or share specific profiles via temporary links.",
    icon: "Shield",
  },
  {
    id: "getstarted",
    title: "Ready to Start!",
    description: "The sample data will be replaced when you add your first person. Tap the '+' button on the home page to add yourself or a family member. Enjoy organizing your family connections!",
    icon: "Rocket",
  },
];

export function useAppTour() {
  const { hasMockData, isLoaded } = useDataStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // Default true to prevent flash

  // Check if tour was completed before
  useEffect(() => {
    if (typeof window !== "undefined") {
      const completed = localStorage.getItem(TOUR_STORAGE_KEY);
      setHasCompletedTour(completed === "true");
    }
  }, []);

  // Auto-open tour when mock data is present and tour not completed
  useEffect(() => {
    if (isLoaded && hasMockData && !hasCompletedTour) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, hasMockData, hasCompletedTour]);

  const nextStep = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOUR_STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const completeTour = useCallback(() => {
    setIsOpen(false);
    setHasCompletedTour(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const restartTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
    setHasCompletedTour(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
  }, []);

  const openTour = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    currentStepData: TOUR_STEPS[currentStep],
    steps: TOUR_STEPS,
    nextStep,
    prevStep,
    goToStep,
    skipTour,
    completeTour,
    restartTour,
    openTour,
    hasMockData,
    hasCompletedTour,
  };
}
