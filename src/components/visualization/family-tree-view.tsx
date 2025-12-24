"use client";

import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import { useDataStore } from "@/stores/data-store";
import {
  useGenerationLayout,
  groupFamilyUnits,
  type FamilyUnit,
} from "./hooks/use-generation-layout";
import { useFocusState } from "./hooks/use-focus-state";
import { PersonNode, SpousePair } from "./person-node";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, ZoomIn, ZoomOut, Move, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to get distance between two touch points
function getTouchDistance(touches: React.TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper to get center point between two touches
function getTouchCenter(touches: React.TouchList): { x: number; y: number } {
  if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

// Layout constants
const GENERATION_HEIGHT = 220;
const NODE_WIDTH = 180;
const SPOUSE_GAP = 24;
const SIBLING_GAP = 48;
const FAMILY_UNIT_GAP = 80;

interface NodePosition {
  x: number;
  y: number;
  width: number;
}

export function FamilyTreeView() {
  const { people, relationships } = useDataStore();
  const { focusPersonId, setFocus, goBack, canGoBack, clearFocus } = useFocusState();
  const layout = useGenerationLayout(focusPersonId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch state for mobile
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [isTouching, setIsTouching] = useState(false);

  // Calculate node positions for each generation
  const { nodePositions, svgLines, contentBounds } = useMemo(() => {
    if (!layout) {
      return { nodePositions: new Map<string, NodePosition>(), svgLines: [], contentBounds: { width: 0, height: 0 } };
    }

    const positions = new Map<string, NodePosition>();
    const lines: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      style: "solid" | "dashed" | "double";
    }> = [];

    // Sort generations from top (oldest) to bottom (youngest)
    const sortedGenerations = Array.from(layout.byGeneration.entries()).sort(
      ([a], [b]) => a - b
    );

    let maxWidth = 0;

    // Calculate positions for each generation
    sortedGenerations.forEach(([gen, genPeople], genIndex) => {
      const y = (genIndex + 1) * GENERATION_HEIGHT;

      // Get family units for this generation
      const nextGen = layout.byGeneration.get(gen + 1);
      const units = groupFamilyUnits(genPeople, relationships, people, nextGen);

      // Calculate total width for this generation
      let totalWidth = 0;
      units.forEach((unit, i) => {
        const unitWidth = unit.spouse
          ? NODE_WIDTH * 2 + SPOUSE_GAP
          : NODE_WIDTH;
        totalWidth += unitWidth;
        if (i > 0) totalWidth += FAMILY_UNIT_GAP;
      });

      maxWidth = Math.max(maxWidth, totalWidth);

      // Position each unit
      let currentX = -totalWidth / 2;
      units.forEach((unit) => {
        const unitWidth = unit.spouse
          ? NODE_WIDTH * 2 + SPOUSE_GAP
          : NODE_WIDTH;

        // Position primary person
        const primaryX = currentX + (unit.spouse ? NODE_WIDTH / 2 : unitWidth / 2);
        positions.set(unit.primary.id, {
          x: primaryX,
          y,
          width: NODE_WIDTH,
        });

        // Position spouse
        if (unit.spouse) {
          const spouseX = currentX + NODE_WIDTH + SPOUSE_GAP + NODE_WIDTH / 2;
          positions.set(unit.spouse.id, {
            x: spouseX,
            y,
            width: NODE_WIDTH,
          });

          // Add spouse connector line - extend 10px into each card for better visual connection
          lines.push({
            from: { x: primaryX + NODE_WIDTH / 2 - 10, y },
            to: { x: spouseX - NODE_WIDTH / 2 + 10, y },
            style: "double",
          });
        }

        currentX += unitWidth + FAMILY_UNIT_GAP;
      });
    });

    // Add parent-child and sibling lines
    for (const rel of relationships) {
      const fromPos = positions.get(rel.personAId);
      const toPos = positions.get(rel.personBId);
      if (!fromPos || !toPos) continue;

      const relType = rel.type.toLowerCase();

      // Determine relationship type using exact matches
      const isParentChild = relType === "parent" || relType === "child";
      const isSibling = relType === "sibling";

      if (isParentChild) {
        // Vertical line for parent-child
        const parentPos = fromPos.y < toPos.y ? fromPos : toPos;
        const childPos = fromPos.y < toPos.y ? toPos : fromPos;

        lines.push({
          from: { x: parentPos.x, y: parentPos.y + 60 }, // Bottom of parent
          to: { x: childPos.x, y: childPos.y - 60 }, // Top of child
          style: "solid",
        });
      } else if (isSibling) {
        // Sibling line - curved line above the nodes (same generation check removed - trust the data)
        lines.push({
          from: { x: fromPos.x, y: fromPos.y - 70 }, // Top of first sibling
          to: { x: toPos.x, y: toPos.y - 70 }, // Top of second sibling
          style: "dashed",
        });
      }
    }

    const height = (sortedGenerations.length + 1) * GENERATION_HEIGHT;

    return {
      nodePositions: positions,
      svgLines: lines,
      contentBounds: { width: maxWidth + 200, height },
    };
  }, [layout, relationships, people]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 0.4));
  }, []);

  const handleCenterView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  // Handle pan with mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.max(0.4, Math.min(2, z + delta)));
    }
  }, []);

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single finger - pan
      setIsTouching(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      // Two fingers - pinch zoom
      setLastTouchDistance(getTouchDistance(e.touches));
    }
  }, [pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isTouching) {
      // Single finger pan
      e.preventDefault();
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const newDistance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = newDistance / lastTouchDistance;
        setZoom((z) => Math.max(0.4, Math.min(2, z * scale)));
      }
      setLastTouchDistance(newDistance);

      // Also pan while zooming
      const center = getTouchCenter(e.touches);
      if (isTouching) {
        setPan({
          x: center.x - dragStart.x,
          y: center.y - dragStart.y,
        });
      } else {
        setIsTouching(true);
        setDragStart({ x: center.x - pan.x, y: center.y - pan.y });
      }
    }
  }, [isTouching, dragStart, lastTouchDistance, pan]);

  const handleTouchEnd = useCallback(() => {
    setIsTouching(false);
    setLastTouchDistance(0);
  }, []);

  // Center on a specific person - similar to handleCenterView but offset by person position
  const centerOnPerson = useCallback((personId: string) => {
    const pos = nodePositions.get(personId);
    if (!pos) return;

    // Simply negate the position to center on that person
    // pos.x/y are relative to content center, so -pos.x brings that point to center
    setPan({
      x: -pos.x,
      y: -pos.y,
    });
    setZoom(1);
  }, [nodePositions]);

  // Center view on initial load or when focus changes
  useEffect(() => {
    if (focusPersonId) {
      centerOnPerson(focusPersonId);
    }
  }, [focusPersonId, centerOnPerson]);

  if (!layout || people.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        No people to display
      </div>
    );
  }

  return (
    <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] border rounded-lg bg-muted/20 overflow-hidden touch-none">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goBack}
          disabled={!canGoBack}
          className="bg-background/80 backdrop-blur"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={clearFocus}
          className="bg-background/80 backdrop-blur"
          aria-label="Go to primary user"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-background/80 backdrop-blur"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="flex items-center px-2 bg-background/80 backdrop-blur rounded-md text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-background/80 backdrop-blur"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCenterView}
          className="bg-background/80 backdrop-blur"
          aria-label="Center view"
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>

      {/* Generation labels */}
      <div className="absolute left-4 top-20 z-10 flex flex-col gap-2">
        {Array.from(layout.byGeneration.keys())
          .sort((a, b) => a - b)
          .map((gen, i) => (
            <div
              key={gen}
              className="text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded"
              style={{ marginTop: i === 0 ? 0 : GENERATION_HEIGHT * zoom - 24 }}
            >
              Gen {gen > 0 ? `+${gen}` : gen}
            </div>
          ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "w-full h-full",
          isDragging || isTouching ? "cursor-grabbing" : "cursor-grab"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            width: contentBounds.width,
            height: contentBounds.height,
            left: "50%",
            marginLeft: -contentBounds.width / 2,
          }}
        >
          {/* SVG Lines */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={contentBounds.width}
            height={contentBounds.height}
            style={{ left: 0, top: 0 }}
          >
            {svgLines.map((line, i) => {
              const midY = (line.from.y + line.to.y) / 2;

              if (line.style === "double") {
                // Horizontal spouse connector
                return (
                  <g key={i}>
                    <line
                      x1={line.from.x + contentBounds.width / 2}
                      y1={line.from.y}
                      x2={line.to.x + contentBounds.width / 2}
                      y2={line.to.y}
                      stroke="rgb(244, 114, 182)" // rose-400
                      strokeWidth="3"
                    />
                  </g>
                );
              }

              if (line.style === "dashed") {
                // Sibling connector - curved line above nodes
                const fromX = line.from.x + contentBounds.width / 2;
                const toX = line.to.x + contentBounds.width / 2;
                const y = line.from.y;
                const curveHeight = 30; // How high the curve arcs above

                return (
                  <path
                    key={i}
                    d={`
                      M ${fromX} ${y}
                      Q ${(fromX + toX) / 2} ${y - curveHeight} ${toX} ${y}
                    `}
                    fill="none"
                    stroke="rgb(34, 197, 94)" // green-500 for siblings
                    strokeWidth="3"
                    strokeDasharray="8,4"
                  />
                );
              }

              // Parent-child vertical connector with step
              return (
                <path
                  key={i}
                  d={`
                    M ${line.from.x + contentBounds.width / 2} ${line.from.y}
                    L ${line.from.x + contentBounds.width / 2} ${midY}
                    L ${line.to.x + contentBounds.width / 2} ${midY}
                    L ${line.to.x + contentBounds.width / 2} ${line.to.y}
                  `}
                  fill="none"
                  stroke="rgb(148, 163, 184)" // slate-400
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Person Nodes */}
          {Array.from(nodePositions.entries()).map(([personId, pos]) => {
            const person = people.find((p) => p.id === personId);
            if (!person) return null;

            const degree = layout.degrees.get(personId) ?? Infinity;

            return (
              <div
                key={personId}
                className="absolute"
                style={{
                  left: pos.x + contentBounds.width / 2 - pos.width / 2,
                  top: pos.y - 60, // Center vertically
                }}
              >
                <PersonNode
                  person={person}
                  degree={degree}
                  isFocused={personId === focusPersonId}
                  onClick={setFocus}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions - different for mobile vs desktop */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-1.5 rounded-full text-center">
        <span className="hidden sm:inline">Click to focus | Double-click for profile | Drag to pan | Ctrl+scroll to zoom</span>
        <span className="sm:hidden">Tap to focus | Double-tap for profile | Drag to pan | Pinch to zoom</span>
      </div>
    </div>
  );
}
