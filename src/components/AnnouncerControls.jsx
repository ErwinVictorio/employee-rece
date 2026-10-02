import './announcer.css';
export default function AnnouncerControls({ announcer, setup }) {
  return <section className="announcer-controls panel" aria-label="Spoken announcer settings">
    <label><input type="checkbox" checked={announcer.enabled} onChange={e => announcer.setEnabled(e.target.checked)} /> Spoken announcer</label>
    <label>Voice <select aria-label="Announcer voice" value={announcer.voiceId} disabled={!announcer.voices.length} onChange={e => announcer.setVoiceId(e.target.value)}>{!announcer.voices.length && <option value="">No voice available</option>}{announcer.voices.map(v => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang}) — {v.localService ? 'Device' : 'Online'}</option>)}</select></label>
    <label>Volume <input aria-label="Announcer volume" type="range" min="0" max="1" step=".05" value={announcer.volume} onChange={e => announcer.setVolume(Number(e.target.value))} /></label>
    <button className="secondary" disabled={!announcer.canTest} onClick={announcer.test}>{setup ? 'Test Voice' : 'Enable voice'}</button>
    {announcer.status && <small role="status">{announcer.status}</small>}
  </section>;
}
