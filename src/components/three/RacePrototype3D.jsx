import { useState } from 'react';
import { useRace } from '../../hooks/useRace';
import { useGameAudio } from '../../hooks/useGameAudio';
import { RaceHUD } from '../RaceHUD';
import { RaceTrack } from '../RaceTrack';
import { Results } from '../Results';
import { ConfirmDialog } from '../ConfirmDialog';
import RaceScene3D from './RaceScene3D';

const employees = [
  { id: 0, name: 'Maria', character: 0 },
  { id: 1, name: 'Juan', character: 1 }
];
// Development-only visual fixture: seed 1 gives Juan an early lead, a fall,
// loss of that lead, and a continuous winning finish. Production never uses it.
export default function RacePrototype3D({ onBack }) {
  const game = useRace();
  const [fallback, setFallback] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const unlock = useGameAudio(game.state, true, true, game);
  const active = !['setup', 'results'].includes(game.state);
  function start() {
    setResultsOpen(false);
    let seed = 1;
    unlock();
    game.start(employees, 15, {}, () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296));
  }
  return <main className="prototype-page">
    <h1>Winner-falls fixture</h1><p>Development preview: Juan leads, falls behind, recovers, and wins. Ordinary races do not force this story.</p>
    <div className="actions"><button onClick={() => active ? setConfirm(true) : onBack()}>Back to setup</button><button disabled={active || blocked} onClick={start}>Run winner-falls fixture</button></div>
    {fallback ? <RaceTrack employees={employees} game={game} duration={15} /> : <RaceScene3D onAgain={start} onViewResults={() => { setResultsOpen(true); requestAnimationFrame(() => document.querySelector('#race-results .results-table h3')?.focus()); }} employees={employees} game={game} onBlocked={setBlocked} onFallback={() => { game.synchronizeClock(); setFallback(true); game.resume(); }} />}
    <RaceHUD employees={employees} game={game} duration={15} canResume={fallback || !blocked} />
    {game.state === 'results' && <Results expanded={resultsOpen} onExpandedChange={setResultsOpen} compact={!fallback} focusOnMount={fallback} race={game.race} onAgain={start} onEdit={game.reset} onNew={game.reset} />}
    {confirm && <ConfirmDialog title="Leave the fixture?" description="This preview race will stop. Your main lineup is kept." confirmLabel="Leave fixture" onCancel={() => setConfirm(false)} onConfirm={onBack} />}
  </main>;
}


