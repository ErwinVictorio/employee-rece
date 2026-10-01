import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { sampleRunner } from '../../utils/raceMotion';

const Resources = createContext(null);
export function RunnerResources({ children }) {
  const resources = useMemo(() => ({
    box: new BoxGeometry(1, 1, 1), sphere: new SphereGeometry(1, 16, 12),
    materials: Object.fromEntries(['#fa5963', '#55b9ff', '#ffd157', '#ff408b', '#9855ff', '#19d991', '#172340', '#efb183', '#382619', '#172139', '#f0f5ff', '#ffffff'].map(color => [color, new MeshStandardMaterial({ color, roughness: .75 })]))
  }), []);
  useEffect(() => () => {
    resources.box.dispose(); resources.sphere.dispose();
    Object.values(resources.materials).forEach(material => material.dispose());
  }, [resources]);
  return <Resources.Provider value={resources}>{children}</Resources.Provider>;
}

function Part({ position, scale, color, round = false }) {
  const resources = useContext(Resources);
  if (resources) return <mesh position={position} scale={scale} castShadow geometry={round ? resources.sphere : resources.box} material={resources.materials[color]} dispose={null} />;
  return <mesh position={position} scale={scale} castShadow>
    {round ? <sphereGeometry args={[1, 16, 12]} /> : <boxGeometry args={[1, 1, 1]} />}
    <meshStandardMaterial color={color} roughness={0.75} />
  </mesh>;
}

