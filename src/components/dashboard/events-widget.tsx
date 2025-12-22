"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { useDataStore } from "@/stores/data-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  Calendar,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Flower2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextOccurrence, getOrdinal } from "@/lib/date-utils";
import { EVENT_TYPE_CONFIG } from "@/types";
import { AddEventDialog } from "@/components/events/add-event-dialog";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  Calendar,
  Flower2,
};

export const EventsWidget = memo(function EventsWidget() {
  const { events } = useDataStore();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming: Array<{
      event: typeof events[0];
      nextDate: Date;
      daysUntil: number;
    }> = [];

    for (const event of events) {
      if (event.recurring) {
        // For recurring events, find next occurrence
        const { date, daysUntil } = getNextOccurrence(event.date);
        if (daysUntil <= 30) {
          upcoming.push({ event, nextDate: date, daysUntil });
        }
      } else {
        // For one-time events
        const eventDate = new Date(event.date);
        if (eventDate >= now && eventDate <= thirtyDaysFromNow) {
          const daysUntil = Math.floor(
            (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          upcoming.push({ event, nextDate: eventDate, daysUntil });
        }
      }
    }

    return upcoming
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);
  }, [events]);

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-purple-500" aria-hidden="true" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4 mb-4">
            No events tracked yet
          </p>
          <AddEventDialog
            trigger={
              <Button variant="outline" className="w-full">
                Add Your First Event
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="h-5 w-5 text-purple-500" aria-hidden="true" />
              Upcoming Events
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">
                View All
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No events in the next 30 days
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-purple-500" aria-hidden="true" />
            Upcoming Events
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">
              View All
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.map(({ event, nextDate, daysUntil }) => {
          const config = EVENT_TYPE_CONFIG[event.type] ?? EVENT_TYPE_CONFIG.custom;
          const Icon = ICON_MAP[config.icon] ?? Calendar;

          // Calculate anniversary year for recurring events
          const eventYear = new Date(event.date).getFullYear();
          const nextYear = nextDate.getFullYear();
          const anniversaryYear = event.recurring ? nextYear - eventYear : null;

          return (
            <Link
              key={event.id}
              href="/events"
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={cn("p-2 rounded-full", config.color, "text-white")}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {nextDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {anniversaryYear && anniversaryYear > 0 && ` · ${getOrdinal(anniversaryYear)} year`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {event.recurring && (
                  <RefreshCw className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                )}
                {daysUntil === 0 ? (
                  <Badge className="bg-purple-500 hover:bg-purple-600">Today</Badge>
                ) : daysUntil <= 7 ? (
                  <Badge variant="secondary">{daysUntil}d</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">{daysUntil}d</span>
                )}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
});
