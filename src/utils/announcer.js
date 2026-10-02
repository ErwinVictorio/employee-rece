// Receives only current samples; never reads predetermined race order.
export function createAnnouncerDetector() {
  let raceId, previous = null, candidate = null, pending = null, last = -Infinity, winner = false;
  const seen = new Set();
  const valid = (event, rows) => event.kind === 'winner' ? rows[0]?.progress >= 1 && rows[0].employee.id === event.id
    : event.kind === 'comeback' ? rows.some(r => r.employee.id === event.id && r.pose === 'comeback')
      : rows[event.kind === 'lead' ? 0 : 1]?.employee.id === event.id;
  return {
    retryWinner() { winner = false; },
    tick({ id, elapsed, rows, active, busy = false }) {
      if (raceId !== id) { raceId = id; previous = null; candidate = pending = null; last = -Infinity; winner = false; seen.clear(); }
      if (!active) { previous = null; candidate = pending = null; return null; }
      if (!winner && rows[0]?.progress >= 1) {
        winner = true; pending = null;
        return { kind: 'winner', id: rows[0].employee.id, text: `${rows[0].employee.name} wins!` };
      }
      if (winner) return null;
      if (pending && (!valid(pending, rows) || elapsed - pending.at > 3)) pending = null;
      const ids = rows.map(r => r.employee.id);
      if (!previous) { previous = ids; return null; }
      let next;
      for (const [index, kind, suffix] of [[0, 'lead', 'takes the lead!'], [1, 'second', 'moves into second place!']]) {
        const r = rows[index];
        const ahead = index === 0 || rows[index - 1].progress - r?.progress > .001;
        const behind = !rows[index + 1] || r?.progress - rows[index + 1].progress > .001;
        if (r && previous[index] !== ids[index] && ahead && behind && r.progress > .001) {
          next = { kind, id: r.employee.id, text: `${r.employee.name} ${suffix}` }; break;
        }
      }
      const comeback = rows.find(r => r.pose === 'comeback' && !seen.has(r.event?.id));
      if (!next && comeback?.event) next = { kind: 'comeback', id: comeback.employee.id, key: comeback.event.id, text: `${comeback.employee.name} is making a comeback!` };
      if (next) {
        if (candidate?.id !== next.id || candidate?.kind !== next.kind) candidate = { ...next, since: elapsed };
        if (elapsed - candidate.since >= .4) {
          pending = { ...next, at: elapsed }; previous = ids; candidate = null;
          if (next.key) seen.add(next.key);
        }
      } else { previous = ids; candidate = null; }
      if (pending && !busy && elapsed - last >= 6) { const event = pending; pending = null; last = elapsed; return event; }
      return null;
    },
  };
}

export function createSpeechPlayer({ synth, Utterance, change, schedule = setTimeout, unschedule = clearTimeout }) {
  let generation = 0, timer, active = false, discard, currentUtterance = null;
  function cancel() {
    generation++; unschedule(timer); active = false;
    discard?.(); discard = null;
    synth?.cancel(); change({ speaking: false, caption: '' });
    currentUtterance = null;
  }
  function say(text, { voice, volume = .8, silent = false, onDiscarded, isRelevant = () => true } = {}) {
    cancel(); const token = generation; active = true;
    discard = onDiscarded;
    const finish = () => { if (token !== generation) return; unschedule(timer); active = false; currentUtterance = null; discard = null; change({ speaking: false, caption: '' }); };
    const fallback = (reason = 'speech-timeout') => {
      if (token !== generation) return;
      unschedule(timer); generation++; const fallbackToken = generation;
      discard = null;
      synth?.cancel(); currentUtterance = null;
      change({ speaking: false, caption: text, status: `Speech unavailable (${reason}) — captions only. Tap Test Voice / Enable voice to retry.` });
      timer = schedule(() => { if (generation === fallbackToken) { active = false; change({ caption: '' }); } }, 4000);
    };
    if (!synth || !Utterance) { fallback('not-supported'); return; }
    const utterance = new Utterance(text);
    currentUtterance = utterance;
    // An empty getVoices() list can be temporary on mobile. Let the device
    // resolve its default voice instead of refusing to speak.
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US'; utterance.volume = silent ? 0 : volume; utterance.rate = 1.05;
    utterance.onstart = () => {
      if (token !== generation) return;
      if (!isRelevant()) { cancel(); return; }
      discard = null;
      unschedule(timer); change({ speaking: !silent, caption: silent ? '' : text, status: '' });
      timer = schedule(fallback, 15000);
    };
    utterance.onend = finish; utterance.onerror = event => fallback(event?.error || 'synthesis-failed');
    timer = schedule(() => fallback('start-timeout'), 10000);
    try { if (synth.paused) synth.resume(); synth.speak(utterance); } catch { fallback('speak-failed'); }
  }
  return { say, cancel, get busy() { return active; }, get utterance() { return currentUtterance; } };
}
