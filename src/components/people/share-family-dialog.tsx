"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Loader2,
  Clock,
  Users,
  Link2,
  Image,
} from "lucide-react";
import { useDataStore } from "@/stores/data-store";
import { getInitials, getDisplayName } from "@/lib/utils";
import { v4 as uuid } from "uuid";

interface ShareFamilyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPeopleIds: string[];
  familyName?: string;
}

const EXPIRY_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export function ShareFamilyDialog({
  open,
  onOpenChange,
  selectedPeopleIds,
  familyName,
}: ShareFamilyDialogProps) {
  const { people, relationships, settings } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiry, setExpiry] = useState("24h");
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeRelationships, setIncludeRelationships] = useState(true);

  // Get selected people
  const selectedPeople = useMemo(() => {
    return people.filter((p) => selectedPeopleIds.includes(p.id));
  }, [people, selectedPeopleIds]);

  // Get relationships between selected people
  const relevantRelationships = useMemo(() => {
    if (!includeRelationships) return [];
    return relationships.filter(
      (r) =>
        selectedPeopleIds.includes(r.personAId) &&
        selectedPeopleIds.includes(r.personBId)
    );
  }, [relationships, selectedPeopleIds, includeRelationships]);

  // Get primary user name for "shared by"
  const primaryUser = useMemo(() => {
    if (!settings.primaryUserId) return undefined;
    const user = people.find((p) => p.id === settings.primaryUserId);
    return user ? getDisplayName(user.firstName, user.lastName) : undefined;
  }, [settings.primaryUserId, people]);

  const handleShare = async () => {
    if (selectedPeople.length === 0) {
      toast.error("No people selected to share");
      return;
    }

    setLoading(true);
    try {
      // Create temp ID mapping for relationships
      const idMap = new Map<string, string>();
      selectedPeople.forEach((person) => {
        idMap.set(person.id, uuid());
      });

      // Prepare people data with temp IDs
      const sharedPeople = selectedPeople.map((person) => ({
        tempId: idMap.get(person.id)!,
        firstName: person.firstName,
        lastName: person.lastName || undefined,
        nickname: person.nickname || undefined,
        email: person.email || undefined,
        phone: person.phone || undefined,
        birthday: person.birthday || undefined,
        photo: includePhotos ? person.photo : undefined,
        notes: person.notes || undefined,
        tags: person.tags.length > 0 ? person.tags : undefined,
        customFields: person.customFields.length > 0 ? person.customFields : undefined,
      }));

      // Prepare relationships with temp IDs
      const sharedRelationships = relevantRelationships.map((rel) => ({
        personATempId: idMap.get(rel.personAId)!,
        personBTempId: idMap.get(rel.personBId)!,
        type: rel.type,
        reverseType: rel.reverseType,
        label: rel.label,
      }));

      const res = await fetch("/api/share/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          people: sharedPeople,
          relationships: sharedRelationships,
          familyName: familyName || `${selectedPeople.length} people`,
          expiry,
          sharedBy: primaryUser,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create share link");
      }

      const { url } = await res.json();
      const fullUrl = `${window.location.origin}${url}`;
      setShareUrl(fullUrl);
      toast.success("Share link created!");
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setShareUrl(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share {selectedPeople.length} {selectedPeople.length === 1 ? "Person" : "People"}
          </DialogTitle>
          <DialogDescription>
            Create a temporary link to share these contacts. Recipients can import them all at once.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-6 py-4">
            {/* People being shared */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">People to share</Label>
              <ScrollArea className="h-[150px] rounded-md border p-3">
                <div className="space-y-2">
                  {selectedPeople.map((person) => (
                    <div key={person.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {person.photo && <AvatarImage src={person.photo} />}
                        <AvatarFallback className="text-xs">
                          {getInitials(person.firstName, person.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getDisplayName(person.firstName, person.lastName)}
                        </p>
                        {person.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {person.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Include in share</Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Photos</span>
                  </div>
                  <Switch
                    checked={includePhotos}
                    onCheckedChange={setIncludePhotos}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Relationships ({relevantRelationships.length})
                    </span>
                  </div>
                  <Switch
                    checked={includeRelationships}
                    onCheckedChange={setIncludeRelationships}
                  />
                </div>
              </div>
            </div>

            {/* Link expiry */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Link expires after
              </Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Share link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can import these {selectedPeople.length} people
                {includeRelationships && relevantRelationships.length > 0
                  ? ` and ${relevantRelationships.length} relationships`
                  : ""}.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
