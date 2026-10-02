import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, Vector3 } from 'three';

function Instances({ items, rods = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const object = new Object3D(), up = new Vector3(0, 1, 0);
    items.forEach((item, index) => {
      object.rotation.set(0, 0, 0);
      if (rods) {
        const a = new Vector3(...item.a), b = new Vector3(...item.b);
        object.position.copy(a).add(b).multiplyScalar(.5);
        object.scale.set(.065, a.distanceTo(b), .065);
        object.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
      } else {
        object.position.fromArray(item.position); object.scale.fromArray(item.scale); object.rotation.fromArray(item.rotation);
      }
      object.updateMatrix(); ref.current.setMatrixAt(index, object.matrix);
      ref.current.setColorAt(index, new Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true; ref.current.instanceColor.needsUpdate = true; ref.current.computeBoundingSphere();
  }, [items, rods]);
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>{rods ? <cylinderGeometry args={[1, 1, 1, 6]} /> : <sphereGeometry args={[1, 8, 6]} />}<meshStandardMaterial metalness={rods ? .65 : 0} roughness={rods ? .35 : .8} /></instancedMesh>;
}
export function StageTruss() {
  const rods = useMemo(() => {
    const items = [];
    const add = (a, b) => items.push({ a, b, color: '#b5c5d7' });
    for (const side of [-1, 1]) {
      for (const x of [-1.5, -.5]) for (const z of [side * 10.7, side * 11.5]) add([x, 1.3, z], [x, 14, z]);
      for (let y = 1.3; y < 13; y += 1.6) {
        add([-.48, y, side * 10.7], [-.48, y + 1.6, side * 11.5]);
        add([-.48, y, side * 11.5], [-.48, y + 1.6, side * 10.7]);
      }
    }
    for (const y of [13.4, 14.2]) for (const x of [-1.5, -.5]) add([x, y, -11.5], [x, y, 11.5]);
    for (let z = -11.5; z < 11; z += 1.6) {
      add([-.5, 13.4, z], [-.5, 14.2, z + 1.6]);
      add([-.5, 14.2, z], [-.5, 13.4, z + 1.6]);
    }
    return items;
  }, []);
  return <Instances items={rods} rods />;
}
export function StagePlants() {
  const pots = useMemo(() => [-1, 1].flatMap(side => [0, 1, 2].map(i => ({ x: 3.2 + i * .65, z: side * (11.3 + i * 2), scale: i === 1 ? 1.1 : .8 }))), []);
  const leaves = useMemo(() => pots.flatMap(p => Array.from({ length: 9 }, (_, i) => {
    const angle = i * Math.PI * 2 / 9;
    return { position: [p.x + Math.sin(angle) * .55, 1.45 + (i % 3) * .2, p.z + Math.cos(angle) * .55], scale: [.17 * p.scale, (1.15 + i % 2 * .25) * p.scale, .35 * p.scale], rotation: [Math.cos(angle) * .55, angle, -Math.sin(angle) * .55], color: ['#438746', '#83af38', '#2f663b'][i % 3] };
  })), [pots]);
  return <group>{pots.map((p, i) => <mesh key={i} position={[p.x, .5, p.z]}><cylinderGeometry args={[.55 * p.scale, .36 * p.scale, 1, 12]} /><meshStandardMaterial color={i % 2 ? '#d9e2ed' : '#81715c'} /></mesh>)}<Instances items={leaves} /></group>;
}
export function StageGarden() {
  const trees = useMemo(() => [-23, -18, -13, 13, 18, 23].map((z, i) => ({ z, x: -7 - i % 2 * 2, height: 6 + i % 3 })), []);
  const canopies = useMemo(() => trees.flatMap(tree => [0, 1, 2].map(i => ({ position: [tree.x + (i - 1) * 1.2, tree.height + i * .7, tree.z + (i - 1) * .9], scale: [2.8, 2.5, 2.5], rotation: [0, i, 0], color: ['#356c4b', '#447c4d', '#5a8b50'][i] }))), [trees]);
  return <group>{trees.map(tree => <mesh key={tree.z} position={[tree.x, tree.height / 2, tree.z]}><cylinderGeometry args={[.25, .5, tree.height, 8]} /><meshStandardMaterial color="#766148" /></mesh>)}<Instances items={canopies} /></group>;
}
export function StageSpeaker({ position }) {
  return <group position={position}><mesh><boxGeometry args={[1.4, 3.8, 1.6]} /><meshStandardMaterial color="#121b2a" /></mesh>{[-.85, .85].map(y => <group key={y} position={[.71, y, 0]} rotation={[0, Math.PI / 2, 0]}><mesh><circleGeometry args={[.57, 16]} /><meshStandardMaterial color="#303c4c" /></mesh><mesh position={[0, 0, .02]}><circleGeometry args={[.24, 12]} /><meshStandardMaterial color="#090e18" /></mesh></group>)}</group>;
}
export function Trophy({ position, scale = 1 }) {
  return <group position={position} scale={scale}>
    <mesh position={[0, .1, 0]}><boxGeometry args={[.65, .2, .65]} /><meshStandardMaterial color="#14243f" /></mesh>
    <mesh position={[0, .4, 0]}><cylinderGeometry args={[.09, .16, .5, 10]} /><meshStandardMaterial color="#ffcb55" metalness={.7} roughness={.25} /></mesh>
    <mesh position={[0, .84, 0]}><cylinderGeometry args={[.35, .12, .45, 12]} /><meshStandardMaterial color="#ffd66e" metalness={.65} roughness={.24} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[0, .84, side * .36]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[.21, .045, 6, 12]} /><meshStandardMaterial color="#ffcf62" metalness={.65} roughness={.25} /></mesh>)}
  </group>;
}
