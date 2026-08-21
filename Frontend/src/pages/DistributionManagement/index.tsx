import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MOCK_ITEMS, getMockPage } from './mockData';
import { upsertDraftStep, setCurrentDraftId, clearCurrentDraftId } from './draftUtils';
import { distributionApi as api } from '../../api/distribution';
import type { IntermediaryListItem, IntermediaryRecord, SortState } from '../../types/Distribution';
import StatCards from '../../components/StatCards/StatCards';
import PaginationBar from '../../components/PaginationBar';
import AddIntermediaryPage from './AddIntermediaryPage';
import AssignRightsPage from './AssignRightsPage';
import AssignProductsPage from './AssignProductsPage';
import AddProducersPage from './AddProducersPage';
import ReviewSubmitPage from './ReviewSubmitPage';
import ViewIntermediaryPage from './ViewIntermediaryPage';
import BulkUploadModal from './BulkUploadModal';

const PERMISSIONS = { canCreate: true, canEdit: true, canDelete: false };
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

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

interface CondState {
  op1: string; val1: string;
  logic: 'and' | 'or';
  op2: string; val2: string;
}

type ColFilter =
  | { type: 'value'; vals: string[] }
  | { type: 'condition'; op1: string; val1: string; logic: 'and' | 'or'; op2: string; val2: string };

const COLUMNS: { key: keyof IntermediaryListItem; label: string; sortable: boolean; filterable: boolean }[] = [
  { key: 'id',                  label: 'ID',                   sortable: true,  filterable: true },
  { key: 'name',                label: 'Intermediary Name',    sortable: true,  filterable: true },
  { key: 'primaryContactName',  label: 'Primary Contact Name', sortable: false, filterable: true },
  { key: 'residentState',       label: 'Resident State',       sortable: true,  filterable: true },
  { key: 'status',              label: 'Status',               sortable: true,  filterable: true },
  { key: 'primaryContactTitle', label: 'Title',                sortable: false, filterable: true },
  { key: 'intermediaryType',    label: 'Type',                 sortable: true,  filterable: true },
];


const STATUS_CLS: Record<string, string> = {
  Active:   'badge badge--active',
  Inactive: 'badge badge--inactive',
  Draft:    'badge badge--draft',
};

function padId(n: number) { return String(n).padStart(5, '0'); }

function colValue(item: IntermediaryListItem, col: string): string {
  if (col === 'id') return padId(item.id);
  return String(item[col as keyof IntermediaryListItem] ?? '');
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
    case 'is_blank':     return raw === '' || raw == null;
    case 'not_blank':    return raw !== '' && raw != null;
    default:             return true;
  }
}

function applyKeyword(items: IntermediaryListItem[], kw: string) {
  if (!kw.trim()) return items;
  const q = kw.toLowerCase();
  return items.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.intermediaryType.toLowerCase().includes(q) ||
    (i.primaryContactName?.toLowerCase().includes(q) ?? false) ||
    i.residentState.toLowerCase().includes(q) ||
    i.status.toLowerCase().includes(q)
  );
}

function applyFilters(items: IntermediaryListItem[], filters: Record<string, ColFilter>): IntermediaryListItem[] {
  const entries = Object.entries(filters);
  if (entries.length === 0) return items;
  return items.filter(item =>
    entries.every(([col, f]) => {
      const val = colValue(item, col);
      if (f.type === 'value') return f.vals.includes(val);
      const hasC1 = !!f.op1;
      const hasC2 = !!f.op2;
      if (!hasC1 && !hasC2) return true;
      const c1 = hasC1 ? matchCondition(val, f.op1, f.val1) : true;
      const c2 = hasC2 ? matchCondition(val, f.op2, f.val2) : true;
      if (!hasC1) return c2;
      if (!hasC2) return c1;
      return f.logic === 'and' ? c1 && c2 : c1 || c2;
    })
  );
}

