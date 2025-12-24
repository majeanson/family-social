"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PhotoUpload } from "@/components/ui/photo-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus, Trash2, Users, UserPlus, MapPin, Home, RotateCcw, Pencil, Check } from "lucide-react";
import { isValidEmail, isValidBirthday, isValidPhone } from "@/lib/utils";
import type { Person } from "@/types";
import { RelationshipSelector } from "@/components/relationships";
import { RELATIONSHIP_CONFIG, type RelationshipType } from "@/types";
import { useFamilyGroups } from "@/features";

// Relationship types that should be propagated to spouse/partner
const SPOUSE_PROPAGATABLE_TYPES: RelationshipType[] = ["child", "grandchild", "parent", "grandparent"];

// Relationship types that should be propagated to siblings
const SIBLING_PROPAGATABLE_TYPES: RelationshipType[] = ["sibling"];

interface PropagationOption {
  personId: string;
  personName: string;
  relationshipType: "spouse" | "partner" | "sibling";
}

interface PendingPropagation {
  targetPersonId: string;
  targetPersonName: string;
  relationshipType: RelationshipType;
  propagationOptions: PropagationOption[];
}

interface EditPersonDialogProps {
  person: Person | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPersonDialog({ person, open, onOpenChange }: EditPersonDialogProps) {
  // Use key to force remount when person changes, which resets form state
  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <EditPersonFormContent
          key={person.id}
          person={person}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

// Inner form that maintains its own state
function EditPersonFormContent({
  person,
  onClose,
}: {
  person: Person;
  onClose: () => void;
}) {
  const router = useRouter();
  const {
    updatePerson,
    deletePerson,
    addPerson,
    people,
    relationships,
    addRelationship,
    deleteRelationship,
  } = useDataStore();

  const {
    familyGroups,
    getFamilyGroup,
    getAutoDetectedFamily,
    setFamilyOverride,
    clearFamilyOverride,
    hasFamilyOverride,
    renameFamilyGroup,
    renameCustomFamily,
    createCustomFamily,
  } = useFamilyGroups();

  // Family editing state
  const [editingFamilyName, setEditingFamilyName] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState("");
  const [creatingNewFamily, setCreatingNewFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");

  // Form state initialized from person props
  const [firstName, setFirstName] = useState(person.firstName);
  const [lastName, setLastName] = useState(person.lastName);
  const [nickname, setNickname] = useState(person.nickname || "");
  const [photo, setPhoto] = useState<string | undefined>(person.photo);
  const [email, setEmail] = useState(person.email || "");
  const [phone, setPhone] = useState(person.phone || "");
  const [birthday, setBirthday] = useState(person.birthday || "");
  const [notes, setNotes] = useState(person.notes || "");
  const [tags, setTags] = useState<string[]>([...person.tags]);
  const [newTag, setNewTag] = useState("");

  // Address state
  const [addressStreet, setAddressStreet] = useState(person.address?.street || "");
  const [addressCity, setAddressCity] = useState(person.address?.city || "");
  const [addressState, setAddressState] = useState(person.address?.state || "");
  const [addressPostalCode, setAddressPostalCode] = useState(person.address?.postalCode || "");
  const [addressCountry, setAddressCountry] = useState(person.address?.country || "");

  // Relationship state
  const [newRelationshipPersonId, setNewRelationshipPersonId] = useState("");
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>("friend");

  // Add new person with relationship state
  const [showAddNewPerson, setShowAddNewPerson] = useState(false);
  const [newPersonRelationType, setNewPersonRelationType] = useState<RelationshipType>("child");
  const [newPersonFirstName, setNewPersonFirstName] = useState("");
  const [newPersonLastName, setNewPersonLastName] = useState("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Relationship propagation state
  const [pendingPropagation, setPendingPropagation] = useState<PendingPropagation | null>(null);
  const [selectedPropagations, setSelectedPropagations] = useState<Set<string>>(new Set());

  // Address copy state (for children)
  const [pendingAddressCopy, setPendingAddressCopy] = useState<{ childId: string; childName: string } | null>(null);

  // Get person's relationships
  const personRelationships = relationships.filter(
    (r) => r.personAId === person.id || r.personBId === person.id
  );

  // Find spouse/partner of the person being edited
  const getSpouseOrPartner = useCallback((): Person | null => {
    const spouseRel = personRelationships.find((r) => {
      const type = r.personAId === person.id ? r.type : r.reverseType || r.type;
      return type === "spouse" || type === "partner";
    });
    if (!spouseRel) return null;
    const spouseId = spouseRel.personAId === person.id ? spouseRel.personBId : spouseRel.personAId;
    return people.find((p) => p.id === spouseId) || null;
  }, [personRelationships, person.id, people]);

  // Find siblings of the person being edited
  const getSiblings = useCallback((): Person[] => {
    return personRelationships
      .filter((r) => {
        const type = r.personAId === person.id ? r.type : r.reverseType || r.type;
        return type === "sibling";
      })
      .map((r) => {
        const siblingId = r.personAId === person.id ? r.personBId : r.personAId;
        return people.find((p) => p.id === siblingId);
      })
      .filter((p): p is Person => p !== undefined);
  }, [personRelationships, person.id, people]);

  // Find children of the person being edited (for auto-sibling creation)
  const getChildren = useCallback((): Person[] => {
    return personRelationships
      .filter((r) => {
        const type = r.personAId === person.id ? r.type : r.reverseType || r.type;
        return type === "child";
      })
      .map((r) => {
        const childId = r.personAId === person.id ? r.personBId : r.personAId;
        return people.find((p) => p.id === childId);
      })
      .filter((p): p is Person => p !== undefined);
  }, [personRelationships, person.id, people]);

  // Check if a relationship already exists between two people
  const relationshipExists = useCallback((personAId: string, personBId: string): boolean => {
    return relationships.some(
      (r) =>
        (r.personAId === personAId && r.personBId === personBId) ||
        (r.personAId === personBId && r.personBId === personAId)
    );
  }, [relationships]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    // Validate email format
    const trimmedEmail = email.trim();
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate phone format
    const trimmedPhone = phone.trim();
    if (trimmedPhone && !isValidPhone(trimmedPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    // Validate birthday
    const birthdayValidation = isValidBirthday(birthday);
    if (!birthdayValidation.valid) {
      toast.error(birthdayValidation.error);
      return;
    }

    // Build address object only if any field is filled
    const address = (addressStreet || addressCity || addressState || addressPostalCode || addressCountry)
      ? {
          street: addressStreet.trim() || undefined,
          city: addressCity.trim() || undefined,
          state: addressState.trim() || undefined,
          postalCode: addressPostalCode.trim() || undefined,
          country: addressCountry.trim() || undefined,
        }
      : undefined;

    updatePerson(person.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || undefined,
      photo,
      email: trimmedEmail || undefined,
      phone: phone.trim() || undefined,
      birthday: birthday || undefined,
      notes: notes.trim() || undefined,
      tags,
      address,
    });

    toast.success(`${firstName} updated successfully`);
    onClose();
  }, [firstName, lastName, nickname, photo, email, phone, birthday, notes, tags, addressStreet, addressCity, addressState, addressPostalCode, addressCountry, person.id, updatePerson, onClose]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    // Check if deleting the "Me" person
    const { settings } = useDataStore.getState();
    const wasPrimaryUser = settings.primaryUserId === person.id;

    deletePerson(person.id);
    toast.success(`${person.firstName} has been removed`);

    // Notify user that their "Me" profile was cleared
    if (wasPrimaryUser) {
      toast.info("Your 'Me' profile has been cleared. You can set a new one in Settings.");
    }

    setShowDeleteConfirm(false);
    onClose();
  }, [person.firstName, person.id, deletePerson, onClose]);

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  }, [tags]);

  const handleAddRelationship = useCallback(() => {
    if (!newRelationshipPersonId) return;

    // Check if relationship already exists
    const exists = personRelationships.some(
      (r) =>
        (r.personAId === person.id && r.personBId === newRelationshipPersonId) ||
        (r.personAId === newRelationshipPersonId && r.personBId === person.id)
    );

    if (exists) {
      toast.error("Relationship already exists with this person");
      return;
    }

    const relatedPerson = people.find((p) => p.id === newRelationshipPersonId);
    if (!relatedPerson) return;

    // Check if this relationship type should trigger propagation options
    const propagationOptions: PropagationOption[] = [];

    // Check for spouse/partner propagation
    if (SPOUSE_PROPAGATABLE_TYPES.includes(newRelationshipType)) {
      const spouse = getSpouseOrPartner();
      if (spouse && !relationshipExists(spouse.id, newRelationshipPersonId)) {
        const spouseRel = personRelationships.find((r) => {
          const type = r.personAId === person.id ? r.type : r.reverseType || r.type;
          return type === "spouse" || type === "partner";
        });
        const relType = spouseRel?.type === "spouse" || spouseRel?.reverseType === "spouse" ? "spouse" : "partner";
        propagationOptions.push({
          personId: spouse.id,
          personName: `${spouse.firstName}${spouse.lastName ? ` ${spouse.lastName}` : ""}`,
          relationshipType: relType as "spouse" | "partner",
        });
      }
    }

    // Check for sibling propagation
    if (SIBLING_PROPAGATABLE_TYPES.includes(newRelationshipType)) {
      const siblings = getSiblings();
      for (const sibling of siblings) {
        if (!relationshipExists(sibling.id, newRelationshipPersonId)) {
          propagationOptions.push({
            personId: sibling.id,
            personName: `${sibling.firstName}${sibling.lastName ? ` ${sibling.lastName}` : ""}`,
            relationshipType: "sibling",
          });
        }
      }
    }

    // When adding a child, automatically add sibling relationships with existing children
    if (newRelationshipType === "child") {
      const existingChildren = getChildren();
      for (const existingChild of existingChildren) {
        if (existingChild.id !== newRelationshipPersonId && !relationshipExists(existingChild.id, newRelationshipPersonId)) {
          // Auto-add sibling relationship between children
          addRelationship(existingChild.id, newRelationshipPersonId, "sibling");
        }
      }
    }

    // Add the primary relationship
    addRelationship(person.id, newRelationshipPersonId, newRelationshipType);

    // If there are propagation options, show the dialog
    if (propagationOptions.length > 0) {
      setPendingPropagation({
        targetPersonId: newRelationshipPersonId,
        targetPersonName: `${relatedPerson.firstName}${relatedPerson.lastName ? ` ${relatedPerson.lastName}` : ""}`,
        relationshipType: newRelationshipType,
        propagationOptions,
      });
      // Pre-select all options by default
      setSelectedPropagations(new Set(propagationOptions.map((o) => o.personId)));
    } else {
      toast.success(`Added ${RELATIONSHIP_CONFIG[newRelationshipType].label} relationship with ${relatedPerson.firstName}`);
    }

    setNewRelationshipPersonId("");
  }, [person.id, newRelationshipPersonId, newRelationshipType, personRelationships, addRelationship, people, getSpouseOrPartner, getSiblings, getChildren, relationshipExists]);

  // Handle confirming propagation
  const handleConfirmPropagation = useCallback(() => {
    if (!pendingPropagation) return;

    const propagatedTo: string[] = [];
    for (const option of pendingPropagation.propagationOptions) {
      if (selectedPropagations.has(option.personId)) {
        addRelationship(option.personId, pendingPropagation.targetPersonId, pendingPropagation.relationshipType);
        propagatedTo.push(option.personName);
      }
    }

    if (propagatedTo.length > 0) {
      toast.success(
        `Added ${RELATIONSHIP_CONFIG[pendingPropagation.relationshipType].label} relationship with ${pendingPropagation.targetPersonName} for you and ${propagatedTo.join(", ")}`
      );
    } else {
      toast.success(
        `Added ${RELATIONSHIP_CONFIG[pendingPropagation.relationshipType].label} relationship with ${pendingPropagation.targetPersonName}`
      );
    }

    setPendingPropagation(null);
    setSelectedPropagations(new Set());
  }, [pendingPropagation, selectedPropagations, addRelationship]);

  // Handle skipping propagation
  const handleSkipPropagation = useCallback(() => {
    if (pendingPropagation) {
      toast.success(
        `Added ${RELATIONSHIP_CONFIG[pendingPropagation.relationshipType].label} relationship with ${pendingPropagation.targetPersonName}`
      );
    }
    setPendingPropagation(null);
    setSelectedPropagations(new Set());
  }, [pendingPropagation]);

  // Handle creating a new person with relationship
  const handleAddNewPersonWithRelationship = useCallback(() => {
    if (!newPersonFirstName.trim()) {
      toast.error("First name is required");
      return;
    }

    // Create the new person
    const newPersonId = addPerson({
      firstName: newPersonFirstName.trim(),
      lastName: newPersonLastName.trim(),
      tags: [],
      customFields: [],
    });

    const newPersonFullName = `${newPersonFirstName.trim()}${newPersonLastName.trim() ? ` ${newPersonLastName.trim()}` : ""}`;

    // Add the relationship
    addRelationship(person.id, newPersonId, newPersonRelationType);

    // Check for propagation options
    const propagationOptions: PropagationOption[] = [];

    // Check for spouse/partner propagation
    if (SPOUSE_PROPAGATABLE_TYPES.includes(newPersonRelationType)) {
      const spouse = getSpouseOrPartner();
      if (spouse && !relationshipExists(spouse.id, newPersonId)) {
        const spouseRel = personRelationships.find((r) => {
          const type = r.personAId === person.id ? r.type : r.reverseType || r.type;
          return type === "spouse" || type === "partner";
        });
        const relType = spouseRel?.type === "spouse" || spouseRel?.reverseType === "spouse" ? "spouse" : "partner";
        propagationOptions.push({
          personId: spouse.id,
          personName: `${spouse.firstName}${spouse.lastName ? ` ${spouse.lastName}` : ""}`,
          relationshipType: relType as "spouse" | "partner",
        });
      }
    }

    // Check for sibling propagation
    if (SIBLING_PROPAGATABLE_TYPES.includes(newPersonRelationType)) {
      const siblings = getSiblings();
      for (const sibling of siblings) {
        if (!relationshipExists(sibling.id, newPersonId)) {
          propagationOptions.push({
            personId: sibling.id,
            personName: `${sibling.firstName}${sibling.lastName ? ` ${sibling.lastName}` : ""}`,
            relationshipType: "sibling",
          });
        }
      }
    }

    // When adding a new person as a child, automatically add sibling relationships with existing children
    if (newPersonRelationType === "child") {
      const existingChildren = getChildren();
      for (const existingChild of existingChildren) {
        if (!relationshipExists(existingChild.id, newPersonId)) {
          // Auto-add sibling relationship between children
          addRelationship(existingChild.id, newPersonId, "sibling");
        }
      }
    }

    // Reset the add new person form
    setShowAddNewPerson(false);
    setNewPersonFirstName("");
    setNewPersonLastName("");

    // If there are propagation options, show the dialog
    if (propagationOptions.length > 0) {
      setPendingPropagation({
        targetPersonId: newPersonId,
        targetPersonName: newPersonFullName,
        relationshipType: newPersonRelationType,
        propagationOptions,
      });
      setSelectedPropagations(new Set(propagationOptions.map((o) => o.personId)));
    } else {
      toast.success(`Added ${newPersonFullName} as ${RELATIONSHIP_CONFIG[newPersonRelationType].label}`);
    }

    // If adding a child and parent has address, offer to copy it
    if (newPersonRelationType === "child" && person.address && (person.address.street || person.address.city)) {
      setPendingAddressCopy({ childId: newPersonId, childName: newPersonFullName });
    }
  }, [newPersonFirstName, newPersonLastName, newPersonRelationType, person.id, person.address, addPerson, addRelationship, getSpouseOrPartner, getSiblings, getChildren, relationshipExists, personRelationships]);

  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    deleteRelationship(relationshipId);
    toast.success("Relationship removed");
  }, [deleteRelationship]);

  // Navigate to a person's profile
  const handleNavigateToPerson = useCallback((personId: string) => {
    onClose();
    router.push(`/person/${personId}`);
  }, [onClose, router]);

  // Copy address to child
  const handleCopyAddressToChild = useCallback(() => {
    if (!pendingAddressCopy || !person.address) return;
    updatePerson(pendingAddressCopy.childId, { address: { ...person.address } });
    toast.success(`Address copied to ${pendingAddressCopy.childName}`);
    setPendingAddressCopy(null);
  }, [pendingAddressCopy, person.address, updatePerson]);

  const handleSkipAddressCopy = useCallback(() => {
    setPendingAddressCopy(null);
  }, []);

  // Get available people for new relationship (excluding self and already connected)
  const availablePeople = useMemo(() => people.filter((p) => {
    if (p.id === person.id) return false;
    return !personRelationships.some(
      (r) =>
        (r.personAId === person.id && r.personBId === p.id) ||
        (r.personAId === p.id && r.personBId === person.id)
    );
  }), [people, person.id, personRelationships]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit {person.firstName}</DialogTitle>
        <DialogDescription>
          Update personal information and manage relationships
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Basic Information
          </h3>

          {/* Photo and Name Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              initials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"}
              size="lg"
            />
            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nickname or preferred name"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Address
          </h3>

          <div className="space-y-2">
            <Label htmlFor="addressStreet">Street</Label>
            <Input
              id="addressStreet"
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressCity">City</Label>
              <Input
                id="addressCity"
                value={addressCity}
                onChange={(e) => setAddressCity(e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressState">State/Province</Label>
              <Input
                id="addressState"
                value={addressState}
                onChange={(e) => setAddressState(e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Postal Code</Label>
              <Input
                id="addressPostalCode"
                value={addressPostalCode}
                onChange={(e) => setAddressPostalCode(e.target.value)}
                placeholder="12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressCountry">Country</Label>
              <Input
                id="addressCountry"
                value={addressCountry}
                onChange={(e) => setAddressCountry(e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this person..."
            rows={3}
          />
        </div>

        <Separator />

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Tags
          </h3>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Relationships */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Relationships ({personRelationships.length})
          </h3>

          {/* Existing relationships */}
          {personRelationships.length > 0 && (
            <div className="space-y-2">
              {personRelationships.map((rel) => {
                const isPersonA = rel.personAId === person.id;
                const relatedPersonId = isPersonA ? rel.personBId : rel.personAId;
                const relatedPerson = people.find((p) => p.id === relatedPersonId);
                const relationType = isPersonA ? rel.type : rel.reverseType || rel.type;
                const config = RELATIONSHIP_CONFIG[relationType as keyof typeof RELATIONSHIP_CONFIG];

                if (!relatedPerson) return null;

                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <button
                      type="button"
                      onClick={() => handleNavigateToPerson(relatedPerson.id)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-70 transition-opacity"
                    >
                      <span
                        className={`h-3 w-3 rounded-full ${config?.color || "bg-gray-400"}`}
                      />
                      <div>
                        <span className="font-medium hover:underline">
                          {relatedPerson.firstName} {relatedPerson.lastName}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({config?.label || relationType})
                        </span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRelationship(rel.id)}
                      aria-label={`Remove relationship with ${relatedPerson.firstName}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add new relationship */}
          {availablePeople.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={newRelationshipPersonId}
                onValueChange={setNewRelationshipPersonId}
              >
                <SelectTrigger className="w-full sm:flex-1">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePeople.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-full sm:w-40">
                <RelationshipSelector
                  value={newRelationshipType}
                  onValueChange={setNewRelationshipType}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRelationship}
                disabled={!newRelationshipPersonId}
                className="w-full sm:w-auto"
                aria-label="Add relationship"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {availablePeople.length === 0 && personRelationships.length === 0 && !showAddNewPerson && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No relationships yet. Add a new person below.
            </p>
          )}

          {/* Add new person with relationship */}
          {!showAddNewPerson ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddNewPerson(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Person as...
            </Button>
          ) : (
            <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Add New Person
                </h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setShowAddNewPerson(false);
                    setNewPersonFirstName("");
                    setNewPersonLastName("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Relationship Type</Label>
                <RelationshipSelector
                  value={newPersonRelationType}
                  onValueChange={setNewPersonRelationType}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="newPersonFirstName" className="text-xs">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="newPersonFirstName"
                    value={newPersonFirstName}
                    onChange={(e) => setNewPersonFirstName(e.target.value)}
                    placeholder="First name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewPersonWithRelationship();
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="newPersonLastName" className="text-xs">Last Name</Label>
                  <Input
                    id="newPersonLastName"
                    value={newPersonLastName}
                    onChange={(e) => setNewPersonLastName(e.target.value)}
                    placeholder="Last name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewPersonWithRelationship();
                      }
                    }}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddNewPersonWithRelationship}
                disabled={!newPersonFirstName.trim()}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {RELATIONSHIP_CONFIG[newPersonRelationType].label}
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Family Assignment */}
        <>
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Home className="h-4 w-4" />
              Family
            </h3>

            <div className="space-y-3">
              {/* Current family info */}
              <div className="p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingFamilyName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={familyNameInput}
                          onChange={(e) => setFamilyNameInput(e.target.value)}
                          placeholder="Family name..."
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const currentFamily = getFamilyGroup(person.id);
                              if (currentFamily && familyNameInput.trim()) {
                                // Use renameCustomFamily for custom families, renameFamilyGroup for auto-detected
                                if (currentFamily.isCustom) {
                                  renameCustomFamily(currentFamily.id, familyNameInput.trim());
                                } else {
                                  renameFamilyGroup(currentFamily.id, familyNameInput.trim());
                                }
                                toast.success(`Family renamed to "${familyNameInput.trim()}"`);
                              }
                              setEditingFamilyName(false);
                            } else if (e.key === "Escape") {
                              setEditingFamilyName(false);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => {
                            const currentFamily = getFamilyGroup(person.id);
                            if (currentFamily && familyNameInput.trim()) {
                              if (currentFamily.isCustom) {
                                renameCustomFamily(currentFamily.id, familyNameInput.trim());
                              } else {
                                renameFamilyGroup(currentFamily.id, familyNameInput.trim());
                              }
                              toast.success(`Family renamed to "${familyNameInput.trim()}"`);
                            }
                            setEditingFamilyName(false);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {getFamilyGroup(person.id)?.name || "No family assigned"}
                        </p>
                        {getFamilyGroup(person.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => {
                              const currentFamily = getFamilyGroup(person.id);
                              if (currentFamily) {
                                setFamilyNameInput(currentFamily.name);
                                setEditingFamilyName(true);
                              }
                            }}
                            aria-label="Rename this family"
                            title="Rename this family (affects all members)"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    {!editingFamilyName && hasFamilyOverride(person.id) && (
                      <p className="text-xs text-muted-foreground">
                        Manually assigned (auto-detected: {getAutoDetectedFamily(person.id)?.name || "None"})
                      </p>
                    )}
                    {!editingFamilyName && getFamilyGroup(person.id)?.isCustom && (
                      <p className="text-xs text-muted-foreground">Custom family</p>
                    )}
                  </div>
                  {hasFamilyOverride(person.id) && !editingFamilyName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearFamilyOverride(person.id);
                        toast.success("Family reset to auto-detected");
                      }}
                      className="h-8 shrink-0"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              {/* Change family or create new */}
              {creatingNewFamily ? (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Create New Family</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setCreatingNewFamily(false);
                        setNewFamilyName("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      placeholder="e.g., Johnson Family"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newFamilyName.trim()) {
                            createCustomFamily(newFamilyName.trim(), person.id);
                            toast.success(`Created "${newFamilyName.trim()}" and assigned ${person.firstName}`);
                            setCreatingNewFamily(false);
                            setNewFamilyName("");
                          }
                        } else if (e.key === "Escape") {
                          setCreatingNewFamily(false);
                          setNewFamilyName("");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newFamilyName.trim()) {
                          createCustomFamily(newFamilyName.trim(), person.id);
                          toast.success(`Created "${newFamilyName.trim()}" and assigned ${person.firstName}`);
                          setCreatingNewFamily(false);
                          setNewFamilyName("");
                        }
                      }}
                      disabled={!newFamilyName.trim()}
                    >
                      Create
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will create a separate family for {person.firstName}.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {familyGroups.length > 0 && (
                    <Select
                      value={getFamilyGroup(person.id)?.id || ""}
                      onValueChange={(familyId) => {
                        if (familyId) {
                          setFamilyOverride(person.id, familyId);
                          const family = familyGroups.find(f => f.id === familyId);
                          toast.success(`Assigned to ${family?.name}`);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Assign to existing family..." />
                      </SelectTrigger>
                      <SelectContent>
                        {familyGroups.map((family) => (
                          <SelectItem key={family.id} value={family.id}>
                            {family.name} {family.isCustom ? "(custom)" : `(${family.memberIds.size} members)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatingNewFamily(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New
                  </Button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Families are auto-detected from relationships. Use "New" to create a separate family.
              </p>
            </div>
          </div>

          <Separator />
        </>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClick}
            className="sm:mr-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Person
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {person.firstName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {person.firstName} and remove all their
              relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Relationship Propagation Dialog */}
      <AlertDialog open={!!pendingPropagation} onOpenChange={(open) => !open && handleSkipPropagation()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add for family members too?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You added <strong>{pendingPropagation?.targetPersonName}</strong> as{" "}
                  <strong>{pendingPropagation && RELATIONSHIP_CONFIG[pendingPropagation.relationshipType].label}</strong>.
                </p>
                <p>Would you like to add the same relationship for:</p>
                <div className="space-y-2 mt-3">
                  {pendingPropagation?.propagationOptions.map((option) => (
                    <label
                      key={option.personId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropagations.has(option.personId)}
                        onChange={(e) => {
                          const newSet = new Set(selectedPropagations);
                          if (e.target.checked) {
                            newSet.add(option.personId);
                          } else {
                            newSet.delete(option.personId);
                          }
                          setSelectedPropagations(newSet);
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <div>
                        <span className="font-medium">{option.personName}</span>
                        <span className="text-muted-foreground ml-1">
                          (your {option.relationshipType})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipPropagation}>
              Skip
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPropagation}>
              Add for Selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Address Copy Dialog (for children) */}
      <AlertDialog open={!!pendingAddressCopy} onOpenChange={(open) => !open && handleSkipAddressCopy()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Copy address to child?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Would you like to copy your address to <strong>{pendingAddressCopy?.childName}</strong>?
                </p>
                {person.address && (
                  <div className="p-3 rounded-lg border bg-muted/30 text-sm">
                    {person.address.street && <p>{person.address.street}</p>}
                    <p>
                      {[person.address.city, person.address.state, person.address.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {person.address.country && <p>{person.address.country}</p>}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleSkipAddressCopy}>
              Skip
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyAddressToChild}>
              Copy Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
