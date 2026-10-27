// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Small shared pieces for the User Group Add / Edit screens.
import { useEffect, useState } from 'react';

// QA UGM-17
export const GROUP_RIGHTS_TOOLTIP = 'A disabled checkbox indicates that you do not have permission to access it';

// Info icon that shows its text on hover and on keyboard focus.
export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        role="img"
        aria-label={text}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'help',
          width: 14, height: 14, border: '1px solid #252a31', borderRadius: '50%',
          fontSize: 9, fontWeight: 600, color: '#252a31',
        }}
      >i</span>
      {open && (
        <span role="tooltip" style={{
          position: 'absolute', left: '50%', bottom: 'calc(100% + 6px)', transform: 'translateX(-50%)',
          width: 'max-content', maxWidth: 260, padding: '6px 9px', borderRadius: 4,
          background: '#252a31', color: '#fff', fontSize: 11, fontWeight: 400, lineHeight: 1.4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)', zIndex: 50, pointerEvents: 'none',
        }}>{text}</span>
      )}
    </span>
  );
}

// QA UGM-18: unsaved-data warning on Cancel ("Stay Here" / "Yes").
export function LeaveConfirmModal({ message, onStay, onLeave }: {
  message: string; onStay: () => void; onLeave: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStay]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onStay}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-msg"
        style={{
          background: '#fff', borderRadius: 8, width: 420, maxWidth: '100%', padding: '28px 24px',
          textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div aria-hidden="true" style={{
          width: 44, height: 44, margin: '0 auto 14px', borderRadius: '50%', background: '#fef3c7',
          color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700,
        }}>!</div>
        <div id="leave-confirm-msg" style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 22, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button type="button" className="btn-secondary" autoFocus onClick={onStay}>Stay Here</button>
          <button type="button" className="btn-primary" onClick={onLeave}>Yes</button>
        </div>
      </div>
    </div>
  );
}
