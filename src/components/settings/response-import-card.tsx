"use client";

import { useRef, useState } from "react";
import { useDataStore } from "@/stores/data-store";
import { parseResponse } from "@/lib/response-parser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, ClipboardPaste, Upload } from "lucide-react";
import { toast } from "sonner";

export function ResponseImportCard() {
  const { addPerson } = useDataStore();
  const [pastedResponse, setPastedResponse] = useState("");
  const responseFileInputRef = useRef<HTMLInputElement>(null);

  const handleImportResponse = () => {
    if (!pastedResponse.trim()) {
      toast.error("Please paste a response first");
      return;
    }

    const personData = parseResponse(pastedResponse);

    if (personData) {
      addPerson(personData);
      toast.success(`Added ${personData.firstName} ${personData.lastName || ""} to your people!`);
      setPastedResponse("");
    } else {
      toast.error("Could not parse the response. Make sure you pasted the complete response.");
    }
  };

  const handleImportResponseFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const personData = parseResponse(text);

      if (personData) {
        addPerson(personData);
        toast.success(`Added ${personData.firstName} ${personData.lastName || ""} to your people!`);
      } else {
        toast.error("Could not parse the file. Make sure it's a valid response.");
      }
    } catch {
      toast.error("Failed to read the file.");
    }

    // Reset file input
    if (responseFileInputRef.current) {
      responseFileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          Import Shared Response
        </CardTitle>
        <CardDescription>
          Paste a response from a shared form to add them as a person
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="response-paste">Paste Response (Text or JSON)</Label>
          <Textarea
            id="response-paste"
            value={pastedResponse}
            onChange={(e) => setPastedResponse(e.target.value)}
            placeholder={`Paste the response here...

Examples:
• Text from a message (First Name: John, etc.)
• JSON from the Download option`}
            rows={5}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleImportResponse} className="flex-1">
            <ClipboardPaste className="mr-2 h-4 w-4" aria-hidden="true" />
            Import from Paste
          </Button>

          <div>
            <input
              ref={responseFileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleImportResponseFile}
              className="hidden"
              id="response-file-upload"
            />
            <Button
              variant="outline"
              onClick={() => responseFileInputRef.current?.click()}
              aria-label="Upload response file"
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
