"use client";

import { useState, useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { PersonCard } from "./person-card";
import { QuickAddPerson } from "./quick-add-person";
import { QuickReview } from "./quick-review";
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
import { useFamilyGroups, FAMILY_COLORS } from "@/features/use-family-groups";
import { Plus, Search, Users, Filter, SortAsc, X, Network, LayoutGrid, Sparkles } from "lucide-react";

type SortOption = "firstName" | "lastName" | "birthday" | "createdAt";
type ViewMode = "cards" | "quick";

export function PeopleView() {
  const { people, settings } = useDataStore();
  const { familyGroups, getFamilyGroup } = useFamilyGroups();
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(settings.sortBy);

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
    const result = people.filter((person) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          person.firstName.toLowerCase().includes(query) ||
          person.lastName.toLowerCase().includes(query) ||
          person.nickname?.toLowerCase().includes(query) ||
          person.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matches) return false;
      }

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
    result.sort((a, b) => {
      switch (sortBy) {
        case "firstName":
          return a.firstName.localeCompare(b.firstName);
        case "lastName":
          return (a.lastName || "").localeCompare(b.lastName || "");
        case "birthday":
          if (!a.birthday && !b.birthday) return 0;
          if (!a.birthday) return 1;
          if (!b.birthday) return -1;
          return a.birthday.localeCompare(b.birthday);
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [people, searchQuery, selectedTags, selectedFamilyId, sortBy, getFamilyGroup]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
          <p className="text-muted-foreground mt-1">
            {people.length} {people.length === 1 ? "person" : "people"} in your network
          </p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
        <TabsList>
          <TabsTrigger value="cards" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Quick Review
          </TabsTrigger>
        </TabsList>

        {/* Cards View */}
        <TabsContent value="cards" className="space-y-6 mt-6">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {/* Family Filter */}
              {familyGroups.length > 0 && (
                <div className="flex items-center gap-1">
                  <Select
                    value={selectedFamilyId || "all"}
                    onValueChange={(v) => setSelectedFamilyId(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <Network className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="All Families" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Families</SelectItem>
                      {familyGroups.map((group) => {
                        const color = FAMILY_COLORS[group.colorIndex % FAMILY_COLORS.length];
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.bg}`} />
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
                    <Button variant="outline" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Tags
                      {selectedTags.length > 0 && (
                        <Badge variant="secondary" className="ml-1 px-1.5">
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
                  <Button variant="outline" className="gap-2">
                    <SortAsc className="h-4 w-4" />
                    Sort
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
                    checked={sortBy === "birthday"}
                    onCheckedChange={() => setSortBy("birthday")}
                  >
                    Birthday
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {selectedFamily && (
                <Badge
                  variant="outline"
                  className={`cursor-pointer ${FAMILY_COLORS[selectedFamily.colorIndex % FAMILY_COLORS.length].light} ${FAMILY_COLORS[selectedFamily.colorIndex % FAMILY_COLORS.length].border}`}
                  onClick={() => setSelectedFamilyId(null)}
                >
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${FAMILY_COLORS[selectedFamily.colorIndex % FAMILY_COLORS.length].bg}`} />
                  {selectedFamily.name} ×
                </Badge>
              )}
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80"
                  onClick={() => toggleTag(tag)}
                >
                  {tag} ×
                </Badge>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPeople.map((person) => (
                <PersonCard key={person.id} person={person} />
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
    </div>
  );
}
