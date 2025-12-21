"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";
import type { EventType, FamilyEventFormData, FamilyEvent, ReminderTiming } from "@/types";
import { EVENT_TYPE_CONFIG, REMINDER_TIMING_CONFIG, DEFAULT_NOTIFICATION_SETTINGS } from "@/types";

interface AddEventDialogProps {
  trigger?: React.ReactNode;
  preselectedPersonIds?: string[];
  event?: FamilyEvent;
  onSuccess?: () => void;
}

export function AddEventDialog({
  trigger,
  preselectedPersonIds = [],
  event,
  onSuccess,
}: AddEventDialogProps) {
  const { people, addEvent, updateEvent, settings } = useDataStore();
  const defaultTiming = settings.notifications?.defaultEventTiming ?? DEFAULT_NOTIFICATION_SETTINGS.defaultEventTiming;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FamilyEventFormData>({
    title: event?.title || "",
    date: event?.date || "",
    type: event?.type || "custom",
    description: event?.description || "",
    personIds: event?.personIds ?? preselectedPersonIds ?? [],
    recurring: event?.recurring,
    customTypeName: event?.customTypeName || "",
    reminder: event?.reminder,
  });
  const [isRecurring, setIsRecurring] = useState(!!event?.recurring);
  const [hasReminder, setHasReminder] = useState(!!event?.reminder);
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>(
    event?.reminder?.timing ?? defaultTiming
  );

  const isEditing = !!event;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }

    const eventData: FamilyEventFormData = {
      ...formData,
      recurring: isRecurring
        ? { frequency: formData.recurring?.frequency || "yearly" }
        : undefined,
      reminder: hasReminder
        ? { timing: reminderTiming }
        : undefined,
    };

    if (isEditing && event) {
      updateEvent(event.id, eventData);
      toast.success("Event updated");
    } else {
      addEvent(eventData);
      toast.success("Event added");
    }

    setOpen(false);
    onSuccess?.();

    // Reset form if not editing
    if (!isEditing) {
      setFormData({
        title: "",
        date: "",
        type: "custom",
        description: "",
        personIds: preselectedPersonIds,
        customTypeName: "",
      });
      setIsRecurring(false);
      setHasReminder(false);
      setReminderTiming(defaultTiming);
    }
  };

  const togglePerson = (personId: string) => {
    setFormData((prev) => ({
      ...prev,
      personIds: prev.personIds.includes(personId)
        ? prev.personIds.filter((id) => id !== personId)
        : [...prev.personIds, personId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Event" : "Add Event"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the event details below."
                : "Create a new family event or milestone."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Wedding Anniversary"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: EventType) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === "custom" && (
              <div className="grid gap-2">
                <Label htmlFor="customTypeName">Custom Type Name</Label>
                <Input
                  id="customTypeName"
                  placeholder="e.g., Reunion"
                  value={formData.customTypeName || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      customTypeName: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes..."
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="recurring" className="cursor-pointer">
                Recurring event (yearly)
              </Label>
            </div>

            {/* Reminder Settings */}
            <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reminder"
                  checked={hasReminder}
                  onCheckedChange={(checked) => setHasReminder(checked === true)}
                />
                <Label htmlFor="reminder" className="cursor-pointer flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Remind me
                </Label>
              </div>
              {hasReminder && (
                <Select
                  value={reminderTiming}
                  onValueChange={(value: ReminderTiming) => setReminderTiming(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REMINDER_TIMING_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Associated People</Label>
              <ScrollArea className="h-40 rounded-md border p-2">
                <div className="space-y-2">
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => togglePerson(person.id)}
                    >
                      <Checkbox
                        checked={formData.personIds.includes(person.id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => togglePerson(person.id)}
                      />
                      <Avatar className="h-8 w-8">
                        {person.photo && (
                          <AvatarImage src={person.photo} alt={person.firstName} />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(person.firstName, person.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {person.firstName} {person.lastName}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {formData.personIds.length} people selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
