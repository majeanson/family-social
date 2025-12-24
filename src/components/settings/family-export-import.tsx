"use client";

import { useState, useRef, useCallback } from "react";
import { useDataStore } from "@/stores/data-store";
import { useFamilyGroups } from "@/features";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Users,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  UserCheck,
  UserPlus,
  SkipForward,
  FileJson,
} from "lucide-react";
import {
  exportFamily,
  downloadFamilyExport,
  parseFamilyExportFile,
  detectDuplicates,
  groupDuplicatesByImportPerson,
  importFamily,
  type FamilyExportData,
  type DuplicateMatch,
  type PersonImportDecision,
  type ImportDecision,
} from "@/lib/family-export";
import type { Person, RelationshipType, FamilyEvent } from "@/types";

export function FamilyExportImport() {
  const {
    people,
    relationships,
    events,
    addPerson,
    updatePerson,
    addRelationship,
    addEvent,
  } = useDataStore();
  const { familyGroups } = useFamilyGroups();

  // Export state
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("");

  // Import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<FamilyExportData | null>(null);
  const [importStep, setImportStep] = useState<"upload" | "review" | "complete">("upload");
  const [duplicateMatches, setDuplicateMatches] = useState<Map<string, DuplicateMatch[]>>(new Map());
  const [importDecisions, setImportDecisions] = useState<Map<string, PersonImportDecision>>(new Map());
  const [importResult, setImportResult] = useState<{
    peopleImported: number;
    peopleMerged: number;
    peopleSkipped: number;
    relationshipsImported: number;
    eventsImported: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle family export
  const handleExport = useCallback(() => {
    const familyGroup = familyGroups.find(g => g.id === selectedFamilyId);
    if (!familyGroup) {
      toast.error("Please select a family to export");
      return;
    }

    const data = exportFamily(familyGroup, people, relationships, events);
    downloadFamilyExport(data);
    toast.success(`${familyGroup.name} exported successfully!`);
    setShowExportDialog(false);
    setSelectedFamilyId("");
  }, [selectedFamilyId, familyGroups, people, relationships, events]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await parseFamilyExportFile(file);
    if (!data) {
      toast.error("Invalid family export file. Please check the file format.");
      return;
    }

    setImportData(data);

    // Detect duplicates
    const matches = detectDuplicates(data.people, people);
    const grouped = groupDuplicatesByImportPerson(matches);
    setDuplicateMatches(grouped);

    // Initialize decisions
    const decisions = new Map<string, PersonImportDecision>();
    for (const person of data.people) {
      const personMatches = grouped.get(person.id);
      if (personMatches && personMatches.length > 0) {
        // Default to merge with the best match
        decisions.set(person.id, {
          importPerson: person,
          decision: "merge",
          existingPersonId: personMatches[0].existingPerson.id,
        });
      } else {
        // No duplicates, create new
        decisions.set(person.id, {
          importPerson: person,
          decision: "create_new",
        });
      }
    }
    setImportDecisions(decisions);
    setImportStep("review");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Update decision for a person
  const updateDecision = (personId: string, decision: ImportDecision, existingPersonId?: string) => {
    const current = importDecisions.get(personId);
    if (current) {
      setImportDecisions(new Map(importDecisions.set(personId, {
        ...current,
        decision,
        existingPersonId,
      })));
    }
  };

  // Handle import
  const handleImport = useCallback(() => {
    if (!importData) return;

    setIsImporting(true);

    try {
      const decisionsArray = Array.from(importDecisions.values());
      // Wrapper to match expected function signatures
      const addRelWrapper = (personAId: string, personBId: string, type: RelationshipType) => {
        addRelationship(personAId, personBId, type);
      };
      const addEventWrapper = (event: Omit<FamilyEvent, "id" | "createdAt" | "updatedAt">) => {
        return addEvent(event);
      };
      const result = importFamily(
        importData,
        decisionsArray,
        people,
        relationships,
        addPerson,
        updatePerson,
        addRelWrapper,
        addEventWrapper
      );

      setImportResult({
        peopleImported: result.peopleImported,
        peopleMerged: result.peopleMerged,
        peopleSkipped: result.peopleSkipped,
        relationshipsImported: result.relationshipsImported,
        eventsImported: result.eventsImported,
      });
      setImportStep("complete");
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import family. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }, [importData, importDecisions, people, relationships, addPerson, updatePerson, addRelationship, addEvent]);

  // Reset import state
  const resetImport = () => {
    setShowImportDialog(false);
    setImportData(null);
    setImportStep("upload");
    setDuplicateMatches(new Map());
    setImportDecisions(new Map());
    setImportResult(null);
  };

  // Get summary of decisions
  const getDecisionSummary = () => {
    let create = 0, merge = 0, skip = 0;
    importDecisions.forEach(d => {
      if (d.decision === "create_new") create++;
      else if (d.decision === "merge") merge++;
      else if (d.decision === "skip") skip++;
    });
    return { create, merge, skip };
  };

  const selectedFamily = familyGroups.find(g => g.id === selectedFamilyId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Export & Import
          </CardTitle>
          <CardDescription>
            Share family data with other users or import families from others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Export Family</p>
                  <p className="text-xs text-muted-foreground">
                    Save a family group to share
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                className="w-full"
                disabled={familyGroups.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Family
              </Button>
              {familyGroups.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  No family groups to export yet
                </p>
              )}
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Import Family</p>
                  <p className="text-xs text-muted-foreground">
                    Add a family from export file
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => {
                  setShowImportDialog(true);
                  setImportStep("upload");
                }}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Family
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Family
            </DialogTitle>
            <DialogDescription>
              Select a family group to export. The export includes all family members, their relationships, and related events.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Family</Label>
              <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a family..." />
                </SelectTrigger>
                <SelectContent>
                  {familyGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <span>{group.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.memberIds.size} members
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFamily && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Export will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {selectedFamily.memberIds.size} people</li>
                  <li>• Their relationships within the family</li>
                  <li>• Events involving family members</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={!selectedFamilyId}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => !open && resetImport()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Family
              {importStep === "review" && importData && (
                <Badge variant="secondary">{importData.familyName}</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {importStep === "upload" && "Select a family export file to import."}
              {importStep === "review" && "Review and resolve any duplicate people before importing."}
              {importStep === "complete" && "Import complete!"}
            </DialogDescription>
          </DialogHeader>

          {/* Upload Step */}
          {importStep === "upload" && (
            <div className="py-8">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileJson className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Drop a family export file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Select File
                </Button>
              </div>
            </div>
          )}

          {/* Review Step */}
          {importStep === "review" && importData && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Summary */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{importData.people.length}</p>
                  <p className="text-xs text-muted-foreground">People</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{importData.relationships.length}</p>
                  <p className="text-xs text-muted-foreground">Relationships</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{importData.events.length}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="flex-1 text-sm">
                  {duplicateMatches.size > 0 ? (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      {duplicateMatches.size} potential duplicate(s) found
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      No duplicates detected
                    </div>
                  )}
                </div>
              </div>

              {/* People list */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3 pb-4">
                  {importData.people.map(person => {
                    const matches = duplicateMatches.get(person.id) || [];
                    const decision = importDecisions.get(person.id);
                    const hasMatches = matches.length > 0;

                    return (
                      <div
                        key={person.id}
                        className={`p-3 rounded-lg border ${hasMatches ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-muted/30"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">
                              {person.firstName} {person.lastName}
                            </p>
                            {person.email && (
                              <p className="text-xs text-muted-foreground">{person.email}</p>
                            )}
                            {hasMatches && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                                  Possible match: {matches[0].existingPerson.firstName} {matches[0].existingPerson.lastName}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {matches[0].matchReasons.map((reason, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex gap-2">
                            <label className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`decision-${person.id}`}
                                value="create_new"
                                checked={decision?.decision === "create_new"}
                                onChange={() => updateDecision(person.id, "create_new")}
                                className="h-3 w-3"
                              />
                              <span className="text-xs flex items-center gap-1">
                                <UserPlus className="h-3 w-3" />
                                New
                              </span>
                            </label>
                            {hasMatches && (
                              <label className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`decision-${person.id}`}
                                  value="merge"
                                  checked={decision?.decision === "merge"}
                                  onChange={() => updateDecision(person.id, "merge", matches[0]?.existingPerson.id)}
                                  className="h-3 w-3"
                                />
                                <span className="text-xs flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  Merge
                                </span>
                              </label>
                            )}
                            <label className="flex items-center space-x-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`decision-${person.id}`}
                                value="skip"
                                checked={decision?.decision === "skip"}
                                onChange={() => updateDecision(person.id, "skip")}
                                className="h-3 w-3"
                              />
                              <span className="text-xs flex items-center gap-1">
                                <SkipForward className="h-3 w-3" />
                                Skip
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Decision summary */}
              <div className="pt-4 border-t">
                {(() => {
                  const summary = getDecisionSummary();
                  return (
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">Will import:</span>
                      <Badge variant="default" className="gap-1">
                        <UserPlus className="h-3 w-3" />
                        {summary.create} new
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="h-3 w-3" />
                        {summary.merge} merge
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <SkipForward className="h-3 w-3" />
                        {summary.skip} skip
                      </Badge>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Complete Step */}
          {importStep === "complete" && importResult && (
            <div className="py-8 text-center">
              <div className="mx-auto w-fit rounded-full bg-green-500/10 p-4 mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-6">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{importResult.peopleImported}</p>
                  <p className="text-xs text-muted-foreground">People Added</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{importResult.peopleMerged}</p>
                  <p className="text-xs text-muted-foreground">People Merged</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{importResult.relationshipsImported}</p>
                  <p className="text-xs text-muted-foreground">Relationships</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{importResult.eventsImported}</p>
                  <p className="text-xs text-muted-foreground">Events</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {importStep === "upload" && (
              <Button variant="outline" onClick={resetImport}>
                Cancel
              </Button>
            )}
            {importStep === "review" && (
              <>
                <Button variant="outline" onClick={() => setImportStep("upload")}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Import Family
                    </>
                  )}
                </Button>
              </>
            )}
            {importStep === "complete" && (
              <Button onClick={resetImport}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
