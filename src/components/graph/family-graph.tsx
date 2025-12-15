"use client";

import { useMemo, useEffect, useState, useCallback, createContext, useContext } from "react";
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
import { RELATIONSHIP_CONFIG, DEFAULT_FAMILY_COLORS } from "@/types";
import type { Person, Relationship, FamilyColorConfig } from "@/types";
import { getInitials, getTailwindHex } from "@/lib/utils";

// Context to pass colors to nodes
const ColorsContext = createContext<FamilyColorConfig[]>(DEFAULT_FAMILY_COLORS);

interface FamilyGroup {
  id: string;
  name: string;
  memberIds: Set<string>;
  colorIndex: number;
}

interface PersonNodeData {
  person: Person;
  hasRelationships: boolean;
  familyColorIndex?: number;
  [key: string]: unknown;
}

// Custom node component for people
function PersonNode({ data }: NodeProps) {
  const router = useRouter();
  const colors = useContext(ColorsContext);
  const nodeData = data as unknown as PersonNodeData;
  const person = nodeData.person;
  const colorIndex = nodeData.familyColorIndex ?? -1;
  const familyColor = colorIndex >= 0 ? colors[colorIndex % colors.length] : null;

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg cursor-pointer transition-all
        hover:shadow-xl hover:scale-105
        ${familyColor
          ? `${familyColor.light} ${familyColor.border}`
          : "bg-gray-50 border-gray-200 dark:bg-gray-950/50 dark:border-gray-800"
        }
      `}
      onClick={() => router.push(`/person/${person.id}`)}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-white shadow">
            {person.photo && <AvatarImage src={person.photo} alt={person.firstName} />}
            <AvatarFallback
              className={familyColor
                ? `${familyColor.bg} text-white`
                : "bg-gray-200 text-gray-700"
              }
            >
              {getInitials(person.firstName, person.lastName)}
            </AvatarFallback>
          </Avatar>
          {familyColor && (
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${familyColor.bg}`}
            />
          )}
        </div>
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

/**
 * Detect family groups using Union-Find algorithm
 * People connected by family relationships are grouped together
 */
function detectFamilyGroups(
  people: Person[],
  relationships: Relationship[]
): FamilyGroup[] {
  // Family relationship types that connect family members
  const familyRelTypes = new Set([
    "parent", "child", "sibling", "spouse", "partner",
    "grandparent", "grandchild", "aunt_uncle", "niece_nephew",
    "cousin", "in_law", "step_family"
  ]);

  // Union-Find data structure
  const parent = new Map<string, string>();
  const rank = new Map<string, number>();

  // Initialize each person as their own group
  people.forEach(p => {
    parent.set(p.id, p.id);
    rank.set(p.id, 0);
  });

  function find(x: string): string {
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }

  function union(x: string, y: string) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return;

    const rankX = rank.get(rootX) || 0;
    const rankY = rank.get(rootY) || 0;

    if (rankX < rankY) {
      parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      parent.set(rootY, rootX);
    } else {
      parent.set(rootY, rootX);
      rank.set(rootX, rankX + 1);
    }
  }

  // Union people connected by family relationships
  relationships.forEach(rel => {
    if (familyRelTypes.has(rel.type)) {
      union(rel.personAId, rel.personBId);
    }
  });

  // Group people by their root
  const groups = new Map<string, Set<string>>();
  people.forEach(p => {
    const root = find(p.id);
    if (!groups.has(root)) {
      groups.set(root, new Set());
    }
    groups.get(root)!.add(p.id);
  });

  // Convert to array and sort by size (largest first)
  const personMap = new Map(people.map(p => [p.id, p]));
  const familyGroups: FamilyGroup[] = [];
  let colorIndex = 0;

  Array.from(groups.entries())
    .filter(([, members]) => members.size > 1) // Only groups with 2+ members
    .sort((a, b) => b[1].size - a[1].size)
    .forEach(([rootId, memberIds]) => {
      const rootPerson = personMap.get(rootId);
      familyGroups.push({
        id: rootId,
        name: rootPerson ? `${rootPerson.lastName || rootPerson.firstName} Family` : "Family",
        memberIds,
        colorIndex: colorIndex++,
      });
    });

  return familyGroups;
}

