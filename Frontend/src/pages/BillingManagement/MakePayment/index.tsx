import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { billingApi } from '../../../api/distribution';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PaymentHeader {
  policy_id:             number;
  policy_number:         string;
  insured_name:          string;
  mortgagee:             string;
  total_premium:         number;
  total_installment_due: number;
}

interface PaymentTransaction {
  id:                number;
  transaction_type:  string;
  product:           string;
  effective_date:    string | null;
  expiration_date:   string | null;
  due_date:          string | null;
  total_premium_usd: number;
  due_usd:           number;
  total_due_usd:     number;
  amount_usd:        number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—';
  const part = String(v).split('T')[0];
  const [y, m, d] = part.split('-');
  return `${m}-${d}-${y}`;
}

function fmtUSD(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `USD ${Number(v).toFixed(2)}`;
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(2);
}

function padTime(n: number) { return String(Math.max(0, n)).padStart(2, '0'); }

// ── Calendar Icon ─────────────────────────────────────────────────────────────

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MakePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [header,       setHeader]       = useState<PaymentHeader | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [paymentMode, setPaymentMode] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [refNumber,   setRefNumber]   = useState('');
  const [refAmount,   setRefAmount]   = useState('');

  const [fieldErrors,  setFieldErrors]  = useState<{ mode?: string; date?: string }>({});
  const [showMismatch, setShowMismatch] = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [apiError,     setApiError]     = useState<string | null>(null);
  const [countdown,    setCountdown]    = useState(8);

  const dateInputRef = useRef<HTMLInputElement>(null);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    billingApi.getPaymentDetail(Number(id))
      .then((data: any) => {
        setHeader(data.header);
        setTransactions(data.transactions ?? []);
        if (data.header?.total_installment_due != null) {
          setRefAmount(Number(data.header.total_installment_due).toFixed(2));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCountdown = useCallback(() => {
    setCountdown(8);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); navigate('/billing'); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [navigate]);

  function stopAndGo(path: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(path);
  }

  async function handleSubmit() {
    setApiError(null);
    const errs: { mode?: string; date?: string } = {};
    if (!paymentMode) errs.mode = 'Provide Payment Mode to continue';
    if (!paymentDate) errs.date = 'Provide Payment Date to continue';
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});

    if (header && refAmount.trim() !== '') {
      const diff = Math.abs(parseFloat(refAmount) - Number(header.total_installment_due));
      if (!isNaN(diff) && diff > 0.009) { setShowMismatch(true); return; }
    }

    setSubmitting(true);
    try {
      await billingApi.recordPayment(Number(id), {
        paymentMethod:    paymentMode,
        paymentDate,
        paymentRefNumber: refNumber.trim() || undefined,
        paymentRefAmount: refAmount.trim() ? parseFloat(refAmount) : undefined,
      });
      setShowSuccess(true);
      startCountdown();
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ padding: '40px 28px', color: '#6b7280', fontSize: 13 }}>Loading…</div>
  );
  if (!header) return (
    <div style={{ padding: '40px 28px', color: '#dc2626', fontSize: 13 }}>Transaction not found.</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>

      <div style={{ flex: 1, padding: '22px 28px 0' }}>

        <h1 className="page-title" style={{ marginBottom: 4 }}>Make Payment</h1>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          <button onClick={() => navigate('/billing')}
            style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: 'pointer', fontSize: 13 }}>
            Policy Payments
          </button>
          <span> / Make Payment</span>
        </div>

        {/* Policy Summary Bar */}
        <div className="grid-wrapper" style={{ marginBottom: 16, borderRadius: 10 }}>
          <div style={{ display: 'flex' }}>
            <SummaryField label="Mortgagee"             value={header.mortgagee || ''}               borderRight />
            <SummaryField label="Policy Number"         value={header.policy_number}                 borderRight />
            <SummaryField label="Insured Name"          value={header.insured_name}         blue      borderRight />
            <SummaryField label="Total Premium"         value={fmtUSD(header.total_premium)}          borderRight />
            <SummaryField label="Total Installment Due" value={fmtUSD(header.total_installment_due)} />
          </div>
        </div>

        {/* Billing Detail Table */}
        <div className="grid-wrapper" style={{ marginBottom: 16 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="dm-grid">
              <thead>
                <tr>
                  {['Transaction Type','Product','Effective Date','Expiration Date','Due Date',
                    'Total Premium (USD)','Due (USD)','Total Due (USD)','Amount (USD)'].map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0
                  ? <tr className="grid-row"><td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: 20 }}>No billing records found.</td></tr>
                  : transactions.map(t => (
                    <tr key={t.id} className="grid-row">
                      <td>{t.transaction_type}</td>
                      <td>{t.product}</td>
                      <td>{fmtDate(t.effective_date)}</td>
                      <td>{fmtDate(t.expiration_date)}</td>
                      <td>{fmtDate(t.due_date)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(t.total_premium_usd)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(t.due_usd)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(t.total_due_usd)}</td>
                      <td style={{ textAlign: 'right' }}>{fmtNum(t.amount_usd)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Entry Form */}
        <div className="grid-wrapper" style={{ marginBottom: 16, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 40 }}>
          <div style={{ minWidth: 160, textAlign: 'center', paddingTop: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>
              USD {Number(header.total_installment_due).toFixed(2)}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Payment Amount</div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <div>
              <label style={FIELD_LABEL}><span style={{ color: '#dc2626' }}>* </span>Payment Mode</label>
              <select value={paymentMode}
                onChange={e => { setPaymentMode(e.target.value); setFieldErrors(p => ({ ...p, mode: undefined })); }}
                style={{ ...FIELD_INPUT, borderColor: fieldErrors.mode ? '#dc2626' : '#d1d5db' }}>
                <option value="">Select...</option>
                <option value="Check">Check</option>
                <option value="ACH Transfer">ACH Transfer</option>
              </select>
              {fieldErrors.mode && <p style={ERR_TEXT}><span style={{ color: '#dc2626' }}>&#9679; </span>{fieldErrors.mode}</p>}
            </div>

            <div>
              <label style={FIELD_LABEL}><span style={{ color: '#dc2626' }}>* </span>Payment Date</label>
              <div style={{ position: 'relative' }}>
                <input ref={dateInputRef} type="date" value={paymentDate}
                  onChange={e => { setPaymentDate(e.target.value); setFieldErrors(p => ({ ...p, date: undefined })); }}
                  style={{ ...FIELD_INPUT, borderColor: fieldErrors.date ? '#dc2626' : '#d1d5db', paddingRight: 36 }} />
                <button type="button" tabIndex={-1}
                  onClick={() => { try { (dateInputRef.current as any)?.showPicker?.(); } catch { /* unsupported */ } }}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon />
                </button>
              </div>
              {fieldErrors.date && <p style={ERR_TEXT}><span style={{ color: '#dc2626' }}>&#9679; </span>{fieldErrors.date}</p>}
            </div>

            <div>
              <label style={FIELD_LABEL}>Payment Ref Number</label>
              <input type="text" value={refNumber} onChange={e => setRefNumber(e.target.value)} style={FIELD_INPUT} />
            </div>

            <div>
              <label style={FIELD_LABEL}>Payment Ref Amount</label>
              <input type="text" value={refAmount} onChange={e => setRefAmount(e.target.value)} style={FIELD_INPUT} />
            </div>
          </div>
        </div>

        {apiError && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 13, color: '#991b1b' }}>
            {apiError}
          </div>
        )}

        <div style={{ height: 72 }} />
      </div>

      {/* Sticky Footer */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '12px 28px', display: 'flex', justifyContent: 'flex-end', gap: 10, boxShadow: '0 -2px 8px rgba(0,0,0,.06)' }}>
        <button className="btn btn--outline" onClick={() => navigate('/billing')}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting}
          style={{ opacity: submitting ? 0.65 : 1 }}>
          {submitting ? 'Processing…' : 'Clear Due Amount'}
        </button>
      </div>

      {/* Mismatch Warning Modal */}
      {showMismatch && (
        <ModalOverlay>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
            The payment reference amount and the<br />allocated payment amount do not match.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn--outline" onClick={() => setShowMismatch(false)}>Close</button>
          </div>
        </ModalOverlay>
      )}

      {/* Success Modal */}
      {showSuccess && (
        <ModalOverlay>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', textAlign: 'center', marginBottom: 20 }}>
            Outstanding Due Amounts updated successfully
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            <button className="btn btn--outline" onClick={() => stopAndGo('/billing')}>Back to Policy Payments</button>
            <button className="btn btn--outline" onClick={() => stopAndGo('/')}>Go to Dashboard</button>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
            After <strong>00:{padTime(countdown)}</strong> seconds, the system will automatically re-direct to Policy Payments screen
          </p>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── Modal overlay wrapper ─────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '36px 44px', maxWidth: 460, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,.22)' }}>
        {children}
      </div>
    </div>
  );
}

// ── Summary Bar Field ─────────────────────────────────────────────────────────

function SummaryField({ label, value, blue, borderRight }: { label: string; value: string; blue?: boolean; borderRight?: boolean }) {
  return (
    <div style={{ flex: 1, padding: '14px 20px', borderRight: borderRight ? '1px solid #e2e8f0' : 'none' }}>
      <div style={{ fontSize: 11, color: '#2563eb', marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: blue ? '#2563eb' : '#1a1a2e', fontWeight: 500 }}>{value || ' '}</div>
    </div>
  );
}

// ── Shared form styles ────────────────────────────────────────────────────────

const FIELD_LABEL: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280',
  marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px',
};

const FIELD_INPUT: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #d1d5db',
  borderRadius: 6, fontSize: 13, color: '#111827', background: '#fff',
  outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s, box-shadow 0.15s',
  appearance: 'auto' as any,
};

const ERR_TEXT: React.CSSProperties = {
  fontSize: 12, color: '#dc2626', marginTop: 4,
  display: 'flex', alignItems: 'center',
};
