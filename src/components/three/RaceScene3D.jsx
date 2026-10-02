import { Suspense } from 'react';
import EventStage3D from './EventStage3D';
import EventWelcome from '../EventWelcome';
import { eventLayout } from '../../utils/eventLayout';
import { isOpening } from '../../utils/eventTimeline';
import companyBackdrop from '../../assets/company-grounds-backdrop.png';
import { Component, createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { characters } from '../../data/assets';
import { RacerPortrait } from '../RacerPortrait';
import WinnerSpotlight3D from './WinnerSpotlight3D';
import WinnerSpotlightOverlay from './WinnerSpotlightOverlay';
import './winner-spotlight.css';
import RaceCamera from './RaceCamera';
import RaceBroadcast from './RaceBroadcast';
import Runner3D, { RunnerResources } from './Runner3D';
import RunnerLabels from './RunnerLabels';
import RaceEnvironment from './RaceEnvironment';
import { locations, normalizeLocation } from '../../data/locations';
import { SceneLifecycle } from './Stadium3D';
import './prototype.css';
import './broadcast.css';
import { courseLayout } from '../../utils/courseLayout';
import FullRosterRunners from './FullRosterRunners';
import FullFieldLocator from './FullFieldLocator';

class SceneBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.error ? null : this.props.children; }
}

function Unavailable3D({ onRetry }) {
  return <div className="three-fallback" role="alert"><p>WebGL is unavailable. Enable hardware acceleration or use a WebGL-capable browser.</p><button onClick={onRetry}>Retry 3D</button></div>;
}

function EventReady({ game }) {
  useFrame(() => { if (game.race) game.markReady(game.race.id); });
  return null;
}

