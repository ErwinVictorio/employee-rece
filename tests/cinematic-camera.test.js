import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { fitVenuePose } from '../src/utils/venueCamera.js';
import { cinematicViewport } from '../src/utils/courseLayout.js';

for (const count of [2, 12, 13, 25, 50, 100]) for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`cinematic overview fits all ${count} runners and the course at ${width}px`, () => {
    const margins = cinematicViewport(width);
    const pose = fitVenuePose(width, height, count, 'stadium', false, 4, margins);
    const camera = new PerspectiveCamera(45, width / height, .1, 10000);
    camera.position.copy(pose.position); camera.lookAt(pose.target);
    camera.setViewOffset(width, height, (margins.right - margins.left) / 2, (margins.bottom - margins.top) / 2, width, height);
    camera.updateMatrixWorld();
    for (const x of [-13, 13]) for (const z of [-count * 1.6, count * 1.6]) for (const y of [0, 4.5]) {
      const point = new Vector3(x, y, z).project(camera);
      const pixelX = (point.x + 1) * width / 2, pixelY = (1 - point.y) * height / 2;
      assert.ok(pixelX >= margins.left && pixelX <= width - margins.right);
      assert.ok(pixelY >= margins.top && pixelY <= height - margins.bottom);
    }
  });
}
