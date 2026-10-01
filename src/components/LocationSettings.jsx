import { locations } from '../data/locations';

export default function LocationSettings({ value, onChange, disabled }) {
  return <fieldset className="location-settings" disabled={disabled}><legend>Race location</legend><div>{Object.values(locations).filter(location => location.id !== 'company-image').map(location => <button key={location.id} type="button" aria-pressed={value === location.id} onClick={() => onChange(location.id)}><strong>{location.title}</strong><small>{location.description}</small><span>{value === location.id ? 'Selected' : 'Select location'}</span></button>)}</div></fieldset>;
}
