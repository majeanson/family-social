"use client";

import { memo } from "react";
import Link from "next/link";
import { useDataStore } from "@/stores/data-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getInitials, cn } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/date-utils";
import type { FamilyEvent } from "@/types";
import { EVENT_TYPE_CONFIG } from "@/types";
import { AddEventDialog } from "./add-event-dialog";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  Calendar,
};

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getAnniversaryYear(eventDate: string): number | null {
  const date = new Date(eventDate);
  const now = new Date();
  const years = now.getFullYear() - date.getFullYear();

  // Check if the anniversary has passed this year
  const thisYearAnniversary = new Date(now.getFullYear(), date.getMonth(), date.getDate());
  if (thisYearAnniversary > now) {
    return years > 0 ? years : null;
  }
  return years > 0 ? years : null;
}

interface EventCardProps {
  event: FamilyEvent;
  showPeople?: boolean;
  compact?: boolean;
}

export const EventCard = memo(function EventCard({
  event,
  showPeople = true,
  compact = false,
}: EventCardProps) {
  const { people, deleteEvent } = useDataStore();
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = ICON_MAP[config.icon] || Calendar;
  const associatedPeople = people.filter((p) => event.personIds.includes(p.id));
  const dateDisplay = formatDateDisplay(event.date);
  const anniversaryYear = event.recurring ? getAnniversaryYear(event.date) : null;

  const handleDelete = () => {
    deleteEvent(event.id);
    toast.success("Event deleted");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
        <div className={cn("p-2 rounded-full", config.color, "text-white")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          <p className="text-sm text-muted-foreground">{dateDisplay}</p>
        </div>
        {event.recurring && (
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Yearly
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-full", config.color, "text-white")}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{event.title}</h3>
              <p className="text-sm text-muted-foreground">
                {event.type === "custom" && event.customTypeName
                  ? event.customTypeName
                  : config.label}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <AddEventDialog
                event={event}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Event</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &ldquo;{event.title}&rdquo;? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{dateDisplay}</span>
          {event.recurring && (
            <Badge variant="secondary" className="gap-1 ml-auto">
              <RefreshCw className="h-3 w-3" />
              {anniversaryYear
                ? `${getOrdinal(anniversaryYear)} year`
                : event.recurring.frequency === "yearly"
                ? "Yearly"
                : "Monthly"}
            </Badge>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}

        {showPeople && associatedPeople.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Associated with</p>
            <div className="flex flex-wrap gap-2">
              {associatedPeople.slice(0, 5).map((person) => (
                <Link
                  key={person.id}
                  href={`/person/${person.id}`}
                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Avatar className="h-5 w-5">
                    {person.photo && (
                      <AvatarImage src={person.photo} alt={person.firstName} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(person.firstName, person.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {person.nickname || person.firstName}
                  </span>
                </Link>
              ))}
              {associatedPeople.length > 5 && (
                <span className="text-xs text-muted-foreground self-center">
                  +{associatedPeople.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
