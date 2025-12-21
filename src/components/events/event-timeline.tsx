"use client";

import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { EventCard } from "./event-card";
import type { FamilyEvent } from "@/types";

interface EventTimelineProps {
  events?: FamilyEvent[];
  showPeople?: boolean;
}

export function EventTimeline({ events: propEvents, showPeople = true }: EventTimelineProps) {
  const { events: storeEvents } = useDataStore();
  const events = propEvents || storeEvents;

  const groupedEvents = useMemo(() => {
    // Group events by year
    const groups: Record<string, FamilyEvent[]> = {};

    const sortedEvents = [...events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const event of sortedEvents) {
      const year = new Date(event.date).getFullYear().toString();
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(event);
    }

    return groups;
  }, [events]);

  const years = Object.keys(groupedEvents).sort((a, b) => Number(b) - Number(a));

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No events yet</p>
        <p className="text-sm mt-1">Add your first event to start tracking milestones</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-background py-2 z-10">
            {year}
          </h2>
          <div className="space-y-4 pl-4 border-l-2 border-muted">
            {groupedEvents[year].map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[calc(1rem+5px)] top-4 w-2.5 h-2.5 rounded-full bg-primary" />
                <EventCard event={event} showPeople={showPeople} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
