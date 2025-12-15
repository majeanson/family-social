"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FamilyGroup } from "@/features/use-family-groups";
import { useDataStore } from "@/stores/data-store";
import { DEFAULT_FAMILY_COLORS, type FamilyColorConfig } from "@/types";

interface FamilyBadgeProps {
  family: FamilyGroup | null;
  size?: "sm" | "default";
  showCount?: boolean;
  className?: string;
  colors?: FamilyColorConfig[];
}

export function FamilyBadge({
  family,
  size = "default",
  showCount = false,
  className,
  colors: propColors
}: FamilyBadgeProps) {
  const { settings } = useDataStore();

  if (!family) return null;

  // Use prop colors, then settings colors, then defaults (ensure non-empty array)
  const settingsColors = (settings.familyColors && settings.familyColors.length > 0)
    ? settings.familyColors
    : DEFAULT_FAMILY_COLORS;
  const colors = propColors || settingsColors;
  const color = colors[family.colorIndex % colors.length];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-normal",
        color.light,
        color.border,
        size === "sm" && "text-xs px-1.5 py-0",
        className
      )}
    >
      <span className={cn("rounded-full", color.bg, size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5")} />
      {family.name}
      {showCount && (
        <span className="text-muted-foreground">({family.memberIds.size})</span>
      )}
    </Badge>
  );
}

interface FamilyDotProps {
  family: FamilyGroup | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  colors?: FamilyColorConfig[];
}

export function FamilyDot({ family, size = "md", className, colors: propColors }: FamilyDotProps) {
  const { settings } = useDataStore();

  if (!family) return null;

  // Use prop colors, then settings colors, then defaults (ensure non-empty array)
  const settingsColors = (settings.familyColors && settings.familyColors.length > 0)
    ? settings.familyColors
    : DEFAULT_FAMILY_COLORS;
  const colors = propColors || settingsColors;
  const color = colors[family.colorIndex % colors.length];
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "rounded-full border-2 border-white shadow-sm",
        color.bg,
        sizeClasses[size],
        className
      )}
      title={family.name}
    />
  );
}
