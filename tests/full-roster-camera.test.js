import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { courseLayout, laneZ, rollingWindow, safeViewport } from '../src/utils/courseLayout.js';
import { fitVenuePose } from '../src/utils/venueCamera.js';

for (const count of [2, 12, 13, 25, 50, 100]) {
 test(`${count} stable lanes and continuous pre-finish coverage`, () => {
  const employees = Array.from({ length: count }, (_, id) => ({ id: String(id) }));
  const layout = courseLayout(employees);
  assert.equal(layout.lanes.size, count);
  assert.equal(new Set(employees.map(e => laneZ(layout.lanes.get(e.id), count))).size, count);
  for (const width of [390, 1440]) {
   const covered = new Set(); let previous = -Infinity;
   for (let elapsed = 0; elapsed <= 38; elapsed += .05) {
    const window = rollingWindow(count, width, elapsed, 39);
    assert.ok(window.center >= previous); previous = window.center;
    for (let lane = 0; lane < count; lane++) if (lane >= window.first - .01 && lane <= window.last + .01) covered.add(lane);
    assert.deepEqual(rollingWindow(count, width, elapsed, 39), window, 'sampling is pause-safe');
   }
   assert.equal(covered.size, count);
   assert.equal(rollingWindow(count, width, 20, 39, 0).first, 0);
   assert.equal(rollingWindow(count, width, 20, 39, count - 1).last, count - 1);
  }
 });
 test(`${count} entire course fits unobstructed desktop and mobile overview`, () => {
  for (const [width, height] of [[1336,707],[720,600],[366,640]]) for (const finish of [false,true]) {
   const pose=fitVenuePose(width,height,count,'stadium',finish,-13);
   const camera=new PerspectiveCamera(45,width/height,.1,10000);
   const margins=safeViewport(width);
   camera.position.copy(pose.position);camera.lookAt(pose.target);
   camera.setViewOffset(width,height,(margins.right-margins.left)/2,(margins.bottom-margins.top)/2,width,height);
   camera.updateMatrixWorld();
   for(const x of [-13,13]) for(const y of [0,4.5]) for(const z of [-count*1.6,count*1.6]) {
    const p=new Vector3(x,y,z).project(camera);
    const px=(p.x+1)*width/2,py=(1-p.y)*height/2;
    assert.ok(px>margins.left && px<width-margins.right && py>margins.top && py<height-margins.bottom && p.z<1, `${width} ${height}: ${px}, ${py}`);
   }
  }
 });
}
