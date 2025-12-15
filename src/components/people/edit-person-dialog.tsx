"use client";

import { useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";
import type { Person } from "@/types";
import { RelationshipSelector } from "@/components/relationships";
import { RELATIONSHIP_CONFIG, type RelationshipType } from "@/types";

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
  const {
    updatePerson,
    deletePerson,
    people,
    relationships,
    addRelationship,
    deleteRelationship,
  } = useDataStore();

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

  // Relationship state
  const [newRelationshipPersonId, setNewRelationshipPersonId] = useState("");
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>("friend");

  // Get person's relationships
  const personRelationships = relationships.filter(
    (r) => r.personAId === person.id || r.personBId === person.id
  );

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    updatePerson(person.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || undefined,
      photo,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      birthday: birthday || undefined,
      notes: notes.trim() || undefined,
      tags,
    });

    toast.success(`${firstName} updated successfully`);
    onClose();
  }, [firstName, lastName, nickname, photo, email, phone, birthday, notes, tags, person.id, updatePerson, onClose]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Are you sure you want to delete ${person.firstName}? This will also remove all their relationships.`)) {
      deletePerson(person.id);
      toast.success(`${person.firstName} has been removed`);
      onClose();
    }
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

    addRelationship(person.id, newRelationshipPersonId, newRelationshipType);
    const relatedPerson = people.find((p) => p.id === newRelationshipPersonId);
    toast.success(`Added ${RELATIONSHIP_CONFIG[newRelationshipType].label} relationship with ${relatedPerson?.firstName}`);
    setNewRelationshipPersonId("");
  }, [person.id, newRelationshipPersonId, newRelationshipType, personRelationships, addRelationship, people]);

  const handleDeleteRelationship = useCallback((relationshipId: string) => {
    deleteRelationship(relationshipId);
    toast.success("Relationship removed");
  }, [deleteRelationship]);

  // Get available people for new relationship (excluding self and already connected)
  const availablePeople = people.filter((p) => {
    if (p.id === person.id) return false;
    return !personRelationships.some(
      (r) =>
        (r.personAId === person.id && r.personBId === p.id) ||
        (r.personAId === p.id && r.personBId === person.id)
    );
  });

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
          <div className="flex items-start gap-4">
            <PhotoUpload
              value={photo}
              onChange={setPhoto}
              initials={`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?"}
              size="lg"
            />
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="grid gap-4 sm:grid-cols-2">
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
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 rounded-full ${config?.color || "bg-gray-400"}`}
                      />
                      <div>
                        <span className="font-medium">
                          {relatedPerson.firstName} {relatedPerson.lastName}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({config?.label || relationType})
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRelationship(rel.id)}
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
            <div className="flex gap-2">
              <select
                value={newRelationshipPersonId}
                onChange={(e) => setNewRelationshipPersonId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select person...</option>
                {availablePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
              <div className="w-40">
                <RelationshipSelector
                  value={newRelationshipType}
                  onChange={setNewRelationshipType}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddRelationship}
                disabled={!newRelationshipPersonId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {availablePeople.length === 0 && personRelationships.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add more people to create relationships
            </p>
          )}
        </div>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
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
    </>
  );
}
