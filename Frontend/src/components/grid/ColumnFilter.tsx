// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Shared grid column filter (QA UGM-03/04/05). Pages pass the column's distinct values and
// read cells themselves; this module owns the pop-up and the matching rules so every grid
// filters the same way. Used by User Management and User Group Management; other grids still
// have their own copies (see USER_GROUP_OPEN_ISSUES.md).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const CONDITION_OPS = [
  'Contains', 'Does not contain', 'Equals', 'Does not equal',
  'Starts with', 'Ends with', 'Is empty', 'Is not empty',
] as const;
export type ConditionOp = typeof CONDITION_OPS[number];

const NO_VALUE_OPS: ConditionOp[] = ['Is empty', 'Is not empty'];

export interface Condition { op: ConditionOp | ''; value: string }

export type ColumnFilterState =
  | { kind: 'condition'; cond1: Condition; logic: 'And' | 'Or'; cond2: Condition }
  | { kind: 'value'; selected: string[] };

export type ColumnFilters<K extends string> = Partial<Record<K, ColumnFilterState>>;

const isSet = (c: Condition) => !!c.op && (NO_VALUE_OPS.includes(c.op as ConditionOp) || c.value.trim() !== '');

function test(cell: string, c: Condition): boolean {
  const v = cell.toLowerCase();
  const t = c.value.trim().toLowerCase();
  switch (c.op) {
    case 'Contains':         return v.includes(t);
    case 'Does not contain': return !v.includes(t);
    case 'Equals':           return v === t;
    case 'Does not equal':   return v !== t;
    case 'Starts with':      return v.startsWith(t);
    case 'Ends with':        return v.endsWith(t);
    case 'Is empty':         return cell.trim() === '';
    case 'Is not empty':     return cell.trim() !== '';
    default:                 return true;
  }
}

export function matchesFilter(cell: string, f: ColumnFilterState | undefined): boolean {
  if (!f) return true;
  if (f.kind === 'value') return f.selected.includes(cell);
  const a = isSet(f.cond1), b = isSet(f.cond2);
  if (a && b) return f.logic === 'And' ? test(cell, f.cond1) && test(cell, f.cond2) : test(cell, f.cond1) || test(cell, f.cond2);
  if (a) return test(cell, f.cond1);
  if (b) return test(cell, f.cond2);
  return true;
}

// Rows that pass every active column filter.
export function applyColumnFilters<R, K extends string>(
  rows: R[], filters: ColumnFilters<K>, getCell: (row: R, key: K) => string,
): R[] {
  const active = (Object.keys(filters) as K[]).filter(k => filters[k]);
  if (!active.length) return rows;
  return rows.filter(r => active.every(k => matchesFilter(getCell(r, k), filters[k])));
}

export const hasActiveFilters = <K extends string>(filters: ColumnFilters<K>) =>
  Object.values(filters).some(Boolean);

export function distinctValues<R>(rows: R[], getCell: (row: R) => string): string[] {
  return Array.from(new Set(rows.map(getCell))).sort((a, b) => a.localeCompare(b));
}

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

const EMPTY_COND: Condition = { op: '', value: '' };

