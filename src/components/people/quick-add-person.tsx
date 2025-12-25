"use client";

import { useState, useMemo, useCallback } from "react";
import { useDataStore } from "@/stores/data-store";
import { RelationshipSelector } from "@/components/relationships";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { isValidEmail, isValidBirthday, isValidPhone, getDisplayName } from "@/lib/utils";
import type { RelationshipType, FormTemplate, Person } from "@/types";
import { RELATIONSHIP_CONFIG } from "@/types";
import { MOCK_FORM_TEMPLATES } from "@/lib/mock-data";
import { User, Link2, Info, FileText, Sparkles, Users } from "lucide-react";

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
  newPersonId: string;
  newPersonName: string;
  relationshipType: RelationshipType;
  propagationOptions: PropagationOption[];
}

interface QuickAddPersonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddPerson({ open, onOpenChange }: QuickAddPersonProps) {
  const { addPerson, addRelationship, people, relationships, formTemplates } = useDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relatedTo, setRelatedTo] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Propagation state
  const [pendingPropagation, setPendingPropagation] = useState<PendingPropagation | null>(null);
  const [selectedPropagations, setSelectedPropagations] = useState<Set<string>>(new Set());

  // Find spouse/partner of a given person
  const getSpouseOrPartner = useCallback((personId: string): Person | null => {
    const personRels = relationships.filter(
      (r) => r.personAId === personId || r.personBId === personId
    );
    const spouseRel = personRels.find((r) => {
      const type = r.personAId === personId ? r.type : r.reverseType || r.type;
      return type === "spouse" || type === "partner";
    });
    if (!spouseRel) return null;
    const spouseId = spouseRel.personAId === personId ? spouseRel.personBId : spouseRel.personAId;
    return people.find((p) => p.id === spouseId) || null;
  }, [relationships, people]);

  // Find siblings of a given person
  const getSiblings = useCallback((personId: string): Person[] => {
    const personRels = relationships.filter(
      (r) => r.personAId === personId || r.personBId === personId
    );
    return personRels
      .filter((r) => {
        const type = r.personAId === personId ? r.type : r.reverseType || r.type;
        return type === "sibling";
      })
      .map((r) => {
        const siblingId = r.personAId === personId ? r.personBId : r.personAId;
        return people.find((p) => p.id === siblingId);
      })
      .filter((p): p is Person => p !== undefined);
  }, [relationships, people]);

  // Check if a relationship already exists between two people
  const relationshipExists = useCallback((personAId: string, personBId: string): boolean => {
    return relationships.some(
      (r) =>
        (r.personAId === personAId && r.personBId === personBId) ||
        (r.personAId === personBId && r.personBId === personAId)
    );
  }, [relationships]);

  // Get the relationship type for spouse display
  const getSpouseRelType = useCallback((personId: string): "spouse" | "partner" => {
    const personRels = relationships.filter(
      (r) => r.personAId === personId || r.personBId === personId
    );
    const spouseRel = personRels.find((r) => {
      const type = r.personAId === personId ? r.type : r.reverseType || r.type;
      return type === "spouse" || type === "partner";
    });
    return spouseRel?.type === "spouse" || spouseRel?.reverseType === "spouse" ? "spouse" : "partner";
  }, [relationships]);

  // Combine user templates with mock templates
  const allTemplates = useMemo(() => {
    const templates: FormTemplate[] = [...formTemplates];
    // Add mock templates that aren't already in user templates
    MOCK_FORM_TEMPLATES.forEach((mock) => {
      if (!templates.find((t) => t.id === mock.id)) {
        templates.push(mock);
      }
    });
    return templates;
  }, [formTemplates]);

  const selectedTemplate = selectedTemplateId
    ? allTemplates.find((t) => t.id === selectedTemplateId)
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const nickname = formData.get("nickname") as string;
    const birthday = formData.get("birthday") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    // Validate first name
    if (!firstName.trim()) {
      toast.error("First name is required");
      setIsSubmitting(false);
      return;
    }

    // Validate email format
    if (email && !isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    // Validate phone format
    if (phone && !isValidPhone(phone)) {
      toast.error("Please enter a valid phone number");
      setIsSubmitting(false);
      return;
    }

    // Validate birthday
    const birthdayValidation = isValidBirthday(birthday);
    if (!birthdayValidation.valid) {
      toast.error(birthdayValidation.error);
      setIsSubmitting(false);
      return;
    }

    const personId = addPerson({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photo,
      nickname: nickname || undefined,
      birthday: birthday || undefined,
      email: email || undefined,
      phone: phone || undefined,
      notes: notes || undefined,
      tags,
      customFields: [],
    });

    // Add relationship if specified
    if (relatedTo && relationshipType) {
      addRelationship(personId, relatedTo, relationshipType);

      // Check for propagation options
      const propagationOptions: PropagationOption[] = [];
      const newPersonFullName = `${firstName.trim()}${lastName.trim() ? ` ${lastName.trim()}` : ""}`;

      // Check for spouse/partner propagation (from the "relatedTo" person's perspective)
      if (SPOUSE_PROPAGATABLE_TYPES.includes(relationshipType)) {
        const spouse = getSpouseOrPartner(relatedTo);
        if (spouse && !relationshipExists(spouse.id, personId)) {
          propagationOptions.push({
            personId: spouse.id,
            personName: `${spouse.firstName}${spouse.lastName ? ` ${spouse.lastName}` : ""}`,
            relationshipType: getSpouseRelType(relatedTo),
          });
        }
      }

      // Check for sibling propagation
      if (SIBLING_PROPAGATABLE_TYPES.includes(relationshipType)) {
        const siblings = getSiblings(relatedTo);
        for (const sibling of siblings) {
          if (!relationshipExists(sibling.id, personId)) {
            propagationOptions.push({
              personId: sibling.id,
              personName: `${sibling.firstName}${sibling.lastName ? ` ${sibling.lastName}` : ""}`,
              relationshipType: "sibling",
            });
          }
        }
      }

      // If there are propagation options, show the dialog
      if (propagationOptions.length > 0) {
        setPendingPropagation({
          newPersonId: personId,
          newPersonName: newPersonFullName,
          relationshipType,
          propagationOptions,
        });
        setSelectedPropagations(new Set(propagationOptions.map((o) => o.personId)));
        // Reset form but don't close dialog yet
        setIsSubmitting(false);
        setPhoto(undefined);
        setFirstName("");
        setLastName("");
        setRelatedTo("");
        setRelationshipType("");
        setSelectedTemplateId(null);
        onOpenChange(false);
        return;
      }
    }

    toast.success(`${firstName}${lastName ? ` ${lastName}` : ""} added!`);
    setIsSubmitting(false);
    setPhoto(undefined);
    setFirstName("");
    setLastName("");
    setRelatedTo("");
    setRelationshipType("");
    setSelectedTemplateId(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setPhoto(undefined);
    setFirstName("");
    setLastName("");
    setRelatedTo("");
    setRelationshipType("");
    setSelectedTemplateId(null);
    onOpenChange(false);
  };

  // Handle confirming propagation
  const handleConfirmPropagation = useCallback(() => {
    if (!pendingPropagation) return;

    const propagatedTo: string[] = [];
    for (const option of pendingPropagation.propagationOptions) {
      if (selectedPropagations.has(option.personId)) {
        addRelationship(option.personId, pendingPropagation.newPersonId, pendingPropagation.relationshipType);
        propagatedTo.push(option.personName);
      }
    }

    if (propagatedTo.length > 0) {
      toast.success(
        `${pendingPropagation.newPersonName} added as ${RELATIONSHIP_CONFIG[pendingPropagation.relationshipType].label} for ${propagatedTo.join(", ")} too!`
      );
    } else {
      toast.success(`${pendingPropagation.newPersonName} added!`);
    }

    setPendingPropagation(null);
    setSelectedPropagations(new Set());
  }, [pendingPropagation, selectedPropagations, addRelationship]);

  // Handle skipping propagation
  const handleSkipPropagation = useCallback(() => {
    if (pendingPropagation) {
      toast.success(`${pendingPropagation.newPersonName} added!`);
    }
    setPendingPropagation(null);
    setSelectedPropagations(new Set());
  }, [pendingPropagation]);

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add Person
            </DialogTitle>
            <DialogDescription>
              Add a new family member or friend. Only first name is required.
            </DialogDescription>
          </DialogHeader>

          {/* Template Selector */}
          {allTemplates.length > 0 && (
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Use Template</span>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <Select
                value={selectedTemplateId || "none"}
                onValueChange={(v) => setSelectedTemplateId(v === "none" ? null : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No template</span>
                  </SelectItem>
                  {allTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {template.fields.length} fields
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="mt-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </div>
                  <p>{selectedTemplate.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTemplate.fields.map((field) => (
                      <Badge key={field.id} variant="secondary" className="text-[10px]">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6 py-6">
            {/* Name Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <PhotoUpload
                  value={photo}
                  onChange={setPhoto}
                  initials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"}
                  size="md"
                />
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoFocus
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      name="nickname"
                      placeholder="How you call them"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Relationship Section */}
            {people.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4" />
                    Relationship (optional)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="relatedTo">Related to</Label>
                      <Select value={relatedTo} onValueChange={setRelatedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person..." />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {getDisplayName(person.firstName, person.lastName)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <RelationshipSelector
                        value={relationshipType || undefined}
                        onValueChange={(v) => setRelationshipType(v)}
                        placeholder="Select type..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

            {/* Details Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4" />
                Details (optional)
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input id="birthday" name="birthday" type="date" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="family, friend, work (comma separated)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any notes about this person..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

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
                You added <strong>{pendingPropagation?.newPersonName}</strong> as{" "}
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
                        ({option.relationshipType})
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
    </>
  );
}
