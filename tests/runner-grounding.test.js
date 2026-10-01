import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Euler } from 'three';
import { groundedBodyY } from '../src/utils/runnerGrounding.js';

test('shoe meshes stay above the track and touch it throughout the stride', () => {
  for (const lean of [0, .125, .25]) for (let frame = 0; frame <= 120; frame++) {
    const swing = Math.sin(frame / 120 * Math.PI * 2);
    const joints = [[-.8 * swing, Math.max(0, swing) * 1.1], [.8 * swing, Math.max(0, -swing) * 1.1]];
    const bodyY = groundedBodyY(...joints.flat(), lean);
    let bottom = Infinity;
    for (const [hip, knee] of joints) {
      const points = [];
      // Sample the actual ellipsoid surface, plus all sole box corners.
      for (let i = 0; i < 720; i++) {
        const angle = i / 720 * Math.PI * 2;
        points.push(new Vector3(0, -.57 + .20 * Math.cos(angle), .12 + .52 * Math.sin(angle)));
      }
      for (const y of [-.035, .035]) for (const z of [-.27, .27]) points.push(new Vector3(0, -.64 + y, .12 + z));
      for (const point of points) {
        point.applyEuler(new Euler(knee, 0, 0));
        point.y -= .59;
        point.applyEuler(new Euler(hip, 0, 0));
        point.y += 1.28;
        point.applyEuler(new Euler(lean, 0, 0));
        bottom = Math.min(bottom, point.y + bodyY + .08);
      }
    }
    assert.ok(bottom >= .02 - 1e-9, `Foot penetrated track: ${bottom}`);
    assert.ok(bottom < .02001, `Foot floated above track: ${bottom}`);
  }
});
