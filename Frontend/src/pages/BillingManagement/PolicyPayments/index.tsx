import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../../../api/distribution';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PolicyPaymentRow {
  id: number;
  transaction_id: number;
  policy_holder_name: string;
  policy_number: string;
  quote_number: string;
  transaction_type: string;
  product: string;
  mortgagee: string;
  effective_date: string | null;
  expiration_date: string | null;
  payment_plan: string;
  due_date: string | null;
  total_premium: number;
  installment_amount_due: number;
  total_due: number;
}

interface CondState {
  op1: string; val1: string;
  logic: 'and' | 'or';
  op2: string; val2: string;
}

type ColFilter =
  | { type: 'value'; vals: string[] }
  | { type: 'condition'; op1: string; val1: string; logic: 'and' | 'or'; op2: string; val2: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const COND_OPS = [
  { value: '',             label: '(not set)'        },
  { value: 'is',           label: 'is'               },
  { value: 'is_not',       label: 'is not'           },
  { value: 'contains',     label: 'contains'         },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'starts_with',  label: 'starts with'      },
  { value: 'ends_with',    label: 'ends with'        },
  { value: 'is_blank',     label: 'is blank'         },
  { value: 'not_blank',    label: 'is not blank'     },
];

const COLUMNS: { key: keyof PolicyPaymentRow; label: string }[] = [
  { key: 'policy_holder_name',     label: 'Policy Holder Name'     },
  { key: 'policy_number',          label: 'Policy Number'          },
  { key: 'quote_number',           label: 'Quote Number'           },
  { key: 'transaction_type',       label: 'Transaction Type'       },
  { key: 'product',                label: 'Product'                },
  { key: 'mortgagee',              label: 'Mortgagee'              },
  { key: 'effective_date',         label: 'Effective Date'         },
  { key: 'expiration_date',        label: 'Expiration Date'        },
  { key: 'payment_plan',           label: 'Payment Plan'           },
  { key: 'due_date',               label: 'Due Date'               },
  { key: 'total_premium',          label: 'Total Premium'          },
  { key: 'installment_amount_due', label: 'Installment Amount Due' },
  { key: 'total_due',              label: 'Total Due'              },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const EMPTY_COND: CondState = { op1: '', val1: '', logic: 'and', op2: '', val2: '' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v: string | null): string {
  if (!v) return '—';
  const part = v.split('T')[0];
  const [y, m, d] = part.split('-');
  return `${m}-${d}-${y}`;
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(2);
}

const DATE_KEYS = new Set<keyof PolicyPaymentRow>(['effective_date', 'expiration_date', 'due_date']);
const MONEY_KEYS = new Set<keyof PolicyPaymentRow>(['total_premium', 'installment_amount_due', 'total_due']);

function colDisplay(row: PolicyPaymentRow, key: keyof PolicyPaymentRow): string {
  const v = row[key];
  if (DATE_KEYS.has(key))  return fmtDate(v as string | null);
  if (MONEY_KEYS.has(key)) return fmtNum(v as number);
  return String(v ?? '');
}

function matchCondition(raw: string, op: string, target: string): boolean {
  const v = raw.toLowerCase();
  const t = target.toLowerCase().trim();
  switch (op) {
    case 'is':           return v === t;
    case 'is_not':       return v !== t;
    case 'contains':     return v.includes(t);
    case 'not_contains': return !v.includes(t);
    case 'starts_with':  return v.startsWith(t);
    case 'ends_with':    return v.endsWith(t);
    case 'is_blank':     return raw === '';
    case 'not_blank':    return raw !== '';
    default:             return true;
  }
}

function applyColFilters(rows: PolicyPaymentRow[], filters: Record<string, ColFilter>): PolicyPaymentRow[] {
  const entries = Object.entries(filters);
  if (!entries.length) return rows;
  return rows.filter(row =>
    entries.every(([key, f]) => {
      const val = colDisplay(row, key as keyof PolicyPaymentRow);
      if (f.type === 'value') return f.vals.includes(val);
      const c1ok = f.op1 ? matchCondition(val, f.op1, f.val1) : true;
      const c2ok = f.op2 ? matchCondition(val, f.op2, f.val2) : true;
      if (!f.op1 && !f.op2) return true;
      if (!f.op1) return c2ok;
      if (!f.op2) return c1ok;
      return f.logic === 'and' ? c1ok && c2ok : c1ok || c2ok;
    })
  );
}

function applySort(rows: PolicyPaymentRow[], col: string, dir: string): PolicyPaymentRow[] {
  if (!col) return rows;
  return [...rows].sort((a, b) => {
    const av = colDisplay(a, col as keyof PolicyPaymentRow);
    const bv = colDisplay(b, col as keyof PolicyPaymentRow);
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

function getUniqueVals(rows: PolicyPaymentRow[], key: keyof PolicyPaymentRow): string[] {
  const s = new Set<string>();
  rows.forEach(r => { const v = colDisplay(r, key); if (v && v !== '—') s.add(v); });
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function buildPageNums(cur: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const p: (number | '...')[] = [1];
  if (cur > 3) p.push('...');
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) p.push(i);
  if (cur < total - 2) p.push('...');
  p.push(total);
  return p;
}

// ── ColFilterDropdown ─────────────────────────────────────────────────────────

interface ColFilterDropdownProps {
  pos: { top: number; left: number };
  activeTab: 'condition' | 'value';
  onTabChange: (t: 'condition' | 'value') => void;
  cond: CondState;
  onCondChange: (u: Partial<CondState>) => void;
  allVals: string[];
  vPending: string[];
  vSearch: string;
  onSetVPending: (v: string[]) => void;
  onSetVSearch:  (s: string) => void;
  onApply:  () => void;
  onCancel: () => void;
  onClear:  () => void;
}

function ColFilterDropdown({
  pos, activeTab, onTabChange, cond, onCondChange,
  allVals, vPending, vSearch, onSetVPending, onSetVSearch,
  onApply, onCancel, onClear,
}: ColFilterDropdownProps) {
  const visible = vSearch.trim()
    ? allVals.filter(v => v.toLowerCase().includes(vSearch.toLowerCase()))
    : allVals;
  const allVis = visible.length > 0 && visible.every(v => vPending.includes(v));
  const noBlankOp = (op: string) => op !== 'is_blank' && op !== 'not_blank';
  const safeLeft = Math.min(pos.left, window.innerWidth - 314);

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={onCancel} />
      <div className="col-filter" style={{ top: pos.top, left: safeLeft }}>
        <div className="col-filter__tabs">
          <span className={`col-filter__tab${activeTab === 'condition' ? ' col-filter__tab--on' : ''}`}
            onClick={() => onTabChange('condition')}>Filter by Condition</span>
          <span className={`col-filter__tab${activeTab === 'value' ? ' col-filter__tab--on' : ''}`}
            onClick={() => onTabChange('value')}>Filter by Value</span>
        </div>

        {activeTab === 'condition' && (
          <div className="col-filter__cond">
            <p className="col-filter__cond-lbl">Show items where the value</p>
            <select className="col-filter__cond-op" value={cond.op1}
              onChange={e => onCondChange({ op1: e.target.value, val1: '' })}>
              {COND_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {noBlankOp(cond.op1) && (
              <input className="col-filter__cond-val" value={cond.val1}
                onChange={e => onCondChange({ val1: e.target.value })}
                disabled={!cond.op1} autoFocus />
            )}
            <div className="col-filter__logic">
              <label className="col-filter__logic-opt">
                <input type="radio" checked={cond.logic === 'and'}
                  onChange={() => onCondChange({ logic: 'and' })} />
                <span>And</span>
              </label>
              <label className="col-filter__logic-opt">
                <input type="radio" checked={cond.logic === 'or'}
                  onChange={() => onCondChange({ logic: 'or' })} />
                <span>Or</span>
              </label>
            </div>
            <select className="col-filter__cond-op" value={cond.op2}
              onChange={e => onCondChange({ op2: e.target.value, val2: '' })}>
              {COND_OPS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {noBlankOp(cond.op2) && (
              <input className="col-filter__cond-val" value={cond.val2}
                onChange={e => onCondChange({ val2: e.target.value })}
                disabled={!cond.op2} />
            )}
          </div>
        )}

        {activeTab === 'value' && (
          <>
            <input className="col-filter__search" placeholder="Search" value={vSearch}
              onChange={e => onSetVSearch(e.target.value)} autoFocus />
            <div className="col-filter__list">
              <label className="col-filter__item col-filter__item--all">
                <input type="checkbox" className="col-filter__cb" checked={allVis}
                  onChange={() => {
                    if (allVis) onSetVPending(vPending.filter(v => !visible.includes(v)));
                    else        onSetVPending([...new Set([...vPending, ...visible])]);
                  }} />
                <span>Select All</span>
              </label>
              {visible.length === 0
                ? <div className="col-filter__empty">No matches.</div>
                : visible.map(v => (
                    <label key={v} className="col-filter__item">
                      <input type="checkbox" className="col-filter__cb"
                        checked={vPending.includes(v)}
                        onChange={() => {
                          if (vPending.includes(v)) onSetVPending(vPending.filter(x => x !== v));
                          else                      onSetVPending([...vPending, v]);
                        }} />
                      <span className="col-filter__val">{v}</span>
                    </label>
                  ))
              }
            </div>
          </>
        )}

        <div className="col-filter__foot">
          <button type="button" className="col-filter__btn col-filter__btn--apply"  onClick={onApply}>Apply</button>
          <button type="button" className="col-filter__btn col-filter__btn--cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="col-filter__btn col-filter__btn--clear"  onClick={onClear}>Clear</button>
        </div>
      </div>
    </>
  );
}

// ── ColChooser ────────────────────────────────────────────────────────────────

function ColChooser({
  pos, visibleCols, onToggle, onClose,
}: {
  pos: { top: number; left: number };
  visibleCols: Set<string>;
  onToggle: (k: string) => void;
  onClose: () => void;
}) {
  const safeLeft = Math.min(pos.left, window.innerWidth - 250);
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 399 }} onClick={onClose} />
      <div className="col-chooser" style={{ top: pos.top, left: safeLeft }}>
        <div className="col-chooser__head">Modify Columns Display</div>
        <label className="col-chooser__item col-chooser__item--fixed">
          <input type="checkbox" className="col-chooser__cb" checked readOnly />
          <span>Action</span>
        </label>
        {COLUMNS.map(col => {
          const on = visibleCols.has(col.key);
          return (
            <label key={col.key} className={`col-chooser__item${on ? ' col-chooser__item--on' : ''}`}>
              <input type="checkbox" className="col-chooser__cb" checked={on}
                onChange={() => onToggle(col.key)} />
              <span>{col.label}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4,
  textTransform: 'uppercase', letterSpacing: '0.4px',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, color: '#111827', background: '#fff',
  outline: 'none', boxSizing: 'border-box', appearance: 'auto' as any,
  transition: 'border 0.15s, box-shadow 0.15s',
};

// ── Search icon ───────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MinusIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /></svg>;
}

function PlusIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}

function EyeIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PolicyPaymentsPage({ onPolicyViewed }: { onPolicyViewed: () => void }) {
  const navigate = useNavigate();

  const [searchOpen,  setSearchOpen]  = useState(true);
  const [billType,    setBillType]    = useState('Mortgagee');
  const [mortgagee,   setMortgagee]   = useState('');
  const [loanNum,     setLoanNum]     = useState('');
  const [holderName,  setHolderName]  = useState('');
  const [policyNum,   setPolicyNum]   = useState('');
  const [address,     setAddress]     = useState('');

  const [allRows,  setAllRows]  = useState<PolicyPaymentRow[]>([]);
  const [loading,  setLoading]  = useState(false);

  const [visibleCols,    setVisibleCols]    = useState<Set<string>>(() => new Set(COLUMNS.map(c => c.key)));
  const [showColChooser, setShowColChooser] = useState(false);
  const [chooserPos,     setChooserPos]     = useState<{ top: number; left: number } | null>(null);
  const [filterCol,      setFilterCol]      = useState<string | null>(null);
  const [filterPos,      setFilterPos]      = useState<{ top: number; left: number } | null>(null);
  const [filterTab,      setFilterTab]      = useState<'condition' | 'value'>('condition');
  const [cond,           setCond]           = useState<CondState>(EMPTY_COND);
  const [vPending,       setVPending]       = useState<string[]>([]);
  const [vSearch,        setVSearch]        = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, ColFilter>>({});
  const [sortCol,        setSortCol]        = useState('');
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc'>('asc');
  const [page,           setPage]           = useState(1);
  const [pageSize,       setPageSize]       = useState(10);

  const fetchData = useCallback((filters: Record<string, string>) => {
    setLoading(true);
    billingApi.searchPolicyPayments(filters)
      .then(rows => { setAllRows(rows); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData({}); }, [fetchData]);

  const filtered = useMemo(() => applyColFilters(allRows, appliedFilters), [allRows, appliedFilters]);
  const sorted   = useMemo(() => applySort(filtered, sortCol, sortDir), [filtered, sortCol, sortDir]);

  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageRows   = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);
  const startRow   = (page - 1) * pageSize + 1;
  const pageNums   = useMemo(() => buildPageNums(page, totalPages), [page, totalPages]);
  const displayCols = COLUMNS.filter(c => visibleCols.has(c.key));

  function handleSearch() {
    fetchData({
      billType,
      mortgageeName:       mortgagee,
      loanNumber:          loanNum,
      policyholderName:    holderName,
      policyNumber:        policyNum,
      policyholderAddress: address,
    });
  }

  function handleReset() {
    setBillType('Mortgagee');
    setMortgagee(''); setLoanNum('');
    setHolderName(''); setPolicyNum(''); setAddress('');
    fetchData({});
  }

  function handleViewPolicy(row: PolicyPaymentRow) {
    billingApi.logPolicyView(row.id).catch(() => {});
    onPolicyViewed();
    navigate(`/billing/make-payment/${row.transaction_id}`);
  }

  function openColChooser(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    if (showColChooser) { setShowColChooser(false); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setChooserPos({ top: rect.bottom + 4, left: rect.left });
    setShowColChooser(true);
  }

  function openColFilter(e: React.MouseEvent<HTMLElement>, col: string) {
    e.stopPropagation();
    if (filterCol === col) { closeColFilter(); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterCol(col);
    setFilterPos({ top: rect.bottom + 4, left: rect.left });
    setVSearch('');
    const applied = appliedFilters[col];
    if (applied?.type === 'condition') {
      setFilterTab('condition');
      setCond({ op1: applied.op1, val1: applied.val1, logic: applied.logic, op2: applied.op2, val2: applied.val2 });
      setVPending(getUniqueVals(allRows, col as keyof PolicyPaymentRow));
    } else if (applied?.type === 'value') {
      setFilterTab('value');
      setVPending([...applied.vals]);
      setCond(EMPTY_COND);
    } else {
      setFilterTab('condition');
      setCond(EMPTY_COND);
      setVPending(getUniqueVals(allRows, col as keyof PolicyPaymentRow));
    }
  }

  function closeColFilter() { setFilterCol(null); setFilterPos(null); setVSearch(''); }

  function applyColFilter() {
    if (!filterCol) return;
    const next = { ...appliedFilters };
    if (filterTab === 'condition') {
      if (!cond.op1 && !cond.op2) delete next[filterCol];
      else next[filterCol] = { type: 'condition', ...cond };
    } else {
      const allV = getUniqueVals(allRows, filterCol as keyof PolicyPaymentRow);
      if (!vPending.length || vPending.length >= allV.length) delete next[filterCol];
      else next[filterCol] = { type: 'value', vals: [...vPending] };
    }
    setAppliedFilters(next);
    closeColFilter();
    setPage(1);
  }

  function handleSort(col: string) {
    setSortDir(prev => (sortCol === col && prev === 'asc') ? 'desc' : 'asc');
    setSortCol(col);
    setPage(1);
  }

  return (
    <div style={{ padding: '22px 28px 28px', minHeight: '100%', boxSizing: 'border-box' }}>

      <h1 className="page-title">Policy Payments</h1>

      {/* Quick Search Panel */}
      <div className="grid-wrapper" style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: searchOpen ? '1px solid #e2e8f0' : 'none',
        }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>Quick Search</span>
          <button
            onClick={() => setSearchOpen(o => !o)}
            style={{
              background: 'none', border: '1px solid #d1d5db', borderRadius: '50%',
              width: 22, height: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280',
            }}
          >
            {searchOpen ? <MinusIcon /> : <PlusIcon />}
          </button>
        </div>

        {searchOpen && (
          <div style={{ padding: '14px 16px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr 210px', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Bill Type</label>
                <select value={billType} onChange={e => setBillType(e.target.value)} style={INPUT_STYLE}>
                  <option value="Mortgagee">Mortgagee</option>
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Mortgagee Name</label>
                <input style={INPUT_STYLE} value={mortgagee}
                  onChange={e => setMortgagee(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Loan Number</label>
                <input style={INPUT_STYLE} value={loanNum}
                  onChange={e => setLoanNum(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={LABEL_STYLE}>Policyholder Name</label>
                <input style={INPUT_STYLE} value={holderName}
                  onChange={e => setHolderName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Policy Number</label>
                <input style={INPUT_STYLE} value={policyNum}
                  onChange={e => setPolicyNum(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Policyholder Address</label>
                <input style={INPUT_STYLE} value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn--outline" onClick={handleReset}>Reset</button>
              <button className="btn btn--primary" onClick={handleSearch}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SearchIcon /> Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading
        ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>Loading…</div>
        : pageRows.length === 0
          ? <div className="empty-state">No policy payment records found. Use Quick Search to look up a policy.</div>
          : (
            <div className="grid-wrapper" style={{ overflowX: 'auto' }}>
              <table className="dm-grid" style={{ minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th className="th-line">
                      <button type="button" className="th-col-chooser-btn"
                        title="Modify Columns Display" onClick={openColChooser}>
                        &#8801;
                      </button>
                    </th>
                    <th className="th-action">Action</th>
                    {displayCols.map(col => (
                      <th key={col.key} className="th-sortable"
                        onClick={() => handleSort(col.key)}
                        aria-sort={sortCol === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                      >
                        <button
                          type="button"
                          className={`th-filter-btn${appliedFilters[col.key] ? ' th-filter-btn--on' : ''}`}
                          onClick={e => openColFilter(e, col.key)}
                          title="Filter"
                        >&#9660;</button>
                        {col.label}
                        {sortCol === col.key && (
                          <span className="sort-arrow">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                        )}
                      </th>
                    ))}
                    <th className="th-filter-end">
                      <span className="th-filter-icon">&#9660;</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, idx) => (
                    <tr key={row.id} className="grid-row">
                      <td className="td-rownum">{startRow + idx}</td>
                      <td className="td-action">
                        <button className="action-btn" title="View" onClick={() => handleViewPolicy(row)}>
                          <EyeIcon />
                        </button>
                      </td>
                      {displayCols.map(col => (
                        <td key={col.key}>
                          {col.key === 'policy_number'
                            ? <button className="link-btn" onClick={() => handleViewPolicy(row)}>{row.policy_number}</button>
                            : col.key === 'quote_number'
                              ? <button className="link-btn" onClick={() => handleViewPolicy(row)}>{row.quote_number}</button>
                              : colDisplay(row, col.key)
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }

      {/* Pagination */}
      {!loading && pageRows.length > 0 && (
        <div className="pager-bar">
          <div className="pager-bar__left">
            <span>Showing</span>
            <select className="pager-bar__size-select" value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span>records from <strong>{totalCount}</strong> Results</span>
          </div>
          <div className="pager-bar__right">
            <button className="pager-btn" disabled={page === 1} onClick={() => setPage(1)}>&laquo;</button>
            <button className="pager-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&lsaquo;</button>
            {pageNums.map((p, i) =>
              p === '...'
                ? <span key={`e${i}`} className="pager-ellipsis">&hellip;</span>
                : <button key={p} className={`pager-btn${page === p ? ' pager-btn--active' : ''}`}
                    onClick={() => setPage(p as number)}>{p}</button>
            )}
            <button className="pager-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>&rsaquo;</button>
            <button className="pager-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>&raquo;</button>
          </div>
        </div>
      )}

      {/* Column filter dropdown */}
      {filterCol && filterPos && (
        <ColFilterDropdown
          pos={filterPos}
          activeTab={filterTab}
          onTabChange={setFilterTab}
          cond={cond}
          onCondChange={u => setCond(prev => ({ ...prev, ...u }))}
          allVals={getUniqueVals(allRows, filterCol as keyof PolicyPaymentRow)}
          vPending={vPending}
          vSearch={vSearch}
          onSetVPending={setVPending}
          onSetVSearch={setVSearch}
          onApply={applyColFilter}
          onCancel={closeColFilter}
          onClear={() => { if (filterTab === 'condition') setCond(EMPTY_COND); else setVPending([]); }}
        />
      )}

      {/* Column chooser */}
      {showColChooser && chooserPos && (
        <ColChooser
          pos={chooserPos}
          visibleCols={visibleCols}
          onToggle={key => setVisibleCols(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
          })}
          onClose={() => setShowColChooser(false)}
        />
      )}
    </div>
  );
}
