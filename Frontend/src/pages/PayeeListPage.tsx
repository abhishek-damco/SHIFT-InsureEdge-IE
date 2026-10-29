import { useEffect, useMemo, useRef, useState } from 'react';
import PaginationBar from '../components/PaginationBar';
import { payeesApi, type PayeeListItemDto, type PayeeKpiDto } from '../api/payees';

// ─── Types ────────────────────────────────────────────────────────────────────
type ColKey = 'payeeName' | 'payeeType' | 'claimId' | 'policyId' | 'paymentMethod' | 'complianceCheck' | 'dateOfLoss' | 'lossType' | 'amount' | 'status';

interface ConditionFilter { cond1: string; val1: string; logic: 'And' | 'Or'; cond2: string; val2: string; }
interface AppliedFilters { value?: string[]; condition?: ConditionFilter; }

type PayeeRow = PayeeListItemDto;

// ─── Column definitions ───────────────────────────────────────────────────────
const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: 'payeeName',      label: 'Payee Name' },
  { key: 'payeeType',      label: 'Payee Type' },
  { key: 'claimId',        label: 'Claim ID' },
  { key: 'policyId',       label: 'Policy ID' },
  { key: 'paymentMethod',  label: 'Payment Method' },
  { key: 'complianceCheck',label: 'Compliance Check Status' },
  { key: 'dateOfLoss',     label: 'Date of Loss' },
  { key: 'lossType',       label: 'Loss Type' },
  { key: 'amount',         label: 'Amount' },
  { key: 'status',         label: 'Status' },
];

const CONDITION_OPS = [
  '(not set)', 'Contains', 'Does Not Contain', 'Starts With',
  'Ends With', 'Equal', 'Not Equal', 'Is Empty', 'Is Not Empty',
];

// ─── Filter logic ─────────────────────────────────────────────────────────────
function applyCondOp(op: string, cellVal: string, testVal: string): boolean {
  const c = cellVal.toLowerCase(), t = testVal.toLowerCase();
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

function matchesCond(cellVal: string, f: ConditionFilter): boolean {
  const r1 = !f.cond1 || f.cond1 === '(not set)' ? true : applyCondOp(f.cond1, cellVal, f.val1);
  const r2 = !f.cond2 || f.cond2 === '(not set)' ? true : applyCondOp(f.cond2, cellVal, f.val2);
  if ((!f.cond1 || f.cond1 === '(not set)') && (!f.cond2 || f.cond2 === '(not set)')) return true;
  if (!f.cond1 || f.cond1 === '(not set)') return r2;
  if (!f.cond2 || f.cond2 === '(not set)') return r1;
  return f.logic === 'And' ? r1 && r2 : r1 || r2;
}


function getCellValue(row: PayeeRow, key: ColKey): string {
  return row[key];
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

// ─── Stat card icons ──────────────────────────────────────────────────────────
function PayeeStatIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#0B5AA0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="18" r="8" />
      <path d="M10 42c0-8 5.5-13 14-13 3.5 0 6.7 1 9.2 2.8" />
      <circle cx="40" cy="36" r="6" /><path d="M40 33v3l2 2" />
    </svg>
  );
}
function PolicyStatIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#009765" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 40h12a2 2 0 002-2V22l-6-6H20a2 2 0 00-2 2v20a2 2 0 002 2z" />
      <path d="M28 16v6h6M23 28h6M23 33h4" />
    </svg>
  );
}
function ClaimStatIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#d89000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M26 14c-3 3-5 7-3 11s5 6 3 10" />
      <path d="M20 18c-2 3-2 6-1 8s4 4 2 8" />
      <path d="M32 18c2 3 2 6 1 8s-4 4-2 8" />
    </svg>
  );
}
function AmountStatIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14,36 22,26 29,31 38,18" />
      <polyline points="33,18 38,18 38,23" />
      <line x1="14" y1="40" x2="40" y2="40" />
    </svg>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ value }: { value: string }) {
  if (value === 'Approved') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999, border: '1px solid #008c55', background: '#d7f7e4', color: '#006b3c', fontSize: 12, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#008c55' }} />Approved</span>;
  }
  if (value === 'Draft') {
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999, border: '1px solid #d89000', background: '#fff4d6', color: '#9a6400', fontSize: 12, fontWeight: 700 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#d89000' }} />Draft</span>;
  }
  return <span style={{ fontSize: 12 }}>{value}</span>;
}

