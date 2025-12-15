"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Person } from "@/types";
import { Calendar, Mail, Phone } from "lucide-react";

interface PersonCardProps {
  person: Person;
  onClick?: () => void;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatBirthday(birthday?: string): string | null {
  if (!birthday) return null;
  const date = new Date(birthday);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PersonCard({ person, onClick }: PersonCardProps) {
  const initials = getInitials(person.firstName, person.lastName);
  const birthday = formatBirthday(person.birthday);
  const displayName = person.nickname || `${person.firstName} ${person.lastName}`;

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Avatar className="h-12 w-12">
          {person.photo && <AvatarImage src={person.photo} alt={displayName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base">{displayName}</CardTitle>
          {person.nickname && (
            <CardDescription className="text-xs">
              {person.firstName} {person.lastName}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {person.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {person.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {birthday && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {birthday}
            </span>
          )}
          {person.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {person.email}
            </span>
          )}
          {person.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {person.phone}
            </span>
          )}
        </div>

        {person.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {person.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
