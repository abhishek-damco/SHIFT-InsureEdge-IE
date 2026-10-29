// US-001: Group list â€” stat cards, column filters (by value/condition), modify columns, sort, pagination.
// US-008/US-009: Download (export) with format split-button. US-018: Import Group upload.
// BR-003: Status badge. BR-007: MemberCount live. Date format: MM-DD-YYYY.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import StatCards from '../components/StatCards/StatCards';
import PaginationBar from '../components/PaginationBar';
import { useGroupList } from '../hooks/useGroups';
import { groupsApi } from '../api/groups';
import { usePermissions } from '../contexts/PermissionContext';
import type { GroupListDto } from '../types/Group';
import { useColumnOrder } from '../hooks/useColumnOrder';
import {
  ColumnFilterPopup, applyColumnFilters, distinctValues, hasActiveFilters, type ColumnFilters,
} from '../components/grid/ColumnFilter';

const DEFAULT_PAGE_SIZE = 10;
// While a column filter is in use, every group is loaded so the filter covers all pages (QA UGM-05).
const ALL_ROWS_PAGE_SIZE = 10000;
// QA UGM-06: OutSystems labels and order.
const EXPORT_FORMATS = [
  { fmt: 'PDF',  label: 'Download PDF',   icon: 'PDF' },
  { fmt: 'CSV',  label: 'Download CSV',   icon: 'CSV' },
  { fmt: 'XLSX', label: 'Download Excel', icon: 'XLS' },
  { fmt: 'TXT',  label: 'Download Txt',   icon: 'TXT' },
];

// â”€â”€â”€ Column definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type ColKey = 'groupName' | 'groupCode' | 'memberCount' | 'createdByName' | 'groupEmailId' | 'createdOn' | 'groupDesc' | 'status';

interface ColDef { key: ColKey; label: string; locked?: boolean; width?: number; sortable?: boolean; }
const ALL_COLS: ColDef[] = [
  { key: 'groupName',    label: 'Group Name',        locked: true,  width: 180, sortable: true },
  { key: 'groupCode',    label: 'Group ID',           locked: false, width: 100, sortable: true },
  { key: 'memberCount',  label: 'Group Member',       locked: false, width: 110, sortable: true },
  { key: 'createdByName',label: 'Created By',         locked: false, width: 170, sortable: true },
  { key: 'groupEmailId', label: 'Group Email ID',     locked: false, width: 180, sortable: false },
  { key: 'createdOn',    label: 'Created On',         locked: false, width: 110, sortable: true },
  { key: 'groupDesc',    label: 'Group Description',  locked: false, sortable: false },
  { key: 'status',       label: 'Status',             locked: true,  width: 110, sortable: true },
];
const COL_BY_KEY = Object.fromEntries(ALL_COLS.map(c => [c.key, c])) as Record<ColKey, ColDef>;

// Text a column filter matches against — what the cell shows.
function getCell(row: GroupListDto, key: ColKey): string {
  const raw = row[key];
  if (raw == null) return '';
  if (key === 'createdOn') return format(parseISO(String(raw)), 'MM-dd-yyyy');
  return String(raw);
}

// â”€â”€â”€ Utility: close on outside click â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}
function SearchSmallIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function ColumnsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}

function FilterIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#4b5563'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}

function CaretDownIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
}

function UploadIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></svg>;
}

function DownloadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" /></svg>;
}