export default function RaceScene3D({ location = 'stadium', employees: allEmployees, game, cinematic = false, showAllNames = false, onBlocked, onAgain, onViewResults }) {
  const venue = normalizeLocation(game.race?.settings.location || location);
  const layout = useMemo(() => courseLayout(allEmployees), [allEmployees]);
  const capacity = layout.laneCount;
  const event = useMemo(() => eventLayout(capacity, venue), [capacity, venue]);
  const regionRef = useRef({});
  const [manualChoice, setManualChoice] = useState(null);
  const manualLane = manualChoice && manualChoice.raceId === game.race?.id ? manualChoice.lane : null;
  const setManualLane = lane => setManualChoice({ raceId: game.race?.id, lane });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const celebrating = game.state === 'results';
  const [pausedCelebration, setPausedCelebration] = useState(null);
  const celebrationPaused = game.paused || pausedCelebration === game.race?.id;
  const [viewChoice, setViewChoice] = useState(null);
  const view = viewChoice?.raceId === game.race?.id && viewChoice ? viewChoice.view : 'auto';
  const setView = next => setViewChoice({ raceId: game.race?.id, view: next });
  const finishEligible = !!game.race && game.elapsed >= game.race.finalStretchAt;
  const finishCam = finishEligible;
  const employees = allEmployees;
  function focusLane(lane) { setManualLane(lane); setView('rolling'); }
  function chooseView(next) { setView(next); }
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
  return <section className={`prototype-stadium ${isOpening(game.state) ? 'event-opening' : ''}`} aria-label={`3D ${locations[venue].title}`} data-location={venue} data-environment-lanes={capacity}>
    <div className="three-viewport" style={venue === 'company-image' ? { backgroundImage: `url(${companyBackdrop})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} data-ready={ready && !failed} data-fps={fps}>
      {!failed && <SceneBoundary key={attempt} onError={onLost}><Canvas key={attempt} frameloop={game.race && !game.paused && (game.state !== 'results' || (celebrating && !reduced && !celebrationPaused)) ? 'always' : 'demand'} shadows={!low} dpr={low ? 1 : [1, 1.5]} camera={{ fov: 45, near: 0.1, far: 10000 }} gl={{ antialias: !low }} fallback={<Unavailable3D onLost={onLost} onRetry={() => setAttempt(a => a + 1)} />}>
        <Suspense fallback={null}>{celebrating ? <WinnerSpotlight3D location={venue} key={game.race.id} order={game.race.order} paused={celebrationPaused} reducedMotion={reduced} low={low} /> : <><RaceEnvironment location={venue} laneCount={capacity} layout={layout} game={game} reducedMotion={reduced} low={low} />
        <EventStage3D event={event} layout={layout} /><EventReady game={game} />
        <RaceCamera cinematic={cinematic} event={event} location={venue} game={game} laneCount={capacity} layout={layout} view={view} finishCam={finishCam} reducedMotion={reduced} manualLane={manualLane} regionRef={regionRef} />

        {employees.length > 12 ? <FullRosterRunners event={event} employees={employees} layout={layout} game={game} reducedMotion={reduced} low={low} /> : <RunnerResources>{employees.map((employee, lane) => <Runner3D game={game} event={event} key={employee.id} employee={employee} lane={lane} laneCount={capacity} layout={layout} color={characters[employee.character].color} race={game.race} elapsed={game.elapsed} animationTime={game.animationTime} labelRef={labels[lane]} reducedMotion={reduced} />)}</RunnerResources>}
        <RunnerLabels cinematic={cinematic} showAllNames={showAllNames} employees={employees} labels={labels} connectors={connectors} game={game} layout={layout} regionRef={regionRef} selectedLane={manualLane} /></>}
        <SceneLifecycle onReady={onReady} onLost={onLost} onPerformance={setFps} /></Suspense>
      </Canvas></SceneBoundary>}
      {!failed && !celebrating && <><svg className="runner-connectors" aria-hidden="true">{employees.map((e, i) => <g key={e.id} ref={connectors[i]} stroke={characters[e.character].color}><path fill="none" strokeWidth="2.5" /><circle r="4" fill={characters[e.character].color} stroke="white" strokeWidth="1.5" /></g>)}</svg><div className="three-labels" aria-hidden="true">{employees.map((e, i) => <div className={`three-name ${employees.length > 6 ? 'compact-name' : ''}`} style={{ '--team-color': characters[e.character].color }} ref={labels[i]} key={e.id} title={e.name}><RacerPortrait employee={e} /><b>{i + 1}</b><span className="label-name">{e.name}</span></div>)}</div>{!cinematic && <RaceBroadcast location={venue} finishCam={finishCam} employees={allEmployees} game={game} onFocus={focusLane} />}</>}
      {!failed && celebrating && <WinnerSpotlightOverlay race={game.race} onAgain={onAgain} onViewResults={onViewResults} />}
      {!ready && !failed && <div className="three-loading">Preparing 3D venue…</div>}
      {failed && <div className="three-fallback" role="alert"><h2>3D rendering paused</h2><p>Your race and finish order are saved.</p><button onClick={() => { setFailed(false); setAttempt(a => a + 1); }}>Retry 3D</button></div>}
      {!failed && !cinematic && <EventWelcome game={game} employees={employees} />}
      {game.state === 'countdown' && !failed && !cinematic && <div className="three-countdown"><span>GET READY</span><strong>{game.countdown}</strong></div>}
    </div>
    {!celebrating && <FullFieldLocator employees={employees} game={game} regionRef={regionRef} onFocus={focusLane} manualLane={manualLane} onResume={() => { setManualLane(null); chooseView('auto'); }} />}
    <div className="prototype-controls">{celebrating ? <button className="quiet" disabled={reduced} aria-pressed={celebrationPaused} onClick={() => { setPausedCelebration(celebrationPaused ? null : game.race.id); if (game.paused) game.resume(); }}>{reduced ? 'Reduced motion' : celebrationPaused ? 'Resume animation' : 'Pause animation'}</button> : <div className="camera-options"><button aria-pressed={view === 'overview' || reduced || finishCam || ['setup', 'countdown'].includes(game.state)} onClick={() => chooseView('overview')}>All runners</button><button disabled={reduced} aria-pressed={view !== 'overview' && !finishCam && !reduced && !['setup', 'countdown'].includes(game.state)} onClick={() => { setManualLane(null); chooseView('auto'); }}>Rolling camera</button><button disabled={!finishEligible} aria-pressed={finishCam} onClick={() => chooseView('overview')}>Finish Cam</button></div>}<label><input type="checkbox" checked={low} onChange={e => setLow(e.target.checked)} /> Low quality</label></div>
  </section>;
}


