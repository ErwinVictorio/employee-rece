import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, progressAt } from '../src/utils/race.js';
import { environmentLaneCapacity, normalizeLocation } from '../src/data/locations.js';
import { fitVenuePose } from '../src/utils/venueCamera.js';
import { PerspectiveCamera, Vector3 } from 'three';

const seeded = initial => { let seed = initial; return () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296); };
test('venue normalization handles old snapshots and untrusted keys', () => {
  for (const value of [undefined, null, '', 'unknown', 'constructor', '__proto__']) assert.equal(normalizeLocation(value), 'stadium');
  assert.equal(normalizeLocation('company-grounds'), 'company-grounds');
});
test('both venues have identical race plans and motion at every roster and duration boundary', () => {
  for (const count of [2, 6, 12, 13, 100]) for (const duration of [10, 60, 600]) {
    const employees = Array.from({ length: count }, (_, i) => ({ id: String(i), name: `Employee ${i}`, character: i % 6 }));
    const stadium = createRace(employees, duration, { location: 'stadium' }, seeded(123));
    const company = createRace(employees, duration, { location: 'company-grounds' }, seeded(123));
    assert.deepEqual(company.runners, stadium.runners);
    assert.deepEqual(company.order, stadium.order);
    assert.equal(company.duration, stadium.duration);
    assert.equal(company.finalStretchAt, stadium.finalStretchAt);
    assert.ok(Object.isFrozen(company.settings));
    assert.equal(structuredClone(company).settings.location, 'company-grounds');
    for (let i = 0; i <= 40; i++) company.runners.forEach((runner, r) => assert.equal(progressAt(runner, i * duration / 40), progressAt(stadium.runners[r], i * duration / 40)));
  }
});
test('environment capacity uses the full roster, up to one hundred', () => {
  assert.equal(environmentLaneCapacity(0), 2);
  assert.equal(environmentLaneCapacity(6), 6);
  for (const count of [12, 13, 100]) assert.equal(environmentLaneCapacity(count), count);
});

test('venue cameras fit runners and finish stripe on desktop, tablet and mobile', () => {
  for (const location of ['stadium', 'company-grounds', 'company-image']) for (const [width, height] of [[1336, 707], [720, 600], [366, 540]]) for (const count of [2, 6, 12]) for (const view of ['stadium', 'side']) for (const finish of [false, true]) {
    const rear = -12;
    const pose = fitVenuePose(width, height, count, view, finish, rear, location);
    const camera = new PerspectiveCamera(45, width / height, .1, 300);
    camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld();
    for (const x of finish ? [rear, 11.3] : [-11, 11]) for (const y of [0, 4.5]) for (const z of [-count * 1.6, count * 1.6]) {
      const point = new Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(point.x) < .91 && Math.abs(point.y) < .87, `${location}, ${width}, ${count}, ${view}, ${finish}`);
    }
  }
});
