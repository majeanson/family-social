"use client";

import { useRef, useState } from "react";
import { useDataStore } from "@/stores/data-store";
import {
  downloadJSON,
  importFromFile,
  getStorage,
  supportsFileSystemAccess,
  FileSystemStorageAdapter,
} from "@/services/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Settings,
  Download,
  Upload,
  FolderOpen,
  Trash2,
  HardDrive,
  Cloud,
  AlertTriangle,
  ClipboardPaste,
  UserPlus,
  Sun,
  Moon,
  Monitor,
  Palette,
  RotateCcw,
  Crown,
  X,
} from "lucide-react";
import type { AppSettings, PersonFormData, FamilyColorConfig, RelationshipType, CustomField } from "@/types";
import { DEFAULT_FAMILY_COLORS, RELATIONSHIP_CONFIG, getGroupedRelationshipTypes } from "@/types";
import { v4 as uuid } from "uuid";
import { GoogleDriveSync } from "@/components/sync/google-drive-sync";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import { COLOR_OPTIONS, RELATIONSHIP_COLOR_OPTIONS, getRelationshipColor, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Known field keys (lowercase)
const KNOWN_FIELD_KEYS = new Set([
  "first name", "firstname", "name",
  "last name", "lastname",
  "nickname", "nick",
  "email", "e-mail",
  "phone", "telephone", "mobile",
  "birthday", "birth date", "birthdate",
  "photo",
  "notes", "dietary restrictions",
]);

// Parse text format response (from Copy Text / Native Share)
function parseTextResponse(text: string): PersonFormData | null {
  try {
    const lines = text.split("\n");
    const data: Record<string, string> = {};
    const originalKeys: Record<string, string> = {}; // Store original casing

    for (const line of lines) {
      // Skip empty lines, separators, and headers
      if (!line.trim() || line.startsWith("---") || line.startsWith("📋") ||
          line.startsWith("Submitted:") || line.startsWith("Sent via")) {
        continue;
      }

      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const originalKey = line.substring(0, colonIndex).trim();
        const key = originalKey.toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        if (value && value !== "(not provided)") {
          data[key] = value;
          originalKeys[key] = originalKey;
        }
      }
    }

    // Map common field names
    const firstName = data["first name"] || data["firstname"] || data["name"]?.split(" ")[0] || "";
    if (!firstName) return null;

    // Extract custom fields (fields not in known keys)
    const customFields: CustomField[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (!KNOWN_FIELD_KEYS.has(key)) {
        customFields.push({
          id: uuid(),
          label: originalKeys[key] || key,
          value,
          type: "text",
        });
      }
    }

    return {
      firstName,
      lastName: data["last name"] || data["lastname"] || data["name"]?.split(" ").slice(1).join(" ") || "",
      nickname: data["nickname"] || data["nick"] || "",
      email: data["email"] || data["e-mail"] || "",
      phone: data["phone"] || data["telephone"] || data["mobile"] || "",
      birthday: data["birthday"] || data["birth date"] || data["birthdate"] || "",
      notes: data["notes"] || data["dietary restrictions"] || "",
      tags: [],
      customFields,
    };
  } catch {
    return null;
  }
}

// Known field keys for JSON (case-insensitive matching)
const KNOWN_JSON_FIELD_KEYS = new Set([
  "first name", "firstname",
  "last name", "lastname",
  "nickname",
  "email",
  "phone",
  "birthday", "birth date", "birthdate",
  "photo",
  "notes", "dietary restrictions",
]);

