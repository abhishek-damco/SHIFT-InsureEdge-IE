import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import type { UserListItem } from '../../types/User';
import StatCards from '../../components/StatCards/StatCards';
import PaginationBar from '../../components/PaginationBar';

const PAGE_SIZE = 10;
type SortDir = 'asc' | 'desc';
type ColKey = 'userName' | 'userId' | 'groups' | 'contact' | 'email' | 'office' | 'address' | 'status';

interface ColDef { key: ColKey; label: string; locked?: boolean; width?: number; sortable?: boolean; }

const ALL_COLS: ColDef[] = [
  { key: 'userName', label: 'User Name',       locked: true,  width: 180, sortable: true },
  { key: 'userId',   label: 'User ID',          locked: false, width: 100, sortable: true },
  { key: 'groups',   label: 'Group(s)',          locked: false, width: 160 },
  { key: 'contact',  label: 'Contact Number',    locked: false, width: 130 },
  { key: 'email',    label: 'Email Id',          locked: false, width: 200 },
  { key: 'office',   label: 'Office Location',   locked: false, width: 160 },
  { key: 'address',  label: 'Address',           locked: false },
  { key: 'status',   label: 'Status',            locked: true,  width: 110, sortable: true },
];

type ColFilterState = Partial<Record<ColKey, string[]>>;
type CondFilter = Partial<Record<ColKey, { op: string; value: string }>>;

const CONDITION_OPS = ['Contains', 'Does not contain', 'Equals', 'Starts with', 'Ends with'];

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

function getCellValue(u: UserListItem, key: ColKey): string {
  switch (key) {
    case 'userName': return [u.firstName, u.lastName].filter(Boolean).join(' ') || '';
    case 'userId':   return u.userCode ?? '';
    case 'groups':   return u.groups.map(g => g.groupName).join(', ');
    case 'contact':  return [u.telephoneNumberCc, u.telephoneNumber].filter(Boolean).join(' ');
    case 'email':    return u.email ?? '';
    case 'office':   return u.officeLocation ?? '';
    case 'address':  return [u.addressLine1, u.city].filter(Boolean).join(', ');
    case 'status':   return u.status ?? '';
    default:         return '';
  }
}

function SearchSmallIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
function ColumnsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}
function FilterIcon({ active }: { active: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function UploadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></svg>;
}

// ─── Column Filter Popup ──────────────────────────────────────────────────────
function ColumnFilterPopup({
  col, allRows, valueFilter, condFilter,
  onApplyValue, onApplyCondition, onClear, onClose, anchorRect,
}: {
  col: ColDef;
  allRows: UserListItem[];
  valueFilter: string[];
  condFilter: { op: string; value: string } | undefined;
  onApplyValue: (vals: string[]) => void;
  onApplyCondition: (f: { op: string; value: string } | undefined) => void;
  onClear: () => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const [tab, setTab] = useState<'value' | 'condition'>('value');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(valueFilter);
  const [condOp, setCondOp] = useState(condFilter?.op ?? 'Contains');
  const [condVal, setCondVal] = useState(condFilter?.value ?? '');
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);

  const uniqueVals = Array.from(new Set(
    allRows.map(r => getCellValue(r, col.key)).filter(Boolean)
  )).sort();

  const visibleVals = uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visibleVals.length > 0 && visibleVals.every(v => selected.includes(v));

  const toggleVal = (v: string) =>
    setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleAll = () =>
    setSelected(allChecked ? selected.filter(x => !visibleVals.includes(x)) : [...new Set([...selected, ...visibleVals])]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
        zIndex: 9999,
        background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 340,
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Column name header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 13, color: '#111827' }}>
        {col.label}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13,
            fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#0B5AA0' : '#6b7280',
            borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent',
            cursor: 'pointer',
          }}>
            {t === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>

      {tab === 'value' ? (
        <>
          {/* Search within values */}
          <div style={{ padding: '10px 14px 6px' }}>
            <input
              autoFocus
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, padding: '7px 10px', width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* Value list */}
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: allChecked ? '#eff6ff' : 'transparent',
            }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll}
                style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
              Select All
            </label>
            {visibleVals.map(v => (
              <label key={v} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                background: selected.includes(v) ? '#eff6ff' : 'transparent',
              }}>
                <input type="checkbox" checked={selected.includes(v)} onChange={() => toggleVal(v)}
                  style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
                {v}
              </label>
            ))}
            {visibleVals.length === 0 && (
              <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No values found</div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '8px 0', fontSize: 13 }}
              onClick={() => { onApplyValue(selected); onClose(); }}>Apply</button>
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => { onClose(); }}>Cancel</button>
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => { setSelected([]); onClear(); onClose(); }}>Clear</button>
          </div>
        </>
      ) : (
        /* Condition tab */
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={condOp} onChange={e => setCondOp(e.target.value)}
            style={{ fontSize: 13, width: '100%' }}>
            {CONDITION_OPS.map(op => <option key={op}>{op}</option>)}
          </select>
          <input
            autoFocus
            placeholder="Value..."
            value={condVal}
            onChange={e => setCondVal(e.target.value)}
            style={{ fontSize: 13, width: '100%' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: 13, padding: '8px 0' }}
              onClick={() => { onApplyCondition(condVal ? { op: condOp, value: condVal } : undefined); onClose(); }}>
              Apply
            </button>
            <button className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }}
              onClick={() => { setCondVal(''); onApplyCondition(undefined); onClose(); }}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modify Columns Panel ──────────────────────────────────────────────────────
