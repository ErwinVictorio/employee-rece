import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, DynamicDrawUsage, Object3D } from 'three';

const shirts = ['#228af4', '#f9bd3a', '#f25e69', '#e7effb', '#2dc5ad', '#8861e9'];
const skins = ['#f2b68a', '#c98a62', '#8f573f'];

export default function Crowd3D({ placements, laneCount = 2, celebration = false, active = false, excited = false, paused = false, reducedMotion = false, low = true }) {
  const mesh = useRef();
  const clock = useRef({ time: 0, interval: 0, energy: 0, staticPose: true });
  const object = useMemo(() => new Object3D(), []);
  const people = useMemo(() => {
    if (placements) return placements.map((p, i) => ({ ...p, phase: (i * 2.399) % (Math.PI * 2), speed: 1.6 + ((i * 37) % 17) / 12, kind: i % 3 }));
    const list = [];
    for (const side of celebration ? [1] : [-1, 1]) for (let tier = 0; tier < (celebration ? 2 : 3); tier++) for (let seat = 0; seat < (celebration ? 18 : 22); seat++) {
      const index = list.length;
      list.push({ x: celebration ? -8.5 + seat : -15 + seat * 1.4,
        y: celebration ? .3 + tier * .85 : 1.18 + tier * .9,
        z: celebration ? -4.4 - tier * 1.1 : side * (laneCount * 1.6 + 3 + tier * 1.2),
        facing: celebration ? 1 : -side, phase: (index * 2.399) % (Math.PI * 2),
        speed: 1.6 + ((index * 37) % 17) / 12, kind: index % 3 });
    }
    return list;
  }, [laneCount, celebration, placements]);
  const paint = useMemo(() => (time, energy) => {
    people.forEach((p, i) => {
      const phase = time * p.speed + p.phase;
      const bob = Math.sin(phase) * .075 * energy;
      for (let part = 0; part < 5; part++) {
        let x = p.x, y = p.y + bob, z = p.z, rotation = 0;
        if (part === 0) { y += .75; object.scale.set(.23, .27, .23); }
        else if (part === 1) { y += .94; z -= .035 * p.facing; object.scale.set(.235, .13, .23); }
        else if (part === 2) { y += .27; object.scale.set(.31, .40, .23); }
        else {
          const side = part === 3 ? -1 : 1;
          x += side * .35; y += .27; object.scale.set(.09, .25, .1);
          if (p.kind === 1) { // clap in front of the torso
            x -= side * (.12 + .10 * Math.sin(phase * 2)) * energy;
            y += .18 * energy; z += .26 * energy * p.facing; rotation = side * .8 * energy;
          } else if (p.kind === 2) {
            y += .42 * energy; rotation = side * (1.9 + Math.sin(phase * 1.4) * .45) * energy;
          }
        }
        object.position.set(x, y, z); object.rotation.set(0, 0, rotation); object.updateMatrix();
        mesh.current.setMatrixAt(i * 5 + part, object.matrix);
      }
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [object, people]);
  useLayoutEffect(() => {
    mesh.current.instanceMatrix.setUsage(DynamicDrawUsage);
    people.forEach((_, i) => {
      for (let part = 0; part < 5; part++) mesh.current.setColorAt(i * 5 + part, new Color(part === 1 ? (i % 4 ? '#392b24' : '#b98a51') : part === 2 ? shirts[i % 6] : skins[i % 3]));
    });
    mesh.current.instanceColor.needsUpdate = true;
    paint(0, 0);
  }, [people, paint]);
  useFrame(({ gl }, delta) => {
    const state = clock.current;
    const frozen = paused || reducedMotion || !active || document.hidden;
    if (!frozen) {
      const dt = Math.min(delta, .1);
      const target = celebration ? 1.65 : excited ? 1.35 : .65;
      state.energy += (target - state.energy) * (1 - Math.exp(-dt * 3));
      state.time += dt * (excited || celebration ? 1.35 : 1);
      state.interval += dt;
    }
    if (reducedMotion || !active) {
      if (!state.staticPose) paint(0, 0);
      state.staticPose = true;
    } else if (!frozen && state.interval >= 1 / (low ? 20 : 30)) {
      paint(state.time, state.energy); state.interval = 0; state.staticPose = false;
    }
    gl.domElement.dataset.crowdTime = state.time.toFixed(3);
    gl.domElement.dataset.crowdEnergy = (reducedMotion || !active ? 0 : state.energy).toFixed(3);
    gl.domElement.dataset.crowdCount = String(people.length);
  });
  // One draw call, low-poly geometry, no shadow pass or per-person React state.
  return <instancedMesh ref={mesh} args={[undefined, undefined, people.length * 5]} frustumCulled={false} name="animated-crowd"><sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial /></instancedMesh>;
}
