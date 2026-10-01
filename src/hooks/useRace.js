import { useCallback, useEffect, useRef, useState } from 'react';
import { createRace } from '../utils/race';
export function useRace(onWinner) {
  const [race, setRace] = useState(null);
  const preparation = useRef(null);
  const generation = useRef(0);
  const [preparing, setPreparing] = useState(false);
  useEffect(() => () => { preparation.current?.cancel(); }, []);
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
  const state = !race ? 'setup' : clock < 4 ? 'countdown' : elapsed >= race.duration + 0.8 ? 'results' : elapsed >= race.runners[0].finishTime ? 'finished' : elapsed >= race.finalStretchAt ? 'finalStretch' : 'racing';
  const recordedRace = useRef(null);
  useEffect(() => {
    if ((state === 'finished' || state === 'results') && recordedRace.current !== race.id) {
      recordedRace.current = race.id;
      onWinner?.(race.order[0]);
    }
  }, [state, race, onWinner]);
  return {
    race,
    animationTime,
    synchronizeClock,
    paused, pause, resume,
    elapsed,
    state,
    preparing,
    countdown: clock < 3 ? 3 - Math.floor(clock) : 'GO!',
    async start(employees, duration, settings, random) {
      const version = ++generation.current;
      preparation.current?.cancel();
      setPreparing(true);
      let next;
      try {
        next = employees.length <= 12 || random ? createRace(employees, duration, settings, random) : await new Promise((resolve, reject) => {
          const worker = new Worker(new URL('../utils/raceWorker.js', import.meta.url), { type: 'module' });
          const finish = () => { worker.terminate(); preparation.current = null; };
          preparation.current = { cancel: () => { finish(); resolve(null); } };
          worker.onmessage = ({ data }) => { finish(); if (data.error) reject(new Error(data.error)); else resolve(data.race); };
          worker.onerror = () => { finish(); reject(new Error('Race preparation failed. Please try again.')); };
          worker.postMessage({ employees, duration, settings });
        });
      } finally { if (version === generation.current) setPreparing(false); }
      if (!next || version !== generation.current) return;
      // Structured cloning from the worker does not preserve Object.freeze.
      next.order.forEach(Object.freeze);
      next.runners.forEach(runner => {
        runner.events.forEach(Object.freeze); Object.freeze(runner.events);
        Object.freeze(runner.motionPlan.points); Object.freeze(runner.motionPlan.velocities);
        Object.freeze(runner.motionPlan); Object.freeze(runner.employee); Object.freeze(runner);
      });
      Object.freeze(next.order); Object.freeze(next.runners); Object.freeze(next.settings); Object.freeze(next);
      pausedAt.current = null;
      setPaused(false);
      started.current = performance.now();
      setClock(0);
      logicalClock.current = 0;
      animationTime.current = 0;
      setRace(next);
    },
    reset() {
      generation.current++;
      preparation.current?.cancel();
      setPreparing(false);
      pausedAt.current = null;
      setPaused(false);
      setRace(null);
      setClock(0);
      logicalClock.current = 0;
      animationTime.current = 0;
    }
  };
}
