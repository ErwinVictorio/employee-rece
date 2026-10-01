import { useMemo } from 'react';
import CompanyBuilding3D from './CompanyBuilding3D';
import StaticBlocks from './StaticBlocks';
import Crowd3D from './Crowd3D';

export default function CompanyGrounds3D({ laneCount, game, reducedMotion, low }) {
  const edge = laneCount * 1.6;
  const blocks = useMemo(() => {
    const a = [];
    const add = (position, size, color) => a.push({ position, size, color });
    add([0, -.35, 0], [160, .4, 160], '#799766');
    add([0, -.1, -7], [62, .2, edge * 2 + 38], '#bfb7a7');
    for (let x = -27; x <= 27; x += 3) add([x, .025, -5], [.018, .008, edge * 2 + 27], '#a39f93');
    for (let z = -edge - 14; z <= edge + 7; z += 3) add([0, .025, z], [58, .008, .018], '#a39f93');
    for (let i = 0; i <= laneCount; i++) add([0, .04, (i - laneCount / 2) * 3.2], [27, .025, .07], '#fff8df');
    add([-10, .045, 0], [.13, .025, edge * 2], '#fff8df');
    for (let i = 0; i < laneCount * 8; i++) for (let j = 0; j < 2; j++) add([10 + j * .25, .05, -edge + .2 + i * .4], [.25, .025, .4], (i + j) % 2 ? '#192631' : '#fff9e8');
    for (const x of [-16, 16]) for (const z of [-edge - 2, edge + 3]) {
      add([x, 2.6, z], [.09, 5.2, .09], '#d8b768');
      add([x + .65, 3.8, z], [1.25, 2.3, .08], '#245992');
      add([x + .65, 4.9, z + .06], [1.25, .12, .08], '#ffd15c');
      add([x, .4, z], [1.2, .8, 1.2], '#9b9787');
    }
    for (let x = -13; x <= 13; x += 2) {
      add([x, .75, -edge - 2.5], [1.8, .09, .08], '#dab35c');
      add([x - .8, .4, -edge - 2.5], [.06, .8, .08], '#344653');
    }
    for (const x of [-19, -13, 9, 17]) {
      const z = -edge - 5;
      add([x, .45, z], [1.8, .9, 1.8], '#958c7b');
      add([x, 1.5, z], [.24, 2, .24], '#695f44');
      add([x, 2, z], [1.5, 1.8, 1.4], '#4e7953');
      add([x + .4, 2.7, z], [1.4, 1.3, 1.6], '#628f58');
    }
    return a;
  }, [edge, laneCount]);
  const placements = useMemo(() => Array.from({ length: 32 }, (_, i) => ({ x: -15.5 + i, y: .05, z: -edge - 3.7, facing: 1 })), [edge]);
  return <>
    <color attach="background" args={['#9dc9df']} /><fog attach="fog" args={['#c7dedc', 100, 240]} />
    <hemisphereLight args={['#fff0d6', '#75856e', 2.4]} />
    <directionalLight position={[-12, 25, 18]} intensity={2.6} castShadow={!low} shadow-mapSize={[1024, 1024]} shadow-camera-left={-32} shadow-camera-right={32} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-normalBias={.04} />
    <StaticBlocks blocks={blocks} name="company-courtyard" receiveShadow />
    <CompanyBuilding3D position={[-3, 0, -edge - 8]} low={low} />
    <Crowd3D placements={placements} laneCount={laneCount} active={!!game?.race} excited={game?.elapsed >= game?.race?.finalStretchAt} paused={game?.paused} reducedMotion={reducedMotion} low={low} />
  </>;
}
