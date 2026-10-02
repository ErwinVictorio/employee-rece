export const EVENT_TIMING = Object.freeze({ arrival: 3, welcome: 10, lineup: 3, countdown: 4 });
export const EVENT_BOUNDARIES = Object.freeze({ welcome: 3, lineup: 13, countdown: 16, racing: 20 });
export const isOpening = state => ['arrival', 'welcome', 'lineup'].includes(state);
export const isPreRace = state => isOpening(state) || ['setup', 'countdown'].includes(state);

export function eventPhase(clock) {
  let state = 'arrival', start = 0;
  for (const [phase, boundary] of Object.entries(EVENT_BOUNDARIES)) {
    if (clock >= boundary) { state = phase; start = boundary; }
  }
  return { state, phaseTime: Math.max(0, clock - start), elapsed: Math.max(0, clock - EVENT_BOUNDARIES.racing),
    welcomeRemaining: Math.max(0, Math.min(10, Math.ceil(EVENT_BOUNDARIES.lineup - clock))),
    countdown: clock < EVENT_BOUNDARIES.countdown + 3 ? 3 - Math.floor(clock - EVENT_BOUNDARIES.countdown) : 'GO!' };
}

// Render every opening boundary even after a slow frame; never skip the welcome
// or countdown because assets compiled or a browser stopped delivering frames.
export function advanceEventClock(clock, delta, ready = true, paused = false) {
  if (!ready || paused) return clock;
  const boundary = Object.values(EVENT_BOUNDARIES).find(time => time > clock);
  return Math.min(clock + Math.max(0, delta), boundary ?? Infinity);
}
