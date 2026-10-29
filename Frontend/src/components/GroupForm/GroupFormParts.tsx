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
export function LeaveConfirmModal({ message, description = 'Select the Stay Here button to remain or Yes to leave the screen.', onStay, onLeave }: {
  message: string; description?: string; onStay: () => void; onLeave: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onStay(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStay]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17, 24, 39, 0.30)', zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onStay}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="leave-confirm-msg"
        aria-describedby="leave-confirm-description"
        style={{
          background: '#fff', borderRadius: 5, width: 252, maxWidth: '100%',
          textAlign: 'center', boxShadow: '0 3px 9px rgba(0,0,0,0.22)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '12px 13px 11px' }}>
          <div aria-hidden="true" style={{
            width: 60, height: 60, margin: '0 auto 19px', borderRadius: '50%', background: '#ffe7ea',
            color: '#e94b5b', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <path d="M17 4.5 30 28H4L17 4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M17 12v8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="17" cy="24" r="1" fill="currentColor" />
            </svg>
          </div>
          <div id="leave-confirm-msg" style={{ fontSize: 12, fontWeight: 700, color: '#252a31', lineHeight: 1.45 }}>
            {message}
          </div>
          <div id="leave-confirm-description" style={{ marginTop: 8, fontSize: 10.5, fontWeight: 400, color: '#6b7280', lineHeight: 1.45 }}>
            {description}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '8px 13px 7px', borderTop: '1px solid #e5e7eb' }}>
          <button type="button" autoFocus onClick={onStay} style={{
            height: 28, padding: '0 8px', border: '1px solid #d7dce2', borderRadius: 3,
            background: '#fff', color: '#0B5AA0', fontSize: 11, fontWeight: 500,
          }}>Stay Here</button>
          <button type="button" onClick={onLeave} style={{
            height: 28, padding: '0 8px', border: '1px solid #e94b5b', borderRadius: 3,
            background: '#e94b5b', color: '#fff', fontSize: 11, fontWeight: 700,
          }}>Yes</button>
        </div>
      </div>
    </div>
  );
}
