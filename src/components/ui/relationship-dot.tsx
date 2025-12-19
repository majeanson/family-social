"use client";

import { useDataStore } from "@/stores/data-store";
import { getRelationshipColor } from "@/lib/utils";
import type { RelationshipType } from "@/types";
import { cn } from "@/lib/utils";

interface RelationshipDotProps {
  type: RelationshipType | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * A unified relationship color indicator that respects user's personalized colors.
 * Use this component wherever relationship colors are displayed to ensure consistency.
 */
export function RelationshipDot({ type, size = "sm", className }: RelationshipDotProps) {
  const { settings } = useDataStore();
  const color = getRelationshipColor(type as RelationshipType, settings.relationshipColors);

  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn("rounded-full", sizeClasses[size], color, className)}
      aria-hidden="true"
    />
  );
}
