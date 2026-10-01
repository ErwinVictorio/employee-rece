import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNames, raceTiming } from '../src/utils/roster.js';
import { createRace } from '../src/utils/race.js';
import { sampleRunner, validateRacePlan } from '../src/utils/raceMotion.js';
test('bulk names preserve people, reject overflow without partial additions', () => {
  assert.deepEqual(parseNames(' Juan \r\n\r\nMaria\nJuan ', 0), ['Juan', 'Maria', 'Juan']);
  assert.equal(parseNames(Array.from({ length: 100 }, (_, i) => `Person ${i}`).join('\n'), 0).length, 100);
  for (const [text, count] of [['A\nB', 99], ['', 0], ['a'.repeat(61), 0], ['A\tB', 0]]) assert.throws(() => parseNames(text, count));
});
test('large fields keep every entrant, bounded motion tables, spacing and finish order', () => {
  for (const count of [13, 25, 50, 100]) for (const duration of [10, 60, 600]) for (const value of [.1, .4, .8]) {
    const employees = Array.from({ length: count }, (_, id) => ({ id, name: `Employee ${id}` }));
    const race = createRace(employees, duration, {}, () => value);
    assert.equal(race.order.length, count);
    assert.equal(new Set(race.order.map(e => e.id)).size, count);
    assert.equal(race.duration, raceTiming(count, duration).duration);
    assert.deepEqual(validateRacePlan(race), []);
    assert.equal(race.runners.at(-1).finishTime, race.duration);
    race.runners.forEach((r, i) => {
      assert.ok(r.motionPlan.points.length <= 12001);
      assert.ok(r.events.every(e => e.endAt < r.motionPlan.split));
      if (i) assert.ok(r.finishTime - race.runners[i - 1].finishTime >= .12 - 1e-9);
      assert.ok(sampleRunner(r, r.finishTime - .0001).progress < 1);
      assert.equal(sampleRunner(r, r.finishTime).progress, 1);
    });
  }
});
