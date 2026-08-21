import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adjustersApi } from '../api/adjusters';
import PaginationBar from '../components/PaginationBar';
import type { TempAdjusterDto } from '../types/Adjuster';

// ─── Types ────────────────────────────────────────────────────────────────────

type ColKey =
  | 'userCode' | 'fullName' | 'adjusterType' | 'status' | 'telephoneNumber'
  | 'emailId' | 'territoriesAssigned' | 'currentCaseLoad' | 'caseCompleted'
  | 'licenseExpirationDate' | 'backgroundStatusCheck';

interface ConditionFilter {
  cond1: string; val1: string;
  logic: 'And' | 'Or';
  cond2: string; val2: string;
}
interface AppliedFilters {
  value?: string[];       // value-checkbox filter
  condition?: ConditionFilter;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: 'userCode',             label: 'Adjuster ID' },
  { key: 'fullName',             label: 'Adjuster Name' },
  { key: 'adjusterType',         label: 'Adjuster Type' },
  { key: 'status',               label: 'Status' },
  { key: 'telephoneNumber',      label: 'Telephone Number' },
  { key: 'emailId',              label: 'Email ID' },
  { key: 'territoriesAssigned',  label: 'Territories Assigned' },
  { key: 'currentCaseLoad',      label: 'Current Case Load' },
  { key: 'caseCompleted',        label: 'Case Completed' },
  { key: 'licenseExpirationDate',label: 'License Expiration Date' },
  { key: 'backgroundStatusCheck',label: 'Background Status Check' },
];

const CONDITION_OPS = [
  '(not set)', 'Contains', 'Does Not Contain', 'Starts With',
  'Ends With', 'Equal', 'Not Equal', 'Is Empty', 'Is Not Empty',
];

// ─── Row helpers ──────────────────────────────────────────────────────────────

function getRowInitials(row: TempAdjusterDto) {
  return `${row.firstName?.[0] ?? ''}${row.lastName?.[0] ?? ''}`.toUpperCase() || 'AD';
}
function getRowFullName(row: TempAdjusterDto) {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || '-';
}
function getEarliestExpiry(row: TempAdjusterDto): string {
  const dates = (row.licenses ?? []).map(l => l.licenseExpirationDate).filter(Boolean) as string[];
  return dates.length ? dates.sort()[0] : '-';
}
function getCellValue(row: TempAdjusterDto, key: ColKey): string {
  switch (key) {
    case 'userCode':              return row.userCode ?? '-';
    case 'fullName':              return getRowFullName(row);
    case 'adjusterType':          return row.adjusterType ?? '-';
    case 'status':                return row.status ?? 'Active';
    case 'telephoneNumber':       return row.telephoneNumber ?? '-';
    case 'emailId':               return row.emailId ?? '-';
    case 'territoriesAssigned':   return row.territoriesAssigned ?? '-';
    case 'currentCaseLoad':       return '0';
    case 'caseCompleted':         return '0';
    case 'licenseExpirationDate': return getEarliestExpiry(row);
    case 'backgroundStatusCheck': return row.complianceFlag ?? '-';
    default:                      return '-';
  }
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyCondOp(op: string, cellVal: string, testVal: string): boolean {
  const c = cellVal.toLowerCase();
  const t = testVal.toLowerCase();
  switch (op) {
    case 'Contains':         return c.includes(t);
    case 'Does Not Contain': return !c.includes(t);
    case 'Starts With':      return c.startsWith(t);
    case 'Ends With':        return c.endsWith(t);
    case 'Equal':            return c === t;
    case 'Not Equal':        return c !== t;
    case 'Is Empty':         return cellVal === '' || cellVal === '-';
    case 'Is Not Empty':     return cellVal !== '' && cellVal !== '-';
    default:                 return true;
  }
}

function matchesConditionFilter(cellVal: string, f: ConditionFilter): boolean {
  const r1 = f.cond1 === '(not set)' || !f.cond1 ? true : applyCondOp(f.cond1, cellVal, f.val1);
  const r2 = f.cond2 === '(not set)' || !f.cond2 ? true : applyCondOp(f.cond2, cellVal, f.val2);
  if ((!f.cond1 || f.cond1 === '(not set)') && (!f.cond2 || f.cond2 === '(not set)')) return true;
  if ((!f.cond1 || f.cond1 === '(not set)')) return r2;
  if ((!f.cond2 || f.cond2 === '(not set)')) return r1;
  return f.logic === 'And' ? r1 && r2 : r1 || r2;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
function FilterArrow({ active }: { active?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" />
    </svg>
  );
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function AdjusterIcon({ tone, variant }: { tone: string; variant: 'total' | 'active' | 'inactive' }) {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke={tone} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="18" r="8" /><path d="M10 42c0-8 6-14 14-14 5.5 0 10.2 2.8 12.6 7" />
      {variant === 'active'   && <path d="M35 39l4 4 8-10" />}
      {variant === 'inactive' && <path d="M36 35l10 10M46 35 36 45" />}
      {variant === 'total'    && <><circle cx="40" cy="34" r="5" /><path d="M40 31v3l2 2" /></>}
    </svg>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status?: string | null }) {
  const active = (status || '').toLowerCase() !== 'inactive';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 80, padding: '3px 12px', borderRadius: 999, border: `1px solid ${active ? '#008c55' : '#d82929'}`, background: active ? '#d7f7e4' : '#ffe9e9', color: active ? '#006b3c' : '#b91c1c', fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? '#008c55' : '#d82929' }} />
      {status || 'Active'}
    </span>
  );
}

