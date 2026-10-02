import { isOpening } from '../../utils/eventTimeline';
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { sampleRunner } from '../../utils/raceMotion';
import { safeViewport, cinematicViewport } from '../../utils/courseLayout';

export default function RunnerLabels({ employees, labels: labelsRef, connectors: connectorsRef, game, layout, regionRef, selectedLane, cinematic = false, showAllNames = false }) {
  const point = useMemo(() => new Vector3(), []);
  const runners = useMemo(() => new Map(game.race?.runners.map(r => [r.employee.id, r]) || []), [game.race]);
  useFrame(({ camera, size }) => {
    const close = regionRef.current.rolling;
    // Batch style writes, then dimension reads, before positioning any labels.
    // Interleaving these for 100 names forces a browser layout per runner.
    const leaders = cinematic && game.race ? [...game.race.runners].sort((a, b) => sampleRunner(b, game.animationTime.current).progress - sampleRunner(a, game.animationTime.current).progress || a.rank - b.rank).slice(0, 3).map(r => r.employee.id) : [];
    labelsRef.forEach((ref, lane) => {
      const leader = leaders.includes(employees[lane].id);
      ref.current?.classList.toggle('overview-name', !close && !(cinematic && (showAllNames || leader)));
      ref.current?.classList.toggle('cinematic-leader', leader);
    });
    const sizes = labelsRef.map(ref => ({ width: ref.current?.offsetWidth || 0, height: ref.current?.offsetHeight || 0 }));
    const placed = [];
    const margins = cinematic ? cinematicViewport(size.width) : safeViewport(size.width, size.height);
    const priority = lane => Number(lane === selectedLane) * 2 + Number(leaders.includes(employees[lane].id));
    const order = employees.map((_, i) => i).sort((a, b) => priority(b) - priority(a));
    for (const lane of order) {
      const element = labelsRef[lane].current, connector = connectorsRef[lane].current;
      if (!element) continue;
      element.style.setProperty('visibility', 'hidden');
      if (connector) connector.style.setProperty('display', 'none');
      if (isOpening(game.state)) continue;
      const runner = runners.get(employees[lane].id);
      const progress = runner ? sampleRunner(runner, game.animationTime.current).progress : 0;
      point.set(-10 + progress * 20, 3.5, layout.zById.get(employees[lane].id)).project(camera);
      if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || Math.abs(point.z) > 1) continue;
      const x = (point.x * .5 + .5) * size.width, y = (-point.y * .5 + .5) * size.height;
      const { width, height } = sizes[lane];
      const left = x - width / 2;
      let top = y - height - 8, found = false;
      for (let offset = 0; offset < (cinematic ? 10 : 4); offset++) {
        top = y - height - 8 - offset * (height + 3);
        if (left < margins.left || left + width > size.width - margins.right || top < margins.top || top + height > size.height - margins.bottom) continue;
        if (placed.some(p => left < p.right + 3 && left + width > p.left - 3 && top < p.bottom + 3 && top + height > p.top - 3)) continue;
        found = true; break;
      }
      if (!found) continue;
      element.style.setProperty('transform', `translate(${left}px, ${top}px)`);
      element.style.setProperty('visibility', 'visible');
      placed.push({ left, right: left + width, top, bottom: top + height });
      if (connector) {
        connector.style.removeProperty('display');
        connector.children[0].setAttribute('d', `M${x},${top + height} L${x},${y}`);
        connector.children[1].setAttribute('cx', x);
        connector.children[1].setAttribute('cy', y);
      }
    }
  });
  return null;
}
