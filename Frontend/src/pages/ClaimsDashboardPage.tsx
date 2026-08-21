import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsApi } from '../api/claims';

type TabKey = 'fnol' | 'handled' | 'paid' | 'tat' | 'approval' | 'lob' | 'cause';

type Kpis = { total: number; unassigned: number; open: number; pending: number; referred: number };
type ClaimRow = { id: number; claim_number: string; policy_number: string; claim_type: string; claim_estimate?: string; claim_incurred?: string };
type AlertRow = { claim_id: number; claim_number: string; policy_number: string; claim_type: string; message: string };
type AgingRow = { index: number; user_name: string; initials: string; lt3: number; lt5: number; lt10: number; lt15: number; lt20: number; lt25: number; lt30: number };

const trendTabs: { key: TabKey; label: string }[] = [
  { key: 'fnol',     label: 'FNOL Reported by Month' },
  { key: 'handled',  label: 'Average Claim Handled' },
  { key: 'paid',     label: 'Average Claim Paid' },
  { key: 'tat',      label: 'Average TAT of Claim' },
  { key: 'approval', label: 'Claim Approval Trend' },
  { key: 'lob',      label: 'Claim by LOB' },
  { key: 'cause',    label: 'Top 10 Cause of Loss' },
];

// ── SVG icons ─────────────────────────────────────────────────────────────────

function ClaimsIcon({ type, color }: { type: string; color: string }) {
  if (type === 'clipboard') {
    return <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8"><path d="M9 4h6l1 2h3v16H5V6h3l1-2z"/><path d="M9 10h6M9 14h6M9 18h4"/></svg>;
  }
  if (type === 'hand') {
    return <svg width="48" height="42" viewBox="0 0 32 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M2 15h6l4 3h8l8-5c1.2-.8.2-3-1.2-2.3l-7.2 3.1"/><path d="M9 12h7c2.4 0 2.4 3 0 3h-5"/><path d="M23 2h7v9h-7z"/><path d="M25 7l2 2 3-5"/></svg>;
  }
  return <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7"><path d="M5 2h10l4 4v16H5z"/><path d="M15 2v5h5"/><path d="M14 13l3 2 3-2v4c0 2-1.5 3.5-3 4-1.5-.5-3-2-3-4z"/></svg>;
}

function SliderIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="white"/><circle cx="15" cy="12" r="2" fill="white"/><circle cx="11" cy="18" r="2" fill="white"/></svg>;
}

function MenuIcon() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4.5h8M4 8h8M4 11.5h8" strokeLinecap="round"/></svg>;
}

function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v5l-4 2v-7z"/></svg>;
}

// ── Bar chart ──────────────────────────────────────────────────────────────