// Parse JSON format response
function parseJSONResponse(json: string): PersonFormData | null {
  try {
    const parsed = JSON.parse(json);
    const responses = parsed.responses || parsed;

    const firstName = responses["First Name"] || responses["firstName"] || responses.firstName || "";
    if (!firstName) return null;

    // Extract custom fields (fields not in known keys)
    const customFields: CustomField[] = [];
    for (const [key, value] of Object.entries(responses)) {
      const keyLower = key.toLowerCase();
      if (!KNOWN_JSON_FIELD_KEYS.has(keyLower) && typeof value === "string" && value.trim()) {
        customFields.push({
          id: uuid(),
          label: key,
          value: value,
          type: "text",
        });
      }
    }

    return {
      firstName,
      lastName: responses["Last Name"] || responses["lastName"] || responses.lastName || "",
      nickname: responses["Nickname"] || responses["nickname"] || "",
      email: responses["Email"] || responses["email"] || "",
      phone: responses["Phone"] || responses["phone"] || "",
      birthday: responses["Birthday"] || responses["birthday"] || responses["Birth Date"] || "",
      notes: responses["Notes"] || responses["notes"] || responses["Dietary Restrictions"] || "",
      tags: [],
      customFields,
    };
  } catch {
    return null;
  }
}

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    exportData,
    loadData,
    resetData,
    addPerson,
    people,
    relationships,
    formTemplates,
    lastSaved,
  } = useDataStore();
  const { familyGroups } = useFamilyGroups();
  const { me, setAsMe, clearMe } = usePrimaryUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseFileInputRef = useRef<HTMLInputElement>(null);
  const [pastedResponse, setPastedResponse] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Get current family colors from settings or defaults
  const familyColors = settings.familyColors || DEFAULT_FAMILY_COLORS;

  const handleChangeFamilyColor = (index: number, newColor: FamilyColorConfig) => {
    const newColors = [...familyColors];
    newColors[index] = newColor;
    updateSettings({ familyColors: newColors });
    toast.success("Family color updated!");
  };

  const handleResetColors = () => {
    updateSettings({ familyColors: DEFAULT_FAMILY_COLORS });
    toast.success("Colors reset to defaults");
  };

  // Get current relationship colors from settings
  const relationshipColors = settings.relationshipColors || {};

  const handleChangeRelationshipColor = (type: RelationshipType, newColor: string) => {
    const newColors = { ...relationshipColors, [type]: newColor };
    updateSettings({ relationshipColors: newColors });
    toast.success(`${RELATIONSHIP_CONFIG[type].label} color updated!`);
  };

  const handleResetRelationshipColors = () => {
    updateSettings({ relationshipColors: {} });
    toast.success("Relationship colors reset to defaults");
  };

  // Get grouped relationship types for display
  const groupedRelationships = getGroupedRelationshipTypes();

  const handleExport = () => {
    const data = exportData();
    downloadJSON(data);
    toast.success("Data exported successfully!");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromFile(file);
    if (result.success && result.data) {
      loadData(result.data);
      toast.success("Data imported successfully!");
    } else {
      toast.error(result.error || "Failed to import data. Please check the file format.");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChangeFile = async () => {
    if (supportsFileSystemAccess()) {
      const adapter = new FileSystemStorageAdapter();
      const handle = await adapter.openExistingFile();
      if (handle) {
        const data = await adapter.read();
        if (data) {
          loadData(data);
          toast.success("Switched to new data file!");
        }
      }
    }
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleConfirmReset = () => {
    resetData();
    toast.success("All data has been reset");
    setShowResetConfirm(false);
  };

  const handleImportResponse = () => {
    if (!pastedResponse.trim()) {
      toast.error("Please paste a response first");
      return;
    }

    // Try JSON first, then text format
    let personData = parseJSONResponse(pastedResponse);
    if (!personData) {
      personData = parseTextResponse(pastedResponse);
    }

    if (personData) {
      addPerson(personData);
      toast.success(`Added ${personData.firstName} ${personData.lastName || ""} to your people!`);
      setPastedResponse("");
    } else {
      toast.error("Could not parse the response. Make sure you pasted the complete response.");
    }
  };

  const handleImportResponseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const personData = parseJSONResponse(text);

      if (personData) {
        addPerson(personData);
        toast.success(`Added ${personData.firstName} ${personData.lastName || ""} to your people!`);
      } else {
        toast.error("Could not parse the file. Make sure it's a valid response JSON.");
      }
    } catch {
      toast.error("Failed to read the file.");
    }

    // Reset file input
    if (responseFileInputRef.current) {
      responseFileInputRef.current.value = "";
    }
  };

  const storageType = getStorage().getStorageType();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your preferences and data
        </p>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Data Summary
          </CardTitle>
          <CardDescription>
            Overview of your stored data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{people.length}</div>
              <div className="text-sm text-muted-foreground">People</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{relationships.length}</div>
              <div className="text-sm text-muted-foreground">Relationships</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold">{formTemplates.length}</div>
              <div className="text-sm text-muted-foreground">Form Templates</div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Storage Type</div>
              <div className="text-sm text-muted-foreground">
                {storageType === "file" ? "Local File" : "Browser Storage"}
              </div>
            </div>
            <Badge variant={storageType === "file" ? "default" : "secondary"}>
              {storageType === "file" ? (
                <>
                  <FolderOpen className="h-3 w-3 mr-1" />
                  File
                </>
              ) : (
                <>
                  <Cloud className="h-3 w-3 mr-1" />
                  Browser
                </>
              )}
            </Badge>
          </div>

          {lastSaved && (
            <div className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* "Me" Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            My Profile
          </CardTitle>
          <CardDescription>
            Set yourself as the primary user for relationship context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {me ? (
            <div className="flex items-center gap-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <Avatar className="h-12 w-12">
                {me.photo && <AvatarImage src={me.photo} alt={me.firstName} />}
                <AvatarFallback className="bg-amber-500 text-white">
                  {getInitials(me.firstName, me.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {me.firstName} {me.lastName}
                  </p>
                  <Badge className="bg-amber-500 hover:bg-amber-600">
                    <Crown className="h-3 w-3 mr-1" />
                    Me
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Relationships will show from your perspective
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  clearMe();
                  toast.success("Primary user cleared");
                }}
                aria-label="Clear 'Me' selection"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No one is set as &quot;Me&quot; yet. Setting yourself allows the app to show relationships from your perspective.
              </p>
              {people.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select yourself</Label>
                  <Select onValueChange={(id) => {
                    setAsMe(id);
                    const person = people.find(p => p.id === id);
                    if (person) {
                      toast.success(`${person.firstName} is now set as "Me"!`);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a person..." />
                    </SelectTrigger>
                    <SelectContent>
                      {people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          <div className="flex items-center gap-2">
                            <span>{person.firstName} {person.lastName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Add some people first, then you can set yourself here.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Sync */}
      <GoogleDriveSync />

      {/* Import Shared Response */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Import Shared Response
          </CardTitle>
          <CardDescription>
            Paste a response you received from a shared form to add them as a person
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="response-paste">Paste Response (Text or JSON)</Label>
            <Textarea
              id="response-paste"
              value={pastedResponse}
              onChange={(e) => setPastedResponse(e.target.value)}
              placeholder={`Paste the response here...

Examples:
• Text from a message (First Name: John, Last Name: Doe, etc.)
• JSON from the Download or Copy JSON option`}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleImportResponse} className="flex-1">
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Import from Paste
            </Button>

            <div>
              <input
                ref={responseFileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportResponseFile}
                className="hidden"
                id="import-response-file"
              />
              <Button
                variant="outline"
                onClick={() => responseFileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Import File
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Supports both text format (from Copy Text / Native Share) and JSON format (from Download / Copy JSON)
          </p>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Display Settings
          </CardTitle>
          <CardDescription>
            Customize how data is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ theme: "light" })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  settings.theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-5 w-5" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: "dark" })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  settings.theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-5 w-5" />
                <span className="text-sm font-medium">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ theme: "system" })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  settings.theme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select
                value={settings.defaultView}
                onValueChange={(value: AppSettings["defaultView"]) =>
                  updateSettings({ defaultView: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="graph">Graph</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Sort</Label>
              <Select
                value={settings.sortBy}
                onValueChange={(value: AppSettings["sortBy"]) =>
                  updateSettings({ sortBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="createdAt">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Customization
          </CardTitle>
          <CardDescription>
            Customize colors for family groups and relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Family Colors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Family Group Colors</Label>
              <Button variant="ghost" size="sm" onClick={handleResetColors}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Colors are assigned to families in order. Family #{1} gets color 1, etc.
            </p>

            <div className="grid gap-3">
              {familyColors.slice(0, 8).map((color, index) => {
                const family = familyGroups[index];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${color.bg} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {family ? family.name : `Family Color #${index + 1}`}
                        </p>
                        {family && (
                          <p className="text-xs text-muted-foreground">
                            {family.memberIds.size} members
                          </p>
                        )}
                      </div>
                    </div>
                    <Select
                      value={color.bg}
                      onValueChange={(value) => {
                        const newColor = COLOR_OPTIONS.find((c) => c.bg === value);
                        if (newColor) {
                          handleChangeFamilyColor(index, {
                            bg: newColor.bg,
                            hex: newColor.hex,
                            light: newColor.light,
                            border: newColor.border,
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((option) => (
                          <SelectItem key={option.bg} value={option.bg}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                              <span>{option.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Relationship Colors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Relationship Colors</Label>
              <Button variant="ghost" size="sm" onClick={handleResetRelationshipColors}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize colors for different relationship types displayed in the graph and throughout the app.
            </p>

            {groupedRelationships.map((group) => (
              <div key={group.group} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{group.label}</p>
                <div className="grid gap-2">
                  {group.types.map((type) => {
                    const config = RELATIONSHIP_CONFIG[type];
                    const currentColor = getRelationshipColor(type, relationshipColors);
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30"
                      >
                        <div className={`w-6 h-6 rounded-full ${currentColor} flex-shrink-0`} />
                        <span className="flex-1 text-sm font-medium">{config.label}</span>
                        <Select
                          value={currentColor}
                          onValueChange={(value) => handleChangeRelationshipColor(type, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_COLOR_OPTIONS.map((option) => (
                              <SelectItem key={option.bg} value={option.bg}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full ${option.bg}`} />
                                  <span>{option.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or reset your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={handleExport} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </div>
          </div>

          {supportsFileSystemAccess() && (
            <Button
              variant="outline"
              onClick={handleChangeFile}
              className="w-full"
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Open Different File
            </Button>
          )}

          <Separator />

          <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">Danger Zone</h4>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your data including people,
                  relationships, and form templates.
                </p>
                <Button variant="destructive" size="sm" onClick={handleResetClick}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your people, relationships, and form
              templates. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
