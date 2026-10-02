import { sampleRunner } from '../utils/raceMotion';
import { isPreRace } from '../utils/eventTimeline';
import { characters } from '../data/assets';
import './cinematic.css';

export default function CinematicBroadcast({ game, employees, blocked, onExit, exitRef, announcer, showAllNames, onToggleNames }) {
  const preRace = isPreRace(game.state);
  const leaders = !preRace && game.race ? game.race.runners.map(r => ({ ...r, ...sampleRunner(r, game.elapsed) })).sort((a, b) => b.progress - a.progress || a.rank - b.rank).slice(0, 3) : [];
  const seconds = Math.min(game.elapsed, game.race?.duration || 0);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
  const status = blocked ? '3D recovery needed' : game.paused ? 'Paused' : ({ setup: 'Ready · Exit to set up your race', arrival: 'Opening ceremony', welcome: `Welcome · ${game.welcomeRemaining}s`, lineup: 'Taking starting lanes', countdown: `Starting in ${game.countdown}`, racing: 'Race live', finalStretch: 'Final stretch', finished: 'Runners finishing', results: 'Race complete' })[game.state];
  const cue = game.state === 'countdown' ? game.countdown : game.state === 'racing' && game.elapsed < 1 ? 'GO!' : game.state === 'finalStretch' && game.elapsed - game.race.finalStretchAt < 2 ? 'FINAL STRETCH' : null;
  return <div className={`cinematic-broadcast ${game.state === 'results' ? 'cinematic-results' : ''}`} aria-label="Cinematic race broadcast">
    {cue !== null && <div className="cinematic-cue" role="status"><span>{game.state === 'countdown' ? 'GET READY' : 'SPRINT CUP'}</span><strong key={cue}>{cue}</strong></div>}
    {game.state !== 'results' && <button className="cinematic-names" aria-pressed={showAllNames} onClick={onToggleNames}>{showAllNames ? 'Compact names' : 'Show all names'}</button>}
    <div className="cinematic-clock"><span>RACE TIME</span><strong>{time}</strong></div>
    <div className="cinematic-actions">{announcer && <button aria-label="Toggle spoken announcer" aria-pressed={announcer.enabled} onClick={() => announcer.setEnabled(!announcer.enabled)}>{announcer.enabled ? "Voice on" : "Voice off"}</button>}{game.race && <button disabled={blocked} onClick={game.paused ? game.resume : game.pause}>{game.paused ? 'Resume' : 'Pause'}</button>}<button ref={exitRef} onClick={onExit} aria-label="Exit cinematic fullscreen">Exit fullscreen <span aria-hidden="true">⤢</span></button></div>
    <div className="cinematic-bottom"><section className="cinematic-leaders" aria-label="Top 3 live standings"><h2>{game.state === 'results' ? 'FINAL TOP 3' : 'LIVE TOP 3'}</h2>{leaders.length ? <ol>{leaders.map((r, i) => <li key={r.employee.id} data-employee-id={r.employee.id} style={{ '--team-color': characters[r.employee.character].color }}><b>{i + 1}</b><span title={r.employee.name}>{r.employee.name}</span><small>{r.pose === 'finished' ? 'FIN' : `L${employees.findIndex(e => e.id === r.employee.id) + 1}`}</small></li>)}</ol> : <p>Standings appear at the start.</p>}</section><p className="cinematic-status" role="status"><i className={game.paused || preRace ? '' : 'is-live'} />{status}</p></div>
  </div>;
}
