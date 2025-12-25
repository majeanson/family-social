"use client";

import { useState } from "react";
import { useRelationshipSuggestions } from "@/features";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RELATIONSHIP_CONFIG } from "@/types";
import { getInitials, cn } from "@/lib/utils";
import { Check, CheckCheck, Lightbulb, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

export function RelationshipSuggestions() {
  const {
    suggestions,
    acceptSuggestion,
    acceptAllSuggestions,
    getPersonDetails,
    hasSuggestions,
    count,
  } = useRelationshipSuggestions();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleSuggestions = suggestions.filter((s) => !dismissedIds.has(s.id));

  const handleAccept = (suggestion: typeof suggestions[0]) => {
    acceptSuggestion(suggestion);
    const personA = getPersonDetails(suggestion.personAId);
    const personB = getPersonDetails(suggestion.personBId);
    toast.success(
      `Added ${RELATIONSHIP_CONFIG[suggestion.type].label} relationship between ${personA?.firstName} and ${personB?.firstName}`
    );
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissedIds((prev) => new Set([...prev, suggestionId]));
  };

  const handleAcceptAll = () => {
    acceptAllSuggestions();
    toast.success(`Added ${count} relationships`);
  };

  if (!hasSuggestions || visibleSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Relationship Suggestions
          </CardTitle>
          <CardDescription>
            No missing relationships detected. Your family tree looks complete!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Relationship Suggestions
            </CardTitle>
            <CardDescription>
              Found {visibleSuggestions.length} possible relationships based on your existing data
            </CardDescription>
          </div>
          {visibleSuggestions.length > 1 && (
            <Button onClick={handleAcceptAll} variant="default" size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Add All ({visibleSuggestions.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map((suggestion) => {
          const personA = getPersonDetails(suggestion.personAId);
          const personB = getPersonDetails(suggestion.personBId);
          const config = RELATIONSHIP_CONFIG[suggestion.type];

          if (!personA || !personB) return null;

          return (
            <div
              key={suggestion.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              {/* Person A */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {personA.photo && <AvatarImage src={personA.photo} />}
                  <AvatarFallback className="text-xs">
                    {getInitials(personA.firstName, personA.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate text-sm">
                  {personA.firstName}
                </span>
              </div>

              {/* Relationship badge */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className={cn("text-xs", config.color, "text-white")}>
                  {config.label}
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Person B */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar className="h-9 w-9 flex-shrink-0">
                  {personB.photo && <AvatarImage src={personB.photo} />}
                  <AvatarFallback className="text-xs">
                    {getInitials(personB.firstName, personB.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate text-sm">
                  {personB.firstName}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleAccept(suggestion)}
                  aria-label="Accept suggestion"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDismiss(suggestion.id)}
                  aria-label="Dismiss suggestion"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}

        {/* Show reasoning on hover/click - simplified for now */}
        <p className="text-xs text-muted-foreground pt-2">
          Suggestions are based on existing relationships (e.g., sibling&apos;s spouse = in-law)
        </p>
      </CardContent>
    </Card>
  );
}
