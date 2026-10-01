import { useCallback, useEffect, useRef, useState } from 'react';
import { createRace } from '../utils/race';
export function useRace() {
  const [race, setRace] = useState(null);
  const [clock, setClock] = useState(0);
  const started = useRef(0);
  const animationTime = useRef(0);
  const logicalClock = useRef(0);
  const synchronizeClock = useCallback(() => setClock(logicalClock.current), []);
  const [paused, setPaused] = useState(false);
  const pausedAt = useRef(null);
  const pause = useCallback(() => {
    if (pausedAt.current !== null) return;
    pausedAt.current = performance.now();
    setClock(logicalClock.current);
    setPaused(true);
  }, []);
  const resume = useCallback(() => {
    if (pausedAt.current === null) return;
    started.current += performance.now() - pausedAt.current;
    pausedAt.current = null;
    setPaused(false);
  }, []);
  useEffect(() => {
    const hidden = () => { if (document.hidden && race && logicalClock.current < race.duration + 4.8) pause(); };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, [race, pause]);
  useEffect(() => {
    if (!race || paused) return;
    let frame;
    let lastUpdate = -Infinity;
    const tick = now => {
      const seconds = (now - started.current) / 1000;
      logicalClock.current = seconds;
      animationTime.current = Math.max(0, seconds - 4);
      if (now - lastUpdate >= 50 || seconds >= race.duration + 4.8) {
        setClock(seconds);
        lastUpdate = now;
      }
      if (seconds < race.duration + 4.8) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [race, paused]);
  const elapsed = Math.max(0, clock - 4);
  const state = !race ? 'setup' : clock < 4 ? 'countdown' : elapsed >= race.duration + 0.8 ? 'results' : elapsed >= race.runners[0].finishTime ? 'finished' : elapsed >= race.duration * 0.75 ? 'finalStretch' : 'racing';
  return {
    race,
    animationTime,
    synchronizeClock,
    paused, pause, resume,
    elapsed,
    state,
    countdown: clock < 3 ? 3 - Math.floor(clock) : 'GO!',
    start(employees, duration, settings, random) {
      const next = createRace(employees, duration, settings, random);
      pausedAt.current = null;
      setPaused(false);
      started.current = performance.now();
      setClock(0);
      logicalClock.current = 0;
      animationTime.current = 0;
      setRace(next);
    },
    reset() {
      pausedAt.current = null;
      setPaused(false);
      setRace(null);
      setClock(0);
      logicalClock.current = 0;
      animationTime.current = 0;
    }
  };
}
