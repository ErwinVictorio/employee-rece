import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { finishCameraBlend } from '../../utils/finishCamera';
import { progressAt } from '../../utils/race';
import { fieldCenter, followCameraBlend } from '../../utils/followCamera';

function fitPose(width, height, laneCount, view, finish, rear = 4) {
  const target = new Vector3(finish ? (rear + 11.3) / 2 : 0, .7, 0);
  const direction = finish ? new Vector3(.45, 1.25, 1).normalize() : new Vector3(view === 'side' ? .12 : .9, view === 'side' ? 1.7 : 1.65, 1).normalize();
  const camera = new PerspectiveCamera(45, width / height, .1, 300);
  const corners = [];
  const xBounds = finish ? [rear, 11.3] : width > 700 ? [-11, 11] : [-13, 13];
  for (const x of xBounds) for (const y of [0, 4.5]) for (const z of [-laneCount * 1.6, laneCount * 1.6]) corners.push(new Vector3(x, y, z));
  let distance = 12;
  for (let i = 0; i < 75; i++) {
    camera.position.copy(direction).multiplyScalar(distance).add(target);
    camera.lookAt(target); camera.updateMatrixWorld();
    if (corners.every(c => { const p = c.clone().project(camera); return Math.abs(p.x) < .9 && Math.abs(p.y) < .86; })) break;
    distance *= 1.05;
  }
  return { position: camera.position.clone(), target };
}

export default function RaceCamera({ game, laneCount, view, finishCam, reducedMotion }) {
  const { size, invalidate } = useThree();
  useEffect(() => { invalidate(); }, [reducedMotion, view, size, invalidate]);
  const poses = useMemo(() => ({
    wide: fitPose(size.width, size.height, laneCount, view, false),
    // Interpolate pre-fitted bounds rather than allocating a fitting camera
    // every frame. A little extra padding covers interpolation between fits.
    finish: Array.from({ length: 25 }, (_, i) => fitPose(size.width, size.height, laneCount, view, true, i - 13)),
    finishPosition: new Vector3(), finishTarget: new Vector3(),
    followPosition: new Vector3(), followTarget: new Vector3(),
    target: new Vector3()
  }), [size.width, size.height, laneCount, view]);
  // Sampling race time makes the transition pause/resume-safe and independent
  // of frame rate. A restored context immediately recovers the saved view.
  useFrame(({ camera, gl }) => {
    const blend = finishCam ? finishCameraBlend(game.animationTime.current, game.race?.duration, reducedMotion, game.race?.finalStretchAt) : 0;
    const positions = game.race ? game.race.runners.map(r => -10 + 20 * progressAt(r, game.animationTime.current)) : [];
    const follow = followCameraBlend(game.animationTime.current, reducedMotion);
    const offset = fieldCenter(positions) * follow;
    // Translate the fitted full-field view with the pack. Track geometry stays
    // fixed, so scenery passes backwards without altering runner progress.
    poses.followPosition.copy(poses.wide.position).setX(poses.wide.position.x + offset);
    poses.followTarget.copy(poses.wide.target).setX(poses.wide.target.x + offset);
    const rear = positions.length ? Math.min(...positions) - 2 : 4;
    const index = Math.max(0, Math.min(23, rear + 13));
    const lower = Math.floor(index), mix = index - lower;
    poses.finishPosition.lerpVectors(poses.finish[lower].position, poses.finish[lower + 1].position, mix);
    poses.finishTarget.lerpVectors(poses.finish[lower].target, poses.finish[lower + 1].target, mix);
    camera.position.lerpVectors(poses.followPosition, poses.finishPosition, blend);
    poses.target.lerpVectors(poses.followTarget, poses.finishTarget, blend);
    camera.lookAt(poses.target);
    camera.updateMatrixWorld();
    gl.domElement.dataset.cameraView = finishCam ? 'finish' : view;
    gl.domElement.dataset.cameraBlend = blend.toFixed(3);
    gl.domElement.dataset.cameraFollow = (follow * (1 - blend)).toFixed(3);
    gl.domElement.dataset.cameraTargetX = poses.target.x.toFixed(3);
  }, -1);
  return null;
}