function ModifyColumnsPanel({
  visibleCols, onToggle, onClose, anchorRect,
}: {
  visibleCols: Set<ColKey>;
  onToggle: (key: ColKey) => void;
  onClose: () => void;
  anchorRect: DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: anchorRect.bottom + 4,
      left: anchorRect.left,
      zIndex: 9999,
      background: '#fff', border: '1px solid #d1d5db', borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 280,
    }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14, color: '#111827' }}>
        Modify Columns Display
      </div>
      <div style={{ padding: '8px 0' }}>
        {ALL_COLS.map(col => {
          const checked = visibleCols.has(col.key);
          return (
            <label key={col.key} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', cursor: col.locked ? 'default' : 'pointer',
              background: checked ? '#eff6ff' : 'transparent',
              opacity: col.locked ? 0.7 : 1,
            }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={col.locked}
                onChange={() => !col.locked && onToggle(col.key)}
                style={{ width: 15, height: 15, accentColor: '#0B5AA0' }}
              />
              <span style={{ fontSize: 13, color: '#374151' }}>{col.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [allItems, setAllItems] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [kpi, setKpi] = useState({ totalUsers: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('first_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [loading, setLoading] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(ALL_COLS.map(c => c.key))
  );
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const modifyColsRef = useRef<HTMLButtonElement>(null);

  // Column filters
  const [valueFilters, setValueFilters] = useState<ColFilterState>({});
  const [condFilters, setCondFilters] = useState<CondFilter>({});
  const [openFilterCol, setOpenFilterCol] = useState<ColKey | null>(null);
  const [filterAnchorRects, setFilterAnchorRects] = useState<Partial<Record<ColKey, DOMRect>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ search, page, pageSize, sortBy, sortDir });
      setAllItems(res.items);
      setTotal(res.total);
      setKpi({ totalUsers: Number(res.totalUsers), active: Number(res.active), inactive: Number(res.inactive) });
    } finally { setLoading(false); }
  }, [search, page, pageSize, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  }

  const toggleCol = (key: ColKey) =>
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Client-side filtering (applied on top of server search/sort)
  const filtered = allItems.filter(u => {
    for (const col of ALL_COLS) {
      const valF = valueFilters[col.key];
      const condF = condFilters[col.key];
      const cell = getCellValue(u, col.key).toLowerCase();

      if (valF && valF.length > 0) {
        if (!valF.some(v => v.toLowerCase() === cell)) return false;
      }
      if (condF && condF.value) {
        const target = condF.value.toLowerCase();
        switch (condF.op) {
          case 'Contains':         if (!cell.includes(target)) return false; break;
          case 'Does not contain': if (cell.includes(target)) return false; break;
          case 'Equals':           if (cell !== target) return false; break;
          case 'Starts with':      if (!cell.startsWith(target)) return false; break;
          case 'Ends with':        if (!cell.endsWith(target)) return false; break;
        }
      }
    }
    return true;
  });

  const hasFilter = (key: ColKey) =>
    !!((valueFilters[key] && valueFilters[key]!.length > 0) ||
    (condFilters[key] && !!condFilters[key]!.value));

  const renderedCols = ALL_COLS.filter(c => visibleCols.has(c.key));

  const SortCaret = ({ col }: { col: string }) => {
    if (sortBy !== col) return null;
    return <span style={{ marginLeft: 4, fontSize: 10, color: '#0B5AA0' }}>{sortDir === 'asc' ? '^' : 'v'}</span>;
  };

  return (
    <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, minHeight: 'calc(100vh - 88px)', boxShadow: '0 1px 3px rgba(15,23,42,0.10)' }}>
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>User Management</h1>
      </div>

      {/* Stat cards */}
      <StatCards total={kpi.totalUsers} activeCount={kpi.active} inactiveCount={kpi.inactive} />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ position: 'relative', width: 290 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', lineHeight: 1 }}>
            <SearchSmallIcon />
          </span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by Keyword"
            style={{ paddingLeft: 36, fontSize: 13, width: 290, height: 34, borderRadius: 3, borderColor: '#aeb7c2' }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}>
          <UploadIcon />
          Import Users
        </button>

        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 16px', whiteSpace: 'nowrap' }}
          onClick={() => navigate('/users/new')}>
          + Add User
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                {/* Modify columns icon */}
                <th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                  <button
                    ref={modifyColsRef}
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setModifyColsRect(rect);
                      setShowModifyCols(o => !o);
                    }}
                    title="Modify Columns"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  >
                    <ColumnsIcon />
                  </button>
                  {showModifyCols && modifyColsRect && (
                    <ModifyColumnsPanel
                      visibleCols={visibleCols}
                      onToggle={toggleCol}
                      onClose={() => setShowModifyCols(false)}
                      anchorRect={modifyColsRect}
                    />
                  )}
                </th>

                {/* Action */}
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151' }}>
                  Action
                </th>

                {/* Dynamic columns */}
                {renderedCols.map(col => (
                  <th
                    key={col.key}
                    style={{
                      padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                      fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap',
                      width: col.width, cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      if (col.key === 'userName') handleSort('first_name');
                      else if (col.key === 'userId') handleSort('user_code');
                      else if (col.key === 'status') handleSort('status');
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      {col.label}
                      {col.sortable && <SortCaret col={col.key === 'userName' ? 'first_name' : col.key === 'userId' ? 'user_code' : 'status'} />}
                      {/* Filter icon */}
                      <span
                        onClick={e => {
                          e.stopPropagation();
                          if (openFilterCol === col.key) {
                            setOpenFilterCol(null);
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setFilterAnchorRects(p => ({ ...p, [col.key]: rect }));
                            setOpenFilterCol(col.key);
                          }
                        }}
                        style={{
                          marginLeft: 4, cursor: 'pointer',
                          color: hasFilter(col.key) ? '#0B5AA0' : '#9ca3af',
                          display: 'inline-flex', alignItems: 'center',
                        }}
                        title="Filter"
                      >
                        <FilterIcon active={hasFilter(col.key)} />
                      </span>
                    </span>
                    {/* Filter popup — fixed positioning so it escapes table overflow */}
                    {openFilterCol === col.key && filterAnchorRects[col.key] && (
                      <ColumnFilterPopup
                        col={col}
                        allRows={allItems}
                        valueFilter={valueFilters[col.key] ?? []}
                        condFilter={condFilters[col.key]}
                        onApplyValue={vals => setValueFilters(p => ({ ...p, [col.key]: vals }))}
                        onApplyCondition={f => setCondFilters(p => ({ ...p, [col.key]: f }))}
                        onClear={() => {
                          setValueFilters(p => { const n = { ...p }; delete n[col.key]; return n; });
                          setCondFilters(p => { const n = { ...p }; delete n[col.key]; return n; });
                        }}
                        onClose={() => setOpenFilterCol(null)}
                        anchorRect={filterAnchorRects[col.key]!}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2 + renderedCols.length} style={{ padding: 48, textAlign: 'center' }}>
                  <span className="spinner" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={2 + renderedCols.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                  No users found.
                </td></tr>
              ) : filtered.map((u, idx) => {
                const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—';
                const phone = [u.telephoneNumberCc, u.telephoneNumber].filter(Boolean).join(' ') || '—';
                const groupStr = u.groups.map(g => g.groupName).join(', ') || '—';
                const addr = [u.addressLine1, u.city].filter(Boolean).join(', ') || '—';
                const isActive = (u.status || '').toLowerCase() !== 'inactive';
                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: idx % 2 === 1 ? '#fafafa' : '#fff',
                    }}
                  >
                    {/* Row # in first column */}
                    <td style={{ padding: '10px 8px', textAlign: 'center', color: '#0B5AA0', fontSize: 12, fontWeight: 600, borderRight: '1px solid #f3f4f6' }}>
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    {/* Action */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                      <button
                        onClick={() => navigate(`/users/${u.id}/view`)}
                        title="View"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                      >
                        <EyeIcon />
                      </button>
                    </td>
                    {/* Dynamic cells */}
                    {renderedCols.map(col => (
                      <td key={col.key} style={{ padding: '10px 12px', borderRight: '1px solid #f3f4f6', maxWidth: col.key === 'address' ? 200 : undefined }}>
                        {col.key === 'userName' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 24, height: 24, borderRadius: '50%', background: '#dbeafe',
                              color: '#1d4ed8', fontSize: 10, fontWeight: 700, flexShrink: 0,
                            }}>
                              {fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                            </span>
                            <button
                              onClick={() => navigate(`/users/${u.id}/view`)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0B5AA0', fontWeight: 500, fontSize: 13, textAlign: 'left' }}
                            >
                              {fullName}
                            </button>
                          </span>
                        ) : col.key === 'userId' ? (
                          <span style={{ color: '#374151', fontWeight: 600 }}>{u.userCode ?? '—'}</span>
                        ) : col.key === 'groups' ? (
                          <span style={{ color: '#374151', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{groupStr}</span>
                        ) : col.key === 'contact' ? (
                          <span style={{ color: '#374151', whiteSpace: 'nowrap' }}>{phone}</span>
                        ) : col.key === 'email' ? (
                          <span style={{ color: '#374151', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{u.email ?? '—'}</span>
                        ) : col.key === 'office' ? (
                          <span style={{ color: '#374151' }}>{u.officeLocation ?? '—'}</span>
                        ) : col.key === 'address' ? (
                          <span style={{ color: '#6b7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{addr}</span>
                        ) : col.key === 'status' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            minWidth: 80, height: 24, padding: '0 12px', borderRadius: 999,
                            border: `1px solid ${isActive ? '#008c55' : '#d82929'}`,
                            background: isActive ? '#d7f7e4' : '#ffe9e9',
                            color: isActive ? '#006b3c' : '#b91c1c',
                            fontSize: 12, fontWeight: 700,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#008c55' : '#d82929' }} />
                            {u.status || 'Active'}
                          </span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        />
      </div>
    </div>
  );
}
