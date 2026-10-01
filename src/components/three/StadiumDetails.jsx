import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D } from 'three';

function Instances({ items, round = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D();
    items.forEach((item, i) => {
      object.position.fromArray(item.position); object.scale.fromArray(item.scale); object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix); ref.current.setColorAt(i, new Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
    {round ? <sphereGeometry args={[1, 8, 6]} /> : <boxGeometry />}
    <meshLambertMaterial />
  </instancedMesh>;
}

export default function StadiumDetails({ laneCount }) {
  const { spheres, boxes } = useMemo(() => {
    const spheres = [], boxes = [];
    const shirts = ['#228af4', '#f9bd3a', '#f25e69', '#e7effb', '#2dc5ad', '#8861e9'];
    const skins = ['#f2b68a', '#c98a62', '#8f573f'];
    for (const side of [-1, 1]) {
      for (let tier = 0; tier < 3; tier++) for (let seat = 0; seat < 22; seat++) {
        const x = -15 + seat * 1.4, y = 1.18 + tier * .9, z = side * (laneCount * 1.6 + 3 + tier * 1.2);
        spheres.push({ position: [x, y + .75, z], scale: [.23, .27, .23], color: skins[(seat + tier) % 3] });
        spheres.push({ position: [x, y + .94, z - .035], scale: [.235, .13, .23], color: seat % 4 ? '#392b24' : '#b98a51' });
        spheres.push({ position: [x, y + .27, z], scale: [.31, .40, .23], color: shirts[(seat + tier * 2) % 6] });
        spheres.push({ position: [x - .35, y + .27, z], scale: [.09, .25, .1], color: skins[(seat + tier) % 3] });
        spheres.push({ position: [x + .35, y + .27, z], scale: [.09, .25, .1], color: skins[(seat + tier) % 3] });
      }
      const edge = side * (laneCount * 1.6 + 1.25);
      boxes.push({ position: [0, .12, edge], scale: [31, .16, 1.4], color: '#88ad7d' });
      boxes.push({ position: [0, .38, side * (laneCount * 1.6 + 2.1)], scale: [33, .12, .12], color: '#e7f0f1' });
      for (let i = 0; i < 9; i++) {
        const x = -14 + i * 3.5;
        boxes.push({ position: [x, .75, edge], scale: [2.9, 1.05, .12], color: i % 2 ? '#2364d4' : '#1645b2' });
        boxes.push({ position: [x, .78, edge - side * .085], scale: [.12, .55, .035], color: '#ffc642' });
        boxes.push({ position: [x, .97, edge - side * .085], scale: [.45, .23, .035], color: '#ffc642' });
        spheres.push({ position: [x + 1.6, .48, edge], scale: [.38, .5, .38], color: i % 2 ? '#548f38' : '#6aa345' });
        boxes.push({ position: [x + 1.6, .25, edge], scale: [.14, .5, .14], color: '#82664d' });
      }
      for (const x of [-12, 0, 12]) {
        boxes.push({ position: [x, 2.2, side * (laneCount * 1.6 + 2)], scale: [.07, 4.4, .07], color: '#e5eff5' });
        boxes.push({ position: [x + .45, 3.85, side * (laneCount * 1.6 + 2)], scale: [.9, 1.1, .05], color: x ? '#237bec' : '#ffcd3c' });
      }
    }
    return { spheres, boxes };
  }, [laneCount]);
  return <><Instances items={boxes} /><Instances items={spheres} round /></>;
}
