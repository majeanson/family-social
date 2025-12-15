"use client";

import { useState, useMemo } from "react";
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
import { isValidEmail, isValidBirthday } from "@/lib/utils";
import type { RelationshipType, FormTemplate } from "@/types";
import { MOCK_FORM_TEMPLATES } from "@/lib/mock-data";
import { User, Link2, Info, FileText, Sparkles } from "lucide-react";

interface QuickAddPersonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddPerson({ open, onOpenChange }: QuickAddPersonProps) {
  const { addPerson, addRelationship, people, formTemplates } = useDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relatedTo, setRelatedTo] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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

    // Validate email format
    if (email && !isValidEmail(email)) {
      toast.error("Please enter a valid email address");
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

  return (
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
              <div className="flex items-start gap-4">
                <PhotoUpload
                  value={photo}
                  onChange={setPhoto}
                  initials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"}
                  size="md"
                />
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="relatedTo">Related to</Label>
                      <Select value={relatedTo} onValueChange={setRelatedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select person..." />
                        </SelectTrigger>
                        <SelectContent>
                          {people.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.firstName} {person.lastName}
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

              <div className="grid grid-cols-2 gap-4">
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
  );
}