function PipelineChart({ bars, formatValue }: { bars: { month: string; value: number }[]; formatValue?: (v: number) => string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const fmt = formatValue ?? ((v: number) => String(v));
  const maxVal = Math.max(...bars.map(b => b.value), 1);
  const yMax = maxVal <= 4 ? 4 : maxVal <= 8 ? 8 : Math.ceil(maxVal / 5) * 5;
  const yTicks = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map(v => Math.round(v));
  const CHART_H = 210;
  const LABEL_H = 30;

  return (
    <div style={{ display: 'flex', paddingTop: 4 }}>
      <div style={{ width: 28, height: CHART_H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6, flexShrink: 0 }}>
        {yTicks.map(t => <span key={t} style={{ fontSize: 11, color: '#64748b', lineHeight: 1 }}>{t}</span>)}
      </div>
      <div style={{ flex: 1, position: 'relative', height: CHART_H + LABEL_H }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: CHART_H, pointerEvents: 'none' }}>
          {yTicks.map((t, i) => (
            <div key={t} style={{ position: 'absolute', top: `${(i / (yTicks.length - 1)) * 100}%`, left: 0, right: 0, borderTop: `1px solid ${i === yTicks.length - 1 ? '#b0bec5' : '#e8eef4'}` }} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: CHART_H, display: 'flex', alignItems: 'flex-end', padding: '0 12px', gap: 10 }}>
          {bars.map((bar, i) => {
            const barH = Math.max((bar.value / yMax) * CHART_H, bar.value > 0 ? 4 : 0);
            const isHov = hovered === i;
            return (
              <div key={bar.month} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%', position: 'relative', cursor: 'pointer' }}
                onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                {isHov && (
                  <div style={{ position: 'absolute', bottom: barH + 10, left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '5px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {bar.month}: {fmt(bar.value)}
                  </div>
                )}
                <div style={{ width: '62%', height: barH, background: isHov ? 'linear-gradient(180deg,#8fa4f8 0%,#3d55e8 100%)' : 'linear-gradient(180deg,#6b7ff0 0%,#4865ee 100%)', borderRadius: '3px 3px 0 0', transition: 'background 0.15s' }} />
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: LABEL_H, display: 'flex', padding: '0 12px', gap: 10 }}>
          {bars.map(bar => (
            <div key={bar.month} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#475569', paddingTop: 8, lineHeight: 1.3 }}>{bar.month}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard widgets ──────────────────────────────────────────────────────

function ClaimsWidgetTable({
  title, headers, rows, onClaimClick, onPolicyClick,
}: {
  title: string;
  headers: string[];
  rows: ClaimRow[];
  onClaimClick: (row: ClaimRow) => void;
  onPolicyClick: (policyNumber: string) => void;
}) {
  const lastHeader = headers[headers.length - 1];
  return (
    <section style={{ border: '1px solid #d8e1ea', borderRadius: 6, padding: '14px 16px 16px', background: '#fff' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
      {rows.length === 0
        ? <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>No data available</div>
        : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {headers.map(h => (
                  <th key={h} style={{ background: '#e6f0f6', padding: '12px 16px', border: '1px solid #d7dee6', textAlign: h === lastHeader ? 'right' : 'left', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '8px 16px', border: '1px solid #d7dee6' }}>
                    <button onClick={() => onClaimClick(row)} style={{ background: 'none', border: 'none', padding: 0, color: '#005da8', cursor: 'pointer', fontSize: 13, fontFamily: 'monospace' }}>
                      {row.claim_number || '—'}
                    </button>
                  </td>
                  <td style={{ padding: '8px 16px', border: '1px solid #d7dee6' }}>
                    {row.policy_number
                      ? <button onClick={() => onPolicyClick(row.policy_number!)} style={{ background: 'none', border: 'none', padding: 0, color: '#005da8', cursor: 'pointer', fontSize: 13 }}>{row.policy_number}</button>
                      : '—'}
                  </td>
                  <td style={{ padding: '8px 16px', border: '1px solid #d7dee6' }}>{row.claim_type || '—'}</td>
                  <td style={{ padding: '8px 16px', border: '1px solid #d7dee6', textAlign: 'right' }}>
                    {row.claim_estimate ?? row.claim_incurred ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </section>
  );
}

function AlertCardList({
  title, rows, firstLabel, onClaimClick, onPolicyClick,
}: {
  title: string;
  rows: AlertRow[];
  firstLabel: string;
  onClaimClick: (claimId: number, claimNumber: string) => void;
  onPolicyClick: (policyNumber: string) => void;
}) {
  return (
    <section style={{ border: '1px solid #d8e1ea', borderRadius: 6, padding: '14px 16px', background: '#fff' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{title}</h3>
      {rows.length === 0
        ? <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: 13 }}>No data available</div>
        : (
          <div style={{ display: 'grid', gap: 14 }}>
            {rows.map((row, i) => (
              <div key={i} style={{ border: '1px solid #d7dee6', borderRadius: 4, background: '#f7f8fb', padding: '10px 8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 24, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#1f2937' }}>{firstLabel}</div>
                    <button onClick={() => onClaimClick(row.claim_id, row.claim_number)} style={{ background: 'none', border: 'none', padding: 0, color: '#005da8', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
                      {row.claim_number || '—'}
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#1f2937' }}>Policy ID</div>
                    {row.policy_number
                      ? <button onClick={() => onPolicyClick(row.policy_number)} style={{ background: 'none', border: 'none', padding: 0, color: '#005da8', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>{row.policy_number}</button>
                      : <span style={{ color: '#94a3b8' }}>—</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#1f2937' }}>Claim Type</div>
                    <div style={{ fontWeight: 700 }}>{row.claim_type || '—'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#1f2937' }}>{row.message}</div>
              </div>
            ))}
          </div>
        )}
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ClaimsDashboardPage() {
  const navigate = useNavigate();
  const [mode, setMode]         = useState<'individual' | 'teams'>('individual');
  const [activeTab, setActiveTab] = useState<TabKey>('fnol');
  const [showBanner, setShowBanner] = useState(false);
  const [dashTab, setDashTab]   = useState<'my' | 'ai'>('my');

  // KPIs
  const [kpis, setKpis] = useState<Kpis | null>(null);

  // Widgets
  const [recentFnol, setRecentFnol]       = useState<ClaimRow[]>([]);
  const [assigned, setAssigned]           = useState<ClaimRow[]>([]);
  const [notifications, setNotifications] = useState<AlertRow[]>([]);
  const [notes, setNotes]                 = useState<AlertRow[]>([]);

  // Aging
  const [agingRows, setAgingRows] = useState<AgingRow[]>([]);

  // Charts
  const [fnolData, setFnolData]         = useState<{ month: string; value: number }[]>([]);
  const [fnolLoading, setFnolLoading]   = useState(true);
  const [handledData, setHandledData]   = useState<{ month: string; value: number }[]>([]);
  const [handledLoading, setHandledLoading] = useState(false);
  const [handledFetched, setHandledFetched] = useState(false);
  const [paidData, setPaidData]         = useState<{ month: string; value: number }[]>([]);
  const [paidLoading, setPaidLoading]   = useState(false);
  const [paidFetched, setPaidFetched]   = useState(false);
  const [tatData, setTatData]           = useState<{ month: string; value: number }[]>([]);
  const [tatLoading, setTatLoading]     = useState(false);
  const [tatFetched, setTatFetched]     = useState(false);
  const [chartMonths, setChartMonths]   = useState<{ label: string; value: string }[]>([]);
  const [chartMonthsFetched, setChartMonthsFetched] = useState(false);
  const [selectedApprovalMonth, setSelectedApprovalMonth] = useState('');
  const [approvalData, setApprovalData] = useState<{ month: string; value: number }[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [selectedLobMonth, setSelectedLobMonth] = useState('');
  const [lobData, setLobData]           = useState<{ month: string; value: number }[]>([]);
  const [lobLoading, setLobLoading]     = useState(false);
  const [selectedCauseMonth, setSelectedCauseMonth] = useState('');
  const [causeData, setCauseData]       = useState<{ month: string; value: number }[]>([]);
  const [causeLoading, setCauseLoading] = useState(false);

  // ── Initial loads ──────────────────────────────────────────────────────

  useEffect(() => {
    claimsApi.getDashboardKpis().then(setKpis).catch(() => setKpis(null));
    claimsApi.getDashboardRecentFnol().then(setRecentFnol).catch(() => setRecentFnol([]));
    claimsApi.getDashboardAssigned().then(setAssigned).catch(() => setAssigned([]));
    claimsApi.getDashboardNotifications().then(setNotifications).catch(() => setNotifications([]));
    claimsApi.getDashboardNotes().then(setNotes).catch(() => setNotes([]));
    claimsApi.getDashboardAging().then(setAgingRows).catch(() => setAgingRows([]));
    claimsApi.getDashboardFnolByMonth()
      .then(data => setFnolData(data.map(d => ({ month: d.month, value: d.count }))))
      .catch(() => setFnolData([]))
      .finally(() => setFnolLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'handled' && !handledFetched) {
      setHandledFetched(true); setHandledLoading(true);
      claimsApi.getDashboardAvgClaimHandled()
        .then(data => setHandledData(data.map(d => ({ month: d.month, value: d.count }))))
        .catch(() => setHandledData([]))
        .finally(() => setHandledLoading(false));
    }
    if (activeTab === 'paid' && !paidFetched) {
      setPaidFetched(true); setPaidLoading(true);
      claimsApi.getDashboardAvgClaimPaid()
        .then(data => setPaidData(data.map(d => ({ month: d.month, value: d.amount }))))
        .catch(() => setPaidData([]))
        .finally(() => setPaidLoading(false));
    }
    if (activeTab === 'tat' && !tatFetched) {
      setTatFetched(true); setTatLoading(true);
      claimsApi.getDashboardAvgTat()
        .then(data => setTatData(data.map(d => ({ month: d.month, value: d.avg_days }))))
        .catch(() => setTatData([]))
        .finally(() => setTatLoading(false));
    }
    if ((activeTab === 'approval' || activeTab === 'lob' || activeTab === 'cause') && !chartMonthsFetched) {
      setChartMonthsFetched(true);
      claimsApi.getDashboardChartMonths().then(setChartMonths).catch(() => setChartMonths([]));
    }
  }, [activeTab, handledFetched, paidFetched, tatFetched, chartMonthsFetched]);

  useEffect(() => {
    if (!selectedApprovalMonth) return;
    setApprovalLoading(true);
    claimsApi.getDashboardApprovalTrend(selectedApprovalMonth)
      .then(data => setApprovalData(data.map(d => ({ month: d.status, value: d.count }))))
      .catch(() => setApprovalData([]))
      .finally(() => setApprovalLoading(false));
  }, [selectedApprovalMonth]);

  useEffect(() => {
    if (!selectedLobMonth) return;
    setLobLoading(true);
    claimsApi.getDashboardClaimByLob(selectedLobMonth)
      .then(data => setLobData(data.map(d => ({ month: d.lob, value: d.count }))))
      .catch(() => setLobData([]))
      .finally(() => setLobLoading(false));
  }, [selectedLobMonth]);

  useEffect(() => {
    if (!selectedCauseMonth) return;
    setCauseLoading(true);
    claimsApi.getDashboardTopCauseOfLoss(selectedCauseMonth)
      .then(data => setCauseData(data.map(d => ({ month: d.cause_of_loss, value: d.count }))))
      .catch(() => setCauseData([]))
      .finally(() => setCauseLoading(false));
  }, [selectedCauseMonth]);

  // ── Navigation helpers ─────────────────────────────────────────────────

  function goToClaim(id: number) {
    navigate('/claims/workflow/' + id);
  }
  function goToClaimByNumber(id: number, _claimNumber: string) {
    navigate('/claims/workflow/' + id);
  }
  function goToPolicy(policyNumber: string) {
    if (policyNumber) navigate('/quotes-policies/policies/' + policyNumber);
  }

  const scrollToTop = () => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });

  // ── KPI card definitions ───────────────────────────────────────────────

  const kpiCards = [
    { label: 'Total Claims',  value: kpis?.total      ?? '—', color: '#0B5AA0', icon: 'document'  },
    { label: 'Unassigned',    value: kpis?.unassigned  ?? '—', color: '#43a600', icon: 'clipboard' },
    { label: 'Open',          value: kpis?.open        ?? '—', color: '#009765', icon: 'hand'      },
    { label: 'Pending',       value: kpis?.pending     ?? '—', color: '#d89000', icon: 'hand'      },
    { label: 'Referred',      value: kpis?.referred    ?? '—', color: '#e12b2b', icon: 'hand'      },
  ];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', padding: '16px 18px 28px', background: '#fff', minHeight: '100%' }}>

      {showBanner && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 12, background: '#1e3a5f', color: '#fff', borderRadius: 6, padding: '12px 20px', minWidth: 360, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>This feature is still in progress.</span>
          <button onClick={() => setShowBanner(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 0 0 8px' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, lineHeight: '26px', fontWeight: 700, color: '#0f172a' }}>Claims Dashboard</h1>
        <button onClick={() => navigate('/claims/fnol')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0B5AA0', color: '#fff', borderRadius: 4, padding: '9px 18px', fontSize: 13, fontWeight: 700 }}>
          <span style={{ fontSize: 26, lineHeight: '14px', fontWeight: 300 }}>+</span>
          New Claim
        </button>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'inline-flex', border: '1px solid #9aa7b5', borderRadius: 18, padding: 2, background: '#f8fafc' }}>
          <button onClick={() => setDashTab('my')} style={{ padding: '6px 12px', borderRadius: 16, background: dashTab === 'my' ? '#0B5AA0' : 'transparent', color: dashTab === 'my' ? '#fff' : '#1f2937', fontSize: 13, fontWeight: dashTab === 'my' ? 700 : 400 }}>My Dashboard</button>
          <button onClick={() => { setDashTab('ai'); setShowBanner(true); }} style={{ padding: '6px 12px', borderRadius: 16, background: dashTab === 'ai' ? '#0B5AA0' : 'transparent', color: dashTab === 'ai' ? '#fff' : '#1f2937', fontSize: 13, fontWeight: dashTab === 'ai' ? 700 : 400 }}>AI Insights</button>
        </div>
      </div>

      {/* Individual / Teams toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, fontSize: 13, color: '#111827' }}>
        <button onClick={() => setMode('individual')} style={{ padding: 0, background: 'transparent', color: mode === 'individual' ? '#000' : '#475569', fontWeight: mode === 'individual' ? 600 : 400 }}>Individual</button>
        <button onClick={() => setMode(mode === 'individual' ? 'teams' : 'individual')} aria-label="Toggle dashboard mode" style={{ width: 42, height: 22, padding: 2, borderRadius: 12, background: '#d9d9d9', display: 'inline-flex', justifyContent: mode === 'teams' ? 'flex-end' : 'flex-start' }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.12)' }} />
        </button>
        <button onClick={() => setMode('teams')} style={{ padding: 0, background: 'transparent', color: mode === 'teams' ? '#000' : '#475569', fontWeight: mode === 'teams' ? 600 : 400 }}>Teams</button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(150px, 1fr))', gap: 14, borderBottom: '1px solid #dfe5ec', paddingBottom: 14 }}>
        {kpiCards.map(card => (
          <div key={card.label} style={{ minHeight: 80, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg,#fff7ff 0%,#f2ffff 100%)', border: '1px solid #e4eaf0', borderRadius: 6, padding: '14px 12px' }}>
            <div>
              <div style={{ fontSize: 13, color: '#2d2d2d', marginBottom: 2 }}>{card.label}</div>
              <div style={{ fontSize: 30, lineHeight: '32px', fontWeight: 800, color: card.color }}>{card.value}</div>
            </div>
            <ClaimsIcon type={card.icon} color={card.color} />
          </div>
        ))}
      </div>

      {/* Claim Aging */}
      <section style={{ marginTop: 16, border: '1px solid #d8e1ea', borderRadius: 6, minHeight: 120, padding: '16px 16px 0', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Claim Aging</h2>
          <button onClick={() => setShowBanner(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0B5AA0', background: '#fff', border: '1px solid #0B5AA0', borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>
            <SliderIcon />Config Days
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#000' }}>
              <th style={{ width: 40, padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}><MenuIcon /></th>
              <th style={{ width: 56, padding: '12px 8px', textAlign: 'left', fontWeight: 600 }} />
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>User Name</th>
              <th style={{ width: 56, padding: '12px 8px', textAlign: 'left', color: '#111827' }}><FilterIcon /></th>
              {['< 3 Days','< 5 Days','< 10 Days','< 15 Days','< 20 Days','< 25 Days','< 30 Days'].map(d => (
                <th key={d} style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 500 }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agingRows.length === 0 && (
              <tr>
                <td colSpan={11} style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No open claims</td>
              </tr>
            )}
            {agingRows.map(row => (
              <tr key={row.index} style={{ borderTop: '1px solid #edf1f5' }}>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{row.index}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', background: '#d9f2ff', color: '#0B5AA0', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{row.initials}</span>
                </td>
                <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>{row.user_name}</td>
                <td />
                {[row.lt3, row.lt5, row.lt10, row.lt15, row.lt20, row.lt25, row.lt30].map((v, i) => (
                  <td key={i} style={{ padding: '12px 8px', textAlign: 'center', color: '#334155' }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Trends & Analysis */}
      <section style={{ marginTop: 26 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Trends & Analysis</h2>
        <div style={{ display: 'flex', gap: 26, borderBottom: '1px solid #dfe5ec', overflowX: 'auto' }}>
          {trendTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '5px 0 14px', whiteSpace: 'nowrap', borderRadius: 0, background: 'transparent', color: activeTab === tab.key ? '#0B5AA0' : '#334155', borderBottom: activeTab === tab.key ? '2px solid #0B5AA0' : '2px solid transparent', fontWeight: activeTab === tab.key ? 700 : 400 }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 15, border: '1px solid #d8e1ea', borderRadius: 6, background: '#fff', minHeight: 210, padding: '18px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{trendTabs.find(t => t.key === activeTab)?.label ?? 'Trends'}</h3>
            <button onClick={() => setShowBanner(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0B5AA0', background: '#fff', border: '1px solid #0B5AA0', borderRadius: 4, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}><SliderIcon />Configure Widget</button>
          </div>
          {(() => {
            const usdFmt  = (v: number) => `$${v.toLocaleString()}`;
            const daysFmt = (v: number) => `${v} day${v === 1 ? '' : 's'}`;
            const spinner = (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                <style>{`@keyframes cd-spin{to{transform:rotate(360deg)}}`}</style>
                <div style={{ width: 32, height: 32, border: '3px solid #dbe6f2', borderTopColor: '#0B5AA0', borderRadius: '50%', animation: 'cd-spin 0.8s linear infinite' }} />
              </div>
            );
            const empty = <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 14 }}>No data to display</div>;
            const MonthDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}><span style={{ color: '#e12b2b' }}>* </span>Select Month</label>
                <select value={value} onChange={e => onChange(e.target.value)} style={{ width: 240, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 13, color: '#1f2937', background: '#fff', cursor: 'pointer' }}>
                  <option value="">Select...</option>
                  {chartMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            );
            if (activeTab === 'approval') return (<><MonthDropdown value={selectedApprovalMonth} onChange={setSelectedApprovalMonth} />{!selectedApprovalMonth ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Select a month to view the approval trend</div> : approvalLoading ? spinner : approvalData.length === 0 ? empty : <PipelineChart bars={approvalData} />}</>);
            if (activeTab === 'lob') return (<><MonthDropdown value={selectedLobMonth} onChange={setSelectedLobMonth} />{!selectedLobMonth ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Select a month to view claims by LOB</div> : lobLoading ? spinner : lobData.length === 0 ? empty : <PipelineChart bars={lobData} />}</>);
            if (activeTab === 'cause') return (<><MonthDropdown value={selectedCauseMonth} onChange={setSelectedCauseMonth} />{!selectedCauseMonth ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>Select a month to view top 10 causes of loss</div> : causeLoading ? spinner : causeData.length === 0 ? empty : <PipelineChart bars={causeData} />}</>);
            type TabCfg = { loading: boolean; data: { month: string; value: number }[] | null; formatValue?: (v: number) => string };
            const cfg: TabCfg =
              activeTab === 'fnol'    ? { loading: fnolLoading,    data: fnolData,    formatValue: undefined } :
              activeTab === 'handled' ? { loading: handledLoading, data: handledData, formatValue: undefined } :
              activeTab === 'paid'    ? { loading: paidLoading,    data: paidData,    formatValue: usdFmt    } :
              activeTab === 'tat'     ? { loading: tatLoading,     data: tatData,     formatValue: daysFmt   } :
              { loading: false, data: null };
            if (cfg.loading) return spinner;
            if (cfg.data !== null) return cfg.data.length === 0 ? empty : <PipelineChart bars={cfg.data} formatValue={cfg.formatValue} />;
            return empty;
          })()}
        </div>
      </section>

      {/* Dashboard widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <ClaimsWidgetTable
          title="FNOL Reported"
          headers={['Claim ID', 'Policy ID', 'Claim Type', 'Claim Estimate']}
          rows={recentFnol}
          onClaimClick={row => goToClaim(row.id)}
          onPolicyClick={goToPolicy}
        />
        <ClaimsWidgetTable
          title="Assigned Claims"
          headers={['Claim No.', 'Policy ID', 'Claim Type', 'Claim Incurred']}
          rows={assigned}
          onClaimClick={row => goToClaim(row.id)}
          onPolicyClick={goToPolicy}
        />
        <AlertCardList
          title="Notifications & Alerts"
          rows={notifications}
          firstLabel="Claim Number"
          onClaimClick={goToClaimByNumber}
          onPolicyClick={goToPolicy}
        />
        <AlertCardList
          title="Notes"
          rows={notes}
          firstLabel="Claim ID"
          onClaimClick={goToClaimByNumber}
          onPolicyClick={goToPolicy}
        />
      </div>

      {/* Back to top */}
      <button onClick={scrollToTop} aria-label="Back to top" title="Back to top"
        style={{ position: 'fixed', right: 28, bottom: 72, width: 58, height: 58, borderRadius: '50%', background: '#0B5AA0', color: '#fff', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: '0 6px 16px rgba(11,90,160,0.28)', zIndex: 40, fontSize: 11, fontWeight: 700 }}>
        <svg width="24" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7"/><path d="m5 21 7-7 7 7"/></svg>
        <span>Top</span>
      </button>
    </div>
  );
}
