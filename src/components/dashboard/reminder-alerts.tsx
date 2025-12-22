"use client";

import { useEffect, useState, memo } from "react";
import Link from "next/link";
import { useEventReminders, useDismissReminder, type DueReminder } from "@/features";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Bell,
  Cake,
  CalendarDays,
  X,
  ChevronRight,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Track which reminders we've shown toasts for this session
const shownToasts = new Set<string>();

/**
 * Component that shows toast notifications for due reminders on mount
 */
export function ReminderToasts() {
  const reminders = useEventReminders();

  useEffect(() => {
    // Only show toasts for reminders we haven't already shown
    for (const reminder of reminders) {
      if (shownToasts.has(reminder.id)) continue;
      shownToasts.add(reminder.id);

      // Don't spam the user with too many toasts at once
      if (shownToasts.size > 3) break;

      const icon = reminder.type === "birthday" ? "🎂" : "📅";
      const urgency = reminder.isToday
        ? "Today!"
        : reminder.daysUntil === 1
        ? "Tomorrow"
        : `in ${reminder.daysUntil} days`;

      toast(
        <div className="flex items-start gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="font-medium">{reminder.title}</p>
            <p className="text-sm text-muted-foreground">{urgency}</p>
          </div>
        </div>,
        {
          duration: 5000,
          action: reminder.person ? {
            label: "View",
            onClick: () => {
              window.location.href = `/person/${reminder.person!.id}`;
            },
          } : undefined,
        }
      );
    }
  }, [reminders]);

  return null;
}

/**
 * Banner component showing upcoming reminders
 */
export const ReminderBanner = memo(function ReminderBanner() {
  const reminders = useEventReminders();
  const dismissReminder = useDismissReminder();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filter out dismissed reminders
  const visibleReminders = reminders.filter((r) => !dismissed.has(r.id));

  if (visibleReminders.length === 0) {
    return null;
  }

  const handleDismiss = (reminder: DueReminder) => {
    setDismissed((prev) => new Set(prev).add(reminder.id));
    dismissReminder(reminder);
  };

  // Group by today vs upcoming
  const todayReminders = visibleReminders.filter((r) => r.isToday);
  const upcomingReminders = visibleReminders.filter((r) => !r.isToday);

  return (
    <div className="space-y-3">
      {/* Today's reminders - more prominent */}
      {todayReminders.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper className="h-5 w-5 text-amber-600" aria-hidden="true" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Today!
              </h3>
              <Badge className="bg-amber-500 hover:bg-amber-600">
                {todayReminders.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {todayReminders.map((reminder) => (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onDismiss={() => handleDismiss(reminder)}
                  variant="today"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-5 w-5 text-blue-500" aria-hidden="true" />
              <h3 className="font-semibold">Upcoming Reminders</h3>
              <Badge variant="secondary">{upcomingReminders.length}</Badge>
            </div>
            <div className="space-y-2">
              {upcomingReminders.slice(0, 5).map((reminder) => (
                <ReminderItem
                  key={reminder.id}
                  reminder={reminder}
                  onDismiss={() => handleDismiss(reminder)}
                  variant="upcoming"
                />
              ))}
              {upcomingReminders.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{upcomingReminders.length - 5} more reminders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

interface ReminderItemProps {
  reminder: DueReminder;
  onDismiss: () => void;
  variant: "today" | "upcoming";
}

function ReminderItem({ reminder, onDismiss, variant }: ReminderItemProps) {
  const Icon = reminder.type === "birthday" ? Cake : CalendarDays;
  const iconColor = reminder.type === "birthday" ? "text-pink-500" : "text-purple-500";

  const href = reminder.person
    ? `/person/${reminder.person.id}`
    : "/events";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors",
        variant === "today"
          ? "bg-white/50 dark:bg-black/20"
          : "hover:bg-muted/50"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor)} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{reminder.title}</p>
        <p className="text-sm text-muted-foreground">
          {reminder.isToday
            ? "Today"
            : reminder.daysUntil === 1
            ? "Tomorrow"
            : `${reminder.daysUntil} days away`}
          {reminder.type === "event" &&
            reminder.event?.recurring &&
            " (yearly)"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href={href}>
            <span className="sr-only">View</span>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onDismiss}
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
