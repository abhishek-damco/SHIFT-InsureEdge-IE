import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { configurationsApi } from '../api/configurations';

// Derive a human-readable "Value Label" from the configuration name
function getValueLabel(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.includes('claim type')) return 'Claim Type';
  if (name.includes('cause of loss')) return 'Cause of Loss';
  if (name.includes('consequence') || name.includes('loss consequence')) return 'Consequence';
  if (name.includes('loss exposure')) return 'Loss Exposure Type';
  if (name.includes('status')) return 'Status';
  if (name.includes('priority')) return 'Priority';
  if (name.includes('category')) return 'Category';
  // fallback: strip "Configuration" suffix if present
  return tableName.replace(/\s*configuration\s*/i, '').trim() || 'Value';
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ExportUpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}


function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!ref.current) {
    ref.current = setTimeout(onDone, 5000);
  }
  return (
    <div style={{
      position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
      background: '#0d2137', color: '#fff', padding: '12px 18px', borderRadius: 6,
      fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 360, maxWidth: 500,
    }}>
      <div style={{
        flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff',
      }}>!</div>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDone} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', fontSize: 16, lineHeight: 1, opacity: 0.8 }}>✕</button>
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function ClaimsMasterConfigViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const configId = Number(id);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 300);
  }

  function handlePageSizeChange(val: number) {
    setPageSize(val);
    setPage(1);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['configuration-detail', configId, debouncedSearch, page, pageSize],
    queryFn: () => configurationsApi.getDetail(configId, debouncedSearch || undefined, page, pageSize),
    enabled: !isNaN(configId),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const totalPages = data ? Math.ceil(data.totalValues / pageSize) : 1;
  const valueLabel = data ? getValueLabel(data.tableName) : 'Value Label';

  function handleExport() {
    const a = document.createElement('a');
    a.href = configurationsApi.exportXlsx(configId);
    a.download = `configuration-${configId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const TH: React.CSSProperties = {
    padding: '11px 16px',
    textAlign: 'left',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    background: '#eaf0f6',
    whiteSpace: 'nowrap',
    border: '1px solid #d1d5db',
  };

  const TD: React.CSSProperties = {
    padding: '12px 16px',
    border: '1px solid #e9ecef',
    fontSize: 13,
    color: '#374151',
    verticalAlign: 'middle',
  };

  const pageBtnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 30, height: 30, padding: '0 6px', borderRadius: 3,
    border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer',
    color: '#374151', fontSize: 13, lineHeight: 1, fontFamily: 'inherit',
  };

  const pageBtnActive: React.CSSProperties = {
    ...pageBtnBase,
    background: '#0B5AA0', color: '#fff', border: '1px solid #0B5AA0',
    fontWeight: 600,
  };

  const pageBtnDisabled: React.CSSProperties = {
    ...pageBtnBase, opacity: 0.38, cursor: 'not-allowed', pointerEvents: 'none',
  };

  return (
    <div style={{ padding: '24px 28px 40px', background: '#f6f8fb', minHeight: '100%' }}>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
        <span
          style={{ color: '#0B5AA0', cursor: 'pointer' }}
          onClick={() => navigate('/claims/master-configuration')}
        >
          Claim Master Configuration
        </span>
        <span style={{ margin: '0 6px' }}>/</span>
        <span>View Configuration</span>
      </div>

      {/* Title */}
      <h1 style={{ margin: '0 0 22px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
        View Configuration{data ? ` - ${data.tableName}` : ''}
      </h1>

      {/* Search Table card */}
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Search Table</div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 320 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', lineHeight: 1 }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search by Keywords"
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 12,
                height: 36, fontSize: 13, borderRadius: 4,
                border: '1px solid #d1d5db', background: '#fff',
                outline: 'none', color: '#111827', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 36, padding: '0 16px', borderRadius: 4,
              background: '#fff', color: '#374151', border: '1px solid #aeb7c2',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            <ExportUpIcon />
            Export
          </button>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={TH}>{valueLabel}</th>
                <th style={{ ...TH, width: 130 }}>Enabled</th>
                <th style={{ ...TH, width: 130 }}>Default</th>
                <th style={{ ...TH, width: 170 }}>Effective From</th>
                <th style={{ ...TH, width: 170 }}>Effective To</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: 40, border: '1px solid #e9ecef' }}>
                    Loading...
                  </td>
                </tr>
              ) : !data || data.values.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                    No records found.
                  </td>
                </tr>
              ) : data.values.map((v, i) => (
                <tr key={i} style={{ background: '#fff' }}>
                  <td style={TD}>{v.value ?? '-'}</td>
                  <td style={TD}>{v.enabled ? 'Yes' : 'No'}</td>
                  <td style={TD}>{v.isDefault ? 'Yes' : 'No'}</td>
                  <td style={TD}>{v.effectiveFrom}</td>
                  <td style={TD}>{v.effectiveTo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalValues > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 14, gap: 0 }}>
            {/* Left: Showing X records from N Results — all on one line, no wrapping */}
            <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>Showing</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              style={{
                height: 28, border: '1px solid #d1d5db', borderRadius: 3,
                fontSize: 13, padding: '0 4px', background: '#fff', cursor: 'pointer',
                width: 'auto', flexShrink: 0, margin: '0 6px',
              }}
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: 13, color: '#374151', flexShrink: 0 }}>
              records from {data.totalValues} Results
            </span>

            {/* Spacer pushes nav to the right */}
            <div style={{ flex: 1 }} />

            {/* Right: nav buttons — all on same line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <button style={page === 1 ? pageBtnDisabled : pageBtnBase} disabled={page === 1} onClick={() => setPage(1)}>«</button>
              <button style={page === 1 ? pageBtnDisabled : pageBtnBase} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} style={p === page ? pageBtnActive : pageBtnBase} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button style={page === totalPages ? pageBtnDisabled : pageBtnBase} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
              <button style={page === totalPages ? pageBtnDisabled : pageBtnBase} disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
            </div>
          </div>
        )}
      </div>

      {/* Audit section */}
      {data && (
        <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', padding: '18px 24px', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 14 }}>Audit</div>
          <div style={{ display: 'flex', gap: 48 }}>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Last Modified By</div>
              <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{data.lastModifiedBy}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Last Modified Date</div>
              <div style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{data.lastModifiedDate}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={() => navigate('/claims/master-configuration')}
          style={{
            height: 38, padding: '0 24px', borderRadius: 4,
            background: '#fff', color: '#374151', border: '1px solid #aeb7c2',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}
        >
          Back
        </button>
        <button
          onClick={() => navigate(`/claims/master-configuration/${configId}/edit`)}
          style={{
            height: 38, padding: '0 24px', borderRadius: 4,
            background: '#0B5AA0', color: '#fff', border: 'none',
            cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
