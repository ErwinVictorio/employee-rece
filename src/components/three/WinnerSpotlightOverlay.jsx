import { useEffect, useRef } from 'react';
import { RacerPortrait } from '../RacerPortrait';

export default function WinnerSpotlightOverlay({ race, onAgain, onViewResults }) {
  const heading = useRef();
  const winner = race.runners[0];
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [race.id]);
  return <div className="winner-spotlight" data-winner-id={winner.employee.id}>
    <div className="spotlight-kicker"><span>★</span> WINNER SPOTLIGHT</div>
    <section className="spotlight-card" aria-label="Race winner">
      <span className="spotlight-place">1ST PLACE</span>
      <RacerPortrait employee={winner.employee} />
      <p className="eyebrow">YOUR SPRINT CUP CHAMPION</p>
      <h2 ref={heading} tabIndex={-1}>{winner.employee.name}</h2>
      <div className="spotlight-time"><strong>{winner.finishTime.toFixed(2)}<small>s</small></strong><span>FINISH TIME</span></div>
      <p className="spotlight-note">A winning moment. A team worth celebrating.</p>
      <div className="spotlight-actions"><button className="primary" onClick={onAgain}>↻ Race Again</button><button className="secondary" onClick={onViewResults}>View Results</button></div>
      <small className="spotlight-disclaimer">Simulated game time · Randomized race order</small>
    </section>
  </div>;
}
