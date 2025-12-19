"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ArrowRight,
  Calendar,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

// Simple query param based person data
interface PersonData {
  firstName: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  notes?: string;
}

function parsePersonFromParams(params: URLSearchParams): PersonData | null {
  const firstName = params.get("f") || params.get("firstName");
  if (!firstName) return null;

  return {
    firstName,
    lastName: params.get("l") || params.get("lastName") || undefined,
    nickname: params.get("n") || params.get("nickname") || undefined,
    email: params.get("e") || params.get("email") || undefined,
    phone: params.get("p") || params.get("phone") || undefined,
    birthday: params.get("b") || params.get("birthday") || undefined,
    notes: params.get("o") || params.get("notes") || undefined,
  };
}

function ImportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addPerson, people } = useDataStore();

  // Parse person data from URL params (simple approach)
  const personData = parsePersonFromParams(searchParams);

  const [imported, setImported] = useState(false);
  const [existingPerson, setExistingPerson] = useState<string | null>(null);

  // Check if person already exists
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
      notes: personData.notes,
      tags: [],
      customFields: [],
    });

    setImported(true);
    toast.success(`${personData.firstName} has been added to your people!`);
  };

  const handleViewPeople = () => {
    router.push("/");
  };

  const handleViewPerson = (id: string) => {
    router.push(`/person/${id}`);
  };

  if (!personData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Import Link</CardTitle>
            <CardDescription>
              This link is missing required information (first name).
              Please ask for a new link.
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

  if (imported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
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

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster />
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 mb-4">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Add New Person</h1>
          <p className="text-muted-foreground">
            Someone shared their contact info with you
          </p>
        </div>

        {/* Duplicate Warning */}
        {existingPerson && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Note:</strong> A person named {personData.firstName} {personData.lastName} already exists.
              You can still add this as a new person if needed.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleViewPerson(existingPerson)}
            >
              View Existing Person
            </Button>
          </div>
        )}

        {/* Person Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
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

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted-foreground">
          This person will be added to your local data only
        </p>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ImportContent />
    </Suspense>
  );
}
