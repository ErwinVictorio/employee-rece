import { useLayoutEffect, useRef } from 'react';
import { Color, Object3D } from 'three';

// One geometry/material/draw call for all repeated architectural details.
export default function StaticBlocks({ blocks, name, ...props }) {
  const mesh = useRef();
  useLayoutEffect(() => {
    const transform = new Object3D();
    blocks.forEach(({ position, size, color, rotation = 0 }, i) => {
      transform.position.fromArray(position); transform.scale.fromArray(size);
      transform.rotation.set(0, 0, rotation); transform.updateMatrix();
      mesh.current.setMatrixAt(i, transform.matrix);
      mesh.current.setColorAt(i, new Color(color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.instanceColor.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, [blocks]);
  return <instancedMesh ref={mesh} name={name} args={[undefined, undefined, blocks.length]} {...props}><boxGeometry /><meshStandardMaterial roughness={.86} /></instancedMesh>;
}
