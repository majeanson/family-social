"use client";

import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { getBirthdayInfo } from "@/lib/date-utils";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import { getDegreeStyles } from "./hooks/use-focus-state";
import type { Person } from "@/types";
import { Crown, Calendar } from "lucide-react";

export interface PersonNodeProps {
  person: Person;
  degree: number;
  isFocused: boolean;
  onClick?: (personId: string) => void;
  showBirthday?: boolean;
  compact?: boolean;
}

export const PersonNode = memo(function PersonNode({
  person,
  degree,
  isFocused,
  onClick,
  showBirthday = true,
  compact = false,
}: PersonNodeProps) {
  const { getFamilyColor } = useFamilyGroups();
  const { isMe } = usePrimaryUser();
  const familyColor = getFamilyColor(person.id);
  const isThisPersonMe = isMe(person.id);
  const initials = getInitials(person.firstName, person.lastName);
  const birthday = getBirthdayInfo(person.birthday);
  const displayName = person.nickname || person.firstName;
  const styles = getDegreeStyles(degree);

  const handleClick = () => {
    onClick?.(person.id);
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card transition-all",
          "hover:shadow-md hover:border-primary/30 cursor-pointer",
          isFocused && "ring-2 ring-primary ring-offset-2",
          familyColor && `${familyColor.light} ${familyColor.border}`
        )}
        style={{ opacity: styles.opacity }}
      >
        <Avatar className="h-8 w-8">
          {person.photo && <AvatarImage src={person.photo} alt={`Photo of ${person.firstName} ${person.lastName}`} />}
          <AvatarFallback
            className={cn(
              "text-xs font-medium",
              familyColor ? `${familyColor.bg} text-white` : "bg-primary/10"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium truncate max-w-[100px]">
          {displayName}
        </span>
        {isThisPersonMe && (
          <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex flex-col items-center p-4 rounded-xl border-2 bg-card transition-all",
        "hover:shadow-lg cursor-pointer",
        isFocused && "ring-4 ring-primary/50 border-primary shadow-lg shadow-primary/20",
        !isFocused && "hover:border-primary/30",
        familyColor && `${familyColor.light} ${familyColor.border}`
      )}
      style={{
        width: styles.width,
        opacity: styles.opacity,
        transform: `scale(${styles.scale})`,
      }}
    >
      {/* Avatar */}
      <div className="relative mb-3">
        <Avatar
          className={cn(
            "ring-2 ring-background shadow-md",
            isFocused ? "h-16 w-16" : "h-14 w-14"
          )}
        >
          {person.photo && <AvatarImage src={person.photo} alt={`Photo of ${person.firstName} ${person.lastName}`} />}
          <AvatarFallback
            className={cn(
              "text-lg font-medium",
              familyColor ? `${familyColor.bg} text-white` : "bg-primary/10 text-primary"
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {isThisPersonMe && (
          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
            <Crown className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-center space-y-1 w-full">
        <h3 className="font-semibold text-sm leading-tight truncate px-1">
          {displayName}
        </h3>
        {person.nickname && (
          <p className="text-xs text-muted-foreground truncate px-1">
            {person.firstName} {person.lastName}
          </p>
        )}
        {!person.nickname && person.lastName && (
          <p className="text-xs text-muted-foreground truncate px-1">
            {person.lastName}
          </p>
        )}
      </div>

      {/* Birthday */}
      {showBirthday && birthday && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <span>{birthday.shortDisplay}</span>
          {birthday.isToday && (
            <Badge variant="default" className="text-[10px] px-1 py-0 h-4">
              Today!
            </Badge>
          )}
        </div>
      )}

      {/* Focus indicator glow */}
      {styles.showGlow && (
        <div
          className="absolute inset-0 -z-10 rounded-xl bg-primary/20 blur-xl"
          style={{ transform: "scale(1.1)" }}
        />
      )}
    </button>
  );
});

/**
 * Spouse pair - displays two people side by side with connection
 */
export interface SpousePairProps {
  primary: Person;
  spouse: Person;
  focusPersonId: string | null;
  degrees: Map<string, number>;
  onPersonClick?: (personId: string) => void;
}

export const SpousePair = memo(function SpousePair({
  primary,
  spouse,
  focusPersonId,
  degrees,
  onPersonClick,
}: SpousePairProps) {
  const primaryDegree = degrees.get(primary.id) ?? Infinity;
  const spouseDegree = degrees.get(spouse.id) ?? Infinity;

  return (
    <div className="flex items-center gap-3">
      <PersonNode
        person={primary}
        degree={primaryDegree}
        isFocused={primary.id === focusPersonId}
        onClick={onPersonClick}
      />
      {/* Spouse connector */}
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-rose-400" />
        <div className="w-2 h-2 rounded-full bg-rose-400" />
        <div className="w-4 h-0.5 bg-rose-400" />
      </div>
      <PersonNode
        person={spouse}
        degree={spouseDegree}
        isFocused={spouse.id === focusPersonId}
        onClick={onPersonClick}
      />
    </div>
  );
});
