import { PerspectiveCamera, Vector3 } from 'three';
import { safeViewport } from './courseLayout.js';

export function fitVenuePose(width, height, laneCount, view, finish, rear = 4, viewport = null) {
  const target = new Vector3(finish ? (rear + 12) / 2 : 0, 1.5, 0);
  const direction = new Vector3(width > 700 ? 1 : .25, 1.8, width > 700 ? .2 : 1).normalize();
  const camera = new PerspectiveCamera(45, width / height, .1, 10000);
  const margins = viewport || safeViewport(width, height);
  const usableWidth = Math.max(100, width - margins.left - margins.right);
  const usableHeight = Math.max(100, height - margins.top - margins.bottom);
  const corners = [];
  for (const x of finish ? [rear, 13] : [-13, 13]) for (const y of [0, 4.5])
    for (const z of [-laneCount * 1.6, laneCount * 1.6]) corners.push(new Vector3(x, y, z));
  let distance = 12;
  for (let i = 0; i < 200; i++) {
    camera.position.copy(direction).multiplyScalar(distance).add(target);
    camera.lookAt(target); camera.updateMatrixWorld();
    if (corners.every(c => { const p = c.clone().project(camera); return Math.abs(p.x) < usableWidth / width * .9 && Math.abs(p.y) < usableHeight / height * .9 && p.z < 1; })) break;
    distance *= 1.05;
  }
  return { position: camera.position.clone(), target };
}
