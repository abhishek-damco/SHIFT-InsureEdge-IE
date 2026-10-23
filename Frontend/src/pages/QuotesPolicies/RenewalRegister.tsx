import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { avatarColor, initials } from './QuotesPoliciesLandingShell';
import {
  KpiStat, FilterPopup, ColPanel, FunnelIcon, EyeIcon, RefreshIcon, DocIcon,
  ICON_DOC, ICON_DOC_CHECK, ICON_DOC_X, ICON_DOC_DRAFT, ICON_DOC_CLOCK,
  evalOp, type AppliedFilters, type ColFilter, type SortState,
} from './GridHelpers';
import { quotesPoliciesApi } from '../../api/quotesPolicies';
import type { RenewalListItemDto, RenewalsKpiDto } from '../../types/Policy';

type Renewal = RenewalListItemDto;
type Kpis = RenewalsKpiDto;

const COL_DEFS = [
  { key: 'id',                   label: 'Renewal ID' },
  { key: 'originalPolicyNumber', label: 'Original Policy Number' },
  { key: 'lob',                  label: 'Line of Business' },
  { key: 'subProduct',           label: 'Sub Product' },
  { key: 'intermediaryType',     label: 'Intermediary Type' },
  { key: 'intermediary',         label: 'Intermediary' },
  { key: 'producerName',         label: 'Producer Name' },
  { key: 'effectiveDate',        label: 'Effective Date' },
  { key: 'createdAt',            label: 'Creation Date' },
  { key: 'expirationDate',       label: 'Expiration Date' },
  { key: 'renewalOfferDate',     label: 'Renewal Offer Date' },
  { key: 'premiumEstimate',      label: 'Premium Estimate' },
] as const;

const ALL_LABELS: Record<string, string> = {
  ...Object.fromEntries(COL_DEFS.map(c => [c.key, c.label])),
  insuredName: 'Insured Name', status: 'Status',
};

type ColKey = typeof COL_DEFS[number]['key'];
type ColVisibility = Record<ColKey, boolean>;
const DEFAULT_VIS = Object.fromEntries(COL_DEFS.map(c => [c.key, true])) as ColVisibility;
const PAGE_SIZES = [10, 25, 50] as const;

function Th({ col, label, sort, onSort, filters, onFilterClick, filterPopup }: {
  col: string; label: string; sort: SortState | null;
  onSort: (col: string) => void; filters: AppliedFilters;
  onFilterClick: (col: string, e: React.MouseEvent) => void;
  filterPopup: { col: string } | null;
}) {
  const has = !!filters[col];
  const isSort = sort?.col === col;
  return (
    <th className={has ? 'th-filtered' : ''}>
      <div className="th-inner">
        <span className="th-label" style={{ color: has ? '#1a3b6b' : undefined, cursor: 'pointer' }} onClick={() => onSort(col)}>
          {label}{isSort && <span className="sort-arrow">{sort!.dir === 'asc' ? ' ↑' : ' ↓'}</span>}
        </span>
        <button className={`filter-icon${has ? ' filter-on' : ''}${filterPopup?.col === col ? ' filter-open' : ''}`} onClick={e => onFilterClick(col, e)}>
          <FunnelIcon />
        </button>
      </div>
    </th>
  );
}

