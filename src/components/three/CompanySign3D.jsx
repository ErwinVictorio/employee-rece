import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';

export default function CompanySign3D({ position }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = '#18352e'; context.fillRect(0, 0, 512, 64);
    context.fillStyle = '#efd59a'; context.font = 'bold 32px sans-serif'; context.textAlign = 'center';
    context.fillText('COMPANY GROUNDS', 256, 43);
    const result = new CanvasTexture(canvas); result.colorSpace = SRGBColorSpace; return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={position}><planeGeometry args={[6, .75]} /><meshBasicMaterial map={texture} /></mesh>;
}
