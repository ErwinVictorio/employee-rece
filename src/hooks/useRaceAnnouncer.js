import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAnnouncerDetector, createSpeechPlayer } from '../utils/announcer';
import { sampleRunner } from '../utils/raceMotion';

export function useRaceAnnouncer(game, muted) {
  const [enabled, setEnabled] = useState(true);
  const [volume, setVolume] = useState(.8);
  const [voices, setVoices] = useState([]);
  const [voiceId, setVoiceId] = useState('');
  const [output, setOutput] = useState({ speaking: false, caption: '', status: '' });
  const player = useRef(null);
  const startingVoice = useRef(false);
  const liveRows = useRef([]);
  const detector = useMemo(() => createAnnouncerDetector(), []);
  const voice = voices.find(v => v.voiceURI === voiceId) || voices.find(v => v.localService && /^en/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0];
  useEffect(() => {
    const synth = window.speechSynthesis;
    player.current = createSpeechPlayer({ synth, Utterance: window.SpeechSynthesisUtterance, change: update => setOutput(old => ({ ...old, ...update })) });
    const load = () => setVoices([...(synth?.getVoices() || [])]);
    load(); synth?.addEventListener('voiceschanged', load);
    const hidden = () => { if (document.hidden) player.current?.cancel(); };
    document.addEventListener('visibilitychange', hidden);
    return () => { player.current?.cancel(); player.current = null; synth?.removeEventListener('voiceschanged', load); document.removeEventListener('visibilitychange', hidden); };
  }, []);
  const cancel = useCallback(() => player.current?.cancel(), []);
  const { race, state, elapsed, paused } = game;
  useEffect(() => {
    if (!race?.id || !startingVoice.current) cancel();
    startingVoice.current = false;
  }, [race?.id, cancel]);
  useEffect(() => { cancel(); }, [paused, enabled, muted, volume, voiceId, cancel]);
  useEffect(() => { if (state === 'countdown') cancel(); }, [state, cancel]);
  useEffect(() => {
    const active = !!race && enabled && !muted && volume > 0 && !paused && !document.hidden && ['racing', 'finalStretch', 'finished', 'results'].includes(state);
    const rows = active ? race.runners.map(r => ({ ...r, ...sampleRunner(r, elapsed) })).sort((a, b) => b.progress - a.progress || a.finishTime - b.finishTime) : [];
    liveRows.current = rows;
    const event = detector.tick({ id: race?.id, elapsed, rows, active, busy: player.current?.busy });
    if (event) player.current?.say(event.text, { voice, volume, onDiscarded: event.kind === 'winner' ? () => detector.retryWinner() : undefined,
      isRelevant: () => event.kind === 'comeback' ? liveRows.current.some(r => r.employee.id === event.id && r.pose === 'comeback') : liveRows.current[event.kind === 'second' ? 1 : 0]?.employee.id === event.id,
    });
  }, [race, elapsed, state, paused, enabled, muted, volume, voice, detector]);
  const prepare = () => {
    cancel();
    startingVoice.current = true;
    if (enabled && !muted && volume > 0) player.current?.say('Announcer ready.', { voice, volume });
  };
  return { enabled, setEnabled, volume, setVolume, voices, voiceId: voice?.voiceURI || '', setVoiceId,
    ...output, status: output.status || (!voices.length ? 'Voice list is loading or unavailable. Test Voice will try the device default.' : ''),
    cancel, prepare, test: () => player.current?.say('Welcome, racers! Your race announcer is ready.', { voice, volume }),
    canTest: enabled && !muted && volume > 0,
  };
}
