import type { Point } from "@/lib/types";

/**
 * Linearly interpolate between two points.
 */
export function lerp(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/**
 * Trace the boundary path with rounded corners at each vertex.
 *
 * For each vertex with curve > 0:
 *  - Find the entry point (on the incoming edge, near the vertex)
 *  - Find the exit point (on the outgoing edge, near the vertex)
 *  - Draw a quadratic Bézier from entry → vertex (control) → exit
 */
export function traceBoundaryPath(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  close: boolean
) {
  const n = points.length;
  if (n < 2) return;

  ctx.beginPath();

  if (!close || n < 3) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < n; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    return;
  }

  // Closed path: round each vertex corner based on its curve value
  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const curvePct = curr.curve ?? 0;

    if (curvePct <= 0) {
      if (i === 0) {
        ctx.moveTo(curr.x, curr.y);
      } else {
        ctx.lineTo(curr.x, curr.y);
      }
    } else {
      const fraction = (curvePct / 100) * 0.5;
      const entry = lerp(curr, prev, fraction);
      const exit = lerp(curr, next, fraction);

      if (i === 0) {
        ctx.moveTo(entry.x, entry.y);
      } else {
        ctx.lineTo(entry.x, entry.y);
      }

      ctx.quadraticCurveTo(curr.x, curr.y, exit.x, exit.y);
    }
  }

  // Close: connect back to first vertex
  const firstCurve = points[0].curve ?? 0;
  if (firstCurve > 0) {
    const fraction = (firstCurve / 100) * 0.5;
    const entry = lerp(points[0], points[n - 1], fraction);
    ctx.lineTo(entry.x, entry.y);
  } else {
    ctx.lineTo(points[0].x, points[0].y);
  }

  ctx.closePath();
}

/**
 * Draw a simple polygon path (no curve support — for sections).
 */
export function traceSimplePath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  close: boolean
) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  if (close && points.length >= 3) {
    ctx.closePath();
  }
}

/**
 * Calculate the area of a polygon using the shoelace formula.
 * Works for both simple {x,y} arrays and Point arrays with curve support.
 */
export function calculatePolygonArea(
  points: { x: number; y: number }[]
): number {
  const n = points.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

/**
 * Approximate area of a polygon with curved corners by linearizing curves.
 */
export function calculateCurvedArea(points: Point[]): number {
  const n = points.length;
  if (n < 3) return 0;

  const linearized: { x: number; y: number }[] = [];
  const SEGMENTS = 12;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];
    const curvePct = curr.curve ?? 0;

    if (curvePct <= 0) {
      linearized.push({ x: curr.x, y: curr.y });
    } else {
      const fraction = (curvePct / 100) * 0.5;
      const entry = lerp(curr, prev, fraction);
      const exit = lerp(curr, next, fraction);

      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        const x =
          (1 - t) * (1 - t) * entry.x +
          2 * (1 - t) * t * curr.x +
          t * t * exit.x;
        const y =
          (1 - t) * (1 - t) * entry.y +
          2 * (1 - t) * t * curr.y +
          t * t * exit.y;
        linearized.push({ x, y });
      }
    }
  }

  return calculatePolygonArea(linearized);
}

/**
 * Calculate the centroid (geometric center) of a polygon.
 */
export function getPolygonCentroid(
  points: { x: number; y: number }[]
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };

  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / points.length, y: cy / points.length };
}

/**
 * Check if a point is inside a polygon using ray-casting.
 */
export function isPointInPolygon(
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean {
  const n = polygon.length;
  if (n < 3) return false;

  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Draw a grid background on the canvas.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 30,
  color: string = "rgba(46, 74, 57, 0.3)"
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