export default function RenewalRegister({ insuredType }: { insuredType: string }) {
  const label = insuredType === 'individual' ? 'Individual' : 'Business';
  const navigate = useNavigate();
  const [rows, setRows]         = useState<Renewal[]>([]);
  const [kpis, setKpis]         = useState<Kpis | null>(null);
  const [search, setSearch]     = useState('');
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [filters, setFilters]   = useState<AppliedFilters>({});
  const [sort, setSort]         = useState<SortState | null>(null);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [visibleCols, setVisibleCols] = useState<ColVisibility>(DEFAULT_VIS);
  const [filterPopup, setFilterPopup] = useState<{ col: string; anchor: { top: number; left: number } } | null>(null);
  const [colPanelOpen, setColPanelOpen]     = useState(false);
  const [colPanelAnchor, setColPanelAnchor] = useState({ top: 0, left: 0 });
  const colBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    quotesPoliciesApi.getRenewalsKpis(insuredType).then(setKpis);
  }, [insuredType]);

  useEffect(() => {
    quotesPoliciesApi.getRenewals(insuredType).then(setRows);
  }, [insuredType]);

  useEffect(() => { setPage(1); }, [search, kpiFilter, filters, sort]);

  // r.id is the Policy's quote_number (see RenewalListItemDto), not the Submission's own id —
  // those differ for renewal drafts. Resolve the real Submission id before navigating,
  // otherwise the wizard 404s and a Save mints a new blank Submission, losing the real draft.
  async function openRenewal(quoteNumber: string) {
    try {
      const { id: submissionId } = await quotesPoliciesApi.getSubmissionIdByQuoteNumber(quoteNumber);
      navigate(`/quotes-policies/submissions/${submissionId}?step=4`);
    } catch (err) {
      console.error('Failed to resolve submission for renewal', quoteNumber, err);
    }
  }

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const s = search.toLowerCase();
      r = r.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(s)));
    }
    if (kpiFilter) {
      r = r.filter(row => (row.status || '').toLowerCase().replace(/\s+/g, '') === kpiFilter);
    }
    for (const [col, f] of Object.entries(filters)) {
      r = r.filter(row => {
        const cell = String((row as unknown as Record<string, unknown>)[col] ?? '');
        if (f.kind === 'value') return f.values.includes(cell);
        const p1 = evalOp(f.op1, cell, f.val1);
        const p2 = evalOp(f.op2, cell, f.val2);
        return f.logic === 'and' ? p1 && p2 : p1 || p2;
      });
    }
    return r;
  }, [rows, search, kpiFilter, filters]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sort.col] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sort.col] ?? '');
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows   = sorted.slice((page - 1) * pageSize, page * pageSize);
  const activeFilters = Object.keys(filters).length;

  function handleSort(col: string) {
    setSort(s => s?.col === col && s.dir === 'asc' ? { col, dir: 'desc' } : { col, dir: 'asc' });
  }
  function openFilter(col: string, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setFilterPopup(p => p?.col === col ? null : { col, anchor: { top: rect.bottom + 4, left: rect.left } });
  }
  function applyFilter(col: string, f: ColFilter | null) {
    setFilters(prev => { const n = { ...prev }; if (f == null) delete n[col]; else n[col] = f; return n; });
  }
  function toggleKpi(key: string) {
    setKpiFilter(prev => prev === key ? null : key);
  }
  function getOptions(col: string) {
    return [...new Set(rows.map(r => String((r as unknown as Record<string, unknown>)[col] ?? '')))].sort();
  }
  function renderPages() {
    const delta = 2;
    const nums: number[] = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) nums.push(i);
    return nums.map(n => <button key={n} className={`page-btn${n === page ? ' active' : ''}`} onClick={() => setPage(n)}>{n}</button>);
  }

  return (
    <div className="page-content">
      <div className="page-title">{label} — Renewal Business Quotes</div>

      {kpis && (
        <div className="kpi-row">
          <KpiStat label="Total"    value={kpis.total}    color="#1a3b6b" icon={<DocIcon path={ICON_DOC}       />} active={kpiFilter === 'total'}    onClick={() => toggleKpi('total')} />
          <KpiStat label="Draft"    value={kpis.draft}    color="#d97706" icon={<DocIcon path={ICON_DOC_DRAFT} />} active={kpiFilter === 'draft'}    onClick={() => toggleKpi('draft')} />
          <KpiStat label="Pending"  value={kpis.pending}  color="#6366f1" icon={<DocIcon path={ICON_DOC_CLOCK} />} active={kpiFilter === 'pending'}  onClick={() => toggleKpi('pending')} />
          <KpiStat label="Declined" value={kpis.declined} color="#dc2626" icon={<DocIcon path={ICON_DOC_X}     />} active={kpiFilter === 'declined'} onClick={() => toggleKpi('declined')} />
          <KpiStat label="Expired"  value={kpis.expired}  color="#92400e" icon={<DocIcon path={ICON_DOC_CHECK} />} active={kpiFilter === 'expired'}  onClick={() => toggleKpi('expired')} />
        </div>
      )}

      <div className="register-card">
        <div className="register-toolbar">
          <div className="search-input-reg">
            <span className="search-icon">&#128269;</span>
            <input placeholder="Search by Keyword" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="toolbar-spacer" />
          <div className="split-btn">
            <button className="btn btn-outline btn-left" style={{ fontSize: 11 }}>Download</button>
            <button className="btn btn-outline btn-right" style={{ fontSize: 11 }}>&#8964;</button>
          </div>
        </div>

        {(activeFilters > 0 || kpiFilter) && (
          <div className="applied-filters-bar">
            <span className="applied-filters-label">Applied Filter(s):</span>
            <div className="applied-filter-chips">
              {kpiFilter && (
                <span className="applied-filter-chip">KPI: {kpiFilter}<button onClick={() => setKpiFilter(null)}>×</button></span>
              )}
              {Object.entries(filters).map(([col, f]) => (
                <span key={col} className="applied-filter-chip">
                  {ALL_LABELS[col] ?? col} {f.kind === 'value' ? `(${f.values.length})` : '(cond)'}
                  <button onClick={() => applyFilter(col, null)}>×</button>
                </span>
              ))}
            </div>
            <button className="clear-all-filters-btn" onClick={() => { setFilters({}); setKpiFilter(null); }}>
              <RefreshIcon /> Clear All
            </button>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <button
                    ref={colBtnRef}
                    className={`col-panel-trigger${colPanelOpen ? ' col-panel-open' : ''}`}
                    onMouseDown={e => {
                      e.stopPropagation(); e.preventDefault();
                      if (!colPanelOpen && colBtnRef.current) {
                        const r = colBtnRef.current.getBoundingClientRect();
                        setColPanelAnchor({ top: r.bottom + 4, left: r.left });
                      }
                      setColPanelOpen(p => !p);
                    }}
                  >&#9776;</button>
                </th>
                <th style={{ width: 28 }}></th>
                <th>Action</th>
                {visibleCols.id                   && <Th col="id"                   label="Renewal ID"              sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.originalPolicyNumber && <Th col="originalPolicyNumber" label="Original Policy Number"  sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                <Th col="insuredName"               label="Insured Name"            sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />
                {visibleCols.lob                  && <Th col="lob"                  label="Line of Business"        sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.subProduct           && <Th col="subProduct"           label="Sub Product"             sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.intermediaryType     && <Th col="intermediaryType"     label="Intermediary Type"       sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.intermediary         && <Th col="intermediary"         label="Intermediary"            sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.producerName         && <Th col="producerName"         label="Producer Name"           sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.effectiveDate        && <Th col="effectiveDate"        label="Effective Date"          sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.createdAt            && <Th col="createdAt"            label="Creation Date"           sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.expirationDate       && <Th col="expirationDate"       label="Expiration Date"         sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.renewalOfferDate     && <Th col="renewalOfferDate"     label="Renewal Offer Date"      sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                {visibleCols.premiumEstimate      && <Th col="premiumEstimate"      label="Premium Estimate"        sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />}
                <Th col="status"                    label="Status"                  sort={sort} onSort={handleSort} filters={filters} onFilterClick={openFilter} filterPopup={filterPopup} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && <tr><td colSpan={20} className="no-data">No Data Available</td></tr>}
              {pageRows.map((r, i) => (
                <tr key={r.id} className="data-row" onClick={() => openRenewal(r.id)}>
                  <td className="row-num">{(page - 1) * pageSize + i + 1}</td>
                  <td><input type="checkbox" /></td>
                  <td><div className="action-cell"><button className="action-btn" title="View Plans Overview" onClick={e => { e.stopPropagation(); openRenewal(r.id); }}><EyeIcon /></button></div></td>
                  {visibleCols.id                   && <td className="mono">{r.id}</td>}
                  {visibleCols.originalPolicyNumber && <td className="mono" style={{ color: '#1a3b6b' }}>{r.originalPolicyNumber}</td>}
                  <td>
                    <div className="insured-cell">
                      <div className="insured-avatar" style={{ background: avatarColor(r.insuredName) }}>{initials(r.insuredName)}</div>
                      <span className="insured-name">{r.insuredName}</span>
                    </div>
                  </td>
                  {visibleCols.lob              && <td>{r.lob}</td>}
                  {visibleCols.subProduct       && <td>{r.subProduct || <span style={{ color: '#9ca3af' }}>-</span>}</td>}
                  {visibleCols.intermediaryType && <td>{r.intermediaryType}</td>}
                  {visibleCols.intermediary     && <td>{r.intermediary}</td>}
                  {visibleCols.producerName     && <td>{r.producerName}</td>}
                  {visibleCols.effectiveDate    && <td>{r.effectiveDate}</td>}
                  {visibleCols.createdAt        && <td>{r.createdAt}</td>}
                  {visibleCols.expirationDate   && <td>{r.expirationDate}</td>}
                  {visibleCols.renewalOfferDate && <td>{r.renewalOfferDate}</td>}
                  {visibleCols.premiumEstimate  && <td style={{ textAlign: 'right' }}>{r.premiumEstimate != null ? `$${Number(r.premiumEstimate).toLocaleString()}` : <span style={{ color: '#9ca3af' }}>-</span>}</td>}
                  <td><span className={`badge badge-${(r.status || '').toLowerCase().replace(/\s+/g, '-')}`}><span className="badge-dot" />{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing&nbsp;
            <select className="page-size-select" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            &nbsp;records · {sorted.length.toLocaleString()} results
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>&#8249;</button>
            {renderPages()}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>&#8250;</button>
          </div>
        </div>
      </div>

      {filterPopup && (
        <FilterPopup
          colKey={filterPopup.col}
          colLabel={ALL_LABELS[filterPopup.col] ?? filterPopup.col}
          options={getOptions(filterPopup.col)}
          current={filters[filterPopup.col] ?? null}
          anchor={filterPopup.anchor}
          onApply={f => applyFilter(filterPopup.col, f)}
          onClose={() => setFilterPopup(null)}
        />
      )}

      {colPanelOpen && (
        <ColPanel
          colDefs={COL_DEFS}
          visibleCols={visibleCols as Record<string, boolean>}
          onToggle={key => setVisibleCols(v => ({ ...v, [key]: !v[key as ColKey] }))}
          onClose={() => setColPanelOpen(false)}
          anchor={colPanelAnchor}
        />
      )}
    </div>
  );
}
