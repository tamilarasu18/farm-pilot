"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { Point } from "@/lib/types";
import {
  traceBoundaryPath,
  calculateCurvedArea,
  drawGrid,
} from "./canvas-utils";

interface LandCanvasProps {
  initialPoints: Point[];
  onPointsChange: (points: Point[]) => void;
  readonly?: boolean;
  width?: number;
  height?: number;
}

type Tool = "draw" | "select";

export default function LandCanvas({
  initialPoints,
  onPointsChange,
  readonly = false,
  width = 800,
  height = 500,
}: LandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [tool, setTool] = useState<Tool>("draw");
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [history, setHistory] = useState<Point[][]>([initialPoints]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [globalCurve, setGlobalCurve] = useState(0);

  // Track whether changes come from inside (user interaction) vs outside (parent/server)
  const isInternalChange = useRef(false);
  const hasInitialized = useRef(false);

  // Sync when parent sends new initialPoints (e.g. initial load, cancel edit, revert)
  // Normalize: ensure every point has an explicit curve value (default 0)
  useEffect(() => {
    // Skip re-sync if this was triggered by our own onPointsChange call
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const normalized = initialPoints.map((p) => ({
      ...p,
      curve: p.curve ?? 0,
    }));
    setPoints(normalized);

    // Only compute globalCurve from loaded data on first mount
    // After that, globalCurve is purely user-controlled via the "All Corners" slider
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const curves = normalized
        .filter((p) => p.curve != null && p.curve > 0)
        .map((p) => p.curve!);
      if (curves.length > 0) {
        // If all points share the same curve, use that as global; otherwise start at 0
        const allSame = curves.length === normalized.length &&
          curves.every((c) => c === curves[0]);
        if (allSame) {
          setGlobalCurve(curves[0]);
        }
      }
    }
  }, [initialPoints]);

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
    ctx.fillStyle = "#0F1A14";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Grid
    drawGrid(
      ctx,
      canvasSize.width,
      canvasSize.height,
      30,
      readonly ? "rgba(46, 74, 57, 0.15)" : "rgba(46, 74, 57, 0.3)"
    );

    // Draw polygon fill
    if (points.length >= 3) {
      traceBoundaryPath(ctx, points, true);
      ctx.fillStyle = readonly
        ? "rgba(64, 145, 108, 0.2)"
        : "rgba(64, 145, 108, 0.15)";
      ctx.fill();
    }

    // Draw edges
    if (points.length >= 2) {
      traceBoundaryPath(ctx, points, points.length >= 3);
      ctx.strokeStyle = readonly
        ? "rgba(64, 145, 108, 1)"
        : "rgba(64, 145, 108, 0.8)";
      ctx.lineWidth = readonly ? 2.5 : 2;
      ctx.stroke();
    }

    // Draw points (only when editing)
    if (!readonly) {
      points.forEach((point, i) => {
        const isSelected = selectedPoint === i;
        const isHovered = hoveredPoint === i;
        const curvePct = point.curve ?? 0;
        const hasCustomCurve = curvePct > 0;
        const radius = isSelected ? 10 : isHovered ? 8 : 6;

        // Selection glow ring (animated feel)
        if (isSelected) {
          // Outer pulsing glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + 12, 0, Math.PI * 2);
          ctx.fillStyle = hasCustomCurve
            ? "rgba(212, 163, 115, 0.08)"
            : "rgba(64, 145, 108, 0.08)";
          ctx.fill();

          // Mid glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + 7, 0, Math.PI * 2);
          ctx.fillStyle = hasCustomCurve
            ? "rgba(212, 163, 115, 0.12)"
            : "rgba(64, 145, 108, 0.12)";
          ctx.fill();

          // Curve percentage arc indicator around selected point
          if (hasCustomCurve) {
            const arcAngle = (curvePct / 100) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(
              point.x,
              point.y,
              radius + 5,
              -Math.PI / 2,
              -Math.PI / 2 + arcAngle
            );
            ctx.strokeStyle = "rgba(212, 163, 115, 0.7)";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.stroke();

            // Background ring
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(212, 163, 115, 0.15)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else if (isHovered) {
          // Hover glow
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(64, 145, 108, 0.15)";
          ctx.fill();
        }

        // Curve indicator ring for non-selected curved points
        if (hasCustomCurve && !isSelected) {
          // Arc showing curve percentage
          const arcAngle = (curvePct / 100) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(
            point.x,
            point.y,
            radius + 3,
            -Math.PI / 2,
            -Math.PI / 2 + arcAngle
          );
          ctx.strokeStyle = "rgba(212, 163, 115, 0.5)";
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.stroke();

          // Background ring
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius + 3, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(212, 163, 115, 0.12)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Point fill
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "#D4A373"
          : isHovered
          ? "#66BB6A"
          : hasCustomCurve
          ? "#B07D4F"
          : "#40916C";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Point label number
        ctx.fillStyle = isSelected ? "white" : "rgba(232, 245, 233, 0.9)";
        ctx.font = `${isSelected ? "bold " : ""}${
          isSelected ? 12 : 11
        }px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${i + 1}`, point.x, point.y);

        // Show curve % near hovered (non-selected) curved points
        if (isHovered && !isSelected && hasCustomCurve) {
          ctx.fillStyle = "rgba(212, 163, 115, 0.9)";
          ctx.font = "bold 10px sans-serif";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(`${curvePct}%`, point.x, point.y - radius - 8);
        }
      });
    }

    // Hint text
    if (!readonly && tool === "draw" && points.length === 0) {
      ctx.fillStyle = "rgba(165, 214, 167, 0.5)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Click to place vertices of your land boundary",
        canvasSize.width / 2,
        canvasSize.height / 2
      );
    }

    // Locked indicator
    if (readonly && points.length >= 3) {
      ctx.fillStyle = "rgba(165, 214, 167, 0.35)";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(
        "🔒 Boundary Saved",
        canvasSize.width - 16,
        canvasSize.height - 16
      );
    }
  }, [points, selectedPoint, hoveredPoint, tool, canvasSize, readonly]);

  useEffect(() => {
    draw();
  }, [draw]);

  const pixelArea = calculateCurvedArea(points);

  const getCanvasPos = (e: ReactMouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const findPointAt = (pos: Point): number | null => {
    for (let i = 0; i < points.length; i++) {
      const dx = pos.x - points[i].x;
      const dy = pos.y - points[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < 12) return i;
    }
    return null;
  };

  const pushHistory = (newPoints: Point[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPoints.map((p) => ({ ...p })));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleMouseDown = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    const pos = getCanvasPos(e);
    const pointIndex = findPointAt(pos);

    if (tool === "draw") {
      if (pointIndex !== null) {
        setSelectedPoint(pointIndex);
        setIsDragging(true);
      } else {
        const newPoint: Point = { ...pos, curve: 0 };
        const newPoints = [...points, newPoint];
        setPoints(newPoints);
        isInternalChange.current = true;
        onPointsChange(newPoints);
        pushHistory(newPoints);
      }
    } else if (tool === "select") {
      if (pointIndex !== null) {
        setSelectedPoint(pointIndex);
        setIsDragging(true);
      } else {
        setSelectedPoint(null);
      }
    }
  };

  const handleMouseMove = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    const pos = getCanvasPos(e);

    if (isDragging && selectedPoint !== null) {
      const newPoints = [...points];
      newPoints[selectedPoint] = { ...newPoints[selectedPoint], ...pos };
      setPoints(newPoints);
      isInternalChange.current = true;
      onPointsChange(newPoints);
    } else {
      setHoveredPoint(findPointAt(pos));
    }
  };

  const handleMouseUp = () => {
    if (readonly) return;
    if (isDragging && selectedPoint !== null) {
      pushHistory([...points]);
    }
    setIsDragging(false);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevPoints = history[newIndex].map((p) => ({ ...p }));
      setPoints(prevPoints);
      isInternalChange.current = true;
      onPointsChange(prevPoints);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextPoints = history[newIndex].map((p) => ({ ...p }));
      setPoints(nextPoints);
      isInternalChange.current = true;
      onPointsChange(nextPoints);
    }
  };

  const clearAll = () => {
    setPoints([]);
    setSelectedPoint(null);
    isInternalChange.current = true;
    onPointsChange([]);
    pushHistory([]);
  };

  const deleteSelected = () => {
    if (selectedPoint !== null) {
      const newPoints = points.filter((_, i) => i !== selectedPoint);
      setPoints(newPoints);
      setSelectedPoint(null);
      isInternalChange.current = true;
      onPointsChange(newPoints);
      pushHistory(newPoints);
    }
  };

  const handleGlobalCurveChange = (value: number) => {
    setGlobalCurve(value);
    // Update all points to use the new global curve
    const newPoints = points.map((p) => ({ ...p, curve: value }));
    setPoints(newPoints);
    isInternalChange.current = true;
    onPointsChange(newPoints);
  };

  const handleVertexCurveChange = (index: number, value: number) => {
    const newPoints = [...points];
    newPoints[index] = { ...newPoints[index], curve: value };
    setPoints(newPoints);
    isInternalChange.current = true;
    onPointsChange(newPoints);
  };

  const selectedVertexCurve =
    selectedPoint !== null ? points[selectedPoint]?.curve ?? 0 : null;

  // Calculate floating panel position
  const getFloatingPanelPos = () => {
    if (selectedPoint === null || !points[selectedPoint]) return null;
    const p = points[selectedPoint];
    // Position the panel to the right of the point, or left if too close to edge
    const panelWidth = 260;
    const panelHeight = 180;
    const offset = 30;

    let x = p.x + offset;
    let y = p.y - panelHeight / 2;

    // Flip to left if too close to right edge
    if (x + panelWidth > canvasSize.width - 10) {
      x = p.x - offset - panelWidth;
    }
    // Keep within vertical bounds
    if (y < 10) y = 10;
    if (y + panelHeight > canvasSize.height - 10) {
      y = canvasSize.height - panelHeight - 10;
    }

    return { x, y };
  };

  const floatingPos = getFloatingPanelPos();

  return (
    <div className="space-y-3">
      {/* Toolbar — only shown when editing */}
      {!readonly && (
        <div
          className="flex flex-wrap items-center gap-2 p-3 rounded-xl"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Tool buttons */}
          <div className="flex gap-1">
            {(["draw", "select"] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={`btn btn-sm ${
                  tool === t ? "btn-primary" : "btn-ghost"
                }`}
                id={`tool-${t}`}
              >
                {t === "draw" ? "✏️ Draw" : "👆 Select"}
              </button>
            ))}
          </div>

          <div
            className="w-px h-6 mx-1"
            style={{ background: "var(--border)" }}
          />

          {/* Actions */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="btn btn-ghost btn-sm"
            title="Undo"
          >
            ↩️
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="btn btn-ghost btn-sm"
            title="Redo"
          >
            ↪️
          </button>
          <button
            onClick={deleteSelected}
            disabled={selectedPoint === null}
            className="btn btn-ghost btn-sm"
            title="Delete selected"
          >
            🗑️
          </button>
          <button
            onClick={clearAll}
            className="btn btn-ghost btn-sm"
            title="Clear all"
          >
            🔄 Clear
          </button>

          <div
            className="w-px h-6 mx-1"
            style={{ background: "var(--border)" }}
          />

          {/* Global curvature slider — rounds ALL corners */}
          <div className="flex items-center gap-2">
            <span
              className="text-xs whitespace-nowrap"
              style={{ color: "var(--text-muted)" }}
            >
              🌊 All Corners
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={globalCurve}
              onChange={(e) =>
                handleGlobalCurveChange(parseInt(e.target.value))
              }
              className="w-20 accent-[#40916C]"
              id="global-curve-slider"
              title={`Round all corners: ${globalCurve}%`}
            />
            <span
              className="text-xs font-mono w-8"
              style={{ color: "var(--text-muted)" }}
            >
              {globalCurve}%
            </span>
          </div>

          {/* Info */}
          <div className="flex-1" />
          <div
            className="text-xs flex items-center gap-3"
            style={{ color: "var(--text-muted)" }}
          >
            <span>📍 {points.length} vertices</span>
            <span>📐 {Math.round(pixelArea).toLocaleString()} px²</span>
          </div>
        </div>
      )}

      {/* Hint bar — show when points exist but none selected */}
      {!readonly && points.length >= 3 && selectedPoint === null && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs animate-fade-in"
          style={{
            background: "rgba(64, 145, 108, 0.06)",
            border: "1px solid rgba(64, 145, 108, 0.15)",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ fontSize: "16px" }}>💡</span>
          <span>
            <strong style={{ color: "var(--text-secondary)" }}>
              Click any point
            </strong>{" "}
            to select it and adjust its corner curve percentage
          </span>
        </div>
      )}

      {/* Readonly info bar */}
      {readonly && points.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
          style={{
            background: "rgba(64, 145, 108, 0.08)",
            border: "1px solid rgba(64, 145, 108, 0.2)",
          }}
        >
          <span
            className="text-sm"
            style={{ color: "var(--color-primary-light)" }}
          >
            🔒 Boundary is saved
          </span>
          <div className="flex-1" />
          <div
            className="text-xs flex items-center gap-3"
            style={{ color: "var(--text-muted)" }}
          >
            <span>📍 {points.length} vertices</span>
            <span>📐 {Math.round(pixelArea).toLocaleString()} px²</span>
          </div>
        </div>
      )}

      {/* Canvas + Floating Panel Container */}
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
            cursor: readonly
              ? "default"
              : tool === "draw"
              ? "crosshair"
              : hoveredPoint !== null
              ? "grab"
              : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* ── Floating Curve Control Panel ── */}
        {!readonly &&
          selectedPoint !== null &&
          selectedVertexCurve !== null &&
          floatingPos && (
            <div
              id="vertex-curve-panel"
              style={{
                position: "absolute",
                left: floatingPos.x,
                top: floatingPos.y,
                width: 250,
                zIndex: 10,
                pointerEvents: "auto",
                animation: "scaleIn 0.2s ease-out forwards",
              }}
            >
              <div
                style={{
                  background: "rgba(15, 26, 20, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(212, 163, 115, 0.35)",
                  borderRadius: 14,
                  padding: "16px",
                  boxShadow:
                    "0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(212, 163, 115, 0.08)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  {/* Radial gauge */}
                  <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      {/* Background ring */}
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="rgba(212, 163, 115, 0.12)"
                        strokeWidth="3"
                      />
                      {/* Progress arc */}
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="#D4A373"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${
                          (selectedVertexCurve / 100) * 2 * Math.PI * 16
                        } ${2 * Math.PI * 16}`}
                        transform="rotate(-90 20 20)"
                        style={{
                          transition: "stroke-dasharray 0.2s ease-out",
                        }}
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 11,
                        color: "#D4A373",
                      }}
                    >
                      {selectedPoint + 1}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E8F5E9",
                        lineHeight: 1.2,
                      }}
                    >
                      Point {selectedPoint + 1} Curve
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(165, 214, 167, 0.5)",
                        marginTop: 2,
                      }}
                    >
                      Corner roundness
                    </div>
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setSelectedPoint(null)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "none",
                      borderRadius: 6,
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "rgba(165, 214, 167, 0.5)",
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                    title="Deselect point"
                  >
                    ✕
                  </button>
                </div>

                {/* Slider */}
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        width: 18,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      📐
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedVertexCurve}
                      onChange={(e) =>
                        handleVertexCurveChange(
                          selectedPoint,
                          parseInt(e.target.value)
                        )
                      }
                      style={{
                        flex: 1,
                        accentColor: "#D4A373",
                        height: 6,
                      }}
                      id="vertex-curve-slider"
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "#D4A373",
                        minWidth: 40,
                        textAlign: "right",
                      }}
                    >
                      {selectedVertexCurve}%
                    </span>
                  </div>
                </div>

                {/* Quick preset buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginBottom: 10,
                  }}
                >
                  {[0, 25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() =>
                        handleVertexCurveChange(selectedPoint, v)
                      }
                      style={{
                        flex: 1,
                        padding: "5px 0",
                        fontSize: 11,
                        fontWeight: selectedVertexCurve === v ? 700 : 500,
                        background:
                          selectedVertexCurve === v
                            ? "rgba(212, 163, 115, 0.2)"
                            : "rgba(255,255,255,0.04)",
                        color:
                          selectedVertexCurve === v
                            ? "#D4A373"
                            : "rgba(165, 214, 167, 0.5)",
                        border:
                          selectedVertexCurve === v
                            ? "1px solid rgba(212, 163, 115, 0.4)"
                            : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 6,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {v}%
                    </button>
                  ))}
                </div>

                {/* Reset to global */}
                <button
                  onClick={() =>
                    handleVertexCurveChange(selectedPoint, globalCurve)
                  }
                  style={{
                    width: "100%",
                    padding: "6px 0",
                    fontSize: 11,
                    fontWeight: 500,
                    background: "rgba(64, 145, 108, 0.08)",
                    color: "rgba(165, 214, 167, 0.5)",
                    border: "1px solid rgba(64, 145, 108, 0.15)",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  title="Reset to global curve"
                >
                  ↺ Reset to global ({globalCurve}%)
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
