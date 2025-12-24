import type { Person, Relationship, FamilyEvent, RelationshipType } from "@/types";
import { detectFamilyGroups, type FamilyGroup } from "@/features/use-family-groups";
import { sanitizeFilename } from "./utils";

// Version for family export format
export const FAMILY_EXPORT_VERSION = 1;

// Family export data structure
export interface FamilyExportData {
  version: number;
  exportedAt: string;
  familyName: string;
  people: Person[];
  relationships: Relationship[];
  events: FamilyEvent[];
}

// Duplicate detection result
export interface DuplicateMatch {
  importPerson: Person;
  existingPerson: Person;
  matchScore: number;
  matchReasons: string[];
}

// Import decision for each person
export type ImportDecision = "skip" | "merge" | "create_new";

export interface PersonImportDecision {
  importPerson: Person;
  decision: ImportDecision;
  existingPersonId?: string; // For merge decision
}

// Import result
export interface FamilyImportResult {
  peopleImported: number;
  peopleMerged: number;
  peopleSkipped: number;
  relationshipsImported: number;
  eventsImported: number;
  idMapping: Map<string, string>; // old ID -> new ID
}

/**
 * Get all people in a family group plus their related events
 */
export function getFamilyMembers(
  familyGroup: FamilyGroup,
  people: Person[],
  relationships: Relationship[],
  events: FamilyEvent[]
): { people: Person[]; relationships: Relationship[]; events: FamilyEvent[] } {
  const memberIds = familyGroup.memberIds;

  // Get all people in the family
  const familyPeople = people.filter(p => memberIds.has(p.id));

  // Get relationships between family members
  const familyRelationships = relationships.filter(
    r => memberIds.has(r.personAId) && memberIds.has(r.personBId)
  );

  // Get events that include family members
  const familyEvents = events.filter(
    e => e.personIds.some((id: string) => memberIds.has(id))
  ).map(e => ({
    ...e,
    // Only include person IDs that are in this family
    personIds: e.personIds.filter((id: string) => memberIds.has(id)),
  }));

  return {
    people: familyPeople,
    relationships: familyRelationships,
    events: familyEvents,
  };
}

/**
 * Export a family group to a shareable format
 */
export function exportFamily(
  familyGroup: FamilyGroup,
  people: Person[],
  relationships: Relationship[],
  events: FamilyEvent[]
): FamilyExportData {
  const { people: familyPeople, relationships: familyRels, events: familyEvents } =
    getFamilyMembers(familyGroup, people, relationships, events);

  return {
    version: FAMILY_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    familyName: familyGroup.name,
    people: familyPeople,
    relationships: familyRels,
    events: familyEvents,
  };
}

/**
 * Download family export as JSON file
 */
export function downloadFamilyExport(data: FamilyExportData) {
  const filename = `${sanitizeFilename(data.familyName)}-family-export.json`;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Calculate similarity between two strings (case-insensitive)
 */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return 1;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return 0.8;
  return 0;
}

/**
 * Detect potential duplicates between import data and existing people
 */
