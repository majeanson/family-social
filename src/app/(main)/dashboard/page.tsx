"use client";

import { QuickReview } from "@/components/people/quick-review";
import { BirthdayWidget } from "@/components/dashboard/birthday-widget";
import { EventsWidget } from "@/components/dashboard/events-widget";
import { ReminderBanner, ReminderToasts } from "@/components/dashboard/reminder-alerts";
import { usePrimaryUser } from "@/features/use-primary-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { Crown, Users, Network, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { me, hasSetupMe } = usePrimaryUser();

  return (
    <div className="space-y-6">
      {/* Toast notifications for reminders */}
      <ReminderToasts />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your family overview at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/graph">
              <Network className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">View Graph</span>
              <span className="sr-only sm:hidden">View Graph</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Users className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">All People</span>
              <span className="sr-only sm:hidden">All People</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Reminder Banner - shows due reminders prominently */}
      <ReminderBanner />

      {/* Me Card */}
      {hasSetupMe && me ? (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-4 border-background shadow-lg">
                {me.photo && <AvatarImage src={me.photo} alt={me.firstName} />}
                <AvatarFallback className="bg-amber-500 text-white text-lg">
                  {getInitials(me.firstName, me.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{me.firstName} {me.lastName}</h2>
                  <Badge className="gap-1 bg-amber-500 hover:bg-amber-600 shrink-0">
                    <Crown className="h-3 w-3" aria-hidden="true" />
                    Me
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Viewing your network from your perspective
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto shrink-0" asChild>
                <Link href={`/person/${me.id}`}>
                  View Profile
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5 text-amber-500" />
              Set Up Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Set yourself as the primary user to view relationships from your perspective.
            </p>
            <Button asChild>
              <Link href="/onboarding">
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Widgets Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <BirthdayWidget />
        <EventsWidget />
      </div>

      {/* Quick Review Section */}
      <QuickReview />
    </div>
  );
}
