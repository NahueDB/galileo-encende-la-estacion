export type FlightRect = { left: number; top: number; right: number; bottom: number };
export type FlightPoint = { x: number; y: number };
export function overlaps(a: FlightRect, b: FlightRect, padding = 3) {
  return (
    a.left < b.right + padding &&
    a.right > b.left - padding &&
    a.top < b.bottom + padding &&
    a.bottom > b.top - padding
  );
}
// Prefer nearby empty space; never park over text, code, or an interactive element.
export function findGaliLanding(
  anchor: FlightRect,
  obstacles: FlightRect[],
  viewport: { width: number; height: number },
  size: { width: number; height: number },
  preferInside = false,
): FlightPoint | null {
  const { width: w, height: h } = size,
    gap = 10;
  const clamp = (p: FlightPoint) => ({
    x: Math.max(4, Math.min(viewport.width - w - 4, p.x)),
    y: Math.max(6, Math.min(viewport.height - h - 6, p.y)),
  });
  const center = (anchor.left + anchor.right - w) / 2;
  const inside = [
    { x: anchor.left + 12, y: anchor.top + 24 },
    { x: anchor.right - w - 12, y: anchor.top + 40 },
    { x: anchor.right - w - 12, y: anchor.bottom - h - 8 },
  ];
  const candidates = [
    ...(preferInside ? inside : []),
    { x: center, y: anchor.top - h - gap },
    { x: anchor.left - w - gap, y: anchor.top + 12 },
    { x: anchor.right + gap, y: anchor.top + 12 },
    { x: anchor.right + 96, y: anchor.top - 22 },
    ...(!preferInside ? inside : []),
    { x: center, y: anchor.bottom + gap },
    ...Array.from({ length: 9 }, (_, i) => [
      { x: 4, y: anchor.top - 40 + i * 30 },
      { x: viewport.width - w - 4, y: anchor.top - 40 + i * 30 },
    ]).flat(),
  ];
  if (viewport.width < w + 8 || viewport.height < h + 12) return null;
  for (const raw of candidates) {
    const point = clamp(raw);
    const rect = { left: point.x, top: point.y, right: point.x + w, bottom: point.y + h };
    if (!obstacles.some((block) => overlaps(rect, block))) return point;
  }
  return null;
}
export function flightKeyframes(from: FlightPoint, to: FlightPoint) {
  const bend = Math.min(76, Math.hypot(to.x - from.x, to.y - from.y) * 0.16);
  return [
    { transform: `translate3d(${from.x}px,${from.y}px,0)` },
    {
      transform: `translate3d(${(from.x + to.x) / 2}px,${Math.max(6, (from.y + to.y) / 2 - bend)}px,0)`,
      offset: 0.5,
    },
    { transform: `translate3d(${to.x}px,${to.y}px,0)` },
  ];
}
