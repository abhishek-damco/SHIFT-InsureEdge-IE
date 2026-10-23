import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';
import type { ClaimEnquiryDto, AssignableUserDto } from '../types/Claim';
import { usePermissions } from '../contexts/PermissionContext';
import PaginationBar from '../components/PaginationBar';

const DEFAULT_PAGE_SIZE = 10;
const EXPORT_FORMATS = ['CSV', 'PDF', 'XLSX', 'TXT'];

type ColKey = keyof ClaimEnquiryDto;
interface ColDef { key: ColKey; label: string; locked?: boolean; width?: number; sortable?: boolean; align?: 'left' | 'right' | 'center'; }

type ValueFilters = Partial<Record<ColKey, string[]>>;
type CondFilters = Partial<Record<ColKey, { op: string; value: string }>>;

const CONDITION_OPS = ['Contains', 'Does not contain', 'Equals', 'Starts with', 'Ends with'];

const ALL_COLS: ColDef[] = [
  { key: 'claimNumber', label: 'Claim No.', locked: true, width: 140, sortable: true },
  { key: 'policyNumber', label: 'Policy No.', width: 135, sortable: true },
  { key: 'policyHolder', label: 'Policy Holder', width: 190, sortable: true },
  { key: 'claimantName', label: 'Claimant Name', width: 170, sortable: true },
  { key: 'claimStatus', label: 'Status', locked: true, width: 110, sortable: true },
  { key: 'lob', label: 'Line of Business', width: 150, sortable: true },
  { key: 'subLob', label: 'Sub-Product', width: 130, sortable: true },
  { key: 'dateOfLoss', label: 'Date of Loss', width: 120, sortable: true },
  { key: 'submissionDate', label: 'Submission Date', width: 135, sortable: true },
  { key: 'claimType', label: 'Claim Type', width: 150, sortable: true },
  { key: 'mainCauseOfLoss', label: 'Cause of Loss', width: 160, sortable: true },
  { key: 'consequencesOfLoss', label: 'Consequence', width: 160, sortable: true },
  { key: 'claimInitiationChannel', label: 'Channel', width: 140, sortable: true },
  { key: 'claimReimbursementType', label: 'Reimbursement', width: 150, sortable: true },
  { key: 'catastrophicEvent', label: 'Cat Event', width: 130, sortable: true },
  { key: 'inspectionRequired', label: 'Inspection', width: 110, sortable: true, align: 'center' },
  { key: 'isThirdPartyDamage', label: 'Third Party', width: 115, sortable: true, align: 'center' },
  { key: 'reporterName', label: 'Reporter', width: 160, sortable: true },
  { key: 'reporterEmail', label: 'Reporter Email', width: 190, sortable: true },
  { key: 'lossLocation', label: 'Loss Location', width: 220, sortable: false },
  { key: 'assignedTo', label: 'Assigned To', width: 150, sortable: true },
  { key: 'aging', label: 'Aging', width: 90, sortable: true, align: 'right' },
  { key: 'estimateAmount', label: 'Estimate', width: 125, sortable: true, align: 'right' },
  { key: 'approvedAmount', label: 'Approved Amount', width: 145, sortable: true, align: 'right' },
  { key: 'adjusterAssigned', label: 'Adjuster Assigned', width: 160, sortable: true },
  { key: 'claimReferred', label: 'Claim Referred', width: 130, sortable: true },
  { key: 'referredDept', label: 'Referred Dept', width: 140, sortable: true },
  { key: 'fraudIndicator', label: 'Fraud Indicator', width: 130, sortable: true },
  { key: 'closureDate', label: 'Closure Date', width: 120, sortable: true },
  { key: 'createdByName', label: 'Created By', width: 160, sortable: true },
];

const statusColors: Record<string, { bg: string; color: string }> = {
  OPEN: { bg: '#e8f5e9', color: '#2e7d32' },
  CLOSED: { bg: '#eeeeee', color: '#616161' },
  DRAFT: { bg: '#fff8e1', color: '#f57f17' },
  DENIED: { bg: '#fce4ec', color: '#c62828' },
  APPROVED: { bg: '#e3f2fd', color: '#1565c0' },
  PENDING: { bg: '#fff3e0', color: '#e65100' },
};

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) cb();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

