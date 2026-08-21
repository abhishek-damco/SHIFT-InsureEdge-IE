import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';
import type { ClaimAuthorityUserSelectionDto } from '../types/Claim';

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRow = ClaimAuthorityUserSelectionDto;
type ColKey = keyof Omit<UserRow, 'id' | 'initials'>;

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: { key: ColKey; label: string; filterable: boolean }[] = [
  { key: 'userCode',    label: 'User ID',     filterable: true },
  { key: 'fullName',    label: 'User Name',   filterable: true },
  { key: 'department',  label: 'Department',  filterable: true },
  { key: 'designation', label: 'Designation', filterable: true },
  { key: 'status',      label: 'Status',      filterable: true },
];

const SEARCH_OPTIONS = [
  { value: 'UserId',     label: 'User ID' },
  { value: 'UserName',   label: 'User Name' },
  { value: 'Department', label: 'Department' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCellStr(row: UserRow, key: ColKey): string {
  return String(row[key as keyof UserRow] ?? '');
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FilterArrow({ active }: { active?: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill={active ? '#0B5AA0' : '#9ca3af'}>
      <path d="M1.5 2.5h8L5.5 8.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

// ─── Filter Popup ─────────────────────────────────────────────────────────────

function FilterPopup({ anchorRect, allValues, applied, onApply, onCancel, onClear }: {
  anchorRect: DOMRect;
  allValues: string[];
  applied: string[] | undefined;
  onApply: (values: string[]) => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  const [tab, setTab] = useState<'condition' | 'value'>('value');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>(applied ?? allValues);

  const visible = allValues.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visible.length > 0 && visible.every(v => selected.includes(v));

  function toggleAll() {
    if (allChecked) setSelected(s => s.filter(v => !visible.includes(v)));
    else setSelected(s => [...new Set([...s, ...visible])]);
  }

  function toggle(v: string) {
    setSelected(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);
  }

  const left = Math.min(anchorRect.left, window.innerWidth - 272);
  const top = anchorRect.bottom + 4;

  return (
    <div
      style={{ position: 'fixed', top, left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', width: 262 }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(t => (
          <button
            key={t}
            style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: tab === t ? 700 : 400, background: 'none', border: 'none', cursor: 'pointer', color: tab === t ? '#0B5AA0' : '#6b7280', borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent' }}
            onClick={() => setTab(t)}
          >
            {t === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>

      {tab === 'value' ? (
        <>
          <div style={{ padding: '10px 10px 6px' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search"
              style={{ width: '100%', padding: '6px 10px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 4, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ padding: '0 6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 4, cursor: 'pointer', background: '#e8f0fa', marginBottom: 2, fontSize: 13, fontWeight: 500 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
              Select All
            </label>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {visible.map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 4, cursor: 'pointer', background: selected.includes(v) ? '#e8f0fa' : 'transparent', fontSize: 13, marginBottom: 1 }}>
                  <input type="checkbox" checked={selected.includes(v)} onChange={() => toggle(v)} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
                  {v}
                </label>
              ))}
              {visible.length === 0 && <div style={{ padding: '10px 8px', color: '#9ca3af', fontSize: 12 }}>No values found</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '10px', borderTop: '1px solid #e5e7eb', marginTop: 6 }}>
            <button onClick={() => onApply(selected)} style={{ flex: 1, padding: '7px 0', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
            <button onClick={onCancel} style={{ flex: 1, padding: '7px 0', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onClear} style={{ flex: 1, padding: '7px 0', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Clear</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 16, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>Condition filters coming soon.</div>
      )}
    </div>
  );
}

// ─── Column Panel ─────────────────────────────────────────────────────────────

function ColumnPanel({ anchorRect, visibleCols, onToggle, onClose }: {
  anchorRect: DOMRect;
  visibleCols: Set<string>;
  onToggle: (key: string, on: boolean) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 4px 18px rgba(0,0,0,0.15)', width: 310, padding: '10px 0' }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', padding: '4px 16px 10px', borderBottom: '1px solid #e5e7eb', marginBottom: 4 }}>Modify Columns Display</div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', opacity: 0.5, cursor: 'default' }}>
        <input type="checkbox" checked readOnly style={{ accentColor: '#0B5AA0', width: 15, height: 15, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>Action</span>
      </label>
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {ALL_COLS.map(col => (
          <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', cursor: 'pointer', background: visibleCols.has(col.key) ? '#ddeeff' : 'transparent' }}>
            <input type="checkbox" checked={visibleCols.has(col.key)} onChange={e => onToggle(col.key, e.target.checked)} style={{ accentColor: '#0B5AA0', width: 15, height: 15, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#374151', whiteSpace: 'nowrap' }}>{col.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClaimsAuthorityAddUserPage() {
  const navigate = useNavigate();

  // Search bar state
  const [searchParam, setSearchParam] = useState('UserId');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedParam, setAppliedParam] = useState('UserId');

  // Table state
  const [selectedId] = useState<number | null>(null);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(ALL_COLS.map(c => c.key)));
  const [showColPanel, setShowColPanel] = useState(false);
  const [colPanelRect, setColPanelRect] = useState<DOMRect | null>(null);
  const [activeFilter, setActiveFilter] = useState<ColKey | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Fetch data — re-fetches when applied search changes
  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['claims-authority-users', appliedKeyword, appliedParam],
    queryFn: () => claimsApi.getAvailableUsersForAuthority(
      appliedKeyword || undefined,
      appliedKeyword ? appliedParam : undefined
    ),
  });

  // Unique values per column for filter popup
  const colValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    ALL_COLS.forEach(col => {
      map[col.key] = [...new Set(allData.map(r => getCellStr(r, col.key)))].sort();
    });
    return map;
  }, [allData]);

  // Apply column filters + sort
  const rows = useMemo(() => {
    let r = allData;
    Object.entries(columnFilters).forEach(([key, vals]) => {
      if (vals.length > 0 && vals.length < (colValues[key]?.length ?? 0)) {
        r = r.filter(row => vals.includes(getCellStr(row, key as ColKey)));
      }
    });
    if (sortKey) {
      const k = sortKey;
      r = [...r].sort((a, b) => {
        const va = getCellStr(a, k);
        const vb = getCellStr(b, k);
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return r;
  }, [allData, columnFilters, colValues, sortKey, sortAsc]);

  const visibleColDefs = ALL_COLS.filter(c => visibleCols.has(c.key));

  function handleSort(key: ColKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function applyFilter(key: ColKey, values: string[]) {
    setColumnFilters(prev => ({ ...prev, [key]: values }));
    setActiveFilter(null);
  }

  function clearFilter(key: ColKey) {
    setColumnFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
    setActiveFilter(null);
  }

  function handleSearch() {
    setAppliedKeyword(searchKeyword);
    setAppliedParam(searchParam);
  }

  const TH: React.CSSProperties = {
    padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
    textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: '#374151',
    background: '#fff',
  };
  const TD: React.CSSProperties = {
    padding: '10px 12px', borderRight: '1px solid #edf1f5', fontSize: 13, color: '#111827',
  };

  return (
    <div
      style={{ padding: '16px 18px 80px', background: '#fff', minHeight: '100%' }}
      onClick={() => { setActiveFilter(null); setShowColPanel(false); }}
    >
      {/* Breadcrumb + Title */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Claims / Claims Authority / Add User</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Claim Authority</h1>
      </div>

      {/* Search & Select header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Search &amp; Select The User</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {/* Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={searchParam}
              onChange={e => setSearchParam(e.target.value)}
              style={{
                height: 38, paddingLeft: 12, paddingRight: 28, fontSize: 13, color: '#374151',
                border: '1px solid #d1d5db', borderRight: 'none',
                borderRadius: '4px 0 0 4px', background: '#fff', cursor: 'pointer',
                appearance: 'none', outline: 'none',
              }}
            >
              {SEARCH_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="#6b7280" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <path d="M1 3h8L5 7z" />
            </svg>
          </div>
          {/* Search input */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SearchIcon />
            </div>
            <input
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder=""
              style={{
                width: '100%', height: 38, paddingLeft: 34, paddingRight: 12, fontSize: 13,
                border: '1px solid #d1d5db', borderRadius: '0 4px 4px 0',
                outline: 'none', boxSizing: 'border-box', color: '#374151',
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                {/* ≡ hamburger — column panel trigger; data rows show serial number */}
                <th
                  style={{ ...TH, width: 46, textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
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
                <th style={{ ...TH, width: 80 }}>Action</th>
                {/* Data columns */}
                {visibleColDefs.map(col => (
                  <th
                    key={col.key}
                    style={{ ...TH, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort(col.key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {col.label}
                      {/* Sort indicator */}
                      {sortKey === col.key && (
                        <span style={{ fontSize: 10, color: '#0B5AA0' }}>{sortAsc ? '▲' : '▼'}</span>
                      )}
                      {/* Filter arrow — stops propagation so column sort doesn't fire */}
                      {col.filterable && (
                        <span
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          onClick={e => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            if (activeFilter === col.key) {
                              setActiveFilter(null);
                            } else {
                              setFilterAnchorRect(rect);
                              setActiveFilter(col.key);
                            }
                          }}
                        >
                          <FilterArrow active={!!columnFilters[col.key] && columnFilters[col.key].length < (colValues[col.key]?.length ?? 0)} />
                        </span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={visibleColDefs.length + 2} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Loading...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColDefs.length + 2} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No records found.</td>
                </tr>
              ) : rows.map((row, idx) => {
                const isSelected = selectedId === row.id;
                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: '1px solid #edf1f5', background: isSelected ? '#eef6ff' : 'transparent', cursor: 'pointer' }}
                    onClick={() => navigate('/claims/authority/create', { state: { user: row } })}
                  >
                    {/* Serial number in ≡ column */}
                    <td style={{ ...TD, textAlign: 'center', color: '#64748b', width: 46 }}>{idx + 1}</td>
                    {/* Radio button */}
                    <td style={{ ...TD }}>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={e => { e.stopPropagation(); navigate('/claims/authority/create', { state: { user: row } }); }}
                        style={{ width: 16, height: 16, accentColor: '#0B5AA0', cursor: 'pointer' }}
                      />
                    </td>
                    {visibleColDefs.map(col => (
                      <td key={col.key} style={{ ...TD }}>
                        {col.key === 'fullName' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 26, height: 26, borderRadius: '50%',
                              background: idx % 2 === 0 ? '#0B5AA0' : '#009765',
                              color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
                            }}>
                              {row.initials}
                            </span>
                            {row.fullName}
                          </span>
                        ) : col.key === 'status' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: row.status === 'Active' ? '#d7f7e4' : '#fde8e8',
                            color: row.status === 'Active' ? '#006b3c' : '#c62828',
                            border: `1px solid ${row.status === 'Active' ? '#008c55' : '#f87171'}`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.status === 'Active' ? '#009765' : '#c62828' }} />
                            {row.status}
                          </span>
                        ) : (
                          getCellStr(row, col.key)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
      {activeFilter && filterAnchorRect && (
        <FilterPopup
          anchorRect={filterAnchorRect}
          allValues={colValues[activeFilter] ?? []}
          applied={columnFilters[activeFilter]}
          onApply={vals => applyFilter(activeFilter, vals)}
          onCancel={() => setActiveFilter(null)}
          onClear={() => clearFilter(activeFilter)}
        />
      )}

      {/* Footer actions */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'flex-end', gap: 10,
        padding: '12px 24px',
      }}>
        <button
          onClick={() => navigate('/claims/authority')}
          style={{ padding: '8px 24px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 5, fontSize: 13, cursor: 'pointer' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
