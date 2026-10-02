import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceEventClock, eventPhase, EVENT_BOUNDARIES } from '../src/utils/eventTimeline.js';
import { eventLayout, gatheringPosition, openingPosition } from '../src/utils/eventLayout.js';
import { laneZ } from '../src/utils/courseLayout.js';

test('readiness and pause hold the authoritative clock, even across a long delay', () => {
  assert.equal(advanceEventClock(0, 100, false), 0);
  for (const clock of [0, 2.99, 3, 12.99, 13, 15.99, 16, 19.99]) assert.equal(advanceEventClock(clock, 100, true, true), clock);
});
test('arrival, full ten-second welcome, lineup and four-second countdown exclude race time', () => {
  let clock = advanceEventClock(0, 99);
  assert.equal(clock, 3); assert.equal(eventPhase(clock).state, 'welcome');
  assert.equal(eventPhase(clock).welcomeRemaining, 10);
  clock = advanceEventClock(clock, 9.999);
  assert.equal(eventPhase(clock).state, 'welcome'); assert.equal(eventPhase(clock).elapsed, 0);
  clock = advanceEventClock(clock, 1);
  assert.equal(clock, 13); assert.equal(eventPhase(clock).welcomeRemaining, 0);
  clock = advanceEventClock(clock, 99); assert.equal(clock, 16);
  for (const [offset, expected] of [[0, 3], [1, 2], [2, 1], [3, 'GO!']]) {
    const phase = eventPhase(clock + offset); assert.equal(phase.countdown, expected); assert.equal(phase.elapsed, 0);
  }
  assert.equal(eventPhase(EVENT_BOUNDARIES.racing).elapsed, 0);
  assert.equal(eventPhase(EVENT_BOUNDARIES.racing + 15).elapsed, 15);
});
for (const count of [2, 12, 13, 25, 50, 100]) for (const venue of ['stadium', 'company-grounds']) {
  test(`${venue}: ${count} distinct participants gather outside the course and reach their own lanes`, () => {
    const layout = eventLayout(count, venue);
    const gathering = Array.from({ length: count }, (_, lane) => gatheringPosition(lane, layout));
    assert.equal(new Set(gathering.map(p => `${p.x}:${p.z}`)).size, count);
    assert.ok(gathering.every(p => p.x > layout.stageX + 5 && p.x < -13));
    for (const state of ['arrival', 'welcome', 'lineup']) for (let t = 0; t <= 3; t += .05) {
      const positions = Array.from({ length: count }, (_, lane) => openingPosition(lane, laneZ(lane, count), layout, state, t));
      for (let a = 0; a < count; a++) for (let b = a + 1; b < count; b++) assert.ok(Math.hypot(positions[a].x - positions[b].x, positions[a].z - positions[b].z) >= 1.4, `safe spacing ${state} at ${t}`);
    }
    for (let lane = 0; lane < count; lane++) {
      const expected = { x: -10, z: laneZ(lane, count), rotation: 0 };
      assert.deepEqual(openingPosition(lane, expected.z, layout, 'lineup', 3), expected);
      assert.deepEqual(openingPosition(lane, expected.z, layout, 'lineup', 0, true), expected);
      assert.deepEqual(openingPosition(lane, expected.z, layout, 'arrival', 0, true), { ...gathering[lane], rotation: Math.PI });
    }
  });
}
