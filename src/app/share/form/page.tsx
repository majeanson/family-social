"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { decodeFormTemplate, generateImportUrl, type PersonResponseData } from "@/lib/form-encoding";
import { sanitizeFilename } from "@/lib/utils";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  CheckCircle2,
  FileText,
  AlertCircle,
  Copy,
  Download,
  Share2,
  MessageCircle,
  ArrowLeft,
  Mail,
  Link,
  Sparkles,
} from "lucide-react";

function ShareFormContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get("data");
  const template = data ? decodeFormTemplate(data) : null;
  const [step, setStep] = useState<"form" | "preview" | "done">("form");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const canNativeShare = typeof window !== "undefined" && !!navigator?.share;

  const formatAsText = () => {
    if (!template) return "";

    const lines = [
      `📋 ${template.name}`,
      `Submitted: ${new Date().toLocaleDateString()}`,
      "",
      "---",
      "",
    ];

    template.fields
      .sort((a, b) => a.order - b.order)
      .forEach((field) => {
        const value = formData[field.fieldKey] || "(not provided)";
        lines.push(`${field.label}: ${value}`);
      });

    lines.push("");
    lines.push("---");
    lines.push("Sent via Family Social");

    return lines.join("\n");
  };

  const formatAsJSON = () => {
    return JSON.stringify(
      {
        formName: template?.name,
        submittedAt: new Date().toISOString(),
        responses: template?.fields
          .sort((a, b) => a.order - b.order)
          .reduce((acc, field) => {
            acc[field.label] = formData[field.fieldKey] || null;
            return acc;
          }, {} as Record<string, string | null>),
      },
      null,
      2
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("preview");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formatAsText());
    toast.success("Copied! Now paste this in a message to send it back.");
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(formatAsJSON());
    toast.success("JSON copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([formatAsJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = sanitizeFilename(formData["firstName"] || "response");
    a.href = url;
    a.download = `family-info-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded! Send this file back to who requested it.");
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${template?.name} - Response`,
        text: formatAsText(),
      });
      setStep("done");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Sharing failed. Try copying instead.");
      }
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${template?.name} - My Information`);
    const body = encodeURIComponent(formatAsText());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const getImportLink = () => {
    const personData: PersonResponseData = {
      firstName: formData["firstName"] || "",
      lastName: formData["lastName"],
      nickname: formData["nickname"],
      email: formData["email"],
      phone: formData["phone"],
      birthday: formData["birthday"],
      notes: formData["notes"],
    };
    return generateImportUrl(personData);
  };

  const handleCopyImportLink = () => {
    const link = getImportLink();
    navigator.clipboard.writeText(link);
    toast.success("Import link copied! Send this link back and they can add you with one click.");
  };

  const handleShareImportLink = async () => {
    const link = getImportLink();
    try {
      await navigator.share({
        title: "Add me to your contacts",
        text: `Click this link to add my info: ${link}`,
        url: link,
      });
      setStep("done");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        // Fall back to copying
        handleCopyImportLink();
      }
    }
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

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
              This form link appears to be invalid or corrupted.
              Please ask for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success/Done step
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-green-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>All Done!</CardTitle>
            <CardDescription>
              Your information has been shared. Thank you for taking the time to fill this out!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => setStep("preview")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Share Another Way
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("form");
                setFormData({});
              }}
            >
              Fill Out Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview/Share step
  if (step === "preview") {
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
              Choose how you&apos;d like to send your information back
            </p>
          </div>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
              <CardDescription>Review before sharing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2 font-mono">
                {template.fields
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{field.label}:</span>
                      <span className="text-right font-medium">
                        {formData[field.fieldKey] || "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send It Back</CardTitle>
              <CardDescription>
                Pick the easiest way for you to share this with whoever sent you the form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Recommended: Import Link */}
              <div className="relative">
                <div className="absolute -top-2 left-3 px-2 bg-card">
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Recommended
                  </span>
                </div>
                <Button
                  className="w-full h-auto py-4 border-2 border-primary"
                  variant="outline"
                  onClick={canNativeShare ? handleShareImportLink : handleCopyImportLink}
                >
                  <div className="flex items-center gap-3">
                    <Link className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <div className="font-semibold">Send Quick-Add Link</div>
                      <div className="text-xs opacity-80">
                        One click adds you to their contacts
                      </div>
                    </div>
                  </div>
                </Button>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground text-center">
                Other ways to share
              </p>

              {/* Secondary: Native Share or Copy Text */}
              {canNativeShare ? (
                <Button
                  className="w-full h-auto py-3"
                  variant="outline"
                  onClick={handleNativeShare}
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Share as Text</div>
                      <div className="text-xs opacity-80">
                        Message, WhatsApp, Email, etc.
                      </div>
                    </div>
                  </div>
                </Button>
              ) : (
                <Button
                  className="w-full h-auto py-3"
                  variant="outline"
                  onClick={() => {
                    handleCopyText();
                    setStep("done");
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Copy & Send in a Message</div>
                      <div className="text-xs opacity-80">
                        Paste into any chat or message app
                      </div>
                    </div>
                  </div>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-3"
                  onClick={handleCopyText}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  <span className="text-sm">Copy Text</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3"
                  onClick={handleEmailShare}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm">Email</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="text-sm">Download</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-3"
                  onClick={handleCopyJSON}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="text-sm">Copy JSON</span>
                </Button>
              </div>

              <Separator />

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("form")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back & Edit
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Your data is not stored anywhere — it&apos;s only shared when you choose to send it.
          </p>
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
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>How this works:</strong> Fill out the form below, then you&apos;ll get
            easy options to send your info back via message, email, or however you prefer.
            No account needed!
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
            <CardDescription>
              Fields marked with <span className="text-destructive">*</span> are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        required={field.required}
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
                        required={field.required}
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

              <Button type="submit" className="w-full" size="lg">
                Continue to Share
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted-foreground">
          🔒 Your data stays on your device until you choose to share it
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