// QA UGM-06: compact monochrome file-type icons matching the reference menu.
function FileTypeIcon({ label }: { label: string }) {
  if (label === 'XLS') {
    return (
      <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
        <path d="M3.5 1.5h8l4 4V20.5h-12z" fill="#fff" stroke="#20242a" />
        <path d="M11.5 1.5v4h4" stroke="#20242a" strokeLinejoin="round" />
        <path d="M1.5 9.5h12v9h-12zM1.5 12.5h12M1.5 15.5h12M5.5 9.5v9M9.5 9.5v9" fill="#fff" stroke="#20242a" strokeWidth=".8" />
        <path d="m14.5 15.5 2 2 2-2M16.5 12.5v5" stroke="#20242a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
      <path d="M3.5 1.5h8l4 4V20.5h-12z" fill="#fff" stroke="#20242a" strokeLinejoin="round" />
      <path d="M11.5 1.5v4h4" stroke="#20242a" strokeLinejoin="round" />
      <rect x="1.5" y="9" width="12" height="7" fill="#fff" stroke="#20242a" strokeWidth=".8" />
      <text x="7.5" y="14" textAnchor="middle" fontSize={label === 'PDF' ? '4.1' : '4.3'} fontWeight="700" fill="#20242a" fontFamily="Arial, sans-serif">{label}</text>
    </svg>
  );
}
// â”€â”€â”€ Modify Columns Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          const locked = col.locked;
          return (
            <label key={col.key} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px', cursor: locked ? 'default' : 'pointer',
              background: checked ? '#eff6ff' : 'transparent',
              opacity: locked ? 0.7 : 1,
            }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={locked}
                onChange={() => !locked && onToggle(col.key)}
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

// â”€â”€â”€ Import Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) { setError('Please select a file.'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await fetch('/api/groups/import', { method: 'POST', body: form, credentials: 'include' });
      onClose();
    } catch {
      setError('Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 28, width: 420,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Import Groups</span>
          <button onClick={onClose} style={{ background: 'none', fontSize: 20, color: '#6b7280', padding: 0 }}>Ã—</button>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          Upload a CSV or Excel file to bulk import groups.
        </p>
        <div
          style={{
            border: '2px dashed #d1d5db', borderRadius: 8, padding: 24,
            textAlign: 'center', cursor: 'pointer', marginBottom: 16,
            background: file ? '#f0fdf4' : '#fafafa',
          }}
          onClick={() => fileRef.current?.click()}
        >
          {file
            ? <span style={{ color: '#16a34a', fontWeight: 500 }}>âœ“ {file.name}</span>
            : <span style={{ color: '#9ca3af' }}>Click to select a file (CSV, XLSX)</span>}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files?.[0] ?? null); setError(''); }} />
        </div>
        {error && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function GroupListPage() {
  const navigate = useNavigate();
  const perms = usePermissions('USERGROUPPAGE');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ColKey>('groupCode');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const [openFilterCol, setOpenFilterCol] = useState<ColKey | null>(null);
  const [filterAnchorRects, setFilterAnchorRects] = useState<Partial<Record<ColKey, DOMRect>>>({});
  const modifyColsRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(exportMenuRef, () => setExportOpen(false));

  // Visible columns (locked ones always shown)
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(
    new Set(ALL_COLS.map(c => c.key))
  );
  const toggleCol = (key: ColKey) =>
    setVisibleCols(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // QA UGM-02: user-defined column order (drag a header onto another).
  const { order: colOrder, dragging: dragCol, headerProps } = useColumnOrder<ColKey>(ALL_COLS.map(c => c.key));

  // Column filters (QA UGM-05). The server pages the list, so filtering only the current page
  // missed matches on other pages; while a filter is open or applied, load every row instead
  // and page the filtered result here.
  const [filters, setFilters] = useState<ColumnFilters<ColKey>>({});
  const filtering = hasActiveFilters(filters);
  const needAllRows = filtering || openFilterCol !== null;

  const { data, isLoading } = useGroupList({
    search, sortBy, sortOrder, page, pageSize,
  });
  const { data: allData, isLoading: allLoading } = useGroupList({
    search, sortBy, sortOrder, page: 1, pageSize: ALL_ROWS_PAGE_SIZE,
  }, needAllRows);

  const filteredAll = filtering ? applyColumnFilters(allData?.items ?? [], filters, getCell) : [];
  const filtered: GroupListDto[] = filtering
    ? filteredAll.slice((page - 1) * pageSize, page * pageSize)
    : data?.items ?? [];
  const totalRows = filtering ? filteredAll.length : data?.total ?? 0;
  const tableLoading = filtering ? allLoading : isLoading;

  const setFilter = (key: ColKey, f: ColumnFilters<ColKey>[ColKey]) => {
    setFilters(prev => {
      const next = { ...prev };
      if (f) next[key] = f; else delete next[key];
      return next;
    });
    setPage(1);
  };


  const handleSort = (field: ColKey) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
    setPage(1);
  };

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () =>
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(r => r.id));

  const downloadBlob = (blob: Blob, fmt: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `groups.${fmt.toLowerCase()}`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = useCallback(async (fmt: string, selected: boolean) => {
    setExporting(true); setExportOpen(false);
    try {
      const blob = selected && selectedIds.length > 0
        ? await groupsApi.exportSelected(selectedIds, fmt.toLowerCase())
        : await groupsApi.export({ format: fmt.toLowerCase(), search });
      downloadBlob(blob, fmt);
    } finally { setExporting(false); }
  }, [selectedIds, search]);

  // Rendered columns in the user's order
  const renderedCols = colOrder.map(k => COL_BY_KEY[k]).filter(c => visibleCols.has(c.key));

  const hasFilter = (key: ColKey) => !!filters[key];

  const SortIcon = ({ field }: { field: ColKey }) =>
    sortBy === field
      ? <span style={{ marginLeft: 4, fontSize: 10, color: '#0B5AA0' }}>{sortOrder === 'asc' ? '^' : 'v'}</span>
      : null;

  return (
    <div style={{ padding: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, minHeight: 'calc(100vh - 88px)', boxShadow: '0 1px 3px rgba(15,23,42,0.10)' }}>
      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>User Group Management</h1>
      </div>

      {/* Stat cards */}
      {data && (
        <StatCards total={data.total} activeCount={data.activeCount} inactiveCount={data.inactiveCount} />
      )}

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: 290 }}>
          <span style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            color: '#9ca3af', fontSize: 14, pointerEvents: 'none', lineHeight: 1,
          }}><SearchSmallIcon /></span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by Keyword"
            style={{ paddingLeft: 36, fontSize: 13, width: 290, height: 34, borderRadius: 3, borderColor: '#aeb7c2' }}
          />
        </div>

        <div style={{ flex: 1 }} />

        {/* Download split button */}
        {perms.download && (
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}>
              <button className="btn-secondary" style={{ border: 'none', borderRadius: 0, padding: '7px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => handleExport('CSV', false)} disabled={exporting}>
                <DownloadIcon />
                Download
              </button>
              <button className="btn-secondary" style={{ border: 'none', borderLeft: '1px solid #d1d5db', borderRadius: 0, padding: '7px 8px', fontSize: 11 }}
                onClick={() => setExportOpen(o => !o)} disabled={exporting}><CaretDownIcon /></button>
            </div>
            {exportOpen && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 230,
              }}>
                {/* Downloads the ticked rows when any are ticked, otherwise every row. */}
                {EXPORT_FORMATS.map(({ fmt, label, icon }) => (
                  <button key={fmt} className="btn-secondary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: 'none', borderBottom: '1px solid #f3f4f6', borderRadius: 0, padding: '9px 14px', fontSize: 13 }}
                    onClick={() => handleExport(fmt, selectedIds.length > 0)}>
                    <FileTypeIcon label={icon} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import Group */}
        {perms.upload && (
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}
            onClick={() => setImportOpen(true)}>
            <UploadIcon />
            Import Group
          </button>
        )}

        {/* Add User Group */}
        {perms.add && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 16px', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/groups/new')}>
            + Add User Group
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: '#fff', borderRadius: 0,
      }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>

                {/* Modify columns icon */}
                <th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
                  <div ref={modifyColsRef} style={{ display: 'inline-block' }}>
                    <button
                      onClick={e => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setModifyColsRect(rect);
                        setShowModifyCols(o => !o);
                      }}
                      title="Modify Columns"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, color: '#6b7280', fontSize: 16, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 4,
                      }}
                    ><ColumnsIcon /></button>
                    {showModifyCols && modifyColsRect && (
                      <ModifyColumnsPanel
                        visibleCols={visibleCols}
                        onToggle={toggleCol}
                        onClose={() => setShowModifyCols(false)}
                        anchorRect={modifyColsRect}
                      />
                    )}
                  </div>
                </th>

                {/* Checkbox */}
                <th style={{ width: 38, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <input type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleAll}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
                </th>

                {/* Action */}
                <th style={{ width: 70, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151' }}>
                  Action
                </th>

                {/* Dynamic columns */}
                {renderedCols.map(col => (
                  <th
                    key={col.key}
                    {...headerProps(col.key)}
                    style={{
                      padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                      fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap',
                      width: col.width, cursor: col.sortable ? 'pointer' : 'grab',
                      userSelect: 'none', opacity: dragCol === col.key ? 0.5 : 1,
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      {col.label}
                      {col.sortable && <SortIcon field={col.key} />}
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
                          marginLeft: 4, cursor: 'pointer', fontSize: 12,
                          color: hasFilter(col.key) ? '#0B5AA0' : '#9ca3af',
                          display: 'inline-flex', alignItems: 'center',
                        }}
                        title="Filter"
                      >
                        <FilterIcon active={hasFilter(col.key)} />
                      </span>
                    </span>
                    {/* Filter popup â€” rendered outside table via fixed positioning */}
                    {openFilterCol === col.key && filterAnchorRects[col.key] && (
                      <ColumnFilterPopup
                        title={col.label}
                        values={distinctValues(allData?.items ?? [], r => getCell(r, col.key))}
                        loading={allLoading}
                        current={filters[col.key]}
                        onApply={f => setFilter(col.key, f)}
                        onClose={() => setOpenFilterCol(null)}
                        anchorRect={filterAnchorRects[col.key]!}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan={3 + renderedCols.length} style={{ padding: 48, textAlign: 'center' }}>
                  <span className="spinner" />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3 + renderedCols.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                  No Data Available
                </td></tr>
              ) : filtered.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: selectedIds.includes(row.id) ? '#eff6ff' : idx % 2 === 1 ? '#fafafa' : '#fff',
                  }}
                >
                  {/* Row number */}
                  <td style={{ padding: '10px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderRight: '1px solid #f3f4f6' }}>
                    {(page - 1) * pageSize + idx + 1}
                  </td>
                  {/* Checkbox */}
                  <td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                    <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleSelect(row.id)}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} />
                  </td>
                  {/* Action */}
                  <td style={{ padding: '10px 12px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => navigate(`/groups/${row.id}`)}
                      title="View"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                  </td>
                  {/* Dynamic cells */}
                  {renderedCols.map(col => (
                    <td key={col.key} style={{ padding: '10px 12px', borderRight: '1px solid #f3f4f6', maxWidth: col.key === 'groupDesc' ? 200 : undefined }}>
                      {col.key === 'groupName' ? (
                        <span style={{ color: '#0B5AA0', fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => navigate(`/groups/${row.id}`)}>
                          {row.groupName}
                        </span>
                      ) : col.key === 'createdByName' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, borderRadius: '50%', background: '#dbeafe',
                            color: '#1d4ed8', fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}>
                            {(row.createdByName ?? '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                          </span>
                          {row.createdByName}
                        </span>
                      ) : col.key === 'createdOn' ? (
                        <span style={{ color: '#374151', whiteSpace: 'nowrap' }}>
                          {row.createdOn ? format(parseISO(row.createdOn), 'MM-dd-yyyy') : '-'}
                        </span>
                      ) : col.key === 'status' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 94, height: 24, padding: '0 12px', borderRadius: 999, border: '1px solid #008c55', background: '#d7f7e4', color: '#006b3c', fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#008c55' }} />{row.status}
                        </span>
                      ) : col.key === 'groupDesc' ? (
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, color: '#6b7280' }}>
                          {row.groupDesc || '-'}
                        </span>
                      ) : (
                        <span style={{ color: '#374151' }}>
                          {(row[col.key as keyof GroupListDto] ?? '-') as string}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationBar
          page={page}
          pageSize={pageSize}
          total={totalRows}
          onPageChange={setPage}
          onPageSizeChange={size => { setPageSize(size); setPage(1); }}
        />
      </div>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}




