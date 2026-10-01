import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { fitVenuePose } from '../../utils/venueCamera';
import { finishCameraBlend } from '../../utils/finishCamera';
import { progressAt } from '../../utils/race';
import { fieldCenter, followCameraBlend } from '../../utils/followCamera';


export default function RaceCamera({ location = 'stadium', game, laneCount, view, finishCam, reducedMotion }) {
  const { size, invalidate } = useThree();
  useEffect(() => { invalidate(); }, [reducedMotion, view, size, invalidate]);
  const poses = useMemo(() => ({
    wide: fitVenuePose(size.width, size.height, laneCount, view, false, 4, location),
    // Interpolate pre-fitted bounds rather than allocating a fitting camera
    // every frame. A little extra padding covers interpolation between fits.
    finish: Array.from({ length: 25 }, (_, i) => fitVenuePose(size.width, size.height, laneCount, view, true, i - 13, location)),
    finishPosition: new Vector3(), finishTarget: new Vector3(),
    followPosition: new Vector3(), followTarget: new Vector3(),
    target: new Vector3()
  }), [size.width, size.height, laneCount, view, location]);
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
