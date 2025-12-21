"use client";

import { use, useMemo, useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RELATIONSHIP_CONFIG, EVENT_TYPE_CONFIG } from "@/types";
import { getBirthdayInfo, formatDateDisplay } from "@/lib/date-utils";
import { EditPersonDialog } from "@/components/people/edit-person-dialog";
import { FamilyBadge } from "@/components/people/family-badge";
import { AddEventDialog } from "@/components/events";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import {
  ArrowLeft,
  Cake,
  Mail,
  Phone,
  StickyNote,
  Calendar,
  Users,
  ArrowRight,
  Edit,
  Network,
  Crown,
  CalendarDays,
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  RefreshCw,
  Plus,
  FileQuestion,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getInitials, cn, getRelationshipColor } from "@/lib/utils";
import type { RelationshipType } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

const EVENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Gem,
  GraduationCap,
  Baby,
  Home,
  Briefcase,
  Palmtree,
  Calendar,
};

export default function PersonProfilePage({ params }: PageProps) {
  const { id } = use(params);
  const { people, relationships, events, settings } = useDataStore();
  const { getFamilyGroup, getFamilyColor } = useFamilyGroups();
  const relationshipColors = settings.relationshipColors;
  const { me, isMe, setAsMe, getMyRelationshipTo } = usePrimaryUser();
  const [showEditDialog, setShowEditDialog] = useState(false);

  const person = useMemo(() => people.find((p) => p.id === id), [people, id]);
  const personEvents = useMemo(() => events.filter((e) => e.personIds.includes(id)), [events, id]);
  const family = person ? getFamilyGroup(person.id) : null;
  const familyColor = person ? getFamilyColor(person.id) : null;
  const isThisPersonMe = person ? isMe(person.id) : false;
  const myRelationshipLabel = person && me && !isThisPersonMe ? getMyRelationshipTo(person) : null;

  const handleSetAsMe = () => {
    if (person) {
      setAsMe(person.id);
      toast.success(`${person.firstName} is now set as "Me"!`);
    }
  };

  // Get all relationships for this person (with type-safe filtering)
  const personRelationships = useMemo(() => {
    return relationships
      .filter((r) => r.personAId === id || r.personBId === id)
      .map((r) => {
        const isPersonA = r.personAId === id;
        const relatedPersonId = isPersonA ? r.personBId : r.personAId;
        const relatedPerson = people.find((p) => p.id === relatedPersonId);
        const relationType = isPersonA ? r.type : r.reverseType || r.type;

        return {
          relationship: r,
          relatedPerson,
          relationType,
        };
      })
      .filter((r): r is typeof r & { relatedPerson: NonNullable<typeof r.relatedPerson> } =>
        r.relatedPerson !== undefined
      );
  }, [relationships, people, id]);

  // Group relationships by type
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, typeof personRelationships> = {};

    personRelationships.forEach((rel) => {
      const config = RELATIONSHIP_CONFIG[rel.relationType as keyof typeof RELATIONSHIP_CONFIG];
      const group = config?.group || "other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(rel);
    });

    return groups;
  }, [personRelationships]);

  // Check for missing information (must be before early return to satisfy hooks rules)
  const missingInfo = useMemo(() => {
    if (!person) return [];
    const missing: string[] = [];
    if (!person.birthday) missing.push("birthday");
    if (!person.email) missing.push("email");
    if (!person.phone) missing.push("phone");
    return missing;
  }, [person]);

  const hasMissingInfo = missingInfo.length > 0;
  const birthday = person ? getBirthdayInfo(person.birthday) : null;

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-semibold mb-2">Person not found</h2>
        <p className="text-muted-foreground mb-4">This person doesn&apos;t exist or has been deleted.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to People
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Link>
      </Button>

      {/* Profile Header */}
      <Card className={cn(familyColor && `${familyColor.light} ${familyColor.border}`)}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative mx-auto sm:mx-0">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                {person.photo && <AvatarImage src={person.photo} alt={`Photo of ${person.firstName} ${person.lastName}`} />}
                <AvatarFallback className={cn(
                  "text-3xl",
                  familyColor ? `${familyColor.bg} text-white` : "bg-primary/10 text-primary"
                )}>
                  {getInitials(person.firstName, person.lastName)}
                </AvatarFallback>
              </Avatar>
              {familyColor && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-background",
                  familyColor.bg
                )} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold">
                      {person.firstName} {person.lastName}
                    </h1>
                    {isThisPersonMe && (
                      <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
                        <Crown className="h-3 w-3" />
                        Me
                      </Badge>
                    )}
                  </div>
                  {person.nickname && (
                    <p className="text-lg text-muted-foreground">&quot;{person.nickname}&quot;</p>
                  )}
                  {myRelationshipLabel && (
                    <p className="text-sm text-primary font-medium">
                      My {myRelationshipLabel.toLowerCase()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end w-full sm:w-auto mt-4 sm:mt-0">
                  {!isThisPersonMe && (
                    <Button variant="outline" onClick={handleSetAsMe} title="Set this person as Me">
                      <Crown className="h-4 w-4 mr-2" />
                      Set as Me
                    </Button>
                  )}
                  {family && (
                    <Button variant="outline" asChild>
                      <Link href={`/graph?family=${family.id}`}>
                        <Network className="h-4 w-4 mr-2" />
                        View Family
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Family & Tags */}
              <div className="flex flex-wrap gap-2">
                {family && <FamilyBadge family={family} showCount />}
                {person.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Quick Info */}
              <div className="grid gap-3 sm:grid-cols-2">
                {birthday && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`p-2 rounded-full ${birthday.isUpcoming || birthday.isToday ? "bg-orange-100 dark:bg-orange-900/30" : "bg-muted"}`}>
                      <Cake className={`h-4 w-4 ${birthday.isUpcoming || birthday.isToday ? "text-orange-600" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{birthday.display}</p>
                      <p className="text-muted-foreground">
                        {birthday.ageDisplay}
                        {birthday.isToday && " • Birthday today! 🎉"}
                        {birthday.isUpcoming && ` • In ${birthday.daysUntil} days`}
                      </p>
                    </div>
                  </div>
                )}

                {person.email && (
                  <a href={`mailto:${person.email}`} className="flex items-center gap-3 text-sm hover:bg-muted rounded-lg p-2 -m-2 transition-colors">
                    <div className="p-2 rounded-full bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{person.email}</p>
                      <p className="text-muted-foreground">Email</p>
                    </div>
                  </a>
                )}

                {person.phone && (
                  <a href={`tel:${person.phone}`} className="flex items-center gap-3 text-sm hover:bg-muted rounded-lg p-2 -m-2 transition-colors">
                    <div className="p-2 rounded-full bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{person.phone}</p>
                      <p className="text-muted-foreground">Phone</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Missing Info Prompt */}
              {hasMissingInfo && (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
                  <FileQuestion className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      Missing: {missingInfo.join(", ")}
                    </p>
                    <Button variant="link" size="sm" className="h-auto p-0 text-primary" asChild>
                      <Link href="/forms">
                        <Send className="h-3 w-3 mr-1" />
                        Create a form to request this info
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {person.notes && (
            <>
              <Separator className="my-6" />
              <div className="flex gap-3">
                <div className="p-2 rounded-full bg-muted h-fit">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium mb-1">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{person.notes}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Relationships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Relationships
            <Badge variant="secondary" className="ml-auto">
              {personRelationships.length} connections
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personRelationships.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No relationships defined yet.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Immediate Family */}
              {groupedRelationships.immediate && groupedRelationships.immediate.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Immediate Family
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedRelationships.immediate.map(({ relationship, relatedPerson, relationType }) => {
                      const config = RELATIONSHIP_CONFIG[relationType as keyof typeof RELATIONSHIP_CONFIG];
                      const color = getRelationshipColor(relationType as RelationshipType, relationshipColors);
                      return (
                        <Link
                          key={relationship.id}
                          href={`/person/${relatedPerson.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            {relatedPerson.photo && (
                              <AvatarImage src={relatedPerson.photo} alt={`Photo of ${relatedPerson.firstName} ${relatedPerson.lastName}`} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(relatedPerson.firstName, relatedPerson.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {relatedPerson.firstName} {relatedPerson.lastName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">
                                {config?.label || relationType}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extended Family */}
              {groupedRelationships.extended && groupedRelationships.extended.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Extended Family
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedRelationships.extended.map(({ relationship, relatedPerson, relationType }) => {
                      const config = RELATIONSHIP_CONFIG[relationType as keyof typeof RELATIONSHIP_CONFIG];
                      const color = getRelationshipColor(relationType as RelationshipType, relationshipColors);
                      return (
                        <Link
                          key={relationship.id}
                          href={`/person/${relatedPerson.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            {relatedPerson.photo && (
                              <AvatarImage src={relatedPerson.photo} alt={`Photo of ${relatedPerson.firstName} ${relatedPerson.lastName}`} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(relatedPerson.firstName, relatedPerson.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {relatedPerson.firstName} {relatedPerson.lastName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">
                                {config?.label || relationType}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Social (Friends, etc) */}
              {groupedRelationships.social && groupedRelationships.social.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Friends & Social
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedRelationships.social.map(({ relationship, relatedPerson, relationType }) => {
                      const config = RELATIONSHIP_CONFIG[relationType as keyof typeof RELATIONSHIP_CONFIG];
                      const color = getRelationshipColor(relationType as RelationshipType, relationshipColors);
                      return (
                        <Link
                          key={relationship.id}
                          href={`/person/${relatedPerson.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            {relatedPerson.photo && (
                              <AvatarImage src={relatedPerson.photo} alt={`Photo of ${relatedPerson.firstName} ${relatedPerson.lastName}`} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(relatedPerson.firstName, relatedPerson.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {relatedPerson.firstName} {relatedPerson.lastName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">
                                {config?.label || relationType}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Other */}
              {groupedRelationships.other && groupedRelationships.other.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Other
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {groupedRelationships.other.map(({ relationship, relatedPerson, relationType }) => {
                      const config = RELATIONSHIP_CONFIG[relationType as keyof typeof RELATIONSHIP_CONFIG];
                      const color = getRelationshipColor(relationType as RelationshipType, relationshipColors);
                      return (
                        <Link
                          key={relationship.id}
                          href={`/person/${relatedPerson.id}`}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            {relatedPerson.photo && (
                              <AvatarImage src={relatedPerson.photo} alt={`Photo of ${relatedPerson.firstName} ${relatedPerson.lastName}`} />
                            )}
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {getInitials(relatedPerson.firstName, relatedPerson.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {relatedPerson.firstName} {relatedPerson.lastName}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />
                              <span className="text-sm text-muted-foreground">
                                {config?.label || relationType}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Events & Milestones
              {personEvents.length > 0 && (
                <Badge variant="secondary">{personEvents.length}</Badge>
              )}
            </CardTitle>
            <AddEventDialog
              preselectedPersonIds={[id]}
              trigger={
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {personEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No events associated with {person.firstName} yet.
            </p>
          ) : (
            <div className="space-y-3">
              {personEvents
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((event) => {
                  const config = EVENT_TYPE_CONFIG[event.type];
                  const Icon = EVENT_ICON_MAP[config.icon] || Calendar;
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn("p-2 rounded-full", config.color, "text-white")}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateDisplay(event.date)}
                          {event.type === "custom" && event.customTypeName
                            ? ` • ${event.customTypeName}`
                            : ` • ${config.label}`}
                        </p>
                      </div>
                      {event.recurring && (
                        <Badge variant="secondary" className="gap-1">
                          <RefreshCw className="h-3 w-3" />
                          Yearly
                        </Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Added {new Date(person.createdAt).toLocaleDateString()}</span>
            {person.updatedAt !== person.createdAt && (
              <>
                <span>•</span>
                <span>Updated {new Date(person.updatedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditPersonDialog
        person={person}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </div>
  );
}
