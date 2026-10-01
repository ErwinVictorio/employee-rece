import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, CanvasTexture, Color, Object3D, SRGBColorSpace, Vector2 } from 'three';
import { characters } from '../../data/assets';
import Runner3D, { RunnerResources } from './Runner3D';

function Trophy() {
  const profile = useMemo(() => [[.15, 0], [.2, .15], [.42, .28], [.58, .6], [.62, .85]].map(p => new Vector2(...p)), []);
  return <group position={[1, 1.16, .25]} scale={.62} rotation={[0, -.25, 0]}>
    <mesh position={[0, .12, 0]} castShadow><boxGeometry args={[.85, .24, .7]} /><meshStandardMaterial color="#182641" metalness={.5} roughness={.35} /></mesh>
    <mesh position={[0, .45, 0]} castShadow><cylinderGeometry args={[.12, .25, .45, 20]} /><meshStandardMaterial color="#edb339" metalness={.72} roughness={.22} /></mesh>
    <mesh position={[0, .63, 0]} castShadow><latheGeometry args={[profile, 32]} /><meshStandardMaterial color="#ffc74b" metalness={.72} roughness={.22} side={2} /></mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .58, 1.15, 0]} castShadow><torusGeometry args={[.28, .065, 10, 24]} /><meshStandardMaterial color="#ffc74b" metalness={.75} roughness={.22} /></mesh>)}
  </group>;
}

function Confetti({ elapsed, reducedMotion }) {
  const ref = useRef();
  const object = useMemo(() => new Object3D(), []);
  const count = 80;
  useEffect(() => {
    const colors = ['#ffcc56', '#ff5b85', '#42c5ff', '#9a76ff', '#3cedb4'];
    for (let i = 0; i < count; i++) ref.current.setColorAt(i, new Color(colors[i % colors.length]));
    ref.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame(() => {
    if (reducedMotion) return;
    const time = elapsed.current;
    for (let i = 0; i < count; i++) {
      object.position.set(-1 + Math.sin(i * 17.2) * 4.6 + Math.sin(time + i) * .2, 7 - ((time * (.55 + i % 4 * .12) + i * .618) % 7), Math.cos(i * 8.3) * 3);
      object.rotation.set(time * .7 + i, time * .4 + i * .3, time + i);
      object.scale.set(.055, .12, .02); object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} visible={!reducedMotion} frustumCulled={false}><boxGeometry /><meshBasicMaterial /></instancedMesh>;
}

function Podium({ rank, height, radius }) {
  const number = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    context.font = 'bold 100px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = rank === 1 ? '#ffe19a' : '#d3e2ff'; context.fillText(String(rank), 64, 68);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
  }, [rank]);
  useEffect(() => () => number.dispose(), [number]);
  const gold = rank === 1;
  return <>
    <mesh position={[0, height / 2, 0]} receiveShadow castShadow><cylinderGeometry args={[radius, radius + .08, height, 48]} /><meshStandardMaterial color="#18243d" metalness={.65} roughness={.27} /></mesh>
    <mesh position={[0, height, 0]}><cylinderGeometry args={[radius + .01, radius + .01, .07, 48]} /><meshStandardMaterial color={gold ? '#fbc54e' : '#91abc8'} metalness={.65} roughness={.25} /></mesh>
    <mesh position={[0, height / 2, radius + .08]}><planeGeometry args={[height * .8, height * .8]} /><meshBasicMaterial map={number} transparent depthWrite={false} /></mesh>
    {gold && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .035, 0]}><torusGeometry args={[radius + .22, .035, 8, 64]} /><meshBasicMaterial color="#ffda70" /></mesh>}
  </>;
}

function LightBeam({ height, radius }) {
  return <mesh position={[0, height / 2, 0]}>
    <cylinderGeometry args={[.06, radius, height, 48, 1, true]} />
    <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} side={2}
      vertexShader={`varying vec2 beamUv; varying vec3 beamNormal; varying vec3 beamView;
        void main() { beamUv = uv; vec4 p = modelViewMatrix * vec4(position, 1.0);
          beamNormal = normalMatrix * normal; beamView = -p.xyz; gl_Position = projectionMatrix * p; }`}
      fragmentShader={`varying vec2 beamUv; varying vec3 beamNormal; varying vec3 beamView;
        void main() { float edge = pow(abs(dot(normalize(beamNormal), normalize(beamView))), 2.5);
          float fade = sin(beamUv.y * 3.14159); gl_FragColor = vec4(.35, .58, 1.0, edge * fade * .12); }`} />
  </mesh>;
}

