"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { PersonCard } from "./person-card";
import { QuickAddPerson } from "./quick-add-person";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";

export function PeopleView() {
  const { people } = useDataStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const filteredPeople = people.filter((person) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      person.firstName.toLowerCase().includes(query) ||
      person.lastName.toLowerCase().includes(query) ||
      person.nickname?.toLowerCase().includes(query) ||
      person.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-16 w-16 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold">No people yet</h2>
        <p className="mt-2 text-muted-foreground">
          Add your first family member or friend to get started.
        </p>
        <Button className="mt-6" onClick={() => setShowQuickAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
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
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">
            {people.length} {people.length === 1 ? "person" : "people"} in your
            network
          </p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filteredPeople.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No people found matching &quot;{searchQuery}&quot;
        </div>
      )}

      <QuickAddPerson open={showQuickAdd} onOpenChange={setShowQuickAdd} />
    </div>
  );
}
