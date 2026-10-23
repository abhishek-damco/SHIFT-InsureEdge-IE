import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { letterTemplatesApi, LetterTemplateListItem } from '../api/letterTemplates';

type ColKey = 'templateCode' | 'templateName' | 'templateCategory' | 'lineOfBusiness' | 'versionNo' | 'effectiveDateFrom' | 'effectiveDateTo';

const COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'templateCode',     label: 'Template ID' },
  { key: 'templateName',     label: 'Template Name' },
  { key: 'templateCategory', label: 'Template Category' },
  { key: 'lineOfBusiness',   label: 'Line of Business' },
  { key: 'versionNo',        label: 'Version No' },
  { key: 'effectiveDateFrom',label: 'Effective Date From' },
  { key: 'effectiveDateTo',  label: 'Effective Date To' },
];

const CONDITIONS = ['(not set)', 'contains', 'does not contain', 'equals', 'does not equal', 'starts with', 'ends with', 'is empty', 'is not empty'];

interface ColFilter {
  mode: 'condition' | 'value';
  cond1: string; val1: string;
  logic: 'and' | 'or';
  cond2: string; val2: string;
  selectedValues: string[];
}

type FiltersMap = Record<ColKey, ColFilter>;

function defaultFilter(): ColFilter {
  return { mode: 'value', cond1: '(not set)', val1: '', logic: 'and', cond2: '(not set)', val2: '', selectedValues: [] };
}

function makeFilters(): FiltersMap {
  return Object.fromEntries(COLUMNS.map(c => [c.key, defaultFilter()])) as FiltersMap;
}

function applyCondition(cell: string, cond: string, val: string): boolean {
  if (cond === '(not set)') return true;
  const c = cell.toLowerCase(), v = val.toLowerCase();
  switch (cond) {
    case 'contains':         return c.includes(v);
    case 'does not contain': return !c.includes(v);
    case 'equals':           return c === v;
    case 'does not equal':   return c !== v;
    case 'starts with':      return c.startsWith(v);
    case 'ends with':        return c.endsWith(v);
    case 'is empty':         return c.trim() === '';
    case 'is not empty':     return c.trim() !== '';
    default:                 return true;
  }
}

function rowPasses(row: LetterTemplateListItem, colKey: ColKey, f: ColFilter): boolean {
  const cell = String((row as unknown as Record<string, unknown>)[colKey] ?? '');
  if (f.mode === 'value') return f.selectedValues.length === 0 || f.selectedValues.includes(cell);
  const r1 = applyCondition(cell, f.cond1, f.val1);
  if (f.cond2 === '(not set)') return r1;
  const r2 = applyCondition(cell, f.cond2, f.val2);
  return f.logic === 'and' ? r1 && r2 : r1 || r2;
}

function isActive(f: ColFilter): boolean {
  return f.mode === 'value' ? f.selectedValues.length > 0 : f.cond1 !== '(not set)';
}

function getCell(row: LetterTemplateListItem, key: ColKey): string {
  return String((row as unknown as Record<string, unknown>)[key] ?? '');
}

interface PopupPos { top: number; left: number; }

