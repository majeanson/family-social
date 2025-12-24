"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sun,
  Moon,
  Monitor,
  Palette,
  RotateCcw,
  Crown,
  X,
  Pencil,
  Check,
  Users,
  Bell,
  Cake,
  CalendarDays,
  Search,
  RefreshCw,
  Sparkles,
  Link2,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AppSettings, FamilyColorConfig, RelationshipType, ReminderTiming, ThemePreset, CustomTheme, ThemeColors } from "@/types";
import { DEFAULT_FAMILY_COLORS, RELATIONSHIP_CONFIG, getGroupedRelationshipTypes, REMINDER_TIMING_CONFIG, DEFAULT_NOTIFICATION_SETTINGS, THEME_PRESETS } from "@/types";
import { Switch } from "@/components/ui/switch";
import { GoogleDriveSync } from "@/components/sync/google-drive-sync";
import { useFamilyGroups, usePrimaryUser } from "@/features";
import { COLOR_OPTIONS, RELATIONSHIP_COLOR_OPTIONS, getRelationshipColor, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Settings sections for search
const SETTINGS_SECTIONS = [
  { id: "sync", tab: "sync", keywords: ["sync", "google", "drive", "cloud", "backup", "upload", "download", "link", "share"] },
  { id: "data", tab: "sync", keywords: ["data", "summary", "storage", "people", "relationships"] },
  { id: "import-export", tab: "sync", keywords: ["import", "export", "backup", "file", "json", "link", "paste"] },
  { id: "profile", tab: "profile", keywords: ["me", "profile", "primary", "user", "myself"] },
  { id: "theme", tab: "appearance", keywords: ["theme", "dark", "light", "mode", "color", "appearance"] },
  { id: "display", tab: "appearance", keywords: ["display", "view", "sort", "cards", "graph"] },
  { id: "colors", tab: "appearance", keywords: ["color", "family", "relationship", "customize"] },
  { id: "notifications", tab: "notifications", keywords: ["notification", "reminder", "birthday", "event", "alert"] },
  { id: "danger", tab: "danger", keywords: ["reset", "delete", "danger", "clear", "remove"] },
];

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    exportData,
    loadData,
    resetData,
    people,
    relationships,
    formTemplates,
    lastSaved,
  } = useDataStore();
  const { familyGroups, renameFamilyGroup } = useFamilyGroups();
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null);
  const [editingFamilyName, setEditingFamilyName] = useState("");
  const { me, setAsMe, clearMe } = usePrimaryUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("sync");
  const [importLink, setImportLink] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const router = useRouter();

  // Handle manual link import
  const handleImportLink = () => {
    if (!importLink.trim()) {
      toast.error("Please enter a share link");
      return;
    }

    setImportLoading(true);

    try {
      // Extract the path from the URL
      const url = new URL(importLink.trim());
      const pathname = url.pathname + url.search;

      // Check if it's a valid share or import link
      if (pathname.startsWith("/share/") || pathname.startsWith("/import")) {
        router.push(pathname);
      } else {
        toast.error("Invalid share link. Please use a valid Famolo share link.");
        setImportLoading(false);
      }
    } catch {
      // If it's not a valid URL, try to use it as a path
      const trimmed = importLink.trim();
      if (trimmed.startsWith("/share/") || trimmed.startsWith("/import")) {
        router.push(trimmed);
      } else {
        toast.error("Invalid link format. Please paste the full share link.");
        setImportLoading(false);
      }
    }
  };

  // Auto-switch tab on search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const match = SETTINGS_SECTIONS.find(section =>
        section.keywords.some(kw => kw.includes(query.toLowerCase()) || query.toLowerCase().includes(kw))
      );
      if (match) {
        setActiveTab(match.tab);
      }
    }
  };

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

  const storageType = getStorage().getStorageType();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header with Search */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and data
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sync" className="gap-1.5">
            <Cloud className="h-4 w-4" />
            <span className="hidden sm:inline">Sync</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
        </TabsList>

        {/* SYNC & DATA TAB */}
        <TabsContent value="sync" className="space-y-6 mt-6">
          {/* Google Drive Sync - Highlighted */}
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    Cloud Sync
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      Featured
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Keep your data synced across all your devices
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GoogleDriveSync />
            </CardContent>
          </Card>

          {/* Manual Link Import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Import from Share Link
              </CardTitle>
              <CardDescription>
                Paste a share link to import data when deep linking doesn&apos;t work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste share link here..."
                  value={importLink}
                  onChange={(e) => setImportLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleImportLink();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleImportLink}
                  disabled={importLoading || !importLink.trim()}
                >
                  {importLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Import"
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this when you receive a share link from someone but it doesn&apos;t open automatically in the app.
              </p>
            </CardContent>
          </Card>

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
                  <div className="text-sm font-medium">Local Storage</div>
                  <div className="text-sm text-muted-foreground">
                    {storageType === "file" ? "Saving to local file" : "Using browser storage"}
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
                      <HardDrive className="h-3 w-3 mr-1" />
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

          {/* Import/Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Backup & Restore
              </CardTitle>
              <CardDescription>
                Export your data as a backup file or restore from a previous backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Export Backup</p>
                      <p className="text-xs text-muted-foreground">Download as JSON file</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleExport} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Restore Backup</p>
                      <p className="text-xs text-muted-foreground">Import from JSON file</p>
                    </div>
                  </div>
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
                    Restore from File
                  </Button>
                </div>
              </div>

              {supportsFileSystemAccess() && (
                <>
                  <Separator />
                  <Button
                    variant="outline"
                    onClick={handleChangeFile}
                    className="w-full"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Open Different Data File
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* APPEARANCE TAB */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
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

          {/* Theme Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Customization
              </CardTitle>
              <CardDescription>
                Choose a color theme or create your own
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preset Selector */}
              <div className="space-y-3">
                <Label>Color Theme</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => {
                    const colors = THEME_PRESETS[preset];
                    const isSelected = (settings.themePreset || "default") === preset;
                    const presetLabel = preset.charAt(0).toUpperCase() + preset.slice(1);

                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateSettings({ themePreset: preset })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {/* Color preview */}
                        <div className="flex gap-1">
                          {colors.light.primary && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: colors.light.primary }}
                            />
                          )}
                          {colors.light.accent && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: colors.light.accent }}
                            />
                          )}
                          {colors.light.card && (
                            <div
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: colors.light.card }}
                            />
                          )}
                          {!colors.light.primary && !colors.light.accent && (
                            <div className="w-4 h-4 rounded-full bg-muted border" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{presetLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Theme Editor */}
              {settings.themePreset === "custom" && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Custom Colors</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateSettings({
                            customTheme: { light: {}, dark: {} },
                          });
                          toast.success("Custom colors reset");
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Customize colors for light and dark modes. Leave empty to use defaults.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                      {/* Light Mode Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          <Label className="font-medium">Light Mode</Label>
                        </div>
                        <div className="space-y-3">
                          {(["primary", "secondary", "accent", "card", "background", "muted"] as (keyof ThemeColors)[]).map((colorKey) => {
                            const labels: Record<keyof ThemeColors, string> = {
                              primary: "Primary (Buttons)",
                              secondary: "Secondary (Subtle)",
                              accent: "Accent (Highlights)",
                              card: "Card Background",
                              background: "Page Background",
                              muted: "Muted Background",
                            };
                            const currentValue = settings.customTheme?.light?.[colorKey] || "";

                            return (
                              <div key={colorKey} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {labels[colorKey]}
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={currentValue || "#808080"}
                                    onChange={(e) => {
                                      const newCustomTheme: CustomTheme = {
                                        light: {
                                          ...(settings.customTheme?.light || {}),
                                          [colorKey]: e.target.value,
                                        },
                                        dark: settings.customTheme?.dark || {},
                                      };
                                      updateSettings({ customTheme: newCustomTheme });
                                    }}
                                    className="w-12 h-8 p-0.5 cursor-pointer"
                                  />
                                  <Input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => {
                                      const newCustomTheme: CustomTheme = {
                                        light: {
                                          ...(settings.customTheme?.light || {}),
                                          [colorKey]: e.target.value,
                                        },
                                        dark: settings.customTheme?.dark || {},
                                      };
                                      updateSettings({ customTheme: newCustomTheme });
                                    }}
                                    placeholder="#hex"
                                    className="font-mono text-xs h-8"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dark Mode Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          <Label className="font-medium">Dark Mode</Label>
                        </div>
                        <div className="space-y-3">
                          {(["primary", "secondary", "accent", "card", "background", "muted"] as (keyof ThemeColors)[]).map((colorKey) => {
                            const labels: Record<keyof ThemeColors, string> = {
                              primary: "Primary (Buttons)",
                              secondary: "Secondary (Subtle)",
                              accent: "Accent (Highlights)",
                              card: "Card Background",
                              background: "Page Background",
                              muted: "Muted Background",
                            };
                            const currentValue = settings.customTheme?.dark?.[colorKey] || "";

                            return (
                              <div key={colorKey} className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  {labels[colorKey]}
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="color"
                                    value={currentValue || "#808080"}
                                    onChange={(e) => {
                                      const newCustomTheme: CustomTheme = {
                                        light: settings.customTheme?.light || {},
                                        dark: {
                                          ...(settings.customTheme?.dark || {}),
                                          [colorKey]: e.target.value,
                                        },
                                      };
                                      updateSettings({ customTheme: newCustomTheme });
                                    }}
                                    className="w-12 h-8 p-0.5 cursor-pointer"
                                  />
                                  <Input
                                    type="text"
                                    value={currentValue}
                                    onChange={(e) => {
                                      const newCustomTheme: CustomTheme = {
                                        light: settings.customTheme?.light || {},
                                        dark: {
                                          ...(settings.customTheme?.dark || {}),
                                          [colorKey]: e.target.value,
                                        },
                                      };
                                      updateSettings({ customTheme: newCustomTheme });
                                    }}
                                    placeholder="#hex"
                                    className="font-mono text-xs h-8"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Family & Relationship Colors
              </CardTitle>
              <CardDescription>
                Customize colors for family groups and relationships
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Family Groups */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Family Groups</Label>
                  <Button variant="ghost" size="sm" onClick={handleResetColors}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Colors
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customize family names and colors. Click the pencil to rename a family.
                </p>

                {familyGroups.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No family groups yet</p>
                    <p className="text-xs mt-1">Add people with family relationships to create groups</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {familyGroups.map((family, index) => {
                      const color = familyColors[index % familyColors.length];
                      const isEditing = editingFamilyId === family.id;

                      return (
                        <div
                          key={family.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                        >
                          <div className={`w-8 h-8 rounded-full ${color.bg} flex-shrink-0`} />

                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editingFamilyName}
                                onChange={(e) => setEditingFamilyName(e.target.value)}
                                className="h-8"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    renameFamilyGroup(family.id, editingFamilyName);
                                    setEditingFamilyId(null);
                                    toast.success("Family name updated!");
                                  } else if (e.key === "Escape") {
                                    setEditingFamilyId(null);
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  renameFamilyGroup(family.id, editingFamilyName);
                                  setEditingFamilyId(null);
                                  toast.success("Family name updated!");
                                }}
                                aria-label="Save family name"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setEditingFamilyId(null)}
                                aria-label="Cancel editing"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{family.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {family.memberIds.size} members
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingFamilyId(family.id);
                                  setEditingFamilyName(family.name);
                                }}
                                aria-label="Edit family name"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          )}

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
                            <SelectTrigger className="w-[120px]">
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
                )}
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
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications & Reminders
              </CardTitle>
              <CardDescription>
                Configure reminders for birthdays and events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Show reminder alerts when you open the app
                  </p>
                </div>
                <Switch
                  checked={settings.notifications?.enabled ?? true}
                  onCheckedChange={(checked) => {
                    updateSettings({
                      notifications: {
                        ...(settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS),
                        enabled: checked,
                      },
                    });
                  }}
                />
              </div>

              <Separator />

              {/* Birthday Reminders */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-500" />
                  <Label className="text-base">Birthday Reminders</Label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Remind me about birthdays</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming birthdays
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications?.birthdayReminders ?? true}
                    disabled={!(settings.notifications?.enabled ?? true)}
                    onCheckedChange={(checked) => {
                      updateSettings({
                        notifications: {
                          ...(settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS),
                          birthdayReminders: checked,
                        },
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Birthday Reminder</Label>
                  <Select
                    value={settings.notifications?.birthdayTiming ?? "1_week"}
                    disabled={!(settings.notifications?.enabled ?? true) || !(settings.notifications?.birthdayReminders ?? true)}
                    onValueChange={(value: ReminderTiming) => {
                      updateSettings({
                        notifications: {
                          ...(settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS),
                          birthdayTiming: value,
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMINDER_TIMING_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Event Reminders */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-purple-500" />
                  <Label className="text-base">Event Reminders</Label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Remind me about events</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming family events
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications?.eventReminders ?? true}
                    disabled={!(settings.notifications?.enabled ?? true)}
                    onCheckedChange={(checked) => {
                      updateSettings({
                        notifications: {
                          ...(settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS),
                          eventReminders: checked,
                        },
                      });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Event Reminder</Label>
                  <Select
                    value={settings.notifications?.defaultEventTiming ?? "1_day"}
                    disabled={!(settings.notifications?.enabled ?? true) || !(settings.notifications?.eventReminders ?? true)}
                    onValueChange={(value: ReminderTiming) => {
                      updateSettings({
                        notifications: {
                          ...(settings.notifications ?? DEFAULT_NOTIFICATION_SETTINGS),
                          defaultEventTiming: value,
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMINDER_TIMING_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    This is used when creating new events. You can customize per-event reminders when adding events.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DANGER TAB */}
        <TabsContent value="danger" className="space-y-6 mt-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect all your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
                <div className="flex items-start gap-3">
                  <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive">Reset All Data</h4>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete all your data including people,
                      relationships, and form templates. This action cannot be undone.
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
        </TabsContent>
      </Tabs>

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