function displayCell(row: ClaimEnquiryDto, key: ColKey) {
  const value = row[key];
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value == null || value === '' ? '-' : String(value);
}

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function ColumnsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}

function FilterIcon({ active }: { active: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? '#0B5AA0' : '#4b5563'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status.toUpperCase()] ?? { bg: '#f5f5f5', color: '#333' };
  return <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: colors.bg, color: colors.color, whiteSpace: 'nowrap' }}>• {status}</span>;
}

function ClaimsIcon({ type, color }: { type: string; color: string }) {
  if (type === 'clipboard') {
    return <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M9 4h6l1 2h3v16H5V6h3l1-2z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>;
  }
  if (type === 'hand') {
    return <svg width="48" height="42" viewBox="0 0 32 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M2 15h6l4 3h8l8-5c1.2-.8.2-3-1.2-2.3l-7.2 3.1"/><path d="M9 12h7c2.4 0 2.4 3 0 3h-5"/><path d="M23 2h7v9h-7z"/><path d="M25 7l2 2 3-5"/></svg>;
  }
  return <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><path d="M5 2h10l4 4v16H5z"/><path d="M15 2v5h5"/><path d="M14 13l3 2 3-2v4c0 2-1.5 3.5-3 4-1.5-.5-3-2-3-4z"/></svg>;
}

