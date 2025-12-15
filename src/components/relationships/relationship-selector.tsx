"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type RelationshipType,
  RELATIONSHIP_CONFIG,
  getGroupedRelationshipTypes,
} from "@/types";
import {
  User,
  Baby,
  Users,
  Heart,
  HeartHandshake,
  Crown,
  Sparkles,
  UserCircle,
  UserCircle2,
  Link,
  UserPlus,
  Smile,
  Briefcase,
  MoreHorizontal,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Baby,
  Users,
  Heart,
  HeartHandshake,
  Crown,
  Sparkles,
  UserCircle,
  UserCircle2,
  Link,
  UserPlus,
  Smile,
  Briefcase,
  MoreHorizontal,
};

interface RelationshipSelectorProps {
  value?: RelationshipType;
  onValueChange: (value: RelationshipType) => void;
  placeholder?: string;
  className?: string;
}

export function RelationshipSelector({
  value,
  onValueChange,
  placeholder = "Select relationship...",
  className,
}: RelationshipSelectorProps) {
  const groups = getGroupedRelationshipTypes();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value && <RelationshipDisplay type={value} />}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {groups.map((group) => (
          <SelectGroup key={group.group}>
            <SelectLabel className="text-xs font-semibold text-muted-foreground">
              {group.label}
            </SelectLabel>
            {group.types.map((type) => {
              const config = RELATIONSHIP_CONFIG[type];
              const Icon = ICON_MAP[config.icon];
              return (
                <SelectItem key={type} value={type}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded",
                        config.color,
                        "text-white"
                      )}
                    >
                      {Icon && <Icon className="h-3 w-3" />}
                    </span>
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

interface RelationshipDisplayProps {
  type: RelationshipType;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function RelationshipDisplay({
  type,
  showLabel = true,
  size = "md",
}: RelationshipDisplayProps) {
  const config = RELATIONSHIP_CONFIG[type];
  const Icon = ICON_MAP[config.icon];
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  const badgeSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex items-center justify-center rounded",
          badgeSize,
          config.color,
          "text-white"
        )}
      >
        {Icon && <Icon className={iconSize} />}
      </span>
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

interface RelationshipBadgeProps {
  type: RelationshipType;
  className?: string;
}

export function RelationshipBadge({ type, className }: RelationshipBadgeProps) {
  const config = RELATIONSHIP_CONFIG[type];
  const Icon = ICON_MAP[config.icon];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color,
        "text-white",
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
