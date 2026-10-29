// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// FNOL Registration - 4-step wizard
// Step 1: Policy Search > Step 2: Policy Information > Step 3: Loss Information > Step 4: Other Information
// Implements: BR-CLM-007 (auto-populate reporter), BR-CLM-010 (DRAFT claim resume), FR-001..FR-010
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';
import type {
  PolicySearchDto,
  ClaimCoverageSaveDto,
  ClaimantSaveDto,
  CreateOrUpdateClaimRequest,
  ClaimDocumentDto,
  CreateClaimDocumentRequest,
  ClaimReferenceDataDto,
  CoverageOptionDto,
} from '../types/Claim';
import { usePermissions } from '../contexts/PermissionContext';
import PaginationBar from '../components/PaginationBar';

// ─── Shared helpers ────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: '100%', padding: '8px 10px', border: '1px solid #d0d0d0',
  borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none',
  background: '#fff',
};
const SELECT: React.CSSProperties = { ...INPUT, cursor: 'pointer' };
const LABEL: React.CSSProperties = { fontSize: 12, color: '#555', fontWeight: 600, marginBottom: 4, display: 'block' };
const FIELD: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: 14 };
const REQUIRED: React.CSSProperties = { color: '#c62828', marginLeft: 2 };
const CARD: React.CSSProperties = {
  background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
  padding: '18px 20px', marginBottom: 16,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={FIELD}>
      <label style={LABEL}>{label}{required && <span style={REQUIRED}>*</span>}</label>
      {children}
    </div>
  );
}

function Row({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: '0 20px',
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 14, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
      {children}
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Policy', sub: 'Search' },
  { label: 'Policy', sub: 'Information' },
  { label: 'Loss', sub: 'Information' },
  { label: 'Other', sub: 'Information' },
];

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 28, padding: '0 20px' }}>
      {STEPS.map((s, idx) => {
        const num = idx + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={num} style={{ display: 'flex', alignItems: 'flex-start', flex: idx < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: active ? '#009765' : done ? '#009765' : 'transparent',
                border: active || done ? 'none' : '2px solid #bbb',
                color: active || done ? '#fff' : '#aaa',
              }}>
                {num}
              </div>
              <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#009765' : '#888' }}>{s.label}</div>
                <div style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#009765' : '#888' }}>{s.sub}</div>
              </div>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{ flex: 1, borderTop: '1.5px dashed #ccc', marginTop: 14, marginLeft: 4, marginRight: 4 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Accordion ───────────────────────────────────────────────────────────────

// ─── Step 2 Accordion (with View Details button) ──────────────────────────────

function Step2Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: '#fff', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #374151',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 700, color: '#374151', flexShrink: 0, lineHeight: 1,
          }}>
            {open ? '−' : '+'}
          </span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{title}</span>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          style={{
            padding: '6px 16px', border: '1px solid #0B5AA0', borderRadius: 6,
            background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          View Details
        </button>
      </div>
      {open && <div style={{ padding: '20px 18px', borderTop: '1px solid #e8e8e8' }}>{children}</div>}
    </div>
  );
}

// ─── Step 2 detail field (label above, value below) ───────────────────────────

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{value || '-'}</div>
    </div>
  );
}

// ─── Step 1 helpers ──────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#1565c0','#00695c','#1b5e20','#6a1b9a','#e65100','#880e4f','#0277bd','#2e7d32'];
function avatarColor(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return AVATAR_COLORS[h % AVATAR_COLORS.length]; }
function initials(name: string) { return name.trim().split(/\s+/).map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase(); }

function Avatar({ name }: { name: string }) {
  const bg = avatarColor(name);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: bg, color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0, marginRight: 7 }}>
      {initials(name)}
    </span>
  );
}

type PolicyColKey = 'policyNumber' | 'insuredName' | 'address' | 'effectiveDate' | 'lob' | 'status' | 'isClaim';

interface PolicyColDef { key: PolicyColKey; label: string; locked?: boolean; sortable?: boolean; }

const POLICY_COLS: PolicyColDef[] = [
  { key: 'policyNumber',  label: 'Policy No',      sortable: true },
  { key: 'insuredName',   label: 'Insured Name',   sortable: true },
  { key: 'address',       label: 'Address',         sortable: false },
  { key: 'effectiveDate', label: 'Effective Date',  sortable: true },
  { key: 'lob',           label: 'LOB',             sortable: true },
  { key: 'status',        label: 'Status',          sortable: true },
  { key: 'isClaim',       label: 'IsClaim',         sortable: false },
];

const DEFAULT_VISIBLE: Set<PolicyColKey> = new Set(['policyNumber', 'insuredName', 'address', 'effectiveDate', 'status']);

const COND_OPS = ['(not set)', 'Contains', 'Does not contain', 'Equals', 'Starts with', 'Ends with'];

interface PolicyValueFilter { type: 'value'; vals: string[] }
interface PolicyCondFilter  { type: 'cond'; op1: string; val1: string; combinator: 'And' | 'Or'; op2: string; val2: string }
type PolicyColFilter = PolicyValueFilter | PolicyCondFilter;

function useOutsideClick2(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, cb]);
}

