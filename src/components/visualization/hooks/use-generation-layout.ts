import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import type { Person, Relationship } from "@/types";

export interface GenerationLayout {
  /** Map of person ID to their generation number (0 = focus person) */
  generations: Map<string, number>;
  /** Map of person ID to their degree of separation from focus */
  degrees: Map<string, number>;
  /** People organized by generation */
  byGeneration: Map<number, Person[]>;
  /** Min and max generation numbers */
  range: { min: number; max: number };
}

// Relationship types that indicate parent-child
const PARENT_TYPES = ["parent", "father", "mother"] as const;
const CHILD_TYPES = ["child", "son", "daughter"] as const;
const SPOUSE_TYPES = ["spouse", "partner", "husband", "wife"] as const;
const SIBLING_TYPES = ["sibling", "brother", "sister"] as const;

function isParentType(type: string): boolean {
  return PARENT_TYPES.some((t) => type.toLowerCase().includes(t));
}

function isChildType(type: string): boolean {
  return CHILD_TYPES.some((t) => type.toLowerCase().includes(t));
}

function isSpouseType(type: string): boolean {
  return SPOUSE_TYPES.some((t) => type.toLowerCase().includes(t));
}

function isSiblingType(type: string): boolean {
  return SIBLING_TYPES.some((t) => type.toLowerCase().includes(t));
}

/**
 * Assigns generations based on relationship semantics.
 * Focus person is generation 0, parents are -1, children are +1, etc.
 */
function assignGenerations(
  focusPersonId: string,
  people: Person[],
  relationships: Relationship[]
): GenerationLayout {
  const generations = new Map<string, number>();
  const degrees = new Map<string, number>();
  const peopleMap = new Map(people.map((p) => [p.id, p]));

  // Build adjacency list with relationship types
  type Edge = { personId: string; type: string; reverseType?: string };
  const adjacency = new Map<string, Edge[]>();

  for (const rel of relationships) {
    // Add edge A -> B
    if (!adjacency.has(rel.personAId)) adjacency.set(rel.personAId, []);
    adjacency.get(rel.personAId)!.push({
      personId: rel.personBId,
      type: rel.type,
      reverseType: rel.reverseType,
    });

    // Add edge B -> A (with reversed types)
    if (!adjacency.has(rel.personBId)) adjacency.set(rel.personBId, []);
    adjacency.get(rel.personBId)!.push({
      personId: rel.personAId,
      type: rel.reverseType || rel.type,
      reverseType: rel.type,
    });
  }

  // BFS with generation-aware propagation
  const queue: Array<{ id: string; gen: number; degree: number }> = [];
  const visited = new Set<string>();

  // Start with focus person at generation 0
  if (peopleMap.has(focusPersonId)) {
    queue.push({ id: focusPersonId, gen: 0, degree: 0 });
    generations.set(focusPersonId, 0);
    degrees.set(focusPersonId, 0);
    visited.add(focusPersonId);
  }

  while (queue.length > 0) {
    const { id, gen, degree } = queue.shift()!;
    const edges = adjacency.get(id) || [];

    for (const edge of edges) {
      if (visited.has(edge.personId)) continue;

      let newGen = gen;

      // Determine generation offset based on relationship type
      if (isParentType(edge.type)) {
        // This person is a parent of current -> they're one generation up
        newGen = gen - 1;
      } else if (isChildType(edge.type)) {
        // This person is a child of current -> they're one generation down
        newGen = gen + 1;
      } else if (isSpouseType(edge.type)) {
        // Spouses are same generation
        newGen = gen;
      } else if (isSiblingType(edge.type)) {
        // Siblings are same generation
        newGen = gen;
      } else {
        // For other relationships (friend, colleague, etc.)
        // Keep same generation but mark as extended
        newGen = gen;
      }

      visited.add(edge.personId);
      generations.set(edge.personId, newGen);
      degrees.set(edge.personId, degree + 1);
      queue.push({ id: edge.personId, gen: newGen, degree: degree + 1 });
    }
  }

  // Add unconnected people (no relationships) at generation 0
  for (const person of people) {
    if (!generations.has(person.id)) {
      generations.set(person.id, 0);
      degrees.set(person.id, Infinity); // Not connected
    }
  }

  // Organize by generation
  const byGeneration = new Map<number, Person[]>();
  let minGen = 0;
  let maxGen = 0;

  for (const [personId, gen] of generations) {
    const person = peopleMap.get(personId);
    if (!person) continue;

    if (!byGeneration.has(gen)) byGeneration.set(gen, []);
    byGeneration.get(gen)!.push(person);

    minGen = Math.min(minGen, gen);
    maxGen = Math.max(maxGen, gen);
  }

  // Sort each generation by last name, then first name
  for (const [, people] of byGeneration) {
    people.sort((a, b) => {
      const lastNameCmp = (a.lastName || "").localeCompare(b.lastName || "");
      if (lastNameCmp !== 0) return lastNameCmp;
      return a.firstName.localeCompare(b.firstName);
    });
  }

  return {
    generations,
    degrees,
    byGeneration,
    range: { min: minGen, max: maxGen },
  };
}

