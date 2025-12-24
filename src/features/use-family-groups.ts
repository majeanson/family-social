"use client";

import { useMemo } from "react";
import { useDataStore } from "@/stores/data-store";
import type { Person, Relationship } from "@/types";
import { DEFAULT_FAMILY_COLORS } from "@/types";

export interface FamilyGroup {
  id: string;
  name: string;
  memberIds: Set<string>;
  colorIndex: number;
}

// Family relationship types that connect family members
const FAMILY_REL_TYPES = new Set([
  "parent", "child", "sibling", "spouse", "partner",
  "grandparent", "grandchild", "aunt_uncle", "niece_nephew",
  "cousin", "in_law", "step_family"
]);

/**
 * Detect family groups using Union-Find algorithm.
 * People connected by family relationships are grouped together.
 * Exported for use in graph component layout calculations.
 */
export function detectFamilyGroups(
  people: Person[],
  relationships: Relationship[]
): FamilyGroup[] {
  // Union-Find data structure
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  // Initialize each person as their own group
  people.forEach(p => {
    parent.set(p.id, p.id);
    rank.set(p.id, 0);
  });

  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  function union(x: string, y: string) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return;

    const rankX = rank.get(rootX) || 0;
    const rankY = rank.get(rootY) || 0;

    if (rankX < rankY) {
      parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      parent.set(rootY, rootX);
    } else {
      parent.set(rootY, rootX);
      rank.set(rootX, rankX + 1);
    }
  }

  // Union people connected by family relationships
  relationships.forEach(rel => {
    if (FAMILY_REL_TYPES.has(rel.type)) {
      union(rel.personAId, rel.personBId);
    }
  });

  // Group people by their root
  const groups = new Map<string, Set<string>>();
  people.forEach(p => {
    const root = find(p.id);
    if (!groups.has(root)) {
      groups.set(root, new Set());
    }
    groups.get(root)!.add(p.id);
  });

  // Convert to array and sort by size (largest first)
  const personMap = new Map(people.map(p => [p.id, p]));
  const familyGroups: FamilyGroup[] = [];
  let colorIndex = 0;

  Array.from(groups.entries())
    .filter(([, members]) => members.size > 1) // Only groups with 2+ members
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([rootId, memberIds]) => {
      const rootPerson = personMap.get(rootId);
      familyGroups.push({
        id: rootId,
        name: rootPerson ? `${rootPerson.lastName || rootPerson.firstName} Family` : "Family",
        memberIds,
        colorIndex: colorIndex++,
      });
    });

  return familyGroups;
}

/**
 * Hook to get family groups and lookup functions
 */
export function useFamilyGroups() {
  const { people, relationships, settings, updateSettings } = useDataStore();

  // Use colors from settings or defaults (ensure non-empty array)
  const colors = (settings.familyColors && settings.familyColors.length > 0)
    ? settings.familyColors
    : DEFAULT_FAMILY_COLORS;

  // Get custom family names and overrides from settings
  const customFamilyNames = settings.familyNames || {};
  const familyOverrides = settings.familyOverrides || {};

  const familyGroups = useMemo(() => {
    const groups = detectFamilyGroups(people, relationships);
    // Apply custom names from settings
    return groups.map(group => ({
      ...group,
      name: customFamilyNames[group.id] || group.name,
    }));
  }, [people, relationships, customFamilyNames]);

  // Map from person ID to their family group (with overrides applied)
  const personFamilyMap = useMemo(() => {
    const map = new Map<string, FamilyGroup>();

    // First, set auto-detected families
    familyGroups.forEach(group => {
      group.memberIds.forEach(memberId => {
        map.set(memberId, group);
      });
    });

    // Then apply manual overrides
    Object.entries(familyOverrides).forEach(([personId, targetFamilyId]) => {
      const targetFamily = familyGroups.find(g => g.id === targetFamilyId);
      if (targetFamily) {
        map.set(personId, targetFamily);
      }
    });

    return map;
  }, [familyGroups, familyOverrides]);

  // Get family color for a person
  const getFamilyColor = (personId: string) => {
    const family = personFamilyMap.get(personId);
    if (!family) return null;
    return colors[family.colorIndex % colors.length];
  };

  // Get family group for a person
  const getFamilyGroup = (personId: string) => {
    return personFamilyMap.get(personId) || null;
  };

  // Rename a family group
  const renameFamilyGroup = (groupId: string, newName: string) => {
    const updatedNames = { ...customFamilyNames, [groupId]: newName.trim() };
    updateSettings({ familyNames: updatedNames });
  };

  // Reset a family name to auto-generated default
  const resetFamilyName = (groupId: string) => {
    const { [groupId]: _, ...rest } = customFamilyNames;
    updateSettings({ familyNames: Object.keys(rest).length > 0 ? rest : undefined });
  };

  // Set a manual family override for a person
  const setFamilyOverride = (personId: string, targetFamilyId: string) => {
    const updatedOverrides = { ...familyOverrides, [personId]: targetFamilyId };
    updateSettings({ familyOverrides: updatedOverrides });
  };

  // Clear the family override for a person (revert to auto-detection)
  const clearFamilyOverride = (personId: string) => {
    const { [personId]: _, ...rest } = familyOverrides;
    updateSettings({ familyOverrides: Object.keys(rest).length > 0 ? rest : undefined });
  };

  // Check if a person has a manual family override
  const hasFamilyOverride = (personId: string) => {
    return personId in familyOverrides;
  };

  // Get the auto-detected family (ignoring overrides)
  const getAutoDetectedFamily = (personId: string) => {
    for (const group of familyGroups) {
      if (group.memberIds.has(personId)) {
        return group;
      }
    }
    return null;
  };

  return {
    familyGroups,
    getFamilyColor,
    getFamilyGroup,
    getAutoDetectedFamily,
    personFamilyMap,
    colors,
    renameFamilyGroup,
    resetFamilyName,
    setFamilyOverride,
    clearFamilyOverride,
    hasFamilyOverride,
  };
}
