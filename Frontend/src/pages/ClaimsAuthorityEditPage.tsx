import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../api/claims';
import type { ClaimAuthorityUserSelectionDto } from '../types/Claim';

// ─── Static reference data ─────────────────────────────────────────────────

const INSURANCE_TYPES = ['Commercial Lines', 'Specialty Lines', 'Personal Lines', 'Reinsurance', 'Excess & Surplus'];
const LOB_OPTIONS = ['E&S Homeowners', 'Commercial Property', 'Commercial Auto', 'Workers Compensation', 'General Liability', 'Professional Liability', 'Personal Auto', 'Homeowners'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const PAYMENT_METHODS = ['Cheque', 'Wire', 'ACH Transfer'];
const COUNTRY_NAMES = [
  'United States', 'Canada', 'United Kingdom', 'Australia',
  'India', 'Germany', 'France', 'Japan', 'Singapore', 'United Arab Emirates',
];
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia',
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitComma(s: string) { return s ? s.split(',').map(x => x.trim()).filter(Boolean) : []; }
function joinComma(arr: string[]) { return arr.join(','); }

function multiLabel(selected: string[], total: number): string {
  if (selected.length === 0) return '';
  if (selected.length === total) return `All (${total})`;
  if (selected.length === 1) return selected[0];
  return `${selected.length} selected`;
}

function buildCalGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { d: number; m: number; y: number }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const pm = month === 0 ? 11 : month - 1;
    cells.push({ d: prevDays - i, m: pm, y: month === 0 ? year - 1 : year });
  }
  for (let d = 1; d <= daysInMon; d++) cells.push({ d, m: month, y: year });
  const nm = month === 11 ? 0 : month + 1;
  const ny = month === 11 ? year + 1 : year;
  let nd = 1;
  while (cells.length < 42) cells.push({ d: nd++, m: nm, y: ny });
  return cells;
}

// ─── Shared styles ─────────────────────────────────────────────────────────

const inputBase = {
  height: 34, border: '1px solid #aeb7c2', borderRadius: 3,
  background: '#f6f8fb', padding: '0 10px', fontSize: 13,
  width: '100%', boxSizing: 'border-box' as const, outline: 'none', color: '#111827',
};
const inputErr = { ...inputBase, border: '1px solid #c62828', background: '#fff5f5' };

// ─── Error Message ─────────────────────────────────────────────────────────

function ErrMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11.5, color: '#c62828' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#c62828">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
      {msg}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#000', marginBottom: 5 }}>
        {required && <span style={{ color: '#c62828' }}>* </span>}{label}
      </label>
      {children}
      <ErrMsg msg={error} />
    </div>
  );
}

// ─── Single Select ─────────────────────────────────────────────────────────

function SingleSelect({ label, required, options, value, onChange, error }: {
  label: string; required?: boolean; options: string[]; value: string;
  onChange: (v: string) => void; error?: string;
}) {
  return (
    <Field label={label} required={required} error={error}>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ ...(error ? inputErr : inputBase), paddingRight: 30, appearance: 'none', cursor: 'pointer' }}
        >
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </Field>
  );
}

// ─── Text Input ────────────────────────────────────────────────────────────