// ─── Column Panel ─────────────────────────────────────────────────────────────
function ColumnPanel({ anchorRect, visibleCols, onToggle, onClose }: {
  anchorRect: DOMRect;
  visibleCols: Set<ColKey>;
  onToggle: (key: ColKey, on: boolean) => void;
  onClose: () => void;
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
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
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
  anchorRect: DOMRect;
  colKey: ColKey;
  allValues: string[];
  applied: AppliedFilters | undefined;
  onApply: (f: AppliedFilters) => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>('value');
  const [valSearch, setValSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(applied?.value ?? allValues);
  const [cond1, setCond1] = useState(applied?.condition?.cond1 ?? '(not set)');
  const [val1,  setVal1]  = useState(applied?.condition?.val1 ?? '');
  const [logic, setLogic] = useState<'And' | 'Or'>(applied?.condition?.logic ?? 'And');
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
            <button onClick={onCancel} style={{ ...btnBase, background: '#fff', color: '#374151' }}>Cancel</button>
            <button onClick={onClear}  style={{ ...btnBase, background: '#fff', color: '#374151' }}>Clear</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ padding: '12px 12px 0' }}>
            <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>Show items where the value</div>
            <select value={cond1} onChange={e => setCond1(e.target.value)} style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 6, outline: 'none' }}>
              {CONDITION_OPS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input value={val1} onChange={e => setVal1(e.target.value)} style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
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
            <input value={val2} onChange={e => setVal2(e.target.value)} style={{ width: '100%', padding: '7px 8px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, marginBottom: 2, outline: 'none', boxSizing: 'border-box' }} />
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
export default function PayeeListPage() {
  const [rows,          setRows]          = useState<PayeeRow[]>([]);
  const [kpi,           setKpi]           = useState<PayeeKpiDto | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [pageSize,      setPageSize]      = useState(10);
  const [visibleCols,   setVisibleCols]   = useState<Set<ColKey>>(new Set(ALL_COLS.map(c => c.key)));
  const [showColPanel,  setShowColPanel]  = useState(false);
  const [colPanelRect,  setColPanelRect]  = useState<DOMRect | null>(null);
  const [activeFilter,  setActiveFilter]  = useState<ColKey | null>(null);
  const [filterRect,    setFilterRect]    = useState<DOMRect | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, AppliedFilters>>({});

  useEffect(() => {
    Promise.all([payeesApi.getList(), payeesApi.getKpi()])
      .then(([list, kpiData]) => { setRows(list); setKpi(kpiData); })
      .finally(() => setLoading(false));
  }, []);

  // Unique values per column for filter popup
  const colValues = useMemo(() => {
    const m: Record<string, string[]> = {};
    ALL_COLS.forEach(col => {
      m[col.key] = [...new Set(rows.map(r => getCellValue(r, col.key)))].sort();
    });
    return m;
  }, [rows]);

  const filteredRows = useMemo(() => {
    let r = rows;
    const q = search.trim().toLowerCase();
    if (q) r = r.filter(row => ALL_COLS.some(c => getCellValue(row, c.key).toLowerCase().includes(q)));
    Object.entries(columnFilters).forEach(([key, f]) => {
      const k = key as ColKey;
      if (f.value && f.value.length < (colValues[k]?.length ?? 0)) {
        r = r.filter(row => f.value!.includes(getCellValue(row, k)));
      }
      if (f.condition) {
        r = r.filter(row => matchesCond(getCellValue(row, k), f.condition!));
      }
    });
    return r;
  }, [search, columnFilters, colValues, rows]);

  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  }

  return (
    <div
      style={{ padding: 16, background: '#fff', minHeight: '100%' }}
      onClick={() => { setActiveFilter(null); setShowColPanel(false); }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 16 }}>Payee List</h1>

      {/* Stat Cards — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 26 }}>
        {([
          { label: 'Total Payee',   value: String(kpi?.totalPayees ?? 0),                                                color: '#0B5AA0', icon: <PayeeStatIcon /> },
          { label: 'Total Policy',  value: String(kpi?.totalPolicies ?? 0),                                              color: '#009765', icon: <PolicyStatIcon /> },
          { label: 'Total Claim',   value: String(kpi?.totalClaims ?? 0),                                                color: '#d89000', icon: <ClaimStatIcon /> },
          { label: 'Total Amount',  value: (kpi?.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), color: '#dc2626', icon: <AmountStatIcon /> },
        ]).map(s => (
          <div key={s.label} style={{ minHeight: 80, background: 'linear-gradient(90deg, #fff8ff 0%, #f2ffff 100%)', borderRadius: 6, padding: '14px 16px', border: '1px solid #e4eaf0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#111827', marginBottom: 4, fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: s.label === 'Total Amount' ? 22 : 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
            {s.icon}
          </div>
        ))}
      </div>

      {/* Search */}
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
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
        <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {/* ≡ col header — serial number in body rows */}
              <th
                style={{ ...TH, width: 48, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={e => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setColPanelRect(rect);
                  setShowColPanel(v => !v);
                }}
              >
                <span style={{ fontSize: 16, color: '#4b5563' }}>≡</span>
              </th>
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
                <td colSpan={visibleColDefs.length + 1} style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                  No Data Available
                </td>
              </tr>
            ) : pageRows.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #edf1f5' }}>
                {/* Serial (under ≡ header) */}
                <td style={{ ...TD, textAlign: 'center', color: '#64748b', width: 48 }}>
                  {(page - 1) * pageSize + idx + 1}
                </td>
                {/* Data cells */}
                {visibleColDefs.map(col => (
                  <td key={col.key} style={{ ...TD }}>
                    {col.key === 'payeeName' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {row.initials && (
                          <span style={{ width: 26, height: 26, borderRadius: '50%', background: row.avatarColor, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, letterSpacing: 0.3 }}>
                            {row.initials}
                          </span>
                        )}
                        <span style={{ color: row.payeeName === '-' ? '#94a3b8' : '#005da8', fontWeight: row.payeeName === '-' ? 400 : 600 }}>
                          {row.payeeName}
                        </span>
                      </span>
                    ) : col.key === 'status' ? (
                      <StatusPill value={row.status} />
                    ) : col.key === 'complianceCheck' ? (
                      <span style={{ color: row.complianceCheck === 'Pass' ? '#15803d' : '#94a3b8', fontWeight: row.complianceCheck === 'Pass' ? 600 : 400 }}>
                        {row.complianceCheck}
                      </span>
                    ) : col.key === 'claimId' ? (
                      <span style={{ color: '#005da8', fontWeight: 500 }}>{getCellValue(row, col.key)}</span>
                    ) : (
                      <span style={{ color: getCellValue(row, col.key) === '-' ? '#94a3b8' : '#111827' }}>
                        {getCellValue(row, col.key)}
                      </span>
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

      {/* Column Panel */}
      {showColPanel && colPanelRect && (
        <ColumnPanel
          anchorRect={colPanelRect}
          visibleCols={visibleCols}
          onToggle={(key, on) => setVisibleCols(prev => { const n = new Set(prev); on ? n.add(key) : n.delete(key); return n; })}
          onClose={() => setShowColPanel(false)}
        />
      )}

      {/* Filter Popup */}
      {activeFilter && filterRect && (
        <FilterPopup
          anchorRect={filterRect}
          colKey={activeFilter}
          allValues={colValues[activeFilter] ?? []}
          applied={columnFilters[activeFilter]}
          onApply={f => { setColumnFilters(prev => ({ ...prev, [activeFilter]: f })); setActiveFilter(null); setPage(1); }}
          onCancel={() => setActiveFilter(null)}
          onClear={() => { setColumnFilters(prev => { const n = { ...prev }; delete n[activeFilter!]; return n; }); setActiveFilter(null); setPage(1); }}
        />
      )}
    </div>
  );
}
