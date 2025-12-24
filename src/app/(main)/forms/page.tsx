"use client";

import { useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DEFAULT_FORM_FIELDS, type FormField, type FormTemplate } from "@/types";
import { generateShareableUrl } from "@/lib/form-encoding";
import { MOCK_FORM_TEMPLATES } from "@/lib/mock-data";
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  UserPlus,
  LayoutTemplate,
} from "lucide-react";
import { v4 as uuid } from "uuid";

// New Person template - for adding a new family member
const NEW_PERSON_TEMPLATE: FormTemplate = {
  id: "template-new-person",
  name: "New Person",
  description: "Collect all the essential information for a new family member",
  fields: [
    { id: "f1", fieldKey: "firstName", label: "First Name", required: true, order: 0, type: "text" },
    { id: "f2", fieldKey: "lastName", label: "Last Name", required: false, order: 1, type: "text" },
    { id: "f3", fieldKey: "nickname", label: "Nickname", required: false, order: 2, type: "text" },
    { id: "f4", fieldKey: "birthday", label: "Birthday", required: false, order: 3, type: "date" },
    { id: "f5", fieldKey: "email", label: "Email", required: false, order: 4, type: "email" },
    { id: "f6", fieldKey: "phone", label: "Phone", required: false, order: 5, type: "phone" },
    { id: "f7", fieldKey: "photo", label: "Photo", required: false, order: 6, type: "photo" },
    { id: "f8", fieldKey: "notes", label: "Notes", required: false, order: 7, type: "textarea" },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// All preset templates (New Person first, then mock templates)
const PRESET_TEMPLATES: FormTemplate[] = [NEW_PERSON_TEMPLATE, ...MOCK_FORM_TEMPLATES];

export default function FormsPage() {
  const { formTemplates, addFormTemplate, deleteFormTemplate } = useDataStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormDescription, setNewFormDescription] = useState("");
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "firstName",
    "lastName",
  ]);

  const handleCreateForm = () => {
    if (!newFormName.trim()) {
      toast.error("Please enter a form name");
      return;
    }

    const fields: FormField[] = selectedFields.map((fieldKey, index) => {
      const defaultField = DEFAULT_FORM_FIELDS.find((f) => f.fieldKey === fieldKey);
      return {
        id: uuid(),
        fieldKey,
        label: defaultField?.label || fieldKey,
        required: fieldKey === "firstName",
        order: index,
        type: defaultField?.type || "text",
      };
    });

    addFormTemplate(newFormName, fields, newFormDescription || undefined);
    toast.success("Form template created!");
    setShowCreate(false);
    setNewFormName("");
    setNewFormDescription("");
    setSelectedFields(["firstName", "lastName"]);
  };

  const toggleField = (fieldKey: string) => {
    if (fieldKey === "firstName") return; // Always required
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const copyShareLink = async (template: FormTemplate) => {
    const url = generateShareableUrl(template, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Anyone with this link can fill out the form.");
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied!");
    }
  };

  const openPreview = (template: FormTemplate) => {
    const url = generateShareableUrl(template, window.location.origin);
    window.open(url, "_blank");
  };

  const handleDelete = (id: string) => {
    deleteFormTemplate(id);
    toast.success("Form template deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create shareable forms to collect family member information
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* My Templates Section */}
      {formTemplates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">My Templates</h2>
            <Badge variant="secondary">{formTemplates.length}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">{template.fields.length} fields</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Fields preview */}
                  <div className="flex flex-wrap gap-1">
                    {template.fields.slice(0, 5).map((field) => (
                      <Badge key={field.id} variant="outline" className="text-xs">
                        {field.label}
                        {field.required && <span className="text-destructive ml-0.5">*</span>}
                      </Badge>
                    ))}
                    {template.fields.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.fields.length - 5} more
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => copyShareLink(template)}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreview(template)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Templates Section (Presets) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Templates</h2>
          <Badge variant="outline">{PRESET_TEMPLATES.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ready-to-use form templates. Copy a link to share or use as inspiration for your own.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_TEMPLATES.map((template) => (
            <Card key={template.id} className="border-dashed">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {template.id === "template-new-person" && (
                      <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">{template.fields.length} fields</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Fields preview */}
                <div className="flex flex-wrap gap-1">
                  {template.fields.slice(0, 5).map((field) => (
                    <Badge key={field.id} variant="outline" className="text-xs">
                      {field.label}
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </Badge>
                  ))}
                  {template.fields.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.fields.length - 5} more
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyShareLink(template)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPreview(template)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Form Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Form Template</DialogTitle>
            <DialogDescription>
              Choose which fields to include in your shareable form.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="formName">Form Name</Label>
              <Input
                id="formName"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                placeholder="e.g., Family Info Request"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="formDescription">Description (optional)</Label>
              <Textarea
                id="formDescription"
                value={newFormDescription}
                onChange={(e) => setNewFormDescription(e.target.value)}
                placeholder="Brief description of what this form is for..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Include Fields</Label>
              <div className="grid gap-2">
                {DEFAULT_FORM_FIELDS.map((field) => (
                  <div
                    key={field.fieldKey}
                    className="flex items-center space-x-3 rounded-md border p-3"
                  >
                    <Checkbox
                      id={field.fieldKey}
                      checked={selectedFields.includes(field.fieldKey)}
                      onCheckedChange={() => toggleField(field.fieldKey)}
                      disabled={field.fieldKey === "firstName"}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={field.fieldKey}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {field.label}
                        {field.fieldKey === "firstName" && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (always required)
                          </span>
                        )}
                      </label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {field.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateForm}>Create Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
