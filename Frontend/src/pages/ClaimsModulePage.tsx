import { useMemo, useState } from 'react';
import PaginationBar from '../components/PaginationBar';

type ModuleKey = 'bulk-upload' | 'authority' | 'adjusters' | 'payees' | 'catastrophic-events' | 'letter-template' | 'master-configuration';

type ClaimModuleConfig = {
  title: string;
  crumb: string;
  primaryAction: string;
  stats: { label: string; value: string; color: string }[];
  columns: string[];
  rows: string[][];
};

const configs: Record<ModuleKey, ClaimModuleConfig> = {
  'bulk-upload': {
    title: 'Bulk Claim Upload',
    crumb: 'Claims / Bulk Claim Upload',
    primaryAction: 'Import Claims',
    stats: [
      { label: 'Uploaded Files', value: '12', color: '#0B5AA0' },
      { label: 'Processed', value: '9', color: '#009765' },
      { label: 'Pending Review', value: '3', color: '#d89000' },
    ],
    columns: ['Batch ID', 'File Name', 'Uploaded By', 'Uploaded On', 'Records', 'Status'],
    rows: [
      ['BULK-00012', 'claim_upload_june.xlsx', 'Hudson Client Admin', '06-24-2026', '84', 'Pending Review'],
      ['BULK-00011', 'fnol_batch_001.csv', 'Hudson Client Admin', '06-20-2026', '42', 'Processed'],
      ['BULK-00010', 'claims_import_may.xlsx', 'Hudson Client Admin', '05-28-2026', '63', 'Processed'],
    ],
  },
  authority: {
    title: 'Claims Authority',
    crumb: 'Claims / Claims Authority',
    primaryAction: 'Add Authority',
    stats: [
      { label: 'Authority Rules', value: '6', color: '#0B5AA0' },
      { label: 'Active', value: '5', color: '#009765' },
      { label: 'Inactive', value: '1', color: '#d82929' },
    ],
    columns: ['Authority ID', 'Role', 'LOB', 'Limit', 'Approval Level', 'Status'],
    rows: [
      ['AUTH-0001', 'Claims Manager', 'Homeowners', 'USD 25,000', 'Level 2', 'Active'],
      ['AUTH-0002', 'Senior Adjuster', 'Homeowners', 'USD 10,000', 'Level 1', 'Active'],
      ['AUTH-0003', 'Client Admin', 'All', 'USD 50,000', 'Level 3', 'Active'],
    ],
  },
  adjusters: {
    title: 'Adjuster Management',
    crumb: 'Claims / Adjuster Management',
    primaryAction: 'Add Adjuster',
    stats: [
      { label: 'Adjusters', value: '8', color: '#0B5AA0' },
      { label: 'Available', value: '6', color: '#009765' },
      { label: 'Assigned', value: '2', color: '#d89000' },
    ],
    columns: ['Adjuster ID', 'Adjuster Name', 'Region', 'Open Claims', 'Phone', 'Status'],
    rows: [
      ['ADJ-0001', 'Maya Scott', 'Northeast', '4', '555-0142', 'Available'],
      ['ADJ-0002', 'Kevin Moore', 'Midwest', '7', '555-0178', 'Assigned'],
      ['ADJ-0003', 'Sara Lewis', 'South', '2', '555-0191', 'Available'],
    ],
  },
  payees: {
    title: 'Payee List',
    crumb: 'Claims / Payee List',
    primaryAction: 'Add Payee',
    stats: [
      { label: 'Payees', value: '14', color: '#0B5AA0' },
      { label: 'Verified', value: '11', color: '#009765' },
      { label: 'Pending', value: '3', color: '#d89000' },
    ],
    columns: ['Payee ID', 'Payee Name', 'Type', 'Tax ID', 'Payment Method', 'Status'],
    rows: [
      ['PAY-0001', 'Hudson Repair Services', 'Vendor', '***-**-2191', 'ACH', 'Verified'],
      ['PAY-0002', 'John Williams', 'Claimant', '***-**-3018', 'Check', 'Pending'],
      ['PAY-0003', 'North Glass Works', 'Vendor', '***-**-1184', 'ACH', 'Verified'],
    ],
  },
  'catastrophic-events': {
    title: 'Catastrophic Events',
    crumb: 'Claims / Catastrophic Events',
    primaryAction: 'Add Event',
    stats: [
      { label: 'Events', value: '5', color: '#0B5AA0' },
      { label: 'Active', value: '2', color: '#d89000' },
      { label: 'Closed', value: '3', color: '#009765' },
    ],
    columns: ['Event ID', 'Event Name', 'Type', 'Start Date', 'Affected Region', 'Status'],
    rows: [
      ['CAT-0001', 'June Windstorm', 'Wind', '06-12-2026', 'Northeast', 'Active'],
      ['CAT-0002', 'Spring Flooding', 'Flood', '04-18-2026', 'Midwest', 'Closed'],
      ['CAT-0003', 'Hail Event 2026', 'Hail', '05-08-2026', 'South', 'Active'],
    ],
  },
  'letter-template': {
    title: 'Claim Letter Template',
    crumb: 'Claims / Claim Letter Template',
    primaryAction: 'Add Template',
    stats: [
      { label: 'Templates', value: '9', color: '#0B5AA0' },
      { label: 'Published', value: '7', color: '#009765' },
      { label: 'Draft', value: '2', color: '#d89000' },
    ],
    columns: ['Template ID', 'Template Name', 'Category', 'Last Updated', 'Updated By', 'Status'],
    rows: [
      ['LET-0001', 'Claim Acknowledgement', 'Notification', '06-10-2026', 'Hudson Client Admin', 'Published'],
      ['LET-0002', 'Document Request', 'Notification', '06-08-2026', 'Hudson Client Admin', 'Published'],
      ['LET-0003', 'Settlement Offer', 'Settlement', '05-28-2026', 'Hudson Client Admin', 'Draft'],
    ],
  },
  'master-configuration': {
    title: 'Claims Master Configuration',
    crumb: 'Claims / Claims Master Configuration',
    primaryAction: 'Add Configuration',
    stats: [
      { label: 'Configurations', value: '18', color: '#0B5AA0' },
      { label: 'Active', value: '18', color: '#009765' },
      { label: 'Needs Review', value: '0', color: '#d82929' },
    ],
    columns: ['Config ID', 'Configuration', 'Category', 'Value Count', 'Last Updated', 'Status'],
    rows: [
      ['CFG-0001', 'Cause of Loss', 'Reference Data', '12', '06-14-2026', 'Active'],
      ['CFG-0002', 'Claim Type', 'Reference Data', '5', '06-14-2026', 'Active'],
      ['CFG-0003', 'Reimbursement Type', 'Reference Data', '4', '06-01-2026', 'Active'],
    ],
  },
};

function SearchIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

function ColumnsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h10M8 12h10M8 18h10" /><path d="M5 6h.01M5 12h.01M5 18h.01" /></svg>;
}

function FilterIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6 7v5l-4 2v-7L4 5z" /></svg>;
}

function StatusPill({ value }: { value: string }) {
  const positive = ['Active', 'Available', 'Verified', 'Processed', 'Published', 'Closed'].includes(value);
  const warning = ['Pending', 'Assigned', 'Pending Review', 'Draft'].includes(value);
  const color = positive ? '#006b3c' : warning ? '#9a6400' : '#374151';
  const border = positive ? '#008c55' : warning ? '#d89000' : '#94a3b8';
  const bg = positive ? '#d7f7e4' : warning ? '#fff4d6' : '#eef2f7';
  return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 86, height: 24, padding: '0 12px', borderRadius: 999, border: `1px solid ${border}`, background: bg, color, fontSize: 12, fontWeight: 700 }}>{value}</span>;
}

function ComingSoonPage() {
  const lines = Array.from({ length: 16 }, (_, i) => i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: '#fff', padding: 40 }}>
      <div style={{ textAlign: 'center', position: 'relative', userSelect: 'none' }}>
        {/* Radiating starburst lines via SVG overlay */}
        <svg
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0 }}
          width="500" height="500" viewBox="-250 -250 500 500"
        >
          {lines.map(i => {
            const angle = (i / 16) * 360;
            const rad = (angle * Math.PI) / 180;
            const x1 = Math.cos(rad) * 130;
            const y1 = Math.sin(rad) * 130;
            const x2 = Math.cos(rad) * 220;
            const y2 = Math.sin(rad) * 220;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c8d8e8" strokeWidth="1.2" />;
          })}
        </svg>

        {/* UNDER CONSTRUCTION banner */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            background: '#1a2a4a',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase' as const,
            padding: '9px 36px',
            borderRadius: 4,
          }}>
            Under Construction
          </div>
        </div>

        {/* COMING SOON */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 36 }}>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#0d1f3c', lineHeight: 1, letterSpacing: -2 }}>COMING</div>
          <div style={{ fontSize: 72, fontWeight: 900, color: '#0d1f3c', lineHeight: 1, letterSpacing: -2 }}>SOON</div>
        </div>

        {/* STAY TUNED badge */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 116,
            height: 116,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00b87a 0%, #00956a 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
            lineHeight: 1.3,
            boxShadow: '0 4px 24px rgba(0,180,120,0.4)',
          }}>
            Stay<br />Tuned
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClaimsModulePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const config = configs[moduleKey];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (moduleKey === 'catastrophic-events' || moduleKey === 'bulk-upload') {
    return <ComingSoonPage />;
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return config.rows;
    return config.rows.filter(row => row.some(cell => cell.toLowerCase().includes(query)));
  }, [config.rows, search]);

  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ padding: '16px 18px 28px', background: '#fff', minHeight: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{config.crumb}</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>{config.title}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 22 }}>
        {config.stats.map(stat => (
          <div key={stat.label} style={{ minHeight: 78, background: 'linear-gradient(90deg, #fff8ff 0%, #f2ffff 100%)', border: '1px solid #e4eaf0', borderRadius: 6, padding: '14px 12px' }}>
            <div style={{ fontSize: 13, color: '#111827', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', width: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', lineHeight: 1 }}><SearchIcon /></span>
          <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search by Keyword" style={{ paddingLeft: 34, fontSize: 13, width: 300, height: 34, borderRadius: 3, borderColor: '#aeb7c2' }} />
        </div>
        <span style={{ fontSize: 13, color: '#64748b' }}>{rows.length} {rows.length === 1 ? 'record' : 'records'}</span>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '7px 14px' }}>Download</button>
        <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 16px' }}><span style={{ fontSize: 20, lineHeight: 1 }}>+</span>{config.primaryAction}</button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fff' }}>
                <th style={{ width: 42, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}><ColumnsIcon /></th>
                <th style={{ width: 54, padding: '10px 10px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>#</th>
                <th style={{ width: 78, padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left' }}>Action</th>
                {config.columns.map(column => <th key={column} style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'left', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{column}<FilterIcon /></span></th>)}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={config.columns.length + 3} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>No records found.</td></tr>
              ) : pageRows.map((row, index) => (
                <tr key={row[0]} style={{ borderBottom: '1px solid #edf1f5' }}>
                  <td style={{ padding: '10px 10px', borderRight: '1px solid #edf1f5' }} />
                  <td style={{ padding: '10px 10px', borderRight: '1px solid #edf1f5', textAlign: 'center', color: '#64748b' }}>{(page - 1) * pageSize + index + 1}</td>
                  <td style={{ padding: '10px 12px', borderRight: '1px solid #edf1f5' }}><button title="View" style={{ background: 'none', color: '#111827', padding: 4 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></td>
                  {row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: '10px 12px', borderRight: '1px solid #edf1f5', color: cellIndex === 0 ? '#005da8' : '#111827', fontWeight: cellIndex === 0 ? 600 : 400 }}>{cellIndex === row.length - 1 ? <StatusPill value={cell} /> : cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>
    </div>
  );
}
