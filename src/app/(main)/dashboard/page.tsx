"use client";

import { QuickReview } from "@/components/people/quick-review";
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your family overview at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/graph">
              <Network className="h-4 w-4 mr-2" />
              View Graph
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Users className="h-4 w-4 mr-2" />
              All People
            </Link>
          </Button>
        </div>
      </div>

      {/* Me Card */}
      {hasSetupMe && me ? (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-background shadow-lg">
                {me.photo && <AvatarImage src={me.photo} alt={me.firstName} />}
                <AvatarFallback className="bg-amber-500 text-white text-lg">
                  {getInitials(me.firstName, me.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{me.firstName} {me.lastName}</h2>
                  <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
                    <Crown className="h-3 w-3" />
                    Me
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Viewing your network from your perspective
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/person/${me.id}`}>
                  View Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
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

      {/* Quick Review Section */}
      <QuickReview />
    </div>
  );
}
