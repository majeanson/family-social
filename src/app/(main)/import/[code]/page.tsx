"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ArrowRight,
  Calendar,
  Mail,
  Phone,
  StickyNote,
  Clock,
  Loader2,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface ShareData {
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  photo?: string;
  notes?: string;
  createdAt: string;
  expiresAt: string;
}

export default function ImportCodePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { addPerson, people } = useDataStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personData, setPersonData] = useState<ShareData | null>(null);
  const [imported, setImported] = useState(false);
  const [existingPerson, setExistingPerson] = useState<string | null>(null);

  // Fetch share data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/share/${code}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Link not found or expired");
          return;
        }
        const data = await res.json();
        setPersonData(data);
      } catch {
        setError("Failed to load share data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [code]);

  // Check for existing person
  useEffect(() => {
    if (personData) {
      const existing = people.find(
        (p) =>
          p.firstName.toLowerCase() === personData.firstName.toLowerCase() &&
          p.lastName?.toLowerCase() === personData.lastName?.toLowerCase()
      );
      if (existing) {
        setExistingPerson(existing.id);
      }
    }
  }, [personData, people]);

  const handleImport = () => {
    if (!personData) return;

    addPerson({
      firstName: personData.firstName,
      lastName: personData.lastName || "",
      nickname: personData.nickname,
      email: personData.email,
      phone: personData.phone,
      birthday: personData.birthday,
      photo: personData.photo,
      notes: personData.notes,
      tags: [],
      customFields: [],
    });

    setImported(true);
    toast.success(`${personData.firstName} has been added!`);
  };

  const handleViewPeople = () => {
    router.push("/");
  };

  const handleViewPerson = (id: string) => {
    router.push(`/person/${id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading contact info...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !personData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Link Expired or Invalid</CardTitle>
            <CardDescription>
              {error || "This share link is no longer available. Please ask for a new link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={handleViewPeople}>
              Go to People
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (imported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-green-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Added Successfully!</CardTitle>
            <CardDescription>
              {personData.firstName} {personData.lastName} has been added to your people.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={handleViewPeople}>
              View All People
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = getInitials(personData.firstName, personData.lastName || "");
  const expiresAt = new Date(personData.expiresAt);
  const timeLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Add Contact</h1>
          <p className="text-muted-foreground">
            Someone shared their info with you
          </p>
        </div>

        {/* Expiry notice */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            Link expires in {timeLeft > 24 ? `${Math.ceil(timeLeft / 24)} days` : `${timeLeft} hours`}
          </span>
        </div>

        {/* Duplicate Warning */}
        {existingPerson && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> {personData.firstName}{personData.lastName ? ` ${personData.lastName}` : ""} already exists.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleViewPerson(existingPerson)}
            >
              View Existing
            </Button>
          </div>
        )}

        {/* Person Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {personData.photo && (
                  <AvatarImage src={personData.photo} alt={personData.firstName} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {personData.firstName} {personData.lastName}
                </CardTitle>
                {personData.nickname && (
                  <CardDescription>&quot;{personData.nickname}&quot;</CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {personData.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{personData.email}</span>
              </div>
            )}
            {personData.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{personData.phone}</span>
              </div>
            )}
            {personData.birthday && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{personData.birthday}</span>
              </div>
            )}
            {personData.notes && (
              <div className="flex items-start gap-3 text-sm">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">{personData.notes}</span>
              </div>
            )}

            {!personData.email && !personData.phone && !personData.birthday && !personData.notes && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No additional details provided
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={handleImport}>
            <UserPlus className="h-5 w-5 mr-2" />
            Add to My People
          </Button>
          <Button variant="outline" className="w-full" onClick={handleViewPeople}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
