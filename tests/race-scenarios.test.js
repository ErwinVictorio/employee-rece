import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace } from '../src/utils/race.js';
import { comebackRunner, sampleRunner } from '../src/utils/raceMotion.js';
const rng = seed => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);

test('mixed scenarios allow trailing winners and nonwinner surges without changing results', () => {
  const types = new Set();
  let comebackCount = 0, notices = 0, nonwinnerNotices = 0, midRaceTrailing = 0;
  for (const count of [2, 6, 12]) for (const duration of [10, 15, 20, 30]) for (const funMoments of [true, false]) for (let seed = 1; seed <= 20; seed++) {
    const roster = Array.from({ length: count }, (_, id) => ({ id, name: `Racer ${id}` }));
    const race = createRace(roster, duration, { funMoments }, rng(seed));
    types.add(race.scenario);
    if (race.scenario !== 'comeback') continue;
    comebackCount++;
    const winner = race.runners[0];
    const rankAt = time => race.runners.filter(r => sampleRunner(r, time).progress > sampleRunner(winner, time).progress).length;
    assert.ok(rankAt(duration * .75) > 0, 'winner must still trail at final-stretch entry');
    if (rankAt(duration * .6) >= Math.floor(count / 2)) midRaceTrailing++;
    assert.equal(rankAt(winner.finishTime), 0);
    for (let fraction = .65; fraction < .9; fraction += .01) {
      const t = duration * fraction;
      const runner = comebackRunner(race, t);
      if (!runner) continue;
      notices++;
      if (runner.rank !== 0) nonwinnerNotices++;
      const position = at => race.runners.filter(r => sampleRunner(r, at).progress > sampleRunner(runner, at).progress).length;
      assert.ok(position(t) < position(t - duration * .06));
      assert.equal(comebackRunner(race, t)?.employee.id, runner.employee.id);
    }
    assert.equal(comebackRunner(race, 0), null);
    assert.equal(comebackRunner(race, winner.finishTime), null);
  }
  assert.deepEqual([...types].sort(), ['close', 'comeback', 'steady']);
  assert.ok(comebackCount > 0 && midRaceTrailing > 0 && notices > 0 && nonwinnerNotices > 0);
});
