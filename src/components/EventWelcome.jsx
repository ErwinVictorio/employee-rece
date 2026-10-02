import { branding } from '../data/branding';
import { isOpening } from '../utils/eventTimeline';
import './event.css';
export default function EventWelcome({ game, employees, flat = false }) {
  if (!isOpening(game.state)) return null;
  return <section className={`event-welcome ${flat ? 'event-flat' : ''}`} aria-label="Company event welcome" data-phase={game.state} data-phase-time={game.phaseTime.toFixed(2)}>
    <div className="event-identity"><img src={branding.logo} alt={branding.company} /><strong>{branding.title}</strong></div>
    <div className="event-message" role="status"><h2>Opening Ceremony</h2><p>Company welcome &amp; introduction</p><span>{game.paused ? 'Event paused' : game.state === 'arrival' ? 'Gathering at the stage' : game.state === 'lineup' ? 'Taking your starting lanes' : 'Race countdown begins in'}</span><strong>{game.state === 'welcome' ? `00:${String(game.welcomeRemaining).padStart(2, '0')}` : game.state === 'lineup' ? '00:00' : 'Welcome'}</strong><small>{employees.length} participants · Get ready, racers!</small></div>
    {!flat && <div className="ceremony-progress"><div className="ceremony-note"><span>● OPENING CEREMONY</span><strong>{game.state === 'lineup' ? 'See you at the starting line' : 'Welcome, team!'}</strong><small>{branding.company} · {branding.title}</small></div><ol>{[['arrival', 'Gathering'], ['welcome', 'Welcome'], ['lineup', 'Starting lanes'], ['countdown', 'Countdown'], ['racing', 'Race start']].map(([state, label], index) => <li key={state} className={game.state === state ? 'current' : index < ['arrival', 'welcome', 'lineup'].indexOf(game.state) ? 'complete' : ''}><i /><span>{label}</span></li>)}</ol></div>}
    {flat && <ol className="event-roster">{employees.map((employee, lane) => <li key={employee.id}><b>{lane + 1}</b> {employee.name}</li>)}</ol>}
  </section>;
}