export default function ClaimsLetterTemplatePage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput]   = useState('');
  const [search, setSearch]             = useState('');
  const [visibleCols, setVisibleCols]   = useState<Set<ColKey>>(new Set(COLUMNS.map(c => c.key)));
  const [draft, setDraft]               = useState<FiltersMap>(makeFilters);
  const [active, setActive]             = useState<FiltersMap>(makeFilters);

  // Popup state — position tracked so they render as fixed overlays (no table overflow clipping)
  const [filterOpen, setFilterOpen]     = useState<ColKey | null>(null);
  const [filterPos, setFilterPos]       = useState<PopupPos>({ top: 0, left: 0 });
  const [colPanelOpen, setColPanelOpen] = useState(false);
  const [colPanelPos, setColPanelPos]   = useState<PopupPos>({ top: 0, left: 0 });

  const filterRef   = useRef<HTMLDivElement>(null);
  const colPanelRef = useRef<HTMLDivElement>(null);

  const { data = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['letter-templates', search],
    queryFn: () => letterTemplatesApi.getList(search || undefined),
    staleTime: 0,
    refetchOnMount: 'always' as const,
  });

  // Close popups on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (filterOpen   && filterRef.current   && !filterRef.current.contains(t))   setFilterOpen(null);
      if (colPanelOpen && colPanelRef.current && !colPanelRef.current.contains(t)) setColPanelOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [filterOpen, colPanelOpen]);

  const filtered = data.filter(row => COLUMNS.every(col => rowPasses(row, col.key, active[col.key])));
  const visibleList = COLUMNS.filter(c => visibleCols.has(c.key));

  function openFilter(key: ColKey, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPos({ top: rect.bottom + 4, left: rect.left });
    setDraft(prev => ({ ...prev, [key]: { ...active[key], selectedValues: [...active[key].selectedValues] } }));
    setFilterOpen(key);
  }

  function applyFilter() {
    if (!filterOpen) return;
    setActive(prev => ({ ...prev, [filterOpen]: { ...draft[filterOpen] } }));
    setFilterOpen(null);
  }

  function clearFilter() {
    if (!filterOpen) return;
    const f = defaultFilter();
    setDraft(prev => ({ ...prev, [filterOpen]: f }));
    setActive(prev => ({ ...prev, [filterOpen]: f }));
    setFilterOpen(null);
  }

  function openColPanel(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setColPanelPos({ top: rect.bottom + 4, left: rect.left });
    setColPanelOpen(p => !p);
  }

  function patchDraft(patch: Partial<ColFilter>) {
    if (!filterOpen) return;
    setDraft(prev => ({ ...prev, [filterOpen]: { ...prev[filterOpen], ...patch } }));
  }

  function toggleCol(key: ColKey) {
    setVisibleCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function uniqueVals(key: ColKey) {
    return [...new Set(data.map(r => getCell(r, key)))].sort();
  }

  const totalCols = 2 + visibleList.length; // ≡/rownum + Action + data cols

  return (
    <div style={{ padding: '24px', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#333' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1a1a2e' }}>Claim Letter Templates</h2>
          {isFetching && !isLoading && <span style={{ fontSize: '12px', color: '#888' }}>Refreshing...</span>}
        </div>
        <button onClick={() => navigate('/claims/letter-template/add')} style={{ backgroundColor: '#1565c0', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
          + Add Template
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '320px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }}>
          <span style={{ padding: '0 8px', color: '#aaa', fontSize: '15px', flexShrink: 0 }}>&#128269;</span>
          <input
            type="text" placeholder="Search by Keyword" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchInput)}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '8px 8px 8px 0', fontSize: '13px', background: 'transparent' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '4px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              {/* ≡ — shows col panel on click; body shows row number */}
              <th style={{ ...TH, width: 44, textAlign: 'center' }}>
                <span onClick={openColPanel} style={{ cursor: 'pointer', fontSize: '18px', color: '#555', userSelect: 'none' }}>&#8801;</span>
              </th>
              {/* Action */}
              <th style={{ ...TH, width: 90 }}>Action</th>
              {/* Data columns */}
              {visibleList.map(col => (
                <th key={col.key} style={{ ...TH, whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>{col.label}</span>
                    <span
                      onClick={e => openFilter(col.key, e)}
                      style={{ cursor: 'pointer', color: isActive(active[col.key]) ? '#1565c0' : '#b0b8c4', fontSize: '11px', flexShrink: 0 }}
                      title="Filter"
                    >&#9660;</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={totalCols} style={{ ...TD, textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</td></tr>
            ) : isError ? (
              <tr><td colSpan={totalCols} style={{ ...TD, textAlign: 'center', padding: '40px' }}>
                <div style={{ color: '#e53935', marginBottom: '10px' }}>Failed to load templates. Check your connection or try refreshing.</div>
                <button onClick={() => refetch()} style={{ padding: '6px 16px', border: '1px solid #1565c0', borderRadius: '4px', background: '#fff', color: '#1565c0', cursor: 'pointer', fontSize: '13px' }}>Retry</button>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={totalCols} style={{ ...TD, textAlign: 'center', padding: '40px', color: '#888' }}>No records found.</td></tr>
            ) : filtered.map((row, idx) => (
              <tr key={row.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                {/* row number in the ≡ column */}
                <td style={{ ...TD, textAlign: 'center', color: '#555' }}>{idx + 1}</td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <span style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
                    <span title="View" onClick={() => navigate(`/claims/letter-template/${row.id}/view`)} style={{ cursor: 'pointer', color: '#555', fontSize: '17px' }}>&#128065;</span>
                    <span title="Edit" onClick={() => navigate(`/claims/letter-template/${row.id}/edit`)} style={{ cursor: 'pointer', color: '#555', fontSize: '15px' }}>&#9998;</span>
                  </span>
                </td>
                {visibleList.map(col => (
                  <td key={col.key} style={{ ...TD, color: col.key === 'templateCode' ? '#1565c0' : '#374151', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getCell(row, col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Column display panel — fixed overlay ── */}
      {colPanelOpen && (
        <div ref={colPanelRef} onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', top: colPanelPos.top, left: colPanelPos.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', width: '270px', padding: '14px 10px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', marginBottom: '10px', paddingLeft: '6px' }}>Modify Columns Display</div>
          {/* Action — always visible, greyed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '3px', color: '#aaa' }}>
            <input type="checkbox" checked disabled readOnly style={{ flexShrink: 0, width: 15, height: 15 }} />
            <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Action</span>
          </div>
          {COLUMNS.map(col => {
            const on = visibleCols.has(col.key);
            return (
              <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '3px', cursor: 'pointer', backgroundColor: on ? '#e8f0fe' : 'transparent', marginBottom: '2px' }}>
                <input type="checkbox" checked={on} onChange={() => toggleCol(col.key)} style={{ flexShrink: 0, width: 15, height: 15, accentColor: '#1565c0', cursor: 'pointer' }} />
                <span style={{ color: on ? '#1565c0' : '#555', fontSize: '13px', whiteSpace: 'nowrap' }}>{col.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* ── Filter popup — fixed overlay ── */}
      {filterOpen && (
        <div ref={filterRef} onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', top: filterPos.top, left: filterPos.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', width: '340px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            {(['condition', 'value'] as const).map(m => (
              <button key={m} onClick={() => patchDraft({ mode: m })}
                style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: draft[filterOpen].mode === m ? '600' : '400', color: draft[filterOpen].mode === m ? '#1565c0' : '#666', borderBottom: draft[filterOpen].mode === m ? '2px solid #1565c0' : '2px solid transparent', marginBottom: '-1px' }}>
                {m === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
              </button>
            ))}
          </div>
          <div style={{ padding: '14px' }}>
            {draft[filterOpen].mode === 'value'
              ? <ValueFilter draft={draft[filterOpen]} allVals={uniqueVals(filterOpen)} onChange={patchDraft} />
              : <ConditionFilter draft={draft[filterOpen]} onChange={patchDraft} />
            }
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button onClick={applyFilter} style={{ flex: 1, padding: '7px 0', backgroundColor: '#1565c0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Apply</button>
              <button onClick={() => setFilterOpen(null)} style={{ flex: 1, padding: '7px 0', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={clearFilter} style={{ flex: 1, padding: '7px 0', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Filter by Value ───────────────────────────── */
function ValueFilter({ draft, allVals, onChange }: { draft: ColFilter; allVals: string[]; onChange: (p: Partial<ColFilter>) => void }) {
  const [valSearch, setValSearch] = useState('');
  const shown = valSearch ? allVals.filter(v => v.toLowerCase().includes(valSearch.toLowerCase())) : allVals;
  const allChecked = shown.length > 0 && shown.every(v => draft.selectedValues.includes(v));

  function toggle(val: string) {
    const cur = draft.selectedValues;
    onChange({ selectedValues: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
  }
  function toggleAll() {
    if (allChecked) onChange({ selectedValues: draft.selectedValues.filter(v => !shown.includes(v)) });
    else onChange({ selectedValues: [...new Set([...draft.selectedValues, ...shown])] });
  }

  return (
    <div>
      <input type="text" placeholder="Search" value={valSearch} onChange={e => setValSearch(e.target.value)}
        style={{ width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }} />
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        <label style={CHK_ROW}>
          <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ flexShrink: 0, width: 15, height: 15, accentColor: '#1565c0', cursor: 'pointer' }} />
          <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>Select All</span>
        </label>
        {shown.map(v => (
          <label key={v} style={{ ...CHK_ROW, backgroundColor: draft.selectedValues.includes(v) ? '#e8f0fe' : 'transparent' }}>
            <input type="checkbox" checked={draft.selectedValues.includes(v)} onChange={() => toggle(v)} style={{ flexShrink: 0, width: 15, height: 15, accentColor: '#1565c0', cursor: 'pointer' }} />
            <span style={{ whiteSpace: 'nowrap' }}>{v || '(empty)'}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Filter by Condition ───────────────────────── */
function ConditionFilter({ draft, onChange }: { draft: ColFilter; onChange: (p: Partial<ColFilter>) => void }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>Show items where the value</div>
      <select value={draft.cond1} onChange={e => onChange({ cond1: e.target.value })} style={SEL}>
        {CONDITIONS.map(c => <option key={c}>{c}</option>)}
      </select>
      <input value={draft.val1} onChange={e => onChange({ val1: e.target.value })} style={COND_IN} />
      <div style={{ display: 'flex', gap: '20px', margin: '10px 0 8px', alignItems: 'center' }}>
        {(['and', 'or'] as const).map(l => (
          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '13px' }}>
            <input type="radio" checked={draft.logic === l} onChange={() => onChange({ logic: l })} style={{ accentColor: '#1565c0' }} /> {l.charAt(0).toUpperCase() + l.slice(1)}
          </label>
        ))}
      </div>
      <select value={draft.cond2} onChange={e => onChange({ cond2: e.target.value })} style={SEL}>
        {CONDITIONS.map(c => <option key={c}>{c}</option>)}
      </select>
      <input value={draft.val2} onChange={e => onChange({ val2: e.target.value })} style={COND_IN} />
    </div>
  );
}

/* ── Shared styles ─────────────────────────────── */
const TH: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontWeight: '600', fontSize: '13px', color: '#374151', border: '1px solid #d1d5db', userSelect: 'none' };
const TD: React.CSSProperties = { padding: '9px 12px', border: '1px solid #e9ecef', fontSize: '13px' };
const CHK_ROW: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' };
const SEL: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #1565c0', borderRadius: '4px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box', color: '#1565c0', backgroundColor: '#fff' };
const COND_IN: React.CSSProperties = { width: '100%', padding: '7px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', marginBottom: '4px', outline: 'none' };
