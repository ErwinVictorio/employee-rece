import { PerspectiveCamera, Vector3 } from 'three';
import { locations, normalizeLocation } from '../data/locations.js';

export function fitVenuePose(width, height, laneCount, view, finish, rear = 4, location = 'stadium') {
  const companyWide = location === 'company-grounds' && !finish && view !== 'side' && width > 700;
  const target = new Vector3(finish ? (rear + 11.3) / 2 : companyWide ? -1 : 0, companyWide ? 3 : .7, companyWide ? -6 : 0);
  if (location === 'company-image') target.y = 10;
  const direction = finish ? new Vector3(.45, 1.25, 1).normalize() : new Vector3(view === 'side' ? .12 : companyWide ? .45 : .9, view === 'side' ? 1.7 : locations[normalizeLocation(location)].cameraHeight, 1).normalize();
  // A shallow angle keeps the 3D course on the pictured foreground courtyard.
  if (location === 'company-image') direction.set(view === 'side' ? .04 : .12, .12, 1).normalize();
  const camera = new PerspectiveCamera(45, width / height, .1, 300);
  const corners = [];
  const xBounds = finish ? [rear, 11.3] : width > 700 ? [-11, 11] : [-13, 13];
  for (const x of xBounds) for (const y of [0, 4.5]) for (const z of [-laneCount * 1.6, laneCount * 1.6]) corners.push(new Vector3(x, y, z));
  if (companyWide) for (const x of [-19, 13]) for (const z of [-laneCount * 1.6 - 5, -laneCount * 1.6 - 18]) corners.push(new Vector3(x, 13, z));
  let distance = 12;
  for (let i = 0; i < 75; i++) {
    camera.position.copy(direction).multiplyScalar(distance).add(target);
    camera.lookAt(target); camera.updateMatrixWorld();
    if (corners.every(c => { const p = c.clone().project(camera); return Math.abs(p.x) < .9 && Math.abs(p.y) < .86; })) break;
    distance *= 1.05;
  }
  return { position: camera.position.clone(), target };
}
