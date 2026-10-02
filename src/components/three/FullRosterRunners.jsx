import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D, Matrix4 } from 'three';
import { characters } from '../../data/assets';
import { runnerEventPosition } from '../../utils/eventLayout';
import { useBrandTexture } from '../../hooks/useBrandTexture';
import { sampleRunner } from '../../utils/raceMotion';

// One instance per employee in every body part. Geometry and draw calls are shared.
const parts = [
  { position: [0, 1.85, 0], scale: [.55, .7, .72], color: 'team' },
  { position: [0, 1.3, 0], scale: [.48, .3, .65], color: '#172340' },
  { position: [0, 2.68, 0], scale: [.48, .53, .48], color: '#efb183', round: true },
  { position: [-.07, 2.96, 0], scale: [.46, .29, .49], color: '#382619', round: true },
  ...[-1, 1].flatMap(side => [
    { position: [0, 2.05, side * .48], scale: [.2, .8, .2], color: 'team', joint: 'arm', side },
    { position: [0, 1.2, side * .23], scale: [.24, .85, .25], color: '#172340', joint: 'leg', side },
    { position: [0, 1.2, side * .23], scale: [.5, .2, .3], color: 'team', joint: 'shoe', side },
    { position: [.43, 2.73, side * .18], scale: [.045, .08, .06], color: '#172139', round: true },
  ]),
];
export default function FullRosterRunners({ employees, layout, game, event, reducedMotion, low }) {
  const refs = useRef([]);
  const badges = useRef();
  const logo = useBrandTexture();
  const work = useMemo(() => ({ root: new Object3D(), part: new Object3D(), matrix: new Matrix4() }), []);
  const runners = useMemo(() => new Map(game.race?.runners.map(r => [r.employee.id, r]) || []), [game.race]);
  useLayoutEffect(() => {
    parts.forEach((part, p) => {
      employees.forEach((e, i) => refs.current[p].setColorAt(i, new Color(part.color === 'team' ? characters[e.character].color : part.color)));
      refs.current[p].instanceColor.needsUpdate = true;
    });
  }, [employees]);
  useFrame(({ gl }) => {
    const time = game.animationTime.current;
    employees.forEach((e, lane) => {
      const runner = runners.get(e.id);
      const sample = runner ? sampleRunner(runner, time) : { progress: 0 };
      const t = sample.poseProgress || 0;
      const smooth = v => v * v * (3 - 2 * v);
      const lean = reducedMotion ? 0 : sample.pose === 'stumbling' ? .25 * smooth(t) : sample.pose === 'falling' ? .25 + 1.15 * smooth(t) : sample.pose === 'fallen' ? 1.4 : sample.pose === 'recovering' ? 1.4 * (1 - smooth(t)) : 0;
      const running = runner && time > 0 && time < runner.finishTime && lean < .3 && !reducedMotion;
      const walking = ['arrival', 'lineup'].includes(game.state) && !reducedMotion;
      const swing = walking ? Math.sin(game.phaseTime * 9 + lane) * .25 : running ? Math.sin(time * 12 + lane * Math.PI) * .55 : 0;
      work.root.position.set(-10 + sample.progress * 20, .08 + Math.sin(lean) * .35, layout.zById.get(e.id));
      const opening = runnerEventPosition(game, lane, layout.zById.get(e.id), event, reducedMotion);
      if (opening) work.root.position.set(opening.x, .08, opening.z);
      work.root.rotation.set(0, opening?.rotation || 0, -lean); work.root.updateMatrix();
      parts.forEach((part, p) => {
        work.part.position.fromArray(part.position); work.part.scale.fromArray(part.scale); work.part.rotation.set(0, 0, 0);
        if (part.joint) {
          const angle = swing * part.side * (part.joint === 'arm' ? -1 : 1);
          const length = part.joint === 'shoe' ? 1 : .4;
          work.part.position.x += Math.sin(angle) * length;
          work.part.position.y -= Math.cos(angle) * length;
          if (part.joint !== 'shoe') work.part.rotation.z = angle;
          if (part.joint === 'arm' && game.state === 'welcome' && !reducedMotion) work.part.rotation.z = Math.sin(game.phaseTime * 1.5 + lane) * .04 * part.side;
        }
        work.part.updateMatrix(); work.matrix.multiplyMatrices(work.root.matrix, work.part.matrix);
        refs.current[p].setMatrixAt(lane, work.matrix);
      });
      for (const side of [-1, 1]) {
        work.part.position.set(side * .281, 1.95, 0); work.part.scale.set(.6, .156, 1); work.part.rotation.set(0, side * Math.PI / 2, 0);
        work.part.updateMatrix(); work.matrix.multiplyMatrices(work.root.matrix, work.part.matrix);
        badges.current.setMatrixAt(lane * 2 + (side === 1 ? 1 : 0), work.matrix);
      }
    });
    badges.current.instanceMatrix.needsUpdate = true;
    refs.current.forEach(mesh => { mesh.instanceMatrix.needsUpdate = true; });
    gl.domElement.dataset.renderedRunners = String(employees.length);
    gl.domElement.dataset.runnerInstances = String(employees.length);
  });
  return <group name="full-roster-runners">{parts.map((part, i) => <instancedMesh key={i} ref={el => { refs.current[i] = el; }} args={[undefined, undefined, employees.length]} frustumCulled={false} castShadow={!low}>
    {part.round ? <sphereGeometry args={[1, low ? 8 : 16, low ? 6 : 12]} /> : <boxGeometry />}
    <meshLambertMaterial />
  </instancedMesh>)}<instancedMesh ref={badges} args={[undefined, undefined, employees.length * 2]} frustumCulled={false}><planeGeometry /><meshBasicMaterial map={logo} transparent alphaTest={.1} /></instancedMesh></group>;
}
