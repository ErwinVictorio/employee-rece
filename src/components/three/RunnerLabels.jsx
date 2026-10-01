import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { sampleRunner } from '../../utils/raceMotion';

export default function RunnerLabels({ employees, labels, connectors, game }) {
  const point = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    const placed = size.width > 700 ? [{ left: 12, right: 274, top: 100, bottom: Math.min(size.height - 65, 160 + employees.length * (employees.length > 8 ? 34 : 56)) }] : [{ left: 0, right: size.width, top: size.height - 65 - Math.ceil(employees.length / 3) * 29, bottom: size.height }];
    employees.forEach((employee, lane) => {
      const element = labels[lane].current;
      if (!element) return;
      const runner = game.race?.runners.find(r => r.employee.id === employee.id);
      const progress = runner ? sampleRunner(runner, game.animationTime.current).progress : 0;
      point.set(-10 + progress * 20, 3.35, (lane - (employees.length - 1) / 2) * 3.2).project(camera);
      const anchorX = (point.x * .5 + .5) * size.width, anchorY = (-point.y * .5 + .5) * size.height;
      const width = element.offsetWidth, height = element.offsetHeight;
      const desiredLeft = Math.max(8, Math.min(size.width - width - 8, anchorX - width * .75 - 12));
      const desired = Math.max(100, anchorY - height - (size.width < 700 ? 18 : 30));
      let top = desired, left = desiredLeft;
      search: for (let ring = 0; ring <= employees.length; ring++) {
        for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const x = desiredLeft + dx * (width + 4), y = desired + dy * (height + 4);
          if (x < 8 || y < 96 || x + width > size.width - 8 || y + height > size.height - 45) continue;
          if (placed.some(p => x < p.right + 3 && x + width > p.left - 3 && y < p.bottom + 3 && y + height > p.top - 3)) continue;
          left = x; top = y; break search;
        }
      }
      element.style.transform = `translate(${left}px, ${top}px)`;
      element.style.visibility = 'visible';
      placed.push({ left, right: left + width, top, bottom: top + height });
      const connector = connectors[lane].current;
      if (connector) {
        const x = left + width * .7, y = top + height;
        connector.children[0].setAttribute('d', `M${x},${y} L${(x + anchorX) / 2},${y} L${anchorX},${anchorY}`);
        connector.children[1].setAttribute('cx', anchorX);
        connector.children[1].setAttribute('cy', anchorY);
      }
    });
  });
  return null;
}
