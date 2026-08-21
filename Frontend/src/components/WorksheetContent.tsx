// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// WorksheetContent — Financial Worksheet full-stack feature component
// Part of ClaimWorkflowPage. Extracted to keep page file manageable.
import { useEffect, useRef, useState } from 'react';
import { claimsApi } from '../api/claims';

// ── Types ───────────────────────────────────────────────────────────────────

interface WorksheetReserveDto {
  id: number | null;
  coverage: string | null;
  coverageLimit: number | null;
  causeOfLossDescription: string | null;
  causeOfLossCode: string | null;
  causeOfLossLimit: number | null;
  liabilityClaimDescription: string | null;
  liabilityClaimCode: string | null;
  liabilityLimit: number | null;
  supersedingLimit: number | null;
  reserveAmount: number;
}

interface WorksheetPaymentDto {
  id: number | null;
  coverage: string | null;
  causeOfLossDescription: string | null;
  payeeType: string | null;
  payeeName: string | null;
  liabilityClaim: string | null;
  paymentAmount: number;
}

interface WorksheetDto {
  id: number;
  wsNumber: string;
  status: string;
  closeManually: boolean;
  comments: string | null;
  incurred: number;
  reserve: number;
  personalLiabilities: number;
  payment: number;
  approvedByName: string | null;
  escalatedToName: string | null;
  createdByName: string;
  createdOn: string;
  updatedByName: string | null;
  updatedOn: string | null;
  reserves: WorksheetReserveDto[];
  payments: WorksheetPaymentDto[];
}

// ── COL / Liability mappings ────────────────────────────────────────────────

const COL_OPTIONS = [
  'Earthquake physical damage',
  'Fire physical damage',
  'Flood physical damage',
  'Windstorm physical damage',
  'Hailstorm physical damage',
  'Collapse physical damage',
  'Theft physical damage',
  'Water damage physical damage',
];

const COL_CODES: Record<string, string> = {
  'Earthquake physical damage': '1020B',
  'Fire physical damage': '1021A',
  'Flood physical damage': '1022C',
  'Windstorm physical damage': '1023D',
  'Hailstorm physical damage': '1024E',
  'Collapse physical damage': '1025F',
  'Theft physical damage': '1026G',
  'Water damage physical damage': '1027H',
};

const LIABILITY_OPTIONS = [
  'Automobile liabilities',
  'Collision liabilities',
  'Fire liabilities',
  'Flood liabilities',
  'Earthquake liabilities',
  'Windstorm liabilities',
];

const LIABILITY_CODES: Record<string, string> = {
  'Automobile liabilities': '4008A',
  'Collision liabilities': '4015A',
  'Fire liabilities': '4016B',
  'Flood liabilities': '4017C',
  'Earthquake liabilities': '4018D',
  'Windstorm liabilities': '4019E',
};

const COVERAGE_OPTIONS = ['Personal liabilities', 'Adjuster Fee'];
const PAYEE_TYPE_OPTIONS = ['Insured', 'Claimant', 'Vendor', 'Attorney'];

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Open' || status === 'Approved'
      ? { bg: '#d7f7e4', text: '#006b3c', dot: '#008c55', border: '#008c55' }
      : status === 'Escalated'
      ? { bg: '#fff3e0', text: '#b45309', dot: '#f59e0b', border: '#f59e0b' }
      : status === 'Denied'
      ? { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444', border: '#ef4444' }
      : { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', border: '#94a3b8' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 20, padding: '0 9px', borderRadius: 999, border: `1px solid ${color.border}`, background: color.bg, color: color.text, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color.dot }} />
      {status}
    </span>
  );
}

function PencilIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}

function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>;
}

// ── Matrix View ──────────────────────────────────────────────────────────────

interface MatrixViewProps {
  claimId: number;
  worksheets: WorksheetDto[];
  onAdd: () => void;
  onEdit: (ws: WorksheetDto) => void;
  onRefresh: () => void;
}

