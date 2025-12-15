"use client";

import { useMemo, useCallback } from "react";
import { useDataStore } from "@/stores/data-store";
import { RELATIONSHIP_CONFIG, RELATIONSHIP_INVERSES } from "@/types";
import type { Person, RelationshipType } from "@/types";

/**
 * Hook to manage the primary user ("Me") and get relationships from "Me's" perspective
 */
export function usePrimaryUser() {
  const {
    people,
    relationships,
    settings,
    setPrimaryUser,
    clearPrimaryUser,
  } = useDataStore();

  // Get the "Me" person
  const me = useMemo(() => {
    if (!settings.primaryUserId) return null;
    return people.find((p) => p.id === settings.primaryUserId) || null;
  }, [people, settings.primaryUserId]);

  // Check if a person is "Me"
  const isMe = useCallback(
    (personId: string) => {
      return settings.primaryUserId === personId;
    },
    [settings.primaryUserId]
  );

  // Set a person as "Me"
  const setAsMe = useCallback(
    (personId: string) => {
      setPrimaryUser(personId);
    },
    [setPrimaryUser]
  );

  // Clear "Me" designation
  const clearMe = useCallback(() => {
    clearPrimaryUser();
  }, [clearPrimaryUser]);

  // Get relationships for a person from "Me's" perspective
  const getRelationshipsFromMyPerspective = useCallback(
    (personId: string) => {
      if (!me) return [];

      return relationships
        .filter((r) => {
          // Direct relationship between Me and the person
          return (
            (r.personAId === me.id && r.personBId === personId) ||
            (r.personBId === me.id && r.personAId === personId)
          );
        })
        .map((r) => {
          // Get the relationship from My perspective
          if (r.personAId === me.id) {
            // I am personA, so type is from my perspective
            return {
              relationship: r,
              type: r.type,
              label: RELATIONSHIP_CONFIG[r.type as keyof typeof RELATIONSHIP_CONFIG]?.label || r.type,
              direction: "from_me" as const,
            };
          } else {
            // I am personB, so use the reverse type
            const reverseType = r.reverseType || RELATIONSHIP_INVERSES[r.type as RelationshipType];
            return {
              relationship: r,
              type: reverseType,
              label: RELATIONSHIP_CONFIG[reverseType as keyof typeof RELATIONSHIP_CONFIG]?.label || reverseType,
              direction: "to_me" as const,
            };
          }
        });
    },
    [me, relationships]
  );

  // Get the relationship label from "Me" to another person
  const getMyRelationshipTo = useCallback(
    (person: Person): string | null => {
      const rels = getRelationshipsFromMyPerspective(person.id);
      if (rels.length === 0) return null;
      return rels[0].label;
    },
    [getRelationshipsFromMyPerspective]
  );

  // Check if "Me" has a direct relationship with a person
  const hasRelationshipWith = useCallback(
    (personId: string): boolean => {
      if (!me) return false;
      return relationships.some(
        (r) =>
          (r.personAId === me.id && r.personBId === personId) ||
          (r.personBId === me.id && r.personAId === personId)
      );
    },
    [me, relationships]
  );

  // Get degrees of separation from "Me" (using BFS with O(1) dequeue)
  const getDegreesOfSeparation = useCallback(
    (personId: string): number | null => {
      if (!me) return null;
      if (me.id === personId) return 0;

      // Build adjacency list
      const adjacency = new Map<string, Set<string>>();
      people.forEach((p) => adjacency.set(p.id, new Set()));
      relationships.forEach((r) => {
        adjacency.get(r.personAId)?.add(r.personBId);
        adjacency.get(r.personBId)?.add(r.personAId);
      });

      // BFS from "Me" using index-based queue (O(1) dequeue)
      const visited = new Set<string>([me.id]);
      const queue: { id: string; depth: number }[] = [{ id: me.id, depth: 0 }];
      let queueIndex = 0;

      while (queueIndex < queue.length) {
        const { id, depth } = queue[queueIndex++];
        const neighbors = adjacency.get(id) || new Set();

        for (const neighborId of neighbors) {
          if (neighborId === personId) {
            return depth + 1;
          }
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({ id: neighborId, depth: depth + 1 });
          }
        }
      }

      return null; // Not connected
    },
    [me, people, relationships]
  );

  return {
    me,
    isMe,
    setAsMe,
    clearMe,
    hasSetupMe: !!me,
    getMyRelationshipTo,
    getRelationshipsFromMyPerspective,
    hasRelationshipWith,
    getDegreesOfSeparation,
  };
}
