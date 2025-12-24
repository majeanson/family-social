"use client";

import { useMemo, useEffect, useState, useCallback, createContext, useContext } from "react";
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
  type Viewport,
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

// Context to pass colors and centering function to nodes
const ColorsContext = createContext<FamilyColorConfig[]>(DEFAULT_FAMILY_COLORS);
const CenterOnNodeContext = createContext<((nodeId: string) => void) | null>(null);

interface PersonNodeData {
  person: Person;
  hasRelationships: boolean;
  familyColorIndex?: number;
  isMe?: boolean;
  [key: string]: unknown;
}

// Custom node component for people
function PersonNode({ data, id }: NodeProps) {
  const router = useRouter();
  const colors = useContext(ColorsContext);
  const centerOnNode = useContext(CenterOnNodeContext);
  const nodeData = data as unknown as PersonNodeData;
  const person = nodeData.person;
  const colorIndex = nodeData.familyColorIndex ?? -1;
  const familyColor = colorIndex >= 0 ? colors[colorIndex % colors.length] : null;
  const isMe = nodeData.isMe;
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useCallback(() => {
    let timer: NodeJS.Timeout | null = null;
    return {
      set: (fn: () => void, delay: number) => {
        timer = setTimeout(fn, delay);
      },
      clear: () => {
        if (timer) clearTimeout(timer);
      }
    };
  }, [])();

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if mobile (touch device)
    const isMobile = window.matchMedia("(max-width: 768px)").matches ||
                     'ontouchstart' in window;

    if (isMobile) {
      // On mobile: first tap centers, second tap navigates
      setTapCount(prev => {
        const newCount = prev + 1;
        if (newCount === 1) {
          // First tap - center on this node
          centerOnNode?.(id);
          // Reset tap count after delay
          setTimeout(() => setTapCount(0), 500);
        } else if (newCount >= 2) {
          // Second tap - navigate
          router.push(`/person/${person.id}`);
        }
        return newCount;
      });
    } else {
      // On desktop: single click navigates
      router.push(`/person/${person.id}`);
    }
  }, [centerOnNode, id, person.id, router]);

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border-2 shadow-lg cursor-pointer transition-all
        hover:shadow-xl hover:scale-105 min-w-[140px]
        ${isMe
          ? "bg-amber-50 border-amber-400 dark:bg-amber-950/50 dark:border-amber-600 ring-2 ring-amber-300 ring-offset-2"
          : familyColor
            ? `${familyColor.light} ${familyColor.border}`
            : "bg-gray-50 border-gray-200 dark:bg-gray-950/50 dark:border-gray-800"
        }
      `}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />

      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10 border-2 border-background shadow">
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
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${familyColor.bg}`}
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

// Helper to prepare layout data
function prepareLayoutData(
  people: Person[],
  relationships: Relationship[],
  familyGroups: FamilyGroup[],
  selectedFamilyId: string | null,
  primaryUserId?: string | null
) {
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

  // Build adjacency map
  const connections = new Map<string, Set<string>>();
  filteredPeople.forEach((p) => connections.set(p.id, new Set()));

  filteredRelationships.forEach((r) => {
    connections.get(r.personAId)?.add(r.personBId);
    connections.get(r.personBId)?.add(r.personAId);
  });

  // Find center person: prefer "Me" if in filtered people, else most connected
  let centerPerson = filteredPeople[0];

  if (primaryUserId) {
    const mePerson = filteredPeople.find(p => p.id === primaryUserId);
    if (mePerson) {
      centerPerson = mePerson;
    } else {
      let maxConnections = 0;
      filteredPeople.forEach((p) => {
        const numConnections = connections.get(p.id)?.size || 0;
        if (numConnections > maxConnections) {
          maxConnections = numConnections;
          centerPerson = p;
        }
      });
    }
  } else {
    let maxConnections = 0;
    filteredPeople.forEach((p) => {
      const numConnections = connections.get(p.id)?.size || 0;
      if (numConnections > maxConnections) {
        maxConnections = numConnections;
        centerPerson = p;
      }
    });
  }

  return {
    filteredPeople,
    filteredRelationships,
    connections,
    centerPerson,
    personFamilyColor,
  };
}

