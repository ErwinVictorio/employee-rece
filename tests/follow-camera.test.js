import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldCenter, followCameraBlend } from '../src/utils/followCamera.js';
test('follow starts gently after countdown, freezes when sampled at the same time and respects reduced motion', () => {
  assert.equal(followCameraBlend(0), 0);
  assert.equal(followCameraBlend(-1), 0);
  assert.equal(followCameraBlend(.75), .5);
  assert.equal(followCameraBlend(1.5), 1);
  assert.equal(followCameraBlend(600), 1);
  assert.equal(followCameraBlend(30, true), 0);
  const paused = followCameraBlend(.9);
  followCameraBlend(60);
  assert.equal(followCameraBlend(.9), paused);
});
test('field center includes trailing runners and keeps the whole field within fitted track bounds', () => {
  for (const positions of [[-10, -10], [-8, 0, 9], [8, 9, 10], []]) {
    const center = fieldCenter(positions);
    assert.ok(positions.every(x => Math.abs(x - center) <= 10));
  }
  assert.equal(fieldCenter([-8, 9, 10]), 1);
});