function MatrixView({ claimId, worksheets, onAdd, onEdit, onRefresh }: MatrixViewProps) {
  const [mode, setMode] = useState<'accumulated' | 'movement'>('accumulated');
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  // Close tools dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setToolsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Accumulated sums up to and including this column index
  const accumulated = worksheets.map((_ws, idx) => ({
    incurred: worksheets.slice(0, idx + 1).reduce((s, w) => s + w.incurred, 0),
    reserve: worksheets.slice(0, idx + 1).reduce((s, w) => s + w.reserve, 0),
    personalLiabilities: worksheets.slice(0, idx + 1).reduce((s, w) => s + w.personalLiabilities, 0),
    payment: worksheets.slice(0, idx + 1).reduce((s, w) => s + w.payment, 0),
  }));

  const rows = [
    { label: 'Incurred', key: 'incurred' as const },
    { label: 'Reserve', key: 'reserve' as const },
    { label: 'Personal liabilities', key: 'personalLiabilities' as const },
    { label: 'Payment', key: 'payment' as const },
  ];

  const handleAction = async (action: 'approve' | 'deny' | 'escalate') => {
    for (const id of checkedIds) {
      try {
        if (action === 'approve') await claimsApi.approveWorksheet(claimId, id);
        else if (action === 'deny') await claimsApi.denyWorksheet(claimId, id);
        else if (action === 'escalate') await claimsApi.escalateWorksheet(claimId, id, 1);
      } catch { /* swallow */ }
    }
    setCheckedIds([]);
    onRefresh();
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #d8e1ea', borderRadius: 4, overflow: 'hidden' }}>
          {(['accumulated', 'movement'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 18px', fontSize: 12, fontWeight: 600, background: mode === m ? '#0B5AA0' : '#fff', color: mode === m ? '#fff' : '#334155', border: 'none', cursor: 'pointer', textTransform: 'capitalize' }}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b', border: '1px solid #d8e1ea', borderRadius: 4, padding: '5px 12px' }}>Currency: USD</span>
          <button onClick={onAdd} style={{ height: 34, padding: '0 16px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ Add Worksheet</button>
        </div>
      </div>

      {/* Scrollable matrix table */}
      <div style={{ overflowX: 'auto', border: '1px solid #d8e1ea', borderRadius: 4 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 600, fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 180, padding: '10px 14px', background: '#e6f0f6', border: '1px solid #d8e1ea', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>Worksheet</th>
              {worksheets.map(ws => (
                <th key={ws.id} style={{ minWidth: 200, padding: '8px 12px', background: '#e6f0f6', border: '1px solid #d8e1ea', textAlign: 'center', fontWeight: 700 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>WS ID {ws.wsNumber}</span>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{ws.createdOn}</span>
                    <StatusBadge status={ws.status} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <button onClick={() => onEdit(ws)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0B5AA0', padding: 2 }}><PencilIcon /></button>
                      <input type="checkbox" checked={checkedIds.includes(ws.id)} onChange={e => setCheckedIds(prev => e.target.checked ? [...prev, ws.id] : prev.filter(i => i !== ws.id))} style={{ width: 14, height: 14, accentColor: '#0B5AA0', cursor: 'pointer' }} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key}>
                <td style={{ padding: '9px 14px', border: '1px solid #d8e1ea', fontWeight: 600, background: '#f8fafc', whiteSpace: 'nowrap' }}>{row.label}</td>
                {worksheets.map((_ws, idx) => {
                  const val = mode === 'accumulated' ? accumulated[idx][row.key] : _ws[row.key];
                  return <td key={_ws.id} style={{ padding: '9px 14px', border: '1px solid #d8e1ea', textAlign: 'right' }}>{fmt(val)}</td>;
                })}
              </tr>
            ))}
            {/* Approved By row */}
            <tr>
              <td style={{ padding: '9px 14px', border: '1px solid #d8e1ea', fontWeight: 600, background: '#f8fafc' }}>WS Approved By</td>
              {worksheets.map(ws => (
                <td key={ws.id} style={{ padding: '9px 14px', border: '1px solid #d8e1ea', textAlign: 'center' }}>{ws.approvedByName ?? '-'}</td>
              ))}
            </tr>
            {/* Escalated To row */}
            <tr>
              <td style={{ padding: '9px 14px', border: '1px solid #d8e1ea', fontWeight: 600, background: '#f8fafc' }}>WS Escalated To</td>
              {worksheets.map(ws => (
                <td key={ws.id} style={{ padding: '9px 14px', border: '1px solid #d8e1ea', textAlign: 'center' }}>{ws.escalatedToName ?? '-'}</td>
              ))}
            </tr>
          </tbody>
        </table>
        {worksheets.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 20, fontWeight: 800, color: '#94a3b8' }}>No Worksheets Available</div>
        )}
      </div>

      {/* Footer action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
        <button onClick={() => handleAction('deny')} disabled={checkedIds.length === 0} style={{ height: 34, minWidth: 100, border: '1px solid #0B5AA0', color: checkedIds.length > 0 ? '#0B5AA0' : '#94a3b8', background: '#fff', borderColor: checkedIds.length > 0 ? '#0B5AA0' : '#d1d5db', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: checkedIds.length > 0 ? 'pointer' : 'not-allowed' }}>Deny</button>
        <button onClick={() => handleAction('escalate')} disabled={checkedIds.length === 0} style={{ height: 34, minWidth: 100, border: '1px solid #0B5AA0', color: checkedIds.length > 0 ? '#0B5AA0' : '#94a3b8', background: '#fff', borderColor: checkedIds.length > 0 ? '#0B5AA0' : '#d1d5db', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: checkedIds.length > 0 ? 'pointer' : 'not-allowed' }}>Escalate</button>
        <button onClick={() => handleAction('approve')} disabled={checkedIds.length === 0} style={{ height: 34, minWidth: 100, background: checkedIds.length > 0 ? '#0B5AA0' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: checkedIds.length > 0 ? 'pointer' : 'not-allowed' }}>Approve</button>
        <div style={{ marginLeft: 'auto', position: 'relative' }} ref={toolsRef}>
          <button onClick={() => setToolsOpen(o => !o)} style={{ height: 34, padding: '0 16px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Tools v</button>
          {toolsOpen && (
            <div style={{ position: 'absolute', right: 0, top: 38, background: '#fff', border: '1px solid #d8e1ea', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 160, zIndex: 100 }}>
              {['Query', 'Refer', 'Send Back', 'Close Claim', 'Mark Claim Open'].map(item => (
                <button key={item} disabled={item === 'Send Back'} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', fontSize: 13, color: item === 'Send Back' ? '#94a3b8' : '#111827', cursor: item === 'Send Back' ? 'not-allowed' : 'pointer' }}>{item}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add/Edit Form ────────────────────────────────────────────────────────────

interface WorksheetFormProps {
  claimId: number;
  existing: WorksheetDto | null;
  onCancel: () => void;
  onSaved: (ws: WorksheetDto) => void;
}

function WorksheetForm({ claimId, existing, onCancel, onSaved }: WorksheetFormProps) {
  const [tab, setTab] = useState<'reserve' | 'payment'>('reserve');
  const [closeManually, setCloseManually] = useState(existing?.closeManually ?? false);
  const [comments, setComments] = useState(existing?.comments ?? '');
  const [saving, setSaving] = useState(false);

  // Reserve rows
  const [reserves, setReserves] = useState<WorksheetReserveDto[]>(
    existing?.reserves?.length
      ? existing.reserves
      : [{ id: null, coverage: null, coverageLimit: null, causeOfLossDescription: null, causeOfLossCode: null, causeOfLossLimit: null, liabilityClaimDescription: null, liabilityClaimCode: null, liabilityLimit: null, supersedingLimit: null, reserveAmount: 0 }]
  );

  // Payment rows
  const [payments, setPayments] = useState<WorksheetPaymentDto[]>(
    existing?.payments?.length
      ? existing.payments
      : [{ id: null, coverage: null, causeOfLossDescription: null, payeeType: null, payeeName: null, liabilityClaim: null, paymentAmount: 0 }]
  );

  const updateReserve = (idx: number, field: keyof WorksheetReserveDto, value: string | number | null) => {
    setReserves(prev => {
      const next = [...prev];
      const row = { ...next[idx], [field]: value } as WorksheetReserveDto;
      // Auto-populate COL code
      if (field === 'causeOfLossDescription') {
        row.causeOfLossCode = COL_CODES[value as string] ?? null;
      }
      // Auto-populate liability code
      if (field === 'liabilityClaimDescription') {
        row.liabilityClaimCode = LIABILITY_CODES[value as string] ?? null;
      }
      next[idx] = row;
      return next;
    });
  };

  const updatePayment = (idx: number, field: keyof WorksheetPaymentDto, value: string | number | null) => {
    setPayments(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value } as WorksheetPaymentDto;
      return next;
    });
  };

  const addReserve = () => setReserves(prev => [...prev, { id: null, coverage: null, coverageLimit: null, causeOfLossDescription: null, causeOfLossCode: null, causeOfLossLimit: null, liabilityClaimDescription: null, liabilityClaimCode: null, liabilityLimit: null, supersedingLimit: null, reserveAmount: 0 }]);
  const addPayment = () => setPayments(prev => [...prev, { id: null, coverage: null, causeOfLossDescription: null, payeeType: null, payeeName: null, liabilityClaim: null, paymentAmount: 0 }]);
  const removeReserve = (idx: number) => setReserves(prev => prev.filter((_, i) => i !== idx));
  const removePayment = (idx: number) => setPayments(prev => prev.filter((_, i) => i !== idx));

  const totalReserve = reserves.reduce((s, r) => s + (Number(r.reserveAmount) || 0), 0);
  const totalPayment = payments.reduce((s, p) => s + (Number(p.paymentAmount) || 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await claimsApi.saveWorksheet(claimId, {
        id: existing?.id ?? null,
        closeManually,
        comments: comments || null,
        reserves,
        payments,
      }) as WorksheetDto;
      onSaved(result);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBook = async () => {
    if (!existing) return;
    try {
      await claimsApi.bookWorksheet(claimId, existing.id);
      onCancel();
    } catch (err) {
      console.error(err);
    }
  };

  const cellStyle: React.CSSProperties = { padding: '6px 8px', border: '1px solid #d8e1ea', fontSize: 12 };
  const inputStyle: React.CSSProperties = { width: '100%', height: 28, border: '1px solid #c8d3df', borderRadius: 3, padding: '0 6px', fontSize: 12 };
  const selectStyle: React.CSSProperties = { ...inputStyle };
  const disabledStyle: React.CSSProperties = { ...inputStyle, background: '#f1f5f9', color: '#64748b' };
  const thStyle: React.CSSProperties = { padding: '8px 10px', background: '#e6f0f6', border: '1px solid #d8e1ea', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Tab strip */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
        {(['reserve', 'payment'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 24px', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? '#0B5AA0' : '#64748b', borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent', marginBottom: -2, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 4 }}>
          <span style={{ fontSize: 12, color: '#64748b', border: '1px solid #d8e1ea', borderRadius: 4, padding: '4px 12px' }}>Currency: USD</span>
        </div>
      </div>

      {/* Reserve grid */}
      {tab === 'reserve' && (
        <div>
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ borderCollapse: 'collapse', minWidth: 1200, fontSize: 12 }}>
              <thead>
                <tr>
                  {['Coverage', 'Coverage Limit', 'Cause of Loss Desc', 'COL Code', 'COL Limit', 'Liability Claim Desc', 'Liability Code', 'Liability Limit', 'Superseding Limit', 'Reserve Amount', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reserves.map((r, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}><select value={r.coverage ?? ''} onChange={e => updateReserve(idx, 'coverage', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{COVERAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><input type="number" value={r.coverageLimit ?? ''} onChange={e => updateReserve(idx, 'coverageLimit', e.target.value ? Number(e.target.value) : null)} style={disabledStyle} readOnly /></td>
                    <td style={cellStyle}><select value={r.causeOfLossDescription ?? ''} onChange={e => updateReserve(idx, 'causeOfLossDescription', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{COL_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><input type="text" value={r.causeOfLossCode ?? ''} readOnly style={disabledStyle} /></td>
                    <td style={cellStyle}><input type="number" value={r.causeOfLossLimit ?? ''} onChange={e => updateReserve(idx, 'causeOfLossLimit', e.target.value ? Number(e.target.value) : null)} style={inputStyle} /></td>
                    <td style={cellStyle}><select value={r.liabilityClaimDescription ?? ''} onChange={e => updateReserve(idx, 'liabilityClaimDescription', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{LIABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><input type="text" value={r.liabilityClaimCode ?? ''} readOnly style={disabledStyle} /></td>
                    <td style={cellStyle}><input type="number" value={r.liabilityLimit ?? ''} onChange={e => updateReserve(idx, 'liabilityLimit', e.target.value ? Number(e.target.value) : null)} style={inputStyle} /></td>
                    <td style={cellStyle}><input type="number" value={r.supersedingLimit ?? ''} onChange={e => updateReserve(idx, 'supersedingLimit', e.target.value ? Number(e.target.value) : null)} style={inputStyle} /></td>
                    <td style={cellStyle}><input type="number" value={r.reserveAmount} onChange={e => updateReserve(idx, 'reserveAmount', Number(e.target.value))} style={inputStyle} /></td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}><button onClick={() => removeReserve(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><TrashIcon /></button></td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={9} style={{ ...cellStyle, textAlign: 'right', paddingRight: 12 }}>Total Reserve:</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(totalReserve)}</td>
                  <td style={cellStyle} />
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={addReserve} style={{ height: 32, padding: '0 16px', border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#fff', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Reserve</button>
        </div>
      )}

      {/* Payment grid */}
      {tab === 'payment' && (
        <div>
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ borderCollapse: 'collapse', minWidth: 900, fontSize: 12 }}>
              <thead>
                <tr>
                  {['Coverage', 'Cause of Loss Desc', 'Payee Type', 'Payee Name', 'Liability Claim', 'Payment Amount', ''].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}><select value={p.coverage ?? ''} onChange={e => updatePayment(idx, 'coverage', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{COVERAGE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><select value={p.causeOfLossDescription ?? ''} onChange={e => updatePayment(idx, 'causeOfLossDescription', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{COL_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><select value={p.payeeType ?? ''} onChange={e => updatePayment(idx, 'payeeType', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{PAYEE_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><input type="text" value={p.payeeName ?? ''} onChange={e => updatePayment(idx, 'payeeName', e.target.value || null)} style={inputStyle} /></td>
                    <td style={cellStyle}><select value={p.liabilityClaim ?? ''} onChange={e => updatePayment(idx, 'liabilityClaim', e.target.value || null)} style={selectStyle}><option value="">Select...</option>{LIABILITY_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></td>
                    <td style={cellStyle}><input type="number" value={p.paymentAmount} onChange={e => updatePayment(idx, 'paymentAmount', Number(e.target.value))} style={inputStyle} /></td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}><button onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}><TrashIcon /></button></td>
                  </tr>
                ))}
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={5} style={{ ...cellStyle, textAlign: 'right', paddingRight: 12 }}>Total Payment:</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{fmt(totalPayment)}</td>
                  <td style={cellStyle} />
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={addPayment} style={{ height: 32, padding: '0 16px', border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#fff', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Payment</button>
        </div>
      )}

      {/* Close Manually + Comments */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            Close Manually
            <button type="button" onClick={() => setCloseManually(v => !v)} style={{ width: 44, height: 24, borderRadius: 12, background: closeManually ? '#0B5AA0' : '#d1d5db', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 3, left: closeManually ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
          </label>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>Comments</label>
          <textarea value={comments} onChange={e => setComments(e.target.value)} style={{ width: '100%', height: 68, border: '1px solid #c8d3df', borderRadius: 3, padding: 8, fontSize: 12, resize: 'vertical' }} />
        </div>
      </div>

      {/* Audit footer */}
      {existing && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px', marginTop: 16, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 12 }}>
          <div><div style={{ color: '#64748b', marginBottom: 3 }}>Created By</div><div style={{ fontWeight: 600 }}>{existing.createdByName}</div></div>
          <div><div style={{ color: '#64748b', marginBottom: 3 }}>Created On</div><div style={{ fontWeight: 600 }}>{existing.createdOn}</div></div>
          <div><div style={{ color: '#64748b', marginBottom: 3 }}>Updated By</div><div style={{ fontWeight: 600 }}>{existing.updatedByName ?? '-'}</div></div>
          <div><div style={{ color: '#64748b', marginBottom: 3 }}>Updated On</div><div style={{ fontWeight: 600 }}>{existing.updatedOn ?? '-'}</div></div>
        </div>
      )}

      {/* Sticky bottom action bar */}
      <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '10px 0', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
        <button onClick={onCancel} style={{ height: 34, minWidth: 100, border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#fff', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ height: 34, minWidth: 100, background: saving ? '#cbd5e1' : '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : 'Save'}</button>
        {existing && (
          <button onClick={handleBook} style={{ height: 34, minWidth: 100, background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Book</button>
        )}
      </div>
    </div>
  );
}

// ── Root WorksheetContent ─────────────────────────────────────────────────────

export function WorksheetContent({ claimId }: { claimId: number }) {
  const [worksheets, setWorksheets] = useState<WorksheetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'matrix' | 'form'>('matrix');
  const [editing, setEditing] = useState<WorksheetDto | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await claimsApi.getWorksheets(claimId) as { worksheets: WorksheetDto[] };
      setWorksheets(data.worksheets ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [claimId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = () => { setEditing(null); setView('form'); };
  const handleEdit = (ws: WorksheetDto) => { setEditing(ws); setView('form'); };
  const handleCancel = () => setView('matrix');
  const handleSaved = (ws: WorksheetDto) => {
    setWorksheets(prev => {
      const idx = prev.findIndex(w => w.id === ws.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = ws; return next; }
      return [...prev, ws];
    });
    setView('matrix');
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, fontSize: 15, color: '#64748b' }}>Loading worksheets...</div>;
  }

  if (view === 'form') {
    return (
      <div style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '16px 18px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>{editing ? `Edit Worksheet – ${editing.wsNumber}` : 'Add Worksheet'}</h2>
        <WorksheetForm claimId={claimId} existing={editing} onCancel={handleCancel} onSaved={handleSaved} />
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', padding: '16px 18px' }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Financials - Worksheet</h2>
      <MatrixView claimId={claimId} worksheets={worksheets} onAdd={handleAdd} onEdit={handleEdit} onRefresh={load} />
    </div>
  );
}


