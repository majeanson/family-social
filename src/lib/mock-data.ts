import type { Person, Relationship, FormTemplate } from "@/types";

// Mock IDs for consistent relationships
const MOCK_IDS = {
  // Parents
  dad: "mock-dad-001",
  mom: "mock-mom-001",
  // Siblings
  brother: "mock-brother-001",
  sister: "mock-sister-001",
  // Grandparents
  grandpaDad: "mock-grandpa-dad-001",
  grandmaDad: "mock-grandma-dad-001",
  grandpaMom: "mock-grandpa-mom-001",
  grandmaMom: "mock-grandma-mom-001",
  // Extended family
  uncle: "mock-uncle-001",
  aunt: "mock-aunt-001",
  cousin: "mock-cousin-001",
  // In-laws
  brotherInLaw: "mock-brother-in-law-001",
  // Friends
  bestFriend: "mock-friend-001",
};

const now = new Date().toISOString();
const pastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const MOCK_PEOPLE: Person[] = [
  {
    id: MOCK_IDS.dad,
    firstName: "Robert",
    lastName: "Johnson",
    nickname: "Bob",
    birthday: "1958-06-15",
    email: "bob.johnson@email.com",
    phone: "(555) 123-4567",
    notes: "Loves fishing and woodworking. Retired teacher.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(30),
    updatedAt: pastDate(5),
  },
  {
    id: MOCK_IDS.mom,
    firstName: "Margaret",
    lastName: "Johnson",
    nickname: "Maggie",
    birthday: "1960-03-22",
    email: "maggie.j@email.com",
    phone: "(555) 123-4568",
    notes: "Amazing cook. Volunteers at the library.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(30),
    updatedAt: pastDate(3),
  },
  {
    id: MOCK_IDS.brother,
    firstName: "Michael",
    lastName: "Johnson",
    nickname: "Mike",
    birthday: "1985-09-10",
    email: "mike.johnson@email.com",
    phone: "(555) 987-6543",
    notes: "Works in tech. Lives in Seattle.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(28),
    updatedAt: pastDate(7),
  },
  {
    id: MOCK_IDS.sister,
    firstName: "Emily",
    lastName: "Chen",
    nickname: "Em",
    birthday: "1990-12-03",
    email: "emily.chen@email.com",
    phone: "(555) 456-7890",
    notes: "Married to David. Has two kids: Lily and Jack.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(28),
    updatedAt: pastDate(2),
  },
  {
    id: MOCK_IDS.grandpaDad,
    firstName: "William",
    lastName: "Johnson",
    nickname: "Grandpa Bill",
    birthday: "1932-01-20",
    notes: "WWII veteran. Passed away 2018.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(25),
    updatedAt: pastDate(25),
  },
  {
    id: MOCK_IDS.grandmaDad,
    firstName: "Eleanor",
    lastName: "Johnson",
    nickname: "Grandma Ellie",
    birthday: "1935-07-08",
    phone: "(555) 111-2222",
    notes: "Lives at Sunshine Retirement Home. Loves crossword puzzles.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(25),
    updatedAt: pastDate(10),
  },
  {
    id: MOCK_IDS.grandpaMom,
    firstName: "George",
    lastName: "Martinez",
    nickname: "Abuelo",
    birthday: "1930-11-15",
    notes: "Born in Mexico. Amazing storyteller.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(25),
    updatedAt: pastDate(20),
  },
  {
    id: MOCK_IDS.grandmaMom,
    firstName: "Rosa",
    lastName: "Martinez",
    nickname: "Abuela",
    birthday: "1933-04-02",
    phone: "(555) 333-4444",
    notes: "Best tamales in the family. Still gardens at 91.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(25),
    updatedAt: pastDate(15),
  },
  {
    id: MOCK_IDS.uncle,
    firstName: "Thomas",
    lastName: "Johnson",
    nickname: "Uncle Tom",
    birthday: "1962-08-25",
    email: "tom.johnson@email.com",
    notes: "Dad's younger brother. Lives in Florida.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(20),
    updatedAt: pastDate(12),
  },
  {
    id: MOCK_IDS.aunt,
    firstName: "Patricia",
    lastName: "Johnson",
    nickname: "Aunt Patty",
    birthday: "1965-02-14",
    email: "patty.j@email.com",
    notes: "Uncle Tom's wife. Interior designer.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(20),
    updatedAt: pastDate(12),
  },
  {
    id: MOCK_IDS.cousin,
    firstName: "Jessica",
    lastName: "Johnson",
    birthday: "1992-05-30",
    email: "jess.johnson@email.com",
    notes: "Cousin from Uncle Tom. Getting married next summer!",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(18),
    updatedAt: pastDate(8),
  },
  {
    id: MOCK_IDS.brotherInLaw,
    firstName: "David",
    lastName: "Chen",
    birthday: "1988-07-19",
    email: "david.chen@email.com",
    phone: "(555) 789-0123",
    notes: "Emily's husband. Works as an architect.",
    tags: ["family"],
    customFields: [],
    createdAt: pastDate(15),
    updatedAt: pastDate(4),
  },
  {
    id: MOCK_IDS.bestFriend,
    firstName: "Sarah",
    lastName: "Williams",
    birthday: "1987-10-12",
    email: "sarah.w@email.com",
    phone: "(555) 555-5555",
    notes: "Best friend since college. Godmother to my kids.",
    tags: ["friend"],
    customFields: [],
    createdAt: pastDate(10),
    updatedAt: pastDate(1),
  },
];

