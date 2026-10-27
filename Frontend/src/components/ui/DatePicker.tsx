import { useEffect, useRef, useState } from 'react';

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const cells: { d: number; m: number; y: number }[] = [];
  for (let index = firstDay - 1; index >= 0; index -= 1) {
    const previousMonth = month === 0 ? 11 : month - 1;
    cells.push({ d: previousDays - index, m: previousMonth, y: month === 0 ? year - 1 : year });
  }
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ d: day, m: month, y: year });
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) cells.push({ d: nextDay++, m: nextMonth, y: nextYear });
  return cells;
}

function CalendarIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="17" rx="1" />
      <path d="M16 2v4M8 2v4M3 9h18M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" />
    </svg>
  );
}

export default function DatePicker({ value, onChange, hasError, disabled, mode = 'date', placeholder }: {
  value: string; onChange: (value: string) => void; hasError?: boolean; disabled?: boolean;
  mode?: 'date' | 'year'; placeholder?: string;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [rect, setRect] = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)
          && anchorRef.current && !anchorRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  function parseDate(): { d: number; m: number; y: number } | null {
    if (!value) return null;
    const [month, day, year] = value.split('-').map(Number);
    if (!month || !day || !year || year < 1900) return null;
    return { d: day, m: month - 1, y: year };
  }

  function toggle() {
    if (!open && anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
      if (mode === 'year') {
        setViewYear(/^\d{4}$/.test(value) ? Number(value) : currentYear);
      } else {
        const parsed = parseDate();
        setViewYear(parsed?.y ?? currentYear);
        setViewMonth(parsed?.m ?? now.getMonth());
      }
    }
    setOpen(show => !show);
  }

  function selectDate(day: number, month: number, year: number) {
    onChange(`${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}-${year}`);
    setOpen(false);
  }

  function previousMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(year => year - 1); }
    else setViewMonth(month => month - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(year => year + 1); }
    else setViewMonth(month => month + 1);
  }

  const selected = parseDate();
  const cells = buildGrid(viewYear, viewMonth);
  const firstVisibleYear = Math.floor(viewYear / 12) * 12;
  const years = Array.from({ length: 12 }, (_, index) => firstVisibleYear + index);
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;
  const popupHeight = mode === 'year' ? 190 : 320;
  const popupLeft = rect ? Math.max(4, Math.min(rect.left, viewportWidth - 290)) : 0;
  const popupTop = rect ? (rect.bottom + 4 + popupHeight > viewportHeight ? rect.top - popupHeight - 4 : rect.bottom + 4) : 0;

  return (
      <div ref={anchorRef} style={{ position: mode === 'year' ? 'relative' : undefined }}>
        <div className={mode === 'year' ? 'ap-modal__datewrap' : undefined}
          style={mode === 'year' ? undefined : { display: 'flex', alignItems: 'center', height: 34, border: `1px solid ${hasError ? '#c62828' : '#aeb7c2'}`, borderRadius: 3, background: hasError ? '#fff5f5' : '#f6f8fb', overflow: 'hidden' }}>
          <input type="text" value={value} disabled={disabled} inputMode={mode === 'year' ? 'numeric' : undefined}
            maxLength={mode === 'year' ? 4 : undefined}
            onChange={event => onChange(mode === 'year' ? event.target.value.replace(/\D/g, '').slice(0, 4) : event.target.value)}
            placeholder={placeholder ?? (mode === 'year' ? '####' : 'MM-DD-YYYY')}
            aria-label={mode === 'year' ? 'Year Business Started' : undefined}
            className={mode === 'year' ? `ap-modal__inp ap-modal__inp--date client-year-picker__input${hasError ? ' ap-modal__inp--err' : ''}` : undefined}
            style={mode === 'year' ? undefined : { flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '0 10px', height: '100%' }} />
          <button type="button" onClick={toggle} disabled={disabled} aria-label={mode === 'year' ? 'Choose year' : 'Choose date'}
            aria-haspopup="dialog" aria-expanded={open}
            className={mode === 'year' ? 'ap-modal__cal-btn client-year-picker__cal-btn' : undefined}
            style={mode === 'year' ? undefined : { height: 34, width: 36, border: 'none', borderLeft: '1px solid #e5e7eb', background: 'transparent', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CalendarIcon />
          </button>
        </div>

      {open && rect && (
        <div ref={popupRef} role="dialog" aria-label={mode === 'year' ? 'Choose Year' : 'Choose Date'}
          className={mode === 'year' ? 'ap-cal client-year-picker__popup' : undefined}
          style={mode === 'year' ? undefined : { position: 'fixed', top: popupTop, left: popupLeft, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: 282, padding: 14 }}>
          {mode === 'year' ? (
            <>
              <div className="client-year-picker__header">
                <button type="button" className="client-year-picker__nav" aria-label="Previous years" onClick={() => setViewYear(Math.max(1600, firstVisibleYear - 12))}>‹</button>
                <strong>{viewYear}</strong>
                <button type="button" aria-label="Next years" disabled={firstVisibleYear + 12 > currentYear}
                  className="client-year-picker__nav" onClick={() => setViewYear(firstVisibleYear + 12)}>›</button>
              </div>
              <div className="client-year-picker__grid">
                {years.map(year => {
                  const isSelected = String(year) === value;
                  return (
                    <button type="button" key={year} disabled={year < 1600 || year > currentYear} aria-pressed={isSelected}
                      onClick={() => { onChange(String(year)); setOpen(false); }}
                      className={`client-year-picker__year${isSelected ? ' client-year-picker__year--selected' : ''}`}>
                      {year}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}><span style={{ color: '#111827' }}>{viewYear}</span>{' '}<span style={{ color: '#1e40af' }}>{MONTHS_LONG[viewMonth]}</span></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={previousMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16 }}>‹</button>
                  <button type="button" onClick={nextMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16 }}>›</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                {DAY_NAMES.map(name => <div key={name} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '3px 0' }}>{name}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {cells.map((cell, index) => {
                  const inCurrentMonth = cell.m === viewMonth;
                  const isToday = cell.d === now.getDate() && cell.m === now.getMonth() && cell.y === currentYear;
                  const isSelected = Boolean(selected && cell.d === selected.d && cell.m === selected.m && cell.y === selected.y);
                  return (
                    <button key={`${cell.y}-${cell.m}-${cell.d}-${index}`} type="button" onClick={() => selectDate(cell.d, cell.m, cell.y)}
                      style={{ width: '100%', aspectRatio: '1', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: isToday ? 700 : 400, color: isSelected ? '#fff' : inCurrentMonth ? '#111827' : '#d1d5db', background: isSelected ? '#0B5AA0' : 'transparent', outline: isToday && !isSelected ? '2px solid #374151' : 'none', outlineOffset: -2 }}>
                      {cell.d}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