function FnolFilterPopup({ col, allRows, current, onApply, onClear, onClose, anchor }: {
  col: { key: string };
  allRows: { [k: string]: string | undefined }[];
  current: PolicyColFilter | undefined;
  onApply: (f: PolicyColFilter) => void;
  onClear: () => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const initTab = current?.type === 'cond' ? 'cond' : 'value';
  const [tab, setTab] = useState<'cond' | 'value'>(initTab);
  const [search, setSearch] = useState('');
  const initVals = current?.type === 'value' ? current.vals : [];
  const [selected, setSelected] = useState<string[]>(initVals);
  const [op1, setOp1] = useState(current?.type === 'cond' ? current.op1 : '(not set)');
  const [val1, setVal1] = useState(current?.type === 'cond' ? current.val1 : '');
  const [combo, setCombo] = useState<'And' | 'Or'>(current?.type === 'cond' ? current.combinator : 'And');
  const [op2, setOp2] = useState(current?.type === 'cond' ? current.op2 : '(not set)');
  const [val2, setVal2] = useState(current?.type === 'cond' ? current.val2 : '');
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick2(ref, onClose);

  const allVals = useMemo(() => Array.from(new Set(allRows.map(r => (r[col.key] ?? '-').toString()))).sort(), [allRows, col.key]);
  const visible = allVals.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const allChecked = visible.length > 0 && visible.every(v => selected.includes(v));

  const style: React.CSSProperties = {
    position: 'fixed', top: anchor.bottom + 2, left: anchor.left,
    zIndex: 9999, background: '#fff', border: '1px solid #d1d5db',
    borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', minWidth: 300, maxWidth: 380,
  };

  const btnPrimary: React.CSSProperties = { padding: '8px 20px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const btnSecondary: React.CSSProperties = { padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, cursor: 'pointer' };

  return (
    <div ref={ref} style={style} onClick={e => e.stopPropagation()}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        {(['cond', 'value'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 0', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0B5AA0' : '#6b7280', borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent', cursor: 'pointer' }}>
            {t === 'cond' ? 'Filter by Condition' : 'Filter by Value'}
          </button>
        ))}
      </div>

      {tab === 'cond' ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#374151' }}>Show items where the value</div>
          <select value={op1} onChange={e => setOp1(e.target.value)} style={{ fontSize: 13, padding: '7px 8px', border: '1px solid #0B5AA0', borderRadius: 4 }}>
            {COND_OPS.map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={val1} onChange={e => setVal1(e.target.value)} style={{ fontSize: 13, padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {(['And', 'Or'] as const).map(c => (
              <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={combo === c} onChange={() => setCombo(c)} style={{ accentColor: '#0B5AA0' }} />
                {c}
              </label>
            ))}
          </div>
          <select value={op2} onChange={e => setOp2(e.target.value)} style={{ fontSize: 13, padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 4 }}>
            {COND_OPS.map(o => <option key={o}>{o}</option>)}
          </select>
          <input value={val2} onChange={e => setVal2(e.target.value)} style={{ fontSize: 13, padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 4 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button style={btnPrimary} onClick={() => { onApply({ type: 'cond', op1, val1, combinator: combo, op2, val2 }); onClose(); }}>Apply</button>
            <button style={btnSecondary} onClick={onClose}>Cancel</button>
            <button style={btnSecondary} onClick={() => { onClear(); onClose(); }}>Clear</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '10px 12px 6px' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" style={{ fontSize: 13, padding: '7px 10px', width: '100%', border: '1px solid #d1d5db', borderRadius: 4 }} />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, background: allChecked ? '#dbeafe' : 'transparent' }}>
              <input type="checkbox" checked={allChecked} onChange={() => setSelected(allChecked ? selected.filter(v => !visible.includes(v)) : [...new Set([...selected, ...visible])])} style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
              Select All
            </label>
            {visible.map(v => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, background: selected.includes(v) ? '#dbeafe' : 'transparent' }}>
                <input type="checkbox" checked={selected.includes(v)} onChange={() => setSelected(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
                {v}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #f3f4f6' }}>
            <button style={btnPrimary} onClick={() => { onApply({ type: 'value', vals: selected }); onClose(); }}>Apply</button>
            <button style={btnSecondary} onClick={onClose}>Cancel</button>
            <button style={btnSecondary} onClick={() => { setSelected([]); onClear(); onClose(); }}>Clear</button>
          </div>
        </>
      )}
    </div>
  );
}

function FnolModifyColumnsPanel({ visible, onToggle, onClose, anchor }: {
  visible: Set<PolicyColKey>;
  onToggle: (k: PolicyColKey) => void;
  onClose: () => void;
  anchor: DOMRect;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick2(ref, onClose);
  return (
    <div ref={ref} style={{ position: 'fixed', top: anchor.bottom + 2, left: anchor.left, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.15)', width: 260 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 13, color: '#111827' }}>Modify Columns Display</div>
      <div style={{ padding: '6px 0', maxHeight: 340, overflowY: 'auto' }}>
        <div style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.5 }}>
          <input type="checkbox" checked disabled style={{ width: 14, height: 14, accentColor: '#0B5AA0' }} />
          <span style={{ fontSize: 13, color: '#374151' }}>Action</span>
        </div>
        {POLICY_COLS.map(col => (
          <label key={col.key} style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: visible.has(col.key) ? '#eff6ff' : 'transparent' }}>
            <input type="checkbox" checked={visible.has(col.key)} onChange={() => onToggle(col.key)} style={{ width: 14, height: 14, accentColor: '#0B5AA0' }} />
            <span style={{ fontSize: 13, color: visible.has(col.key) ? '#0B5AA0' : '#374151' }}>{col.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function applyCellFilter(value: string, filter: PolicyColFilter): boolean {
  const v = value.toLowerCase();
  if (filter.type === 'value') return filter.vals.length === 0 || filter.vals.map(x => x.toLowerCase()).includes(v);
  const check = (op: string, val: string) => {
    if (op === '(not set)' || !val) return true;
    const t = val.toLowerCase();
    if (op === 'Contains') return v.includes(t);
    if (op === 'Does not contain') return !v.includes(t);
    if (op === 'Equals') return v === t;
    if (op === 'Starts with') return v.startsWith(t);
    if (op === 'Ends with') return v.endsWith(t);
    return true;
  };
  const r1 = check(filter.op1, filter.val1);
  const r2 = check(filter.op2, filter.val2);
  return filter.combinator === 'And' ? r1 && r2 : r1 || r2;
}

// ─── Step 1: Policy Search ────────────────────────────────────────────────────

interface Step1Props {
  onNext: (policy: PolicySearchDto) => void;
  onCancel: () => void;
}

function Step1PolicySearch({ onNext, onCancel }: Step1Props) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPolicyId, setSelectedPolicyId] = useState<number | null>(null);
  const [modalPolicy, setModalPolicy] = useState<PolicySearchDto | null>(null);

  // Column visibility — hamburger lives in the table header <th>
  const [visibleCols, setVisibleCols] = useState<Set<PolicyColKey>>(new Set(DEFAULT_VISIBLE));
  const [modifyColsAnchor, setModifyColsAnchor] = useState<DOMRect | null>(null);
  const modifyBtnRef = useRef<HTMLButtonElement>(null);

  // Main table column filters
  const [colFilters, setColFilters] = useState<Partial<Record<PolicyColKey, PolicyColFilter>>>({});
  const [filterPopup, setFilterPopup] = useState<{ col: { key: string }; anchor: DOMRect } | null>(null);

  // Modal table filters (FNOL In Progress + Existing Claims)
  const [inProgressFilters, setInProgressFilters] = useState<Record<string, PolicyColFilter>>({});
  const [existingFilters, setExistingFilters]     = useState<Record<string, PolicyColFilter>>({});
  const [modalFilterPopup, setModalFilterPopup]   = useState<{ tableId: 'ip' | 'ex'; col: { key: string }; anchor: DOMRect } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchText); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, isLoading } = useQuery({
    queryKey: ['fnol-policy-search', debouncedSearch, page, pageSize],
    queryFn: () => claimsApi.searchPolicies({ search: debouncedSearch || undefined, page, pageSize }),
  });

  const { data: modalData, isLoading: modalLoading } = useQuery({
    queryKey: ['fnol-policy-claims', modalPolicy?.id],
    queryFn: () => claimsApi.getPolicyClaims(modalPolicy!.id),
    enabled: !!modalPolicy,
  });

  const deleteMutation = useMutation({ mutationFn: (id: number) => claimsApi.deleteDraft(id) });
  const queryClient = useQueryClient();

  // Clicking radio opens modal immediately
  function handleSelectPolicy(policy: PolicySearchDto) {
    setSelectedPolicyId(policy.id);
    setModalPolicy(policy);
    setInProgressFilters({});
    setExistingFilters({});
  }

  function handleModalNext() { if (modalPolicy) onNext(modalPolicy); }

  function handleResumeEdit(claimId: number) {
    setModalPolicy(null);
    navigate(`/claims/fnol/${claimId}`);
  }

  function handleDeleteDraft(claimId: number) {
    if (confirm('Delete this in-progress FNOL?')) {
      deleteMutation.mutate(claimId, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fnol-policy-claims', modalPolicy?.id] }),
      });
    }
  }

  function toggleCol(k: PolicyColKey) {
    setVisibleCols(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }

  const allRows = useMemo(
    () => (data?.items ?? []).map(p => ({ policyNumber: p.policyNumber, insuredName: p.insuredName, address: p.address ?? '-', effectiveDate: p.effectiveDate ?? '-', lob: p.lob ?? '-', status: p.status ?? '-', isClaim: '' })),
    [data]
  );

  const ipAllRows = useMemo(() =>
    (modalData?.inProgress ?? []).map(c => ({ dateOfLoss: c.dateOfLoss || '-', insuredName: c.insuredName || '-', lob: c.lob || '-' })),
    [modalData]
  );
  const exAllRows = useMemo(() =>
    (modalData?.existing ?? []).map(c => ({ dateOfLoss: c.dateOfLoss || '-', claimNumber: c.claimNumber || '-', insuredName: c.insuredName || '-', claimantName: c.claimantName || '-', lob: c.lob || '-', claimStatus: c.claimStatus || '-' })),
    [modalData]
  );

  const displayItems = useMemo(() => {
    let items = data?.items ?? [];
    for (const [key, filter] of Object.entries(colFilters) as [PolicyColKey, PolicyColFilter][]) {
      if (!filter) continue;
      items = items.filter(p => applyCellFilter(String((p as unknown as Record<string, unknown>)[key] ?? '-'), filter));
    }
    return items;
  }, [data, colFilters]);

  const filteredInProgress = useMemo(() => {
    if (!modalData?.inProgress) return [];
    return modalData.inProgress.filter(c => {
      const row: Record<string, string> = { dateOfLoss: c.dateOfLoss || '-', insuredName: c.insuredName || '-', lob: c.lob || '-' };
      return Object.entries(inProgressFilters).every(([k, f]) => applyCellFilter(row[k] ?? '-', f));
    });
  }, [modalData, inProgressFilters]);

  const filteredExisting = useMemo(() => {
    if (!modalData?.existing) return [];
    return modalData.existing.filter(c => {
      const row: Record<string, string> = { dateOfLoss: c.dateOfLoss || '-', claimNumber: c.claimNumber || '-', insuredName: c.insuredName || '-', claimantName: c.claimantName || '-', lob: c.lob || '-', claimStatus: c.claimStatus || '-' };
      return Object.entries(existingFilters).every(([k, f]) => applyCellFilter(row[k] ?? '-', f));
    });
  }, [modalData, existingFilters]);

  const visibleColDefs = POLICY_COLS.filter(c => visibleCols.has(c.key));
  const activeFilterCount = Object.keys(colFilters).length;
  const colSpan = visibleColDefs.length + 2; // ≡ (with row#) + Action

  const thStyle: React.CSSProperties = { padding: '10px 8px', textAlign: 'left', fontWeight: 600, fontSize: 13, color: '#374151', background: '#f3f4f6', userSelect: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb' };
  const mthStyle: React.CSSProperties = { padding: '9px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };

  const FunnelSvg = ({ active }: { active: boolean }) => (
    <svg width="11" height="11" viewBox="0 0 12 12" fill={active ? '#0B5AA0' : '#9ca3af'}>
      <path d="M1 2h10L7 6.5V10L5 11V6.5L1 2z"/>
    </svg>
  );

  const HamburgerSvg = () => (
    <svg width="13" height="10" viewBox="0 0 16 12" fill="currentColor">
      <rect x="0" y="0" width="16" height="2" rx="1"/>
      <rect x="0" y="5" width="16" height="2" rx="1"/>
      <rect x="0" y="10" width="16" height="2" rx="1"/>
    </svg>
  );

  function mainFilterBtn(colKey: PolicyColKey) {
    const active = !!colFilters[colKey];
    return (
      <button
        onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setFilterPopup(fp => fp?.col.key === colKey ? null : { col: { key: colKey }, anchor: rect }); setModalFilterPopup(null); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', marginLeft: 4, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        title="Filter"
      >
        <FunnelSvg active={active} />
      </button>
    );
  }

  function modalFilterBtn(tableId: 'ip' | 'ex', colKey: string) {
    const active = !!(tableId === 'ip' ? inProgressFilters : existingFilters)[colKey];
    return (
      <button
        onClick={e => { e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setModalFilterPopup(fp => (fp?.col.key === colKey && fp.tableId === tableId) ? null : { tableId, col: { key: colKey }, anchor: rect }); setFilterPopup(null); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', marginLeft: 4, display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
        title="Filter"
      >
        <FunnelSvg active={active} />
      </button>
    );
  }

  return (
    <div>
      {/* Section title + search bar (no hamburger here — it's in the table header) */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Search and Select Policy</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
            </span>
            <input type="text" placeholder="Search by Policy No., Insured Name, or Address..." value={searchText} onChange={e => setSearchText(e.target.value)} style={{ ...INPUT, paddingLeft: 32, width: '100%' }} />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => setColFilters({})} style={{ padding: '8px 14px', border: '1px solid #f87171', borderRadius: 4, background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          {data && <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{data.total} record{data.total !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      {/* Table — hamburger ≡ is the first <th> */}
      <div style={{ ...CARD, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {/* ≡ hamburger in table header — body cells show row number */}
                <th style={{ ...thStyle, width: 44, padding: 0, textAlign: 'center' }}>
                  <button
                    ref={modifyBtnRef}
                    onClick={() => setModifyColsAnchor(a => a ? null : modifyBtnRef.current!.getBoundingClientRect())}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                    title="Modify Columns"
                  >
                    <HamburgerSvg />
                  </button>
                </th>
                <th style={{ ...thStyle, width: 56 }}>Action</th>
                {visibleColDefs.map(col => (
                  <th key={col.key} style={thStyle}>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <span>{col.label}</span>
                      {mainFilterBtn(col.key)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={colSpan} style={{ padding: 32, textAlign: 'center', color: '#888' }}>Loading...</td></tr>
              ) : !displayItems.length ? (
                <tr><td colSpan={colSpan} style={{ padding: 48, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No Data Available</td></tr>
              ) : displayItems.map((p, idx) => (
                <tr
                  key={p.id}
                  onClick={() => handleSelectPolicy(p)}
                  style={{ borderBottom: '1px solid #f0f0f0', background: selectedPolicyId === p.id ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                >
                  <td style={{ padding: '9px 8px', textAlign: 'center', color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{(page - 1) * pageSize + idx + 1}</td>
                  <td style={{ padding: '9px 10px' }}>
                    <input
                      type="radio"
                      name="policy-select"
                      checked={selectedPolicyId === p.id}
                      onChange={() => handleSelectPolicy(p)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer', accentColor: '#0B5AA0' }}
                    />
                  </td>
                  {visibleColDefs.map(col => {
                    if (col.key === 'insuredName') return (
                      <td key={col.key} style={{ padding: '9px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar name={p.insuredName || '?'} />
                          <span style={{ fontWeight: 500 }}>{p.insuredName}</span>
                        </div>
                      </td>
                    );
                    if (col.key === 'status') return (
                      <td key={col.key} style={{ padding: '9px 10px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: p.status === 'Active' ? '#dcfce7' : '#f3f4f6', color: p.status === 'Active' ? '#16a34a' : '#6b7280' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'Active' ? '#16a34a' : '#9ca3af', flexShrink: 0 }} />
                          {p.status || '-'}
                        </span>
                      </td>
                    );
                    if (col.key === 'policyNumber') return (
                      <td key={col.key} style={{ padding: '9px 10px' }}>
                        <span style={{ color: '#0B5AA0', fontWeight: 600, cursor: 'pointer' }}>{p.policyNumber}</span>
                      </td>
                    );
                    const val = (p as unknown as Record<string, unknown>)[col.key];
                    return <td key={col.key} style={{ padding: '9px 10px', color: '#374151' }}>{String(val ?? '-')}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
        <button onClick={onCancel} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
        <button
          onClick={() => { const p = displayItems.find(x => x.id === selectedPolicyId); if (p) handleSelectPolicy(p); }}
          disabled={!selectedPolicyId}
          style={{ padding: '9px 22px', border: 'none', borderRadius: 6, background: selectedPolicyId ? '#0B5AA0' : '#e5e7eb', color: selectedPolicyId ? '#fff' : '#9ca3af', fontSize: 13, fontWeight: 600, cursor: selectedPolicyId ? 'pointer' : 'default' }}
        >
          Next
        </button>
      </div>

      {/* Main table column filter popup */}
      {filterPopup && (
        <FnolFilterPopup
          col={filterPopup.col}
          allRows={allRows}
          current={colFilters[filterPopup.col.key as PolicyColKey]}
          onApply={f => setColFilters(prev => ({ ...prev, [filterPopup.col.key]: f }))}
          onClear={() => setColFilters(prev => { const n = { ...prev }; delete n[filterPopup.col.key as PolicyColKey]; return n; })}
          onClose={() => setFilterPopup(null)}
          anchor={filterPopup.anchor}
        />
      )}

      {/* Modify columns panel anchored to the ≡ <th> button */}
      {modifyColsAnchor && (
        <FnolModifyColumnsPanel visible={visibleCols} onToggle={toggleCol} onClose={() => setModifyColsAnchor(null)} anchor={modifyColsAnchor} />
      )}

      {/* Modal table filter popup (shared for both FNOL In Progress + Existing Claims) */}
      {modalFilterPopup && (
        <FnolFilterPopup
          col={modalFilterPopup.col}
          allRows={modalFilterPopup.tableId === 'ip' ? ipAllRows : exAllRows}
          current={(modalFilterPopup.tableId === 'ip' ? inProgressFilters : existingFilters)[modalFilterPopup.col.key]}
          onApply={f => {
            const key = modalFilterPopup.col.key; const tid = modalFilterPopup.tableId;
            if (tid === 'ip') setInProgressFilters(prev => ({ ...prev, [key]: f }));
            else setExistingFilters(prev => ({ ...prev, [key]: f }));
            setModalFilterPopup(null);
          }}
          onClear={() => {
            const key = modalFilterPopup.col.key; const tid = modalFilterPopup.tableId;
            if (tid === 'ip') setInProgressFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
            else setExistingFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
            setModalFilterPopup(null);
          }}
          onClose={() => setModalFilterPopup(null)}
          anchor={modalFilterPopup.anchor}
        />
      )}

      {/* Claims for Policy Modal */}
      {modalPolicy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 10, width: '100%', maxWidth: 860, maxHeight: '84vh', overflow: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Claims for Policy {modalPolicy.policyNumber}</div>
              <button onClick={() => setModalPolicy(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
              ) : (
                <>
                  {/* FNOL In Progress */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>FNOL In Progress</div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ ...mthStyle, width: 32, padding: '9px 6px', textAlign: 'center' }}>
                              <HamburgerSvg />
                            </th>
                            <th style={mthStyle}>Action</th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Date of Loss{modalFilterBtn('ip', 'dateOfLoss')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Insured Name{modalFilterBtn('ip', 'insuredName')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>LOB{modalFilterBtn('ip', 'lob')}</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {!filteredInProgress.length ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>No Data Available</td></tr>
                          ) : filteredInProgress.map((c, idx) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px 6px', textAlign: 'center', color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => handleResumeEdit(c.id)} title="Edit / Resume" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B5AA0', padding: 2 }}>
                                    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                                  </button>
                                  <button onClick={() => handleDeleteDraft(c.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}>
                                    <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                  </button>
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px' }}>{c.dateOfLoss || '-'}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar name={c.insuredName || '?'} />
                                  {c.insuredName}
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px' }}>{c.lob}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Existing Claims */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Existing Claims</div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr>
                            <th style={{ ...mthStyle, width: 32, padding: '9px 6px', textAlign: 'center' }}>
                              <HamburgerSvg />
                            </th>
                            <th style={mthStyle}>Date of Loss</th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Claim No.{modalFilterBtn('ex', 'claimNumber')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Insured Name{modalFilterBtn('ex', 'insuredName')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Claimant Name{modalFilterBtn('ex', 'claimantName')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>LOB{modalFilterBtn('ex', 'lob')}</span></th>
                            <th style={mthStyle}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Claim Status{modalFilterBtn('ex', 'claimStatus')}</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {!filteredExisting.length ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>No Data Available</td></tr>
                          ) : filteredExisting.map((c, idx) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '8px 6px', textAlign: 'center', color: '#6b7280', fontSize: 12, fontWeight: 500 }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px' }}>{c.dateOfLoss || '-'}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0B5AA0' }}>{c.claimNumber}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar name={c.insuredName || '?'} />
                                  {c.insuredName}
                                </div>
                              </td>
                              <td style={{ padding: '8px 10px' }}>{c.claimantName || '-'}</td>
                              <td style={{ padding: '8px 10px' }}>{c.lob}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ padding: '2px 9px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>{c.claimStatus}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setModalPolicy(null)} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleModalNext} style={{ padding: '9px 22px', border: 'none', borderRadius: 6, background: '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Policy Information ───────────────────────────────────────────────

interface Step2Form {
  isClaimReportedByInsured: boolean;
  reporterFirstName: string;
  reporterLastName: string;
  reporterRelationship: string;
  reporterTelephone: string;
  reporterTelephoneCC: string;
  reporterEmail: string;
}

interface Step2Props {
  policyId: number;
  refData: ClaimReferenceDataDto;
  form: Step2Form;
  onChange: (f: Step2Form) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function Step2PolicyInformation({ policyId, refData, form, onChange, onNext, onPrev, onSave, onCancel, saving }: Step2Props) {
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    if (form.isClaimReportedByInsured) { setErrors({}); return true; }
    const errs: Record<string, string> = {};
    if (!form.reporterFirstName.trim())    errs.reporterFirstName    = 'Provide First Name to Continue';
    if (!form.reporterLastName.trim())     errs.reporterLastName     = 'Provide Last Name to Continue';
    if (!form.reporterRelationship.trim()) errs.reporterRelationship = 'Provide Relationship with Insured to continue';
    if (!form.reporterTelephone.trim())    errs.reporterTelephone    = 'Provide Telephone Number to continue';
    if (!form.reporterEmail.trim())        errs.reporterEmail        = 'Provide Email ID to continue';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }
  const { data: policyDetails, isLoading } = useQuery({
    queryKey: ['fnol-policy-details', policyId],
    queryFn: () => claimsApi.getPolicyDetails(policyId),
  });

  function set<K extends keyof Step2Form>(k: K, v: Step2Form[K]) {
    onChange({ ...form, [k]: v });
  }

  const insured = policyDetails?.insured;
  const risk = policyDetails?.riskLocation;
  const additionalInsureds = policyDetails?.additionalInsureds ?? [];
  const additionalOrganisations = policyDetails?.additionalOrganisations ?? [];

  const geoString = (risk?.latitude && risk?.longitude)
    ? `GEO: ${risk.latitude}, ${risk.longitude}`
    : null;

  const S2_TH: React.CSSProperties = {
    padding: '9px 10px', textAlign: 'left', fontWeight: 600, fontSize: 12,
    color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
  };

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading policy details...</div>;

  return (
    <div>
      {/* Toggle row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '4px 0' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
          <span style={{ color: '#c62828', marginRight: 3 }}>*</span>
          Was the claim reported by the Insured?
        </span>
        <label style={{ position: 'relative', display: 'inline-block', width: 46, height: 25, flexShrink: 0, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.isClaimReportedByInsured}
            onChange={e => { set('isClaimReportedByInsured', e.target.checked); if (e.target.checked) setErrors({}); }}
            style={{ opacity: 0, width: 0, height: 0 }}
          />
          <span style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: form.isClaimReportedByInsured ? '#0B5AA0' : '#ccc',
            borderRadius: 25, transition: '0.2s',
          }}>
            <span style={{
              position: 'absolute', height: 19, width: 19,
              left: form.isClaimReportedByInsured ? 24 : 3, bottom: 3,
              background: '#fff', borderRadius: '50%', transition: '0.2s',
            }} />
          </span>
        </label>
      </div>

      {/* Claim Reporter Details — only when NOT reported by insured */}
      {!form.isClaimReportedByInsured && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>Claim Reporter Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 16px' }}>
            <div>
              <Field label="First Name" required>
                <input style={{ ...INPUT, ...(errors.reporterFirstName ? { borderColor: '#c62828' } : {}) }} value={form.reporterFirstName} onChange={e => set('reporterFirstName', e.target.value)} />
              </Field>
              {errors.reporterFirstName && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#c62828' }}><span>⊙</span>{errors.reporterFirstName}</div>}
            </div>
            <div>
              <Field label="Last Name" required>
                <input style={{ ...INPUT, ...(errors.reporterLastName ? { borderColor: '#c62828' } : {}) }} value={form.reporterLastName} onChange={e => set('reporterLastName', e.target.value)} />
              </Field>
              {errors.reporterLastName && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#c62828' }}><span>⊙</span>{errors.reporterLastName}</div>}
            </div>
            <div>
              <Field label="Relationship with Insured" required>
                <select style={{ ...SELECT, ...(errors.reporterRelationship ? { borderColor: '#c62828' } : {}) }} value={form.reporterRelationship} onChange={e => set('reporterRelationship', e.target.value)}>
                  <option value="">Select...</option>
                  {(refData.relationshipTypes?.length ? refData.relationshipTypes : ['No Prior Relationship', 'Self', 'Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Employer', 'Employee', 'Other']).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              {errors.reporterRelationship && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#c62828' }}><span>⊙</span>{errors.reporterRelationship}</div>}
            </div>
            <div>
              <Field label="Telephone Number" required>
                <div style={{ display: 'flex', border: `1px solid ${errors.reporterTelephone ? '#c62828' : '#d0d0d0'}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', borderRight: '1px solid #d0d0d0', background: '#f9fafb', gap: 4, flexShrink: 0 }}>
                    <span style={{ fontSize: 16 }}>🇺🇸</span>
                    <span style={{ fontSize: 10, color: '#666' }}>▾</span>
                  </div>
                  <input
                    style={{ ...INPUT, border: 'none', borderRadius: 0, flex: 1, minWidth: 0 }}
                    placeholder="(###) ###-####"
                    value={form.reporterTelephone}
                    onChange={e => set('reporterTelephone', e.target.value)}
                  />
                </div>
              </Field>
              {errors.reporterTelephone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#c62828' }}><span>⊙</span>{errors.reporterTelephone}</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 16px' }}>
            <div>
              <Field label="Email" required>
                <input style={{ ...INPUT, ...(errors.reporterEmail ? { borderColor: '#c62828' } : {}) }} type="email" value={form.reporterEmail} onChange={e => set('reporterEmail', e.target.value)} />
              </Field>
              {errors.reporterEmail && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: '#c62828' }}><span>⊙</span>{errors.reporterEmail}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Insured Details accordion */}
      <Step2Accordion title="Insured Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 24px' }}>
          <DetailField label="Customer ID" value={insured?.customerId} />
          <DetailField label="First Name" value={insured?.firstName} />
          <DetailField label="Middle Name / Initial" value={insured?.middleName} />
          <DetailField label="Last Name" value={insured?.lastName} />
          <DetailField label="Address Line 1" value={insured?.addressLine1} />
          <DetailField label="Address Line 2" value={insured?.addressLine2} />
          <DetailField label="Country" value={insured?.country} />
          <DetailField label="State" value={insured?.state} />
          <DetailField label="City" value={insured?.city} />
          <DetailField label="County" value={insured?.county} />
          <DetailField label="Zip Code" value={insured?.zipCode} />
          <DetailField label="Telephone Number" value={insured?.telephone} />
          <DetailField label="Extension" value={insured?.telephoneExt} />
          <DetailField label="Alternate Telephone No" value={insured?.alternateTelephone} />
          <DetailField label="Email ID" value={insured?.email} />
        </div>

        {/* Additional Named Insured(s) */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Additional Named Insured(s)</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...S2_TH, width: 36, textAlign: 'center' }}>≡</th>
                  <th style={S2_TH}>Name</th>
                  <th style={S2_TH}>Relationship</th>
                  <th style={S2_TH}>Telephone Number</th>
                  <th style={S2_TH}>Alternative Telephone Number</th>
                  <th style={S2_TH}>Email ID</th>
                  <th style={S2_TH}>Insured Type</th>
                  <th style={S2_TH}>DBA Name</th>
                </tr>
              </thead>
              <tbody>
                {additionalInsureds.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>No Data Available</td>
                  </tr>
                ) : additionalInsureds.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#6b7280' }}>≡</td>
                    <td style={{ padding: '9px 10px' }}>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.relationship || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.telephoneNumber || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.alternateTelephoneNumber || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.email || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.insuredType || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.dbaName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Organizations */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Additional Organizations</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...S2_TH, width: 36, textAlign: 'center' }}>≡</th>
                  <th style={S2_TH}>Org Name</th>
                  <th style={S2_TH}>Org Type</th>
                  <th style={S2_TH}>Telephone Number</th>
                  <th style={S2_TH}>Extension</th>
                  <th style={S2_TH}>Alternative Telephone Number</th>
                  <th style={S2_TH}>Email ID</th>
                  <th style={S2_TH}>Contact Name</th>
                </tr>
              </thead>
              <tbody>
                {additionalOrganisations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>No Data Available</td>
                  </tr>
                ) : additionalOrganisations.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '9px 10px', textAlign: 'center', color: '#6b7280' }}>≡</td>
                    <td style={{ padding: '9px 10px' }}>{row.organisationName || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.organisationType || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.telephoneNumber || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.extension ?? '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.alternateTelephoneNumber || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{row.email || '-'}</td>
                    <td style={{ padding: '9px 10px' }}>{[row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Step2Accordion>

      {/* Policy Details accordion */}
      <Step2Accordion title="Policy Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 24px' }}>
          <DetailField label="Policy No" value={policyDetails?.policyNumber} />
          <DetailField label="Line of Business (LOB)" value={policyDetails?.lob} />
          <DetailField label="Sub-Product" value={policyDetails?.subProduct} />
          <DetailField label="Insurance Type" value={policyDetails?.insuranceType} />
          <DetailField label="Coverage Level" value={policyDetails?.coverageLevel} />
          <DetailField label="Policy Period From" value={policyDetails?.effectiveDate} />
          <DetailField label="Policy Period To" value={policyDetails?.expiryDate} />
          <DetailField label="Policy Status" value={policyDetails?.status} />
          <DetailField label="Deductible" value={policyDetails?.deductible} />
        </div>
      </Step2Accordion>

      {/* Risk Details accordion */}
      <Step2Accordion title="Risk Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0 24px' }}>
          <DetailField label="Property Location With GEO" value={geoString} />
          <DetailField label="Occupancy Type" value={risk?.occupancyType} />
          <DetailField label="Construction Type" value={risk?.constructionType} />
          <DetailField label="Age of Property" value={risk?.ageOfProperty} />
          <DetailField label="Length of Occupancy" value={risk?.lengthOfOccupancy} />
          <DetailField label="Roof Type" value={risk?.roofType} />
          <DetailField label="Fire Protection Class" value={risk?.fireProtectionClass} />
        </div>
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, marginTop: 4 }}>
          <DetailField label="Loss Location" value={risk?.propertyLocation} />
        </div>
      </Step2Accordion>

      {/* Footer: Cancel | Previous (left) — Save | Next (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={onPrev} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Previous</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', color: '#374151', fontSize: 13, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleNext} disabled={saving} style={{ padding: '9px 22px', border: 'none', borderRadius: 7, background: saving ? '#90caf9' : '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coverage Grid Row ────────────────────────────────────────────────────────

interface CoverageRow extends ClaimCoverageSaveDto {
  _key: number;
}

function CoverageGridRow({ row, coverageTypes, causesOfLoss, onUpdate, onRemove, canRemove, disabled }: {
  row: CoverageRow;
  coverageTypes: CoverageOptionDto[];
  causesOfLoss: CoverageOptionDto[];
  onUpdate: (patch: Partial<CoverageRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
}) {
  const [assets, setAssets] = useState<string[]>([]);

  useEffect(() => {
    if (!row.coverageId) { setAssets([]); return; }
    claimsApi.getImpactedAssetsForCoverage(row.coverageId).then(setAssets).catch(() => setAssets([]));
  }, [row.coverageId]);

  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '8px 10px' }}>
        <select
          disabled={disabled}
          style={{ ...SELECT, minWidth: 140, opacity: disabled ? 0.5 : 1 }}
          value={row.coverageId ?? ''}
          onChange={e => onUpdate({ coverageId: e.target.value ? Number(e.target.value) : null, assetType: null })}
        >
          <option value="">Select...</option>
          {coverageTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 10px' }}>
        <select
          disabled={disabled}
          style={{ ...SELECT, minWidth: 140, opacity: disabled ? 0.5 : 1 }}
          value={row.causeOfLossId ?? ''}
          onChange={e => onUpdate({ causeOfLossId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Select...</option>
          {causesOfLoss.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 10px' }}>
        <select
          disabled={disabled || !row.coverageId}
          style={{ ...SELECT, minWidth: 140, opacity: (disabled || !row.coverageId) ? 0.5 : 1 }}
          value={row.assetType ?? ''}
          onChange={e => onUpdate({ assetType: e.target.value || null })}
        >
          <option value="">Select...</option>
          {assets.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </td>
      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
        <button
          onClick={onRemove}
          disabled={!canRemove}
          style={{ background: 'none', border: 'none', cursor: canRemove ? 'pointer' : 'default', color: canRemove ? '#c62828' : '#ccc', fontSize: 18, lineHeight: 1 }}
        >×</button>
      </td>
    </tr>
  );
}

function CoverageGrid({ rows, coverageTypes, causesOfLoss, onChange, claimType }: { rows: CoverageRow[]; coverageTypes: CoverageOptionDto[]; causesOfLoss: CoverageOptionDto[]; onChange: (rows: CoverageRow[]) => void; claimType: string }) {
  function addRow() {
    onChange([...rows, { _key: Date.now(), id: null, coverageId: null, causeOfLossId: null, assetType: null }]);
  }
  function removeRow(key: number) {
    if (rows.length === 1) return;
    onChange(rows.filter(r => r._key !== key));
  }
  function updateRow(key: number, patch: Partial<CoverageRow>) {
    onChange(rows.map(r => r._key === key ? { ...r, ...patch } : r));
  }
  const disabled = !claimType;

  return (
    <div>
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
              <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Coverage <span style={REQUIRED}>*</span></th>
              <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Cause of Loss <span style={REQUIRED}>*</span></th>
              <th style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600, color: '#555' }}>Impacted Asset / Liability Claim <span style={REQUIRED}>*</span></th>
              <th style={{ padding: '9px 12px', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <CoverageGridRow
                key={row._key}
                row={row}
                coverageTypes={coverageTypes}
                causesOfLoss={causesOfLoss}
                onUpdate={patch => updateRow(row._key, patch)}
                onRemove={() => removeRow(row._key)}
                canRemove={rows.length > 1}
                disabled={disabled}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={addRow} style={{ padding: '6px 16px', border: '1px solid #0B5AA0', borderRadius: 6, background: '#fff', color: '#0B5AA0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
      </div>
    </div>
  );
}

// ─── Claimant sub-form ────────────────────────────────────────────────────────

interface ClaimantRow extends ClaimantSaveDto {
  _key: number;
}

function ClaimantForm({ claimants, refData, onChange }: { claimants: ClaimantRow[]; refData: ClaimReferenceDataDto; onChange: (rows: ClaimantRow[]) => void }) {
  const [manualAddr, setManualAddr] = useState<Record<number, boolean>>({});

  function addClaimant() {
    const key = Date.now();
    onChange([...claimants, {
      _key: key, id: null, partyType: 'Individual',
      firstName: '', middleName: null, lastName: '', relationshipWithInsured: '',
      telephone: '', telephoneCC: null, alternateTelephone: null, email: '',
      addressLine1: null, addressLine2: null, country: null, state: null,
      city: null, county: null, zipCode: null, latitude: null, longitude: null,
      listOfDamages: null,
    }]);
  }
  function remove(key: number) { onChange(claimants.filter(c => c._key !== key)); }
  function update(key: number, patch: Partial<ClaimantRow>) {
    onChange(claimants.map(c => c._key === key ? { ...c, ...patch } : c));
  }

  return (
    <div>
      {claimants.map((c, idx) => {
        const isManual = !!manualAddr[c._key];
        const disabledAddrStyle = { ...INPUT, background: '#f5f5f5', color: '#9ca3af' };
        return (
          <div key={c._key} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 12, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>
                Claimant / Third Party Details{claimants.length > 1 ? ` #${idx + 1}` : ''}
              </span>
              {claimants.length > 1 && (
                <button onClick={() => remove(c._key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: 13, fontWeight: 500 }}>Remove</button>
              )}
            </div>

            {/* Row 1: Party Type | First Name | Last Name */}
            <Row cols={3}>
              <Field label="Party Type" required>
                <select style={SELECT} value={c.partyType} onChange={e => update(c._key, { partyType: e.target.value })}>
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                </select>
              </Field>
              <Field label="First Name" required>
                <input style={INPUT} value={c.firstName} onChange={e => update(c._key, { firstName: e.target.value })} placeholder="First Name" />
              </Field>
              <Field label="Last Name" required>
                <input style={INPUT} value={c.lastName} onChange={e => update(c._key, { lastName: e.target.value })} placeholder="Last Name" />
              </Field>
            </Row>

            {/* Row 2: Relationship | Telephone (US) | Alt Telephone (US) | Email ID */}
            <Row cols={4}>
              <Field label="Relationship with Insured" required>
                <select style={SELECT} value={c.relationshipWithInsured} onChange={e => update(c._key, { relationshipWithInsured: e.target.value })}>
                  <option value="">Select...</option>
                  {(refData.relationshipTypes?.length ? refData.relationshipTypes : ['No Prior Relationship', 'Self', 'Spouse', 'Son', 'Daughter', 'Parent', 'Sibling', 'Employer', 'Employee', 'Other']).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Telephone" required>
                <div style={{ display: 'flex', border: '1px solid #d0d0d0', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', background: '#f9fafb', borderRight: '1px solid #d0d0d0', fontSize: 13, whiteSpace: 'nowrap', gap: 4 }}>
                    🇺🇸 +1
                  </div>
                  <input style={{ ...INPUT, border: 'none', borderRadius: 0, flex: 1 }} value={c.telephone} onChange={e => update(c._key, { telephone: e.target.value })} placeholder="Phone number" />
                </div>
              </Field>
              <Field label="Alternate Telephone">
                <div style={{ display: 'flex', border: '1px solid #d0d0d0', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', background: '#f9fafb', borderRight: '1px solid #d0d0d0', fontSize: 13, whiteSpace: 'nowrap', gap: 4 }}>
                    🇺🇸 +1
                  </div>
                  <input style={{ ...INPUT, border: 'none', borderRadius: 0, flex: 1 }} value={c.alternateTelephone ?? ''} onChange={e => update(c._key, { alternateTelephone: e.target.value || null })} placeholder="Phone number" />
                </div>
              </Field>
              <Field label="Email ID" required>
                <input style={INPUT} type="email" value={c.email} onChange={e => update(c._key, { email: e.target.value })} placeholder="email@example.com" />
              </Field>
            </Row>

            {/* Claimant Address Details */}
            <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginTop: 4, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>Claimant Address Details</div>
              <Field label="Search Address">
                <div style={{ position: 'relative' }}>
                  <input style={{ ...INPUT, paddingLeft: 34 }} placeholder="Search address..." />
                  <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                  </svg>
                </div>
              </Field>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={isManual} onChange={e => setManualAddr(m => ({ ...m, [c._key]: e.target.checked }))} />
                Enter Address Manually
              </label>
              <Row cols={2}>
                <Field label="Address Line 1">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.addressLine1 ?? ''} onChange={e => update(c._key, { addressLine1: e.target.value || null })} placeholder="Street address" />
                </Field>
                <Field label="Address Line 2">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.addressLine2 ?? ''} onChange={e => update(c._key, { addressLine2: e.target.value || null })} placeholder="Apt, suite, unit" />
                </Field>
              </Row>
              <Row cols={4}>
                <Field label="Country">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.country ?? ''} onChange={e => update(c._key, { country: e.target.value || null })} />
                </Field>
                <Field label="State">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.state ?? ''} onChange={e => update(c._key, { state: e.target.value || null })} />
                </Field>
                <Field label="City">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.city ?? ''} onChange={e => update(c._key, { city: e.target.value || null })} />
                </Field>
                <Field label="Zip Code">
                  <input disabled={!isManual} style={isManual ? INPUT : disabledAddrStyle} value={c.zipCode ?? ''} onChange={e => update(c._key, { zipCode: e.target.value || null })} />
                </Field>
              </Row>
            </div>

            {/* List of Damages - Third Party */}
            <Field label="List of Damages - Third Party">
              <textarea style={{ ...INPUT, height: 64, resize: 'vertical' }} value={c.listOfDamages ?? ''} onChange={e => update(c._key, { listOfDamages: e.target.value || null })} />
            </Field>
          </div>
        );
      })}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={addClaimant} style={{ padding: '7px 18px', border: '1px solid #0B5AA0', borderRadius: 6, background: '#fff', color: '#0B5AA0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Claimant</button>
      </div>
    </div>
  );
}

// ─── Step 3: Loss Information ─────────────────────────────────────────────────

interface Step3Form {
  dateOfLoss: string;
  timeOfLoss: string;
  claimInitiationChannel: string;
  claimType: string;
  mainCauseOfLoss: string;
  consequencesOfLoss: string;
  inspectionRequired: boolean;
  claimReimbursementType: string;
  catastrophicEvent: string;
  lossDescription: string;
  listOfDamageFirstParty: string;
  physicalDamage: boolean | null;
  claimOnlyThirdParty: boolean | null;
  isThirdPartyDamage: boolean;
  lossAddressLine1: string;
  lossAddressLine2: string;
  lossCountry: string;
  lossState: string;
  lossCity: string;
  lossCounty: string;
  lossZipCode: string;
  lossLatitude: string;
  lossLongitude: string;
  coverages: CoverageRow[];
  claimants: ClaimantRow[];
}

interface Step3Props {
  form: Step3Form;
  refData: ClaimReferenceDataDto;
  onChange: (f: Step3Form) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function Step3LossInformation({ form, refData, onChange, onNext, onPrev, onSave, onCancel, saving }: Step3Props) {
  const [manualLossAddr, setManualLossAddr] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.dateOfLoss)                errs.dateOfLoss           = 'Provide Date of Loss to continue';
    if (!form.timeOfLoss)                errs.timeOfLoss           = 'Provide Time of Loss to continue';
    if (!form.claimType)                 errs.claimType            = 'Provide Claim Type to continue';
    if (!form.mainCauseOfLoss)           errs.mainCauseOfLoss      = 'Provide Cause of Loss to continue';
    if (!form.consequencesOfLoss)        errs.consequencesOfLoss   = 'Provide Consequences of Loss to continue';
    if (form.physicalDamage === null)     errs.physicalDamage       = 'Select Physical Damage option to continue';
    if (form.claimOnlyThirdParty === null) errs.claimOnlyThirdParty = 'Select Claim Only for Third Party option to continue';
    if (!form.lossDescription.trim())    errs.lossDescription      = 'Provide Loss Description to continue';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  function set<K extends keyof Step3Form>(k: K, v: Step3Form[K]) {
    onChange({ ...form, [k]: v });
  }

  const ErrMsg = ({ field }: { field: string }) =>
    errors[field] ? <span style={{ color: '#c62828', fontSize: 11, marginTop: 2, display: 'block' }}>{errors[field]}</span> : null;

  const disabledAddrStyle = { ...INPUT, background: '#f5f5f5', color: '#9ca3af' };

  return (
    <div>
      {/* Loss Location Details */}
      <div style={CARD}>
        <SectionTitle>Loss Location Details</SectionTitle>
        <Field label="Search Address">
          <div style={{ position: 'relative', marginBottom: 4 }}>
            <input style={{ ...INPUT, paddingLeft: 34 }} placeholder="Search address..." />
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
            </svg>
          </div>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={manualLossAddr} onChange={e => setManualLossAddr(e.target.checked)} />
          Enter Address Manually
        </label>
        <Row cols={2}>
          <Field label="Address Line 1">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossAddressLine1} onChange={e => set('lossAddressLine1', e.target.value)} placeholder="Street address" />
          </Field>
          <Field label="Address Line 2">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossAddressLine2} onChange={e => set('lossAddressLine2', e.target.value)} placeholder="Apt, suite, unit" />
          </Field>
        </Row>
        <Row cols={3}>
          <Field label="Country">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossCountry} onChange={e => set('lossCountry', e.target.value)} />
          </Field>
          <Field label="State">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossState} onChange={e => set('lossState', e.target.value)} />
          </Field>
          <Field label="City">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossCity} onChange={e => set('lossCity', e.target.value)} />
          </Field>
        </Row>
        <Row cols={4}>
          <Field label="County">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossCounty} onChange={e => set('lossCounty', e.target.value)} />
          </Field>
          <Field label="Zip Code">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossZipCode} onChange={e => set('lossZipCode', e.target.value)} />
          </Field>
          <Field label="Latitude">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossLatitude} onChange={e => set('lossLatitude', e.target.value)} />
          </Field>
          <Field label="Longitude">
            <input disabled={!manualLossAddr} style={manualLossAddr ? INPUT : disabledAddrStyle} value={form.lossLongitude} onChange={e => set('lossLongitude', e.target.value)} />
          </Field>
        </Row>
      </div>

      {/* Loss Details */}
      <div style={CARD}>
        <SectionTitle>Loss Details</SectionTitle>
        <Row cols={4}>
          <Field label="Date of Loss" required>
            <input type="date" style={errors.dateOfLoss ? { ...INPUT, borderColor: '#c62828' } : INPUT} value={form.dateOfLoss} onChange={e => set('dateOfLoss', e.target.value)} />
            <ErrMsg field="dateOfLoss" />
          </Field>
          <Field label="Time of Loss" required>
            <input type="time" style={errors.timeOfLoss ? { ...INPUT, borderColor: '#c62828' } : INPUT} value={form.timeOfLoss} onChange={e => set('timeOfLoss', e.target.value)} />
            <ErrMsg field="timeOfLoss" />
          </Field>
          <Field label="Claim Initiation Channel">
            <select style={SELECT} value={form.claimInitiationChannel} onChange={e => set('claimInitiationChannel', e.target.value)}>
              <option value="">Select...</option>
              {refData.initiationChannels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Claim Type" required>
            <select style={errors.claimType ? { ...SELECT, borderColor: '#c62828' } : SELECT} value={form.claimType} onChange={e => set('claimType', e.target.value)}>
              <option value="">Select...</option>
              <option value="HO - Physical Damage">HO - Physical Damage</option>
              <option value="HO - Personal Liability">HO - Personal Liability</option>
            </select>
            <ErrMsg field="claimType" />
          </Field>
        </Row>
        <Row cols={4}>
          <Field label="Main Cause of Loss" required>
            <select style={errors.mainCauseOfLoss ? { ...SELECT, borderColor: '#c62828' } : SELECT} value={form.mainCauseOfLoss} onChange={e => set('mainCauseOfLoss', e.target.value)}>
              <option value="">Select...</option>
              {refData.causesOfLoss.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <ErrMsg field="mainCauseOfLoss" />
          </Field>
          <Field label="Consequences of Loss" required>
            <select style={errors.consequencesOfLoss ? { ...SELECT, borderColor: '#c62828' } : SELECT} value={form.consequencesOfLoss} onChange={e => set('consequencesOfLoss', e.target.value)}>
              <option value="">Select...</option>
              {refData.consequencesOfLoss.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ErrMsg field="consequencesOfLoss" />
          </Field>
          <Field label="Inspection Required">
            <select style={SELECT} value={form.inspectionRequired ? 'Yes' : 'No'} onChange={e => set('inspectionRequired', e.target.value === 'Yes')}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
          <Field label="Claim Reimbursement Type">
            <select style={SELECT} value={form.claimReimbursementType} onChange={e => set('claimReimbursementType', e.target.value)}>
              <option value="">Select...</option>
              <option value="Replacement Cost Value (RCV)">Replacement Cost Value (RCV)</option>
              <option value="Actual Cash Value (ACV)">Actual Cash Value (ACV)</option>
            </select>
          </Field>
        </Row>
        <Row cols={4}>
          <Field label="Catastrophic Event">
            <select style={SELECT} value={form.catastrophicEvent} onChange={e => set('catastrophicEvent', e.target.value)}>
              <option value="">Select...</option>
            </select>
          </Field>
          <Field label="Physical Damage" required>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
              {[{ l: 'Yes', v: true }, { l: 'No', v: false }].map(opt => (
                <label key={String(opt.v)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={form.physicalDamage === opt.v} onChange={() => set('physicalDamage', opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
            <ErrMsg field="physicalDamage" />
          </Field>
          <Field label="Claim Only for Third Party" required>
            <div style={{ display: 'flex', gap: 20, marginTop: 6 }}>
              {[{ l: 'Yes', v: true }, { l: 'No', v: false }].map(opt => (
                <label key={String(opt.v)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={form.claimOnlyThirdParty === opt.v} onChange={() => set('claimOnlyThirdParty', opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
            <ErrMsg field="claimOnlyThirdParty" />
          </Field>
        </Row>
      </div>

      {/* Impacted Coverages */}
      <div style={CARD}>
        <SectionTitle>Impacted Coverages</SectionTitle>
        <CoverageGrid
          rows={form.coverages}
          claimType={form.claimType}
          coverageTypes={form.claimType === 'HO - Personal Liability' ? refData.personalLiabilityCoverageTypes : refData.coverageTypes}
          causesOfLoss={refData.causesOfLoss}
          onChange={rows => set('coverages', rows)}
        />
      </div>

      {/* Loss Description */}
      <div style={CARD}>
        <Field label="Loss Description" required>
          <textarea
            style={errors.lossDescription ? { ...INPUT, height: 80, resize: 'vertical', borderColor: '#c62828' } : { ...INPUT, height: 80, resize: 'vertical' }}
            value={form.lossDescription}
            onChange={e => set('lossDescription', e.target.value)}
            placeholder="Describe what happened..."
          />
          <ErrMsg field="lossDescription" />
        </Field>
        <Field label="List of Damage - First Party">
          <textarea style={{ ...INPUT, height: 64, resize: 'vertical' }} value={form.listOfDamageFirstParty} onChange={e => set('listOfDamageFirstParty', e.target.value)} />
        </Field>
      </div>

      {/* Third Party toggle */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: form.isThirdPartyDamage ? 20 : 0 }}>
          <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0 }}>
            <input type="checkbox" checked={form.isThirdPartyDamage} onChange={e => set('isThirdPartyDamage', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              background: form.isThirdPartyDamage ? '#0B5AA0' : '#ccc', borderRadius: 24, transition: '0.2s',
            }}>
              <span style={{
                position: 'absolute', height: 18, width: 18, left: form.isThirdPartyDamage ? 22 : 3,
                bottom: 3, background: '#fff', borderRadius: '50%', transition: '0.2s',
              }} />
            </span>
          </label>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>Is there any third party damage?</span>
        </div>
        {form.isThirdPartyDamage && (
          <ClaimantForm claimants={form.claimants} refData={refData} onChange={rows => set('claimants', rows)} />
        )}
      </div>

      {/* Footer: Cancel | Previous (left) — Save | Next (right) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 8, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={onPrev} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Previous</button>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSave} disabled={saving} style={{ padding: '9px 22px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', color: '#374151', fontSize: 13, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleNext} disabled={saving} style={{ padding: '9px 22px', border: 'none', borderRadius: 7, background: saving ? '#90caf9' : '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Other Information ────────────────────────────────────────────────

interface Step4Form {
  claimEstimate: string;
  comment: string;
  files: File[];
}

interface Step4Props {
  claimNumber: string | null;
  claimStatus: string | null;
  form: Step4Form;
  existingDocuments: ClaimDocumentDto[];
  onChange: (f: Step4Form) => void;
  onPrev: () => void;
  onSave: () => void;
  onCreate: () => void;
  saving: boolean;
  creating: boolean;
}

function Step4OtherInformation({ claimNumber, claimStatus, form, existingDocuments, onChange, onPrev, onSave, onCreate, saving, creating }: Step4Props) {
  function set<K extends keyof Step4Form>(k: K, v: Step4Form[K]) {
    onChange({ ...form, [k]: v });
  }

  function appendValidFiles(files: File[]) {
    const allowedExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.png', '.jpeg', '.jpg'];
    const accepted = files.filter(file => {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(extension) && file.size <= 25 * 1024 * 1024;
    });
    if (accepted.length !== files.length)
      alert('Some files were skipped. Use DOC, DOCX, XLS, XLSX, PNG, JPG, or JPEG files up to 25 MB.');
    set('files', [...form.files, ...accepted]);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    appendValidFiles(Array.from(e.dataTransfer.files));
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    appendValidFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  function removeFile(idx: number) {
    set('files', form.files.filter((_, i) => i !== idx));
  }

  return (
    <div>
      {claimNumber && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32' }}>
            {claimStatus === 'OPEN' ? 'Claim registered' : 'Draft claim'}: {claimNumber}
          </span>
        </div>
      )}

      {/* Upload Claim Documents — two-column layout */}
      <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>Upload Claim Documents</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 220 }}>
          {/* Left — drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleFileDrop}
            style={{ borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', cursor: 'pointer' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#aab" strokeWidth="1.5" style={{ marginBottom: 10 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Drag and Drop File Here or Select a File</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>
              Supported formats are doc,.xls,.png,.jpeg<br />Maximum file size: 25 MB
            </div>
            <label style={{ cursor: 'pointer' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 18px', border: '1px solid #1976d2', borderRadius: 6, background: '#fff', color: '#1976d2', fontSize: 13, fontWeight: 600 }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                Browse File
              </span>
              <input type="file" multiple accept=".doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg" onChange={handleFileInput} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Right — attached documents list */}
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Attached Documents List</div>
            {existingDocuments.length === 0 && form.files.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 140, fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>No Data Available</div>
            ) : (
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
                {existingDocuments.map(doc => (
                  <div key={`saved-${doc.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#1a1a2e' }}>{doc.fileName}</span>
                    <span style={{ color: '#2e7d32', fontSize: 11, fontWeight: 600 }}>Uploaded</span>
                  </div>
                ))}
                {form.files.map((f, idx) => (
                  <div key={`pending-${f.name}-${f.lastModified}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: idx < form.files.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13 }}>
                    <span style={{ flex: 1, color: '#1a1a2e' }}>{f.name}</span>
                    <span style={{ color: '#888', fontSize: 11 }}>{(f.size / 1024).toFixed(1)} KB</span>
                    <span style={{ color: '#b26a00', fontSize: 11, fontWeight: 600 }}>Pending</span>
                    <button onClick={() => removeFile(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: 14, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Claim Estimate & Comment — side by side, outside the card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px', marginBottom: 24 }}>
        <Field label="Claim Estimate">
          <input style={INPUT} type="text" value={form.claimEstimate} onChange={e => set('claimEstimate', e.target.value)} placeholder="USD 0.00" />
        </Field>
        <Field label="Comment">
          <input style={INPUT} type="text" value={form.comment} onChange={e => set('comment', e.target.value)} placeholder="" />
        </Field>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 8 }}>
        <button onClick={onPrev} style={{ padding: '9px 22px', border: '1px solid #d0d0d0', borderRadius: 7, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#444' }}>Previous</button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSave} disabled={saving || creating} style={{ padding: '9px 22px', border: '1px solid #1976d2', borderRadius: 7, background: '#fff', color: '#1976d2', fontSize: 13, fontWeight: 600, cursor: (saving || creating) ? 'default' : 'pointer' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onCreate} disabled={saving || creating} style={{ padding: '9px 22px', border: 'none', borderRadius: 7, background: (saving || creating) ? '#90caf9' : '#0B5AA0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: (saving || creating) ? 'default' : 'pointer' }}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Claim Success Modal ──────────────────────────────────────────────────────

function ClaimSuccessModal({ claimNumber, onClose, closeLabel }: { claimNumber: string; onClose: () => void; closeLabel: string }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 440, boxShadow: '0 12px 48px rgba(0,0,0,0.22)', overflow: 'hidden' }}>
        {/* Green header bar */}
        <div style={{ background: 'linear-gradient(135deg, #2e7d32, #43a047)', padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>Done</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Claim Created Successfully</div>
        </div>
        {/* Body */}
        <div style={{ padding: '28px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>Your claim has been registered with reference number</div>
          <div style={{
            display: 'inline-block', background: '#e8f5e9', border: '2px solid #a5d6a7',
            borderRadius: 8, padding: '10px 28px', fontSize: 22, fontWeight: 800,
            color: '#2e7d32', letterSpacing: 1, marginBottom: 20,
          }}>
            {claimNumber}
          </div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 24 }}>
            The claim is now <span style={{ fontWeight: 600, color: '#1976d2' }}>OPEN</span> and will be assigned to an adjuster shortly.
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px 0', background: '#2e7d32', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root wizard ──────────────────────────────────────────────────────────────

function buildRequest(params: {
  claimId: number | null;
  policyId: number;
  riskLocationId: number | null;
  step2: Step2Form;
  step3: Step3Form;
  step4: Step4Form;
  status: string;
  lastStepNumber: number;
}): CreateOrUpdateClaimRequest {
  return {
    id: params.claimId,
    policyId: params.policyId,
    riskLocationId: params.riskLocationId,
    status: params.status,
    lastStepNumber: params.lastStepNumber,
    isClaimReportedByInsured: params.step2.isClaimReportedByInsured,
    reporterFirstName: params.step2.isClaimReportedByInsured ? null : params.step2.reporterFirstName || null,
    reporterLastName: params.step2.isClaimReportedByInsured ? null : params.step2.reporterLastName || null,
    reporterRelationship: params.step2.isClaimReportedByInsured ? null : params.step2.reporterRelationship || null,
    reporterTelephone: params.step2.isClaimReportedByInsured ? null : params.step2.reporterTelephone || null,
    reporterTelephoneCC: params.step2.isClaimReportedByInsured ? null : params.step2.reporterTelephoneCC || null,
    reporterEmail: params.step2.isClaimReportedByInsured ? null : params.step2.reporterEmail || null,
    dateOfLoss: params.step3.dateOfLoss || null,
    timeOfLoss: params.step3.timeOfLoss || null,
    claimInitiationChannel: params.step3.claimInitiationChannel || null,
    claimType: params.step3.claimType || null,
    mainCauseOfLoss: params.step3.mainCauseOfLoss || null,
    consequencesOfLoss: params.step3.consequencesOfLoss || null,
    inspectionRequired: params.step3.inspectionRequired,
    claimReimbursementType: params.step3.claimReimbursementType || null,
    catastrophicEvent: params.step3.catastrophicEvent || null,
    lossDescription: params.step3.lossDescription || null,
    listOfDamageFirstParty: params.step3.listOfDamageFirstParty || null,
    physicalDamage: params.step3.physicalDamage,
    claimOnlyThirdParty: params.step3.claimOnlyThirdParty,
    isThirdPartyDamage: params.step3.isThirdPartyDamage,
    lossAddressLine1: params.step3.lossAddressLine1 || null,
    lossAddressLine2: params.step3.lossAddressLine2 || null,
    lossCountry: params.step3.lossCountry || null,
    lossState: params.step3.lossState || null,
    lossCity: params.step3.lossCity || null,
    lossCounty: params.step3.lossCounty || null,
    lossZipCode: params.step3.lossZipCode || null,
    lossLatitude: params.step3.lossLatitude || null,
    lossLongitude: params.step3.lossLongitude || null,
    claimEstimate: params.step4.claimEstimate || null,
    comment: params.step4.comment || null,
    coverages: params.step3.coverages
      .filter(c => c.coverageId || c.causeOfLossId || c.assetType)
      .map(c => ({ id: c.id, coverageId: c.coverageId, causeOfLossId: c.causeOfLossId, assetType: c.assetType })),
    claimants: params.step3.isThirdPartyDamage
      ? params.step3.claimants.map(c => ({
          id: c.id, partyType: c.partyType, firstName: c.firstName, middleName: c.middleName,
          lastName: c.lastName, relationshipWithInsured: c.relationshipWithInsured,
          telephone: c.telephone, telephoneCC: c.telephoneCC, alternateTelephone: c.alternateTelephone,
          email: c.email, addressLine1: c.addressLine1, addressLine2: c.addressLine2,
          country: c.country, state: c.state, city: c.city, county: c.county,
          zipCode: c.zipCode, latitude: c.latitude, longitude: c.longitude, listOfDamages: c.listOfDamages,
        }))
      : [],
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error(`Unable to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function defaultStep3(): Step3Form {
  return {
    dateOfLoss: '', timeOfLoss: '', claimInitiationChannel: '', claimType: '',
    mainCauseOfLoss: '', consequencesOfLoss: '', inspectionRequired: false,
    claimReimbursementType: '', catastrophicEvent: '', lossDescription: '',
    listOfDamageFirstParty: '', physicalDamage: null, claimOnlyThirdParty: null,
    isThirdPartyDamage: false,
    lossAddressLine1: '', lossAddressLine2: '', lossCountry: '', lossState: '',
    lossCity: '', lossCounty: '', lossZipCode: '', lossLatitude: '', lossLongitude: '',
    coverages: [{ _key: 1, id: null, coverageId: null, causeOfLossId: null, assetType: null }],
    claimants: [],
  };
}

function defaultStep2(): Step2Form {
  return { isClaimReportedByInsured: true, reporterFirstName: '', reporterLastName: '', reporterRelationship: '', reporterTelephone: '', reporterTelephoneCC: '', reporterEmail: '' };
}

export default function FNOLRegPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();
  const { loaded: permLoaded, view: canViewFnol } = usePermissions('FNOLREGSCREEN');
  const { view: canViewClaimsEnquiry } = usePermissions('CLAIMENQUIRYSCREEN');
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicySearchDto | null>(null);
  const [claimId, setClaimId] = useState<number | null>(routeId ? parseInt(routeId, 10) : null);

  // Sync claimId when route param changes without remount (e.g. navigate from /fnol to /fnol/:id)
  useEffect(() => {
    const newId = routeId ? parseInt(routeId, 10) : null;
    setClaimId(newId);
    if (!newId) {
      setStep(1);
      setSelectedPolicy(null);
    }
  }, [routeId]);

  const [claimNumber, setClaimNumber] = useState<string | null>(null);
  const [step2, setStep2] = useState<Step2Form>(defaultStep2());
  const [step3, setStep3] = useState<Step3Form>(defaultStep3());
  const [step4, setStep4] = useState<Step4Form>({ claimEstimate: '', comment: '', files: [] });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [successClaimNumber, setSuccessClaimNumber] = useState<string | null>(null);

  // Reset to Step 1 whenever the user navigates to /claims/fnol (sidebar click),
  // even if the URL hasn't changed — location.key changes on every navigation event.
  useEffect(() => {
    if (!routeId) {
      setStep(1);
      setSelectedPolicy(null);
      setClaimId(null);
      setClaimNumber(null);
      setStep2(defaultStep2());
      setStep3(defaultStep3());
      setStep4({ claimEstimate: '', comment: '', files: [] });
    }
  }, [location.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reference data - always loaded
  const { data: refData } = useQuery({
    queryKey: ['claims-ref-data'],
    queryFn: () => claimsApi.getFnolReferenceData(),
  });

  // Load existing claim if editing (resume FNOL)
  const { data: existingClaim } = useQuery({
    queryKey: ['fnol-claim', claimId],
    queryFn: () => claimsApi.getFnolById(claimId!),
    enabled: !!claimId,
  });

  // Hydrate forms when existing claim loads
  useEffect(() => {
    if (!existingClaim) return;
    setClaimNumber(existingClaim.claimNumber);
    setStep2({
      isClaimReportedByInsured: existingClaim.isClaimReportedByInsured,
      reporterFirstName: existingClaim.reporterFirstName ?? '',
      reporterLastName: existingClaim.reporterLastName ?? '',
      reporterRelationship: existingClaim.reporterRelationship ?? '',
      reporterTelephone: existingClaim.reporterTelephone ?? '',
      reporterTelephoneCC: '',
      reporterEmail: existingClaim.reporterEmail ?? '',
    });
    setStep3({
      dateOfLoss: existingClaim.dateOfLoss ?? '',
      timeOfLoss: existingClaim.timeOfLoss ?? '',
      claimInitiationChannel: existingClaim.claimInitiationChannel ?? '',
      claimType: existingClaim.claimType ?? '',
      mainCauseOfLoss: existingClaim.mainCauseOfLoss ?? '',
      consequencesOfLoss: existingClaim.consequencesOfLoss ?? '',
      inspectionRequired: existingClaim.inspectionRequired,
      claimReimbursementType: existingClaim.claimReimbursementType ?? '',
      catastrophicEvent: existingClaim.catastrophicEvent ?? '',
      lossDescription: existingClaim.lossDescription ?? '',
      listOfDamageFirstParty: existingClaim.listOfDamageFirstParty ?? '',
      physicalDamage: existingClaim.physicalDamage ?? null,
      claimOnlyThirdParty: existingClaim.claimOnlyThirdParty ?? null,
      isThirdPartyDamage: existingClaim.isThirdPartyDamage,
      lossAddressLine1: existingClaim.lossAddressLine1 ?? '',
      lossAddressLine2: existingClaim.lossAddressLine2 ?? '',
      lossCountry: existingClaim.lossCountry ?? '',
      lossState: existingClaim.lossState ?? '',
      lossCity: existingClaim.lossCity ?? '',
      lossCounty: existingClaim.lossCounty ?? '',
      lossZipCode: existingClaim.lossZipCode ?? '',
      lossLatitude: existingClaim.lossLatitude ?? '',
      lossLongitude: existingClaim.lossLongitude ?? '',
      coverages: existingClaim.coverages.length > 0
        ? existingClaim.coverages.map((c, i) => ({
            _key: i + 1,
            id: c.id,
            coverageId: c.coverageId,
            causeOfLossId: c.causeOfLossId,
            assetType: c.assetType,
          }))
        : [{ _key: 1, id: null, coverageId: null, causeOfLossId: null, assetType: null }],
      claimants: existingClaim.claimants.map((c, i) => ({
        _key: i + 1,
        id: c.id,
        partyType: c.partyType,
        firstName: c.firstName ?? '',
        middleName: c.middleName,
        lastName: c.lastName ?? '',
        relationshipWithInsured: c.relationshipWithInsured ?? '',
        telephone: c.telephone ?? '',
        telephoneCC: c.telephoneCC,
        alternateTelephone: c.alternateTelephone,
        email: c.email ?? '',
        addressLine1: c.addressLine1, addressLine2: c.addressLine2,
        country: c.country, state: c.state, city: c.city, county: c.county,
        zipCode: c.zipCode, latitude: c.latitude, longitude: c.longitude,
        listOfDamages: c.listOfDamages,
      })),
    });
    setStep4(f => ({ ...f, claimEstimate: existingClaim.claimEstimate ?? '', comment: existingClaim.comment ?? '' }));
    // Resume at the step the draft was last saved on
    setStep(existingClaim.lastStepNumber >= 2 ? existingClaim.lastStepNumber : 2);
  }, [existingClaim]);

  const emptyRefData: ClaimReferenceDataDto = { initiationChannels: [], causesOfLoss: [], consequencesOfLoss: [], coverageTypes: [], personalLiabilityCoverageTypes: [], impactedAssets: [], relationshipTypes: [] };

  const rd = refData ?? emptyRefData;

  // ── Save helper ─────────────────────────────────────────────────────────────
  async function persist(status: string, lastStepNumber: number, idOverride?: number) {
    const effectiveClaimId = idOverride ?? claimId;
    if (!selectedPolicy && !effectiveClaimId) return;
    const policyId = selectedPolicy?.id ?? existingClaim?.policyId ?? 0;
    const mappedRiskLocationId = existingClaim?.policyDetails?.riskLocation?.id;
    const riskLocationId = mappedRiskLocationId && mappedRiskLocationId > 0
      ? mappedRiskLocationId
      : null;
    const req = buildRequest({ claimId: effectiveClaimId, policyId, riskLocationId, step2, step3, step4, status, lastStepNumber });
    const res = await claimsApi.createOrUpdate(req);
    setClaimId(res.id);
    setClaimNumber(res.claimNumber);
    queryClient.invalidateQueries({ queryKey: ['fnol-claim', res.id] });
    queryClient.invalidateQueries({ queryKey: ['fnol-policy-claims'] });
    return res;
  }

  // ── Navigation handlers ─────────────────────────────────────────────────────
  function handleStep1Next(policy: PolicySearchDto) {
    setSelectedPolicy(policy);
    setClaimId(null);
    setClaimNumber(null);
    setStep2(defaultStep2());
    setStep3(defaultStep3());
    setStep4({ claimEstimate: '', comment: '', files: [] });
    setStep(2);
  }

  async function handleStep2Next() {
    setSaving(true);
    try {
      const wasNew = !claimId;
      const saved = await persist('DRAFT', 3);
      if (!saved) throw new Error('No policy was selected.');
      if (wasNew) navigate(`/claims/fnol/${saved.id}`, { replace: true });
      else setStep(3);
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.message ?? String(e);
      alert(`Unable to continue: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleStep3Next() {
    setSaving(true);
    try {
      const saved = await persist('DRAFT', 4);
      if (!saved) throw new Error('No policy was selected.');
      setStep(4);
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.message ?? String(e);
      alert(`Unable to continue: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await persist('DRAFT', step);
      // Brief visual confirmation
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.message ?? String(e);
      alert(`Failed to save draft: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const draft = await persist('DRAFT', 4);
      if (!draft) throw new Error('No policy was selected.');

      let uploadedCount = 0;
      try {
        for (const file of step4.files) {
          const documentRequest: CreateClaimDocumentRequest = {
            fileName: file.name,
            contentType: file.type || null,
            fileSize: file.size,
            fileContentBase64: await fileToBase64(file),
            notifyToName: null,
            comment: step4.comment || null,
          };
          await claimsApi.addFnolDocument(draft.id, documentRequest);
          uploadedCount += 1;
        }
        if (step4.files.length > 0) {
          setStep4(current => ({ ...current, files: [] }));
          await queryClient.invalidateQueries({ queryKey: ['fnol-claim', draft.id] });
        }
      } catch (documentError: any) {
        // Keep only files that were not uploaded so retrying cannot create duplicates.
        setStep4(current => ({ ...current, files: current.files.slice(uploadedCount) }));
        await queryClient.invalidateQueries({ queryKey: ['fnol-claim', draft.id] });
        const detail = documentError?.response?.data?.error ?? documentError?.message ?? String(documentError);
        alert(`Draft ${draft.claimNumber ?? `#${draft.id}`} was saved, but a document could not be uploaded: ${detail}`);
        return;
      }

      const saved = await persist('OPEN', 4, draft.id);
      if (!saved) throw new Error('The saved draft could not be registered.');
      queryClient.invalidateQueries({ queryKey: ['claims-enquiry'] });
      setSuccessClaimNumber(saved.claimNumber ?? `#${saved.id}`);
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.message ?? String(e);
      alert(`Failed to create claim: ${detail}`);
    } finally {
      setCreating(false);
    }
  }

  // ── Permission guard ─────────────────────────────────────────────────────────
  if (!permLoaded) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
        <div style={{ fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  if (!canViewFnol) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Access denied</div>
        <div style={{ fontSize: 13 }}>You do not have permission to view FNOL Registration.</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Claims Inquiry / First Notification of Loss</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>First Notification of Loss</h1>
      </div>

      {/* Stepper */}
      <Stepper step={step} />

      {/* Step content */}
      {step === 1 && (
        <Step1PolicySearch
          onNext={handleStep1Next}
          onCancel={() => navigate('/claims/enquiry')}
        />
      )}
      {step === 2 && (
        <Step2PolicyInformation
          policyId={selectedPolicy?.id ?? existingClaim?.policyId ?? 0}
          refData={rd}
          form={step2}
          onChange={setStep2}
          onNext={handleStep2Next}
          onPrev={() => setStep(1)}
          onSave={handleSave}
          onCancel={() => navigate('/claims/enquiry')}
          saving={saving}
        />
      )}
      {step === 3 && (
        <Step3LossInformation
          form={step3}
          refData={rd}
          onChange={setStep3}
          onNext={handleStep3Next}
          onPrev={() => setStep(2)}
          onSave={handleSave}
          onCancel={() => navigate('/claims/enquiry')}
          saving={saving}
        />
      )}
      {step === 4 && (
        <Step4OtherInformation
          claimNumber={claimNumber}
          claimStatus={existingClaim?.status ?? null}
          form={step4}
          existingDocuments={existingClaim?.documents ?? []}
          onChange={setStep4}
          onPrev={() => setStep(3)}
          onSave={handleSave}
          onCreate={handleCreate}
          saving={saving}
          creating={creating}
        />
      )}

      {successClaimNumber && (
        <ClaimSuccessModal
          claimNumber={successClaimNumber}
          closeLabel={canViewClaimsEnquiry ? 'Go to Claims Enquiry' : 'Start New Claim'}
          onClose={() => {
            setSuccessClaimNumber(null);
            navigate(canViewClaimsEnquiry ? '/claims/enquiry' : '/claims/fnol');
          }}
        />
      )}
    </div>
  );
}









