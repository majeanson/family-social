"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useDataStore } from "@/stores/data-store";
import { useFamilyGroups } from "@/features/use-family-groups";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELATIONSHIP_CONFIG } from "@/types";
import { getBirthdayInfo } from "@/lib/date-utils";
import { getInitials, cn } from "@/lib/utils";
import { Users, Calendar, Phone, Mail, ArrowUpRight, Sparkles } from "lucide-react";

export function QuickReview() {
  const { people, relationships } = useDataStore();
  const { familyGroups, getFamilyColor, colors } = useFamilyGroups();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(
    familyGroups.length > 0 ? familyGroups[0].id : null
  );

  const selectedFamily = familyGroups.find((g) => g.id === selectedFamilyId);

  // Get family members
  const familyMembers = useMemo(() => {
    if (!selectedFamily) return people.slice(0, 12);
    return people.filter((p) => selectedFamily.memberIds.has(p.id));
  }, [people, selectedFamily]);

  // Get relationship map for this family
  const relationshipMap = useMemo(() => {
    const map = new Map<string, { name: string; type: string }[]>();
    relationships.forEach((rel) => {
      const personA = people.find((p) => p.id === rel.personAId);
      const personB = people.find((p) => p.id === rel.personBId);
      if (!personA || !personB) return;

      // Only include if both are in family
      if (selectedFamily) {
        if (!selectedFamily.memberIds.has(rel.personAId) || !selectedFamily.memberIds.has(rel.personBId)) {
          return;
        }
      }

      const aRels = map.get(rel.personAId) || [];
      aRels.push({ name: personB.firstName, type: rel.type });
      map.set(rel.personAId, aRels);

      const bRels = map.get(rel.personBId) || [];
      bRels.push({ name: personA.firstName, type: rel.reverseType || rel.type });
      map.set(rel.personBId, bRels);
    });
    return map;
  }, [relationships, people, selectedFamily]);

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No people to review</h2>
        <p className="text-muted-foreground max-w-md">
          Add some family members to use Quick Review.
        </p>
      </div>
    );
  }

  const familyColor = selectedFamily
    ? colors[selectedFamily.colorIndex % colors.length]
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quick Review</h2>
          <p className="text-muted-foreground text-sm">
            At-a-glance view of your {selectedFamily ? selectedFamily.name : "contacts"}
          </p>
        </div>

        {/* Family Selector */}
        {familyGroups.length > 0 && (
          <Select
            value={selectedFamilyId || "all"}
            onValueChange={(v) => setSelectedFamilyId(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select family..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {familyGroups.map((group) => {
                const color = colors[group.colorIndex % colors.length];
                return (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                      <span>{group.name}</span>
                      <span className="text-muted-foreground text-xs">({group.memberIds.size})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Family Stats Bar */}
      {selectedFamily && familyColor && (
        <Card className={`${familyColor.light} ${familyColor.border}`}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${familyColor.bg} flex items-center justify-center`}>
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedFamily.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedFamily.memberIds.size} members
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold">
                    {familyMembers.filter((m) => getBirthdayInfo(m.birthday)?.isUpcoming).length}
                  </div>
                  <div className="text-muted-foreground text-xs">Upcoming Birthdays</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    {familyMembers.filter((m) => m.email).length}
                  </div>
                  <div className="text-muted-foreground text-xs">With Email</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    {familyMembers.filter((m) => m.phone).length}
                  </div>
                  <div className="text-muted-foreground text-xs">With Phone</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Review Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {familyMembers.map((person) => {
          const birthday = getBirthdayInfo(person.birthday);
          const rels = relationshipMap.get(person.id) || [];
          const personFamilyColor = getFamilyColor(person.id);

          return (
            <Link key={person.id} href={`/person/${person.id}`}>
              <Card
                className={cn(
                  "group cursor-pointer transition-all hover:shadow-md h-full",
                  personFamilyColor
                    ? `${personFamilyColor.light} ${personFamilyColor.border} hover:opacity-90`
                    : "hover:border-primary/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 ring-2 ring-background">
                      {person.photo && <AvatarImage src={person.photo} alt={person.firstName} />}
                      <AvatarFallback
                        className={cn(
                          "font-medium",
                          personFamilyColor ? `${personFamilyColor.bg} text-white` : "bg-primary/10 text-primary"
                        )}
                      >
                        {getInitials(person.firstName, person.lastName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {person.firstName}
                        </h4>
                        {birthday?.isToday && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            Birthday!
                          </Badge>
                        )}
                        {birthday?.isUpcoming && !birthday.isToday && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {birthday.daysUntil}d
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {person.lastName}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Quick Info Row */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {birthday && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {birthday.shortDisplay}
                      </span>
                    )}
                    {person.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Yes
                      </span>
                    )}
                    {person.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Yes
                      </span>
                    )}
                  </div>

                  {/* Relationships */}
                  {rels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rels.slice(0, 3).map((rel, i) => {
                        const config = RELATIONSHIP_CONFIG[rel.type as keyof typeof RELATIONSHIP_CONFIG];
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] bg-background/50 rounded px-1.5 py-0.5"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${config?.color || "bg-gray-400"}`} />
                            {rel.name}
                          </span>
                        );
                      })}
                      {rels.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">
                          +{rels.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