export const MOCK_RELATIONSHIPS: Relationship[] = [
  // Parents are married
  {
    id: "mock-rel-001",
    personAId: MOCK_IDS.dad,
    personBId: MOCK_IDS.mom,
    type: "spouse",
    reverseType: "spouse",
    createdAt: now,
    updatedAt: now,
  },
  // Dad's parents
  {
    id: "mock-rel-002",
    personAId: MOCK_IDS.grandpaDad,
    personBId: MOCK_IDS.dad,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-003",
    personAId: MOCK_IDS.grandmaDad,
    personBId: MOCK_IDS.dad,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Grandparents married
  {
    id: "mock-rel-004",
    personAId: MOCK_IDS.grandpaDad,
    personBId: MOCK_IDS.grandmaDad,
    type: "spouse",
    reverseType: "spouse",
    createdAt: now,
    updatedAt: now,
  },
  // Mom's parents
  {
    id: "mock-rel-005",
    personAId: MOCK_IDS.grandpaMom,
    personBId: MOCK_IDS.mom,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-006",
    personAId: MOCK_IDS.grandmaMom,
    personBId: MOCK_IDS.mom,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Mom's parents married
  {
    id: "mock-rel-007",
    personAId: MOCK_IDS.grandpaMom,
    personBId: MOCK_IDS.grandmaMom,
    type: "spouse",
    reverseType: "spouse",
    createdAt: now,
    updatedAt: now,
  },
  // Siblings - all children of dad
  {
    id: "mock-rel-008",
    personAId: MOCK_IDS.dad,
    personBId: MOCK_IDS.brother,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-009",
    personAId: MOCK_IDS.dad,
    personBId: MOCK_IDS.sister,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Siblings - all children of mom
  {
    id: "mock-rel-010",
    personAId: MOCK_IDS.mom,
    personBId: MOCK_IDS.brother,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-011",
    personAId: MOCK_IDS.mom,
    personBId: MOCK_IDS.sister,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Brother and sister are siblings
  {
    id: "mock-rel-012",
    personAId: MOCK_IDS.brother,
    personBId: MOCK_IDS.sister,
    type: "sibling",
    reverseType: "sibling",
    createdAt: now,
    updatedAt: now,
  },
  // Uncle is dad's brother (sibling)
  {
    id: "mock-rel-013",
    personAId: MOCK_IDS.dad,
    personBId: MOCK_IDS.uncle,
    type: "sibling",
    reverseType: "sibling",
    createdAt: now,
    updatedAt: now,
  },
  // Uncle is child of grandparents
  {
    id: "mock-rel-014",
    personAId: MOCK_IDS.grandpaDad,
    personBId: MOCK_IDS.uncle,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-015",
    personAId: MOCK_IDS.grandmaDad,
    personBId: MOCK_IDS.uncle,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Uncle and Aunt married
  {
    id: "mock-rel-016",
    personAId: MOCK_IDS.uncle,
    personBId: MOCK_IDS.aunt,
    type: "spouse",
    reverseType: "spouse",
    createdAt: now,
    updatedAt: now,
  },
  // Cousin is child of Uncle
  {
    id: "mock-rel-017",
    personAId: MOCK_IDS.uncle,
    personBId: MOCK_IDS.cousin,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "mock-rel-018",
    personAId: MOCK_IDS.aunt,
    personBId: MOCK_IDS.cousin,
    type: "parent",
    reverseType: "child",
    createdAt: now,
    updatedAt: now,
  },
  // Brother and cousin are cousins
  {
    id: "mock-rel-019",
    personAId: MOCK_IDS.brother,
    personBId: MOCK_IDS.cousin,
    type: "cousin",
    reverseType: "cousin",
    createdAt: now,
    updatedAt: now,
  },
  // Sister and David (brother-in-law) married
  {
    id: "mock-rel-020",
    personAId: MOCK_IDS.sister,
    personBId: MOCK_IDS.brotherInLaw,
    type: "spouse",
    reverseType: "spouse",
    createdAt: now,
    updatedAt: now,
  },
  // Brother-in-law relationship to brother
  {
    id: "mock-rel-021",
    personAId: MOCK_IDS.brother,
    personBId: MOCK_IDS.brotherInLaw,
    type: "in_law",
    reverseType: "in_law",
    createdAt: now,
    updatedAt: now,
  },
  // Best friend
  {
    id: "mock-rel-022",
    personAId: MOCK_IDS.brother,
    personBId: MOCK_IDS.bestFriend,
    type: "friend",
    reverseType: "friend",
    createdAt: now,
    updatedAt: now,
  },
];

export const MOCK_FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "mock-form-001",
    name: "Family Reunion Info",
    description: "Collect contact info for the upcoming family reunion",
    fields: [
      { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "lastName", label: "Last Name", required: false, order: 1, type: "text" },
      { id: "f3", fieldKey: "email", label: "Email", required: false, order: 2, type: "email" },
      { id: "f4", fieldKey: "phone", label: "Phone", required: false, order: 3, type: "phone" },
      { id: "f5", fieldKey: "dietaryRestrictions", label: "Dietary Restrictions", required: false, order: 4, type: "textarea" },
    ],
    createdAt: pastDate(5),
    updatedAt: pastDate(2),
  },
  {
    id: "mock-form-002",
    name: "Birthday & Anniversary Tracker",
    description: "Help us remember important dates!",
    fields: [
      { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "lastName", label: "Last Name", required: false, order: 1, type: "text" },
      { id: "f3", fieldKey: "birthday", label: "Birthday", required: false, order: 2, type: "date" },
      { id: "f4", fieldKey: "anniversary", label: "Wedding Anniversary", required: false, order: 3, type: "date" },
    ],
    createdAt: pastDate(3),
    updatedAt: pastDate(1),
  },
  {
    id: "mock-form-003",
    name: "Emergency Contact",
    description: "Collect emergency contact information for family members",
    fields: [
      { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "lastName", label: "Last Name", required: true, order: 1, type: "text" },
      { id: "f3", fieldKey: "phone", label: "Phone", required: true, order: 2, type: "phone" },
      { id: "f4", fieldKey: "email", label: "Email", required: false, order: 3, type: "email" },
      { id: "f5", fieldKey: "address", label: "Address", required: false, order: 4, type: "textarea" },
      { id: "f6", fieldKey: "emergencyContact", label: "Emergency Contact Name", required: false, order: 5, type: "text" },
      { id: "f7", fieldKey: "emergencyPhone", label: "Emergency Contact Phone", required: false, order: 6, type: "phone" },
      { id: "f8", fieldKey: "medicalNotes", label: "Medical Notes/Allergies", required: false, order: 7, type: "textarea" },
    ],
    createdAt: pastDate(4),
    updatedAt: pastDate(2),
  },
  {
    id: "mock-form-004",
    name: "Holiday Gift Exchange",
    description: "Organize your family gift exchange with wish lists",
    fields: [
      { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "lastName", label: "Last Name", required: false, order: 1, type: "text" },
      { id: "f3", fieldKey: "wishlist", label: "Gift Wishlist", required: false, order: 2, type: "textarea" },
      { id: "f4", fieldKey: "shirtSize", label: "Shirt Size", required: false, order: 3, type: "text" },
      { id: "f5", fieldKey: "favoriteColor", label: "Favorite Color", required: false, order: 4, type: "text" },
      { id: "f6", fieldKey: "hobbies", label: "Hobbies & Interests", required: false, order: 5, type: "textarea" },
    ],
    createdAt: pastDate(6),
    updatedAt: pastDate(3),
  },
  {
    id: "mock-form-005",
    name: "Basic Contact",
    description: "Simple form for basic contact information",
    fields: [
      { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "lastName", label: "Last Name", required: false, order: 1, type: "text" },
      { id: "f3", fieldKey: "email", label: "Email", required: false, order: 2, type: "email" },
      { id: "f4", fieldKey: "phone", label: "Phone", required: false, order: 3, type: "phone" },
    ],
    createdAt: pastDate(7),
    updatedAt: pastDate(5),
  },
  {
    id: "mock-form-006",
    name: "New Baby Announcement",
    description: "Collect info for welcoming a new family member",
    fields: [
      { id: "f1", fieldKey: "babyName", label: "Baby's Name", required: true, order: 0, type: "text" },
      { id: "f2", fieldKey: "birthDate", label: "Birth Date", required: true, order: 1, type: "date" },
      { id: "f3", fieldKey: "parentNames", label: "Parent Names", required: false, order: 2, type: "text" },
      { id: "f4", fieldKey: "weight", label: "Weight", required: false, order: 3, type: "text" },
      { id: "f5", fieldKey: "length", label: "Length", required: false, order: 4, type: "text" },
      { id: "f6", fieldKey: "notes", label: "Special Notes", required: false, order: 5, type: "textarea" },
    ],
    createdAt: pastDate(2),
    updatedAt: pastDate(1),
  },
];

// Check if data contains mock data
export function hasMockData(people: Person[], relationships: Relationship[], formTemplates: FormTemplate[]): boolean {
  const hasMockPeople = people.some(p => p.id.startsWith("mock-"));
  const hasMockRelationships = relationships.some(r => r.id.startsWith("mock-"));
  const hasMockForms = formTemplates.some(f => f.id.startsWith("mock-"));
  return hasMockPeople || hasMockRelationships || hasMockForms;
}

// Filter out mock data
export function filterOutMockData(
  people: Person[],
  relationships: Relationship[],
  formTemplates: FormTemplate[]
): { people: Person[]; relationships: Relationship[]; formTemplates: FormTemplate[] } {
  return {
    people: people.filter(p => !p.id.startsWith("mock-")),
    relationships: relationships.filter(r => !r.id.startsWith("mock-")),
    formTemplates: formTemplates.filter(f => !f.id.startsWith("mock-")),
  };
}
