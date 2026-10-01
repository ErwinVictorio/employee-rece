import test from 'node:test';
import assert from 'node:assert/strict';
import { finishCameraBlend } from '../src/utils/finishCamera.js';

test('finish camera transitions once in the final stretch, before first crossing', () => {
  for (const duration of [10, 15, 20, 30]) {
    const at = duration * .75;
    assert.equal(finishCameraBlend(at - .001, duration), 0);
    assert.equal(finishCameraBlend(at, duration), 0);
    assert.ok(Math.abs(finishCameraBlend(at + .4, duration) - .5) < 1e-10);
    assert.equal(finishCameraBlend(duration * .9, duration), 1);
    assert.equal(finishCameraBlend(duration + 2, duration), 1);
    assert.equal(finishCameraBlend(at, duration, true), 1);
    assert.equal(finishCameraBlend(at - .001, duration, true), 0);
    assert.equal(finishCameraBlend(0, duration), 0);
  }
});

test('camera progress survives skipped frames and paused time without accumulated state', () => {
  const before = finishCameraBlend(7.8, 10);
  finishCameraBlend(100, 10);
  assert.equal(finishCameraBlend(7.8, 10), before);
  assert.equal(finishCameraBlend(8.5, 10), 1);
  assert.equal(finishCameraBlend(0, undefined), 0);
});