// ─── Column Panel ─────────────────────────────────────────────────────────────

function ColumnPanel({ anchorRect, visibleCols, onToggle, onClose }: {
  anchorRect: DOMRect; visibleCols: Set<ColKey>;
  onToggle: (key: ColKey, on: boolean) => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div ref={ref} onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 4px 18px rgba(0,0,0,0.15)', width: 240, padding: '10px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', padding: '4px 16px 10px', borderBottom: '1px solid #e5e7eb', marginBottom: 4 }}>
        Modify Columns Display
      </div>
      {/* Action — always visible, greyed */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', opacity: 0.5, cursor: 'default', background: '#ddeeff' }}>
        <input type="checkbox" checked readOnly style={{ accentColor: '#0B5AA0', width: 15, height: 15, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#374151' }}>Action</span>
      </label>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {ALL_COLS.map(col => (
          <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', cursor: 'pointer', background: visibleCols.has(col.key) ? '#ddeeff' : 'transparent' }}>
            <input type="checkbox" checked={visibleCols.has(col.key)} onChange={e => onToggle(col.key, e.target.checked)} style={{ accentColor: '#0B5AA0', width: 15, height: 15, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#374151' }}>{col.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Filter Popup ─────────────────────────────────────────────────────────────

function FilterPopup({ anchorRect, colKey: _colKey, allValues, applied, onApply, onCancel, onClear }: {
  anchorRect: DOMRect; colKey: ColKey;
  allValues: string[]; applied: AppliedFilters | undefined;
  onApply: (f: AppliedFilters) => void; onCancel: () => void; onClear: () => void;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>('value');

  // Value tab state
  const [valSearch, setValSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(applied?.value ?? allValues);

  // Condition tab state
  const [cond1, setCond1] = useState(applied?.condition?.cond1 ?? '(not set)');
  const [val1,  setVal1]  = useState(applied?.condition?.val1 ?? '');
  const [logic, setLogic] = useState<'And'|'Or'>(applied?.condition?.logic ?? 'And');
  const [cond2, setCond2] = useState(applied?.condition?.cond2 ?? '(not set)');
  const [val2,  setVal2]  = useState(applied?.condition?.val2 ?? '');

  const visible = allValues.filter(v => v.toLowerCase().includes(valSearch.toLowerCase()));
  const allChecked = visible.length > 0 && visible.every(v => selected.includes(v));
  function toggleAll() { allChecked ? setSelected(s => s.filter(v => !visible.includes(v))) : setSelected(s => [...new Set([...s, ...visible])]); }
  function toggle(v: string) { setSelected(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]); }

  const left = Math.min(anchorRect.left, window.innerWidth - 292);
  const top  = Math.min(anchorRect.bottom + 4, window.innerHeight - 480);

  const btnBase: React.CSSProperties = { flex: 1, padding: '7px 0', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' };

  return (
    <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top, left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', width: 282 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? '#0B5AA0' : '#6b7280', borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent' }}>
            {t === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>

      {tab === 'value' ? (
        <>
          <div style={{ padding: '10px 10px 6px' }}>
            <input autoFocus value={valSearch} onChange={e => setValSearch(e.target.value)} placeholder="Search" style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ padding: '0 6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 4, cursor: 'pointer', background: '#e8f0fa', marginBottom: 2, fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
              Select All
            </label>
            <div style={{ maxHeight: 180, overflowY: 'auto' }}>
              {visible.map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 4, cursor: 'pointer', background: selected.includes(v) ? '#e8f0fa' : 'transparent', fontSize: 13, marginBottom: 1 }}>
                  <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
                  {v}
                </label>
              ))}
              {visible.length === 0 && <div style={{ padding: '10px 8px', color: '#9ca3af', fontSize: 12 }}>No values</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #e5e7eb', marginTop: 6 }}>
            <button onClick={() => onApply({ value: selected })} style={{ ...btnBase, background: '#0B5AA0', color: '#fff', border: 'none', fontWeight: 700 }}>Apply</button>
            <button onClick={onCancel}  style={{ ...btnBase, background: '#fff', color: '#374151' }}>Cancel</button>
            <button onClick={onClear}   style={{ ...btnBase, background: '#fff', color: '#374151' }}>Clear</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: '12px 12px 0' }}>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>Show items where the value</div>
            <select value={cond1} onChange={e => setCond1(e.target.value)} style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 6, outline: 'none' }}>
              {CONDITION_OPS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={val1} onChange={e => setVal1(e.target.value)} placeholder="" style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
            {/* And / Or */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 10 }}>
              {(['And', 'Or'] as const).map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={logic === opt} onChange={() => setLogic(opt)} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
                  {opt}
                </label>
              ))}
            </div>
            <select value={cond2} onChange={e => setCond2(e.target.value)} style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 6, outline: 'none' }}>
              {CONDITION_OPS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={val2} onChange={e => setVal2(e.target.value)} placeholder="" style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 2, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid #e5e7eb', marginTop: 8 }}>
            <button onClick={() => onApply({ condition: { cond1, val1, logic, cond2, val2 } })} style={{ ...btnBase, background: '#0B5AA0', color: '#fff', border: 'none', fontWeight: 700 }}>Apply</button>
            <button onClick={onCancel} style={{ ...btnBase, background: '#fff', color: '#374151' }}>Cancel</button>
            <button onClick={onClear}  style={{ ...btnBase, background: '#fff', color: '#374151' }}>Clear</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdjusterManagementPage() {
  const navigate = useNavigate();
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [adjusters, setAdjusters] = useState<TempAdjusterDto[]>([]);
  const [error,    setError]    = useState('');

  const [visibleCols,     setVisibleCols]     = useState<Set<ColKey>>(new Set(ALL_COLS.map(c => c.key)));
  const [showColPanel,    setShowColPanel]    = useState(false);
  const [colPanelRect,    setColPanelRect]    = useState<DOMRect | null>(null);
  const [activeFilter,    setActiveFilter]    = useState<ColKey | null>(null);
  const [filterRect,      setFilterRect]      = useState<DOMRect | null>(null);
  const [columnFilters,   setColumnFilters]   = useState<Record<string, AppliedFilters>>({});

  useEffect(() => {
    adjustersApi.getAll().then(setAdjusters).catch(() => setError('Unable to load adjusters.'));
  }, []);

  // Unique column values for filter popup
  const colValues = useMemo(() => {
    const m: Record<string, string[]> = {};
    ALL_COLS.forEach(col => {
      m[col.key] = [...new Set(adjusters.map(r => getCellValue(r, col.key)))].sort();
    });
    return m;
  }, [adjusters]);

  // Keyword search + column filters applied
  const filteredRows = useMemo(() => {
    let r = adjusters;
    // keyword search
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(row => ALL_COLS.some(c => getCellValue(row, c.key).toLowerCase().includes(q)));
    // column filters
    Object.entries(columnFilters).forEach(([key, f]) => {
      const k = key as ColKey;
      if (f.value) {
        if (f.value.length < (colValues[k]?.length ?? 0)) {
          r = r.filter(row => f.value!.includes(getCellValue(row, k)));
        }
      }
      if (f.condition) {
        r = r.filter(row => matchesConditionFilter(getCellValue(row, k), f.condition!));
      }
    });
    return r;
  }, [adjusters, search, columnFilters, colValues]);

  const pageRows   = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const activeCount   = adjusters.filter(r => (r.status || 'Active').toLowerCase() !== 'inactive').length;
  const inactiveCount = adjusters.length - activeCount;
  const visibleColDefs = ALL_COLS.filter(c => visibleCols.has(c.key));

  function isFiltered(key: ColKey) {
    const f = columnFilters[key];
    if (!f) return false;
    if (f.value && f.value.length < (colValues[key]?.length ?? 0)) return true;
    if (f.condition && (f.condition.cond1 !== '(not set)' || f.condition.cond2 !== '(not set)')) return true;
    return false;
  }

  const TH: React.CSSProperties = {
    padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
    textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff',
  };
  const TD: React.CSSProperties = {
    padding: '10px 12px', borderRight: '1px solid #edf1f5', fontSize: 13, color: '#111827',
  };

  return (
    <div
      style={{ padding: 16, background: '#fff', minHeight: '100%' }}
      onClick={() => { setActiveFilter(null); setShowColPanel(false); }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Adjuster Management</h1>
      {error && <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 13 }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 26 }}>
        {([
          { label: 'Total',    value: adjusters.length,  tone: '#0B5AA0', variant: 'total'    },
          { label: 'Active',   value: activeCount,        tone: '#009765', variant: 'active'   },
          { label: 'Inactive', value: inactiveCount,      tone: '#d82929', variant: 'inactive' },
        ] as const).map(s => (
          <div key={s.label} style={{ minHeight: 80, background: 'linear-gradient(90deg, #fff8ff 0%, #f2ffff 100%)', borderRadius: 6, padding: '14px 12px', border: '1px solid #e4eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#111827', marginBottom: 4, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.tone, lineHeight: 1 }}>{s.value}</div>
            </div>
            <AdjusterIcon tone={s.tone} variant={s.variant} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ position: 'relative', width: 290 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', lineHeight: 1 }}><SearchIcon /></span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Keyword"
            style={{ paddingLeft: 36, fontSize: 13, width: 290, height: 34, border: '1px solid #aeb7c2', borderRadius: 3, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate('/claims/adjusters/new')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 18px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>+</span> Add Adjuster
        </button>
      </div>

      {/* Table — no overflowX wrapper; <main> handles the single horizontal scroll */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
        <table style={{ width: '100%', minWidth: 1700, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {/* ≡ hamburger — serial in data rows */}
              <th
                style={{ ...TH, width: 42, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={e => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setColPanelRect(rect);
                  setShowColPanel(v => !v);
                }}
              >
                <span style={{ fontSize: 16, color: '#4b5563' }}>≡</span>
              </th>
              {/* Action */}
              <th style={{ ...TH, width: 70 }}>Action</th>
              {/* Data columns */}
              {visibleColDefs.map(col => (
                <th key={col.key} style={{ ...TH }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {col.label}
                    <span
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', lineHeight: 1 }}
                      onClick={e => {
                        e.stopPropagation();
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        if (activeFilter === col.key) { setActiveFilter(null); }
                        else { setFilterRect(rect); setActiveFilter(col.key); }
                      }}
                    >
                      <FilterArrow active={isFiltered(col.key)} />
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={visibleColDefs.length + 2} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                  No Data Available
                </td>
              </tr>
            ) : pageRows.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #edf1f5' }}>
                {/* Serial */}
                <td style={{ ...TD, textAlign: 'center', color: '#64748b', width: 42 }}>{(page - 1) * pageSize + idx + 1}</td>
                {/* Action */}
                <td style={{ ...TD }}>
                  <button onClick={() => navigate('/claims/adjusters/' + row.id)} title="View" style={{ background: 'none', border: 'none', color: '#374151', padding: 4, cursor: 'pointer' }}>
                    <EyeIcon />
                  </button>
                </td>
                {/* Data cells */}
                {visibleColDefs.map(col => (
                  <td key={col.key} style={{ ...TD }}>
                    {col.key === 'fullName' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#d9f2ff', color: '#0B5AA0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {getRowInitials(row)}
                        </span>
                        {getRowFullName(row)}
                      </span>
                    ) : col.key === 'status' ? (
                      <StatusPill status={row.status} />
                    ) : (
                      getCellValue(row, col.key)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12 }}>
        <PaginationBar
          page={page} pageSize={pageSize} total={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        />
      </div>

      {/* Column panel — fixed, never clipped */}
      {showColPanel && colPanelRect && (
        <ColumnPanel
          anchorRect={colPanelRect}
          visibleCols={visibleCols}
          onToggle={(key, on) => setVisibleCols(prev => { const n = new Set(prev); on ? n.add(key) : n.delete(key); return n; })}
          onClose={() => setShowColPanel(false)}
        />
      )}

      {/* Filter popup — fixed, never clipped */}
      {activeFilter && filterRect && (
        <FilterPopup
          anchorRect={filterRect}
          colKey={activeFilter}
          allValues={colValues[activeFilter] ?? []}
          applied={columnFilters[activeFilter]}
          onApply={f => { setColumnFilters(p => ({ ...p, [activeFilter]: f })); setActiveFilter(null); setPage(1); }}
          onCancel={() => setActiveFilter(null)}
          onClear={() => { setColumnFilters(p => { const n = { ...p }; delete n[activeFilter!]; return n; }); setActiveFilter(null); setPage(1); }}
        />
      )}
    </div>
  );
}
