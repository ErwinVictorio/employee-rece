import { EVENT_TIMING, isOpening } from './eventTimeline.js';
const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export function eventLayout(count, venue = 'stadium') {
  const columns = Math.min(10, Math.max(2, Math.ceil(Math.sqrt(count * 2))));
  const rows = Math.ceil(count / columns);
  const stageX = (venue === 'company-grounds' ? -46 : -42) - Math.max(0, rows - 5) * 3.2;
  return { stageX, columns, rows, count, width: Math.max(34, columns * 3.2 + 4),
    xMin: stageX - 4, xMax: stageX + 13 + (rows - 1) * 3.2 };
}
export function gatheringPosition(lane, event) {
  return { x: event.stageX + 9 + Math.floor(lane / event.columns) * 3.2, z: (lane % event.columns - (event.columns - 1) / 2) * 3.2 };
}
export function openingPosition(lane, laneZ, event, state, phaseTime, reduced = false) {
  const point = gatheringPosition(lane, event);
  if (state === 'arrival') return { x: point.x + 4 * (1 - (reduced ? 1 : smooth(phaseTime / EVENT_TIMING.arrival))), z: point.z, rotation: Math.PI };
  if (state === 'welcome') return { ...point, rotation: Math.PI };
  if (state === 'lineup') {
    // Expand into distinct lane z positions before converging on the start x.
    // Rows keep separate x coordinates during expansion, avoiding cross traffic.
    const t = reduced ? 1 : phaseTime / EVENT_TIMING.lineup;
    if (t >= 1) return { x: -10, z: laneZ, rotation: 0 };
    return { x: point.x + (-10 - point.x) * smooth((t - .55) / .45), z: point.z + (laneZ - point.z) * smooth(t / .55), rotation: 0 };
  }
  return { x: -10, z: laneZ, rotation: 0 };
}
export function runnerEventPosition(game, lane, z, event, reduced) {
  return isOpening(game?.state) ? openingPosition(lane, z, event, game.state, game.phaseTime, reduced) : null;
}
