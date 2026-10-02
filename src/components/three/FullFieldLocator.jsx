import { useEffect, useRef } from 'react';
import { progressAt } from '../../utils/race';
import { characters } from '../../data/assets';

export default function FullFieldLocator({ employees, game, regionRef, onFocus, manualLane, onResume }) {
  const svg = useRef();
  useEffect(() => {
    let frame;
    const update = () => {
      if (!svg.current) return;
      const current = regionRef.current;
      const band = svg.current.querySelector('rect');
      const count = employees.length;
      band.setAttribute('x', current.rolling ? current.first / Math.max(1, count) * 1000 : 0);
      band.setAttribute('width', current.rolling ? (current.last - current.first + 1) / Math.max(1, count) * 1000 : 1000);
      svg.current.querySelectorAll('circle').forEach((marker, i) => {
        const runner = game.race?.runners.find(r => r.employee.id === employees[i].id);
        marker.setAttribute('cy', 65 - (runner ? progressAt(runner, game.animationTime.current) : 0) * 50);
      });
      frame = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(frame);
  }, [employees, game.race, game.animationTime, regionRef]);
  return <div className="full-field-locator">
    <div><strong>Full field · {employees.length} runners</strong><span> Start below · Finish above</span></div>
    <svg ref={svg} viewBox="0 0 1000 80" preserveAspectRatio="none" aria-label="All runners and camera region" role="img">
      <rect y="2" height="76" fill="#55b9ff25" stroke="#55b9ff" />
      {employees.map((e, i) => <circle key={e.id} cx={(i + .5) / employees.length * 1000} cy="65" r="4" fill={characters[e.character].color}><title>{`Lane ${i + 1}: ${e.name}`}</title></circle>)}
    </svg>
    <label>Focus lane <select aria-label="Focus lane" value={manualLane ?? ''} onChange={e => e.target.value === '' ? onResume() : onFocus(Number(e.target.value))}><option value="">Automatic</option>{employees.map((e, i) => <option key={e.id} value={i}>{i + 1} · {e.name}</option>)}</select></label>
    <button onClick={onResume}>Resume auto camera</button>
  </div>;
}
