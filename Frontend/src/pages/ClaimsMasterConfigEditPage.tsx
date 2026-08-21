import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { configurationsApi } from '../api/configurations';

function getValueLabel(tableName: string): string {
  const name = tableName.toLowerCase();
  if (name.includes('claim type')) return 'Claim Type';
  if (name.includes('cause of loss')) return 'Cause of Loss';
  if (name.includes('consequence') || name.includes('loss consequence')) return 'Consequence';
  if (name.includes('loss exposure')) return 'Loss Exposure Type';
  if (name.includes('status')) return 'Status';
  if (name.includes('priority')) return 'Priority';
  if (name.includes('category')) return 'Category';
  return tableName.replace(/\s*configuration\s*/i, '').trim() || 'Value';
}

// Convert "MM-DD-YYYY" from API → "YYYY-MM-DD" for date input
function apiToInput(s: string): string {
  if (!s || s === '-') return '';
  const parts = s.split('-');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[0]}-${parts[1]}`;
}

// Convert "YYYY-MM-DD" from input → ISO for API
function inputToIso(s: string): string | null {
  return s || null;
}

let _localIdCounter = 0;
function nextLocalId() { return `row-${++_localIdCounter}`; }

interface EditRow {
  localId: string;
  id: number | null;
  value: string;
  enabled: string;    // "true" | "false" | ""
  isDefault: string;  // "true" | "false" | ""
  effectiveFrom: string;  // YYYY-MM-DD
  effectiveTo: string;    // YYYY-MM-DD
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ExportUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
      background: '#0d2137', color: '#fff', padding: '12px 18px', borderRadius: 6,
      fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 360, maxWidth: 500,
    }}>
      <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>!</div>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onDone} style={{ flexShrink: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '2px 4px', fontSize: 16, lineHeight: 1, opacity: 0.8 }}>✕</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 34, padding: '0 10px', fontSize: 13,
  border: '1px solid #aeb7c2', borderRadius: 3, background: '#fff',
  outline: 'none', color: '#111827', boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  width: '100%', height: 34, padding: '0 8px', fontSize: 13,
  border: '1px solid #aeb7c2', borderRadius: 3, background: '#fff',
  outline: 'none', color: '#111827', cursor: 'pointer', appearance: 'none',
  boxSizing: 'border-box',
};

const TH: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600,
  color: '#374151', background: '#eaf0f6', whiteSpace: 'nowrap',
  borderBottom: '1px solid #d1d5db',
};

const TD: React.CSSProperties = {
  padding: '8px 12px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'middle',
};

export default function ClaimsMasterConfigEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const configId = Number(id);

  const [rows, setRows] = useState<EditRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const dateInputRefs = useRef<Record<string, { from: HTMLInputElement | null; to: HTMLInputElement | null }>>({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['configuration-edit', configId],
    queryFn: () => configurationsApi.getDetail(configId, undefined, 1, 1000),
    enabled: !isNaN(configId),
    gcTime: 0,        // evict cache immediately on unmount — prevents stale data on return visit
    staleTime: 0,     // always fetch fresh
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (data && !loaded) {
      setRows(data.values.map(v => ({
        localId: nextLocalId(),
        id: v.id,
        value: v.value ?? '',
        enabled: v.enabled ? 'true' : 'false',
        isDefault: v.isDefault ? 'true' : 'false',
        effectiveFrom: apiToInput(v.effectiveFrom),
        effectiveTo: apiToInput(v.effectiveTo),
      })));
      setLoaded(true);
    }
  }, [data, loaded]);

  const valueLabel = data ? getValueLabel(data.tableName) : 'Value Label';

  const filteredRows = search
    ? rows.filter(r => r.value.toLowerCase().includes(search.toLowerCase()))
    : rows;

  function updateRow(localId: string, field: keyof EditRow, value: string) {
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, [field]: value } : r));
  }

  function deleteRow(localId: string) {
    setRows(prev => prev.filter(r => r.localId !== localId));
  }

  function addRow() {
    setRows(prev => [...prev, {
      localId: nextLocalId(),
      id: null,
      value: '',
      enabled: '',
      isDefault: '',
      effectiveFrom: '',
      effectiveTo: '',
    }]);
  }

  function handleExport() {
    const a = document.createElement('a');
    a.href = configurationsApi.exportXlsx(configId);
    a.download = `configuration-${configId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = rows.map(r => ({
        id: r.id,
        value: r.value ?? '',
        enabled: r.enabled === '' ? null : r.enabled === 'true',
        isDefault: r.isDefault === '' ? null : r.isDefault === 'true',
        effectiveFrom: inputToIso(r.effectiveFrom),
        effectiveTo: inputToIso(r.effectiveTo),
      }));
      await configurationsApi.save(configId, payload);
      // Invalidate caches so view + list show fresh data immediately
      await queryClient.invalidateQueries({ queryKey: ['configuration-detail', configId] });
      await queryClient.invalidateQueries({ queryKey: ['configurations'] });
      queryClient.removeQueries({ queryKey: ['configuration-edit', configId] });
      navigate(`/claims/master-configuration/${configId}/view`);
    } catch {
      setToast('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // We need to load real IDs from API. Since detail endpoint returns values without IDs,
  // we'll use position-based mapping on save — backend handles inserts vs updates.
  // Actually the backend save uses id field to determine update vs insert.
  // Let me load IDs properly via a workaround: re-fetch with a dedicated marker.

  const selectWrap: React.CSSProperties = {
    position: 'relative', display: 'flex', alignItems: 'center',
  };
  const chevronDown = (
    <span style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: '#6b7280', fontSize: 10 }}>▼</span>
  );

  const dateWrap: React.CSSProperties = {
    position: 'relative', display: 'flex', alignItems: 'center',
  };

  return (
    <div style={{ padding: '24px 28px 40px', background: '#f6f8fb', minHeight: '100%' }}>
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
        <span style={{ color: '#0B5AA0', cursor: 'pointer' }} onClick={() => navigate('/claims/master-configuration')}>
          Claim Master Configuration
        </span>
        <span style={{ margin: '0 6px' }}>/</span>
        <span>Edit Configuration</span>
      </div>

      {/* Title */}
      <h1 style={{ margin: '0 0 22px', fontSize: 22, fontWeight: 700, color: '#111827' }}>
        Edit Configuration{data ? ` - ${data.tableName}` : ''}
      </h1>

      {/* Search Table card */}
      <div style={{ background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 16 }}>Search Table</div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', lineHeight: 1 }}>
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Keywords"
              style={{ ...inputStyle, paddingLeft: 32, width: 280 }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setToast('The feature is currently unavailable !!')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 34, padding: '0 16px', borderRadius: 4,
              background: '#fff', color: '#0B5AA0', border: '1px solid #0B5AA0',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            <ImportIcon />
            Import
          </button>
          <button
            onClick={handleExport}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              height: 34, padding: '0 16px', borderRadius: 4,
              background: '#fff', color: '#0B5AA0', border: '1px solid #0B5AA0',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            <ExportUpIcon />
            Export
          </button>
        </div>

        {/* Table */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={TH}>{valueLabel}</th>
                <th style={TH}>Enabled</th>
                <th style={TH}>Default</th>
                <th style={TH}>Effective From</th>
                <th style={TH}>Effective To</th>
                <th style={{ ...TH, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#94a3b8', padding: 40 }}>No records found.</td>
                </tr>
              ) : filteredRows.map(row => (
                <tr key={row.localId}>
                  {/* Value Label */}
                  <td style={TD}>
                    <input
                      type="text"
                      value={row.value}
                      onChange={e => updateRow(row.localId, 'value', e.target.value)}
                      style={inputStyle}
                    />
                  </td>

                  {/* Enabled */}
                  <td style={TD}>
                    <div style={selectWrap}>
                      <select
                        value={row.enabled}
                        onChange={e => updateRow(row.localId, 'enabled', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                      {chevronDown}
                    </div>
                  </td>

                  {/* Default */}
                  <td style={TD}>
                    <div style={selectWrap}>
                      <select
                        value={row.isDefault}
                        onChange={e => updateRow(row.localId, 'isDefault', e.target.value)}
                        style={selectStyle}
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                      {chevronDown}
                    </div>
                  </td>

                  {/* Effective From */}
                  <td style={TD}>
                    <div style={dateWrap}>
                      <input
                        type="date"
                        value={row.effectiveFrom}
                        onChange={e => updateRow(row.localId, 'effectiveFrom', e.target.value)}
                        ref={el => {
                          if (!dateInputRefs.current[row.localId]) dateInputRefs.current[row.localId] = { from: null, to: null };
                          dateInputRefs.current[row.localId].from = el;
                        }}
                        style={{ ...inputStyle, paddingRight: 32, color: row.effectiveFrom ? '#111827' : '#9ca3af' }}
                      />
                      <span
                        style={{ position: 'absolute', right: 8, cursor: 'pointer', lineHeight: 1 }}
                        onClick={() => dateInputRefs.current[row.localId]?.from?.showPicker?.()}
                      >
                        <CalendarIcon />
                      </span>
                    </div>
                  </td>

                  {/* Effective To */}
                  <td style={TD}>
                    <div style={dateWrap}>
                      <input
                        type="date"
                        value={row.effectiveTo}
                        onChange={e => updateRow(row.localId, 'effectiveTo', e.target.value)}
                        ref={el => {
                          if (!dateInputRefs.current[row.localId]) dateInputRefs.current[row.localId] = { from: null, to: null };
                          dateInputRefs.current[row.localId].to = el;
                        }}
                        style={{ ...inputStyle, paddingRight: 32, color: row.effectiveTo ? '#111827' : '#9ca3af' }}
                      />
                      <span
                        style={{ position: 'absolute', right: 8, cursor: 'pointer', lineHeight: 1 }}
                        onClick={() => dateInputRefs.current[row.localId]?.to?.showPicker?.()}
                      >
                        <CalendarIcon />
                      </span>
                    </div>
                  </td>

                  {/* Action */}
                  <td style={{ ...TD, textAlign: 'center' }}>
                    <button
                      onClick={() => deleteRow(row.localId)}
                      title="Delete row"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, lineHeight: 1, display: 'inline-flex' }}
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Rows button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={addRow}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 16px', borderRadius: 4,
              background: '#fff', color: '#374151', border: '1px solid #aeb7c2',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            Add Rows
          </button>
        </div>
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

      {/* Bottom buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={() => navigate('/claims/master-configuration')}
          style={{
            height: 38, padding: '0 24px', borderRadius: 4,
            background: '#fff', color: '#374151', border: '1px solid #aeb7c2',
            cursor: 'pointer', fontSize: 14, fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 38, padding: '0 28px', borderRadius: 4,
            background: saving ? '#6b9fd4' : '#0B5AA0', color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
