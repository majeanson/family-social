"use client";

import { useMemo, useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RelationshipBadge } from "@/components/relationships";
import { RELATIONSHIP_CONFIG } from "@/types";
import { GitBranch, Users, ArrowRight, LayoutGrid, Network } from "lucide-react";
import Link from "next/link";
import { VisualizationContainer } from "@/components/visualization";
import { useFamilyGroups } from "@/features/use-family-groups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, getRelationshipColor } from "@/lib/utils";
import { type RelationshipType } from "@/types";

export default function GraphPage() {
  const { people, relationships, settings } = useDataStore();
  const { familyGroups } = useFamilyGroups();
  const relationshipColors = settings.relationshipColors;
  const [activeTab, setActiveTab] = useState<"graph" | "list">("graph");

  // Build relationship map
  const relationshipMap = useMemo(() => {
    const map = new Map<string, { personId: string; type: string; name: string }[]>();

    relationships.forEach((rel) => {
      const personA = people.find((p) => p.id === rel.personAId);
      const personB = people.find((p) => p.id === rel.personBId);

      if (personA && personB) {
        // Add to personA's relationships
        const aRels = map.get(rel.personAId) || [];
        aRels.push({
          personId: rel.personBId,
          type: rel.type,
          name: `${personB.firstName} ${personB.lastName}`,
        });
        map.set(rel.personAId, aRels);

        // Add to personB's relationships (with reverse type)
        const bRels = map.get(rel.personBId) || [];
        bRels.push({
          personId: rel.personAId,
          type: rel.reverseType || rel.type,
          name: `${personA.firstName} ${personA.lastName}`,
        });
        map.set(rel.personBId, bRels);
      }
    });

    return map;
  }, [people, relationships]);

  // Find people with most connections (for display hierarchy)
  const sortedPeople = useMemo(() => {
    return [...people].sort((a, b) => {
      const aConnections = relationshipMap.get(a.id)?.length || 0;
      const bConnections = relationshipMap.get(b.id)?.length || 0;
      return bConnections - aConnections;
    });
  }, [people, relationshipMap]);

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <GitBranch className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No relationships to show</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Add some people and their relationships to visualize your family tree.
        </p>
        <Button asChild>
          <Link href="/">Add People</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relationship Graph</h1>
          <p className="text-muted-foreground mt-1">
            Visualize connections between {people.length} people and {relationships.length} relationships
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{people.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{relationships.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Family Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{familyGroups.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Graph and List views */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "graph" | "list")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="graph" className="gap-2">
            <Network className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        {/* Graph View - New Visualization System */}
        <TabsContent value="graph" className="mt-6">
          <VisualizationContainer />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6 space-y-6">
          {/* Relationship View */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Connections</h2>

            {relationships.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No relationships defined yet. Add relationships when creating or editing people.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {relationships.map((rel) => {
                  const personA = people.find((p) => p.id === rel.personAId);
                  const personB = people.find((p) => p.id === rel.personBId);
                  if (!personA || !personB) return null;

                  return (
                    <Card key={rel.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Person A */}
                          <Link
                            href={`/person/${personA.id}`}
                            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-10 w-10">
                              {personA.photo && (
                                <AvatarImage src={personA.photo} alt={personA.firstName} />
                              )}
                              <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                {getInitials(personA.firstName, personA.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {personA.firstName} {personA.lastName}
                              </p>
                            </div>
                          </Link>

                          {/* Relationship */}
                          <div className="flex flex-col items-center gap-1 px-4">
                            <RelationshipBadge type={rel.type} />
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>

                          {/* Person B */}
                          <Link
                            href={`/person/${personB.id}`}
                            className="flex items-center gap-3 flex-1 min-w-0 justify-end hover:opacity-80 transition-opacity"
                          >
                            <div className="min-w-0 text-right">
                              <p className="font-medium truncate">
                                {personB.firstName} {personB.lastName}
                              </p>
                            </div>
                            <Avatar className="h-10 w-10">
                              {personB.photo && (
                                <AvatarImage src={personB.photo} alt={personB.firstName} />
                              )}
                              <AvatarFallback className="text-sm bg-primary/10 text-primary">
                                {getInitials(personB.firstName, personB.lastName)}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* People with their connections */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">People & Their Connections</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPeople.map((person) => {
                const connections = relationshipMap.get(person.id) || [];
                return (
                  <Link key={person.id} href={`/person/${person.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            {person.photo && (
                              <AvatarImage src={person.photo} alt={person.firstName} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(person.firstName, person.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {person.firstName} {person.lastName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {connections.length} connection{connections.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      {connections.length > 0 && (
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-2">
                            {connections.slice(0, 4).map((conn, idx) => {
                              const config = RELATIONSHIP_CONFIG[conn.type as keyof typeof RELATIONSHIP_CONFIG];
                              const color = getRelationshipColor(conn.type as RelationshipType, relationshipColors);
                              return (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs gap-1"
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${color}`}
                                  />
                                  {config?.label || conn.type}: {conn.name.split(" ")[0]}
                                </Badge>
                              );
                            })}
                            {connections.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{connections.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