function applySort(items: IntermediaryListItem[], col: string, dir: string) {
  return [...items].sort((a, b) => {
    const av = String(a[col as keyof IntermediaryListItem] ?? '');
    const bv = String(b[col as keyof IntermediaryListItem] ?? '');
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

function getUniqueColVals(col: string, items: IntermediaryListItem[]): string[] {
  const s = new Set<string>();
  items.forEach(item => { const v = colValue(item, col); if (v) s.add(v); });
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

const EMPTY_COND: CondState = { op1: '', val1: '', logic: 'and', op2: '', val2: '' };

function SearchSmallIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function ColumnsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}

function FilterIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#4b5563'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}

function UploadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></svg>;
}

function ViewIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

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
  pos, activeTab, onTabChange,
  cond, onCondChange,
  allVals, vPending, vSearch, onSetVPending, onSetVSearch,
  onApply, onCancel, onClear,
}: ColFilterDropdownProps) {
  const visible = vSearch.trim()
    ? allVals.filter(v => v.toLowerCase().includes(vSearch.toLowerCase()))
    : allVals;
  const allVis = visible.length > 0 && visible.every(v => vPending.includes(v));

  function toggleAll() {
    if (allVis) onSetVPending(vPending.filter(v => !visible.includes(v)));
    else        onSetVPending([...new Set([...vPending, ...visible])]);
  }
  function toggleOne(v: string) {
    if (vPending.includes(v)) onSetVPending(vPending.filter(x => x !== v));
    else                      onSetVPending([...vPending, v]);
  }

  const safeLeft = Math.min(pos.left, window.innerWidth - 314);
  const noBlankOp = (op: string) => op !== 'is_blank' && op !== 'not_blank';

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={onCancel} />
      <div className="col-filter" style={{ top: pos.top, left: safeLeft }}>
        <div className="col-filter__tabs">
          <span className={`col-filter__tab${activeTab === 'condition' ? ' col-filter__tab--on' : ''}`}
            onClick={() => onTabChange('condition')}>Filter by Condition</span>
          <span className={`col-filter__tab${activeTab === 'value'     ? ' col-filter__tab--on' : ''}`}
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
                <input type="checkbox" className="col-filter__cb" checked={allVis} onChange={toggleAll} />
                <span>Select All</span>
              </label>
              {visible.length === 0
                ? <div className="col-filter__empty">No matches.</div>
                : visible.map(v => (
                    <label key={v} className="col-filter__item">
                      <input type="checkbox" className="col-filter__cb"
                        checked={vPending.includes(v)} onChange={() => toggleOne(v)} />
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

interface ColChooserProps {
  pos: { top: number; left: number };
  visibleCols: Set<string>;
  onToggle: (key: string) => void;
  onClose: () => void;
}

function ColChooser({ pos, visibleCols, onToggle, onClose }: ColChooserProps) {
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
          const key = String(col.key);
          const on  = visibleCols.has(key);
          return (
            <label key={key} className={`col-chooser__item${on ? ' col-chooser__item--on' : ''}`}>
              <input type="checkbox" className="col-chooser__cb" checked={on} onChange={() => onToggle(key)} />
              <span>{col.label}</span>
            </label>
          );
        })}
      </div>
    </>
  );
}

