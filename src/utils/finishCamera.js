export function finishCameraBlend(elapsed, duration, reducedMotion = false) {
  if (!duration || elapsed < duration * .75) return 0;
  if (reducedMotion) return 1;
  const t = Math.min(1, (elapsed - duration * .75) / .8);
  return t * t * (3 - 2 * t);
}
