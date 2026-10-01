import { useEffect, useRef } from 'react';
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel
}) {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={ref} className="confirm-dialog" onCancel={e => {
    e.preventDefault();
    onCancel();
  }} aria-labelledby="dialog-title"><h2 id="dialog-title">{title}</h2><p>{description}</p><div className="actions"><button autoFocus className="secondary" onClick={onCancel}>Cancel</button><button className="primary" onClick={onConfirm}>{confirmLabel}</button></div></dialog>;
}
