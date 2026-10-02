import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { isOpening, isPreRace, EVENT_TIMING } from '../../utils/eventTimeline';
import { fitVenuePose } from '../../utils/venueCamera';
import { progressAt } from '../../utils/race';
import { fieldCenter } from '../../utils/followCamera';
import { rollingWindow, safeViewport, cinematicViewport } from '../../utils/courseLayout';
import { gatheringPosition } from '../../utils/eventLayout';

const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const openingMargins = width => width > 1000 ? { left: 265, right: 255, top: 35, bottom: 105 } : { left: 12, right: 12, top: 130, bottom: 195 };
export default function RaceCamera({ game, event, layout, view, finishCam, reducedMotion, manualLane, regionRef, cinematic = false }) {
  const { size, invalidate, camera: sceneCamera } = useThree();
  useEffect(() => () => { sceneCamera.clearViewOffset(); }, [sceneCamera]);
  const state = useRef({ initialized: false, key: '', transition: 1, fromPosition: new Vector3(), fromTarget: new Vector3(), target: new Vector3() });
  useEffect(() => { invalidate(); }, [view, manualLane, reducedMotion, cinematic, size, invalidate]);
  const poses = useMemo(() => ({
    wide: fitVenuePose(size.width, size.height, layout.laneCount, 'stadium', false, 4, cinematic ? cinematicViewport(size.width) : null),
    close: fitVenuePose(size.width, size.height, Math.min(layout.laneCount, size.width < 700 ? 4 : 8), 'side', false, 4, cinematic ? cinematicViewport(size.width) : null),
    position: new Vector3(), target: new Vector3(), offset: new Vector3(), point: new Vector3()
  }), [size.width, size.height, layout, cinematic]);
  const welcome = useMemo(() => {
    if (!event) return poses.wide;
    const target = new Vector3(event.stageX + 5 + Math.max(0, event.rows - 3) * 1.3, 5, 0);
    const camera = new PerspectiveCamera(45, size.width / size.height, .1, 10000);
    const direction = new Vector3(1, .28, .015).normalize();
    const points = [];
    for (const x of [event.stageX - 2, event.stageX + 5]) for (const y of [0, 14.5]) for (const z of [-17, 17]) points.push(new Vector3(x, y, z));
    for (let lane = 0; lane < event.count; lane++) {
      const p = gatheringPosition(lane, event);
      for (const y of [0, 3.6]) points.push(new Vector3(p.x + 4, y, p.z));
    }
    const margins = cinematic ? cinematicViewport(size.width) : openingMargins(size.width);
    let distance = 24;
    for (let i = 0; i < 200; i++) {
      camera.position.copy(direction).multiplyScalar(distance).add(target); camera.lookAt(target); camera.updateMatrixWorld();
      if (points.every(point => { const p = point.clone().project(camera); return Math.abs(p.x) < Math.max(.2, (size.width - margins.left - margins.right) / size.width) * .9 && Math.abs(p.y) < Math.max(.2, (size.height - margins.top - margins.bottom) / size.height) * .9; })) break;
      distance *= 1.05;
    }
    return { position: camera.position.clone(), target };
  }, [event, size.width, size.height, poses, cinematic]);
  useFrame(({ camera, gl }, delta) => {
    const elapsed = game.animationTime.current;
    const active = !!game.race && !isPreRace(game.state) && view !== 'overview' && !reducedMotion;
    const finishBlend = finishCam ? smooth((elapsed - game.race.finalStretchAt) / 1.5) : 0;
    const rollingBlend = active ? smooth(elapsed / 1.5) * (1 - finishBlend) : 0;
    const window = rollingWindow(layout.laneCount, size.width, elapsed, game.race?.finalStretchAt || 1, manualLane);
    const positions = game.race ? game.race.runners.map(r => -10 + 20 * progressAt(r, elapsed)) : [];
    poses.offset.set(fieldCenter(positions), 0, window.z);
    poses.position.copy(poses.close.position).add(poses.offset).lerp(poses.wide.position, 1 - rollingBlend);
    poses.target.copy(poses.close.target).add(poses.offset).lerp(poses.wide.target, 1 - rollingBlend);
    if (isOpening(game.state)) {
      const travel = game.state === 'lineup' ? (reducedMotion ? 1 : smooth(game.phaseTime / EVENT_TIMING.lineup)) : 0;
      poses.position.copy(welcome.position).lerp(poses.wide.position, travel);
      poses.target.copy(welcome.target).lerp(poses.wide.target, travel);
    }
    const current = state.current;
    const key = `${view}:${manualLane}:${game.race?.id}`;
    if (current.key !== key && current.initialized) {
      current.fromPosition.copy(camera.position); current.fromTarget.copy(current.target); current.transition = 0;
    }
    current.key = key;
    current.transition = Math.min(1, current.transition + Math.min(delta, .05) / .8);
    const blend = reducedMotion || isOpening(game.state) || !current.initialized ? 1 : smooth(current.transition);
    camera.position.lerpVectors(current.fromPosition, poses.position, blend);
    current.target.lerpVectors(current.fromTarget, poses.target, blend);
    camera.lookAt(current.target);
    const margins = cinematic ? cinematicViewport(size.width) : isOpening(game.state) ? openingMargins(size.width) : safeViewport(size.width);
    camera.setViewOffset(size.width, size.height, (margins.right - margins.left) / 2, (margins.bottom - margins.top) / 2, size.width, size.height);
    camera.updateMatrixWorld();
    current.initialized = true;
    const visibleLanes = [];
    for (let lane = 0; lane < layout.laneCount; lane++) {
      poses.point.set(current.target.x, 1.5, (lane - (layout.laneCount - 1) / 2) * layout.spacing).project(camera);
      const x = (poses.point.x + 1) * size.width / 2, y = (1 - poses.point.y) * size.height / 2;
      if (x >= margins.left && x <= size.width - margins.right && y >= margins.top && y <= size.height - margins.bottom) visibleLanes.push(lane);
    }
    regionRef.current = { first: visibleLanes[0] ?? 0, last: visibleLanes.at(-1) ?? 0, rolling: rollingBlend > .5 };
    gl.domElement.dataset.cameraView = isOpening(game.state) ? game.state : finishCam ? 'finish' : active ? 'rolling' : 'overview';
    gl.domElement.dataset.cameraTargetZ = current.target.z.toFixed(3);
    gl.domElement.dataset.cameraTargetX = current.target.x.toFixed(3);
    gl.domElement.dataset.cameraBlend = finishBlend.toFixed(3);
    gl.domElement.dataset.cameraFollow = rollingBlend.toFixed(3);
    if (current.transition < 1) invalidate();
  }, -1);
  return null;
}
