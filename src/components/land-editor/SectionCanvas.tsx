"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { Point, Section } from "@/lib/types";
import {
  traceBoundaryPath,
  traceSimplePath,
  calculatePolygonArea,
  calculateCurvedArea,
  getPolygonCentroid,
  isPointInPolygon,
  drawGrid,
} from "./canvas-utils";

interface SectionCanvasProps {
  /** The land's outer boundary points (rendered as readonly background) */
  landBoundary: Point[];
  /** Total land area in acres (for proportional section area calculation) */
  totalAreaAcres: number | null;
  /** Existing saved sections */
  sections: Section[];
  /** Currently selected section ID */
  selectedSectionId: string | null;
  /** Called when a section is clicked on the canvas */
  onSectionSelect: (sectionId: string | null) => void;
  /** Whether section drawing mode is active */
  isDrawing: boolean;
  /** The points being drawn for a new/edited section */
  drawingPoints: { x: number; y: number }[];
  /** Called when drawing points change */
  onDrawingPointsChange: (points: { x: number; y: number }[]) => void;
  /** Called when drawing is finished (double-click or done button) */
  onDrawingComplete: (points: { x: number; y: number }[], areaAcres: number | null) => void;
}

const SECTION_COLORS_ALPHA = 0.25;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

export default function SectionCanvas({
  landBoundary,
  totalAreaAcres,
  sections,
  selectedSectionId,
  onSectionSelect,
  isDrawing,
  drawingPoints,
  onDrawingPointsChange,
  onDrawingComplete,
}: SectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });

  // Land boundary pixel area (for proportional section area calculation)
  const landPixelArea = landBoundary.length >= 3 ? calculateCurvedArea(landBoundary) : 0;

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.max(400, Math.floor(rect.width * 0.55)),
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  /**
   * Convert screen coordinates to canvas (world) coordinates,
   * accounting for zoom and pan.
   */
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - panOffset.x) / zoom,
        y: (screenY - panOffset.y) / zoom,
      };
    },
    [zoom, panOffset]
  );

  /**
   * Calculate section area in acres based on its pixel area relative to the land.
   */
  const calcSectionAcres = useCallback(
    (sectionPoints: { x: number; y: number }[]): number | null => {
      if (!totalAreaAcres || landPixelArea <= 0 || sectionPoints.length < 3)
        return null;
      const sectionPixelArea = calculatePolygonArea(sectionPoints);
      return Math.round((sectionPixelArea / landPixelArea) * totalAreaAcres * 100) / 100;
    },
    [totalAreaAcres, landPixelArea]
  );

  // ── Zoom controls ──

  const handleZoomIn = () => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomFit = () => {
    if (landBoundary.length < 3) return;
    // Calculate bounding box of the land boundary
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of landBoundary) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const bw = maxX - minX;
    const bh = maxY - minY;
    if (bw <= 0 || bh <= 0) return;

    const padding = 40;
    const scaleX = (canvasSize.width - padding * 2) / bw;
    const scaleY = (canvasSize.height - padding * 2) / bh;
    const fitZoom = Math.min(scaleX, scaleY, MAX_ZOOM);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    setZoom(Math.round(fitZoom * 100) / 100);
    setPanOffset({
      x: canvasSize.width / 2 - cx * fitZoom,
      y: canvasSize.height / 2 - cy * fitZoom,
    });
  };

  // Draw canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = "#E8F5E9"; // Light green background
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Grid (drawn in screen space, scaled for zoom feel)
    const gridSize = Math.max(10, Math.round(30 * zoom));
    const gridOffsetX = panOffset.x % gridSize;
    const gridOffsetY = panOffset.y % gridSize;
    ctx.strokeStyle = "rgba(46, 74, 57, 0.2)";
    ctx.lineWidth = 0.5;
    for (let x = gridOffsetX; x < canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }
    for (let y = gridOffsetY; y < canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }

    // Apply zoom + pan transform for all world-space drawing
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // ── Land boundary (readonly background) ──
    if (landBoundary.length >= 3) {
      traceBoundaryPath(ctx, landBoundary, true);
      ctx.fillStyle = "rgba(64, 145, 108, 0.08)";
      ctx.fill();

      traceBoundaryPath(ctx, landBoundary, true);
      ctx.strokeStyle = "rgba(64, 145, 108, 0.4)";
      ctx.lineWidth = 2 / zoom; // keep stroke visually consistent
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Existing sections ──
    sections.forEach((section) => {
      if (!section.boundary_points || section.boundary_points.length < 3) return;
      const pts = section.boundary_points;
      const isSelected = section.id === selectedSectionId;
      const isHovered = section.id === hoveredSection;

      // Fill
      traceSimplePath(ctx, pts, true);
      const alpha = isSelected ? 0.4 : isHovered ? 0.3 : SECTION_COLORS_ALPHA;
      ctx.fillStyle = hexToRgba(section.color, alpha);
      ctx.fill();

      // Stroke
      traceSimplePath(ctx, pts, true);
      ctx.strokeStyle = isSelected
        ? section.color
        : hexToRgba(section.color, isHovered ? 0.9 : 0.6);
      ctx.lineWidth = (isSelected ? 3 : 2) / zoom;
      ctx.stroke();

      // Selection glow
      if (isSelected) {
        traceSimplePath(ctx, pts, true);
        ctx.strokeStyle = hexToRgba(section.color, 0.2);
        ctx.lineWidth = 8 / zoom;
        ctx.stroke();
      }

      // Label at centroid
      const centroid = getPolygonCentroid(pts);
      const sectionAcres = section.area_acres ?? calcSectionAcres(pts);

      const label = section.crop_emoji
        ? `${section.crop_emoji} ${section.name}`
        : section.name;
      const subLabel = sectionAcres ? `${sectionAcres} acres` : "";

      const fontSize = 13 / zoom;
      ctx.font = `bold ${fontSize}px sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const pillW = Math.max(textWidth + 20 / zoom, 60 / zoom);
      const pillH = subLabel ? 42 / zoom : 28 / zoom;

      ctx.beginPath();
      const pillX = centroid.x - pillW / 2;
      const pillY = centroid.y - pillH / 2;
      ctx.roundRect(pillX, pillY, pillW, pillH, 8 / zoom);
      ctx.fillStyle = isSelected
        ? "rgba(255, 255, 255, 0.95)"
        : "rgba(255, 255, 255, 0.85)";
      ctx.fill();
      ctx.strokeStyle = hexToRgba(section.color, 0.5);
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();

      ctx.fillStyle = section.color;
      ctx.font = `bold ${12 / zoom}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        label,
        centroid.x,
        subLabel ? centroid.y - 7 / zoom : centroid.y
      );

      if (subLabel) {
        ctx.fillStyle = "rgba(165, 214, 167, 0.6)";
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.fillText(subLabel, centroid.x, centroid.y + 10 / zoom);
      }
    });

    // ── Drawing overlay ──
    if (isDrawing) {
      const allPts = mousePos
        ? [...drawingPoints, mousePos]
        : drawingPoints;

      if (allPts.length >= 1) {
        if (drawingPoints.length >= 3) {
          traceSimplePath(ctx, drawingPoints, true);
          ctx.fillStyle = "rgba(212, 163, 115, 0.15)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.moveTo(allPts[0].x, allPts[0].y);
        for (let i = 1; i < allPts.length; i++) {
          ctx.lineTo(allPts[i].x, allPts[i].y);
        }
        ctx.strokeStyle = "rgba(212, 163, 115, 0.8)";
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw placed vertices
        drawingPoints.forEach((pt, i) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 10 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(212, 163, 115, 0.1)";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = i === 0 ? "#D4A373" : "#E8C9A0";
          ctx.fill();
          ctx.strokeStyle = "white";
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        });

        // Close indicator
        if (
          drawingPoints.length >= 3 &&
          mousePos &&
          distance(mousePos, drawingPoints[0]) < 15 / zoom
        ) {
          ctx.beginPath();
          ctx.arc(drawingPoints[0].x, drawingPoints[0].y, 12 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(212, 163, 115, 0.6)";
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }

        // Area preview
        if (drawingPoints.length >= 3) {
          const previewAcres = calcSectionAcres(drawingPoints);
          if (previewAcres !== null) {
            const centroid = getPolygonCentroid(drawingPoints);
            ctx.fillStyle = "rgba(212, 163, 115, 0.8)";
            ctx.font = `bold ${12 / zoom}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`~${previewAcres} acres`, centroid.x, centroid.y);
          }
        }
      }
    }

    // Restore transform before drawing screen-space UI
    ctx.restore();

    // ── Screen-space hints (not affected by zoom) ──
    if (isDrawing) {
      if (drawingPoints.length === 0) {
        ctx.fillStyle = "rgba(212, 163, 115, 0.5)";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Click to place section vertices • Double-click to close",
          canvasSize.width / 2,
          canvasSize.height - 30
        );
      } else if (drawingPoints.length < 3) {
        ctx.fillStyle = "rgba(212, 163, 115, 0.4)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(
          `${3 - drawingPoints.length} more point${drawingPoints.length === 2 ? "" : "s"} to close shape`,
          canvasSize.width / 2,
          canvasSize.height - 16
        );
      } else {
        ctx.fillStyle = "rgba(212, 163, 115, 0.4)";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(
          "Click first point or double-click to close • Press Done when finished",
          canvasSize.width / 2,
          canvasSize.height - 16
        );
      }
    }

    // Land info (bottom-right, screen space)
    if (!isDrawing && landBoundary.length >= 3) {
      ctx.fillStyle = "rgba(165, 214, 167, 0.3)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      const info = totalAreaAcres
        ? `${totalAreaAcres} acres total`
        : `${Math.round(landPixelArea).toLocaleString()} px²`;
      ctx.fillText(info, canvasSize.width - 14, canvasSize.height - 14);
    }
  }, [
    canvasSize,
    landBoundary,
    sections,
    selectedSectionId,
    hoveredSection,
    isDrawing,
    drawingPoints,
    mousePos,
    totalAreaAcres,
    landPixelArea,
    calcSectionAcres,
    zoom,
    panOffset,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Mouse handlers ──

  const getCanvasPos = (
    e: ReactMouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return screenToWorld(screenX, screenY);
  };

  const getScreenPos = (
    e: ReactMouseEvent<HTMLCanvasElement>
  ): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const findSectionAt = (
    pos: { x: number; y: number }
  ): string | null => {
    for (let i = sections.length - 1; i >= 0; i--) {
      const s = sections[i];
      if (s.boundary_points && s.boundary_points.length >= 3) {
        if (isPointInPolygon(pos, s.boundary_points)) {
          return s.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    // Right-click or middle-click: start panning
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      const screen = getScreenPos(e);
      panStart.current = { x: screen.x, y: screen.y };
      panOffsetStart.current = { ...panOffset };
      return;
    }

    const pos = getCanvasPos(e);

    if (isDrawing) {
      // Don't allow points outside the land boundary
      if (landBoundary.length >= 3 && !isPointInPolygon(pos, landBoundary)) {
        return;
      }

      // Check if clicking near first point to close
      if (
        drawingPoints.length >= 3 &&
        distance(pos, drawingPoints[0]) < 15 / zoom
      ) {
        const acres = calcSectionAcres(drawingPoints);
        onDrawingComplete(drawingPoints, acres);
        return;
      }

      // Add new point
      onDrawingPointsChange([...drawingPoints, pos]);
    } else {
      // Select section
      const sectionId = findSectionAt(pos);
      onSectionSelect(sectionId);
    }
  };

  const handleDoubleClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingPoints.length < 3) return;
    e.preventDefault();
    const acres = calcSectionAcres(drawingPoints);
    onDrawingComplete(drawingPoints, acres);
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    // Handle panning
    if (isPanning) {
      const screen = getScreenPos(e);
      setPanOffset({
        x: panOffsetStart.current.x + (screen.x - panStart.current.x),
        y: panOffsetStart.current.y + (screen.y - panStart.current.y),
      });
      return;
    }

    const pos = getCanvasPos(e);
    setMousePos(pos);

    if (!isDrawing) {
      setHoveredSection(findSectionAt(pos));
    }
  };

  const handleMouseUp = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2) {
      setIsPanning(false);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredSection(null);
    setIsPanning(false);
  };

  const handleContextMenu = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // prevent right-click menu so we can use it for pan
  };

  // Scroll-wheel zoom (centered on cursor)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Determine new zoom level
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round((zoom + delta) * 100) / 100));
      if (newZoom === zoom) return;

      // Zoom centered on cursor position
      const worldX = (cursorX - panOffset.x) / zoom;
      const worldY = (cursorY - panOffset.y) / zoom;
      const newPanX = cursorX - worldX * newZoom;
      const newPanY = cursorY - worldY * newZoom;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    },
    [zoom, panOffset]
  );

  // Attach wheel handler with passive: false for preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Section area summary ──
  const totalSectionAcres = sections.reduce((sum, s) => {
    if (s.boundary_points && s.boundary_points.length >= 3) {
      const acres = s.area_acres ?? calcSectionAcres(s.boundary_points);
      return sum + (acres ?? 0);
    }
    return sum;
  }, 0);

  const unallocatedAcres = totalAreaAcres
    ? Math.max(0, totalAreaAcres - totalSectionAcres)
    : null;

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="space-y-3">
      {/* Info bar */}
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="text-xs flex items-center gap-3 flex-wrap"
          style={{ color: "var(--text-muted)" }}
        >
          <span>
            🧩 {sections.filter((s) => s.boundary_points && s.boundary_points.length >= 3).length} section
            {sections.filter((s) => s.boundary_points && s.boundary_points.length >= 3).length !== 1 ? "s" : ""} drawn
          </span>
          {totalAreaAcres && (
            <>
              <span
                className="w-px h-4"
                style={{ background: "var(--border)" }}
              />
              <span>
                📐 {totalSectionAcres.toFixed(2)} / {totalAreaAcres} acres allocated
              </span>
              {unallocatedAcres !== null && unallocatedAcres > 0 && (
                <span
                  className="badge badge-warning"
                  style={{ fontSize: "11px" }}
                >
                  {unallocatedAcres.toFixed(2)} acres unallocated
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex-1" />
        {isDrawing && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: "var(--color-accent)" }}
            >
              ✏️ Drawing section...
            </span>
            {drawingPoints.length >= 3 && (
              <button
                onClick={() => {
                  const acres = calcSectionAcres(drawingPoints);
                  onDrawingComplete(drawingPoints, acres);
                }}
                className="btn btn-sm"
                style={{
                  background: "rgba(212, 163, 115, 0.15)",
                  color: "#D4A373",
                  border: "1px solid rgba(212, 163, 115, 0.3)",
                  padding: "4px 12px",
                  fontSize: "12px",
                }}
                id="finish-drawing-btn"
              >
                ✓ Done
              </button>
            )}
            <button
              onClick={() => onDrawingPointsChange([])}
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              title="Clear drawing"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Canvas wrapper (relative for zoom controls overlay) */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)", position: "relative" }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            cursor: isPanning
              ? "grabbing"
              : isDrawing
              ? (mousePos && landBoundary.length >= 3 && !isPointInPolygon(mousePos, landBoundary) ? "not-allowed" : "crosshair")
              : hoveredSection
              ? "pointer"
              : "default",
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        />

        {/* Zoom controls — floating bottom-right overlay */}
        <div
          style={{
            position: "absolute",
            bottom: 14,
            right: 14,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 10,
          }}
        >
          {/* Zoom percentage display */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(64, 145, 108, 0.25)",
              borderRadius: 8,
              padding: "4px 10px",
              textAlign: "center",
              color: "rgba(45, 106, 79, 0.8)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              userSelect: "none",
            }}
          >
            {zoomPercent}%
          </div>

          {/* Zoom buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(64, 145, 108, 0.25)",
              borderRadius: 10,
              overflow: "hidden",
              color: "#111827",
            }}
          >
            <ZoomBtn
              label="+"
              title="Zoom in"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
            />
            <div style={{ height: 1, background: "rgba(64, 145, 108, 0.15)" }} />
            <ZoomBtn
              label="−"
              title="Zoom out"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
            />
            <div style={{ height: 1, background: "rgba(64, 145, 108, 0.15)" }} />
            <ZoomBtn
              label="⊡"
              title="Fit to boundary"
              onClick={handleZoomFit}
            />
            <div style={{ height: 1, background: "rgba(64, 145, 108, 0.15)" }} />
            <ZoomBtn
              label="↺"
              title="Reset zoom & pan"
              onClick={handleZoomReset}
            />
          </div>
        </div>

        {/* Pan hint (shown when zoomed in) */}
        {zoom > 1 && !isPanning && (
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: 14,
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(64, 145, 108, 0.2)",
              borderRadius: 8,
              padding: "4px 10px",
              color: "rgba(45, 106, 79, 0.7)",
              fontSize: 11,
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Right-click drag to pan • Scroll to zoom
          </div>
        )}
      </div>
    </div>
  );
}

// ── Zoom button component ──

function ZoomBtn({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 36,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        color: disabled ? "rgba(165, 214, 167, 0.2)" : "rgba(165, 214, 167, 0.8)",
        fontSize: 18,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(64, 145, 108, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {label}
    </button>
  );
}

// ── Helpers ──

function distance(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
