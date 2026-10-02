export const LANE_SPACING = 3.2;
export function laneZ(lane, count) { return (lane - (count - 1) / 2) * LANE_SPACING; }
export function courseLayout(employees) {
  const laneCount = Math.max(2, employees.length);
  return { laneCount, spacing: LANE_SPACING, halfWidth: laneCount * LANE_SPACING / 2,
    xMin: -13, xMax: 13, zById: new Map(employees.map((e, i) => [e.id, laneZ(i, laneCount)])), lanes: new Map(employees.map((e, i) => [e.id, i])) };
}
export function rollingWindow(count, width, elapsed, finalStretchAt, manualLane = null) {
  const visible = Math.min(count, width < 700 ? 4 : 8);
  const half = (visible - 1) / 2;
  const t = Math.max(0, Math.min(1, elapsed / Math.max(1, finalStretchAt - 2)));
  const center = manualLane === null ? half + (count - visible) * (1 - Math.cos(Math.PI * t)) / 2
    : Math.max(half, Math.min(count - 1 - half, manualLane));
  return { center, visible, first: center - half, last: center + half, z: laneZ(center, count) };
}
export function safeViewport(width) {
  return width > 700 ? { left: 290, right: 20, top: 110, bottom: 65 }
    : { left: 12, right: 12, top: 85, bottom: 190 };
}
export function cinematicViewport(width) {
  return { left: 20, right: 20, top: width > 700 ? 85 : 90, bottom: 165 };
}
