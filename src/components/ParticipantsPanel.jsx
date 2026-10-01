import { useRef, useState } from 'react';
import { characters } from '../data/assets';
export function Avatar({
  employee,
  className = ''
}) {
  return <span className={`avatar ${className}`} style={{
    '--racer-color': characters[employee.character].color
  }}><img src={employee.avatar || characters[employee.character].image} style={{ filter: employee.avatar ? undefined : characters[employee.character].filter }} className={employee.avatar ? 'photo' : ''} alt="" /></span>;
}
export function ParticipantsPanel({
  employees,
  excludedIds = [],
  onChange
}) {
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [character, setCharacter] = useState(0);
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const nameRef = useRef(null);
  const uploadVersion = useRef(0);
  function clear() {
    uploadVersion.current++;
    setLoading(false);
    setEditing(null);
    setName('');
    setAvatar('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter an employee name.');
      return;
    }
    if (loading) return;
    const employee = {
      id: editing || crypto.randomUUID(),
      name: name.trim(),
      character,
      avatar
    };
    if (!editing && employees.length >= 12) {
      setError('A race supports up to 12 employees.');
      return;
    }
    onChange(editing ? employees.map(p => p.id === editing ? employee : p) : [...employees, employee]);
    clear();
    nameRef.current?.focus();
  }
  function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const version = ++uploadVersion.current;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setLoading(false);
      setError('Choose a JPG, PNG, or WebP photo under 5 MB.');
      e.target.value = '';
      return;
    }
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onerror = () => {
      if (version === uploadVersion.current) {
        setLoading(false);
        setError('This photo could not be read.');
      }
    };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        if (version === uploadVersion.current) {
          setLoading(false);
          setError('This image could not be opened.');
        }
      };
      img.onload = () => {
        if (version !== uploadVersion.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 160;
        const side = Math.min(img.width, img.height);
        canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 160, 160);
        setAvatar(canvas.toDataURL('image/webp'));
        setLoading(false);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
  return <section className="panel participants"><div className="section-heading"><h2><span className="step">01</span> Meet the racers</h2><span className="count-badge">{employees.length} / 12</span></div><div className="employee-list">{employees.map((employee, i) => <div className="employee-row" key={employee.id}><span className="lane-index">{String(i + 1).padStart(2, '0')}</span><Avatar employee={employee} /><span className="employee-name">{employee.name}{excludedIds.includes(employee.id) && <small className="excluded-badge">Already won · excluded</small>}</span><button className="icon-button" aria-label={`Edit ${employee.name}`} onClick={() => {
          clear();
          setEditing(employee.id);
          setName(employee.name);
          setCharacter(employee.character);
          setAvatar(employee.avatar);
          nameRef.current?.focus();
        }}>✎</button><button className="icon-button delete" aria-label={`Remove ${employee.name}`} onClick={() => {
          onChange(employees.filter(e => e.id !== employee.id));
          if (editing === employee.id) clear();
        }}>×</button></div>)}{employees.length === 0 && <div className="empty-list">Your starting lineup is waiting.<small>Add your first employee below.</small></div>}</div>
    <form onSubmit={submit} className="employee-form"><label className="field-label" htmlFor="employee-name">{editing ? 'Edit employee' : 'Add an employee'}</label><div className="add-row"><input ref={nameRef} id="employee-name" value={name} onChange={e => setName(e.target.value)} placeholder="Employee name" maxLength={60} autoComplete="off" /><button className="secondary" disabled={loading || !editing && employees.length >= 12}>{editing ? 'Save' : '+ Add'}</button>{editing && <button type="button" className="quiet" onClick={clear}>Cancel</button>}</div><div className="avatar-options"><span className="muted">Runner</span>{characters.map((c, i) => <button type="button" className={`character-choice ${character === i ? 'selected' : ''}`} aria-label={`${c.name} runner`} aria-pressed={character === i} key={c.name} onClick={() => setCharacter(i)}><img src={c.image} style={{ filter: c.filter }} alt="" /></button>)}<label className="upload-label">{loading ? 'Reading…' : avatar ? 'Change photo' : '+ Photo'}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>{avatar && <><img className="upload-preview" src={avatar} alt="Selected employee" /><button type="button" className="icon-button" aria-label="Remove photo" onClick={() => {
            uploadVersion.current++;
            setAvatar('');
            setLoading(false);
            fileRef.current.value = '';
          }}>×</button></>}</div><p className="helper">2–12 racers · Photos stay in this browser tab. Use photos with permission.</p>{error && <p role="alert" className="error">{error}</p>}</form></section>;
}
