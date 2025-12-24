"use client";

import { useState, useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { PersonCard } from "./person-card";
import { QuickAddPerson } from "./quick-add-person";
import { QuickReview } from "./quick-review";
import { ShareFamilyDialog } from "./share-family-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamilyGroups } from "@/features/use-family-groups";
import { searchPerson } from "@/lib/utils";
import { getBirthdaySortValue } from "@/lib/date-utils";
import { Plus, Search, Users, Filter, SortAsc, X, Network, LayoutGrid, Sparkles, Share2, CheckSquare, Square } from "lucide-react";

type SortOption = "firstName" | "lastName" | "birthday" | "upcomingBirthday" | "createdAt";
type ViewMode = "cards" | "quick";

export function PeopleView() {
  const { people, settings } = useDataStore();
  const { familyGroups, getFamilyGroup, colors } = useFamilyGroups();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(settings.sortBy);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    people.forEach((person) => person.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [people]);

  // Get selected family
  const selectedFamily = familyGroups.find((g) => g.id === selectedFamilyId);

  // Filter and sort people
  const filteredPeople = useMemo(() => {
    // First filter with search scores
    const scored = people
      .map((person) => {
        // Search filter using fuzzy matching
        const searchScore = searchQuery ? searchPerson(person, searchQuery) : 1;
        return { person, searchScore };
      })
      .filter(({ person, searchScore }) => {
        // Exclude non-matches
        if (searchScore < 0) return false;

        // Tag filter
        if (selectedTags.length > 0) {
          const hasTag = selectedTags.some((tag) => person.tags.includes(tag));
          if (!hasTag) return false;
        }

        // Family filter
        if (selectedFamilyId) {
          const family = getFamilyGroup(person.id);
          if (!family || family.id !== selectedFamilyId) return false;
        }

        return true;
      });

    // Sort
    scored.sort((a, b) => {
      // If searching, prioritize by search score first
      if (searchQuery && a.searchScore !== b.searchScore) {
        return b.searchScore - a.searchScore;
      }

      switch (sortBy) {
        case "firstName":
          return a.person.firstName.localeCompare(b.person.firstName);
        case "lastName":
          return (a.person.lastName || "").localeCompare(b.person.lastName || "");
        case "birthday":
          // Sort by year (oldest to youngest)
          if (!a.person.birthday && !b.person.birthday) return 0;
          if (!a.person.birthday) return 1;
          if (!b.person.birthday) return -1;
          return a.person.birthday.localeCompare(b.person.birthday);
        case "upcomingBirthday":
          // Sort by upcoming birthday (ignores year)
          return getBirthdaySortValue(a.person.birthday) - getBirthdaySortValue(b.person.birthday);
        case "createdAt":
          return new Date(b.person.createdAt).getTime() - new Date(a.person.createdAt).getTime();
        default:
          return 0;
      }
    });

    return scored.map(({ person }) => person);
  }, [people, searchQuery, selectedTags, selectedFamilyId, sortBy, getFamilyGroup]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const togglePersonSelection = (personId: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const selectAll = () => {
    setSelectedPeopleIds(filteredPeople.map((p) => p.id));
  };

  const deselectAll = () => {
    setSelectedPeopleIds([]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedPeopleIds([]);
  };

  const selectFamilyGroup = (familyId: string) => {
    const group = familyGroups.find((g) => g.id === familyId);
    if (group) {
      setSelectedPeopleIds(Array.from(group.memberIds));
    }
  };


  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Users className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No people yet</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          Start building your family tree by adding your first family member or friend.
        </p>
        <Button size="lg" onClick={() => setShowQuickAdd(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Add Your First Person
        </Button>

        <QuickAddPerson open={showQuickAdd} onOpenChange={setShowQuickAdd} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {people.length} {people.length === 1 ? "person" : "people"} in your network
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!selectMode ? (
            <>
              <Button variant="outline" onClick={() => setSelectMode(true)} size="sm" className="flex-1 sm:flex-none">
                <CheckSquare className="mr-2 h-4 w-4" aria-hidden="true" />
                Select
              </Button>
              <Button onClick={() => setShowQuickAdd(true)} size="sm" className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Person
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={exitSelectMode} size="sm" className="flex-1 sm:flex-none">
                <X className="mr-2 h-4 w-4" aria-hidden="true" />
                Cancel
              </Button>
              <Button onClick={() => setShowShareDialog(true)} disabled={selectedPeopleIds.length === 0} size="sm" className="flex-1 sm:flex-none">
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Share {selectedPeopleIds.length > 0 && `(${selectedPeopleIds.length})`}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Select Mode Bar */}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <span className="text-sm font-medium">{selectedPeopleIds.length} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All ({filteredPeople.length})
            </Button>
            {selectedPeopleIds.length > 0 && (
              <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
            )}
          </div>
          {familyGroups.length > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Network className="h-4 w-4 mr-1" />
                    Select Family
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Select all in family</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {familyGroups.map((group) => {
                    const color = colors[group.colorIndex % colors.length];
                    return (
                      <DropdownMenuCheckboxItem
                        key={group.id}
                        checked={Array.from(group.memberIds).every((id) => selectedPeopleIds.includes(id))}
                        onCheckedChange={() => selectFamilyGroup(group.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.bg}`} />
                          <span>{group.name}</span>
                          <span className="text-xs text-muted-foreground">({group.memberIds.size})</span>
                        </div>
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      )}

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList aria-label="View mode">
          <TabsTrigger value="cards" className="gap-1.5">
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-1.5">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Review
          </TabsTrigger>
        </TabsList>

        {/* Cards View */}
        <TabsContent value="cards" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <label htmlFor="search-people" className="sr-only">Search by name or tag</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                id="search-people"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Family Filter */}
              {familyGroups.length > 0 && (
                <div className="flex items-center gap-1">
                  <Select
                    value={selectedFamilyId || "all"}
                    onValueChange={(v) => setSelectedFamilyId(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-[140px] sm:w-[160px]" aria-label="Filter by family">
                      <Network className="h-4 w-4 mr-2 text-muted-foreground shrink-0" aria-hidden="true" />
                      <SelectValue placeholder="Family" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Families</SelectItem>
                      {familyGroups.map((group) => {
                        const color = colors[group.colorIndex % colors.length];
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.bg}`} aria-hidden="true" />
                              <span>{group.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedFamilyId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFamilyId(null)}
                      className="h-8 w-8"
                      aria-label="Clear family filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Filter className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Tags</span>
                      {selectedTags.length > 0 && (
                        <Badge variant="secondary" className="px-1.5 h-5 min-w-5">
                          {selectedTags.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter by Tag</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allTags.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag}
                        checked={selectedTags.includes(tag)}
                        onCheckedChange={() => toggleTag(tag)}
                      >
                        {tag}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <SortAsc className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "firstName"}
                    onCheckedChange={() => setSortBy("firstName")}
                  >
                    First Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "lastName"}
                    onCheckedChange={() => setSortBy("lastName")}
                  >
                    Last Name
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "upcomingBirthday"}
                    onCheckedChange={() => setSortBy("upcomingBirthday")}
                  >
                    Upcoming Birthday
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "birthday"}
                    onCheckedChange={() => setSortBy("birthday")}
                  >
                    Age (Oldest First)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={sortBy === "createdAt"}
                    onCheckedChange={() => setSortBy("createdAt")}
                  >
                    Recently Added
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedTags.length > 0 || selectedFamily) && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {selectedFamily && (
                <button
                  type="button"
                  onClick={() => setSelectedFamilyId(null)}
                  aria-label={`Remove ${selectedFamily.name} filter`}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:opacity-80 ${colors[selectedFamily.colorIndex % colors.length].light} ${colors[selectedFamily.colorIndex % colors.length].border}`}
                >
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${colors[selectedFamily.colorIndex % colors.length].bg}`} aria-hidden="true" />
                  {selectedFamily.name} <X className="h-3 w-3 ml-1" aria-hidden="true" />
                </button>
              )}
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-label={`Remove ${tag} filter`}
                  className="inline-flex items-center rounded-full border border-transparent bg-secondary text-secondary-foreground px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-secondary/80"
                >
                  {tag} <X className="h-3 w-3 ml-1" aria-hidden="true" />
                </button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedFamilyId(null);
                }}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Grid */}
          {filteredPeople.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {filteredPeople.map((person) => (
                <div key={person.id} className="relative h-full">
                  {selectMode && (
                    <button
                      type="button"
                      onClick={() => togglePersonSelection(person.id)}
                      className={`absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        selectedPeopleIds.includes(person.id)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-muted-foreground/30 hover:border-primary"
                      }`}
                      aria-label={`${selectedPeopleIds.includes(person.id) ? "Deselect" : "Select"} ${person.firstName}`}
                    >
                      {selectedPeopleIds.includes(person.id) ? (
                        <CheckSquare className="h-3.5 w-3.5" />
                      ) : (
                        <Square className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <div
                    className={selectMode ? "cursor-pointer" : ""}
                    onClick={selectMode ? () => togglePersonSelection(person.id) : undefined}
                  >
                    <PersonCard
                      person={person}
                      className={selectMode && selectedPeopleIds.includes(person.id) ? "ring-2 ring-primary" : ""}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                No people found matching your search.
              </p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTags([]);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Quick Review View */}
        <TabsContent value="quick" className="mt-6">
          <QuickReview />
        </TabsContent>
      </Tabs>

      <QuickAddPerson open={showQuickAdd} onOpenChange={setShowQuickAdd} />

      <ShareFamilyDialog
        open={showShareDialog}
        onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) {
            exitSelectMode();
          }
        }}
        selectedPeopleIds={selectedPeopleIds}
      />
    </div>
  );
}
