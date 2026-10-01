// Stateless sampling keeps camera motion tied to race time through pause/retry.
export function followCameraBlend(elapsed, reducedMotion = false) {
  if (reducedMotion || elapsed <= 0) return 0;
  const t = Math.min(1, elapsed / 1.5);
  return t * t * (3 - 2 * t);
}

export function fieldCenter(positions) {
  return positions.length ? (Math.min(...positions) + Math.max(...positions)) / 2 : 0;
}
