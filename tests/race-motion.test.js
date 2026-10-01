import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace } from '../src/utils/race.js';
import { sampleRunner, validateRacePlan } from '../src/utils/raceMotion.js';
const roster = n => Array.from({ length: n }, (_, id) => ({ id, name: `Runner ${id}` }));
const rng = seed => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

test('final stretch has visible field separation without changing crossing times', () => {
  for (const count of [2, 6, 12]) for (const duration of [10, 15, 20, 30]) for (const funMoments of [false, true]) for (let seed = 1; seed <= 12; seed++) {
    const race = createRace(roster(count), duration, { funMoments }, rng(seed));
    const positions = race.runners.map(r => sampleRunner(r, duration * .75).progress);
    const spread = Math.max(...positions) - Math.min(...positions);
    const minimum = count === 2 && race.scenario !== 'steady' ? (race.scenario === 'close' ? .009 : .069) : .149;
    assert.ok(spread >= minimum && spread <= .17, `scenario=${race.scenario} spread=${spread}`);
    race.runners.forEach((r, rank) => {
      assert.equal(r.finishTime, duration * (.9 + .1 * rank / (count - 1)));
      const before = sampleRunner(r, duration * .75 - .00001);
      const after = sampleRunner(r, duration * .75 + .00001);
      assert.ok(Math.abs(before.speed - after.speed) < .0001);
    });
  }
});
test('motion and events obey bounds across roster sizes, durations and settings', () => {
  for (let n = 2; n <= 12; n++) for (const duration of [10, 15, 20, 30]) for (const funMoments of [false, true]) for (let seed = 1; seed <= 12; seed++) {
    const race = createRace(roster(n), duration, { funMoments }, rng(seed));
    assert.deepEqual(validateRacePlan(race), [], `n=${n} d=${duration} seed=${seed}`);
    const events = race.runners.flatMap(r => r.events).sort((a, b) => a.stumbleAt - b.stumbleAt);
    assert.equal(events.length > 0, funMoments);
    for (let i = 0; i < events.length; i++) {
      assert.ok(events[i].stumbleAt >= duration * .15);
      assert.ok(events[i].endAt <= duration * .7);
      if (i) assert.ok(events[i].stumbleAt - events[i - 1].endAt >= .5 - 1e-9);
    }
    for (const runner of race.runners) {
      assert.ok(sampleRunner(runner, runner.finishTime - 1e-8).progress < 1);
      assert.equal(sampleRunner(runner, runner.finishTime).progress, 1);
      for (const e of runner.events) {
        assert.ok(sampleRunner(runner, (e.groundAt + e.getUpAt) / 2).speed < .05 / duration);
        assert.equal(sampleRunner(runner, e.endAt).pose, 'running');
        for (const at of Object.values(e).filter(v => typeof v === 'number')) {
          assert.ok(Math.abs(sampleRunner(runner, at + 1e-6).progress - sampleRunner(runner, at - 1e-6).progress) < 1e-5);
        }
      }
    }
  }
});
test('winner, middle and last runners can fall; winner can lose and regain lead', () => {
  const ranks = new Set();
  let comeback = false;
  for (let seed = 1; seed < 300; seed++) {
    const race = createRace(roster(3), 15, {}, rng(seed));
    for (const r of race.runners.filter(r => r.events.length)) ranks.add(r.rank);
    const winner = race.runners[0], e = winner.events[0];
    if (!e) continue;
    const leads = time => race.runners.every(r => sampleRunner(winner, time).progress >= sampleRunner(r, time).progress);
    if (leads(e.stumbleAt) && !leads(e.getUpAt) && leads(winner.finishTime)) comeback = true;
  }
  assert.deepEqual([...ranks].sort(), [0, 1, 2]);
  assert.ok(comeback);
});

test('two-runner seed 1 fixture loses an early lead and still wins', () => {
  const race = createRace(roster(2), 15, {}, rng(1));
  const [winner, other] = race.runners;
  const e = winner.events[0];
  assert.ok(sampleRunner(winner, e.stumbleAt).progress > sampleRunner(other, e.stumbleAt).progress);
  assert.ok(sampleRunner(winner, e.getUpAt).progress < sampleRunner(other, e.getUpAt).progress);
  assert.equal(sampleRunner(winner, winner.finishTime).progress, 1);
  assert.ok(sampleRunner(other, winner.finishTime).progress < 1);
});

test('pose sampling has no frame history; settings do not reshuffle ranking', () => {
  for (const value of [0, .5, 1 - Number.EPSILON]) {
    for (const duration of [10, 15, 20, 30]) {
      const race = createRace(roster(12), duration, {}, () => value);
      assert.deepEqual(validateRacePlan(race), []);
      const plain = createRace(roster(12), duration, { funMoments: false }, () => value);
      assert.deepEqual(race.order, plain.order);
      assert.notEqual(race.id, plain.id);
      for (const r of race.runners) {
        const at = r.events[0]?.groundAt || 1;
        const original = sampleRunner(r, at);
        sampleRunner(r, r.finishTime + 10); sampleRunner(r, 0);
        assert.deepEqual(sampleRunner(r, at), original);
        assert.equal(sampleRunner(r, 0).pose, 'running');
        assert.ok(Object.isFrozen(r.events));
        assert.ok(Object.isFrozen(r.motionPlan.points));
      }
    }
  }
});
