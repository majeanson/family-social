"use client";

import { memo } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useDataStore } from "@/stores/data-store";
import type { Person, RelationshipType } from "@/types";
import { RELATIONSHIP_CONFIG } from "@/types";
import { getBirthdayInfo } from "@/lib/date-utils";
import { getInitials, cn, getRelationshipColor } from "@/lib/utils";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import { FamilyBadge, FamilyDot } from "./family-badge";
import { Calendar, Mail, Phone, StickyNote, ArrowUpRight, Crown } from "lucide-react";

interface PersonCardProps {
  className?: string;
  person: Person;
}

export const PersonCard = memo(function PersonCard({ person, className }: PersonCardProps) {
  const { relationships, people, settings } = useDataStore();
  const { getFamilyGroup, getFamilyColor } = useFamilyGroups();
  const { isMe } = usePrimaryUser();
  const relationshipColors = settings.relationshipColors;
  const isThisPersonMe = isMe(person.id);
  const initials = getInitials(person.firstName, person.lastName);
  const birthday = getBirthdayInfo(person.birthday);
  const displayName = person.nickname || `${person.firstName} ${person.lastName}`;
  const family = getFamilyGroup(person.id);
  const familyColor = getFamilyColor(person.id);

  // Get relationships for this person
  const personRelationships = relationships
    .filter((r) => r.personAId === person.id || r.personBId === person.id)
    .slice(0, 2);

  return (
    <Link href={`/person/${person.id}`}>
      <Card className={cn(
        className,
        "group cursor-pointer transition-all hover:shadow-md h-full min-h-[220px] flex flex-col",
        familyColor
          ? `${familyColor.light} ${familyColor.border} hover:border-opacity-60`
          : "hover:border-primary/20"
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
              {person.photo && <AvatarImage src={person.photo} alt={`Photo of ${person.firstName} ${person.lastName}`} />}
              <AvatarFallback className={cn(
                "text-lg font-medium",
                familyColor ? `${familyColor.bg} text-white` : "bg-primary/10 text-primary"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <FamilyDot family={family} size="sm" className="absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              {isThisPersonMe && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] px-1.5 py-0 h-4 gap-0.5 flex-shrink-0">
                  <Crown className="h-2.5 w-2.5" />
                  Me
                </Badge>
              )}
            </div>
            {person.nickname && (
              <p className="text-sm text-muted-foreground truncate">
                {person.firstName} {person.lastName}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              {family && <FamilyBadge family={family} size="sm" />}
              {person.tags.slice(0, family ? 2 : 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {person.tags.length > (family ? 2 : 3) && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  +{person.tags.length - (family ? 2 : 3)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3 flex-1 flex flex-col">
        {/* Relationships */}
        {personRelationships.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {personRelationships.map((rel) => {
              const isPersonA = rel.personAId === person.id;
              const relatedPerson = people.find(
                (p) => p.id === (isPersonA ? rel.personBId : rel.personAId)
              );
              const relType = isPersonA ? rel.type : rel.reverseType || rel.type;
              if (!relatedPerson) return null;
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-1 text-xs bg-muted/50 rounded-full px-2 py-0.5"
                >
                  <span
                    className={`h-4 w-4 rounded flex items-center justify-center text-white ${getRelationshipColor(relType as RelationshipType, relationshipColors)}`}
                  >
                    <span className="text-[10px]">
                      {(RELATIONSHIP_CONFIG[relType as keyof typeof RELATIONSHIP_CONFIG]?.label || relType || "?").charAt(0).toUpperCase()}
                    </span>
                  </span>
                  <span className="text-muted-foreground truncate max-w-[80px]">
                    {relatedPerson.firstName}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {birthday && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{birthday.shortDisplay}</span>
              {(birthday.isToday || birthday.isUpcoming) && (
                <Badge
                  variant={birthday.isToday ? "default" : "secondary"}
                  className="text-[10px] px-1 py-0 h-4"
                >
                  {birthday.isToday ? "Today!" : `${birthday.daysUntil}d`}
                </Badge>
              )}
            </span>
          )}
          {person.email && (
            <span className="flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-[140px]">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{person.email}</span>
            </span>
          )}
          {person.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{person.phone}</span>
            </span>
          )}
        </div>

        {/* Notes preview */}
        {person.notes && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
            <StickyNote className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="line-clamp-2 leading-relaxed">{person.notes}</p>
          </div>
        )}

        {/* Spacer to push View Profile to bottom */}
        <div className="flex-1" />

        {/* View Profile indicator */}
        <div className="flex items-center justify-end text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
          <span>View Profile</span>
          <ArrowUpRight className="h-3 w-3 ml-1" aria-hidden="true" />
        </div>
      </CardContent>
      </Card>
    </Link>
  );
});
