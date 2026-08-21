import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';
import type { ClaimAuthorityDto } from '../types/Claim';

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthorityRow = ClaimAuthorityDto;
type ColKey = keyof Omit<AuthorityRow, 'id' | 'userInitials'>;

// ─── Column definitions ───────────────────────────────────────────────────────

const ALL_COLS: { key: ColKey; label: string }[] = [
  { key: 'userId',                label: 'User ID' },
  { key: 'userName',              label: 'User Name' },
  { key: 'department',            label: 'Department' },
  { key: 'designation',           label: 'Designation' },
  { key: 'approvedLob',           label: 'Approved LOB' },
  { key: 'currency',              label: 'Currency' },
  { key: 'reserveLimit',          label: 'Reserve Limit' },
  { key: 'indemnityPaymentLimit', label: 'Indemnity Payment Limit' },
  { key: 'feePaymentLimit',       label: 'Fee Payment Limit' },
  { key: 'exGratiaPaymentLimit',  label: 'Ex Gratia Payment Limit' },
  { key: 'jurisdictionLocation',  label: 'Jurisdiction / Location' },
  { key: 'authorityStatus',       label: 'Authority Status' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCellStr(row: AuthorityRow, key: ColKey): string {
  const v = row[key as keyof AuthorityRow];
  if (typeof v === 'number') return fmt(v);
  return String(v ?? '');
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function FilterArrow({ active }: { active?: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill={active ? '#0B5AA0' : '#9ca3af'}>
      <path d="M1.5 2.5h8L5.5 8.5z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

// ─── Filter Popup (fixed-positioned, never clipped by table container) ────────

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
      {/* Tabs */}
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

// ─── Modify Columns Panel (fixed-positioned) ──────────────────────────────────

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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClaimsAuthorityPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(ALL_COLS.map(c => c.key)));
  const [showColPanel, setShowColPanel] = useState(false);
  const [colPanelRect, setColPanelRect] = useState<DOMRect | null>(null);
  const [activeFilter, setActiveFilter] = useState<ColKey | null>(null);
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['claims-authority'],
    queryFn: () => claimsApi.getAuthorityList(),
  });

  const colValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    ALL_COLS.forEach(col => {
      map[col.key] = [...new Set(allData.map(r => getCellStr(r, col.key)))].sort();
    });
    return map;
  }, [allData]);

  const rows = useMemo(() => {
    let r = allData;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(row => ALL_COLS.some(c => getCellStr(row, c.key).toLowerCase().includes(q)));
    }
    Object.entries(columnFilters).forEach(([key, vals]) => {
      if (vals.length > 0 && vals.length < (colValues[key]?.length ?? 0)) {
        r = r.filter(row => vals.includes(getCellStr(row, key as ColKey)));
      }
    });
    return r;
  }, [allData, search, columnFilters, colValues]);

  const total = allData.length;
  const active = allData.filter(r => r.authorityStatus === 'Active').length;
  const inactive = allData.filter(r => r.authorityStatus === 'Inactive').length;
  const visibleColDefs = ALL_COLS.filter(c => visibleCols.has(c.key));

  function applyFilter(key: ColKey, values: string[]) {
    setColumnFilters(prev => ({ ...prev, [key]: values }));
    setActiveFilter(null);
  }

  function clearFilter(key: ColKey) {
    setColumnFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
    setActiveFilter(null);
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
    <div style={{ padding: '16px 18px 28px', background: '#fff', minHeight: '100%' }} onClick={() => setActiveFilter(null)}>
      {/* Breadcrumb + Title */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Claims / Claims Authority</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Claim Authority</h1>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 22, border: '1px solid #e4eaf0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(90deg, #fff7ff 0%, #f2ffff 100%)', borderRight: '1px solid #e4eaf0' }}>
          <div>
            <div style={{ fontSize: 13, color: '#2d2d2d', marginBottom: 2 }}>Total</div>
            <div style={{ fontSize: 30, lineHeight: '34px', fontWeight: 800, color: '#111827' }}>{total}</div>
          </div>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#0B5AA0" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><circle cx="18" cy="8" r="2" /><path d="M22 8a4 4 0 01-4 4" />
          </svg>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(90deg, #fff7ff 0%, #f2ffff 100%)', borderRight: '1px solid #e4eaf0' }}>
          <div>
            <div style={{ fontSize: 13, color: '#2d2d2d', marginBottom: 2 }}>Active</div>
            <div style={{ fontSize: 30, lineHeight: '34px', fontWeight: 800, color: '#111827' }}>{active}</div>
          </div>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#009765" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M16 11l2 2 4-4" />
          </svg>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(90deg, #fff7ff 0%, #f2ffff 100%)' }}>
          <div>
            <div style={{ fontSize: 13, color: '#2d2d2d', marginBottom: 2 }}>Inactive</div>
            <div style={{ fontSize: 30, lineHeight: '34px', fontWeight: 800, color: '#c62828' }}>{inactive}</div>
          </div>
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M17 10l3 3m0-3l-3 3" />
          </svg>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Keyword"
            style={{ paddingLeft: 32, fontSize: 13, width: 280, height: 34, border: '1px solid #d1d5db', borderRadius: 4, outline: 'none', color: '#374151' }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate('/claims/authority/add-user')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Users
        </button>
      </div>

      {/* Table — no overflow:hidden so popups are not clipped */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                {/* ≡ header; same column shows serial number in data rows */}
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
                  <th key={col.key} style={{ ...TH }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {col.label}
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
              ) : rows.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #edf1f5' }}>
                  {/* Serial number in ≡ column */}
                  <td style={{ ...TD, textAlign: 'center', color: '#64748b', width: 46 }}>{idx + 1}</td>
                  <td style={{ ...TD }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button title="View" onClick={() => navigate(`/claims/authority/${row.id}/view`)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 3 }}><EyeIcon /></button>
                      <button title="Edit" onClick={() => navigate(`/claims/authority/${row.id}/edit`)} style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', padding: 3 }}><EditIcon /></button>
                    </div>
                  </td>
                  {visibleColDefs.map(col => (
                    <td key={col.key} style={{ ...TD }}>
                      {col.key === 'userName' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 26, height: 26, borderRadius: '50%',
                            background: idx % 2 === 0 ? '#0B5AA0' : '#009765',
                            color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}>
                            {row.userInitials}
                          </span>
                          {row.userName}
                        </span>
                      ) : col.key === 'authorityStatus' ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          background: row.authorityStatus === 'Active' ? '#d7f7e4' : '#fde8e8',
                          color: row.authorityStatus === 'Active' ? '#006b3c' : '#c62828',
                          border: `1px solid ${row.authorityStatus === 'Active' ? '#008c55' : '#f87171'}`,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.authorityStatus === 'Active' ? '#009765' : '#c62828' }} />
                          {row.authorityStatus}
                        </span>
                      ) : (
                        getCellStr(row, col.key)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column panel rendered at root level — uses fixed positioning, never clipped */}
      {showColPanel && colPanelRect && (
        <ColumnPanel
          anchorRect={colPanelRect}
          visibleCols={visibleCols}
          onToggle={(key, on) => setVisibleCols(prev => { const n = new Set(prev); on ? n.add(key) : n.delete(key); return n; })}
          onClose={() => setShowColPanel(false)}
        />
      )}

      {/* Filter popup rendered at root level — uses fixed positioning, never clipped */}
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
    </div>
  );
}