function TextInput({ label, required, value, onChange, placeholder, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  return (
    <Field label={label} required={required} error={error}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={error ? inputErr : inputBase}
      />
    </Field>
  );
}

// ─── Multi-Select Dropdown (fixed-position popup, bypasses overflow:hidden) ─

function MultiSelect({ label, required, options, selected, onChange, error }: {
  label: string; required?: boolean; options: string[]; selected: string[];
  onChange: (v: string[]) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [popRect, setPopRect] = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) { setOpen(false); setSearch(''); }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function toggleOpen() {
    if (!open && anchorRef.current) setPopRect(anchorRef.current.getBoundingClientRect());
    setOpen(v => !v);
    if (open) setSearch('');
  }

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const allChecked = filtered.length > 0 && filtered.every(o => selected.includes(o));
  const summary = selected.length > 0 ? multiLabel(selected, options.length) : '';

  const popLeft = popRect ? Math.min(popRect.left, window.innerWidth - Math.max(popRect.width, 200)) : 0;
  const popWidth = popRect ? popRect.width : 200;
  const fitsBelow = popRect ? popRect.bottom + 260 < window.innerHeight : true;
  const popTop = popRect ? (fitsBelow ? popRect.bottom + 2 : popRect.top - 262) : 0;

  return (
    <Field label={label} required={required} error={error}>
      <div ref={anchorRef}>
        <div
          onClick={toggleOpen}
          style={{
            ...(error ? inputErr : inputBase),
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '0 10px', gap: 6, height: 34,
          }}
        >
          <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 13, color: summary ? '#111827' : '#9ca3af' }}>
            {summary || 'Select...'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {selected.length > 0 && (
              <span
                onClick={e => { e.stopPropagation(); onChange([]); }}
                style={{ cursor: 'pointer', color: '#6b7280', fontSize: 15, lineHeight: 1 }}
              >×</span>
            )}
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </div>

      {open && popRect && (
        <div ref={popupRef} style={{
          position: 'fixed', top: popTop, left: popLeft, width: popWidth,
          zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        }}>
          {/* Search */}
          <div style={{ padding: '7px 10px', borderBottom: '1px solid #f3f4f6' }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ ...inputBase, height: 28, fontSize: 12, border: '1px solid #d1d5db' }}
            />
          </div>
          {/* Select All */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
            <input type="checkbox" checked={allChecked} onChange={() => {
              if (allChecked) onChange(selected.filter(x => !filtered.includes(x)));
              else onChange([...new Set([...selected, ...filtered])]);
            }} style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
            Select All
          </label>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#9ca3af' }}>No options found</div>
              : filtered.map(o => (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#374151', background: selected.includes(o) ? '#eff6ff' : 'transparent' }}>
                  <input type="checkbox" checked={selected.includes(o)} onChange={() =>
                    onChange(selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o])
                  } style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
                  {o}
                </label>
              ))}
          </div>
        </div>
      )}
    </Field>
  );
}

// ─── Date Picker (fixed-position popup, same pattern as AddAdjusterPage) ───

