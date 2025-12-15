"use client";

import { useState, useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import { PersonCard } from "./person-card";
import { QuickAddPerson } from "./quick-add-person";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Users, Filter, SortAsc } from "lucide-react";

type SortOption = "firstName" | "lastName" | "birthday" | "createdAt";

export function PeopleView() {
  const { people, settings } = useDataStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>(settings.sortBy);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    people.forEach((person) => person.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [people]);

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
  }, [people, searchQuery, selectedTags, sortBy]);

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
          {/* Tag Filter */}
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
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
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
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
            onClick={() => setSelectedTags([])}
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

      <QuickAddPerson open={showQuickAdd} onOpenChange={setShowQuickAdd} />
    </div>
  );
}