// Original articulated mesh: shared design, independently animated joints per employee.
export default function Runner3D({ employee, lane = 0, laneCount = 2, color, race, elapsed = 0, animationTime, labelRef, reducedMotion, showcase = false }) {
  const root = useRef();
  const body = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftKnee = useRef();
  const rightKnee = useRef();
  const dust = useRef();
  const labelPosition = useMemo(() => new Vector3(), []);
  const runner = race?.runners.find(r => r.employee.id === employee.id);

  useFrame(({ camera, size }) => {
    const time = animationTime ? animationTime.current : elapsed;
    const sample = runner ? sampleRunner(runner, time) : { progress: 0, pose: 'running', poseProgress: 0 };
    const { progress, pose, poseProgress: t } = sample;
    const running = runner && time > 0 && time < runner.finishTime;
    const phase = time * 12 + lane * Math.PI;
    const prone = ['falling', 'fallen', 'recovering'].includes(pose);
    const swing = running && !reducedMotion && !prone ? Math.sin(phase) : 0;
    root.current.position.set(showcase ? 0 : -10 + progress * 20, 0.08, showcase ? 0 : (lane - (laneCount - 1) / 2) * 3.2);
    body.current.position.y = running && !reducedMotion ? Math.abs(Math.sin(phase)) * 0.13 : 0;
    const blend = x => x * x * (3 - 2 * x);
    const lean = pose === 'stumbling' ? 0.25 * blend(t) : pose === 'falling' ? 0.25 + 1.15 * blend(t) : pose === 'fallen' ? 1.4 : pose === 'recovering' ? 1.4 * (1 - blend(t)) : 0;
    body.current.rotation.x = reducedMotion ? 0 : lean;
    body.current.rotation.z = 0;
    if (prone && !reducedMotion) body.current.position.y = 0.75 * Math.sin(lean);
    leftArm.current.rotation.x = swing * 0.8;
    rightArm.current.rotation.x = -swing * 0.8;
    leftArm.current.rotation.z = showcase === 'winner' ? -2.25 : showcase ? -.65 : 0;
    rightArm.current.rotation.z = showcase === 'winner' ? 2.25 : showcase ? .65 : 0;
    if (showcase === 'cheer') {
      leftArm.current.rotation.x = rightArm.current.rotation.x = -1.1;
      leftArm.current.rotation.z = .25;
      rightArm.current.rotation.z = -.25;
    }
    leftLeg.current.rotation.x = -swing * 0.8;
    rightLeg.current.rotation.x = swing * 0.8;
    leftKnee.current.rotation.x = running && !reducedMotion ? Math.max(0, swing) * 1.1 : 0;
    rightKnee.current.rotation.x = running && !reducedMotion ? Math.max(0, -swing) * 1.1 : 0;
    if (!reducedMotion && prone) {
      const push = pose === 'recovering' ? Math.sin(Math.PI * t) : 0;
      leftArm.current.rotation.x = rightArm.current.rotation.x = -.65 * Math.sin(lean);
      leftKnee.current.rotation.x = .9 * push;
      rightKnee.current.rotation.x = .45 * push;
    }
    const dustAge = sample.event ? time - sample.event.groundAt : -1;
    dust.current.visible = !reducedMotion && dustAge >= 0 && dustAge < .55;
    if (dust.current.visible) {
      const origin = sampleRunner(runner, sample.event.groundAt).progress;
      dust.current.position.x = (origin - progress) * 20 + 1;
      dust.current.children.forEach((particle, i) => {
        const angle = i * Math.PI / 3;
        particle.position.set(Math.cos(angle) * dustAge * 1.4, .15 + dustAge * .5, Math.sin(angle) * dustAge);
        particle.scale.setScalar(.16 * (1 - dustAge / .55));
      });
    }
    if (labelRef?.current && !animationTime) {
      labelPosition.set(root.current.position.x, 3.65, root.current.position.z).project(camera);
      const labelOffset = lane % 2 === 0 ? 22 : 0;
      labelRef.current.style.transform = `translate(-50%, -100%) translate(${(labelPosition.x * 0.5 + 0.5) * size.width}px, ${(-labelPosition.y * 0.5 + 0.5) * size.height - labelOffset}px)`;
      labelRef.current.style.visibility = Math.abs(labelPosition.x) > 1.1 || Math.abs(labelPosition.y) > 1.1 ? 'hidden' : 'visible';
    }
  });

  return <group ref={root} name={`runner-${employee.id}`}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[.35, -.025, 0]} scale={[1.0, .56, 1]}><circleGeometry args={[1, 24]} /><meshBasicMaterial color="#48362c" transparent opacity={.18} depthWrite={false} /></mesh>
    <group ref={dust} visible={false}>{Array.from({ length: 6 }, (_, i) => <mesh key={i}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color="#edcda4" /></mesh>)}</group>
    <group rotation={[0, Math.PI / 2, 0]}><group ref={body}>
      <Part position={[0, 1.85, 0]} scale={[0.43, 0.55, 0.29]} color={color} round />
      <Part position={[0, 1.33, 0]} scale={[0.69, 0.28, 0.44]} color="#172340" />
      <Part position={[0, 2.72, 0]} scale={[0.50, 0.53, 0.45]} color="#efb183" round />
      <Part position={[0, 2.99, -0.08]} scale={[0.51, 0.30, 0.44]} color="#382619" round />
      <Part position={[0, 2.74, 0.41]} scale={[0.10, 0.12, 0.13]} color="#efb183" round />
      {[1, 3, 5].includes(employee.character) && <><Part position={[0, 2.95, -.48]} scale={[.25, .25, .33]} color="#382619" round /><Part position={[0, 2.58, -.62]} scale={[.23, .4, .24]} color="#382619" round /><Part position={[0, 2.92, -.4]} scale={[.27, .10, .20]} color={color} round /></>}
      {[-1, 1].map(side => <group key={side}>
        <Part position={[side * .49, 2.72, .02]} scale={[.10, .15, .11]} color="#efb183" round />
        <Part position={[side * .19, 2.88, .375]} scale={[.085, .095, .052]} color="#ffffff" round />
        <Part position={[side * 0.19, 2.86, 0.419]} scale={[0.055, 0.07, 0.035]} color="#172139" round />
        <group position={[side * 0.54, 2.14, 0]} ref={side === -1 ? leftArm : rightArm}>
          <Part position={[0, -0.18, 0]} scale={[0.21, 0.30, 0.24]} color={color} round />
          <Part position={[0, -0.42, 0]} scale={[0.13, 0.26, 0.13]} color="#efb183" round />
          <group position={[0, -0.56, 0]} rotation={[-1, 0, 0]}>
            <Part position={[0, -0.23, 0]} scale={[0.13, 0.27, 0.13]} color="#efb183" round />
            <Part position={[0, -0.44, 0]} scale={[0.15, 0.17, 0.15]} color="#efb183" round />
          </group>
        </group>
        <group position={[side * 0.23, 1.28, 0]} ref={side === -1 ? leftLeg : rightLeg}>
          <Part position={[0, -0.18, 0]} scale={[0.27, 0.36, 0.34]} color="#172340" />
          <Part position={[0, -0.4, 0]} scale={[0.15, 0.24, 0.15]} color="#efb183" round />
          <group position={[0, -0.59, 0]} ref={side === -1 ? leftKnee : rightKnee}>
            <Part position={[0, -0.23, 0]} scale={[0.13, 0.27, 0.13]} color="#efb183" round />
            <Part position={[0, -0.46, 0]} scale={[0.28, 0.18, 0.30]} color="#f0f5ff" />
            <Part position={[0, -0.57, 0.12]} scale={[0.30, 0.20, 0.52]} color={color} round />
            <Part position={[0, -0.64, 0.12]} scale={[0.31, 0.07, 0.54]} color="#f0f5ff" />
          </group>
        </group>
      </group>)}
      <Part position={[0, 2.51, .395]} scale={[.14, .036, .038]} color="#382619" round />
      <Part position={[0, 1.93, 0.45]} scale={[0.38, 0.28, 0.04]} color="#ffffff" />
    </group></group>
  </group>;
}