function DatePicker({ label, required, value, onChange, error }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(new Date().getFullYear());
  const [viewM, setViewM] = useState(new Date().getMonth());
  const [popRect, setPopRect] = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function toggle() {
    if (!open && anchorRef.current) {
      setPopRect(anchorRef.current.getBoundingClientRect());
      if (value) {
        const [mm, , yyyy] = value.split('-').map(Number);
        if (mm && yyyy) { setViewM(mm - 1); setViewY(yyyy); }
      } else {
        const now = new Date();
        setViewM(now.getMonth()); setViewY(now.getFullYear());
      }
    }
    setOpen(v => !v);
  }

  function pick(d: number, m: number, y: number) {
    onChange(`${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}-${y}`);
    setOpen(false);
  }

  function prevMonth() { viewM === 0 ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1); }
  function nextMonth() { viewM === 11 ? (setViewM(0), setViewY(y => y + 1)) : setViewM(m => m + 1); }

  const parsed = (() => {
    if (!value) return null;
    const [mm, dd, yyyy] = value.split('-').map(Number);
    if (!mm || !dd || !yyyy) return null;
    return { d: dd, m: mm - 1, y: yyyy };
  })();

  const today = new Date();
  const cells = buildCalGrid(viewY, viewM);

  const popLeft = popRect ? Math.min(popRect.left, window.innerWidth - 290) : 0;
  const fitsBelow = popRect ? popRect.bottom + 330 < window.innerHeight : true;
  const popTop = popRect ? (fitsBelow ? popRect.bottom + 2 : popRect.top - 332) : 0;

  return (
    <Field label={label} required={required} error={error}>
      <div ref={anchorRef}>
        <div style={{
          ...(error ? inputErr : inputBase),
          display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden',
        }}>
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="MM-DD-YYYY"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '0 10px', height: '100%', color: '#111827' }}
          />
          <button
            type="button"
            onClick={toggle}
            style={{ height: 34, width: 36, border: 'none', borderLeft: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
      </div>

      {open && popRect && (
        <div ref={popupRef} style={{ position: 'fixed', top: popTop, left: popLeft, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: 282, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              <span style={{ color: '#111827' }}>{viewY}</span>{' '}
              <span style={{ color: '#1e40af' }}>{MONTHS[viewM]}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={prevMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button type="button" onClick={nextMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAY_LABELS.map(n => (
              <div key={n} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '3px 0' }}>{n}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {cells.map((cell, i) => {
              const isCur  = cell.m === viewM;
              const isToday = cell.d === today.getDate() && cell.m === today.getMonth() && cell.y === today.getFullYear();
              const isSel  = parsed && cell.d === parsed.d && cell.m === parsed.m && cell.y === parsed.y;
              return (
                <button key={i} type="button" onClick={() => pick(cell.d, cell.m, cell.y)} style={{
                  width: '100%', aspectRatio: '1', border: 'none', borderRadius: '50%',
                  cursor: 'pointer', fontSize: 12, fontWeight: isToday ? 700 : 400,
                  color: isSel ? '#fff' : isCur ? '#111827' : '#d1d5db',
                  background: isSel ? '#0B5AA0' : 'transparent',
                  outline: isToday && !isSel ? '2px solid #374151' : 'none', outlineOffset: -2,
                }}>{cell.d}</button>
              );
            })}
          </div>
        </div>
      )}
    </Field>
  );
}

// ─── Read-only display field ───────────────────────────────────────────────

function DisplayField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#111827' }}>{value ?? '-'}</div>
    </div>
  );
}

// ─── Avatar + name ─────────────────────────────────────────────────────────

function ActorField({ label, name, initials }: { label: string; name: string; initials: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%', background: '#0B5AA0',
          color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>{initials || '-'}</span>
        <span style={{ fontSize: 13, color: '#111827' }}>{name || '-'}</span>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #d8dee6', borderRadius: 4, background: '#fff', marginBottom: 16 }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #d8dee6' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Grid4({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px', marginBottom: 16 }}>{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 20px', marginBottom: 16 }}>{children}</div>;
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px', marginBottom: 16 }}>{children}</div>;
}

// ─── Status badge ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const active   = status === 'Active';
  const pending  = status === 'Pending';
  const bg    = active ? '#d7f7e4' : pending ? '#fef9c3' : '#fde8e8';
  const color = active ? '#006b3c' : pending ? '#92400e' : '#c62828';
  const dot   = active ? '#009765' : pending ? '#d97706' : '#c62828';
  const border = active ? '#008c55' : pending ? '#d97706' : '#f87171';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClaimsAuthorityEditPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isCreate = !id;
  const selectedUser = state?.user as ClaimAuthorityUserSelectionDto | undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['claims-authority-detail', id],
    queryFn: () => claimsApi.getAuthorityDetail(Number(id)),
    enabled: !isCreate,
  });

  // Display values for read-only user header
  const nameParts = (selectedUser?.fullName ?? '').split(' ');
  const displayUserId  = isCreate ? (selectedUser?.userCode ?? '-') : (data?.userId ?? '-');
  const displayFirst   = isCreate ? (nameParts[0] ?? '-') : (data?.firstName ?? '-');
  const displayMiddle  = isCreate ? '-' : (data?.middleName || '-');
  const displayLast    = isCreate ? (nameParts.slice(1).join(' ') || '-') : (data?.lastName ?? '-');
  const displayDept    = isCreate ? (selectedUser?.department ?? '-') : (data?.department ?? '-');
  const displayDesig   = isCreate ? (selectedUser?.designation ?? '-') : (data?.designation ?? '-');
  const displayStatus  = isCreate ? 'Pending' : (data?.authorityStatus ?? '-');

  const displayUpdatedByName      = isCreate ? '-' : (data?.updatedByName ?? '-');
  const displayUpdatedByInitials  = isCreate ? '-' : (data?.updatedByInitials ?? '-');
  const displayApprovedByName     = isCreate ? '-' : (data?.approvedByName ?? '-');
  const displayApprovedByInitials = isCreate ? '-' : (data?.approvedByInitials ?? '-');
  const displayCreatedByName      = isCreate ? '-' : (data?.createdByName ?? '-');
  const displayCreatedByInitials  = isCreate ? '-' : (data?.createdByInitials ?? '-');
  const displayUpdatedDate        = isCreate ? '-' : (data?.updatedDate ?? '-');
  const displayActionPerformed    = isCreate ? '-' : (data?.actionPerformed ?? '-');

  // ── Form state ──
  const [insuranceType, setInsuranceType] = useState('');
  const [approvedLob, setApprovedLob] = useState<string[]>([]);
  const [currency, setCurrency] = useState('');
  const [reserveLimit, setReserveLimit] = useState('');
  const [indemnityLimit, setIndemnityLimit] = useState('');
  const [feeLimit, setFeeLimit] = useState('');
  const [exGratiaLimit, setExGratiaLimit] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [dateOfAssignment, setDateOfAssignment] = useState('');
  const [canDenyWorksheet, setCanDenyWorksheet] = useState('');
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // ── Validation ──
  const [submitted, setSubmitted] = useState(false);

  function getErrors(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!insuranceType)           e.insuranceType    = 'Provide Insurance Type to continue';
    if (approvedLob.length === 0) e.approvedLob      = 'Provide Approved LOB to continue';
    if (!currency)                e.currency         = 'Provide Currency to continue';
    if (!reserveLimit.trim())     e.reserveLimit     = 'Provide Reserve Limit to continue';
    if (!indemnityLimit.trim())   e.indemnityLimit   = 'Provide Indemnity Payment Limit to continue';
    if (!feeLimit.trim())         e.feeLimit         = 'Provide Fee Payment Limit to continue';
    if (!exGratiaLimit.trim())    e.exGratiaLimit    = 'Provide Ex Gratia Payment Limit to continue';
    if (paymentMethods.length === 0) e.paymentMethods = 'Provide Payment Method Restrictions to continue';
    if (!dateOfAssignment)        e.dateOfAssignment = 'Provide Date of Authority Assignment to continue';
    if (!canDenyWorksheet)        e.canDenyWorksheet = 'Provide Can Deny Claim to continue';
    if (countries.length === 0)   e.countries        = 'Provide Country to continue';
    if (states.length === 0)      e.states           = 'Provide State to continue';
    return e;
  }

  const errors = submitted ? getErrors() : {};

  useEffect(() => {
    if (!isCreate && data && !initialized) {
      setInsuranceType(data.insuranceType === '-' ? '' : data.insuranceType);
      setApprovedLob(splitComma(data.approvedLob === '-' ? '' : data.approvedLob));
      setCurrency(data.currency === '-' ? '' : data.currency);
      setReserveLimit(data.reserveLimit === 0 ? '' : String(data.reserveLimit));
      setIndemnityLimit(data.indemnityPaymentLimit === 0 ? '' : String(data.indemnityPaymentLimit));
      setFeeLimit(data.feePaymentLimit === 0 ? '' : String(data.feePaymentLimit));
      setExGratiaLimit(data.exGratiaPaymentLimit === 0 ? '' : String(data.exGratiaPaymentLimit));
      setPaymentMethods(splitComma(data.paymentMethodRestrictions === '-' ? '' : data.paymentMethodRestrictions));
      setDateOfAssignment(data.dateOfAuthorityAssignment === '-' ? '' : data.dateOfAuthorityAssignment);
      setCanDenyWorksheet(data.canDenyWorksheet ? 'Yes' : 'No');
      setCountries(data.jurisdictionCountry && data.jurisdictionCountry !== '-' ? [data.jurisdictionCountry] : []);
      setStates(splitComma(data.jurisdictionStates === '-' ? '' : data.jurisdictionStates));
      setInitialized(true);
    }
  }, [isCreate, data, initialized]);

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: (req: Parameters<typeof claimsApi.createAuthority>[0]) => claimsApi.createAuthority(req),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims-authority'] }); navigate('/claims/authority'); },
  });
  const updateMutation = useMutation({
    mutationFn: (req: Parameters<typeof claimsApi.updateAuthority>[1]) => claimsApi.updateAuthority(Number(id), req),
  });
  const approveMutation = useMutation({
    mutationFn: () => claimsApi.approveAuthority(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims-authority'] });
      queryClient.invalidateQueries({ queryKey: ['claims-authority-detail', id] });
      navigate('/claims/authority');
    },
  });
  const revokeMutation = useMutation({
    mutationFn: () => claimsApi.revokeAuthority(Number(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['claims-authority'] }); navigate('/claims/authority'); },
  });

  function buildFields() {
    return {
      insuranceType, approvedLob: joinComma(approvedLob), currency,
      reserveLimit: Number(reserveLimit) || 0,
      indemnityPaymentLimit: Number(indemnityLimit) || 0,
      feePaymentLimit: Number(feeLimit) || 0,
      exGratiaPaymentLimit: Number(exGratiaLimit) || 0,
      paymentMethodRestrictions: joinComma(paymentMethods),
      dateOfAuthorityAssignment: dateOfAssignment || null,
      canDenyWorksheet: canDenyWorksheet === 'Yes',
      jurisdictionCountry: countries[0] ?? '',
      jurisdictionStates: joinComma(states),
    };
  }

  async function handleApprove() {
    setSubmitted(true);
    if (Object.keys(getErrors()).length > 0) return;
    if (isCreate) {
      if (!selectedUser) return;
      createMutation.mutate({ userId: selectedUser.id, ...buildFields() });
    } else {
      await updateMutation.mutateAsync(buildFields());
      approveMutation.mutate();
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending || approveMutation.isPending || revokeMutation.isPending;

  if (!isCreate && (isLoading || !data)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 20px 80px', background: '#f6f8fb', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Claims / Claims Authority</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>Claim Authority</h1>
      </div>

      {/* ── UserDetails ── */}
      <Section title="UserDetails">
        <Grid4>
          <DisplayField label="User ID" value={displayUserId} />
          <DisplayField label="First Name" value={displayFirst} />
          <DisplayField label="Middle Name / Initial" value={displayMiddle} />
          <DisplayField label="Last Name" value={displayLast} />
        </Grid4>
        <Grid3>
          <DisplayField label="Department" value={displayDept} />
          <DisplayField label="Designation" value={displayDesig} />
          <DisplayField label="Authority Status" value={<StatusBadge status={displayStatus} />} />
        </Grid3>

        <Grid4>
          <SingleSelect label="Insurance Type" required options={INSURANCE_TYPES} value={insuranceType} onChange={setInsuranceType} error={errors.insuranceType} />
          <MultiSelect label="Approved LOB" required options={LOB_OPTIONS} selected={approvedLob} onChange={setApprovedLob} error={errors.approvedLob} />
          <SingleSelect label="Currency" required options={CURRENCIES} value={currency} onChange={setCurrency} error={errors.currency} />
          <TextInput label="Reserve Limit" required value={reserveLimit} onChange={setReserveLimit} error={errors.reserveLimit} />
        </Grid4>
        <Grid4>
          <TextInput label="Indemnity Payment Limit" required value={indemnityLimit} onChange={setIndemnityLimit} error={errors.indemnityLimit} />
          <TextInput label="Fee Payment Limit" required value={feeLimit} onChange={setFeeLimit} error={errors.feeLimit} />
          <TextInput label="Ex Gratia Payment Limit" required value={exGratiaLimit} onChange={setExGratiaLimit} error={errors.exGratiaLimit} />
          <MultiSelect label="Payment Method Restrictions" required options={PAYMENT_METHODS} selected={paymentMethods} onChange={setPaymentMethods} error={errors.paymentMethods} />
        </Grid4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
          <DatePicker label="Date of Authority Assignment" required value={dateOfAssignment} onChange={setDateOfAssignment} error={errors.dateOfAssignment} />
          <SingleSelect label="Can Deny Worksheet" required options={['Yes', 'No']} value={canDenyWorksheet} onChange={setCanDenyWorksheet} error={errors.canDenyWorksheet} />
        </div>
      </Section>

      {/* ── Jurisdiction ── */}
      <Section title="Jurisdiction">
        <Grid2>
          <MultiSelect label="Country" required options={COUNTRY_NAMES} selected={countries} onChange={setCountries} error={errors.countries} />
          <MultiSelect label="State" required options={US_STATES} selected={states} onChange={setStates} error={errors.states} />
        </Grid2>
      </Section>

      {/* ── Approver Details ── */}
      <Section title="Approver Details">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
          <ActorField label="Authority Updated By" name={displayUpdatedByName} initials={displayUpdatedByInitials} />
          <ActorField label="Authority Approved By" name={displayApprovedByName} initials={displayApprovedByInitials} />
        </div>
      </Section>

      {/* ── Audit & Compliance ── */}
      <Section title="Audit & Compliance">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 20px' }}>
          <ActorField label="Created By" name={displayCreatedByName} initials={displayCreatedByInitials} />
          <ActorField label="Updated By" name={displayUpdatedByName} initials={displayUpdatedByInitials} />
          <DisplayField label="Updated date" value={displayUpdatedDate} />
          <DisplayField label="Action performed" value={displayActionPerformed} />
        </div>
      </Section>

      {/* ── Footer ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#fff', borderTop: '1px solid #e5e7eb',
        display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 28px',
      }}>
        <button
          onClick={() => navigate(isCreate ? '/claims/authority/add-user' : '/claims/authority')}
          disabled={saving}
          style={{ height: 34, padding: '0 24px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Back
        </button>
        <button
          onClick={isCreate ? undefined : () => revokeMutation.mutate()}
          disabled={saving || isCreate}
          style={{ height: 34, padding: '0 24px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 3, fontSize: 13, fontWeight: 600, color: isCreate ? '#9ca3af' : '#374151', cursor: isCreate ? 'not-allowed' : 'pointer', opacity: isCreate ? 0.6 : 1 }}
        >
          {revokeMutation.isPending ? 'Revoking...' : 'Revoke'}
        </button>
        <button
          onClick={handleApprove}
          disabled={saving}
          style={{ height: 34, padding: '0 24px', background: '#0B5AA0', color: '#fff', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {(createMutation.isPending || approveMutation.isPending) ? 'Saving...' : 'Approve'}
        </button>
      </div>
    </div>
  );
}
