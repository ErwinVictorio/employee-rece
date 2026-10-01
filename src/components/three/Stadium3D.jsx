import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import StadiumDetails from './StadiumDetails';

function Block({ position, size, color, ...props }) {
  return <mesh position={position} {...props}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>;
}

function StadiumInstances({ laneCount }) {
  const mesh = useRef();
  const blocks = useMemo(() => {
    const items = [];
    for (let i = 0; i < laneCount * 8; i++) for (const j of [0, 1]) items.push({ position: [10 + j * .22, .04, -laneCount * 1.6 + .2 + i * .4], scale: [.22, .025, .4], color: (i + j) % 2 ? '#18283f' : '#ffffff' });
    for (const side of [-1, 1]) for (const tier of [0, 1, 2]) for (let seat = 0; seat < 22; seat++) items.push({ position: [-15 + seat * 1.4, .85 + tier * .9, side * (laneCount * 1.6 + 3 + tier * 1.2)], scale: [.8, .25, .6], color: ['#edbd61', '#6da6c5', '#cb7564'][(seat + tier) % 3] });
    return items;
  }, [laneCount]);
  useLayoutEffect(() => {
    const transform = new Object3D();
    blocks.forEach((block, i) => {
      transform.position.fromArray(block.position); transform.scale.fromArray(block.scale); transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix); mesh.current.setColorAt(i, new Color(block.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [blocks]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]}><boxGeometry /><meshStandardMaterial roughness={.9} /></instancedMesh>;
}
export function SceneLifecycle({ onReady, onLost, onPerformance }) {
  const { gl } = useThree();
  const sample = useRef({ elapsed: 0, frames: 0 });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = event => { event.preventDefault(); onLost(); };
    canvas.addEventListener('webglcontextlost', lost);
    onReady();
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onReady, onLost]);
  useFrame((_, delta) => {
    sample.current.elapsed += delta;
    sample.current.frames++;
    if (sample.current.elapsed >= 1) {
      onPerformance(Math.round(sample.current.frames / sample.current.elapsed));
      sample.current = { elapsed: 0, frames: 0 };
    }
  });
  return null;
}

export default function Stadium3D({ laneCount = 2 }) {
  return <>
    <color attach="background" args={['#80b5a0']} />
    <fog attach="fog" args={['#b8d9c6', 110, 250]} />
    <hemisphereLight args={['#fff2dc', '#668272', 2.2]} />
    <directionalLight position={[-8, 18, 9]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-normalBias={0.04} />
    <Block position={[0, -0.3, 0]} size={[130, 0.45, laneCount * 3.2 + 90]} color="#67a680" receiveShadow />
    <Block position={[0, -0.06, 0]} size={[27, 0.15, laneCount * 3.2 + 0.6]} color="#cb705b" receiveShadow />
    {Array.from({ length: laneCount + 1 }, (_, i) => (i - laneCount / 2) * 3.2).map(z => <Block key={z} position={[0, 0.03, z]} size={[27, 0.02, 0.055]} color="#fff4df" />)}
    <Block position={[-10, 0.04, 0]} size={[0.12, 0.02, laneCount * 3.2]} color="#fff4df" />
    <StadiumInstances laneCount={laneCount} />
    <StadiumDetails laneCount={laneCount} />
    {[-1, 1].map(side => <group key={side}>
      {[0, 1, 2].map(tier => <group key={tier}>
        <Block position={[0, 0.35 + tier * 0.65, side * (laneCount * 1.6 + 3 + tier * 1.2)]} size={[33, 0.7 + tier * 0.5, 1.2]} color={tier % 2 ? '#476684' : '#294563'} receiveShadow />
      </group>)}
      {[-15, 15].map(x => <group key={x}>
        <Block position={[x, 4.5, side * (laneCount * 1.6 + 8)]} size={[0.2, 9, 0.2]} color="#617a8d" />
        <Block position={[x, 9, side * (laneCount * 1.6 + 8)]} size={[2.6, 0.7, 0.4]} color="#fff5d8" />
      </group>)}
    </group>)}
  </>;
}
