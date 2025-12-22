"use client";

import { useDataStore } from "@/stores/data-store";
import { usePrimaryUser } from "@/features";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, X } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

export function MyProfileCard() {
  const { people } = useDataStore();
  const { me, setAsMe, clearMe } = usePrimaryUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" aria-hidden="true" />
          My Profile
        </CardTitle>
        <CardDescription>
          Set yourself as the primary user for relationship context
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {me ? (
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <Avatar className="h-12 w-12">
              {me.photo && <AvatarImage src={me.photo} alt={me.firstName} />}
              <AvatarFallback className="bg-amber-500 text-white">
                {getInitials(me.firstName, me.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">
                  {me.firstName} {me.lastName}
                </p>
                <Badge className="bg-amber-500 hover:bg-amber-600 shrink-0">
                  <Crown className="h-3 w-3 mr-1" aria-hidden="true" />
                  Me
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Relationships show from your perspective
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                clearMe();
                toast.success("Primary user cleared");
              }}
              aria-label="Clear 'Me' selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No one is set as &quot;Me&quot; yet. Setting yourself allows the app to show relationships from your perspective.
            </p>
            {people.length > 0 ? (
              <div className="space-y-2">
                <Label>Select yourself</Label>
                <Select onValueChange={(id) => {
                  setAsMe(id);
                  const person = people.find(p => p.id === id);
                  if (person) {
                    toast.success(`${person.firstName} is now set as "Me"!`);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        <span>{person.firstName} {person.lastName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add some people first, then you can set yourself here.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
