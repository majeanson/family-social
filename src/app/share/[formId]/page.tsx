"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { get } from "idb-keyval";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { FormTemplate, DataStore } from "@/types";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";

export default function ShareFormPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTemplate() {
      try {
        // Try to load from IndexedDB (for browser storage users)
        const data = await get<DataStore>("family-data");
        if (data?.formTemplates) {
          const found = data.formTemplates.find((t) => t.id === formId);
          if (found) {
            setTemplate(found);
          }
        }
      } catch (error) {
        console.error("Error loading form template:", error);
      }
      setIsLoading(false);
    }
    loadTemplate();
  }, [formId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real app, this would send the data somewhere
    // For now, we'll just copy it to clipboard
    const submittedData = {
      formId,
      formName: template?.name,
      submittedAt: new Date().toISOString(),
      data: formData,
    };

    navigator.clipboard.writeText(JSON.stringify(submittedData, null, 2));
    toast.success("Form data copied to clipboard!");
    setIsSubmitted(true);
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading form...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              This form link may be invalid or the form may have been deleted.
              Please ask for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Toaster />
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 rounded-full bg-green-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              Your information has been submitted. The form data has been copied
              to your clipboard - please share it with the person who sent you this form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setFormData({});
              }}
            >
              Submit Another Response
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Information</CardTitle>
            <CardDescription>
              Please fill out the fields below. Fields marked with * are required.
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
                        rows={3}
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
                      />
                    )}
                  </div>
                ))}

              <Button type="submit" className="w-full" size="lg">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Powered by Family Social
        </p>
      </div>
    </div>
  );
}
