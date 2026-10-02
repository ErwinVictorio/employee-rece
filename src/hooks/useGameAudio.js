import { useEffect, useRef } from 'react';
import countdown from '../assets/SoundEffects/transcendedlifting-race-start-beeps-125125.mp3';
import steps from '../assets/SoundEffects/freeeverythingxx-running-on-concrete-268478.mp3';
import crowd from '../assets/SoundEffects/vishiv-crowd-cheering-in-stadium-435357.mp3';
import success from '../assets/SoundEffects/freesound_community-success-1-6297.mp3';
export function useGameAudio(state, effects, ambience, game = {}) {
  const oscillators = useRef(new Set());
  const bank = useRef(null);
  const synth = useRef(null);
  const cues = useRef(new Set());
  const previous = useRef({ id: null, elapsed: 0 });
  const { race, elapsed = 0, paused = false } = game;
  useEffect(() => {
    const sounds = { countdown: new Audio(countdown), steps: new Audio(steps), crowd: new Audio(crowd), success: new Audio(success) };
    sounds.steps.loop = sounds.crowd.loop = true;
    sounds.steps.volume = .22;
    sounds.crowd.volume = .3;
    bank.current = sounds;
    return () => {
      Object.values(sounds).forEach(s => { s.pause(); s.src = ''; });
      bank.current = null;
      synth.current?.close();
      synth.current = null;
    };
  }, []);
  useEffect(() => {
    if (previous.current.id !== race?.id) {
      cues.current.clear();
      previous.current = { id: race?.id, elapsed: 0 };
      Object.values(bank.current || {}).forEach(s => { s.pause(); s.currentTime = 0; });
    }
    const active = ['racing', 'finalStretch', 'finished'].includes(state);
    for (const [key, sound] of Object.entries(bank.current || {})) {
      const oneShot = key === 'countdown' || key === 'success';
      const wanted = key === 'countdown' ? state === 'countdown' : key === 'success' ? state === 'results' : key === 'crowd' ? active || state === 'welcome' : active;
      const enabled = key === 'crowd' ? ambience : effects;
      const id = `${race?.id}:${key}`;
      const playback = `${id}:playing`;
      if (!wanted || !enabled || paused) cues.current.delete(playback);
      if (oneShot) {
        if (key === 'countdown' && wanted && enabled && !paused && !cues.current.has(playback)) {
          cues.current.add(playback);
          cues.current.add(id);
          sound.currentTime = Math.min(game.phaseTime || 0, Number.isFinite(sound.duration) ? Math.max(0, sound.duration - .01) : 4);
          sound.play().catch(() => {});
        } else if (wanted && !cues.current.has(id)) {
          cues.current.add(id);
          if (enabled && !paused) sound.play().catch(() => {});
        }
        if (!enabled || paused || !wanted) sound.pause();
      } else if (wanted && enabled && !paused) {
        if (sound.paused) sound.play().catch(() => {});
      } else sound.pause();
    }
    if (!effects || paused || state === 'setup') {
      oscillators.current.forEach(o => { o.stop(); o.disconnect(); });
      oscillators.current.clear();
      synth.current?.suspend().catch(() => {});
    }
    else synth.current?.resume().catch(() => {});
  }, [state, effects, ambience, paused, race?.id, game.phaseTime]);
  useEffect(() => {
    const last = previous.current.elapsed;
    for (const runner of race?.runners || []) for (const event of runner.events) {
      for (const stage of ['groundAt', 'comebackAt']) {
        const at = event[stage], id = `${race.id}:${event.id}:${stage}`;
        if (elapsed < at || cues.current.has(id)) continue;
        cues.current.add(id);
        if (!effects || paused || elapsed - last > .3 || elapsed - at > .2 || !synth.current) continue;
        const ctx = synth.current;
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(stage === 'groundAt' ? 260 : 420, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(stage === 'groundAt' ? 140 : 620, ctx.currentTime + .1);
        gain.gain.setValueAtTime(.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .12);
        oscillator.connect(gain).connect(ctx.destination);
        oscillators.current.add(oscillator);
        oscillator.start(); oscillator.stop(ctx.currentTime + .13);
        oscillator.onended = () => { oscillators.current.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      }
    }
    const grounded = race?.runners.filter(r => r.events.some(e => elapsed >= e.groundAt && elapsed < e.comebackAt)).length || 0;
    if (bank.current) bank.current.steps.volume = .22 * (1 - grounded / (race?.runners.length || 1));
    previous.current.elapsed = elapsed;
  }, [race, elapsed, effects, paused]);
  return () => {
    try {
      synth.current ||= new AudioContext();
      synth.current.resume().catch(() => {});
    } catch { /* A silent race remains available. */ }
    // Unlock synchronously; no unresolved play promise can hold up the UI or
    // later pause a countdown that has already started.
    for (const sound of Object.values(bank.current || {})) {
      sound.play().catch(() => {});
      sound.pause(); sound.currentTime = 0;
    }
  };
}
