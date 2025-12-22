"use client";

import { useDataStore } from "@/stores/data-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Cake, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { ReminderTiming } from "@/types";
import { REMINDER_TIMING_CONFIG, DEFAULT_NOTIFICATION_SETTINGS } from "@/types";

export function NotificationSettingsCard() {
  const { settings, updateSettings } = useDataStore();

  // Get notification settings with defaults
  const notifications = settings.notifications || DEFAULT_NOTIFICATION_SETTINGS;

  const handleToggle = (key: keyof typeof notifications, value: boolean) => {
    updateSettings({
      notifications: { ...notifications, [key]: value },
    });
    toast.success("Notification settings updated");
  };

  const handleTimingChange = (key: "birthdayTiming" | "defaultEventTiming", value: ReminderTiming) => {
    updateSettings({
      notifications: { ...notifications, [key]: value },
    });
    toast.success("Reminder timing updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" aria-hidden="true" />
          Notifications & Reminders
        </CardTitle>
        <CardDescription>
          Configure when and how you receive reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">Enable Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Show reminders for upcoming events and birthdays
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={notifications.enabled}
            onCheckedChange={(checked) => handleToggle("enabled", checked)}
          />
        </div>

        {notifications.enabled && (
          <>
            <Separator />

            {/* Birthday reminders */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cake className="h-4 w-4 text-pink-500" aria-hidden="true" />
                <span className="font-medium">Birthday Reminders</span>
              </div>

              <div className="flex items-center justify-between pl-6">
                <Label htmlFor="birthday-reminders">Show birthday reminders</Label>
                <Switch
                  id="birthday-reminders"
                  checked={notifications.birthdayReminders}
                  onCheckedChange={(checked) => handleToggle("birthdayReminders", checked)}
                />
              </div>

              {notifications.birthdayReminders && (
                <div className="flex items-center justify-between pl-6">
                  <Label htmlFor="birthday-timing">Remind me</Label>
                  <Select
                    value={notifications.birthdayTiming}
                    onValueChange={(v) => handleTimingChange("birthdayTiming", v as ReminderTiming)}
                  >
                    <SelectTrigger className="w-[180px]" id="birthday-timing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMINDER_TIMING_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            {/* Event reminders */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" aria-hidden="true" />
                <span className="font-medium">Event Reminders</span>
              </div>

              <div className="flex items-center justify-between pl-6">
                <Label htmlFor="event-reminders">Show event reminders</Label>
                <Switch
                  id="event-reminders"
                  checked={notifications.eventReminders}
                  onCheckedChange={(checked) => handleToggle("eventReminders", checked)}
                />
              </div>

              {notifications.eventReminders && (
                <div className="flex items-center justify-between pl-6">
                  <Label htmlFor="event-timing">Default reminder</Label>
                  <Select
                    value={notifications.defaultEventTiming}
                    onValueChange={(v) => handleTimingChange("defaultEventTiming", v as ReminderTiming)}
                  >
                    <SelectTrigger className="w-[180px]" id="event-timing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMINDER_TIMING_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