function Stage() {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.04, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#101f38" roughness={.38} metalness={.4} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .005, 0]} scale={[1, .52, 1]}><torusGeometry args={[6.2, .035, 8, 96]} /><meshBasicMaterial color="#4baaff" /></mesh>
    {[-5.7, -3.5, 3.5, 5.7].map(x => <group key={x} position={[x, 0, -2.1]}>
      <mesh position={[0, 2.2, 0]}><cylinderGeometry args={[.025, .025, 4.4, 8]} /><meshStandardMaterial color="#7388ad" /></mesh>
      <mesh position={[.38, 2.85, .02]}><boxGeometry args={[.75, 2.7, .04]} /><meshStandardMaterial color="#20386b" metalness={.2} roughness={.5} /></mesh>
      {Array.from({ length: 9 }, (_, cell) => (Math.floor(cell / 3) + cell % 3) % 2 === 0 && <mesh key={cell} position={[.14 + cell % 3 * .24, 2.9 - Math.floor(cell / 3) * .24, .046]}><planeGeometry args={[.23, .23]} /><meshBasicMaterial color="#536da1" /></mesh>)}
      <mesh position={[0, .16, .3]}><boxGeometry args={[.6, .18, .3]} /><meshStandardMaterial color="#ffdc91" emissive="#ffcc70" emissiveIntensity={2} /></mesh>
      <LightBeam height={8} radius={1.1} />
    </group>)}
    <LightBeam height={10} radius={2.4} />
  </>;
}

export default function WinnerSpotlight3D({ order, paused, reducedMotion }) {
  const winner = order[0];
  const { size } = useThree();
  const turntable = useRef();
  const spotlightTarget = useMemo(() => new Object3D(), []);
  const elapsed = useRef(0);
  useEffect(() => { spotlightTarget.position.set(0, 1.5, 0); }, [spotlightTarget]);
  useFrame(({ camera, gl }, delta) => {
    if (!paused && !reducedMotion && !document.hidden) elapsed.current += Math.min(delta, .1);
    turntable.current.rotation.y = -Math.PI / 2 + (reducedMotion ? 0 : elapsed.current * Math.PI / 6);
    const mobile = size.width <= 700;
    const worldWidth = mobile ? 13.6 : 22;
    const distance = Math.max(12, worldWidth / (2 * Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
    const visibleHeight = 2 * distance * Math.tan(camera.fov * Math.PI / 360);
    const targetX = mobile ? 0 : 4.3;
    const targetY = mobile ? 2 - visibleHeight * .18 : 2;
    camera.position.set(targetX, targetY + 4, distance); camera.lookAt(targetX, targetY, 0);
    camera.updateMatrixWorld();
    gl.domElement.dataset.cameraView = 'winner';
    gl.domElement.dataset.winnerRotation = (reducedMotion ? 0 : elapsed.current * Math.PI / 6).toFixed(3);
    gl.domElement.dataset.winnerId = String(winner.id);
    gl.domElement.dataset.podiumIds = JSON.stringify(order.slice(0, 5).map(employee => employee.id));
  }, -1);
  return <>
    <color attach="background" args={['#081324']} /><fog attach="fog" args={['#081324', 60, 100]} />
    <hemisphereLight args={['#c2d9ff', '#1e2741', 2.2]} />
    <primitive object={spotlightTarget} />
    <spotLight position={[0, 8, 2]} target={spotlightTarget} angle={.48} penumbra={.65} intensity={210} distance={22} color="#ffedb8" castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={.04} />
    <pointLight position={[-5, 3, -3]} color="#388dff" intensity={28} /><pointLight position={[3, 4, -2]} color="#f8be54" intensity={24} />
    <Stage />
    <RunnerResources>{order.slice(0, 5).map((employee, index) => {
      const height = [1.12, .7, .6, .4, .35][index];
      return <group key={employee.id} position={[[0, -2.7, 2.7, -4.8, 4.8][index], 0, index === 0 ? .3 : 0]}>
        <Podium rank={index + 1} height={height} radius={index === 0 ? 1.55 : .95} />
        <group ref={index === 0 ? turntable : undefined} position={[index === 0 ? -.3 : 0, height + .04, 0]} rotation={[0, -Math.PI / 2, 0]} scale={index === 0 ? 1 : .78}>
          <Runner3D employee={employee} color={characters[employee.character].color} showcase={index === 0 ? 'winner' : 'cheer'} reducedMotion />
        </group>
      </group>;
    })}</RunnerResources>
    <Trophy /><Confetti elapsed={elapsed} reducedMotion={reducedMotion} />
  </>;
}
