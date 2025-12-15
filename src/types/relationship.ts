export type RelationshipType =
  | "parent"
  | "child"
  | "sibling"
  | "spouse"
  | "partner"
  | "grandparent"
  | "grandchild"
  | "aunt_uncle"
  | "niece_nephew"
  | "cousin"
  | "in_law"
  | "step_family"
  | "friend"
  | "colleague"
  | "other";

export interface Relationship {
  id: string;
  personAId: string;
  personBId: string;
  type: RelationshipType;
  reverseType?: RelationshipType;
  label?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipGroup = "immediate" | "extended" | "social" | "other";

export interface RelationshipConfig {
  label: string;
  icon: string;
  color: string;
  group: RelationshipGroup;
  groupOrder: number;
}

export const RELATIONSHIP_GROUPS: Record<RelationshipGroup, { label: string; order: number }> = {
  immediate: { label: "Immediate Family", order: 0 },
  extended: { label: "Extended Family", order: 1 },
  social: { label: "Social", order: 2 },
  other: { label: "Other", order: 3 },
};

export const RELATIONSHIP_CONFIG: Record<RelationshipType, RelationshipConfig> = {
  // Immediate Family (most common)
  parent: {
    label: "Parent",
    icon: "User",
    color: "bg-blue-500",
    group: "immediate",
    groupOrder: 0,
  },
  child: {
    label: "Child",
    icon: "Baby",
    color: "bg-blue-400",
    group: "immediate",
    groupOrder: 1,
  },
  sibling: {
    label: "Sibling",
    icon: "Users",
    color: "bg-blue-300",
    group: "immediate",
    groupOrder: 2,
  },
  spouse: {
    label: "Spouse",
    icon: "Heart",
    color: "bg-pink-500",
    group: "immediate",
    groupOrder: 3,
  },
  partner: {
    label: "Partner",
    icon: "HeartHandshake",
    color: "bg-pink-400",
    group: "immediate",
    groupOrder: 4,
  },

  // Extended Family
  grandparent: {
    label: "Grandparent",
    icon: "Crown",
    color: "bg-purple-500",
    group: "extended",
    groupOrder: 0,
  },
  grandchild: {
    label: "Grandchild",
    icon: "Sparkles",
    color: "bg-purple-400",
    group: "extended",
    groupOrder: 1,
  },
  aunt_uncle: {
    label: "Aunt/Uncle",
    icon: "UserCircle",
    color: "bg-indigo-500",
    group: "extended",
    groupOrder: 2,
  },
  niece_nephew: {
    label: "Niece/Nephew",
    icon: "UserCircle2",
    color: "bg-indigo-400",
    group: "extended",
    groupOrder: 3,
  },
  cousin: {
    label: "Cousin",
    icon: "Users",
    color: "bg-violet-500",
    group: "extended",
    groupOrder: 4,
  },
  in_law: {
    label: "In-Law",
    icon: "Link",
    color: "bg-cyan-500",
    group: "extended",
    groupOrder: 5,
  },
  step_family: {
    label: "Step-Family",
    icon: "UserPlus",
    color: "bg-teal-500",
    group: "extended",
    groupOrder: 6,
  },

  // Social
  friend: {
    label: "Friend",
    icon: "Smile",
    color: "bg-green-500",
    group: "social",
    groupOrder: 0,
  },
  colleague: {
    label: "Colleague",
    icon: "Briefcase",
    color: "bg-amber-500",
    group: "social",
    groupOrder: 1,
  },

  // Other
  other: {
    label: "Other",
    icon: "MoreHorizontal",
    color: "bg-gray-500",
    group: "other",
    groupOrder: 0,
  },
};

export const RELATIONSHIP_INVERSES: Record<RelationshipType, RelationshipType> = {
  parent: "child",
  child: "parent",
  sibling: "sibling",
  spouse: "spouse",
  partner: "partner",
  grandparent: "grandchild",
  grandchild: "grandparent",
  aunt_uncle: "niece_nephew",
  niece_nephew: "aunt_uncle",
  cousin: "cousin",
  in_law: "in_law",
  step_family: "step_family",
  friend: "friend",
  colleague: "colleague",
  other: "other",
};

// Helper to get sorted relationship types by group
export function getGroupedRelationshipTypes(): { group: RelationshipGroup; label: string; types: RelationshipType[] }[] {
  const groups = Object.entries(RELATIONSHIP_GROUPS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, value]) => ({
      group: key as RelationshipGroup,
      label: value.label,
      types: [] as RelationshipType[],
    }));

  Object.entries(RELATIONSHIP_CONFIG)
    .sort(([, a], [, b]) => a.groupOrder - b.groupOrder)
    .forEach(([type, config]) => {
      const group = groups.find((g) => g.group === config.group);
      if (group) {
        group.types.push(type as RelationshipType);
      }
    });

  return groups;
}
