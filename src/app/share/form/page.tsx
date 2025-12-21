"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeFormTemplate } from "@/lib/form-encoding";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/ui/photo-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  FileText,
  AlertCircle,
  Copy,
  Share2,
  ArrowLeft,
  Clock,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";

function ShareFormContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const template = data ? decodeFormTemplate(data) : null;

  const [step, setStep] = useState<"form" | "creating" | "done">("form");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [expiry, setExpiry] = useState("24h");
  const [shareLink, setShareLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showMissingWarning, setShowMissingWarning] = useState(false);

  const canNativeShare = typeof window !== "undefined" && !!navigator?.share;

  // Check which required fields are missing
  const getMissingRequiredFields = (): string[] => {
    if (!template) return [];
    return template.fields
      .filter((f) => f.required && !formData[f.fieldKey]?.trim())
      .map((f) => f.label);
  };

  const handleSubmit = async (e: React.FormEvent, skipValidation = false) => {
    e.preventDefault();

    // Check for missing fields
    const missing = getMissingRequiredFields();
    if (missing.length > 0 && !skipValidation) {
      setMissingFields(missing);
      setShowMissingWarning(true);
      return;
    }

    setShowMissingWarning(false);
    setStep("creating");

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            firstName: formData["firstName"] || "",
            lastName: formData["lastName"],
            nickname: formData["nickname"],
            email: formData["email"],
            phone: formData["phone"],
            birthday: formData["birthday"],
            photo: formData["photo"],
            notes: formData["notes"],
          },
          expiry,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const result = await response.json();
      const fullUrl = `${window.location.origin}${result.url}`;
      setShareLink(fullUrl);
      setExpiresAt(result.expiresAt);
      setStep("done");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create share link. Please try again.");
      setStep("form");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied!");
  };

  const handleShare = async () => {
    try {
      await navigator.share({ url: shareLink });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        handleCopyLink();
      }
    }
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const getExpiryLabel = () => {
    const date = new Date(expiresAt);
    const now = new Date();
    const hours = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours <= 1) return "1 hour";
    if (hours <= 24) return "24 hours";
    return `${Math.ceil(hours / 24)} days`;
  };

  // Invalid template
  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Form Link</CardTitle>
            <CardDescription>
              This form link is invalid or expired. Please ask for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Creating link
  if (step === "creating") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Creating your share link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Link created - show it
  if (step === "done") {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <Toaster />
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-fit rounded-full bg-green-500/10 p-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Ready to Share!</h1>
            <p className="text-muted-foreground">
              Send this link to share your contact info
            </p>
          </div>

          {/* Link Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Expires in {getExpiryLabel()}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link display */}
              <div className="bg-muted rounded-lg p-4 break-all font-mono text-sm">
                {shareLink}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                {canNativeShare && (
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                When they click this link, they can add your info with one tap.
              </p>
            </CardContent>
          </Card>

          {/* Create another */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setStep("form");
              setShareLink("");
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Edit & Create New Link
          </Button>
        </div>
      </div>
    );
  }

  // Form step
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Toaster />
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-fit rounded-full bg-primary/10 p-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.description && (
            <p className="text-muted-foreground">{template.description}</p>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Fill out the form below. We&apos;ll create a temporary link you can share.
              The recipient can add your info with one click.
            </p>
          </div>
        </div>

        {/* Missing Fields Warning */}
        {showMissingWarning && missingFields.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  Some fields are empty
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Missing: {missingFields.join(", ")}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700"
                    onClick={() => setShowMissingWarning(false)}
                  >
                    Go Back & Fill
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => handleSubmit(e, true)}
                  >
                    Skip & Continue Anyway
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
            <CardDescription>
              Fields marked with <span className="text-destructive">*</span> are recommended
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              {template.fields
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.fieldKey}>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.fieldKey}
                        value={formData[field.fieldKey] || ""}
                        onChange={(e) =>
                          handleInputChange(field.fieldKey, e.target.value)
                        }
                        placeholder={`Enter your ${field.label.toLowerCase()}`}
                        rows={3}
                      />
                    ) : field.type === "photo" ? (
                      <PhotoUpload
                        value={formData[field.fieldKey] || undefined}
                        onChange={(value) =>
                          handleInputChange(field.fieldKey, value || "")
                        }
                        size="md"
                      />
                    ) : (
                      <Input
                        id={field.fieldKey}
                        type={
                          field.type === "email"
                            ? "email"
                            : field.type === "phone"
                            ? "tel"
                            : field.type === "date"
                            ? "date"
                            : "text"
                        }
                        value={formData[field.fieldKey] || ""}
                        onChange={(e) =>
                          handleInputChange(field.fieldKey, e.target.value)
                        }
                        placeholder={
                          field.type === "date"
                            ? undefined
                            : `Enter your ${field.label.toLowerCase()}`
                        }
                      />
                    )}
                  </div>
                ))}

              {/* Expiry selection */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="expiry">Link expires after</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="24h">24 hours</SelectItem>
                    <SelectItem value="7d">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Share Link
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted-foreground">
          Your data is stored temporarily and automatically deleted after expiry.
        </p>
      </div>
    </div>
  );
}

export default function ShareFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading form...</div>
        </div>
      }
    >
      <ShareFormContent />
    </Suspense>
  );
}