// Calculate node positions using a force-directed-like layout
function calculateLayout(
  people: Person[],
  relationships: Relationship[],
  familyGroups: FamilyGroup[],
  selectedFamilyId: string | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create a map of person ID to family color index
  const personFamilyColor = new Map<string, number>();
  familyGroups.forEach(group => {
    group.memberIds.forEach(memberId => {
      personFamilyColor.set(memberId, group.colorIndex);
    });
  });

  // Filter people if a family is selected
  let filteredPeople = people;
  let filteredRelationships = relationships;

  if (selectedFamilyId) {
    const selectedFamily = familyGroups.find(g => g.id === selectedFamilyId);
    if (selectedFamily) {
      filteredPeople = people.filter(p => selectedFamily.memberIds.has(p.id));
      filteredRelationships = relationships.filter(
        r => selectedFamily.memberIds.has(r.personAId) && selectedFamily.memberIds.has(r.personBId)
      );
    }
  }

  if (filteredPeople.length === 0) return { nodes, edges };

  // Build adjacency map
  const connections = new Map<string, Set<string>>();
  filteredPeople.forEach((p) => connections.set(p.id, new Set()));

  filteredRelationships.forEach((r) => {
    connections.get(r.personAId)?.add(r.personBId);
    connections.get(r.personBId)?.add(r.personAId);
  });

  // Find the most connected person as center
  let centerPerson = filteredPeople[0];
  let maxConnections = 0;
  filteredPeople.forEach((p) => {
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
  filteredPeople.forEach((p) => {
    if (!positioned.has(p.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(p.id);
    }
  });

  // Position nodes
  const centerX = 400;
  const centerY = 300;
  const layerSpacing = 180;
  const personMap = new Map(filteredPeople.map((p) => [p.id, p]));

  layers.forEach((layer, layerIndex) => {
    const radius = layerIndex * layerSpacing;
    const angleStep = (2 * Math.PI) / Math.max(layer.length, 1);

    layer.forEach((personId, index) => {
      const person = personMap.get(personId)!;
      let x: number, y: number;

      if (layerIndex === 0) {
        x = centerX;
        y = centerY;
      } else {
        const angle = angleStep * index - Math.PI / 2;
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }

      const hasRelationships = filteredRelationships.some(
        (r) => r.personAId === personId || r.personBId === personId
      );

      nodes.push({
        id: personId,
        type: "person",
        position: { x, y },
        data: {
          person,
          hasRelationships,
          familyColorIndex: personFamilyColor.get(personId),
        } as PersonNodeData,
      });
    });
  });

  // Create edges
  filteredRelationships.forEach((r) => {
    const config = RELATIONSHIP_CONFIG[r.type as keyof typeof RELATIONSHIP_CONFIG];
    const hexColor = getTailwindHex(config?.color || "bg-gray-400");

    edges.push({
      id: r.id,
      source: r.personAId,
      target: r.personBId,
      type: "default",
      animated: r.type === "spouse" || r.type === "partner",
      style: {
        stroke: hexColor,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: hexColor,
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

interface FamilyGraphInnerProps {
  selectedFamilyId: string | null;
  onFamilyGroupsChange: (groups: FamilyGroup[]) => void;
}

// Inner component that uses React Flow (client-side only)
function FamilyGraphInner({ selectedFamilyId, onFamilyGroupsChange }: FamilyGraphInnerProps) {
  const { people, relationships, settings } = useDataStore();

  // Get colors from settings
  const colors = settings.familyColors || DEFAULT_FAMILY_COLORS;

  // Detect family groups
  const familyGroups = useMemo(
    () => detectFamilyGroups(people, relationships),
    [people, relationships]
  );

  // Notify parent of family groups
  useEffect(() => {
    onFamilyGroupsChange(familyGroups);
  }, [familyGroups, onFamilyGroupsChange]);

  // Calculate initial layout
  const initialLayout = useMemo(
    () => calculateLayout(people, relationships, familyGroups, selectedFamilyId),
    [people, relationships, familyGroups, selectedFamilyId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update layout when data changes
  useEffect(() => {
    const layout = calculateLayout(people, relationships, familyGroups, selectedFamilyId);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [people, relationships, familyGroups, selectedFamilyId, setNodes, setEdges]);

  if (people.length === 0) {
    return (
      <div className="h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Add some people to see the relationship graph</p>
      </div>
    );
  }

  return (
    <ColorsContext.Provider value={colors}>
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
    </ColorsContext.Provider>
  );
}

interface FamilyGraphProps {
  selectedFamilyId?: string | null;
  onFamilyGroupsChange?: (groups: FamilyGroup[]) => void;
}

// Wrapper that handles client-side only rendering
export function FamilyGraph({
  selectedFamilyId = null,
  onFamilyGroupsChange
}: FamilyGraphProps) {
  const [isClient, setIsClient] = useState(() => typeof window !== "undefined");

  const handleFamilyGroupsChange = useCallback((groups: FamilyGroup[]) => {
    onFamilyGroupsChange?.(groups);
  }, [onFamilyGroupsChange]);

  useEffect(() => {
    if (!isClient) {
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

  return (
    <FamilyGraphInner
      selectedFamilyId={selectedFamilyId}
      onFamilyGroupsChange={handleFamilyGroupsChange}
    />
  );
}

// Export FamilyGroup type for use in other components
export type { FamilyGroup };
