import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, progressAt } from '../src/utils/race.js';
import { validateRacePlan } from '../src/utils/raceMotion.js';
test('custom minutes retain valid motion and assigned finish times', () => {
  const roster = Array.from({ length: 12 }, (_, id) => ({ id, name: `Racer ${id}` }));
  for (const duration of [60, 120, 600]) for (const random of [() => .1, () => .4, () => .8]) {
    const race = createRace(roster, duration, {}, random);
    assert.deepEqual(validateRacePlan(race), []);
    assert.equal(race.runners[0].finishTime, duration * .9);
    assert.equal(race.runners.at(-1).finishTime, duration);
    for (const runner of race.runners) {
      assert.ok(progressAt(runner, runner.finishTime - .001) < 1);
      assert.equal(progressAt(runner, runner.finishTime), 1);
    }
  }
  for (const value of [0, 59, 90, 601, 660, NaN, Infinity, '60']) assert.throws(() => createRace(roster, value));
});
