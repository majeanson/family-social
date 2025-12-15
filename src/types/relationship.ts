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

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  spouse: "Spouse",
  partner: "Partner",
  grandparent: "Grandparent",
  grandchild: "Grandchild",
  aunt_uncle: "Aunt/Uncle",
  niece_nephew: "Niece/Nephew",
  cousin: "Cousin",
  in_law: "In-Law",
  step_family: "Step-Family",
  friend: "Friend",
  colleague: "Colleague",
  other: "Other",
};

export const RELATIONSHIP_INVERSES: Record<RelationshipType, RelationshipType> =
  {
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
