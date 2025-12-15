"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { RelationshipSelector } from "@/components/relationships";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { RelationshipType } from "@/types";
import { User, Link2, Info } from "lucide-react";

interface QuickAddPersonProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddPerson({ open, onOpenChange }: QuickAddPersonProps) {
  const { addPerson, addRelationship, people } = useDataStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relatedTo, setRelatedTo] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = (formData.get("lastName") as string) || "";
    const nickname = formData.get("nickname") as string;
    const birthday = formData.get("birthday") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const tagsInput = formData.get("tags") as string;
    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const personId = addPerson({
      firstName,
      lastName,
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
    setRelatedTo("");
    setRelationshipType("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setRelatedTo("");
    setRelationshipType("");
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

          <div className="space-y-6 py-6">
            {/* Name Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
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
