import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Filter, List, RefreshCw, Search, Settings2, SlidersHorizontal } from 'lucide-react';
import { dashboardApi } from '../api/dashboard';
import { authApi } from '../api/auth';
import { usePermissions } from '../contexts/PermissionContext';
import type { DashboardFailedPayment, DashboardPagedResponse, DashboardPendingCancellation, DashboardPreference, DashboardQuoteQuery, DashboardQuoteResponse, DashboardRenewalRadar, DashboardSummary, DashboardWidgetPreference } from '../types/Dashboard';
import './DashboardPage.css';

type FilterKey = 'accountType' | 'transactionType' | 'insuredName' | 'lob' | 'effectiveDate' | 'approvalStatus' | 'creationDate' | 'premiumEstimate' | 'status';
type Filters = Record<FilterKey, string>;
type ListKey = 'pending' | 'renewals' | 'failed';
type ListQueryState = Record<ListKey, { page: number; pageSize: number; search: string; sortColumn: string; sortDirection: 'asc' | 'desc' }>;
type FailedFilterKey = 'policyNumber' | 'effectiveDate' | 'expiryDate' | 'paymentDate' | 'amountDue' | 'reason';
type FailedFilters = Record<FailedFilterKey, string>;

const emptyFilters: Filters = { accountType: '', transactionType: '', insuredName: '', lob: '', effectiveDate: '', approvalStatus: '', creationDate: '', premiumEstimate: '', status: '' };
const emptyFailedFilters: FailedFilters = { policyNumber: '', effectiveDate: '', expiryDate: '', paymentDate: '', amountDue: '', reason: '' };
const widgetLabels: Record<string, string> = {
  quoteKpis: 'Quote status cards', producerKpis: 'Producer KPI cards', policyKpis: 'Policy KPI cards', coverageKpis: 'Written Premium by Coverage Level',
  writtenPremium: 'Written Premium', recentQuotes: 'Recent Quote Activities', pendingCancellations: 'Pending Cancellation',
  renewalRadar: 'Renewal Radar', failedPayments: 'Failed Payments on Monthly Installment Policies', tasksReminders: 'Tasks & Reminders', myNotes: 'My Notes',
};

function initials(name: string) { return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(); }
function statusClass(value: string | null) { return (value || '').toLowerCase().replace(/\s+/g, '-'); }
function money(value: number | null, _currency = 'USD') { return value == null ? '-' : `USD ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function apiMessage(error: unknown, fallback: string) {
  const value = error as { response?: { data?: { error?: string; message?: string } } };
  return value.response?.data?.error || value.response?.data?.message || fallback;
}

function SortButton({ label, column, activeColumn, direction, onSort }: { label: string; column: string; activeColumn: string; direction: 'asc' | 'desc'; onSort: (column: string) => void }) {
  const active = column === activeColumn;
  return <button type="button" className="dashboard-header-control" onClick={() => onSort(column)} aria-label={`Sort by ${label}${active ? `, ${direction}ending` : ''}`}>{label}{active && <ChevronDown size={14} style={{ transform: direction === 'asc' ? 'rotate(180deg)' : undefined }} />}</button>;
}

function KpiIcon({ variant, size = 50 }: { variant: 'uploaded' | 'approved' | 'notApproved' | 'expired' | 'total' | 'active' | 'bound' | 'cancelled' | 'coverage'; size?: number }) {
  if (variant === 'coverage') return <svg className="dashboard-kpi-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
    <path d="m14 6 .7 1.4 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2L14 6Z" />
    <path d="M10 13h6" />
  </svg>;

  return <svg className="dashboard-kpi-icon" width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M8 4h23l9 9v29H8zM31 4v10h9" />
    {variant === 'uploaded' && <><path d="M22 34V20m0 0-6 6m6-6 6 6" /><path d="m30 37 4 4 8-9" /></>}
    {variant === 'approved' && <path d="m27 35 5 5 10-12" />}
    {variant === 'notApproved' && <path d="m30 31 11 11m0-11L30 42" />}
    {variant === 'expired' && <><circle cx="35" cy="36" r="8" /><path d="M35 31v5l4 2M29 28l-2-3m14 3 2-3" /></>}
    {variant === 'total' && <path d="M28 36h15m-7.5-7.5v15" />}
    {variant === 'active' && <><path d="M28 34a8 8 0 0 1 13-5l2 2m0-6v6h-6M43 36a8 8 0 0 1-13 5l-2-2m0 6v-6h6" /></>}
    {variant === 'bound' && <><path d="M28 34a8 8 0 0 1 13-5l2 2M43 36a8 8 0 0 1-13 5l-2-2" /><path d="m27 27 16 16" /></>}
    {variant === 'cancelled' && <><circle cx="35" cy="36" r="8" /><path d="m29.5 30.5 11 11" /></>}
  </svg>;
}

function FilterControl({ label, filterKey, value, options, onApply }: { label: string; filterKey: FilterKey; value: string; options?: string[]; onApply: (key: FilterKey, value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return <span className="dashboard-filter-wrap">
    <button type="button" className={`dashboard-filter-button${value ? ' active' : ''}`} aria-label={`Filter ${label}`} onClick={() => setOpen(current => !current)}><SlidersHorizontal size={17} /></button>
    {open && <div className="dashboard-filter-popover">
      {options ? <select value={draft} onChange={event => setDraft(event.target.value)} aria-label={`${label} value`}><option value="">All</option>{options.map(option => <option key={option}>{option}</option>)}</select>
        : <input type={filterKey.includes('Date') || filterKey === 'effectiveDate' ? 'date' : filterKey === 'premiumEstimate' ? 'number' : 'text'} min={filterKey === 'premiumEstimate' ? 0 : undefined} value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Filter ${label.toLowerCase()}`} />}
      <div className="dashboard-filter-actions"><button type="button" onClick={() => { setDraft(''); onApply(filterKey, ''); setOpen(false); }}>Clear</button><button type="button" className="apply" onClick={() => { onApply(filterKey, draft); setOpen(false); }}>Apply</button></div>
    </div>}
  </span>;
}