/**
 * Groups spouses together within a generation for side-by-side display.
 */
export interface FamilyUnit {
  /** Primary person (or first spouse) */
  primary: Person;
  /** Spouse/partner if any */
  spouse?: Person;
  /** Children of this unit */
  children: Person[];
}

export function groupFamilyUnits(
  generation: Person[],
  relationships: Relationship[],
  allPeople: Person[],
  nextGeneration?: Person[]
): FamilyUnit[] {
  const units: FamilyUnit[] = [];
  const assigned = new Set<string>();
  const peopleMap = new Map(allPeople.map((p) => [p.id, p]));

  // Find spouse relationships
  const spouseOf = new Map<string, string>();
  for (const rel of relationships) {
    if (isSpouseType(rel.type)) {
      spouseOf.set(rel.personAId, rel.personBId);
      spouseOf.set(rel.personBId, rel.personAId);
    }
  }

  // Find parent-child relationships
  const childrenOf = new Map<string, Set<string>>();
  for (const rel of relationships) {
    // If A is parent type toward B, then B is child of A
    if (isParentType(rel.type)) {
      if (!childrenOf.has(rel.personAId)) childrenOf.set(rel.personAId, new Set());
      childrenOf.get(rel.personAId)!.add(rel.personBId);
    }
    // If A is child type toward B, then A is child of B
    if (isChildType(rel.type)) {
      if (!childrenOf.has(rel.personBId)) childrenOf.set(rel.personBId, new Set());
      childrenOf.get(rel.personBId)!.add(rel.personAId);
    }
  }

  // Create family units
  for (const person of generation) {
    if (assigned.has(person.id)) continue;

    const unit: FamilyUnit = {
      primary: person,
      children: [],
    };
    assigned.add(person.id);

    // Check for spouse in same generation
    const spouseId = spouseOf.get(person.id);
    if (spouseId) {
      const spouse = generation.find((p) => p.id === spouseId);
      if (spouse && !assigned.has(spouse.id)) {
        unit.spouse = spouse;
        assigned.add(spouse.id);
      }
    }

    // Find children from next generation
    if (nextGeneration) {
      const primaryChildren = childrenOf.get(person.id) || new Set();
      const spouseChildren = unit.spouse ? (childrenOf.get(unit.spouse.id) || new Set()) : new Set();
      const allChildIds = new Set([...primaryChildren, ...spouseChildren]);

      unit.children = nextGeneration.filter((p) => allChildIds.has(p.id));
    }

    units.push(unit);
  }

  return units;
}

/**
 * Hook to compute generation layout for the visualization.
 */
export function useGenerationLayout(focusPersonId: string | null): GenerationLayout | null {
  const { people, relationships, settings } = useDataStore();

  return useMemo(() => {
    // Determine focus person
    const effectiveFocusId = focusPersonId || settings.primaryUserId;

    if (!effectiveFocusId || people.length === 0) {
      // If no focus, try to find most connected person
      if (people.length === 0) return null;

      const connectionCount = new Map<string, number>();
      for (const p of people) connectionCount.set(p.id, 0);
      for (const r of relationships) {
        connectionCount.set(r.personAId, (connectionCount.get(r.personAId) || 0) + 1);
        connectionCount.set(r.personBId, (connectionCount.get(r.personBId) || 0) + 1);
      }

      let mostConnected = people[0].id;
      let maxConnections = 0;
      for (const [id, count] of connectionCount) {
        if (count > maxConnections) {
          mostConnected = id;
          maxConnections = count;
        }
      }

      return assignGenerations(mostConnected, people, relationships);
    }

    return assignGenerations(effectiveFocusId, people, relationships);
  }, [focusPersonId, people, relationships, settings.primaryUserId]);
}

/**
 * Get relationship lines between people for rendering.
 */
export interface RelationshipLine {
  from: string;
  to: string;
  type: string;
  style: "solid" | "dashed" | "dotted" | "double";
}

export function getRelationshipLines(relationships: Relationship[]): RelationshipLine[] {
  return relationships.map((rel) => {
    let style: RelationshipLine["style"] = "solid";

    if (isParentType(rel.type) || isChildType(rel.type)) {
      style = "solid";
    } else if (isSpouseType(rel.type)) {
      style = "double";
    } else if (isSiblingType(rel.type)) {
      style = "dashed";
    } else {
      style = "dotted";
    }

    return {
      from: rel.personAId,
      to: rel.personBId,
      type: rel.type,
      style,
    };
  });
}
