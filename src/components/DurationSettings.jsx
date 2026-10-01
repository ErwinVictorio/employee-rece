export default function DurationSettings({ duration, onChange, custom, onCustomChange, minutes, onMinutesChange }) {
  const valid = /^\d+$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 10;
  return <>
    <span className="field-label">Race duration</span>
    <div className="duration-options" role="group" aria-label="Race duration">
      {[10, 15, 20, 30].map(seconds => <button key={seconds} aria-pressed={!custom && duration === seconds} className={!custom && duration === seconds ? 'selected' : ''} onClick={() => { onCustomChange(false); onChange(seconds); }}>{seconds}<small>SEC</small></button>)}
    </div>
    <label className="toggle-row"><span>Custom duration<small>Set the race length in minutes</small></span><input type="checkbox" checked={custom} onChange={e => { onCustomChange(e.target.checked); onChange(e.target.checked && valid ? Number(minutes) * 60 : 15); }} /></label>
    {custom && <div className="custom-duration"><label className="field-label" htmlFor="race-minutes">Minutes</label><input id="race-minutes" type="number" min="1" max="10" step="1" value={minutes} aria-invalid={!valid} aria-describedby="minutes-help" onChange={e => { const value = e.target.value; onMinutesChange(value); if (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 10) onChange(Number(value) * 60); }} /><p id="minutes-help" className={valid ? 'helper' : 'error'}>{valid ? `${Number(minutes)} minute${Number(minutes) === 1 ? '' : 's'} (${Number(minutes) * 60} seconds). Countdown is additional.` : 'Enter a whole number from 1 to 10 minutes.'}</p></div>}
  </>;
}
