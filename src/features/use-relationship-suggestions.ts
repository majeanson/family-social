"use client";

import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import type { Person, Relationship, RelationshipType } from "@/types";
import { RELATIONSHIP_CONFIG } from "@/types";

export interface RelationshipSuggestion {
  id: string;
  personAId: string;
  personBId: string;
  type: RelationshipType;
  reverseType: RelationshipType;
  reason: string;
  /** The intermediate person(s) that create this relationship */
  throughPersonIds: string[];
}

/**
 * Inference rules for detecting missing relationships.
 * Each rule takes existing relationships and returns suggestions.
 */
type InferenceRule = (
  people: Person[],
  relationships: Relationship[],
  existingPairs: Set<string>
) => RelationshipSuggestion[];

// Helper to create a unique pair key
function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

// Helper to get all relationships for a person
function getRelationshipsFor(personId: string, relationships: Relationship[]) {
  return relationships.filter(
    (r) => r.personAId === personId || r.personBId === personId
  );
}

// Helper to get the other person in a relationship
function getOtherPerson(rel: Relationship, personId: string): string {
  return rel.personAId === personId ? rel.personBId : rel.personAId;
}

// Helper to get the relationship type from perspective of a person
function getTypeFrom(rel: Relationship, personId: string): RelationshipType {
  return rel.personAId === personId
    ? rel.type
    : (rel.reverseType as RelationshipType) || rel.type;
}

// Helper to get person name for display
function getPersonName(personId: string, people: Person[]): string {
  const person = people.find((p) => p.id === personId);
  return person ? `${person.firstName} ${person.lastName || ""}`.trim() : "Unknown";
}

/**
 * Rule: Sibling's spouse → In-law
 * If A is sibling of B, and B is spouse of C, then A and C are in-laws
 */
const siblingSpouseRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const rel of relationships) {
    if (rel.type !== "sibling") continue;

    // For each sibling pair (A, B)
    const siblingA = rel.personAId;
    const siblingB = rel.personBId;

    // Find spouses of A
    for (const spouseRel of relationships) {
      if (spouseRel.type !== "spouse" && spouseRel.type !== "partner") continue;
      if (spouseRel.personAId !== siblingA && spouseRel.personBId !== siblingA) continue;

      const spouseOfA = getOtherPerson(spouseRel, siblingA);

      // B and spouse of A should be in-laws
      const key = pairKey(siblingB, spouseOfA);
      if (!existingPairs.has(key) && siblingB !== spouseOfA) {
        suggestions.push({
          id: `suggestion-${key}-inlaw`,
          personAId: siblingB,
          personBId: spouseOfA,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(siblingB, people)} is sibling of ${getPersonName(siblingA, people)}, who is married to ${getPersonName(spouseOfA, people)}`,
          throughPersonIds: [siblingA],
        });
        existingPairs.add(key); // Prevent duplicates
      }
    }

    // Find spouses of B
    for (const spouseRel of relationships) {
      if (spouseRel.type !== "spouse" && spouseRel.type !== "partner") continue;
      if (spouseRel.personAId !== siblingB && spouseRel.personBId !== siblingB) continue;

      const spouseOfB = getOtherPerson(spouseRel, siblingB);

      // A and spouse of B should be in-laws
      const key = pairKey(siblingA, spouseOfB);
      if (!existingPairs.has(key) && siblingA !== spouseOfB) {
        suggestions.push({
          id: `suggestion-${key}-inlaw`,
          personAId: siblingA,
          personBId: spouseOfB,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(siblingA, people)} is sibling of ${getPersonName(siblingB, people)}, who is married to ${getPersonName(spouseOfB, people)}`,
          throughPersonIds: [siblingB],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Sibling's child → Niece/Nephew
 * If A is sibling of B, and B is parent of C, then A is aunt/uncle of C
 */
const siblingChildRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const siblingRel of relationships) {
    if (siblingRel.type !== "sibling") continue;

    const siblingA = siblingRel.personAId;
    const siblingB = siblingRel.personBId;

    // Find children of A
    for (const childRel of relationships) {
      if (childRel.type !== "parent") continue;
      if (childRel.personAId !== siblingA) continue;

      const childOfA = childRel.personBId;

      // B is aunt/uncle of child of A
      const key = pairKey(siblingB, childOfA);
      if (!existingPairs.has(key) && siblingB !== childOfA) {
        suggestions.push({
          id: `suggestion-${key}-auntuncle`,
          personAId: siblingB,
          personBId: childOfA,
          type: "aunt_uncle",
          reverseType: "niece_nephew",
          reason: `${getPersonName(siblingB, people)} is sibling of ${getPersonName(siblingA, people)}, who is parent of ${getPersonName(childOfA, people)}`,
          throughPersonIds: [siblingA],
        });
        existingPairs.add(key);
      }
    }

    // Find children of B
    for (const childRel of relationships) {
      if (childRel.type !== "parent") continue;
      if (childRel.personAId !== siblingB) continue;

      const childOfB = childRel.personBId;

      // A is aunt/uncle of child of B
      const key = pairKey(siblingA, childOfB);
      if (!existingPairs.has(key) && siblingA !== childOfB) {
        suggestions.push({
          id: `suggestion-${key}-auntuncle`,
          personAId: siblingA,
          personBId: childOfB,
          type: "aunt_uncle",
          reverseType: "niece_nephew",
          reason: `${getPersonName(siblingA, people)} is sibling of ${getPersonName(siblingB, people)}, who is parent of ${getPersonName(childOfB, people)}`,
          throughPersonIds: [siblingB],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Parent's parent → Grandparent
 * If A is parent of B, and B is parent of C, then A is grandparent of C
 */
const grandparentRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const rel1 of relationships) {
    if (rel1.type !== "parent") continue;

    const grandparent = rel1.personAId;
    const parent = rel1.personBId;

    // Find children of the parent (parent's children = grandchildren)
    for (const rel2 of relationships) {
      if (rel2.type !== "parent") continue;
      if (rel2.personAId !== parent) continue;

      const grandchild = rel2.personBId;

      const key = pairKey(grandparent, grandchild);
      if (!existingPairs.has(key) && grandparent !== grandchild) {
        suggestions.push({
          id: `suggestion-${key}-grandparent`,
          personAId: grandparent,
          personBId: grandchild,
          type: "grandparent",
          reverseType: "grandchild",
          reason: `${getPersonName(grandparent, people)} is parent of ${getPersonName(parent, people)}, who is parent of ${getPersonName(grandchild, people)}`,
          throughPersonIds: [parent],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Spouse's parent → In-law
 * If A is spouse of B, and C is parent of B, then A and C are in-laws
 */
const spouseParentRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const spouseRel of relationships) {
    if (spouseRel.type !== "spouse" && spouseRel.type !== "partner") continue;

    const spouseA = spouseRel.personAId;
    const spouseB = spouseRel.personBId;

    // Find parents of spouseB
    for (const parentRel of relationships) {
      if (parentRel.type !== "parent") continue;
      if (parentRel.personBId !== spouseB) continue;

      const parentOfB = parentRel.personAId;

      const key = pairKey(spouseA, parentOfB);
      if (!existingPairs.has(key) && spouseA !== parentOfB) {
        suggestions.push({
          id: `suggestion-${key}-inlaw-parent`,
          personAId: spouseA,
          personBId: parentOfB,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(spouseA, people)} is married to ${getPersonName(spouseB, people)}, whose parent is ${getPersonName(parentOfB, people)}`,
          throughPersonIds: [spouseB],
        });
        existingPairs.add(key);
      }
    }

    // Find parents of spouseA
    for (const parentRel of relationships) {
      if (parentRel.type !== "parent") continue;
      if (parentRel.personBId !== spouseA) continue;

      const parentOfA = parentRel.personAId;

      const key = pairKey(spouseB, parentOfA);
      if (!existingPairs.has(key) && spouseB !== parentOfA) {
        suggestions.push({
          id: `suggestion-${key}-inlaw-parent`,
          personAId: spouseB,
          personBId: parentOfA,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(spouseB, people)} is married to ${getPersonName(spouseA, people)}, whose parent is ${getPersonName(parentOfA, people)}`,
          throughPersonIds: [spouseA],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Spouse's sibling → In-law
 * If A is spouse of B, and C is sibling of B, then A and C are in-laws
 */
const spouseSiblingRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const spouseRel of relationships) {
    if (spouseRel.type !== "spouse" && spouseRel.type !== "partner") continue;

    const spouseA = spouseRel.personAId;
    const spouseB = spouseRel.personBId;

    // Find siblings of spouseB
    for (const siblingRel of relationships) {
      if (siblingRel.type !== "sibling") continue;
      if (siblingRel.personAId !== spouseB && siblingRel.personBId !== spouseB) continue;

      const siblingOfB = getOtherPerson(siblingRel, spouseB);

      const key = pairKey(spouseA, siblingOfB);
      if (!existingPairs.has(key) && spouseA !== siblingOfB) {
        suggestions.push({
          id: `suggestion-${key}-inlaw-sibling`,
          personAId: spouseA,
          personBId: siblingOfB,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(spouseA, people)} is married to ${getPersonName(spouseB, people)}, whose sibling is ${getPersonName(siblingOfB, people)}`,
          throughPersonIds: [spouseB],
        });
        existingPairs.add(key);
      }
    }

    // Find siblings of spouseA
    for (const siblingRel of relationships) {
      if (siblingRel.type !== "sibling") continue;
      if (siblingRel.personAId !== spouseA && siblingRel.personBId !== spouseA) continue;

      const siblingOfA = getOtherPerson(siblingRel, spouseA);

      const key = pairKey(spouseB, siblingOfA);
      if (!existingPairs.has(key) && spouseB !== siblingOfA) {
        suggestions.push({
          id: `suggestion-${key}-inlaw-sibling`,
          personAId: spouseB,
          personBId: siblingOfA,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(spouseB, people)} is married to ${getPersonName(spouseA, people)}, whose sibling is ${getPersonName(siblingOfA, people)}`,
          throughPersonIds: [spouseA],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Parent's sibling's child → Cousin
 * If A's parent is B, B's sibling is C, and C's child is D, then A and D are cousins
 */
const cousinRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  // For each person, find their parent's siblings' children
  for (const person of people) {
    // Find person's parents
    const parentRels = relationships.filter(
      (r) => r.type === "parent" && r.personBId === person.id
    );

    for (const parentRel of parentRels) {
      const parent = parentRel.personAId;

      // Find parent's siblings
      const siblingRels = relationships.filter(
        (r) => r.type === "sibling" && (r.personAId === parent || r.personBId === parent)
      );

      for (const siblingRel of siblingRels) {
        const parentSibling = getOtherPerson(siblingRel, parent);

        // Find parent sibling's children
        const childRels = relationships.filter(
          (r) => r.type === "parent" && r.personAId === parentSibling
        );

        for (const childRel of childRels) {
          const cousin = childRel.personBId;

          const key = pairKey(person.id, cousin);
          if (!existingPairs.has(key) && person.id !== cousin) {
            suggestions.push({
              id: `suggestion-${key}-cousin`,
              personAId: person.id,
              personBId: cousin,
              type: "cousin",
              reverseType: "cousin",
              reason: `${getPersonName(person.id, people)}'s parent ${getPersonName(parent, people)} is sibling of ${getPersonName(parentSibling, people)}, who is parent of ${getPersonName(cousin, people)}`,
              throughPersonIds: [parent, parentSibling],
            });
            existingPairs.add(key);
          }
        }
      }
    }
  }

  return suggestions;
};

/**
 * Rule: Child's spouse → In-law
 * If A is parent of B, and B is spouse of C, then A and C are in-laws
 */
const childSpouseRule: InferenceRule = (people, relationships, existingPairs) => {
  const suggestions: RelationshipSuggestion[] = [];

  for (const parentRel of relationships) {
    if (parentRel.type !== "parent") continue;

    const parent = parentRel.personAId;
    const child = parentRel.personBId;

    // Find child's spouse
    for (const spouseRel of relationships) {
      if (spouseRel.type !== "spouse" && spouseRel.type !== "partner") continue;
      if (spouseRel.personAId !== child && spouseRel.personBId !== child) continue;

      const childSpouse = getOtherPerson(spouseRel, child);

      const key = pairKey(parent, childSpouse);
      if (!existingPairs.has(key) && parent !== childSpouse) {
        suggestions.push({
          id: `suggestion-${key}-inlaw-childspouse`,
          personAId: parent,
          personBId: childSpouse,
          type: "in_law",
          reverseType: "in_law",
          reason: `${getPersonName(parent, people)} is parent of ${getPersonName(child, people)}, who is married to ${getPersonName(childSpouse, people)}`,
          throughPersonIds: [child],
        });
        existingPairs.add(key);
      }
    }
  }

  return suggestions;
};

// All inference rules
const INFERENCE_RULES: InferenceRule[] = [
  siblingSpouseRule,
  siblingChildRule,
  grandparentRule,
  spouseParentRule,
  spouseSiblingRule,
  cousinRule,
  childSpouseRule,
];

/**
 * Hook to get relationship suggestions based on existing relationships.
 */
export function useRelationshipSuggestions() {
  const { people, relationships, addRelationship } = useDataStore();

  const suggestions = useMemo(() => {
    // Build set of existing relationship pairs
    const existingPairs = new Set<string>();
    for (const rel of relationships) {
      existingPairs.add(pairKey(rel.personAId, rel.personBId));
    }

    // Run all inference rules
    const allSuggestions: RelationshipSuggestion[] = [];
    for (const rule of INFERENCE_RULES) {
      // Clone existingPairs for each rule to track what's been suggested
      const pairsWithSuggestions = new Set(existingPairs);
      const ruleSuggestions = rule(people, relationships, pairsWithSuggestions);

      // Add to existing pairs to prevent duplicate suggestions across rules
      for (const suggestion of ruleSuggestions) {
        existingPairs.add(pairKey(suggestion.personAId, suggestion.personBId));
      }

      allSuggestions.push(...ruleSuggestions);
    }

    return allSuggestions;
  }, [people, relationships]);

  // Function to accept a suggestion
  const acceptSuggestion = (suggestion: RelationshipSuggestion) => {
    addRelationship(
      suggestion.personAId,
      suggestion.personBId,
      suggestion.type
    );
  };

  // Function to accept all suggestions
  const acceptAllSuggestions = () => {
    for (const suggestion of suggestions) {
      addRelationship(
        suggestion.personAId,
        suggestion.personBId,
        suggestion.type
      );
    }
  };

  // Get person details for a suggestion
  const getPersonDetails = (personId: string) => {
    return people.find((p) => p.id === personId);
  };

  return {
    suggestions,
    acceptSuggestion,
    acceptAllSuggestions,
    getPersonDetails,
    hasSuggestions: suggestions.length > 0,
    count: suggestions.length,
  };
}