function StatCard({ label, value, color, iconType }: { label: string; value: number; color: string; iconType: string }) {
  return (
    <div style={{ minHeight: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #fff7ff 0%, #f2ffff 100%)', border: '1px solid #e4eaf0', borderRadius: 6, padding: '14px 12px' }}>
      <div>
        <div style={{ fontSize: 13, color: '#2d2d2d', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 30, lineHeight: '32px', fontWeight: 800, color }}>{value}</div>
      </div>
      <ClaimsIcon type={iconType} color={color} />
    </div>
  );
}

function ColumnFilterPopup({ col, allRows, valueFilter, condFilter, onApplyValue, onApplyCondition, onClear, onClose, anchorRect }: {
  col: ColDef;
  allRows: ClaimEnquiryDto[];
  valueFilter: string[];
  condFilter: { op: string; value: string } | undefined;
  onApplyValue: (vals: string[]) => void;
  onApplyCondition: (filter: { op: string; value: string } | undefined) => void;
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

  const uniqueVals = Array.from(new Set(allRows.map(row => displayCell(row, col.key)).filter(value => value !== '-'))).sort();
  const visibleVals = uniqueVals.filter(value => value.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visibleVals.length > 0 && visibleVals.every(value => selected.includes(value));
  const toggleValue = (value: string) => setSelected(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  const toggleAll = () => setSelected(allChecked ? selected.filter(item => !visibleVals.includes(item)) : [...new Set([...selected, ...visibleVals])]);

  return (
    <div ref={ref} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 280, maxWidth: 340 }} onClick={event => event.stopPropagation()}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', fontWeight: 600, fontSize: 13, color: '#111827' }}>{col.label}</div>
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['condition', 'value'] as const).map(item => <button key={item} onClick={() => setTab(item)} style={{ flex: 1, padding: '9px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === item ? 600 : 400, color: tab === item ? '#0B5AA0' : '#6b7280', borderBottom: tab === item ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer' }}>{item === 'condition' ? 'Filter by Condition' : 'Filter by Value'}</button>)}
      </div>
      {tab === 'value' ? (
        <>
          <div style={{ padding: '10px 14px 6px' }}><input autoFocus placeholder="Search" value={search} onChange={event => setSearch(event.target.value)} style={{ fontSize: 13, padding: '7px 10px', width: '100%' }} /></div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: allChecked ? '#eff6ff' : 'transparent' }}><input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />Select All</label>
            {visibleVals.map(value => <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 13, background: selected.includes(value) ? '#eff6ff' : 'transparent' }}><input type="checkbox" checked={selected.includes(value)} onChange={() => toggleValue(value)} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />{value}</label>)}
            {visibleVals.length === 0 && <div style={{ padding: '12px 14px', color: '#9ca3af', fontSize: 13 }}>No values found</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
            <button className="btn-primary" style={{ flex: 1, padding: '8px 0', fontSize: 13 }} onClick={() => { onApplyValue(selected); onClose(); }}>Apply</button>
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={onClose}>Cancel</button>
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => { setSelected([]); onClear(); onClose(); }}>Clear</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select value={condOp} onChange={event => setCondOp(event.target.value)} style={{ fontSize: 13, width: '100%' }}>{CONDITION_OPS.map(op => <option key={op}>{op}</option>)}</select>
          <input autoFocus placeholder="Value..." value={condVal} onChange={event => setCondVal(event.target.value)} style={{ fontSize: 13, width: '100%' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: 13, padding: '8px 0' }} onClick={() => { onApplyCondition(condVal ? { op: condOp, value: condVal } : undefined); onClose(); }}>Apply</button>
            <button className="btn-secondary" style={{ fontSize: 13, padding: '8px 14px' }} onClick={() => { setCondVal(''); onApplyCondition(undefined); onClose(); }}>Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModifyColumnsPanel({ visibleCols, onToggle, onClose, anchorRect }: { visibleCols: Set<ColKey>; onToggle: (key: ColKey) => void; onClose: () => void; anchorRect: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, onClose);
  return (
    <div ref={ref} style={{ position: 'fixed', top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', width: 290 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14, color: '#111827' }}>Modify Columns Display</div>
      <div style={{ padding: '8px 0', maxHeight: 420, overflowY: 'auto' }}>
        {ALL_COLS.map(col => {
          const checked = visibleCols.has(col.key);
          return <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', cursor: col.locked ? 'default' : 'pointer', background: checked ? '#eff6ff' : 'transparent', opacity: col.locked ? 0.7 : 1 }}><input type="checkbox" checked={checked} disabled={col.locked} onChange={() => !col.locked && onToggle(col.key)} style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} /><span style={{ fontSize: 13, color: '#374151' }}>{col.label}</span></label>;
        })}
      </div>
    </div>
  );
}

function ClaimAssignModal({ claimId, isReassign, onClose, onAssigned }: {
  claimId: number;
  isReassign: boolean;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [users, setUsers] = useState<AssignableUserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    claimsApi.getAssignableUsers(debouncedSearch || undefined)
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const handleAssign = async () => {
    if (!selectedId) return;
    const user = users.find(u => u.id === selectedId)!;
    setAssigning(true);
    try {
      await claimsApi.updateAssignment(claimId, { assignedTo: selectedId, assignedToName: user.name });
      onAssigned();
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 10, width: 700, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Claim Assignment</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#6b7280', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        {/* Search */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            </span>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Keyword"
              style={{ paddingLeft: 32, fontSize: 13, width: '100%' }}
            />
          </div>
        </div>
        {/* Table */}
        <div style={{ padding: '12px 24px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Search Result</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', width: 70 }}>Select</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', textAlign: 'left' }}>User Name</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', textAlign: 'left' }}>User ID</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', textAlign: 'left' }}>Payment Approval Limit</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, color: '#374151', textAlign: 'left' }}>Reserve Approval Limit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center' }}><span className="spinner" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No users found.</td></tr>
                ) : users.map((user, i) => (
                  <tr key={user.id} style={{ background: selectedId === user.id ? '#eff6ff' : i % 2 === 1 ? '#fafafa' : '#fff', cursor: 'pointer' }} onClick={() => setSelectedId(user.id)}>
                    <td style={{ padding: '10px 14px', textAlign: 'center', borderBottom: '1px solid #f3f4f6' }}>
                      <input type="radio" checked={selectedId === user.id} onChange={() => setSelectedId(user.id)} style={{ width: 15, height: 15, accentColor: '#0B5AA0', cursor: 'pointer' }} />
                    </td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#111827' }}>{user.name}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{user.userCode}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{user.paymentApprovalLimit}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', color: '#374151' }}>{user.reserveApprovalLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px' }}>
          <button className="btn-secondary" style={{ padding: '9px 24px', fontSize: 13 }} onClick={onClose}>Cancel</button>
          <button className="btn-primary" style={{ padding: '9px 24px', fontSize: 13 }} onClick={handleAssign} disabled={!selectedId || assigning}>
            {assigning ? 'Assigning...' : isReassign ? 'Reassign' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClaimsEnquiryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const perms = usePermissions('CLAIMENQUIRYSCREEN');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [assignModal, setAssignModal] = useState<{ claimId: number; isReassign: boolean } | null>(null);
  const [sortCol, setSortCol] = useState<ColKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showModifyCols, setShowModifyCols] = useState(false);
  const [modifyColsRect, setModifyColsRect] = useState<DOMRect | null>(null);
  const [openFilterCol, setOpenFilterCol] = useState<ColKey | null>(null);
  const [filterAnchorRects, setFilterAnchorRects] = useState<Partial<Record<ColKey, DOMRect>>>({});
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(ALL_COLS.map(col => col.key)));
  const [valueFilters, setValueFilters] = useState<ValueFilters>({});
  const [condFilters, setCondFilters] = useState<CondFilters>({});

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['claims-enquiry', search],
    queryFn: () => claimsApi.getEnquiryList(search || undefined),
    enabled: perms.loaded && perms.view,
  });

  const allRows = data?.items ?? [];
  const renderedCols = ALL_COLS.filter(col => visibleCols.has(col.key));

  const filtered = useMemo(() => allRows.filter(row => {
    for (const col of ALL_COLS) {
      const cell = displayCell(row, col.key).toLowerCase();
      const valueFilter = valueFilters[col.key];
      const conditionFilter = condFilters[col.key];
      if (valueFilter?.length && !valueFilter.some(value => value.toLowerCase() === cell)) return false;
      if (conditionFilter?.value) {
        const target = conditionFilter.value.toLowerCase();
        if (conditionFilter.op === 'Contains' && !cell.includes(target)) return false;
        if (conditionFilter.op === 'Does not contain' && cell.includes(target)) return false;
        if (conditionFilter.op === 'Equals' && cell !== target) return false;
        if (conditionFilter.op === 'Starts with' && !cell.startsWith(target)) return false;
        if (conditionFilter.op === 'Ends with' && !cell.endsWith(target)) return false;
      }
    }
    return true;
  }), [allRows, valueFilters, condFilters]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const comparison = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? comparison : -comparison;
    });
    return rows;
  }, [filtered, sortCol, sortDir]);

  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter = (key: ColKey) => (valueFilters[key]?.length ?? 0) > 0 || !!condFilters[key]?.value;
  const toggleColumn = (key: ColKey) => setVisibleCols(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  const handleSort = (field: ColKey) => { if (sortCol === field) setSortDir(dir => dir === 'asc' ? 'desc' : 'asc'); else { setSortCol(field); setSortDir('asc'); } setPage(1); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(prev => pageItems.every(row => prev.includes(row.id)) ? prev.filter(id => !pageItems.some(row => row.id === id)) : [...new Set([...prev, ...pageItems.map(row => row.id)])]);

  const downloadBlob = (blob: Blob, formatName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'claims.' + formatName.toLowerCase();
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = useCallback(async (formatName: string, selected: boolean) => {
    setExporting(true);
    setExportOpen(false);
    try {
      const blob = selected && selectedIds.length > 0
        ? await claimsApi.exportSelected(selectedIds, formatName.toLowerCase())
        : await claimsApi.export({ format: formatName.toLowerCase(), search });
      downloadBlob(blob, formatName);
    } finally {
      setExporting(false);
    }
  }, [selectedIds, search]);

  const SortIcon = ({ field }: { field: ColKey }) => sortCol === field ? <span style={{ marginLeft: 4, fontSize: 10, color: '#0B5AA0' }}>{sortDir === 'asc' ? '^' : 'v'}</span> : null;

  if (!perms.loaded) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>;
  if (!perms.view) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>You do not have permission to view Claims Inquiry.</div>;
  if (isError) return <div style={{ padding: 40, textAlign: 'center', color: '#c62828' }}>Failed to load claims. Please try again.</div>;

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Claims / Claims Inquiry</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>Claims Inquiry</h1>
          {perms.add && <button className="btn-primary" onClick={() => navigate('/claims/fnol')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}>+ New Claim</button>}
        </div>
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(140px, 1fr))', gap: 14, borderBottom: '1px solid #dfe5ec', paddingBottom: 14, marginBottom: 20 }}>
          <StatCard label="Total Claims" value={data.total}         color="#0B5AA0" iconType="document"   />
          <StatCard label="Open"         value={data.openCount}     color="#009765" iconType="hand"       />
          <StatCard label="Unassigned"   value={data.unassignedCount} color="#43a600" iconType="clipboard" />
          <StatCard label="Pending"      value={data.pendingCount}  color="#d89000" iconType="hand"       />
          <StatCard label="Referred"     value={data.referredCount} color="#e12b2b" iconType="hand"       />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, background: '#fff', borderRadius: 8, padding: '10px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
        <div style={{ position: 'relative', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, pointerEvents: 'none', lineHeight: 1 }}><SearchIcon /></span>
          <input value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Search by Keyword" style={{ paddingLeft: 32, paddingRight: 28, fontSize: 13, width: 280 }} />
          {searchInput && <button onClick={() => { setSearchInput(''); setSearch(''); }} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>x</button>}
        </div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{sorted.length} {sorted.length === 1 ? 'record' : 'records'}</span>
        <div style={{ flex: 1 }} />
        {perms.download && <div style={{ position: 'relative' }}><div style={{ display: 'flex', border: '1px solid #d1d5db', borderRadius: 6, overflow: 'hidden' }}><button className="btn-secondary" style={{ border: 'none', borderRadius: 0, padding: '7px 14px', fontSize: 13 }} onClick={() => handleExport('CSV', false)} disabled={exporting}>Download</button><button className="btn-secondary" style={{ border: 'none', borderLeft: '1px solid #d1d5db', borderRadius: 0, padding: '7px 8px', fontSize: 11 }} onClick={() => setExportOpen(open => !open)} disabled={exporting}>v</button></div>{exportOpen && <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 230 }}>{EXPORT_FORMATS.map(formatName => <div key={formatName} style={{ borderBottom: '1px solid #f3f4f6' }}><button className="btn-secondary" style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: 0, padding: '9px 14px', fontSize: 13 }} onClick={() => handleExport(formatName, false)}>Export All as .{formatName}</button>{selectedIds.length > 0 && <button className="btn-secondary" style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: 0, padding: '9px 14px', fontSize: 13, color: '#0B5AA0' }} onClick={() => handleExport(formatName, true)}>Export Selected ({selectedIds.length}) as .{formatName}</button>}</div>)}</div>}</div>}
      </div>

      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}><button onClick={event => { setModifyColsRect((event.currentTarget as HTMLElement).getBoundingClientRect()); setShowModifyCols(open => !open); }} title="Modify Columns" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, borderRadius: 4 }}><ColumnsIcon /></button>{showModifyCols && modifyColsRect && <ModifyColumnsPanel visibleCols={visibleCols} onToggle={toggleColumn} onClose={() => setShowModifyCols(false)} anchorRect={modifyColsRect} />}</th>
                <th style={{ width: 38, padding: '10px 8px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><input type="checkbox" checked={pageItems.length > 0 && pageItems.every(row => selectedIds.includes(row.id))} onChange={toggleAll} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} /></th>
                <th style={{ width: 90, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151' }}>Action</th>
                {renderedCols.map(col => <th key={col.key} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#374151', whiteSpace: 'nowrap', width: col.width, cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none', textAlign: col.align ?? 'left' }} onClick={() => col.sortable && handleSort(col.key)}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{col.label}{col.sortable && <SortIcon field={col.key} />}<span onClick={event => { event.stopPropagation(); const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); setFilterAnchorRects(prev => ({ ...prev, [col.key]: rect })); setOpenFilterCol(openFilterCol === col.key ? null : col.key); }} style={{ marginLeft: 4, cursor: 'pointer', color: hasFilter(col.key) ? '#0B5AA0' : '#9ca3af', display: 'inline-flex', alignItems: 'center' }} title="Filter"><FilterIcon active={hasFilter(col.key)} /></span></span>{openFilterCol === col.key && filterAnchorRects[col.key] && <ColumnFilterPopup col={col} allRows={allRows} valueFilter={valueFilters[col.key] ?? []} condFilter={condFilters[col.key]} onApplyValue={vals => { setValueFilters(prev => ({ ...prev, [col.key]: vals })); setPage(1); }} onApplyCondition={filter => { setCondFilters(prev => ({ ...prev, [col.key]: filter })); setPage(1); }} onClear={() => { setValueFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setCondFilters(prev => { const next = { ...prev }; delete next[col.key]; return next; }); setPage(1); }} onClose={() => setOpenFilterCol(null)} anchorRect={filterAnchorRects[col.key]!} />}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={3 + renderedCols.length} style={{ padding: 48, textAlign: 'center' }}><span className="spinner" /></td></tr> : pageItems.length === 0 ? <tr><td colSpan={3 + renderedCols.length} style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>{search ? 'No claims match your search.' : 'No claims found.'}</td></tr> : pageItems.map((claim, index) => <tr key={claim.id} style={{ borderBottom: '1px solid #f3f4f6', background: selectedIds.includes(claim.id) ? '#eff6ff' : index % 2 === 1 ? '#fafafa' : '#fff' }}><td style={{ padding: '10px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderRight: '1px solid #f3f4f6' }}>{(page - 1) * pageSize + index + 1}</td><td style={{ padding: '10px 8px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}><input type="checkbox" checked={selectedIds.includes(claim.id)} onChange={() => toggleSelect(claim.id)} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#0B5AA0' }} /></td><td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #f3f4f6' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><button onClick={() => navigate('/claims/workflow/' + claim.id)} title="View Workflow" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>{perms.edit && <button onClick={() => setAssignModal({ claimId: claim.id, isReassign: claim.isAssigned })} title={claim.isAssigned ? 'Reassign' : 'Assign'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: claim.isAssigned ? '#0B5AA0' : '#6b7280', padding: 4, borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}>{claim.isAssigned ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="m22 11-3 3-3-3"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}</button>}</div></td>{renderedCols.map(col => <td key={col.key} style={{ padding: '10px 12px', borderRight: '1px solid #f3f4f6', maxWidth: col.key === 'lossLocation' ? 240 : undefined, textAlign: col.align ?? 'left' }}>{col.key === 'claimNumber' ? <span style={{ color: '#0B5AA0', fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate('/claims/workflow/' + claim.id)}>{claim.claimNumber || '-'}</span> : col.key === 'claimStatus' ? <StatusBadge status={claim.claimStatus} /> : col.key === 'assignedTo' ? (claim.isAssigned ? <span style={{ color: '#2e7d32', fontWeight: 500 }}>{claim.assignedTo}</span> : <span style={{ color: '#e65100', fontStyle: 'italic' }}>Unassigned</span>) : col.key === 'aging' ? <span style={{ fontWeight: 600, color: claim.aging > 30 ? '#c62828' : claim.aging > 14 ? '#e65100' : '#333' }}>{claim.aging}</span> : col.key === 'lossLocation' ? <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240, color: '#6b7280' }}>{displayCell(claim, col.key)}</span> : <span style={{ color: '#374151' }}>{displayCell(claim, col.key)}</span>}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={pageSize} total={sorted.length} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>

      {assignModal && (
        <ClaimAssignModal
          claimId={assignModal.claimId}
          isReassign={assignModal.isReassign}
          onClose={() => setAssignModal(null)}
          onAssigned={() => {
            setAssignModal(null);
            queryClient.invalidateQueries({ queryKey: ['claims-enquiry'] });
          }}
        />
      )}
    </div>
  );
}

