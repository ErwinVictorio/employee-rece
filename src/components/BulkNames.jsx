import { useState } from 'react';
import { parseNames } from '../utils/roster';
export default function BulkNames({ employees, onChange }) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function add() {
    try {
      const names = parseNames(text, employees.length);
      const added = names.map((name, index) => ({ id: crypto.randomUUID(), name, character: (employees.length + index) % 6, avatar: '' }));
      onChange([...employees, ...added]); setText(''); setError('');
      setMessage(`${names.length} employees added. Matching names are kept as separate employees.`);
    } catch (e) { setError(e.message); setMessage(''); }
  }
  return <div className="bulk-names"><label className="field-label" htmlFor="bulk-names">Paste employee names</label><textarea id="bulk-names" rows={5} value={text} onChange={e => setText(e.target.value)} placeholder={'Juan Dela Cruz\nMaria Santos\nPedro Reyes'} aria-describedby="bulk-help" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); add(); } }} /><p id="bulk-help" className="helper">One name per line or paste one Excel column. Enter to add all · Shift+Enter for a new line. Up to 100 employees total.</p><button type="button" className="secondary" onClick={add} disabled={!text.trim()}>Add pasted names</button>{error && <p role="alert" className="error">{error}</p>}{message && <p role="status">{message}</p>}</div>;
}