function FailedPaymentFilter({ label, filterKey, value, onApply }: { label: string; filterKey: FailedFilterKey; value: string; onApply: (key: FailedFilterKey, value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const inputType = filterKey === 'amountDue' ? 'number' : filterKey.toLowerCase().includes('date') ? 'date' : 'text';
  return <span className="dashboard-filter-wrap">
    <button type="button" className={`dashboard-filter-button${value ? ' active' : ''}`} aria-label={`Filter ${label}`} aria-expanded={open} onClick={() => setOpen(current => !current)}><Filter size={17} /></button>
    {open && <div className="dashboard-filter-popover">
      <input type={inputType} min={inputType === 'number' ? 0 : undefined} step={inputType === 'number' ? '0.01' : undefined} value={draft} onChange={event => setDraft(event.target.value)} placeholder={`Filter ${label.toLowerCase()}`} />
      <div className="dashboard-filter-actions"><button type="button" onClick={() => { setDraft(''); onApply(filterKey, ''); setOpen(false); }}>Clear</button><button type="button" className="apply" onClick={() => { onApply(filterKey, draft.trim()); setOpen(false); }}>Apply</button></div>
    </div>}
  </span>;
}

function Pagination({ page, pageSize, total, onPage, onPageSize }: { page: number; pageSize: number; total: number; onPage: (page: number) => void; onPageSize?: (size: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const numbers = useMemo(() => [...new Set([1, 2, page - 1, page, page + 1, totalPages])].filter(value => value >= 1 && value <= totalPages).sort((a, b) => a - b), [page, totalPages]);
  return <div className="dashboard-pagination">
    <span>Showing {onPageSize ? <select value={pageSize} onChange={event => onPageSize(Number(event.target.value))}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></select> : pageSize} records from {total.toLocaleString()} Results</span>
    <div className="dashboard-page-buttons"><button disabled={page === 1} onClick={() => onPage(1)} aria-label="First page"><ChevronsLeft size={16} /></button><button disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      {numbers.map((value, index) => <span key={value} style={{ display: 'contents' }}>{index > 0 && value - numbers[index - 1] > 1 && <span>…</span>}<button className={page === value ? 'active' : ''} onClick={() => onPage(value)}>{value}</button></span>)}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button><button disabled={page === totalPages} onClick={() => onPage(totalPages)} aria-label="Last page"><ChevronsRight size={16} /></button></div>
  </div>;
}

function KpiCards({ cards }: { cards: Array<{ label: string; value: number; color: string; icon: React.ReactNode }> }) {
  return <div className="dashboard-card-grid">{cards.map(card => <div className="dashboard-kpi" key={card.label}><div><div className="dashboard-kpi-label">{card.label}</div><div className="dashboard-kpi-value" style={{ color: card.color }}>{card.value.toLocaleString()}</div></div><span style={{ color: card.color }}>{card.icon}</span></div>)}</div>;
}

const emptyPage = <T,>(): DashboardPagedResponse<T> => ({ data: [], total: 0, page: 1, pageSize: 10 });

export default function DashboardPage() {
  const navigate = useNavigate();
  const permission = usePermissions('DASHBOARD');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [preference, setPreference] = useState<DashboardPreference | null>(null);
  const [preferenceDraft, setPreferenceDraft] = useState<DashboardWidgetPreference[]>([]);
  const [configOpen, setConfigOpen] = useState(false);
  const [quotes, setQuotes] = useState<DashboardQuoteResponse | null>(null);
  const [pending, setPending] = useState<DashboardPagedResponse<DashboardPendingCancellation>>(emptyPage);
  const [renewals, setRenewals] = useState<DashboardPagedResponse<DashboardRenewalRadar>>(emptyPage);
  const [failedPayments, setFailedPayments] = useState<DashboardPagedResponse<DashboardFailedPayment>>(emptyPage);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [sortColumn, setSortColumn] = useState('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [failedFilters, setFailedFilters] = useState<FailedFilters>(emptyFailedFilters);
  const [listQuery, setListQuery] = useState<ListQueryState>({
    pending: { page: 1, pageSize: 10, search: '', sortColumn: 'dueDate', sortDirection: 'asc' },
    renewals: { page: 1, pageSize: 10, search: '', sortColumn: 'expiryDate', sortDirection: 'asc' },
    failed: { page: 1, pageSize: 10, search: '', sortColumn: 'paymentDate', sortDirection: 'desc' },
  });
  const [listDraft, setListDraft] = useState({ pending: '', renewals: '', failed: '' });
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [currentUserName, setCurrentUserName] = useState('User');

  const visible = useCallback((key: string) => preference?.widgets.find(item => item.widgetKey === key)?.isVisible ?? true, [preference]);
  const widgetOrder = useCallback((key: string) => (preference?.widgets.find(item => item.widgetKey === key)?.displayOrder ?? 99) + 10, [preference]);

  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [summaryResult, preferenceResult, userResult] = await Promise.allSettled([dashboardApi.getSummary(), dashboardApi.getPreference(), authApi.getMe()]);
      if (summaryResult.status === 'rejected') throw summaryResult.reason;
      setSummary(summaryResult.value);
      setPreference(preferenceResult.status === 'fulfilled' ? preferenceResult.value : null);
      if (userResult.status === 'fulfilled' && userResult.value.fullName.trim()) setCurrentUserName(userResult.value.fullName.trim());
    } catch (err) { setError(apiMessage(err, 'Unable to load dashboard data. Please try again.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (permission.loaded && permission.view) void loadDashboard(); }, [permission.loaded, permission.view, loadDashboard]);

  useEffect(() => {
    if (!summary || summary.context.persona !== 'producer' || !permission.view) return;
    let active = true; setGridLoading(true);
    const query: DashboardQuoteQuery = { page, pageSize, search: search || undefined, sortColumn, sortDirection, ...filters };
    dashboardApi.getQuotes(query).then(result => { if (active) setQuotes(result); }).catch(err => { if (active) setError(apiMessage(err, 'Unable to load recent quote activities.')); }).finally(() => { if (active) setGridLoading(false); });
    return () => { active = false; };
  }, [summary, permission.view, page, pageSize, search, sortColumn, sortDirection, filters]);

  useEffect(() => {
    if (!summary || !permission.view) return;
    let active = true;
    if (summary.context.persona === 'producer') {
      Promise.all([
        dashboardApi.getPendingCancellations({ ...listQuery.pending, search: listQuery.pending.search || undefined }),
        dashboardApi.getRenewalRadar({ ...listQuery.renewals, search: listQuery.renewals.search || undefined }),
      ]).then(([pendingResult, renewalResult]) => { if (active) { setPending(pendingResult); setRenewals(renewalResult); } })
        .catch(err => { if (active) setError(apiMessage(err, 'Unable to load producer policy alerts.')); });
    } else {
      dashboardApi.getFailedPayments({
        ...listQuery.failed,
        search: listQuery.failed.search || undefined,
        policyNumber: failedFilters.policyNumber || undefined,
        effectiveDate: failedFilters.effectiveDate || undefined,
        expiryDate: failedFilters.expiryDate || undefined,
        paymentDate: failedFilters.paymentDate || undefined,
        amountDue: failedFilters.amountDue ? Number(failedFilters.amountDue) : undefined,
        reason: failedFilters.reason || undefined,
      })
        .then(result => { if (active) setFailedPayments(result); })
        .catch(err => { if (active) setError(apiMessage(err, 'Unable to load failed policy payments.')); });
    }
    return () => { active = false; };
  }, [summary, permission.view, listQuery, failedFilters]);

  function submitListSearch(key: ListKey) {
    setListQuery(current => ({ ...current, [key]: { ...current[key], page: 1, search: listDraft[key].trim() } }));
  }
  function setListPage(key: ListKey, nextPage: number) {
    setListQuery(current => ({ ...current, [key]: { ...current[key], page: nextPage } }));
  }
  function setListPageSize(key: ListKey, pageSize: number) {
    setListQuery(current => ({ ...current, [key]: { ...current[key], page: 1, pageSize } }));
  }
  function sortListBy(key: ListKey, column: string) {
    setListQuery(current => ({ ...current, [key]: {
      ...current[key], page: 1, sortColumn: column,
      sortDirection: current[key].sortColumn === column && current[key].sortDirection === 'asc' ? 'desc' : 'asc',
    } }));
  }
  function applyFailedFilter(key: FailedFilterKey, value: string) {
    setFailedFilters(current => ({ ...current, [key]: value }));
    setListQuery(current => ({ ...current, failed: { ...current.failed, page: 1 } }));
  }
  function applyFilter(key: FilterKey, value: string) { setFilters(current => ({ ...current, [key]: value })); setPage(1); }
  function sortBy(column: string) { if (sortColumn === column) setSortDirection(current => current === 'asc' ? 'desc' : 'asc'); else { setSortColumn(column); setSortDirection('asc'); } setPage(1); }
  async function openRecord(policyId: number, recordNumber: string, type: 'quote' | 'policy') { try { await dashboardApi.recordView(policyId); } catch { /* navigation must remain available if audit logging fails */ } navigate(type === 'quote' ? `/quotes-policies/submissions/${policyId}` : `/quotes-policies/policies/${encodeURIComponent(recordNumber)}`); }
  async function initiateRenewal(row: DashboardRenewalRadar) { setNotice(''); try { const result = await dashboardApi.initiateRenewal(row.policyId); navigate(`/quotes-policies/submissions/${result.policyId}`); } catch (err) { setError(apiMessage(err, 'Unable to initiate renewal.')); } }
  async function savePreference() { if (!preferenceDraft.some(item => item.isVisible)) { setError('Select at least one dashboard widget.'); return; } try { const saved = await dashboardApi.savePreference({ widgets: preferenceDraft }); setPreference(saved); setConfigOpen(false); setNotice('Dashboard configuration saved.'); } catch (err) { setError(apiMessage(err, 'Unable to save dashboard configuration.')); } }
  function moveWidget(index: number, delta: number) { const next = [...preferenceDraft]; const destination = index + delta; if (destination < 0 || destination >= next.length) return; [next[index], next[destination]] = [next[destination], next[index]]; setPreferenceDraft(next.map((item, order) => ({ ...item, displayOrder: order }))); }

  if (!permission.loaded || (permission.view && loading)) return <div className="dashboard-loading">Loading dashboard…</div>;
  if (!permission.view) return <div className="dashboard-error">You do not have permission to view the Dashboard.</div>;
  if (!summary) return <div className="dashboard-error">{error || 'Dashboard data is unavailable.'}</div>;

  const quoteCards = [
    { label: 'Uploaded', value: summary.quoteKpis.uploaded, color: '#0093d4', icon: <KpiIcon variant="uploaded" /> },
    { label: 'Approved', value: summary.quoteKpis.approved, color: '#43a900', icon: <KpiIcon variant="approved" /> },
    { label: 'Not Approved', value: summary.quoteKpis.notApproved, color: '#ad003b', icon: <KpiIcon variant="notApproved" /> },
    { label: 'Expired', value: summary.quoteKpis.expired, color: '#ad003b', icon: <KpiIcon variant="expired" /> },
  ];
  const policyCards = summary.policyKpis ? [
    { label: 'Total', value: summary.policyKpis.totalPolicies, color: '#2456b3', icon: <KpiIcon variant="total" /> },
    { label: 'Active', value: summary.policyKpis.activePolicies, color: '#43a900', icon: <KpiIcon variant="active" /> },
    { label: 'Bound', value: summary.policyKpis.boundPolicies, color: '#50585d', icon: <KpiIcon variant="bound" /> },
    { label: 'Cancelled', value: summary.policyKpis.cancelledPolicies, color: '#e52b2f', icon: <KpiIcon variant="cancelled" /> },
  ] : [];

  return <div className="dashboard-page"><div className="dashboard-surface">
    <div className="dashboard-heading"><div>{summary.context.persona === 'client' ? <h1>Welcome, {currentUserName} !</h1> : <><h1>My Dashboard</h1><div className="dashboard-persona">Producer Dashboard</div></>}</div><div className="dashboard-heading-actions" style={{ display: 'none' }} aria-hidden="true"><button className="dashboard-config-button" onClick={() => { if (summary.context.persona === 'producer') { setNotice('Feature in progress'); return; } setPreferenceDraft([...(preference?.widgets || [])]); setConfigOpen(true); }}><Settings2 size={19} />Config Widgets</button><button className="dashboard-config-button" onClick={() => void loadDashboard()}><RefreshCw size={18} />Refresh</button></div></div>
    {error && <div className="dashboard-banner error" role="alert">{error}<button onClick={() => setError('')}>×</button></div>}{notice && <div className="dashboard-banner success" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}

    {visible('quoteKpis') && <div className="dashboard-widget-slot" style={{ order: widgetOrder('quoteKpis') }}><h2 className="dashboard-section-title">New Business Quotes</h2><KpiCards cards={quoteCards} /></div>}
    {summary.context.persona === 'client' && visible('policyKpis') && <div className="dashboard-widget-slot" style={{ order: widgetOrder('policyKpis') }}><h2 className="dashboard-section-title">Policies</h2><KpiCards cards={policyCards} /></div>}
    {summary.context.persona === 'client' && visible('coverageKpis') && summary.coverageKpis && <div className="dashboard-widget-slot" style={{ order: widgetOrder('coverageKpis') }}><h2 className="dashboard-section-title">Written Premium by Coverage Level</h2><KpiCards cards={[
      { label: 'Basic Plan', value: summary.coverageKpis.basic, color: '#075fa8', icon: <KpiIcon variant="coverage" size={36} /> }, { label: 'Standard Plan', value: summary.coverageKpis.standard, color: '#075fa8', icon: <KpiIcon variant="coverage" size={36} /> }, { label: 'Preferred Plan', value: summary.coverageKpis.preferred, color: '#075fa8', icon: <KpiIcon variant="coverage" size={36} /> },
    ]} /></div>}

    {summary.context.persona === 'producer' && visible('writtenPremium') && <section className="dashboard-widget" style={{ order: widgetOrder('writtenPremium') }}><h2>Written Premium</h2><div className="dashboard-premium-grid">{summary.writtenPremium.map(item => <div className="dashboard-premium-card" key={item.year}><div><div className="dashboard-premium-year">{item.year}</div><div className="dashboard-premium-value">{money(item.amount, summary.context.currency)}</div></div><CalendarDays size={43} color="#075fa8" strokeWidth={1.7} /></div>)}</div></section>}

    {summary.context.persona === 'producer' && visible('recentQuotes') && <section className="dashboard-widget" style={{ order: widgetOrder('recentQuotes') }}><h2>Recent Quote Activities</h2><form className="dashboard-search" onSubmit={event => { event.preventDefault(); setSearch(searchDraft.trim()); setPage(1); }}><Search size={17} /><input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="Search by Keyword" /><button type="submit">Search</button>{search && <button type="button" onClick={() => { setSearch(''); setSearchDraft(''); setPage(1); }}>Clear</button>}</form>
      {gridLoading ? <div className="dashboard-loading grid">Your data is being loaded to the grid.</div> : <><div className="dashboard-table-wrap"><table className="dashboard-table"><thead><tr><th><List size={17} /></th><th>Action</th><th><SortButton label="Quote Number" column="quoteNumber" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /></th><th><SortButton label="Transaction Type" column="transactionType" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Transaction Type" filterKey="transactionType" value={filters.transactionType} options={['New Business', 'Endorsement', 'Renewal']} onApply={applyFilter} /></th><th><SortButton label="Insured Name" column="insuredName" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Insured Name" filterKey="insuredName" value={filters.insuredName} onApply={applyFilter} /></th><th>Type <FilterControl label="Type" filterKey="accountType" value={filters.accountType} options={['Individual', 'Business']} onApply={applyFilter} /></th><th><SortButton label="LOB" column="lob" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="LOB" filterKey="lob" value={filters.lob} onApply={applyFilter} /></th><th><SortButton label="Effective Date" column="effectiveDate" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Effective Date" filterKey="effectiveDate" value={filters.effectiveDate} onApply={applyFilter} /></th><th><SortButton label="Approval Status" column="approvalStatus" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Approval Status" filterKey="approvalStatus" value={filters.approvalStatus} options={['Approved', 'Not Approved']} onApply={applyFilter} /></th><th><SortButton label="Creation Date" column="creationDate" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Creation Date" filterKey="creationDate" value={filters.creationDate} onApply={applyFilter} /></th><th><SortButton label={`Est Premium (${summary.context.currency})`} column="premium" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Estimated Premium" filterKey="premiumEstimate" value={filters.premiumEstimate} onApply={applyFilter} /></th><th><SortButton label="Status" column="status" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /> <FilterControl label="Status" filterKey="status" value={filters.status} options={['Draft', 'Pending', 'Submitted', 'Bound', 'Expired']} onApply={applyFilter} /></th><th><SortButton label="Last Updated" column="lastUpdated" activeColumn={sortColumn} direction={sortDirection} onSort={sortBy} /></th></tr></thead>
        <tbody>{quotes?.data.length ? quotes.data.map((quote, index) => <tr key={quote.policyId}><td className="number-cell">{(page - 1) * pageSize + index + 1}</td><td><button className="dashboard-action" title="View" onClick={() => void openRecord(quote.policyId, quote.quoteNumber, 'quote')}><Eye size={18} /></button></td><td>{quote.quoteNumber}</td><td>{quote.transactionType}</td><td><span className="dashboard-avatar">{initials(quote.insuredName)}</span>{quote.insuredName}</td><td>{quote.insuredType || '-'}</td><td>{quote.lob || '-'}</td><td>{quote.transactionEffectiveDate || '-'}</td><td><span className={`dashboard-pill ${statusClass(quote.approvalStatus)}`}>{quote.approvalStatus || '-'}</span></td><td>{quote.creationDate}</td><td>{money(quote.premiumEstimate, summary.context.currency)}</td><td><span className={`dashboard-pill ${statusClass(quote.status)}`}>{quote.status || '-'}</span></td><td>{quote.lastUpdated || '-'}</td></tr>) : <tr><td colSpan={13} className="dashboard-no-data">No quote activities found.</td></tr>}</tbody></table></div><Pagination page={page} pageSize={pageSize} total={quotes?.total || 0} onPage={setPage} onPageSize={size => { setPageSize(size); setPage(1); }} /></>}
    </section>}

    {summary.context.persona === 'producer' && visible('pendingCancellations') && <section className="dashboard-widget" style={{ order: widgetOrder('pendingCancellations') }}><h2>Pending Cancellation</h2><form className="dashboard-search" onSubmit={event => { event.preventDefault(); submitListSearch('pending'); }}><Search size={17} /><input value={listDraft.pending} onChange={event => setListDraft(current => ({ ...current, pending: event.target.value }))} placeholder="Search policy number, days, due date, or amount" /><button type="submit">Search</button>{listQuery.pending.search && <button type="button" onClick={() => { setListDraft(current => ({ ...current, pending: '' })); setListQuery(current => ({ ...current, pending: { ...current.pending, page: 1, search: '' } })); }}>Clear</button>}</form><div className="dashboard-table-wrap"><table className="dashboard-alert-table"><thead><tr><th>Action</th><th>Policy Number</th><th>Insured Name</th><th>Days Overdue</th><th>Due Date</th><th>Premium Amount</th></tr></thead><tbody>{pending.data.length ? pending.data.map(row => <tr key={row.paymentTransactionId}><td><button className="dashboard-action" title="Follow Up" onClick={() => void openRecord(row.policyId, row.policyNumber, 'policy')}><Eye size={17} /></button></td><td>{row.policyNumber}</td><td>{row.insuredName}</td><td>{row.daysOverdue}</td><td>{row.dueDate}</td><td>{money(row.premiumAmount, row.currency)}</td></tr>) : <tr><td colSpan={6} className="dashboard-no-data">No policies pending cancellation.</td></tr>}</tbody></table></div><Pagination page={pending.page} pageSize={pending.pageSize} total={pending.total} onPage={next => setListPage('pending', next)} onPageSize={size => setListPageSize('pending', size)} /></section>}
    {summary.context.persona === 'producer' && visible('renewalRadar') && <section className="dashboard-widget" style={{ order: widgetOrder('renewalRadar') }}><div className="dashboard-widget-heading"><h2>Renewal Radar</h2><span>Policies expiring in 0–60 days</span></div><form className="dashboard-search" onSubmit={event => { event.preventDefault(); submitListSearch('renewals'); }}><Search size={17} /><input value={listDraft.renewals} onChange={event => setListDraft(current => ({ ...current, renewals: event.target.value }))} placeholder="Search policy, LOB, premium, date, or days" /><button type="submit">Search</button>{listQuery.renewals.search && <button type="button" onClick={() => { setListDraft(current => ({ ...current, renewals: '' })); setListQuery(current => ({ ...current, renewals: { ...current.renewals, page: 1, search: '' } })); }}>Clear</button>}</form><div className="dashboard-table-wrap"><table className="dashboard-alert-table"><thead><tr><th>Actions</th><th>Policy Number</th><th>Insured Name</th><th>Line of Business</th><th>Premium</th><th>Risk Level</th><th>Expiration Date</th><th>Days Until Expiry</th></tr></thead><tbody>{renewals.data.length ? renewals.data.map(row => <tr key={row.policyId}><td><button className="dashboard-action" title="View Policy" onClick={() => void openRecord(row.policyId, row.policyNumber, 'policy')}><Eye size={17} /></button><button className="dashboard-renew" onClick={() => void initiateRenewal(row)}>Initiate Renewal</button></td><td>{row.policyNumber}</td><td>{row.insuredName}</td><td>{row.lineOfBusiness || '-'}</td><td>{money(row.premiumAmount, row.currency)}</td><td>{row.riskLevel || '-'}</td><td>{row.expiryDate}</td><td>{row.daysUntilExpiry}</td></tr>) : <tr><td colSpan={8} className="dashboard-no-data">No policies expire in the next 60 days.</td></tr>}</tbody></table></div><Pagination page={renewals.page} pageSize={renewals.pageSize} total={renewals.total} onPage={next => setListPage('renewals', next)} onPageSize={size => setListPageSize('renewals', size)} /></section>}
    {summary.context.persona === 'producer' && visible('myNotes') && <section className="dashboard-widget" style={{ order: widgetOrder('myNotes') }}><h2>My Notes</h2><div className="dashboard-empty">No notes available.</div></section>}

    {summary.context.persona === 'client' && visible('failedPayments') && <section className="dashboard-widget" style={{ order: widgetOrder('failedPayments') }}><h2>Failed Payments on Monthly Installment Policies</h2><div className="dashboard-table-wrap"><table className="dashboard-alert-table"><thead><tr><th>Action</th><th><div className="dashboard-filterable-header"><SortButton label="Policy Number" column="policyNumber" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Policy Number" filterKey="policyNumber" value={failedFilters.policyNumber} onApply={applyFailedFilter} /></div></th><th><div className="dashboard-filterable-header"><SortButton label="Effective Date" column="effectiveDate" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Effective Date" filterKey="effectiveDate" value={failedFilters.effectiveDate} onApply={applyFailedFilter} /></div></th><th><div className="dashboard-filterable-header"><SortButton label="Expiration Date" column="expiryDate" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Expiration Date" filterKey="expiryDate" value={failedFilters.expiryDate} onApply={applyFailedFilter} /></div></th><th><div className="dashboard-filterable-header"><SortButton label="Installment Due Date" column="paymentDate" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Installment Due Date" filterKey="paymentDate" value={failedFilters.paymentDate} onApply={applyFailedFilter} /></div></th><th><div className="dashboard-filterable-header"><SortButton label="Installment Amount" column="amountDue" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Installment Amount" filterKey="amountDue" value={failedFilters.amountDue} onApply={applyFailedFilter} /></div></th><th><div className="dashboard-filterable-header"><SortButton label="Reason" column="reason" activeColumn={listQuery.failed.sortColumn} direction={listQuery.failed.sortDirection} onSort={column => sortListBy('failed', column)} /><FailedPaymentFilter label="Reason" filterKey="reason" value={failedFilters.reason} onApply={applyFailedFilter} /></div></th></tr></thead><tbody>{failedPayments.data.length ? failedPayments.data.map(row => <tr key={row.paymentTransactionId}><td><button className="dashboard-action" title="View Policy" onClick={() => void openRecord(row.policyId, row.policyNumber, 'policy')}><Eye size={17} /></button></td><td>{row.policyNumber}</td><td>{row.effectiveDate || '-'}</td><td>{row.expiryDate || '-'}</td><td>{row.paymentDate}</td><td>{money(row.amountDue, row.currency)}</td><td>{row.reason}</td></tr>) : <tr><td colSpan={7} className="dashboard-no-data">No Data Available</td></tr>}</tbody></table></div><Pagination page={failedPayments.page} pageSize={failedPayments.pageSize} total={failedPayments.total} onPage={next => setListPage('failed', next)} onPageSize={size => setListPageSize('failed', size)} /></section>}

    {summary.recentActivities.length > 0 && <section className="dashboard-widget" style={{ order: 1000 }}><h2>Recent Activity</h2><div className="dashboard-activity-list">{summary.recentActivities.map(activity => <button key={activity.id} onClick={() => void openRecord(activity.policyId, activity.recordNumber, activity.recordType)}><span><strong>View</strong>{activity.description}</span><ChevronRight size={16} /></button>)}</div></section>}
  </div>
    <button className="dashboard-top" onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><ChevronsLeft size={23} style={{ transform: 'rotate(90deg)' }} />Top</button>
    {configOpen && <div className="dashboard-modal-backdrop" onMouseDown={event => { if (event.currentTarget === event.target) setConfigOpen(false); }}><div className="dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="widget-config-title"><h2 id="widget-config-title">Configure Widgets</h2><p>Choose visible widgets and their display order.</p>{preferenceDraft.map((item, index) => <div className="dashboard-widget-config" key={item.widgetKey}><label><input type="checkbox" checked={item.isVisible} onChange={event => setPreferenceDraft(current => current.map(row => row.widgetKey === item.widgetKey ? { ...row, isVisible: event.target.checked } : row))} />{widgetLabels[item.widgetKey] || item.widgetKey}</label><span><button disabled={index === 0} onClick={() => moveWidget(index, -1)}>↑</button><button disabled={index === preferenceDraft.length - 1} onClick={() => moveWidget(index, 1)}>↓</button></span></div>)}<div className="dashboard-modal-actions"><button onClick={() => setConfigOpen(false)}>Cancel</button><button className="primary" onClick={() => void savePreference()}>Save</button></div></div></div>}
  </div>;
}
