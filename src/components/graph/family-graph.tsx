"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  Position,
  Handle,
  NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useDataStore } from "@/stores/data-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RELATIONSHIP_CONFIG, DEFAULT_FAMILY_COLORS } from "@/types";
import type { Person, Relationship, FamilyColorConfig, RelationshipType } from "@/types";
import { getInitials, getRelationshipHex } from "@/lib/utils";
import { detectFamilyGroups, type FamilyGroup } from "@/features/use-family-groups";

// Layout types
export type GraphLayoutType = "radial" | "hierarchical" | "force";

interface PersonNodeData {
  person: Person;
  familyColorIndex?: number;
  isMe?: boolean;
  onCenterNode?: (x: number, y: number) => void;
  [key: string]: unknown;
}

// Custom node component
function PersonNode({ data, positionAbsoluteX, positionAbsoluteY }: NodeProps) {
  const router = useRouter();
  const nodeData = data as unknown as PersonNodeData;
  const { person, familyColorIndex, isMe, onCenterNode } = nodeData;

  const colors = DEFAULT_FAMILY_COLORS;
  const familyColor = familyColorIndex !== undefined && familyColorIndex >= 0
    ? colors[familyColorIndex % colors.length]
    : null;

  const lastTapRef = useRef(0);

  const handleClick = useCallback(() => {
    const now = Date.now();
    const isMobile = 'ontouchstart' in window || window.innerWidth < 768;

    if (isMobile) {
      // Double tap to navigate on mobile
      if (now - lastTapRef.current < 400) {
        router.push(`/person/${person.id}`);
      } else {
        // Single tap - center on node
        onCenterNode?.(positionAbsoluteX ?? 0, positionAbsoluteY ?? 0);
      }
      lastTapRef.current = now;
    } else {
      router.push(`/person/${person.id}`);
    }
  }, [router, person.id, onCenterNode, positionAbsoluteX, positionAbsoluteY]);

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg cursor-pointer
        min-w-[140px] select-none
        ${isMe
          ? "bg-amber-50 border-amber-400 dark:bg-amber-950/50 dark:border-amber-600"
          : familyColor
            ? `${familyColor.light} ${familyColor.border}`
            : "bg-white border-gray-300 dark:bg-gray-900 dark:border-gray-700"
        }
      `}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-white shadow">
          {person.photo && <AvatarImage src={person.photo} alt={person.firstName} />}
          <AvatarFallback className={familyColor ? `${familyColor.bg} text-white` : "bg-gray-300"}>
            {getInitials(person.firstName, person.lastName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{person.firstName}</p>
          {person.lastName && <p className="text-xs text-muted-foreground">{person.lastName}</p>}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { person: PersonNode };

// Build graph data
function buildGraph(
  people: Person[],
  relationships: Relationship[],
  familyGroups: FamilyGroup[],
  selectedFamilyId: string | null,
  primaryUserId: string | undefined,
  relationshipColors: Record<string, string> | undefined,
  onCenterNode: (x: number, y: number) => void
): { nodes: Node[]; edges: Edge[] } {
  // Filter by family if selected
  let filteredPeople = people;
  let filteredRelationships = relationships;

  if (selectedFamilyId) {
    const family = familyGroups.find(g => g.id === selectedFamilyId);
    if (family) {
      const memberIds = family.memberIds;
      filteredPeople = people.filter(p => memberIds.has(p.id));
      filteredRelationships = relationships.filter(
        r => memberIds.has(r.personAId) && memberIds.has(r.personBId)
      );
    }
  }

  if (filteredPeople.length === 0) return { nodes: [], edges: [] };

  // Get family colors
  const personColors = new Map<string, number>();
  familyGroups.forEach(g => {
    g.memberIds.forEach(id => personColors.set(id, g.colorIndex));
  });

  // Find center person
  const connectionCount = new Map<string, number>();
  filteredRelationships.forEach(r => {
    connectionCount.set(r.personAId, (connectionCount.get(r.personAId) || 0) + 1);
    connectionCount.set(r.personBId, (connectionCount.get(r.personBId) || 0) + 1);
  });

  let centerPerson = filteredPeople[0];
  if (primaryUserId && filteredPeople.find(p => p.id === primaryUserId)) {
    centerPerson = filteredPeople.find(p => p.id === primaryUserId)!;
  } else {
    let maxConn = 0;
    filteredPeople.forEach(p => {
      const conn = connectionCount.get(p.id) || 0;
      if (conn > maxConn) {
        maxConn = conn;
        centerPerson = p;
      }
    });
  }

  // Position nodes in a radial layout
  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();
  const layers: string[][] = [[centerPerson.id]];
  visited.add(centerPerson.id);

  // BFS to build layers
  const adjacency = new Map<string, string[]>();
  filteredPeople.forEach(p => adjacency.set(p.id, []));
  filteredRelationships.forEach(r => {
    adjacency.get(r.personAId)?.push(r.personBId);
    adjacency.get(r.personBId)?.push(r.personAId);
  });

  let currentLayer = [centerPerson.id];
  while (currentLayer.length > 0) {
    const nextLayer: string[] = [];
    currentLayer.forEach(id => {
      (adjacency.get(id) || []).forEach(neighborId => {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          nextLayer.push(neighborId);
        }
      });
    });
    if (nextLayer.length > 0) layers.push(nextLayer);
    currentLayer = nextLayer;
  }

  // Add unconnected people
  filteredPeople.forEach(p => {
    if (!visited.has(p.id)) {
      layers[layers.length - 1].push(p.id);
    }
  });

  // Calculate positions - center at origin
  positions.set(centerPerson.id, { x: 0, y: 0 });
  const LAYER_RADIUS = 250;
  const MIN_SPACING = 180;

  layers.forEach((layer, layerIdx) => {
    if (layerIdx === 0) return;

    const radius = Math.max(layerIdx * LAYER_RADIUS, (layer.length * MIN_SPACING) / (2 * Math.PI));
    layer.forEach((personId, idx) => {
      const angle = (2 * Math.PI * idx) / layer.length - Math.PI / 2;
      positions.set(personId, {
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle)),
      });
    });
  });

  // Create nodes
  const nodes: Node[] = filteredPeople.map(person => ({
    id: person.id,
    type: "person",
    position: positions.get(person.id) || { x: 0, y: 0 },
    data: {
      person,
      familyColorIndex: personColors.get(person.id),
      isMe: person.id === primaryUserId,
      onCenterNode,
    } as PersonNodeData,
  }));

  // Create edges - ALL relationships get edges
  const edges: Edge[] = filteredRelationships.map(r => {
    const relType = r.type as RelationshipType;
    const config = RELATIONSHIP_CONFIG[relType];
    const isSibling = relType === "sibling";
    const isSpouse = relType === "spouse" || relType === "partner";

    // Use bright, visible colors
    let strokeColor = getRelationshipHex(relType, relationshipColors);
    if (isSibling) strokeColor = "#22c55e"; // Bright green for siblings
    if (isSpouse) strokeColor = "#ec4899"; // Pink for spouse/partner

    return {
      id: r.id,
      source: r.personAId,
      target: r.personBId,
      type: "smoothstep",
      animated: isSpouse,
      style: {
        stroke: strokeColor,
        strokeWidth: isSibling ? 4 : 2,
        strokeDasharray: isSibling ? "10 5" : undefined,
      },
      markerEnd: isSibling ? undefined : {
        type: MarkerType.ArrowClosed,
        color: strokeColor,
        width: 20,
        height: 20,
      },
      label: config?.label || r.type,
      labelStyle: {
        fontSize: 12,
        fontWeight: 700,
        fill: isSibling ? "#16a34a" : "#374151",
      },
      labelBgStyle: {
        fill: "#ffffff",
        fillOpacity: 1,
      },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  return { nodes, edges };
}

// Inner component with ReactFlow hooks
function GraphInner({
  selectedFamilyId,
  onFamilyGroupsChange,
  layoutType
}: {
  selectedFamilyId: string | null;
  onFamilyGroupsChange: (groups: FamilyGroup[]) => void;
  layoutType: GraphLayoutType;
}) {
  const { people, relationships, settings } = useDataStore();
  const { resolvedTheme } = useTheme();
  const { fitView, setCenter } = useReactFlow();

  const familyGroups = useMemo(
    () => detectFamilyGroups(people, relationships),
    [people, relationships]
  );

  useEffect(() => {
    onFamilyGroupsChange(familyGroups);
  }, [familyGroups, onFamilyGroupsChange]);

  // Center on node callback for mobile
  const handleCenterNode = useCallback((x: number, y: number) => {
    setCenter(x, y, { zoom: 1, duration: 300 });
  }, [setCenter]);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(
      people,
      relationships,
      familyGroups,
      selectedFamilyId,
      settings.primaryUserId,
      settings.relationshipColors,
      handleCenterNode
    ),
    [people, relationships, familyGroups, selectedFamilyId, settings.primaryUserId, settings.relationshipColors, handleCenterNode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update when data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(
      people,
      relationships,
      familyGroups,
      selectedFamilyId,
      settings.primaryUserId,
      settings.relationshipColors,
      handleCenterNode
    );
    setNodes(newNodes);
    setEdges(newEdges);
  }, [people, relationships, familyGroups, selectedFamilyId, settings.primaryUserId, settings.relationshipColors, handleCenterNode, setNodes, setEdges]);

  // Fit view on mount and when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, maxZoom: 1.5, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView, selectedFamilyId, layoutType]);

  const bgColor = resolvedTheme === "dark" ? "#374151" : "#d1d5db";

  if (people.length === 0) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Add people to see the graph</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={bgColor} gap={16} />
        <Controls position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

// Wrapper component
export function FamilyGraph({
  selectedFamilyId = null,
  onFamilyGroupsChange,
  layoutType = "radial",
}: {
  selectedFamilyId?: string | null;
  onFamilyGroupsChange?: (groups: FamilyGroup[]) => void;
  layoutType?: GraphLayoutType;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGroupsChange = useCallback((groups: FamilyGroup[]) => {
    onFamilyGroupsChange?.(groups);
  }, [onFamilyGroupsChange]);

  if (!mounted) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <GraphInner
        selectedFamilyId={selectedFamilyId}
        onFamilyGroupsChange={handleGroupsChange}
        layoutType={layoutType}
      />
    </ReactFlowProvider>
  );
}

export type { FamilyGroup };