// Radial layout - circular layers around center
function calculateRadialPositions(
  filteredPeople: Person[],
  connections: Map<string, Set<string>>,
  centerPerson: Person
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const positioned = new Set<string>();
  const layers: string[][] = [];

  // BFS to determine layers (using swap-queue pattern for O(1) dequeue)
  let queue = [centerPerson.id];
  positioned.add(centerPerson.id);
  layers.push([centerPerson.id]);

  while (queue.length > 0) {
    const currentLayer: string[] = [];
    const nextQueue: string[] = [];

    for (const currentId of queue) {
      const neighbors = connections.get(currentId) || new Set();

      neighbors.forEach((neighborId) => {
        if (!positioned.has(neighborId)) {
          positioned.add(neighborId);
          currentLayer.push(neighborId);
          nextQueue.push(neighborId);
        }
      });
    }

    queue = nextQueue;
    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  // Add unconnected people
  filteredPeople.forEach((p) => {
    if (!positioned.has(p.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(p.id);
    }
  });

  // Position nodes (centered at 0,0 - fitView will handle viewport centering)
  const centerX = 0;
  const centerY = 0;
  const baseLayerSpacing = 220;
  const minNodeSpacing = 160;

  layers.forEach((layer, layerIndex) => {
    if (layerIndex === 0) {
      positions.set(layer[0], { x: centerX, y: centerY });
      return;
    }

    const minCircumference = layer.length * minNodeSpacing;
    const minRadius = minCircumference / (2 * Math.PI);
    const baseRadius = layerIndex * baseLayerSpacing;
    const radius = Math.max(baseRadius, minRadius);
    const angleStep = (2 * Math.PI) / layer.length;

    layer.forEach((personId, index) => {
      const startAngle = -Math.PI / 2 + (layerIndex * Math.PI / 12);
      const angle = startAngle + angleStep * index;
      positions.set(personId, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });
  });

  return positions;
}

// Hierarchical layout - tree-like structure
function calculateHierarchicalPositions(
  filteredPeople: Person[],
  connections: Map<string, Set<string>>,
  centerPerson: Person
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const positioned = new Set<string>();
  const layers: string[][] = [];

  // BFS to determine layers (using swap-queue pattern for O(1) dequeue)
  let queue = [centerPerson.id];
  positioned.add(centerPerson.id);
  layers.push([centerPerson.id]);

  while (queue.length > 0) {
    const currentLayer: string[] = [];
    const nextQueue: string[] = [];

    for (const currentId of queue) {
      const neighbors = connections.get(currentId) || new Set();

      neighbors.forEach((neighborId) => {
        if (!positioned.has(neighborId)) {
          positioned.add(neighborId);
          currentLayer.push(neighborId);
          nextQueue.push(neighborId);
        }
      });
    }

    queue = nextQueue;
    if (currentLayer.length > 0) {
      layers.push(currentLayer);
    }
  }

  // Add unconnected people
  filteredPeople.forEach((p) => {
    if (!positioned.has(p.id)) {
      if (layers.length === 0) layers.push([]);
      layers[layers.length - 1].push(p.id);
    }
  });

  // Position nodes in hierarchical tree (centered at 0,0)
  const layerHeight = 150;
  const nodeSpacing = 180;
  const totalHeight = (layers.length - 1) * layerHeight;
  const startY = -totalHeight / 2;

  layers.forEach((layer, layerIndex) => {
    const y = startY + layerIndex * layerHeight;
    const totalWidth = (layer.length - 1) * nodeSpacing;
    const startX = -totalWidth / 2;

    layer.forEach((personId, index) => {
      positions.set(personId, {
        x: startX + index * nodeSpacing,
        y,
      });
    });
  });

  return positions;
}

// Force-directed layout - physics-based simulation
function calculateForcePositions(
  filteredPeople: Person[],
  connections: Map<string, Set<string>>,
  centerPerson: Person
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Initialize with positions around center (0,0)
  const centerX = 0;
  const centerY = 0;

  filteredPeople.forEach((p, i) => {
    if (p.id === centerPerson.id) {
      positions.set(p.id, { x: centerX, y: centerY });
    } else {
      const angle = (2 * Math.PI * i) / filteredPeople.length;
      const radius = 200 + Math.random() * 100;
      positions.set(p.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    }
  });

  // Simple force simulation (10 iterations)
  const repulsion = 8000;
  const attraction = 0.05;
  const iterations = 50;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    filteredPeople.forEach((p) => forces.set(p.id, { fx: 0, fy: 0 }));

    // Repulsion between all nodes
    for (let i = 0; i < filteredPeople.length; i++) {
      for (let j = i + 1; j < filteredPeople.length; j++) {
        const p1 = filteredPeople[i];
        const p2 = filteredPeople[j];
        const pos1 = positions.get(p1.id)!;
        const pos2 = positions.get(p2.id)!;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        forces.get(p1.id)!.fx -= fx;
        forces.get(p1.id)!.fy -= fy;
        forces.get(p2.id)!.fx += fx;
        forces.get(p2.id)!.fy += fy;
      }
    }

    // Attraction along edges
    filteredPeople.forEach((p) => {
      const neighbors = connections.get(p.id) || new Set();
      const pos1 = positions.get(p.id)!;

      neighbors.forEach((neighborId) => {
        const pos2 = positions.get(neighborId);
        if (!pos2) return;

        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * attraction;

        forces.get(p.id)!.fx += (dx / dist) * force;
        forces.get(p.id)!.fy += (dy / dist) * force;
      });
    });

    // Apply forces
    const damping = 0.8 * (1 - iter / iterations);
    filteredPeople.forEach((p) => {
      if (p.id === centerPerson.id) return; // Keep center fixed
      const pos = positions.get(p.id)!;
      const force = forces.get(p.id)!;
      pos.x += force.fx * damping;
      pos.y += force.fy * damping;
    });
  }

  return positions;
}

// Main layout function
function calculateLayout(
  people: Person[],
  relationships: Relationship[],
  familyGroups: FamilyGroup[],
  selectedFamilyId: string | null,
  primaryUserId?: string | null,
  relationshipColors?: Record<string, string>,
  layoutType: GraphLayoutType = "radial"
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const data = prepareLayoutData(
    people,
    relationships,
    familyGroups,
    selectedFamilyId,
    primaryUserId
  );

  const { filteredPeople, filteredRelationships, connections, centerPerson, personFamilyColor } = data;

  if (filteredPeople.length === 0) return { nodes, edges };

  // Calculate positions based on layout type
  let positions: Map<string, { x: number; y: number }>;
  switch (layoutType) {
    case "hierarchical":
      positions = calculateHierarchicalPositions(filteredPeople, connections, centerPerson);
      break;
    case "force":
      positions = calculateForcePositions(filteredPeople, connections, centerPerson);
      break;
    case "radial":
    default:
      positions = calculateRadialPositions(filteredPeople, connections, centerPerson);
      break;
  }

  // Create nodes
  filteredPeople.forEach((person) => {
    const pos = positions.get(person.id) || { x: 0, y: 0 };
    nodes.push({
      id: person.id,
      type: "person",
      position: pos,
      data: {
        person,
        hasRelationships: filteredRelationships.some(
          (r) => r.personAId === person.id || r.personBId === person.id
        ),
        familyColorIndex: personFamilyColor.get(person.id),
        isMe: person.id === primaryUserId,
      } as PersonNodeData,
    });
  });

  // Create edges
  filteredRelationships.forEach((r) => {
    const config = RELATIONSHIP_CONFIG[r.type as keyof typeof RELATIONSHIP_CONFIG];
    const hexColor = getRelationshipHex(r.type as RelationshipType, relationshipColors);

    // Make edges more visible, especially siblings
    const isSibling = r.type === "sibling";
    const isSpouseOrPartner = r.type === "spouse" || r.type === "partner";

    edges.push({
      id: r.id,
      source: r.personAId,
      target: r.personBId,
      type: "smoothstep",
      animated: isSpouseOrPartner,
      style: {
        stroke: hexColor,
        strokeWidth: isSibling ? 3 : 2,
        strokeDasharray: isSibling ? "5,5" : undefined,
      },
      markerEnd: isSibling ? undefined : {
        type: MarkerType.ArrowClosed,
        color: hexColor,
      },
      label: config?.label || r.type,
      labelStyle: {
        fill: "#666",
        fontSize: 11,
        fontWeight: 600,
      },
      labelBgStyle: {
        fill: "white",
        fillOpacity: 0.95,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
    });
  });

  return { nodes, edges };
}

interface FamilyGraphInnerProps {
  selectedFamilyId: string | null;
  onFamilyGroupsChange: (groups: FamilyGroup[]) => void;
  layoutType: GraphLayoutType;
}

// Inner component that uses React Flow (client-side only)
function FamilyGraphInner({ selectedFamilyId, onFamilyGroupsChange, layoutType }: FamilyGraphInnerProps) {
  const { people, relationships, settings } = useDataStore();
  const { resolvedTheme } = useTheme();

  // Get background color based on theme
  const bgGridColor = resolvedTheme === "dark" ? "#374151" : "#e5e7eb";

  // Get colors from settings (ensure non-empty array)
  const colors = (settings.familyColors && settings.familyColors.length > 0)
    ? settings.familyColors
    : DEFAULT_FAMILY_COLORS;

  // Get primary user ID ("Me")
  const primaryUserId = settings.primaryUserId;

  // Get relationship colors from settings
  const relationshipColors = settings.relationshipColors;

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
    () => calculateLayout(people, relationships, familyGroups, selectedFamilyId, primaryUserId, relationshipColors, layoutType),
    [people, relationships, familyGroups, selectedFamilyId, primaryUserId, relationshipColors, layoutType]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialLayout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialLayout.edges);
  const { fitView, setViewport, getViewport, setCenter, getNode } = useReactFlow();

  // Center the view properly
  const centerView = useCallback(() => {
    // First try fitView
    fitView({ padding: 0.3, duration: 300, maxZoom: 1.2 });

    // Then verify and adjust if needed
    setTimeout(() => {
      const viewport = getViewport();
      // If viewport seems off (x or y too extreme), reset to center
      if (Math.abs(viewport.x) > 1000 || Math.abs(viewport.y) > 1000) {
        setViewport({ x: 0, y: 0, zoom: 0.8 }, { duration: 200 });
        setTimeout(() => {
          fitView({ padding: 0.3, duration: 200, maxZoom: 1.2 });
        }, 250);
      }
    }, 350);
  }, [fitView, setViewport, getViewport]);

  // Center on a specific node (for mobile tap)
  const centerOnNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      // Calculate center of node (position is top-left corner)
      const x = node.position.x + (node.measured?.width ?? 140) / 2;
      const y = node.position.y + (node.measured?.height ?? 60) / 2;
      setCenter(x, y, { duration: 300, zoom: 1.2 });
    }
  }, [getNode, setCenter]);

  // Update layout when data changes
  useEffect(() => {
    const layout = calculateLayout(people, relationships, familyGroups, selectedFamilyId, primaryUserId, relationshipColors, layoutType);
    setNodes(layout.nodes);
    setEdges(layout.edges);

    // Center view after layout updates
    const timer = setTimeout(centerView, 100);
    return () => clearTimeout(timer);
  }, [people, relationships, familyGroups, selectedFamilyId, primaryUserId, relationshipColors, layoutType, setNodes, setEdges, centerView]);

  if (people.length === 0) {
    return (
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Add some people to see the relationship graph</p>
      </div>
    );
  }

  const handleInit = useCallback(() => {
    // Center view on initial render
    setTimeout(centerView, 100);
  }, [centerView]);

  return (
    <ColorsContext.Provider value={colors}>
      <CenterOnNodeContext.Provider value={centerOnNode}>
        <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onInit={handleInit}
            fitView
            fitViewOptions={{
              padding: 0.3,
              includeHiddenNodes: false,
              maxZoom: 1.2,
            }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              type: "smoothstep",
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color={bgGridColor} gap={20} />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>
      </CenterOnNodeContext.Provider>
    </ColorsContext.Provider>
  );
}

interface FamilyGraphProps {
  selectedFamilyId?: string | null;
  onFamilyGroupsChange?: (groups: FamilyGroup[]) => void;
  layoutType?: GraphLayoutType;
}

// Wrapper that handles client-side only rendering
export function FamilyGraph({
  selectedFamilyId = null,
  onFamilyGroupsChange,
  layoutType = "radial"
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
      <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FamilyGraphInner
        selectedFamilyId={selectedFamilyId}
        onFamilyGroupsChange={handleFamilyGroupsChange}
        layoutType={layoutType}
      />
    </ReactFlowProvider>
  );
}

// Export FamilyGroup type for use in other components
export type { FamilyGroup };
