import companyBackdrop from '../../assets/company-grounds-backdrop.png';
import { Component, createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { characters } from '../../data/assets';
import { progressAt } from '../../utils/race';
import { RacerPortrait } from '../RacerPortrait';
import WinnerSpotlight3D from './WinnerSpotlight3D';
import WinnerSpotlightOverlay from './WinnerSpotlightOverlay';
import './winner-spotlight.css';
import RaceCamera from './RaceCamera';
import RaceBroadcast from './RaceBroadcast';
import Runner3D, { RunnerResources } from './Runner3D';
import RunnerLabels from './RunnerLabels';
import RaceEnvironment from './RaceEnvironment';
import { environmentLaneCapacity, locations, normalizeLocation } from '../../data/locations';
import { SceneLifecycle } from './Stadium3D';
import './prototype.css';
import './broadcast.css';

class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.error ? null : this.props.children; }
}

export default function RaceScene3D({ location = 'stadium', employees: allEmployees, game, onFallback, onBlocked, onAgain, onViewResults }) {
  const venue = normalizeLocation(game.race?.settings.location || location);
  const capacity = environmentLaneCapacity(allEmployees.length);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const celebrating = game.state === 'results';
  const [pausedCelebration, setPausedCelebration] = useState(null);
  const celebrationPaused = game.paused || pausedCelebration === game.race?.id;
  const [view, setView] = useState('stadium');
  const [finishOverride, setFinishOverride] = useState(null);
  const finishEligible = !!game.race && game.elapsed >= game.race.finalStretchAt;
  const finishCam = finishEligible && finishOverride !== game.race.id;
  const liveRanks = new Map((game.race ? [...game.race.runners].sort((a, b) => progressAt(b, game.elapsed) - progressAt(a, game.elapsed) || a.rank - b.rank) : []).map((runner, index) => [runner.employee.id, index + 1]));
  const [laneGroup, setLaneGroup] = useState('auto');
  const focusTime = Math.floor(game.elapsed / 2) * 2;
  const autoGroup = useMemo(() => {
    if (!game.race || !focusTime) return 0;
    const leader = [...game.race.runners].sort((a, b) => progressAt(b, focusTime) - progressAt(a, focusTime) || a.rank - b.rank)[0];
    return Math.floor(Math.max(0, allEmployees.findIndex(e => e.id === leader.employee.id)) / 12);
  }, [game.race, focusTime, allEmployees]);
  const group = laneGroup === 'auto' ? autoGroup : Math.min(Number(laneGroup), Math.floor((allEmployees.length - 1) / 12));
  const laneStart = allEmployees.length > 12 ? Math.max(0, group) * 12 : 0;
  const employees = useMemo(() => allEmployees.slice(laneStart, laneStart + 12), [allEmployees, laneStart]);
  const labeled = new Set([...employees].sort((a, b) => (liveRanks.get(a.id) || 0) - (liveRanks.get(b.id) || 0)).slice(0, allEmployees.length > 12 ? 6 : 12).map(e => e.id));
  function chooseView(next) { setView(next); if (finishEligible) setFinishOverride(game.race.id); }
  const [low, setLow] = useState(true);
  const [fps, setFps] = useState(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const labels = useMemo(() => employees.map(() => createRef()), [employees]);
  const connectors = useMemo(() => employees.map(() => createRef()), [employees]);
  const onReady = useCallback(() => { setReady(true); onBlocked(false); }, [onBlocked]);
  const pause = game.pause;
  const onLost = useCallback(() => { setFailed(true); setReady(false); onBlocked(true); pause(); }, [pause, onBlocked]);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const change = e => setReduced(e.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return <section className="prototype-stadium" aria-label={`3D ${locations[venue].title}`} data-location={venue} data-environment-lanes={capacity}>
    {allEmployees.length > 12 && !celebrating && <div className="focus-controls"><label>Focused lanes <select aria-label="Focused lanes" value={laneGroup} onChange={e => setLaneGroup(e.target.value)}><option value="auto">Follow live leader</option>{Array.from({ length: Math.ceil(allEmployees.length / 12) }, (_, i) => <option key={i} value={i}>Lanes {i * 12 + 1}–{Math.min(allEmployees.length, (i + 1) * 12)}</option>)}</select></label><span>Viewing lanes {laneStart + 1}–{laneStart + employees.length} of {allEmployees.length}. Everyone is racing.</span></div>}
    <div className="three-viewport" style={venue === 'company-image' ? { backgroundImage: `url(${companyBackdrop})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} data-ready={ready && !failed} data-fps={fps}>
      {!failed && <SceneBoundary key={attempt} onError={onLost}><Canvas frameloop={game.race && !game.paused && (!celebrating || (!reduced && !celebrationPaused)) ? 'always' : 'demand'} shadows={!low} dpr={low ? 1 : [1, 1.5]} camera={{ fov: 45, near: 0.1, far: 300 }} gl={{ antialias: !low }} fallback={<div className="three-fallback">3D unavailable. <button onClick={onFallback}>Continue in 2D</button></div>}>
        {celebrating ? <WinnerSpotlight3D location={venue} key={game.race.id} order={game.race.order} paused={celebrationPaused} reducedMotion={reduced} low={low} /> : <><RaceEnvironment location={venue} laneCount={venue !== 'stadium' ? capacity : employees.length} game={game} reducedMotion={reduced} low={low} />
        <RaceCamera location={venue} game={game} laneCount={venue !== 'stadium' ? capacity : employees.length} view={view} finishCam={finishCam} reducedMotion={reduced} />

        <RunnerResources>{employees.map((employee, lane) => <Runner3D key={employee.id} employee={employee} lane={lane} laneCount={employees.length} color={characters[employee.character].color} race={game.race} elapsed={game.elapsed} animationTime={game.animationTime} labelRef={labels[lane]} reducedMotion={reduced} />)}</RunnerResources>
        <RunnerLabels employees={employees} labels={labels} connectors={connectors} game={game} labeled={labeled} /></>}
        <SceneLifecycle onReady={onReady} onLost={onLost} onPerformance={setFps} />
      </Canvas></SceneBoundary>}
      {!failed && !celebrating && <><svg className="runner-connectors" aria-hidden="true">{employees.map((e, i) => <g key={e.id} style={{ display: labeled.has(e.id) ? undefined : 'none' }} ref={connectors[i]} stroke={characters[e.character].color}><path fill="none" strokeWidth="2.5" /><circle r="4" fill={characters[e.character].color} stroke="white" strokeWidth="1.5" /></g>)}</svg><div className="three-labels" aria-hidden="true">{employees.map((e, i) => <div className={`three-name ${employees.length > 6 ? 'compact-name' : ''}`} style={{ display: labeled.has(e.id) ? undefined : 'none', '--team-color': characters[e.character].color }} ref={labels[i]} key={e.id} title={e.name}><RacerPortrait employee={e} /><b>{finishCam || (allEmployees.length > 12 && !['setup', 'countdown'].includes(game.state)) ? liveRanks.get(e.id) : laneStart + i + 1}</b><span className="label-name">{e.name}</span></div>)}</div><RaceBroadcast location={venue} finishCam={finishCam} employees={allEmployees} game={game} /></>}
      {!failed && celebrating && <WinnerSpotlightOverlay race={game.race} onAgain={onAgain} onViewResults={onViewResults} />}
      {!ready && !failed && <div className="three-loading">Preparing venue… <button onClick={onFallback}>Use 2D</button></div>}
      {failed && <div className="three-fallback" role="alert"><h2>3D rendering paused</h2><p>Your race and finish order are saved.</p><button onClick={onFallback}>Resume in 2D</button><button onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Retry 3D</button></div>}
      {game.state === 'countdown' && !failed && <div className="three-countdown"><span>GET READY</span><strong>{game.countdown}</strong></div>}
    </div>
    <div className="prototype-controls">{celebrating ? <button className="quiet" disabled={reduced} aria-pressed={celebrationPaused} onClick={() => { setPausedCelebration(celebrationPaused ? null : game.race.id); if (game.paused) game.resume(); }}>{reduced ? 'Reduced motion' : celebrationPaused ? 'Resume animation' : 'Pause animation'}</button> : <div className="camera-options"><button aria-pressed={!finishCam && view === 'stadium'} onClick={() => chooseView('stadium')}>Wide view</button><button aria-pressed={!finishCam && view === 'side'} onClick={() => chooseView('side')}>Trackside view</button><button disabled={!finishEligible} aria-pressed={finishCam} onClick={() => setFinishOverride(null)}>Finish Cam</button></div>}<label><input type="checkbox" checked={low} onChange={e => setLow(e.target.checked)} /> Low quality</label><button onClick={onFallback}>Use 2D</button></div>
  </section>;
}


