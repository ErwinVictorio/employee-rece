export function finishCameraBlend(elapsed, duration, reducedMotion = false, start = duration * .75) {
  if (!duration || elapsed < start) return 0;
  if (reducedMotion) return 1;
  const t = Math.min(1, (elapsed - start) / .8);
  return t * t * (3 - 2 * t);
}
