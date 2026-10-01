import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eligibleEmployees, recordWinner } from './utils/winnerEligibility';
import { defaultEmployees } from './data/assets';
import { useRace } from './hooks/useRace';
import { useGameAudio } from './hooks/useGameAudio';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { RendererBoundary } from './components/RendererBoundary';
import { RaceHUD } from './components/RaceHUD';
import { RaceTrack } from './components/RaceTrack';
import { Results } from './components/Results';
import { ConfirmDialog } from './components/ConfirmDialog';
import './App.css';
import DurationSettings from './components/DurationSettings';
import { raceTiming } from './utils/roster';
const RaceScene3D = lazy(() => import('./components/three/RaceScene3D'));
const RacePrototype3D = import.meta.env.DEV ? lazy(() => import('./components/three/RacePrototype3D')) : null;
export default function App() {
  const [prototype, setPrototype] = useState(() => import.meta.env.DEV && new URLSearchParams(location.search).has('prototype'));
  const [renderer, setRenderer] = useState(() => {
    try { const canvas = document.createElement('canvas'); const gl = canvas.getContext('webgl2'); if (!gl) return '2d'; gl.getExtension('WEBGL_lose_context')?.loseContext(); return '3d'; } catch { return '2d'; }
  });
  const [funMoments, setFunMoments] = useState(true);
  const [rendererBlocked, setRendererBlocked] = useState(true);
  const pendingStart = useRef(false);
  const [employees, setEmployees] = useState(defaultEmployees);
  const [duration, setDuration] = useState(15);
  const [customDuration, setCustomDuration] = useState(false);
  const [minutes, setMinutes] = useState('1');
  const invalidDuration = customDuration && (!/^\d+$/.test(minutes) || Number(minutes) < 1 || Number(minutes) > 10);
  const [effects, setEffects] = useState(true);
  const [ambience, setAmbience] = useState(true);
  const [confirmation, setConfirmation] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [error, setError] = useState('');
  const [excludeWinners, setExcludeWinners] = useState(true);
  const [winnerIds, setWinnerIds] = useState([]);
  const rememberWinner = useCallback(winner => setWinnerIds(ids => recordWinner(ids, winner.id)), []);
  const game = useRace(rememberWinner);
  const eligible = useMemo(() => eligibleEmployees(employees, winnerIds, excludeWinners), [employees, winnerIds, excludeWinners]);
  // Keep the finished/current race intact when its winner becomes excluded.
  const racers = useMemo(() => game.race ? employees.filter(e => game.race.order.some(r => r.id === e.id)) : eligible, [employees, game.race, eligible]);
  const unlock = useGameAudio(game.state, effects, ambience, game);
  const isSetup = game.state === 'setup';
  useEffect(() => { if (game.state === 'setup' || game.state === 'results') pendingStart.current = false; }, [game.state]);
  async function start() {
    if (pendingStart.current) return;
    if (invalidDuration) { setError('Enter a whole number from 1 to 10 minutes.'); return; }
    if (eligible.length < 2) { setError('At least 2 eligible employees are needed. Add employees or restore previous winners.'); return; }
    pendingStart.current = true;
    try {
      setResultsOpen(false);
      unlock();
      await game.start(eligible, duration, { funMoments });
      window.scrollTo({ top: 0, behavior: 'instant' });
      setError('');
    } catch (e) {
      setError(e.message);
      pendingStart.current = false;
    }
  }
  function viewResults() {
    setResultsOpen(true);
    requestAnimationFrame(() => document.querySelector('#race-results .results-table h3')?.focus());
  }
  function fallback() { game.synchronizeClock(); setRenderer('2d'); game.resume(); }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen();
    } catch {
      setError('Fullscreen is unavailable in this browser.');
    }
  }
  if (import.meta.env.DEV && prototype) return <Suspense fallback={<p>Loading fixture…</p>}><RacePrototype3D onBack={() => setPrototype(false)} /></Suspense>;
  return <div className={`app-shell ${!isSetup ? 'race-active' : ''}`}>
    <header className="header"><a className="brand" href="./" onClick={e => { if (!isSetup && game.state !== 'results') { e.preventDefault(); setConfirmation('reset'); } }} aria-label="Employee Race home"><span className="brand-mark">ER<span>↗</span></span><span>EMPLOYEE <strong>RACE</strong><small>THE OFFICE. THE TRACK. THE GLORY.</small></span></a>
      <nav aria-label="Game controls"><button className="quiet" onClick={() => {
          const on = !effects && !ambience;
          setEffects(on);
          setAmbience(on);
        }} aria-pressed={effects || ambience}>{effects || ambience ? '♫ Sound on' : '♫ Sound off'}</button><button className="quiet" onClick={fullscreen}>⛶ <span className="desktop-label">Fullscreen</span></button><button className="quiet" onClick={() => setConfirmation('reset')}>↺ Reset</button></nav>
    </header>
    <main>
      <div className="page-heading"><div><p className="eyebrow">TEAM SPIRIT. FRIENDLY COMPETITION.</p><h1>{isSetup ? 'Your team. Anyone’s race.' : game.state === 'results' ? 'A finish worth celebrating.' : 'Let the race do the talking.'}</h1><p>{isSetup ? 'Pick your racers, set the pace, and give your team a moment in the spotlight.' : 'One team, a little luck, and a whole lot of cheering.'}</p></div><span className="edition">STADIUM SERIES <b>01</b></span></div>
      {error && <p role="alert" className="error">{error}</p>}
      {isSetup && eligible.length > 12 && <p className="panel large-race-note">All {eligible.length} eligible employees race together. Focused 3D shows up to 12 lanes at a time; full standings include everyone. Effective race duration: {raceTiming(eligible.length, duration).duration} seconds, with at least 0.12 seconds between finishes.</p>}
      {game.preparing && <p role="status" className="panel">Preparing all runners… <button onClick={() => { game.reset(); pendingStart.current = false; }}>Cancel preparation</button></p>}
      {(isSetup || game.state === 'results') && <section className="panel winner-exclusion" aria-label="Winner eligibility">
        <label className="toggle-row"><span>Exclude previous winners<small>Winners automatically leave the next race. Their employee details are kept.</small></span><input aria-label="Exclude previous winners" type="checkbox" checked={excludeWinners} onChange={e => { setExcludeWinners(e.target.checked); setError(''); }} /></label>
        <p role="status">{eligible.length} eligible for the next race · {employees.length - eligible.length} excluded</p>
        {winnerIds.length > 0 && <><p>Previous winners: {employees.filter(e => winnerIds.includes(e.id)).map(e => e.name).join(', ') || 'Removed employees'}</p><button className="secondary" onClick={() => { setWinnerIds([]); setError(''); }}>Restore previous winners</button></>}
        {eligible.length < 2 && <p className="error">At least 2 eligible employees are needed. Add employees or restore previous winners.</p>}
        <small className="muted">Winner history lasts until New Game or page reload. Reset race keeps it.</small>
      </section>}
      {isSetup && <div className="setup-grid"><ParticipantsPanel disabled={game.preparing} employees={employees} excludedIds={excludeWinners ? winnerIds : []} onChange={setEmployees} /><section className="panel settings"><div className="section-heading"><h2><span className="step">02</span> Set the race</h2><span className="muted">Make it yours</span></div><DurationSettings duration={duration} onChange={setDuration} custom={customDuration} onCustomChange={setCustomDuration} minutes={minutes} onMinutesChange={setMinutes} /><div className="theme-card"><span>🏟</span><div><strong>Stadium</strong><small>A big stage for your team</small></div><span className="theme-tag">SELECTED</span></div><label className="toggle-row"><span>Sound effects<small>Countdown, footsteps & victory</small></span><input type="checkbox" checked={effects} onChange={e => setEffects(e.target.checked)} /></label><label className="toggle-row"><span>Stadium ambience<small>Bring the crowd to life</small></span><input type="checkbox" checked={ambience} onChange={e => setAmbience(e.target.checked)} /></label><label className="toggle-row"><span>Fun moments<small>Runners can trip, recover, and still win.</small></span><input type="checkbox" checked={funMoments} onChange={e => setFunMoments(e.target.checked)} /></label><label className="toggle-row"><span>Presentation</span><select aria-label="Presentation" value={renderer} onChange={e => { setRendererBlocked(e.target.value === '3d'); setRenderer(e.target.value); }}><option value="3d">3D stadium</option><option value="2d">2D / low power</option></select></label><button className="primary start-button" disabled={game.preparing || invalidDuration || eligible.length < 2 || (renderer === '3d' && rendererBlocked)} onClick={start}>Start Race <span>→</span></button><p className="fairness">{eligible.length < 2 ? 'Add at least 2 eligible employees to start.' : 'Everyone has a chance. The order is randomized at the start.'}</p></section></div>}
      {renderer === '3d' ? <RendererBoundary onError={() => { setRendererBlocked(true); game.pause(); }} onFallback={fallback}><Suspense fallback={<div className="panel">Loading stadium… <button onClick={fallback}>Use 2D</button></div>}><RaceScene3D onAgain={!game.preparing && eligible.length >= 2 ? start : undefined} onViewResults={viewResults} onBlocked={setRendererBlocked} employees={racers} game={game} onFallback={fallback} /></Suspense></RendererBoundary> : <RaceTrack employees={racers} game={game} duration={game.race?.duration || duration} />}
      {!(renderer === '3d' && game.state === 'results') && <RaceHUD canResume={renderer !== '3d' || !rendererBlocked} employees={racers} game={game} duration={game.race?.duration || duration} />}
      {game.state === 'results' && <Results expanded={resultsOpen} onExpandedChange={setResultsOpen} compact={renderer === '3d'} focusOnMount={renderer !== '3d'} race={game.race} onAgain={!game.preparing && eligible.length >= 2 ? start : undefined} onEdit={game.reset} onNew={() => setConfirmation('new')} />}
      {!isSetup && game.state !== 'results' && <div className="race-footer"><span>Results are locked. The excitement is just getting started.</span><button className="quiet" onClick={() => setConfirmation('reset')}>Stop race</button></div>}
    </main>
    <footer><span>EMPLOYEE RACE <b> / </b> A little competition. A lot of team spirit.</span><span>Made for your next team moment.</span></footer>
    {confirmation && <ConfirmDialog title={confirmation === 'new' ? 'Start a new game?' : 'Reset the current race?'} description={confirmation === 'new' ? 'All participants, results, and winner history will be cleared. Your race settings will be kept.' : 'The race will stop and current results will be cleared. Participants, settings, and winner history will be kept.'} confirmLabel={confirmation === 'new' ? 'New Game' : 'Reset race'} onCancel={() => setConfirmation(null)} onConfirm={() => {
      game.reset();
      if (confirmation === 'new') { setEmployees([]); setWinnerIds([]); }
      setError('');
      setConfirmation(null);
    }} />}
  </div>;
}
