"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
  Clock,
  Loader2,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { getInitials, getDisplayName } from "@/lib/utils";
import { v4 as uuid } from "uuid";
import type { RelationshipType } from "@/types";

interface SharedPerson {
  tempId: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  photo?: string;
  notes?: string;
  tags?: string[];
  customFields?: Array<{
    id: string;
    label: string;
    value: string;
    type: "text" | "date" | "url" | "number";
  }>;
}

interface SharedRelationship {
  personATempId: string;
  personBTempId: string;
  type: string;
  reverseType?: string;
  label?: string;
}

interface FamilyShareData {
  type: "family";
  familyName?: string;
  people: SharedPerson[];
  relationships: SharedRelationship[];
  createdAt: string;
  expiresAt: string;
  sharedBy?: string;
}

export default function ImportFamilyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { addPerson, addRelationship, people } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<FamilyShareData | null>(null);
  const [imported, setImported] = useState(false);
  const [importing, setImporting] = useState(false);

  // Track which people to import (all selected by default)
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [includeRelationships, setIncludeRelationships] = useState(true);

  // Detect potential duplicates
  const duplicates = useMemo(() => {
    if (!shareData) return new Map<string, string>();
    const dupes = new Map<string, string>();

    shareData.people.forEach((sharedPerson) => {
      const existing = people.find(
        (p) =>
          p.firstName.toLowerCase() === sharedPerson.firstName.toLowerCase() &&
          p.lastName?.toLowerCase() === (sharedPerson.lastName || "").toLowerCase()
      );
      if (existing) {
        dupes.set(sharedPerson.tempId, existing.id);
      }
    });

    return dupes;
  }, [shareData, people]);

  // Fetch share data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/share/family/${code}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Link not found or expired");
          return;
        }
        const data: FamilyShareData = await res.json();
        setShareData(data);
        // Select all people by default
        setSelectedPeopleIds(data.people.map((p) => p.tempId));
      } catch {
        setError("Failed to load share data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [code]);

  const togglePerson = (tempId: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(tempId)
        ? prev.filter((id) => id !== tempId)
        : [...prev, tempId]
    );
  };

  const handleImport = async () => {
    if (!shareData || selectedPeopleIds.length === 0) return;

    setImporting(true);

    try {
      // Map from tempId to new real ID
      const idMap = new Map<string, string>();

      // Import selected people
      for (const sharedPerson of shareData.people) {
        if (!selectedPeopleIds.includes(sharedPerson.tempId)) continue;

        // Skip if duplicate and we already have this person
        if (duplicates.has(sharedPerson.tempId)) {
          idMap.set(sharedPerson.tempId, duplicates.get(sharedPerson.tempId)!);
          continue;
        }

        const newId = uuid();
        idMap.set(sharedPerson.tempId, newId);

        addPerson({
          firstName: sharedPerson.firstName,
          lastName: sharedPerson.lastName || "",
          nickname: sharedPerson.nickname,
          email: sharedPerson.email,
          phone: sharedPerson.phone,
          birthday: sharedPerson.birthday,
          photo: sharedPerson.photo,
          notes: sharedPerson.notes,
          tags: sharedPerson.tags || [],
          customFields: sharedPerson.customFields || [],
        });
      }

      // Import relationships between selected people
      if (includeRelationships) {
        for (const rel of shareData.relationships) {
          const personAId = idMap.get(rel.personATempId);
          const personBId = idMap.get(rel.personBTempId);

          // Only add if both people were imported
          if (personAId && personBId) {
            addRelationship(
              personAId,
              personBId,
              rel.type as RelationshipType,
              rel.label
            );
          }
        }
      }

      const importedCount = selectedPeopleIds.filter(
        (id) => !duplicates.has(id)
      ).length;
      const skippedCount = selectedPeopleIds.filter(
        (id) => duplicates.has(id)
      ).length;

      setImported(true);

      if (skippedCount > 0) {
        toast.success(
          `Imported ${importedCount} people (${skippedCount} duplicates skipped)`
        );
      } else {
        toast.success(`Imported ${importedCount} people!`);
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Failed to import some data");
    } finally {
      setImporting(false);
    }
  };

  const handleViewPeople = () => {
    router.push("/");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading shared family...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !shareData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription>
              {error || "This share link is no longer available."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleViewPeople}>
              Go to People
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (imported) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-green-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Import Complete!</CardTitle>
            <CardDescription>
              {selectedPeopleIds.length} people have been added to your contacts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleViewPeople}>
              View All People
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresAt = new Date(shareData.expiresAt);
  const timeLeft = Math.max(
    0,
    Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  );

  const selectedCount = selectedPeopleIds.length;
  const duplicateCount = selectedPeopleIds.filter((id) =>
    duplicates.has(id)
  ).length;
  const newCount = selectedCount - duplicateCount;

  // Get relationships that will be imported
  const relevantRelationships = shareData.relationships.filter(
    (rel) =>
      selectedPeopleIds.includes(rel.personATempId) &&
      selectedPeopleIds.includes(rel.personBTempId)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-fit rounded-full bg-primary/10 p-3">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Import Family</h1>
        <p className="text-muted-foreground">
          {shareData.sharedBy
            ? `${shareData.sharedBy} shared ${shareData.people.length} people with you`
            : `${shareData.people.length} people shared with you`}
        </p>
      </div>

      {/* Expiry notice */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>
          Link expires in{" "}
          {timeLeft > 24
            ? `${Math.ceil(timeLeft / 24)} days`
            : `${timeLeft} hours`}
        </span>
      </div>

      {/* Duplicate warning */}
      {duplicateCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {duplicateCount} potential duplicate{duplicateCount > 1 ? "s" : ""} detected
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              People with matching names will be linked rather than duplicated.
            </p>
          </div>
        </div>
      )}

      {/* People list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>People</CardTitle>
              <CardDescription>
                Select which people to import
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedPeopleIds(shareData.people.map((p) => p.tempId))
                }
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPeopleIds([])}
              >
                Deselect All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {shareData.people.map((person) => {
                const isDuplicate = duplicates.has(person.tempId);
                const isSelected = selectedPeopleIds.includes(person.tempId);

                return (
                  <div
                    key={person.tempId}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => togglePerson(person.tempId)}
                    />
                    <Avatar className="h-10 w-10">
                      {person.photo && <AvatarImage src={person.photo} />}
                      <AvatarFallback>
                        {getInitials(person.firstName, person.lastName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {getDisplayName(person.firstName, person.lastName)}
                        </p>
                        {isDuplicate && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            Exists
                          </Badge>
                        )}
                      </div>
                      {person.email && (
                        <p className="text-sm text-muted-foreground truncate">
                          {person.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Relationships */}
      {shareData.relationships.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Relationships
                </CardTitle>
                <CardDescription>
                  {relevantRelationships.length} relationship
                  {relevantRelationships.length !== 1 ? "s" : ""} between
                  selected people
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-relationships"
                  checked={includeRelationships}
                  onCheckedChange={(checked) =>
                    setIncludeRelationships(checked === true)
                  }
                />
                <label
                  htmlFor="include-relationships"
                  className="text-sm cursor-pointer"
                >
                  Import relationships
                </label>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Summary & Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Will import:</p>
              <p className="text-lg font-semibold">
                {newCount} new {newCount === 1 ? "person" : "people"}
                {duplicateCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    ({duplicateCount} already exist)
                  </span>
                )}
              </p>
              {includeRelationships && relevantRelationships.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  + {relevantRelationships.length} relationship
                  {relevantRelationships.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleViewPeople}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={selectedPeopleIds.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Import Selected
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
