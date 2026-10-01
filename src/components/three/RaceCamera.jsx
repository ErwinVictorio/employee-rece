import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { finishCameraBlend } from '../../utils/finishCamera';

function fitPose(width, height, laneCount, view, finish) {
  const target = new Vector3(finish ? 8 : 0, .7, 0);
  const direction = finish ? new Vector3(.45, 1.25, 1).normalize() : new Vector3(view === 'side' ? .12 : .9, view === 'side' ? 1.7 : 1.65, 1).normalize();
  const camera = new PerspectiveCamera(45, width / height, .1, 300);
  const corners = [];
  const xBounds = finish ? [4, 11.3] : width > 700 ? [-11, 11] : [-13, 13];
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
  const { size } = useThree();
  const poses = useMemo(() => ({
    wide: fitPose(size.width, size.height, laneCount, view, false),
    finish: fitPose(size.width, size.height, laneCount, view, true),
    target: new Vector3()
  }), [size.width, size.height, laneCount, view]);
  // Sampling race time makes the transition pause/resume-safe and independent
  // of frame rate. A restored context immediately recovers the saved view.
  useFrame(({ camera, gl }) => {
    const blend = finishCam ? finishCameraBlend(game.animationTime.current, game.race?.duration, reducedMotion) : 0;
    camera.position.lerpVectors(poses.wide.position, poses.finish.position, blend);
    poses.target.lerpVectors(poses.wide.target, poses.finish.target, blend);
    camera.lookAt(poses.target);
    camera.updateMatrixWorld();
    gl.domElement.dataset.cameraView = finishCam ? 'finish' : view;
    gl.domElement.dataset.cameraBlend = blend.toFixed(3);
  }, -1);
  return null;
}
