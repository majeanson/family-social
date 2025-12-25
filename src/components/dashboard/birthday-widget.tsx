"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useBirthdayReminders } from "@/features/use-birthday-reminders";
import { getInitials, getDisplayName } from "@/lib/utils";
import { Cake, PartyPopper, Gift } from "lucide-react";

export const BirthdayWidget = memo(function BirthdayWidget() {
  const upcomingBirthdays = useBirthdayReminders(30, 5);

  if (upcomingBirthdays.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cake className="h-5 w-5 text-pink-500" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming birthdays in the next 30 days
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="h-5 w-5 text-pink-500" />
          Upcoming Birthdays
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingBirthdays.map(({ person, info }) => (
          <Link
            key={person.id}
            href={`/person/${person.id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10">
              {person.photo && <AvatarImage src={person.photo} alt={person.firstName} />}
              <AvatarFallback className="bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                {getInitials(person.firstName, person.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {person.nickname || getDisplayName(person.firstName, person.lastName)}
              </p>
              <p className="text-sm text-muted-foreground">
                {info.shortDisplay} &middot; Turning {info.age + 1}
              </p>
            </div>
            {info.isToday ? (
              <Badge className="bg-pink-500 hover:bg-pink-600 gap-1">
                <PartyPopper className="h-3 w-3" />
                Today!
              </Badge>
            ) : info.daysUntil <= 7 ? (
              <Badge variant="secondary" className="gap-1">
                <Gift className="h-3 w-3" />
                {info.daysUntil}d
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">
                {info.daysUntil}d
              </span>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
});
