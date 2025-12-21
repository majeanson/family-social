"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  Mail,
  Phone,
  Calendar,
  StickyNote,
  Image,
  Clock,
} from "lucide-react";
import type { Person } from "@/types";

interface SharePersonDialogProps {
  person: Person;
  trigger?: React.ReactNode;
}

const EXPIRY_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export function SharePersonDialog({ person, trigger }: SharePersonDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Privacy controls - what to include
  const [includeEmail, setIncludeEmail] = useState(!!person.email);
  const [includePhone, setIncludePhone] = useState(!!person.phone);
  const [includeBirthday, setIncludeBirthday] = useState(!!person.birthday);
  const [includePhoto, setIncludePhoto] = useState(!!person.photo);
  const [includeNotes, setIncludeNotes] = useState(false); // Off by default for privacy

  const [expiry, setExpiry] = useState("24h");

  const handleShare = async () => {
    setLoading(true);
    try {
      const shareData = {
        firstName: person.firstName,
        lastName: person.lastName || undefined,
        nickname: person.nickname || undefined,
        email: includeEmail ? person.email : undefined,
        phone: includePhone ? person.phone : undefined,
        birthday: includeBirthday ? person.birthday : undefined,
        photo: includePhoto ? person.photo : undefined,
        notes: includeNotes ? person.notes : undefined,
      };

      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: shareData, expiry }),
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
      // Fallback for browsers that don't support clipboard API
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
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setShareUrl(null);
      setCopied(false);
    }
  };

  const hasAnyOptionalData = person.email || person.phone || person.birthday || person.photo || person.notes;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Contact Info</DialogTitle>
          <DialogDescription>
            Create a temporary link to share {person.firstName}&apos;s contact information.
            The recipient can add this person to their contacts.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-6 py-4">
            {/* What to include */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Include in share</Label>

              <div className="space-y-3">
                {/* Always included */}
                <div className="flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Name</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Always included</span>
                </div>

                {person.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={includeEmail}
                      onCheckedChange={setIncludeEmail}
                    />
                  </div>
                )}

                {person.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Phone</span>
                    </div>
                    <Switch
                      checked={includePhone}
                      onCheckedChange={setIncludePhone}
                    />
                  </div>
                )}

                {person.birthday && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Birthday</span>
                    </div>
                    <Switch
                      checked={includeBirthday}
                      onCheckedChange={setIncludeBirthday}
                    />
                  </div>
                )}

                {person.photo && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Photo</span>
                    </div>
                    <Switch
                      checked={includePhoto}
                      onCheckedChange={setIncludePhoto}
                    />
                  </div>
                )}

                {person.notes && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Notes</span>
                    </div>
                    <Switch
                      checked={includeNotes}
                      onCheckedChange={setIncludeNotes}
                    />
                  </div>
                )}

                {!hasAnyOptionalData && (
                  <p className="text-sm text-muted-foreground">
                    Only the name will be shared. Add more info to share additional details.
                  </p>
                )}
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
                Anyone with this link can add {person.firstName} to their contacts.
                The link will expire based on your selection.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!shareUrl ? (
            <Button onClick={handleShare} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
