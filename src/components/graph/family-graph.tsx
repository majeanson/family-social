"use client";

import { useMemo, useEffect, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/stores/data-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RELATIONSHIP_CONFIG } from "@/types";
import type { Person, Relationship } from "@/types";

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
}

// Custom node component for people
function PersonNode({ data }: NodeProps) {
  const router = useRouter();
  const person = data.person as Person;
  const hasRelationships = data.hasRelationships as boolean;
  const isFamily = person.tags.includes("family") || hasRelationships;

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg cursor-pointer transition-all
        hover:shadow-xl hover:scale-105
        ${isFamily
          ? "bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800"
          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800"
        }
      `}
      onClick={() => router.push(`/person/${person.id}`)}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white shadow">
          {person.photo && <AvatarImage src={person.photo} />}
          <AvatarFallback className={isFamily ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
            {getInitials(person.firstName, person.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm leading-tight">
            {person.firstName}
          </p>
          {person.lastName && (
            <p className="text-xs text-muted-foreground leading-tight">
              {person.lastName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  person: PersonNode,
};

// Calculate node positions using a force-directed-like layout
function calculateLayout(
  people: Person[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Build adjacency map
  const connections = new Map<string, Set<string>>();
  people.forEach((p) => connections.set(p.id, new Set()));

  relationships.forEach((r) => {
    connections.get(r.personAId)?.add(r.personBId);
    connections.get(r.personBId)?.add(r.personAId);
  });

  // Find the most connected person as center
  let centerPerson = people[0];
  let maxConnections = 0;
  people.forEach((p) => {
    const numConnections = connections.get(p.id)?.size || 0;
    if (numConnections > maxConnections) {
      maxConnections = numConnections;
      centerPerson = p;
    }
  });

  // Position nodes in layers based on distance from center
  const positioned = new Set<string>();
  const layers: string[][] = [];

  // BFS to determine layers
  const queue = [centerPerson.id];
  positioned.add(centerPerson.id);
  layers.push([centerPerson.id]);

  while (queue.length > 0) {
    const currentLayer: string[] = [];
    const layerSize = queue.length;

    for (let i = 0; i < layerSize; i++) {
      const currentId = queue.shift()!;
      const neighbors = connections.get(currentId) || new Set();

      neighbors.forEach((neighborId) => {
        if (!positioned.has(neighborId)) {
          positioned.add(neighborId);
          currentLayer.push(neighborId);
          queue.push(neighborId);
        }
      });
    }

    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  // Add unconnected people to the last layer
  people.forEach((p) => {
    if (!positioned.has(p.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(p.id);
    }
  });

  // Position nodes
  const centerX = 400;
  const centerY = 300;
  const layerSpacing = 180;
  const personMap = new Map(people.map((p) => [p.id, p]));

  layers.forEach((layer, layerIndex) => {
    const radius = layerIndex * layerSpacing;
    const angleStep = (2 * Math.PI) / Math.max(layer.length, 1);

    layer.forEach((personId, index) => {
      const person = personMap.get(personId)!;
      let x: number, y: number;

      if (layerIndex === 0) {
        // Center node
        x = centerX;
        y = centerY;
      } else {
        // Arrange in a circle
        const angle = angleStep * index - Math.PI / 2;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }

      // Check if person has any relationships
      const hasRelationships = relationships.some(
        (r) => r.personAId === personId || r.personBId === personId
      );

      nodes.push({
        id: personId,
        type: "person",
        position: { x, y },
        data: { person, hasRelationships },
      });
    });
  });

  // Create edges
  relationships.forEach((r) => {
    const config = RELATIONSHIP_CONFIG[r.type as keyof typeof RELATIONSHIP_CONFIG];
    const color = config?.color?.replace("bg-", "") || "gray-400";

    // Map Tailwind color to hex
    const colorMap: Record<string, string> = {
      "blue-500": "#3b82f6",
      "blue-600": "#2563eb",
      "purple-500": "#a855f7",
      "pink-500": "#ec4899",
      "cyan-500": "#06b6d4",
      "indigo-500": "#6366f1",
      "amber-500": "#f59e0b",
      "orange-500": "#f97316",
      "teal-500": "#14b8a6",
      "rose-500": "#f43f5e",
      "green-500": "#22c55e",
      "gray-500": "#6b7280",
      "gray-400": "#9ca3af",
    };

    edges.push({
      id: r.id,
      source: r.personAId,
      target: r.personBId,
      type: "default",
      animated: r.type === "spouse" || r.type === "partner",
      style: {
        stroke: colorMap[color] || "#9ca3af",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: colorMap[color] || "#9ca3af",
      },
      label: config?.label || r.type,
      labelStyle: {
        fill: "#666",
        fontSize: 10,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: "white",
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    });
  });

  return { nodes, edges };
}

// Inner component that uses React Flow (client-side only)
function FamilyGraphInner() {
  const { people, relationships } = useDataStore();

  // Calculate initial layout
  const initialLayout = useMemo(
    () => calculateLayout(people, relationships),
    [people, relationships]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update layout when data changes
  useEffect(() => {
    const layout = calculateLayout(people, relationships);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [people, relationships, setNodes, setEdges]);

  if (people.length === 0) {
    return (
      <div className="h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Add some people to see the relationship graph</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-lg border overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

// Wrapper that handles client-side only rendering
export function FamilyGraph() {
  // Check if we're on the client using a state that's initialized based on window
  const [isClient, setIsClient] = useState(() => typeof window !== "undefined");

  // This is needed because the initial render might happen on server
  useEffect(() => {
    // Only update if not already client
    if (!isClient) {
      // Use a ref-based approach to avoid lint warning
      const timer = requestAnimationFrame(() => {
        setIsClient(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isClient]);

  if (!isClient) {
    return (
      <div className="h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  return <FamilyGraphInner />;
}