export function ColumnFilterPopup({
  title, values, current, loading, formatValue = v => v, onApply, onClose, anchorRect,
}: {
  title: string;
  values: string[];               // every distinct value of the column across all rows
  current: ColumnFilterState | undefined;
  loading?: boolean;
  formatValue?: (v: string) => string;
  onApply: (f: ColumnFilterState | undefined) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>(current?.kind ?? 'value');
  const [cond1, setCond1] = useState<Condition>(current?.kind === 'condition' ? current.cond1 : EMPTY_COND);
  const [logic, setLogic] = useState<'And' | 'Or'>(current?.kind === 'condition' ? current.logic : 'And');
  const [cond2, setCond2] = useState<Condition>(current?.kind === 'condition' ? current.cond2 : EMPTY_COND);
  const [search, setSearch] = useState('');
  // QA UGM-04: with no value filter, every value starts ticked.
  const [selected, setSelected] = useState<Set<string> | null>(
    current?.kind === 'value' ? new Set(current.selected) : null,
  );
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);

  const ticked = selected ?? new Set(values);
  const visible = values.filter(v => formatValue(v).toLowerCase().includes(search.toLowerCase()));
  const allVisibleTicked = visible.length > 0 && visible.every(v => ticked.has(v));

  const toggle = (v: string) => {
    const next = new Set(ticked);
    if (next.has(v)) next.delete(v); else next.add(v);
    setSelected(next);
  };
  const toggleAll = () => {
    const next = new Set(ticked);
    visible.forEach(v => (allVisibleTicked ? next.delete(v) : next.add(v)));
    setSelected(next);
  };

  const apply = () => {
    if (tab === 'condition') {
      onApply(isSet(cond1) || isSet(cond2) ? { kind: 'condition', cond1, logic, cond2 } : undefined);
    } else {
      // Every value ticked = no filter.
      onApply(values.every(v => ticked.has(v)) ? undefined : { kind: 'value', selected: [...ticked] });
    }
    onClose();
  };
  const clear = () => { onApply(undefined); onClose(); };

  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - 348));

  // Portal: headers can be draggable (column re-order), which breaks text selection in inputs
  // nested inside them.
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={`Filter ${title}`}
      style={{
        position: 'fixed', top: anchorRect.bottom + 4, left, zIndex: 9999,
        background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 340, maxWidth: 'calc(100vw - 16px)',
        fontWeight: 400, textAlign: 'left', whiteSpace: 'normal', cursor: 'default',
      }}
      onClick={e => e.stopPropagation()}
      onDragStart={e => e.stopPropagation()}
    >
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 13, color: '#111827' }}>
        {title}
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(t => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13,
            fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B5AA0' : '#6b7280',
            borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer',
          }}>
            {t === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>

      {tab === 'condition' ? (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ConditionRow cond={cond1} onChange={setCond1} autoFocus />
          <div role="radiogroup" aria-label="Combine conditions" style={{ display: 'flex', gap: 20, fontSize: 13, color: '#374151' }}>
            {(['And', 'Or'] as const).map(l => (
              <label key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                <input type="radio" name="filter-logic" checked={logic === l} onChange={() => setLogic(l)}
                  style={{ width: 14, height: 14, accentColor: '#0B5AA0' }} />
                {l}
              </label>
            ))}
          </div>
          <ConditionRow cond={cond2} onChange={setCond2} />
        </div>
      ) : (
        <>
          <div style={{ padding: '10px 14px 6px' }}>
            <input autoFocus placeholder="Search" value={search} onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, padding: '7px 10px', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            {loading ? (
              <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>Loading…</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No Data Available</div>
            ) : (
              <>
                <label style={valueRow(allVisibleTicked, 500)}>
                  <input type="checkbox" checked={allVisibleTicked} onChange={toggleAll} style={checkboxStyle} />
                  Select All
                </label>
                {visible.map(v => (
                  <label key={v} style={valueRow(ticked.has(v))}>
                    <input type="checkbox" checked={ticked.has(v)} onChange={() => toggle(v)} style={checkboxStyle} />
                    {v === '' ? '(Blank)' : formatValue(v)}
                  </label>
                ))}
              </>
            )}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
        <button type="button" className="btn-primary" style={{ flex: 1, padding: '8px 0', fontSize: 13 }} onClick={apply}>Apply</button>
        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button>
        <button type="button" className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={clear}>Clear</button>
      </div>
    </div>,
    document.body,
  );
}

function ConditionRow({ cond, onChange, autoFocus }: { cond: Condition; onChange: (c: Condition) => void; autoFocus?: boolean }) {
  const noValue = !cond.op || NO_VALUE_OPS.includes(cond.op as ConditionOp);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <select value={cond.op} autoFocus={autoFocus} aria-label="Condition"
        onChange={e => onChange({ ...cond, op: e.target.value as Condition['op'] })}
        style={{ fontSize: 13, width: '100%' }}>
        <option value="">(Not set)</option>
        {CONDITION_OPS.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
      <input placeholder="Value..." aria-label="Condition value" value={cond.value} disabled={noValue}
        onChange={e => onChange({ ...cond, value: e.target.value })}
        style={{ fontSize: 13, width: '100%', opacity: noValue ? 0.5 : 1 }} />
    </div>
  );
}

const checkboxStyle: React.CSSProperties = { width: 15, height: 15, accentColor: '#0B5AA0', flexShrink: 0 };
const valueRow = (on: boolean, fontWeight = 400): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, margin: 0,
  padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight,
  background: on ? '#eff6ff' : 'transparent',
});