export function detectDuplicates(
  importPeople: Person[],
  existingPeople: Person[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const importPerson of importPeople) {
    for (const existingPerson of existingPeople) {
      const matchReasons: string[] = [];
      let matchScore = 0;

      // Check email match (strong indicator)
      if (importPerson.email && existingPerson.email) {
        if (importPerson.email.toLowerCase() === existingPerson.email.toLowerCase()) {
          matchScore += 50;
          matchReasons.push("Same email address");
        }
      }

      // Check phone match (strong indicator)
      if (importPerson.phone && existingPerson.phone) {
        const normalizedImport = importPerson.phone.replace(/\D/g, "");
        const normalizedExisting = existingPerson.phone.replace(/\D/g, "");
        if (normalizedImport === normalizedExisting && normalizedImport.length >= 7) {
          matchScore += 40;
          matchReasons.push("Same phone number");
        }
      }

      // Check name match
      const firstNameSim = stringSimilarity(importPerson.firstName, existingPerson.firstName);
      const lastNameSim = stringSimilarity(importPerson.lastName, existingPerson.lastName);

      if (firstNameSim === 1 && lastNameSim === 1) {
        matchScore += 30;
        matchReasons.push("Same full name");
      } else if (firstNameSim === 1 && lastNameSim >= 0.8) {
        matchScore += 25;
        matchReasons.push("Same first name, similar last name");
      } else if (firstNameSim >= 0.8 && lastNameSim === 1) {
        matchScore += 25;
        matchReasons.push("Similar first name, same last name");
      } else if (firstNameSim === 1) {
        matchScore += 15;
        matchReasons.push("Same first name");
      }

      // Check birthday match
      if (importPerson.birthday && existingPerson.birthday) {
        if (importPerson.birthday === existingPerson.birthday) {
          matchScore += 20;
          matchReasons.push("Same birthday");
        }
      }

      // Check nickname match
      if (importPerson.nickname && existingPerson.nickname) {
        if (stringSimilarity(importPerson.nickname, existingPerson.nickname) === 1) {
          matchScore += 10;
          matchReasons.push("Same nickname");
        }
      }

      // Only include if there's a meaningful match
      if (matchScore >= 25) {
        matches.push({
          importPerson,
          existingPerson,
          matchScore,
          matchReasons,
        });
      }
    }
  }

  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Group duplicate matches by import person
 */
export function groupDuplicatesByImportPerson(
  matches: DuplicateMatch[]
): Map<string, DuplicateMatch[]> {
  const grouped = new Map<string, DuplicateMatch[]>();

  for (const match of matches) {
    const key = match.importPerson.id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(match);
  }

  return grouped;
}

/**
 * Merge two person records, preferring non-empty values from the import
 */
function mergePerson(existing: Person, imported: Person): Partial<Person> {
  const updates: Partial<Person> = {};

  // Prefer import data for empty fields
  if (!existing.nickname && imported.nickname) updates.nickname = imported.nickname;
  if (!existing.email && imported.email) updates.email = imported.email;
  if (!existing.phone && imported.phone) updates.phone = imported.phone;
  if (!existing.birthday && imported.birthday) updates.birthday = imported.birthday;
  if (!existing.photo && imported.photo) updates.photo = imported.photo;
  if (!existing.notes && imported.notes) {
    updates.notes = imported.notes;
  } else if (existing.notes && imported.notes && existing.notes !== imported.notes) {
    // Append notes if both have content
    updates.notes = `${existing.notes}\n\n---\n\n${imported.notes}`;
  }

  // Merge address
  if (imported.address) {
    const mergedAddress = { ...existing.address };
    if (!mergedAddress.street && imported.address.street) mergedAddress.street = imported.address.street;
    if (!mergedAddress.city && imported.address.city) mergedAddress.city = imported.address.city;
    if (!mergedAddress.state && imported.address.state) mergedAddress.state = imported.address.state;
    if (!mergedAddress.postalCode && imported.address.postalCode) mergedAddress.postalCode = imported.address.postalCode;
    if (!mergedAddress.country && imported.address.country) mergedAddress.country = imported.address.country;
    if (Object.keys(mergedAddress).length > 0) {
      updates.address = mergedAddress;
    }
  }

  // Merge tags (add new ones)
  if (imported.tags.length > 0) {
    const existingTags = new Set(existing.tags);
    const newTags = imported.tags.filter(t => !existingTags.has(t));
    if (newTags.length > 0) {
      updates.tags = [...existing.tags, ...newTags];
    }
  }

  // Merge custom fields (add new ones)
  if (imported.customFields.length > 0) {
    const existingLabels = new Set(existing.customFields.map(f => f.label.toLowerCase()));
    const newFields = imported.customFields.filter(f => !existingLabels.has(f.label.toLowerCase()));
    if (newFields.length > 0) {
      updates.customFields = [...existing.customFields, ...newFields];
    }
  }

  return updates;
}

/**
 * Import a family with the given decisions
 */
export function importFamily(
  importData: FamilyExportData,
  decisions: PersonImportDecision[],
  existingPeople: Person[],
  existingRelationships: Relationship[],
  addPerson: (data: Omit<Person, "id" | "createdAt" | "updatedAt">) => string,
  updatePerson: (id: string, updates: Partial<Person>) => void,
  addRelationship: (personAId: string, personBId: string, type: RelationshipType) => void,
  addEvent: (event: Omit<FamilyEvent, "id" | "createdAt" | "updatedAt">) => string
): FamilyImportResult {
  const idMapping = new Map<string, string>(); // old ID -> new ID
  let peopleImported = 0;
  let peopleMerged = 0;
  let peopleSkipped = 0;
  let relationshipsImported = 0;
  let eventsImported = 0;

  // Build a map of existing people by ID for quick lookup
  const existingPeopleMap = new Map(existingPeople.map(p => [p.id, p]));

  // Process each person based on their decision
  for (const decision of decisions) {
    const importPerson = decision.importPerson;

    switch (decision.decision) {
      case "skip":
        peopleSkipped++;
        // Still need to map the ID if this person exists
        if (decision.existingPersonId) {
          idMapping.set(importPerson.id, decision.existingPersonId);
        }
        break;

      case "merge":
        if (decision.existingPersonId) {
          const existingPerson = existingPeopleMap.get(decision.existingPersonId);
          if (existingPerson) {
            const updates = mergePerson(existingPerson, importPerson);
            if (Object.keys(updates).length > 0) {
              updatePerson(decision.existingPersonId, updates);
            }
            idMapping.set(importPerson.id, decision.existingPersonId);
            peopleMerged++;
          }
        }
        break;

      case "create_new":
      default:
        const newPersonId = addPerson({
          firstName: importPerson.firstName,
          lastName: importPerson.lastName,
          nickname: importPerson.nickname,
          photo: importPerson.photo,
          birthday: importPerson.birthday,
          email: importPerson.email,
          phone: importPerson.phone,
          notes: importPerson.notes,
          address: importPerson.address,
          tags: importPerson.tags,
          customFields: importPerson.customFields,
        });
        idMapping.set(importPerson.id, newPersonId);
        peopleImported++;
        break;
    }
  }

  // Import relationships (using mapped IDs)
  for (const rel of importData.relationships) {
    const newPersonAId = idMapping.get(rel.personAId);
    const newPersonBId = idMapping.get(rel.personBId);

    if (newPersonAId && newPersonBId) {
      // Check if relationship already exists
      const exists = existingRelationships.some(
        r => (r.personAId === newPersonAId && r.personBId === newPersonBId) ||
             (r.personAId === newPersonBId && r.personBId === newPersonAId)
      );

      if (!exists) {
        addRelationship(newPersonAId, newPersonBId, rel.type);
        relationshipsImported++;
      }
    }
  }

  // Import events (using mapped IDs)
  for (const event of importData.events) {
    const mappedPersonIds = event.personIds
      .map((id: string) => idMapping.get(id))
      .filter((id): id is string => !!id);

    if (mappedPersonIds.length > 0) {
      addEvent({
        title: event.title,
        type: event.type,
        date: event.date,
        description: event.description,
        personIds: mappedPersonIds,
        recurring: event.recurring,
        customTypeName: event.customTypeName,
        reminder: event.reminder,
      });
      eventsImported++;
    }
  }

  return {
    peopleImported,
    peopleMerged,
    peopleSkipped,
    relationshipsImported,
    eventsImported,
    idMapping,
  };
}

/**
 * Validate family export data
 */
export function validateFamilyExport(data: unknown): data is FamilyExportData {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "number") return false;
  if (typeof obj.familyName !== "string") return false;
  if (!Array.isArray(obj.people)) return false;
  if (!Array.isArray(obj.relationships)) return false;

  // Basic validation of people array
  for (const person of obj.people) {
    if (!person || typeof person !== "object") return false;
    const p = person as Record<string, unknown>;
    if (typeof p.id !== "string") return false;
    if (typeof p.firstName !== "string") return false;
  }

  return true;
}

/**
 * Parse a family export file
 */
export async function parseFamilyExportFile(file: File): Promise<FamilyExportData | null> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!validateFamilyExport(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
