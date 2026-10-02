import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnnouncerDetector, createSpeechPlayer } from '../src/utils/announcer.js';
const row = (id, progress, extra = {}) => ({ employee: { id, name: id }, progress, ...extra });
test('stable overtakes, cooldown, stale pending calls, winner once and replay', () => {
  const detector = createAnnouncerDetector();
  const tick = (elapsed, rows, extra = {}) => detector.tick({ id: 'race', elapsed, rows, active: true, ...extra });
  assert.equal(tick(0, [row('A', 0), row('B', 0)]), null);
  assert.equal(tick(1, [row('B', .1), row('A', .09)]), null);
  assert.equal(tick(1.5, [row('B', .12), row('A', .1)]).text, 'B takes the lead!');
  tick(2, [row('A', .2), row('B', .19)]);
  assert.equal(tick(2.5, [row('A', .22), row('B', .2)]), null);
  assert.equal(tick(8, [row('B', .8), row('A', .7)]), null, 'expired pending lead is not spoken');
  assert.equal(tick(9, [row('A', 1), row('B', .99)], { busy: true }).text, 'A wins!');
  assert.equal(tick(10, [row('A', 1), row('B', 1)]), null);
  assert.equal(tick(10, [row('A', 1)], { active: false }), null);
  assert.equal(tick(10, [row('A', 1)]), null);
  assert.equal(tick(10, [row('B', 1)], { id: 'replay' }).text, 'B wins!');
});
test('pause establishes fresh baseline; tied start and second place are handled', () => {
  const d = createAnnouncerDetector();
  const t = (elapsed, rows, active = true) => d.tick({ id: 1, elapsed, rows, active });
  t(0, [row('A', 0), row('B', 0), row('C', 0)]);
  assert.equal(t(.5, [row('B', 0), row('A', 0), row('C', 0)]), null);
  t(1, [row('A', .3), row('B', .2), row('C', .1)], false);
  assert.equal(t(2, [row('A', .3), row('B', .2), row('C', .1)]), null);
  t(3, [row('A', .4), row('C', .3), row('B', .2)]);
  assert.equal(t(3.5, [row('A', .5), row('C', .4), row('B', .3)]).kind, 'second');
});
test('comeback is announced once per event', () => {
  const d = createAnnouncerDetector();
  const rows = [row('A', .5), row('B', .3, { pose:'comeback', event:{ id:'fall-1' } })];
  d.tick({ id:1, elapsed:1, rows, active:true });
  d.tick({ id:1, elapsed:2, rows, active:true });
  assert.equal(d.tick({ id:1, elapsed:2.5, rows, active:true }).kind, 'comeback');
  assert.equal(d.tick({ id:1, elapsed:10, rows, active:true }), null);
});
function fixture() {
  const timers = new Map(); let seq = 0; const output = {}; const spoken = [];
  const synth = { cancel() {}, resume() {}, speak(u) { spoken.push(u); } };
  const player = createSpeechPlayer({ synth, Utterance: class { constructor(text) { this.text = text; } }, change: update => Object.assign(output, update), schedule: fn => { timers.set(++seq, fn); return seq; }, unschedule: id => timers.delete(id) });
  return { player, output, spoken, timers };
}
test('speech captions/ducking start with playback; cancellation ignores stale callbacks', () => {
  const f = fixture();
  f.player.say('A leads', { voice:{lang:'en-US'} });
  assert.equal(f.output.caption, '');
  const old = f.spoken[0]; old.onstart();
  assert.equal(f.output.speaking, true); assert.equal(f.output.caption, 'A leads');
  f.player.cancel(); old.onstart(); old.onerror();
  assert.equal(f.output.speaking, false); assert.equal(f.output.caption, '');
  assert.equal(f.timers.size, 0);
});
test('missing start/end callbacks and errors release ducking and show captions', () => {
  for (const failure of ['start-timeout', 'end-timeout', 'error']) {
    const f = fixture(); f.player.say('B wins!', { voice:{lang:'en-US'} });
    if (failure === 'end-timeout') f.spoken[0].onstart();
    if (failure === 'error') f.spoken[0].onerror(); else [...f.timers.values()][0]();
    assert.equal(f.output.speaking, false); assert.equal(f.output.caption, 'B wins!');
    assert.match(f.output.status, /captions only/);
  }
});
test('unspoken winner can retry after pause but started winner cannot duplicate', () => {
  const f=fixture();let retries=0;
  f.player.say('A wins!',{voice:{lang:'en'},onDiscarded:()=>retries++});
  f.player.cancel();assert.equal(retries,1);
  f.player.say('A wins!',{voice:{lang:'en'},onDiscarded:()=>retries++});
  f.spoken.at(-1).onstart();f.player.cancel();assert.equal(retries,1);
});
test('late playback drops an overtake which is no longer relevant', () => {
  const f=fixture(); f.player.say('A leads',{voice:{lang:'en'},isRelevant:()=>false});
  f.spoken[0].onstart();assert.equal(f.output.caption,'');assert.equal(f.player.busy,false);
});
test('mobile can speak with the device default while voices are loading', () => {
  const f=fixture(); f.player.say('Announcer ready.');
  assert.equal(f.spoken.length,1); assert.equal(f.spoken[0].lang,'en-US');
  assert.equal(f.player.utterance,f.spoken[0]);
  f.spoken[0].onstart(); assert.equal(f.output.caption,'Announcer ready.');
  f.spoken[0].onerror({error:'not-allowed'}); assert.match(f.output.status,/not-allowed/);
  assert.equal(f.player.utterance,null);
});