function ListPage({ onAdd, onView }: { onAdd: () => void; onView: (item: IntermediaryListItem) => void }) {
  const [keyword,         setKeyword]        = useState('');
  const [committed,       setCommitted]       = useState('');
  const [showBulkUpload,  setShowBulkUpload]  = useState(false);
  const [sort,      setSort]     = useState<SortState>({ column: 'createdAt', direction: 'desc' });
  const [curPage,   setCurPage]  = useState(1);
  const [pageSize,  setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [toast,     setToast]    = useState<string | null>(null);
  const [userItems, setUserItems] = useState<IntermediaryListItem[]>([]);
  const [apiOnline, setApiOnline] = useState(true);

  useEffect(() => {
    api.intermediaries.list()
      .then(rows => {
        // API is the source of truth when online — clear stale localStorage drafts
        try { localStorage.removeItem('shift_intermediaries'); } catch { /* ignore */ }
        setUserItems((rows as any[]).map((r: any) => ({
          id:                   r.id,
          name:                 r.intermediary_name,
          intermediaryType:     r.type_of_intermediary ?? '',
          federalTaxId:         r.federal_tax_id ?? '',
          primaryContactName:   null,
          primaryContactTitle:  null,
          residentState:        r.residential_state ?? '',
          status:               r.status as any,
          createdAt:            r.created_on ?? new Date().toISOString(),
          updatedAt:            r.updated_on ?? new Date().toISOString(),
        })));
        setApiOnline(true);
      })
      .catch(() => setApiOnline(false));
  }, []);

  const ALL_ITEMS = useMemo(() => {
    const drafts: IntermediaryListItem[] = (() => {
      try {
        const saved = JSON.parse(localStorage.getItem('shift_intermediaries') || '[]');
        return (saved as any[])
          .filter((i: any) => i.status === 'Draft')
          .map((i: any) => ({
            id:                  i.id,
            name:                i.name                ?? 'Unnamed Intermediary',
            intermediaryType:    i.intermediaryType    ?? '',
            federalTaxId:        i.federalTaxId        ?? '',
            primaryContactName:  i.primaryContactName  ?? null,
            primaryContactTitle: i.primaryContactTitle ?? null,
            residentState:       i.residentState       ?? '',
            status:              'Draft' as const,
            createdAt:           i.createdAt           ?? new Date().toISOString(),
            updatedAt:           i.updatedAt           ?? new Date().toISOString(),
          }));
      } catch { return []; }
    })();

    if (apiOnline) {
      const apiIds = new Set(userItems.map(i => i.id));
      return [...userItems, ...drafts.filter(d => !apiIds.has(d.id))];
    }
    const saved = (() => { try { return JSON.parse(localStorage.getItem('shift_intermediaries') || '[]'); } catch { return []; } })();
    const savedIds = new Set(saved.map((i: any) => i.id));
    return [...MOCK_ITEMS.filter(i => !savedIds.has(i.id)), ...saved];
  }, [userItems, apiOnline]);

  const [visibleCols,    setVisibleCols]    = useState<Set<string>>(() => new Set(COLUMNS.map(c => String(c.key))));
  const [showColChooser, setShowColChooser] = useState(false);
  const [chooserPos,     setChooserPos]     = useState<{ top: number; left: number } | null>(null);
  const [filterCol,  setFilterCol]  = useState<string | null>(null);
  const [filterPos,  setFilterPos]  = useState<{ top: number; left: number } | null>(null);
  const [filterTab,  setFilterTab]  = useState<'condition' | 'value'>('value');
  const [cond,       setCond]       = useState<CondState>(EMPTY_COND);
  const [vPending,   setVPending]   = useState<string[]>([]);
  const [vSearch,    setVSearch]    = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, ColFilter>>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const kwFiltered  = useMemo(() => applyKeyword(ALL_ITEMS, committed), [ALL_ITEMS, committed]);
  const allFiltered = useMemo(() => applyFilters(kwFiltered, appliedFilters), [kwFiltered, appliedFilters]);
  const sorted      = useMemo(() => applySort(allFiltered, sort.column, sort.direction), [allFiltered, sort]);
  const result      = useMemo(() => getMockPage(sorted, curPage, pageSize), [sorted, curPage, pageSize]);

  const kpi = useMemo(() => ({
    total:    ALL_ITEMS.length,
    active:   ALL_ITEMS.filter(i => i.status === 'Active').length,
    inactive: ALL_ITEMS.filter(i => i.status === 'Inactive').length,
    draft:    ALL_ITEMS.filter(i => i.status === 'Draft').length,
  }), [ALL_ITEMS]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCommitted(keyword);
      setCurPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  function openColChooser(e: React.MouseEvent<HTMLElement>) {
    e.stopPropagation();
    if (showColChooser) { setShowColChooser(false); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setChooserPos({ top: rect.bottom + 4, left: rect.left });
    setShowColChooser(true);
  }
  function toggleColVisible(key: string) {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
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
      setVPending(getUniqueColVals(col, ALL_ITEMS));
    } else if (applied?.type === 'value') {
      setFilterTab('value');
      setVPending([...applied.vals]);
      setCond(EMPTY_COND);
    } else {
      setFilterTab('value');
      setCond(EMPTY_COND);
      setVPending(getUniqueColVals(col, ALL_ITEMS));
    }
  }

  function closeColFilter() { setFilterCol(null); setFilterPos(null); setVSearch(''); }

  function applyColFilter() {
    if (!filterCol) return;
    const newF = { ...appliedFilters };
    if (filterTab === 'condition') {
      if (!cond.op1 && !cond.op2) { delete newF[filterCol]; }
      else { newF[filterCol] = { type: 'condition', ...cond }; }
    } else {
      const allVals = getUniqueColVals(filterCol, ALL_ITEMS);
      if (vPending.length === 0 || vPending.length >= allVals.length) { delete newF[filterCol]; }
      else { newF[filterCol] = { type: 'value', vals: [...vPending] }; }
    }
    setAppliedFilters(newF);
    closeColFilter();
    setCurPage(1);
  }

  function clearColFilter() {
    if (filterTab === 'condition') setCond(EMPTY_COND);
    else setVPending([]);
  }


  const handleSortChange = useCallback((col: string) => {
    setSort(prev => ({
      column: col,
      direction: prev.column === col && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size); setCurPage(1);
  }, []);

  const startRow    = (curPage - 1) * pageSize + 1;
  const displayCols = COLUMNS.filter(c => visibleCols.has(String(c.key)));

  function renderCell(item: IntermediaryListItem, key: string): React.ReactNode {
    switch (key) {
      case 'id':                  return padId(item.id);
      case 'name':                return (
        <button className="link-btn" onClick={() => onView(item)}>{item.name}</button>
      );
      case 'primaryContactName':  return item.primaryContactName
        ? <button className="link-btn" onClick={() => showToast(`Contact: ${item.primaryContactName}`)}>{item.primaryContactName}</button>
        : '—';
      case 'residentState':       return item.residentState;
      case 'status':              return <span className={STATUS_CLS[item.status] ?? 'badge badge--draft'}>&bull; {item.status}</span>;
      case 'primaryContactTitle': return item.primaryContactTitle ?? '—';
      case 'intermediaryType':    return item.intermediaryType;
      default:                    return null;
    }
  }


  const pageSelectedIds = result.items.map(item => item.id);
  const allPageSelected = pageSelectedIds.length > 0 && pageSelectedIds.every(id => selectedIds.includes(id));
  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelectedIds(prev => allPageSelected
      ? prev.filter(id => !pageSelectedIds.includes(id))
      : [...new Set([...prev, ...pageSelectedIds])]);

  return (
    <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, minHeight: 'calc(100vh - 88px)', boxShadow: '0 1px 3px rgba(15,23,42,0.10)' }}>
      {toast && <div className="toast" role="alert">{toast}</div>}

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Distribution Management</h1>
      </div>

      <StatCards total={kpi.total} activeCount={kpi.active} inactiveCount={kpi.inactive} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ position: 'relative', width: 290 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none', lineHeight: 1 }}>
            <SearchSmallIcon />
          </span>
          <input
            type="text"
            placeholder="Search by Keyword"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ paddingLeft: 36, fontSize: 13, width: 290, height: 34, borderRadius: 3, borderColor: '#aeb7c2' }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }} onClick={() => setShowBulkUpload(true)}>
          <UploadIcon />
          Bulk Upload
        </button>
        {PERMISSIONS.canCreate && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 16px', whiteSpace: 'nowrap' }} onClick={onAdd}>
            + Add Intermediary
          </button>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 0 }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                <th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                  <button
                    type="button"
                    onClick={openColChooser}
                    title="Modify Columns"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', fontSize: 16, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  >
                    <ColumnsIcon />
                  </button>
                </th>
                <th style={{ width: 38, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <input type="checkbox" checked={allPageSelected} onChange={toggleAll} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
                </th>
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151' }}>
                  Action
                </th>
                {displayCols.map(col => {
                  const key = String(col.key);
                  const activeFilter = !!appliedFilters[key];
                  return (
                    <th
                      key={key}
                      style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                      onClick={col.sortable ? () => handleSortChange(key) : undefined}
                      aria-sort={col.sortable && sort.column === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                        {col.label}
                        {col.sortable && sort.column === key && (
                          <span style={{ marginLeft: 4, fontSize: 10, color: '#0B5AA0' }}>{sort.direction === 'asc' ? '^' : 'v'}</span>
                        )}
                        {col.filterable && (
                          <span
                            onClick={e => openColFilter(e, key)}
                            style={{ marginLeft: 4, cursor: 'pointer', color: activeFilter ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', alignItems: 'center' }}
                            title="Filter"
                          >
                            <FilterIcon active={activeFilter} />
                          </span>
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={3 + displayCols.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                    No intermediaries found.
                  </td>
                </tr>
              ) : result.items.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{ borderBottom: '1px solid #f3f4f6', background: selectedIds.includes(item.id) ? '#eff6ff' : idx % 2 === 1 ? '#fafafa' : '#fff' }}
                >
                  <td style={{ padding: '10px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderRight: '1px solid #f3f4f6' }}>
                    {startRow + idx}
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                    <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelect(item.id)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                    <button onClick={() => onView(item)} title="View" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
                      <ViewIcon />
                    </button>
                  </td>
                  {displayCols.map(col => {
                    const key = String(col.key);
                    return (
                      <td key={key} style={{ padding: '10px 12px', borderRight: '1px solid #f3f4f6', color: '#374151' }}>
                        {renderCell(item, key)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={curPage}
          pageSize={pageSize}
          total={result.totalCount}
          onPageChange={setCurPage}
          onPageSizeChange={handlePageSizeChange}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
        />
      </div>
      {filterCol && filterPos && (
        <ColFilterDropdown
          pos={filterPos}
          activeTab={filterTab}
          onTabChange={setFilterTab}
          cond={cond}
          onCondChange={updates => setCond(prev => ({ ...prev, ...updates }))}
          allVals={getUniqueColVals(filterCol, ALL_ITEMS)}
          vPending={vPending}
          vSearch={vSearch}
          onSetVPending={setVPending}
          onSetVSearch={setVSearch}
          onApply={applyColFilter}
          onCancel={closeColFilter}
          onClear={clearColFilter}
        />
      )}

      {showColChooser && chooserPos && (
        <ColChooser
          pos={chooserPos}
          visibleCols={visibleCols}
          onToggle={toggleColVisible}
          onClose={() => setShowColChooser(false)}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal onClose={() => setShowBulkUpload(false)} />
      )}
    </div>
  );
}

type NavState = 'list' | 'add' | 'rights' | 'products' | 'producers' | 'review' | 'view';

const DRAFT_NAV: Record<number, NavState> = { 1: 'add', 2: 'rights', 3: 'products', 4: 'producers', 5: 'review' };

export default function DistributionManagementModule() {
  const location = useLocation();
  const [nav,        setNav]        = useState<NavState>('list');
  const [viewRecord, setViewRecord] = useState<IntermediaryRecord | null>(null);

  // Reset to list whenever the sidebar DM icon is clicked (each navigate() call
  // produces a new location.key, even when the pathname stays at /distribution)
  useEffect(() => {
    setNav('list');
    setViewRecord(null);
  }, [location.key]);

  function getFullRecord(item: IntermediaryListItem): IntermediaryRecord {
    if (item.status !== 'Draft') return { ...item };
    try {
      const saved: any[] = JSON.parse(localStorage.getItem('shift_intermediaries') || '[]');
      const d = saved.find((x: any) => x.id === item.id);
      if (d) return { ...item, draftStep: d.draftStep, step1: d.step1, step2: d.step2, step3: d.step3, step4: d.step4 };
    } catch {}
    return { ...item };
  }

  function handleViewItem(item: IntermediaryListItem) {
    const record = getFullRecord(item);
    ['shift_step1','shift_step2','shift_step3','shift_step4'].forEach(k => sessionStorage.removeItem(k));
    if (item.status === 'Draft') {
      try {
        const existing: any[] = JSON.parse(localStorage.getItem('shift_intermediaries') || '[]');
        if (!existing.find((i: any) => i.id === item.id)) {
          localStorage.setItem('shift_intermediaries', JSON.stringify([...existing, record]));
        }
      } catch { }
      setCurrentDraftId(item.id);
      if (record.step1) sessionStorage.setItem('shift_step1', JSON.stringify(record.step1));
      if (record.step2) sessionStorage.setItem('shift_step2', JSON.stringify(record.step2));
      if (record.step3) sessionStorage.setItem('shift_step3', JSON.stringify(record.step3));
      if (record.step4) sessionStorage.setItem('shift_step4', JSON.stringify(record.step4));
      setNav(DRAFT_NAV[record.draftStep ?? 1] ?? 'add');
    } else {
      setViewRecord(record);
      setNav('view');
    }
  }

  function handleEditStep(step: 1 | 2 | 3 | 4) {
    if (!viewRecord) return;
    ['shift_step1','shift_step2','shift_step3','shift_step4'].forEach(k => sessionStorage.removeItem(k));
    sessionStorage.setItem('shift_edit_id', String(viewRecord.id));
    if (viewRecord.step1) sessionStorage.setItem('shift_step1', JSON.stringify(viewRecord.step1));
    if (viewRecord.step2) sessionStorage.setItem('shift_step2', JSON.stringify(viewRecord.step2));
    if (viewRecord.step3) sessionStorage.setItem('shift_step3', JSON.stringify(viewRecord.step3));
    if (viewRecord.step4) sessionStorage.setItem('shift_step4', JSON.stringify(viewRecord.step4));
    setNav(DRAFT_NAV[step]);
  }

  if (nav === 'add') return (
    <AddIntermediaryPage
      onBack={() => setNav('list')}
      onNext={() => {
        try {
          const s1 = sessionStorage.getItem('shift_step1');
          if (s1) {
            const { form: f, contacts: c } = JSON.parse(s1);
            upsertDraftStep(1, 'step1', JSON.parse(s1), {
              name:                f?.name                 || 'Unnamed Intermediary',
              intermediaryType:    f?.intermediaryType      || '',
              federalTaxId:        f?.federalTaxId          || '',
              primaryContactName:  c?.[0]?.name             ?? null,
              primaryContactTitle: c?.[0]?.title            ?? null,
              residentState:       f?.residentState          || '',
            });
          }
        } catch { }
        setNav('rights');
      }}
    />
  );
  if (nav === 'rights') return (
    <AssignRightsPage
      onBack={() => setNav('add')}
      onNext={() => {
        try {
          const s2 = sessionStorage.getItem('shift_step2');
          if (s2) upsertDraftStep(2, 'step2', JSON.parse(s2));
        } catch { }
        setNav('products');
      }}
    />
  );
  if (nav === 'products') return (
    <AssignProductsPage
      onBack={() => setNav('rights')}
      onNext={() => {
        try {
          const s3 = sessionStorage.getItem('shift_step3');
          if (s3) upsertDraftStep(3, 'step3', JSON.parse(s3));
        } catch { }
        setNav('producers');
      }}
    />
  );
  if (nav === 'producers') return (
    <AddProducersPage
      onBack={() => setNav('products')}
      onNext={() => {
        try {
          const s4 = sessionStorage.getItem('shift_step4');
          if (s4) upsertDraftStep(4, 'step4', JSON.parse(s4));
        } catch { }
        setNav('review');
      }}
    />
  );
  if (nav === 'review') return (
    <ReviewSubmitPage
      onBack={()             => setNav('producers')}
      onEditIntermediary={() => setNav('add')}
      onEditRights={()       => setNav('rights')}
      onEditProducts={()     => setNav('products')}
      onEditProducers={()    => setNav('producers')}
      onSubmit={() => setNav('list')}
    />
  );
  if (nav === 'view' && viewRecord) return (
    <ViewIntermediaryPage
      record={viewRecord}
      onBack={() => setNav('list')}
      onEditStep={handleEditStep}
    />
  );
  return <ListPage onAdd={() => {
    ['shift_step1','shift_step2','shift_step3','shift_step4'].forEach(k => sessionStorage.removeItem(k));
    sessionStorage.removeItem('shift_edit_id');
    clearCurrentDraftId();
    setNav('add');
  }} onView={handleViewItem} />;
}





