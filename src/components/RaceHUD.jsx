import { comebackRunner, sampleRunner } from '../utils/raceMotion';
export function RaceHUD({ game, employees, duration, canResume = true }) {
  const runners = game.race?.runners.map(r => ({ ...r, ...sampleRunner(r, game.elapsed) })) || [];
  runners.sort((a, b) => b.progress - a.progress || a.rank - b.rank);
  const event = runners.find(r => r.event);
  const comeback = comebackRunner(game.race, game.elapsed);
  return <section className="panel race-hud" aria-label="Race standings">
    <div className="prototype-toolbar"><strong>{employees.length} racers</strong><span>{Math.ceil(Math.max(0, duration - game.elapsed))} SEC</span></div>
    <p aria-live="polite">{game.paused ? 'Race paused' : comeback ? `${comeback.employee.name} is making a comeback!` : event ? `${event.employee.name} ${event.pose === 'comeback' ? 'is catching up!' : event.pose === 'recovering' ? 'is getting back up!' : 'takes a tumble!'}` : 'Race order is randomized at the start. Fun moments add surprises along the way.'}</p>
    <ol className="full-standings">{runners.map(r => <li key={r.employee.id}><span>{r.employee.name}</span><small>Lane {employees.findIndex(e => e.id === r.employee.id) + 1} · {r.pose === 'finished' ? `Finished #${r.rank + 1}` : r.pose === 'running' ? 'Running' : r.pose}</small></li>)}</ol>
    {game.paused && <button className="primary" disabled={!canResume} onClick={game.resume}>Resume race</button>}
  </section>;
}
