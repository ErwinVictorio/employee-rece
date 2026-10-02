import { isPreRace } from '../../utils/eventTimeline';
import { locations, normalizeLocation } from '../../data/locations';
import { comebackRunner } from '../../utils/raceMotion';
import { characters } from '../../data/assets';
import { sampleRunner } from '../../utils/raceMotion';
import { RacerPortrait } from '../RacerPortrait';

export default function RaceBroadcast({ location = 'stadium', employees, game, finishCam = false, onFocus }) {
  const standings = game.race && !isPreRace(game.state) ? game.race.runners.map(r => ({ ...r, ...sampleRunner(r, game.elapsed) })).sort((a, b) => b.progress - a.progress || a.rank - b.rank) : employees.map(employee => ({ employee, pose: 'ready' }));
  const seconds = Math.min(game.elapsed, game.race?.duration || 0);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
  const comeback = comebackRunner(game.race, game.elapsed);
  const event = standings.find(r => r.event);
  return <div className="race-broadcast">
    <div className="broadcast-title"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="31" cy="8" r="5" fill="currentColor" /><path d="M8 18l11-5 10 6 8 2 5-5M24 19l-8 11 11 6-8 8M17 29l-7 6H4" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg><div><strong>{finishCam ? 'Finish Cam' : locations[normalizeLocation(location)].title}</strong><small>100m DASH <span>•</span> {finishCam ? 'FINAL STRETCH' : `${employees.length} RACERS`}</small></div></div>
    <div className="broadcast-timer"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" /><path d="M16 8v9l6 3" /></svg><div><small>{game.paused ? 'PAUSED' : game.state === 'setup' ? 'RACE CLOCK' : 'ELAPSED'}</small><strong>{time}</strong></div></div>
    <aside tabIndex={0} className={`broadcast-board ${employees.length > 8 ? 'large-field' : ''}`} aria-label="Live race order"><div className="broadcast-board-heading"><span className={game.race ? 'live-dot' : ''} />{game.state === 'results' ? 'FINAL CLASSIFICATION' : game.race && !isPreRace(game.state) ? 'LIVE STANDINGS' : 'STARTING LINEUP'}</div><ol>{standings.map((r, i) => <li key={r.employee.id} style={{ '--team-color': characters[r.employee.character].color }}><b>{i + 1}</b><RacerPortrait employee={r.employee} /><span title={r.employee.name}><button className="focus-employee" onClick={() => onFocus?.(employees.findIndex(e => e.id === r.employee.id))} aria-label={`Focus ${r.employee.name}`}>{r.employee.name}</button><small>LANE {employees.findIndex(e => e.id === r.employee.id) + 1}</small></span>{r.pose === 'finished' && <em>✓</em>}</li>)}</ol></aside>
    <div className="broadcast-caption"><span className="live-dot" />{game.paused ? 'Race paused · Your place is saved' : comeback ? `${comeback.employee.name} is making a comeback!` : event ? `${event.employee.name} ${event.pose === 'comeback' ? 'is catching up!' : event.pose === 'recovering' ? 'is back on their feet!' : 'takes a tumble!'}` : game.state === 'setup' ? 'The track is yours. Ready to race?' : game.state === 'results' ? `${game.race.order[0].name} takes the cup!` : game.state === 'countdown' ? 'On your marks. Get set…' : game.state === 'finished' ? `${game.race.order[0].name} crosses first!` : finishCam ? 'Final stretch · Every lane stays in view' : 'Every lane. A chance at glory.'}</div>
  </div>;
}
