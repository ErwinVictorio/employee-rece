import { useEffect, useMemo } from 'react';
import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three';
import { branding } from '../../data/branding';
import { useBrandTexture } from '../../hooks/useBrandTexture';
import Runner3D, { RunnerResources } from './Runner3D';
import { StageGarden, StagePlants, StageSpeaker, StageTruss, Trophy } from './StageDetails3D';

export function BrandPanel({ position, width = 8, rotation = [0, Math.PI / 2, 0], variant = 'logo', backing = true }) {
  const texture = useBrandTexture(variant);
  const height = width * (variant === 'logoStacked' ? 340 / 260 : .26);
  return <group position={position} rotation={rotation}>
    {backing && <mesh><planeGeometry args={[width, height]} /><meshBasicMaterial color="white" side={DoubleSide} /></mesh>}
    <mesh position={[0, 0, .01]}><planeGeometry args={[width, height]} /><meshBasicMaterial map={texture} transparent side={DoubleSide} /></mesh>
  </group>;
}
function Block({ position, scale, color, glow = false }) {
  return <mesh position={position} scale={scale}><boxGeometry />{glow ? <meshBasicMaterial color={color} /> : <meshStandardMaterial color={color} roughness={.65} />}</mesh>;
}
function Screen() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1120;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 2048, 1120);
    gradient.addColorStop(0, '#03174f'); gradient.addColorStop(.45, '#074ad6'); gradient.addColorStop(1, '#021348');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 2048, 1120);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#3c8fff15' : '#020e432b'; ctx.beginPath(); ctx.moveTo(i * 430 - 900, 0); ctx.lineTo(i * 430 - 400, 0); ctx.lineTo(i * 430 + 700, 1120); ctx.lineTo(i * 430 + 200, 1120); ctx.fill();
    }
    ctx.strokeStyle = '#092c7399'; ctx.lineWidth = 10;
    for (const x of [170, 1770]) {
      ctx.beginPath(); ctx.moveTo(x - 90, 1120); ctx.lineTo(x + 20, 470); ctx.lineTo(x + 150, 1120);
      for (let y = 600; y < 1100; y += 100) { ctx.moveTo(x - 60, y); ctx.lineTo(x + 110, y + 100); ctx.moveTo(x + 110, y); ctx.lineTo(x - 60, y + 100); }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd85b'; ctx.textAlign = 'center'; ctx.font = '700 52px Arial'; ctx.fillText('WELCOME TO', 1024, 555);
    ctx.fillStyle = 'white'; ctx.font = '900 139px Arial'; ctx.fillText(branding.title.toUpperCase(), 1024, 735, 1740);
    ctx.strokeStyle = '#72bdff80'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(360, 840); ctx.lineTo(1688, 840); ctx.stroke();
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <group><mesh position={[-.67, 7.35, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[21, 11.5]} /><meshBasicMaterial map={texture} /></mesh><BrandPanel position={[-.64, 10.2, 0]} width={16.5} variant="logoWhite" backing={false} /></group>;
}
function LightFixtures() {
  return <group>{[-9, -6, -3, 0, 3, 6, 9].map((z, i) => <group key={z}>
    <mesh position={[0, 13.1, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.27, .35, .75, 12]} /><meshStandardMaterial color="#142239" /></mesh>
    <mesh position={[.39, 13.1, z]} rotation={[0, Math.PI / 2, 0]}><circleGeometry args={[.25, 16]} /><meshBasicMaterial color={i % 2 ? '#c1eaff' : '#ffffff'} /></mesh>
    <mesh position={[.15, 8.4, z]}><coneGeometry args={[1.3, 8.7, 16, 1, true]} /><meshBasicMaterial color={i % 2 ? '#70bbff' : '#cfe9ff'} transparent opacity={.045} depthWrite={false} side={DoubleSide} /></mesh>
    <mesh position={[1.5, 1.6, z]} rotation={[0, 0, -.2]}><cylinderGeometry args={[.23, .32, .45, 10]} /><meshStandardMaterial color="#192638" /></mesh>
    <mesh position={[1.5, 1.84, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.19, 12]} /><meshBasicMaterial color="#71cfff" /></mesh>
  </group>)}</group>;
}
const host = { id: 'event-host', name: 'Event host', character: 1 };
export default function EventStage3D({ event, layout }) {
  const x = event.stageX;
  return <group name="company-event-stage">
    <group position={[x, 0, 0]}>
      <Block position={[(-17 - x) / 2 - 2, -.04, 0]} scale={[-17 - x + 4, .1, Math.max(event.width + 4, layout.halfWidth * 2)]} color="#72849b" />
      <Block position={[0, .65, 0]} scale={[6, 1.3, 32]} color="#0b1930" />
      <Block position={[0, 1.32, 0]} scale={[6, .07, 32]} color="#647798" />
      <Block position={[3.02, 1.18, 0]} scale={[.08, .09, 32]} color="#68d8ff" glow />
      {[0, 1, 2, 3].map(i => <group key={i}>
        <Block position={[3.35 + i * .52, .54 - i * .13, 0]} scale={[.55, 1.08 - i * .26, 14 - i * .35]} color="#182a46" />
        <Block position={[3.64 + i * .52, 1.08 - i * .26, 0]} scale={[.035, .045, 14 - i * .35]} color="#63d5ff" glow />
      </group>)}
      <Block position={[-1, 7.35, 0]} scale={[.5, 11.6, 21.2]} color="#061531" />
      <StageGarden /><Screen /><StageTruss /><LightFixtures />
      {[-1, 1].map(side => <group key={side}>
        <Block position={[-.6, 7.6, side * 14]} scale={[.15, 9.4, 3.8]} color="#f1f5ff" />
        <BrandPanel position={[-.5, 8.6, side * 14]} width={3.35} variant="logoStacked" />
        <Block position={[-.48, 3.65, side * 14]} scale={[.025, 1.5, 3.8]} color="#1355dd" />
        <Block position={[-.47, 4.65, side * 14]} scale={[.025, .25, 3.8]} color="#56b8ff" />
        <StageSpeaker position={[1.7, 3.3, side * 11]} />
      </group>)}
      <StagePlants />
      <BrandPanel position={[16, .016, 0]} width={8} rotation={[-Math.PI / 2, 0, Math.PI / 2]} variant="logoWhite" backing={false} />
      <group position={[.2, 1.34, 0]}><RunnerResources><Runner3D employee={host} color="#55b9ff" showcase="cheer" reducedMotion /></RunnerResources></group>
      <Block position={[1.4, 2.35, 0]} scale={[1.05, 2.05, 2.7]} color="#e6edf7" />
      <Block position={[1.4, 3.45, 0]} scale={[1.4, .2, 3.2]} color="#5d422e" />
      <BrandPanel position={[1.94, 2.45, 0]} width={1.35} variant="logoStacked" />
      <Block position={[1.2, 3.8, -.6]} scale={[.045, .6, .045]} color="#0c1526" />
      <mesh position={[1.2, 4.1, -.6]}><sphereGeometry args={[.1, 8, 6]} /><meshStandardMaterial color="#111c2d" /></mesh>
      <Block position={[.8, 2.15, -6.8]} scale={[2.2, 1.65, 5.6]} color="#0a368f" />
      <Block position={[.8, 3.02, -6.8]} scale={[2.4, .12, 5.8]} color="#154fba" />
      <BrandPanel position={[1.92, 2.1, -6.8]} width={3.8} variant="logoWhite" backing={false} />
      {[-2, -1, 0, 1, 2].map(i => <Trophy key={i} position={[.8, 3.09, -6.8 + i]} scale={i === 0 ? 1.3 : .9} />)}
    </group>
    {[-1, 1].flatMap(side => [-9, 0, 9].map(at => <group key={`${side}:${at}`}>
      <Block position={[at, 1.4, side * (layout.halfWidth + .7)]} scale={[7, 2.4, .12]} color="white" />
      <BrandPanel position={[at, 1.5, side * (layout.halfWidth + .61)]} width={6.6} rotation={[0, side === 1 ? Math.PI : 0, 0]} />
    </group>))}
  </group>;
}
