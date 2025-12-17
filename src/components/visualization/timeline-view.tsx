"use client";

import { useMemo, useRef, useEffect } from "react";
import { useDataStore } from "@/stores/data-store";
import { useGenerationLayout } from "./hooks/use-generation-layout";
import { useFocusState, getDegreeStyles } from "./hooks/use-focus-state";
import { PersonNode } from "./person-node";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ArrowLeft, Home, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Generation label mapping
function getGenerationLabel(gen: number): string {
  if (gen === 0) return "Your Generation";
  if (gen === -1) return "Parents";
  if (gen === -2) return "Grandparents";
  if (gen === -3) return "Great-Grandparents";
  if (gen === 1) return "Children";
  if (gen === 2) return "Grandchildren";
  if (gen === 3) return "Great-Grandchildren";
  return gen < 0 ? `Ancestors (${Math.abs(gen)} gen up)` : `Descendants (${gen} gen down)`;
}

// Estimate birth decade from birthday or generation
function estimateBirthDecade(birthday?: string, generation?: number): string | null {
  if (birthday) {
    const year = parseInt(birthday.substring(0, 4));
    if (!isNaN(year)) {
      const decade = Math.floor(year / 10) * 10;
      return `${decade}s`;
    }
  }
  // Rough estimate based on generation (assuming ~25 years per generation from 1990)
  if (generation !== undefined) {
    const baseYear = 1990;
    const year = baseYear - generation * 25;
    const decade = Math.floor(year / 10) * 10;
    return `~${decade}s`;
  }
  return null;
}

export function TimelineView() {
  const { people, relationships } = useDataStore();
  const { focusPersonId, setFocus, goBack, canGoBack, clearFocus } = useFocusState();
  const layout = useGenerationLayout(focusPersonId);

  const focusRowRef = useRef<HTMLDivElement>(null);

  // Organize people by generation with estimated decades
  const generationData = useMemo(() => {
    if (!layout) return [];

    return Array.from(layout.byGeneration.entries())
      .sort(([a], [b]) => a - b)
      .map(([gen, genPeople]) => {
        // Get birth decades for this generation
        const decades = new Set<string>();
        genPeople.forEach((p) => {
          const decade = estimateBirthDecade(p.birthday, gen);
          if (decade) decades.add(decade);
        });

        const decadeStr =
          decades.size > 0
            ? Array.from(decades).sort().join(" - ")
            : "";

        return {
          generation: gen,
          label: getGenerationLabel(gen),
          decade: decadeStr,
          people: genPeople,
          isFocusGeneration: gen === 0,
        };
      });
  }, [layout]);

  // Scroll to focus generation on mount
  useEffect(() => {
    if (focusRowRef.current) {
      focusRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusPersonId]);

  if (!layout || people.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        No people to display
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearFocus}
          >
            <Home className="h-4 w-4 mr-2" />
            Center on Me
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {people.length} people across {generationData.length} generations
        </div>
      </div>

      {/* Timeline */}
      <div className="border rounded-lg overflow-hidden">
        {generationData.map((genData) => {
          const isFocusGen = genData.isFocusGeneration;

          return (
            <div
              key={genData.generation}
              ref={isFocusGen ? focusRowRef : undefined}
              className={cn(
                "border-b last:border-b-0",
                isFocusGen && "bg-primary/5"
              )}
            >
              {/* Generation Header */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 bg-muted/50 border-b sticky left-0",
                  isFocusGen && "bg-primary/10"
                )}
              >
                {isFocusGen && (
                  <Star className="h-4 w-4 text-primary fill-primary" />
                )}
                <div>
                  <h3 className={cn(
                    "font-semibold",
                    isFocusGen && "text-primary"
                  )}>
                    {genData.label}
                  </h3>
                  {genData.decade && (
                    <p className="text-xs text-muted-foreground">
                      Born {genData.decade}
                    </p>
                  )}
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                  {genData.people.length} {genData.people.length === 1 ? "person" : "people"}
                </div>
              </div>

              {/* People Row - Horizontal Scroll */}
              <ScrollArea className="w-full">
                <div className="flex gap-4 p-4 min-w-max">
                  {genData.people.map((person) => {
                    const degree = layout.degrees.get(person.id) ?? Infinity;
                    const isFocused = person.id === focusPersonId;

                    return (
                      <PersonNode
                        key={person.id}
                        person={person}
                        degree={degree}
                        isFocused={isFocused}
                        onClick={setFocus}
                        showBirthday={true}
                      />
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/50" />
          <span>Focused Person</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
          <span>Related</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-3 w-3 text-primary fill-primary" />
          <span>Your Generation</span>
        </div>
      </div>
    </div>
  );
}
