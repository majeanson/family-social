"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddEventDialog, EventTimeline, EventCard } from "@/components/events";
import { CalendarDays, Search, List, LayoutGrid } from "lucide-react";
import type { EventType } from "@/types";
import { EVENT_TYPE_CONFIG } from "@/types";

export default function EventsPage() {
  const { events } = useDataStore();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [view, setView] = useState<"timeline" | "grid">("timeline");

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            Events & Milestones
          </h1>
          <p className="text-muted-foreground mt-1">
            Track important family dates and occasions
          </p>
        </div>
        <AddEventDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as EventType | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={view} onValueChange={(v) => setView(v as "timeline" | "grid")}>
          <TabsList>
            <TabsTrigger value="timeline">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{events.length} total events</span>
        <span>&middot;</span>
        <span>{events.filter((e) => e.recurring).length} recurring</span>
      </div>

      {/* Content */}
      {view === "timeline" ? (
        <EventTimeline events={filteredEvents} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p>No events found</p>
              {search || typeFilter !== "all" ? (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <p className="text-sm mt-1">Add your first event to get started</p>
              )}
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      )}
    </div>
  );
}
