import CompanyGroundsBanner from './CompanyGroundsBanner';
import { locations, normalizeLocation } from '../data/locations';
import { sampleRunner } from '../utils/raceMotion';
import { characters } from '../data/assets';
import { progressAt } from '../utils/race';
import { Avatar } from './ParticipantsPanel';
import stadium from '../assets/character/Stadium.png';
import finish from '../assets/character/FinishLine.png';
export function RaceTrack({
  location = 'stadium',
  employees,
  game,
  duration
}) {
  const {
    race,
    state,
    elapsed,
    countdown
  } = game;
  const venue = normalizeLocation(race?.settings.location || location);
  const title = locations[venue].title;
  const positions = race ? race.runners.map(r => ({
    ...r,
    progress: progressAt(r, elapsed, race.duration)
  })).sort((a, b) => b.progress - a.progress || a.rank - b.rank) : [];
  const live = ['racing', 'finalStretch', 'finished'].includes(state);
  const labels = {
    setup: 'Ready when you are',
    countdown: 'On your marks…',
    racing: 'The race is on!',
    finalStretch: 'Final stretch!',
    finished: `${race?.order[0].name} takes the win!`,
    results: 'What a race!'
  };
  return <section className="track-card" aria-label={`${title} race track`} data-location={venue}><div className="track-toolbar"><div><span className={`status-dot ${live ? 'live' : ''}`} /><strong>{state === 'setup' ? 'TRACK PREVIEW' : `${title.toUpperCase()} LIVE`}</strong><span className="track-subtitle">{employees.length} racers · {title}</span></div><span className="timer">◷ {String(Math.ceil(Math.max(0, (race?.duration || duration) - elapsed))).padStart(2, '0')}<small> SEC</small></span></div>{venue === 'company-grounds' ? <CompanyGroundsBanner /> : <div className="stadium-banner" style={{
      backgroundImage: `linear-gradient(0deg, #111e39dd, #111e3910), url(${stadium})`
    }}><div><span className="eyebrow">EMPLOYEE RACE / STADIUM SERIES</span><h2 aria-live="polite">{labels[state]}</h2></div><img className="finish-gate" src={finish} alt="Finish" /></div>}
    <div className="track-lanes"><div className="track-labels"><span>START</span><span>FINISH</span></div>{employees.map((employee, i) => {
        const runner = positions.find(r => r.employee.id === employee.id);
        const progress = runner?.progress || 0;
        const pose = runner ? sampleRunner(runner, elapsed).pose : 'running';
        return <div className="race-lane" key={employee.id} style={{
          '--racer-color': characters[employee.character].color
        }}><div className="lane-label"><span>{String(i + 1).padStart(2, '0')}</span><b title={employee.name}>{employee.name}</b></div><div className="lane-runway"><div className={`runner-position ${employee.character === 1 ? 'blue-runner' : ''}`} style={{
              left: `${progress * 100}%`
            }}><div data-pose={pose} className={`runner ${live && !game.paused && (pose === 'running' || pose === 'comeback') && progress < 1 ? 'running' : ''}`} style={{
                animationDelay: `${-i * 0.09}s`
              }}><img className="runner-body" style={{ filter: characters[employee.character].filter }} src={characters[employee.character].image} alt={`${employee.name}'s runner`} />{employee.avatar && <img className="runner-photo" src={employee.avatar} alt="" />}</div>{progress >= 1 && <span className="finish-rank">{runner.rank + 1}</span>}</div></div></div>;
      })}{employees.length === 0 && <div className="empty-track">Add your team to fill the starting line.</div>}
    {state === 'countdown' && <div className="countdown-overlay"><span>GET READY</span><strong key={countdown}>{countdown}</strong><span>{employees.length} racers. One winner.</span></div>}</div>
    <div className="track-bottom"><span>⚑ {state === 'setup' ? 'A fair start. An unpredictable finish.' : 'Live positions'}</span>{race && <ol className="live-leaders">{positions.slice(0, 3).map((r, i) => <li key={r.employee.id}><b>{i + 1}</b><Avatar employee={r.employee} />{r.employee.name}</li>)}</ol>}<span className="muted">{duration}-second dash</span></div>
  </section>;
}
