import { useMemo } from 'react';
import StaticBlocks from './StaticBlocks';

// The venue artwork sits behind the transparent Canvas. The existing runners,
// camera, race clock and finish geometry remain fully three-dimensional.
export default function ImageGrounds3D({ laneCount, low }) {
  const blocks = useMemo(() => {
    const edge = laneCount * 1.6;
    const items = [];
    const add = (position, size, color) => items.push({ position, size, color });
    for (let i = 0; i <= laneCount; i++) add([0, .03, (i - laneCount / 2) * 3.2], [27, .025, .07], '#fff6df');
    add([-10, .04, 0], [.12, .025, edge * 2], '#fff6df');
    for (let i = 0; i < laneCount * 8; i++) for (let j = 0; j < 2; j++) add([10 + j * .25, .05, -edge + .2 + i * .4], [.25, .025, .4], (i + j) % 2 ? '#18283f' : '#ffffff');
    return items;
  }, [laneCount]);
  return <>
    <hemisphereLight args={['#fff2dc', '#82755c', 2.4]} />
    <directionalLight position={[-8, 18, 9]} intensity={2.4} castShadow={!low} shadow-mapSize={[1024, 1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-normalBias={.04} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[100, 100]} /><shadowMaterial transparent opacity={.22} /></mesh>
    <StaticBlocks blocks={blocks} name="image-courtyard-markings" />
  </>;
}
