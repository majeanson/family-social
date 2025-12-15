"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { usePrimaryUser } from "@/features/use-primary-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Crown, ArrowRight, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { addPerson, people } = useDataStore();
  const { setAsMe, hasSetupMe } = usePrimaryUser();

  const [step, setStep] = useState<"welcome" | "create" | "select">("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [birthday, setBirthday] = useState("");

  // If already set up, redirect to home
  if (hasSetupMe) {
    router.replace("/");
    return null;
  }

  const handleCreateMe = () => {
    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    const personId = addPerson({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      photo,
      birthday: birthday || undefined,
      customFields: [],
      tags: [],
    });

    setAsMe(personId);
    toast.success("Welcome! You've been set up as the primary user.");
    router.push("/");
  };

  const handleSelectExisting = (personId: string) => {
    setAsMe(personId);
    toast.success("You've been set as the primary user!");
    router.push("/");
  };

  const handleSkip = () => {
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      {step === "welcome" && (
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Family Social</CardTitle>
            <CardDescription className="text-base">
              Let&apos;s set up your profile so relationships can be viewed from your perspective.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setStep("create")}
              >
                <CardContent className="pt-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold">Create My Profile</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up a new profile for yourself
                  </p>
                </CardContent>
              </Card>

              {people.length > 0 && (
                <Card
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setStep("select")}
                >
                  <CardContent className="pt-6 text-center">
                    <Users className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <h3 className="font-semibold">Select Existing</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose from {people.length} existing people
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="text-center">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "create" && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Create Your Profile
            </CardTitle>
            <CardDescription>
              Enter your information. You&apos;ll be the center of your relationship network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <PhotoUpload
                value={photo}
                onChange={setPhoto}
                initials={getInitials(firstName || "?", lastName)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Your first name"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Your last name"
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Back
              </Button>
              <Button onClick={handleCreateMe} className="flex-1 gap-2">
                Create & Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "select" && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Select Yourself
            </CardTitle>
            <CardDescription>
              Choose which person is you from the existing list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {people.map((person) => (
                <Card
                  key={person.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectExisting(person.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        {person.photo && (
                          <AvatarImage src={person.photo} alt={person.firstName} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(person.firstName, person.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {person.firstName} {person.lastName}
                        </p>
                        {person.nickname && (
                          <p className="text-sm text-muted-foreground">
                            &quot;{person.nickname}&quot;
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("welcome")}>
                Back
              </Button>
              <Button variant="outline" onClick={() => setStep("create")} className="flex-1">
                Create New Instead
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
