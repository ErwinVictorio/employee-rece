import { useEffect, useRef, useState } from 'react';
import trophy from '../assets/character/Trophy.png';
import { Avatar } from './ParticipantsPanel';
export function Results({
  race,
  onAgain,
  onEdit,
  onNew, expanded, onExpandedChange, focusOnMount = true, compact = false
}) {
  const heading = useRef(null);
  const [localExpanded, setLocalExpanded] = useState(false);
  const showResults = expanded ?? localExpanded;
  const setShowResults = onExpandedChange || setLocalExpanded;
  const details = useRef(null);
  useEffect(() => {
    if (focusOnMount) heading.current?.focus();
  }, [focusOnMount]);
  useEffect(() => { if (showResults) details.current?.focus(); }, [showResults]);
  return <section id="race-results" className={`results-panel panel ${compact ? 'compact-results' : ''}`}>{!compact && <><div className="confetti" aria-hidden="true">{Array.from({
        length: 36
      }, (_, i) => <i key={i} style={{
        left: `${i * 37 % 100}%`,
        background: ['#ffd157', '#55b9ff', '#fa5963'][i % 3],
        animationDelay: `${i % 7 * 0.13}s`,
        transform: `rotate(${i * 29}deg)`
      }} />)}</div><div className="winner-heading"><img src={trophy} alt="Winner's trophy" /><div><p className="eyebrow">TODAY’S TRACK CHAMPION</p><h2 ref={heading} tabIndex={-1}>{race.order[0].name}</h2><p>1st place · {race.runners[0].finishTime.toFixed(2)} seconds · All the bragging rights.</p></div></div><div className="podium">{[1, 0, 2].filter(i => race.order[i]).map(i => <div key={i} className={`podium-place place-${i + 1}`}><Avatar employee={race.order[i]} /><strong>{race.order[i].name}</strong><div><span>{['🥇', '🥈', '🥉'][i]}</span><b>{i + 1}</b></div></div>)}</div></>}<div className="actions results-actions"><button className="primary" disabled={!onAgain} onClick={onAgain}>↻ Race Again</button><button className="secondary" onClick={() => setShowResults(!showResults)} aria-expanded={showResults}>{showResults ? 'Hide Results' : 'View Results'}</button><button className="secondary" onClick={onEdit}>Edit Participants</button><button className="quiet" onClick={onNew}>New Game</button></div>{showResults && <div className="results-table"><h3 ref={details} tabIndex={-1}>Every racer. Every finish.</h3><p className="muted">Simulated game times. Ranking was randomly generated before the race.</p><table><thead><tr><th scope="col">Position</th><th scope="col">Employee</th><th scope="col">Finish time</th></tr></thead><tbody>{race.runners.map(r => <tr key={r.employee.id}><td><span className={r.rank === 0 ? 'gold-rank' : ''}>{String(r.rank + 1).padStart(2, '0')}</span></td><td><Avatar employee={r.employee} />{r.employee.name}</td><td>{r.finishTime.toFixed(2)}s</td></tr>)}</tbody></table></div>}</section>;
}

