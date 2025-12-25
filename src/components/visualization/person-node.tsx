"use client";

import { memo, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";
import { getBirthdayInfo } from "@/lib/date-utils";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import { getDegreeStyles } from "./hooks/use-focus-state";
import type { Person } from "@/types";
import { Crown, Calendar } from "lucide-react";

const DOUBLE_TAP_DELAY = 400; // ms

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
  const router = useRouter();
  const { getFamilyColor } = useFamilyGroups();
  const { isMe } = usePrimaryUser();
  const familyColor = getFamilyColor(person.id);
  const isThisPersonMe = isMe(person.id);
  const initials = getInitials(person.firstName, person.lastName);
  const birthday = useMemo(() => getBirthdayInfo(person.birthday), [person.birthday]);
  const displayName = person.nickname || person.firstName;
  const styles = getDegreeStyles(degree);

  // Track last tap time for double-tap detection
  const lastTapRef = useRef<number>(0);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Stop propagation to prevent parent drag handlers from interfering
    e.stopPropagation();

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
      // Double tap - navigate to profile
      router.push(`/person/${person.id}`);
      lastTapRef.current = 0; // Reset to prevent triple-tap issues
    } else {
      // Single tap - focus on person
      onClick?.(person.id);
      lastTapRef.current = now;
    }
  }, [onClick, person.id, router]);

  // Stop propagation on pointer down to prevent parent drag from starting
  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  if (compact) {
    return (
      <button
        onClick={handleClick}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border bg-card transition-all",
          "hover:shadow-md hover:border-primary/30 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
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
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border-2 bg-card transition-all",
        "hover:shadow-lg cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
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

