import { useState, useEffect, useRef } from 'react';

// ── Shared icon SVG paths (document-style, Material Design) ──────────────────
export const ICON_DOC       = "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8zm0-4h5v2H8z";
export const ICON_DOC_CHECK = "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-9-4 3 3 6-6-1.4-1.4-4.6 4.6-1.6-1.6L9 14z";
export const ICON_DOC_X     = "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-4.5-5 1.5 1.5 1.5-1.5 1.1 1.1-1.5 1.5 1.5 1.5-1.1 1.1L13 18.1l-1.5 1.5-1.1-1.1 1.5-1.5-1.5-1.5z";
export const ICON_DOC_CLOCK = "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-5-3c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm.5-6.5h-1v3l2.2 1.3.5-.9-1.7-1z";
export const ICON_DOC_DRAFT = "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM9 13h6v2H9zm0-3h6v2H9zm0-3h4v2H9z";

export function DocIcon({ path, size = 36, color }: { path: string; size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color ?? 'currentColor'}>
      <path d={path} />
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type CondOp =
  | '(not set)' | 'equals' | 'does not equal'
  | 'contains'  | 'does not contain'
  | 'starts with' | 'ends with'
  | 'is empty'  | 'is not empty';

export interface ConditionFilter {
  kind: 'condition';
  op1: CondOp; val1: string;
  logic: 'and' | 'or';
  op2: CondOp; val2: string;
}
export interface ValueFilter { kind: 'value'; values: string[]; }
export type ColFilter = ConditionFilter | ValueFilter;
export type AppliedFilters = Record<string, ColFilter>;
export interface SortState { col: string; dir: 'asc' | 'desc'; }

// ── evalOp ────────────────────────────────────────────────────────────────────
export function evalOp(op: CondOp, cell: string, val: string): boolean {
  const c = cell.toLowerCase(), v = val.toLowerCase();
  switch (op) {
    case '(not set)':        return true;
    case 'equals':           return c === v;
    case 'does not equal':   return c !== v;
    case 'contains':         return c.includes(v);
    case 'does not contain': return !c.includes(v);
    case 'starts with':      return c.startsWith(v);
    case 'ends with':        return c.endsWith(v);
    case 'is empty':         return c === '';
    case 'is not empty':     return c !== '';
    default:                 return true;
  }
}

// ── KpiStat Card ──────────────────────────────────────────────────────────────
export function KpiStat({ label, value, color, icon, active, onClick }: {
  label: string; value: number; color: string;
  icon: React.ReactNode; active: boolean; onClick: () => void;
}) {
  return (
    <div className={`kpi-stat-card${active ? ' kpi-stat-active' : ''}`} onClick={onClick}>
      <div className="kpi-stat-body">
        <div className="kpi-stat-label">{label}</div>
        <div className="kpi-stat-value" style={{ color }}>{value.toLocaleString()}</div>
      </div>
      <div className="kpi-stat-icon" style={{ color }}>{icon}</div>
    </div>
  );
}

// ── Two-Tab Filter Popup ──────────────────────────────────────────────────────
const COND_OPS: CondOp[] = [
  '(not set)', 'equals', 'does not equal',
  'contains', 'does not contain',
  'starts with', 'ends with',
  'is empty', 'is not empty',
];

interface FilterPopupProps {
  colKey: string;
  colLabel: string;
  options: string[];
  current: ColFilter | null;
  anchor: { top: number; left: number };
  onApply: (f: ColFilter | null) => void;
  onClose: () => void;
}

export function FilterPopup({ colLabel, options, current, anchor, onApply, onClose }: FilterPopupProps) {
  const [tab, setTab] = useState<'condition' | 'value'>(
    current?.kind === 'condition' ? 'condition' : 'value'
  );
  const initCond = current?.kind === 'condition' ? current : null;
  const [op1,   setOp1]   = useState<CondOp>(initCond?.op1   ?? '(not set)');
  const [val1,  setVal1]  = useState(initCond?.val1  ?? '');
  const [logic, setLogic] = useState<'and' | 'or'>(initCond?.logic ?? 'and');
  const [op2,   setOp2]   = useState<CondOp>(initCond?.op2   ?? '(not set)');
  const [val2,  setVal2]  = useState(initCond?.val2  ?? '');
  const initVals = current?.kind === 'value' ? current.values : [];
  const [valSearch, setValSearch] = useState('');
  const [checked, setChecked]     = useState<string[]>(initVals);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const h = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, 80);
    return () => clearTimeout(id);
  }, [onClose]);

  const visibleOptions = options.filter(o =>
    !valSearch || o.toLowerCase().includes(valSearch.toLowerCase())
  );
  const allChecked = visibleOptions.length > 0 && visibleOptions.every(o => checked.includes(o));

  function toggleAll() {
    if (allChecked) setChecked(p => p.filter(v => !visibleOptions.includes(v)));
    else setChecked(p => [...new Set([...p, ...visibleOptions])]);
  }
  function toggleOne(v: string) {
    setChecked(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  }
  function handleApply() {
    if (tab === 'condition') {
      if (op1 === '(not set)' && op2 === '(not set)') onApply(null);
      else onApply({ kind: 'condition', op1, val1, logic, op2, val2 });
    } else {
      onApply(checked.length > 0 ? { kind: 'value', values: checked } : null);
    }
    onClose();
  }
  function handleClear() { onApply(null); onClose(); }

  const safeLeft = Math.min(anchor.left, window.innerWidth - 310);

  return (
    <div ref={ref} className="fpopup" style={{ position: 'fixed', top: anchor.top, left: safeLeft, zIndex: 9999 }}>
      <div className="fpopup-tabs">
        <button className={`fpopup-tab${tab === 'condition' ? ' active' : ''}`} onClick={() => setTab('condition')}>Filter by Condition</button>
        <button className={`fpopup-tab${tab === 'value' ? ' active' : ''}`} onClick={() => setTab('value')}>Filter by Value</button>
      </div>
      {tab === 'condition' && (
        <div className="fpopup-body">
          <div className="fpopup-cond-label">Show items where the value</div>
          <div className="fpopup-cond-row">
            <select className="fpopup-op-select" value={op1} onChange={e => setOp1(e.target.value as CondOp)}>
              {COND_OPS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {op1 !== '(not set)' && op1 !== 'is empty' && op1 !== 'is not empty' && (
              <input className="fpopup-val-input" value={val1} onChange={e => setVal1(e.target.value)} placeholder="Value…" />
            )}
          </div>
          <div className="fpopup-logic-row">
            <label className="fpopup-logic-item"><input type="radio" name={`logic-${colLabel}`} value="and" checked={logic === 'and'} onChange={() => setLogic('and')} />And</label>
            <label className="fpopup-logic-item"><input type="radio" name={`logic-${colLabel}`} value="or"  checked={logic === 'or'}  onChange={() => setLogic('or')}  />Or</label>
          </div>
          <div className="fpopup-cond-row">
            <select className="fpopup-op-select" value={op2} onChange={e => setOp2(e.target.value as CondOp)}>
              {COND_OPS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {op2 !== '(not set)' && op2 !== 'is empty' && op2 !== 'is not empty' && (
              <input className="fpopup-val-input" value={val2} onChange={e => setVal2(e.target.value)} placeholder="Value…" />
            )}
          </div>
        </div>
      )}
      {tab === 'value' && (
        <div className="fpopup-body">
          <div className="fpopup-search-wrap">
            <span className="fpopup-search-icon">&#128269;</span>
            <input className="fpopup-search" placeholder="Search values…" value={valSearch} onChange={e => setValSearch(e.target.value)} />
          </div>
          <div className="fpopup-value-list">
            <label className="fpopup-value-item fpopup-select-all">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              <span>Select All</span>
            </label>
            {visibleOptions.length === 0 && <div className="fpopup-empty">No matching values</div>}
            {visibleOptions.map(opt => (
              <label key={opt} className="fpopup-value-item">
                <input type="checkbox" checked={checked.includes(opt)} onChange={() => toggleOne(opt)} />
                <span>{opt || <em style={{ color: '#9ca3af' }}>(empty)</em>}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="fpopup-footer">
        <button className="fpopup-btn-clear" onClick={handleClear}>Clear</button>
        <button className="fpopup-btn-cancel" onClick={onClose}>Cancel</button>
        <button className="fpopup-btn-apply" onClick={handleApply}>Apply</button>
      </div>
    </div>
  );
}

// ── Column Visibility Panel ───────────────────────────────────────────────────
export interface ColDef { key: string; label: string; }

export function ColPanel({ colDefs, visibleCols, onToggle, onClose, anchor }: {
  colDefs: readonly ColDef[];
  visibleCols: Record<string, boolean>;
  onToggle: (key: string) => void;
  onClose: () => void;
  anchor: { top: number; left: number };
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = setTimeout(() => {
      const h = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) onClose();
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, 80);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div ref={ref} className="col-panel" style={{ position: 'fixed', top: anchor.top, left: anchor.left, zIndex: 9999 }}>
      <div className="col-panel-title">Modify Columns Display</div>
      <label className="col-panel-item col-panel-item-disabled">
        <input type="checkbox" checked disabled />
        <span>Action</span>
      </label>
      {colDefs.map(col => (
        <label key={col.key} className="col-panel-item">
          <input type="checkbox" checked={visibleCols[col.key] ?? true} onChange={() => onToggle(col.key)} />
          <span>{col.label}</span>
        </label>
      ))}
    </div>
  );
}

// ── Eye (view) icon ───────────────────────────────────────────────────────────
export function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  );
}

// ── Funnel filter icon ────────────────────────────────────────────────────────
export function FunnelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
      <path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39A.998.998 0 0 0 18.95 4H5.04a1 1 0 0 0-.79 1.61z"/>
    </svg>
  );
}

// ── Refresh (clear-all) icon ──────────────────────────────────────────────────
export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
    </svg>
  );
}
