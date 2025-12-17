"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FamilyTreeView } from "./family-tree-view";
import { TimelineView } from "./timeline-view";
import { GitBranch, Rows3 } from "lucide-react";

export type VisualizationMode = "tree" | "timeline";

interface VisualizationContainerProps {
  defaultMode?: VisualizationMode;
}

export function VisualizationContainer({
  defaultMode = "tree",
}: VisualizationContainerProps) {
  const [mode, setMode] = useState<VisualizationMode>(defaultMode);

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as VisualizationMode)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tree" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Family Tree
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Rows3 className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tree" className="mt-4">
          <FamilyTreeView />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <TimelineView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
