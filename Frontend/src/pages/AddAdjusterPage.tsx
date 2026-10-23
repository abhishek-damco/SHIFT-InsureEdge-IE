import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { adjustersApi } from '../api/adjusters';
import type { TempAdjusterLicenseDto, UpsertTempAdjusterRequest } from '../types/Adjuster';

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputBase: CSSProperties = {
  height: 34, border: '1px solid #aeb7c2', borderRadius: 3, background: '#f6f8fb',
  padding: '0 10px', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none',
};
const sectionStyle: CSSProperties = { border: '1px solid #d8dee6', borderRadius: 4, background: '#fff' };

const claimAccessRows = [
  'Claims Inquiry', 'Claims Dashboard', 'FNOL Registration', 'Bulk Claim Upload', 'Claims Authority',
  'Adjuster Management', 'Payee List', 'Catastrophic Events', 'Claim Letter Template', 'Claims Master Configuration',
  'Claim Summary', 'Loss Information', 'Claim Review', 'Documents', 'Financials - Worksheet',
  'Financials - Claims Payee', 'Insured & Policy', 'Claim Escalation', 'Recovery', 'Claim Referred',
  'Under Litigation', 'Task', 'Templates', 'Claim Letters',
];
const permissionColumns = ['View', 'Add', 'Edit', 'Clone', 'Upload', 'Download', 'Sensitive Data', 'Sensitive Documents', 'Approve/Reject'];

const emptyForm: UpsertTempAdjusterRequest = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '', ssn: '', taxId: '', role: '',
  adjusterType: '', status: '', claimTypesHandled: '', territoryType: '', territoriesAssigned: '',
  preferredCommunication: '', telephoneNumber: '', extension: '', alternativeTelephoneNumber: '',
  emailId: '', registeredAddressLine1: '', registeredAddressLine2: '',
  registeredCountry: 'United States', registeredState: '', registeredCity: '',
  registeredCounty: '', registeredZipCode: '', registeredLatitude: '', registeredLongitude: '',
  mailingAddressLine1: '', mailingAddressLine2: '', mailingCountry: 'United States',
  mailingState: '', mailingCity: '', mailingCounty: '', mailingZipCode: '',
  mailingLatitude: '', mailingLongitude: '', paymentMethod: '', ratePerHour: '',
  complianceFlag: 'Authorized', accessJson: '',
  licenses: [{ licensedState: '', licenseNumber: '', licenseStartDate: '', licenseExpirationDate: '' }],
};

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatSsnLike(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(form: UpsertTempAdjusterRequest, npn: string): Record<string, string> {
  const e: Record<string, string> = {};

  if (!form.firstName?.trim())              e.firstName = 'Provide First Name to continue';
  if (!form.lastName?.trim())               e.lastName = 'Provide Last Name to continue';
  if (!form.dateOfBirth?.trim()) {
    e.dateOfBirth = 'Provide Date of Birth to continue';
  } else {
    const parts = form.dateOfBirth.split('-');
    const [mm, dd, yyyy] = parts.map(Number);
    const dob = new Date(yyyy, mm - 1, dd);
    const now = new Date();
    if (parts.length !== 3 || isNaN(dob.getTime()) || dob > now || now.getFullYear() - yyyy > 120 || mm < 1 || mm > 12 || dd < 1 || dd > 31) {
      e.dateOfBirth = 'Provide a valid Date of Birth';
    }
  }

  if (!form.taxId?.trim())                  e.taxId = 'Provide Tax ID to continue';
  else if (!/^\d{3}-\d{2}-\d{4}$/.test(form.taxId)) e.taxId = 'Format must be XXX-XX-XXXX';

  if (!npn.trim())                          e.npn = 'Provide National Producer Number to continue';
  else if (!/^\d{3}-\d{2}-\d{4}$/.test(npn)) e.npn = 'Format must be XXX-XX-XXXX';

  if (!form.role?.trim())                   e.role = 'Provide Role to continue';
  if (!form.adjusterType?.trim())           e.adjusterType = 'Provide Adjuster Type to continue';
  if (!form.status?.trim())                 e.status = 'Provide Status to continue';
  if (!form.claimTypesHandled?.trim())      e.claimTypesHandled = 'Provide Handled Claim Types to continue';
  if (!form.territoryType?.trim())          e.territoryType = 'Provide Territory Type to continue';
  if (!form.territoriesAssigned?.trim())    e.territoriesAssigned = 'Provide Territories Assigned to continue';
  if (!form.preferredCommunication?.trim()) e.preferredCommunication = 'Provide Preferred Mode of Communication to continue';

  if (!form.telephoneNumber?.trim())        e.telephoneNumber = 'Provide Telephone Number to continue';
  else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(form.telephoneNumber)) e.telephoneNumber = 'Format must be (###) ###-####';

  if (!form.emailId?.trim())                e.emailId = 'Provide Email ID to continue';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId)) e.emailId = 'Provide a valid Email ID';

  if (!form.registeredAddressLine1?.trim()) e.registeredAddressLine1 = 'Provide Address Line 1 to continue';
  if (!form.registeredState?.trim())        e.registeredState = 'Provide State to continue';
  if (!form.registeredCity?.trim())         e.registeredCity = 'Provide City to continue';
  if (!form.registeredCounty?.trim())       e.registeredCounty = 'Provide County to continue';
  if (!form.registeredZipCode?.trim())      e.registeredZipCode = 'Provide Zip Code to continue';

  if (!form.mailingAddressLine1?.trim())    e.mailingAddressLine1 = 'Provide Address Line 1 to continue';
  if (!form.mailingState?.trim())           e.mailingState = 'Provide State to continue';
  if (!form.mailingCity?.trim())            e.mailingCity = 'Provide City to continue';
  if (!form.mailingCounty?.trim())          e.mailingCounty = 'Provide County to continue';
  if (!form.mailingZipCode?.trim())         e.mailingZipCode = 'Provide Zip Code to continue';

  if (!form.paymentMethod?.trim())          e.paymentMethod = 'Provide Payment Method to continue';
  if (!form.ratePerHour?.trim())            e.ratePerHour = 'Provide Rate per Hour to continue';
  else if (!/^\d{1,5}$/.test(form.ratePerHour.trim())) e.ratePerHour = 'Rate per Hour must be numeric (max 5 digits)';

  (form.licenses ?? []).forEach((l, i) => {
    if (!l.licensedState?.trim())  e[`lic_${i}_state`]  = 'Provide Licensed States to continue';
    if (!l.licenseNumber?.trim())  e[`lic_${i}_number`] = 'Provide License Number to continue';
  });

  return e;
}

// ─── Small components ─────────────────────────────────────────────────────────

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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
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

function PhoneInput({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  return (
    <div style={{ height: 34, border: `1px solid ${hasError ? '#c62828' : '#aeb7c2'}`, borderRadius: 3, background: hasError ? '#fff5f5' : '#f6f8fb', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ padding: '0 8px', borderRight: '1px solid #d1d5db', height: '100%', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, fontSize: 14, userSelect: 'none' }}>
        🇺🇸 <span style={{ fontSize: 9, color: '#6b7280' }}>▼</span>
      </div>
      <input
        type="tel"
        value={value}
        onChange={e => onChange(formatPhone(e.target.value))}
        placeholder="(###) ###-####"
        style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '0 8px', flex: 1, height: '100%' }}
      />
    </div>
  );
}

// ─── Date Picker ─────────────────────────────────────────────────────────────

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function buildGrid(year: number, month: number) {
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMon  = new Date(year, month + 1, 0).getDate();
  const prevDays   = new Date(year, month, 0).getDate();
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

function DatePicker({ value, onChange, hasError }: {
  value: string; onChange: (v: string) => void; hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewY, setViewY] = useState(new Date().getFullYear());
  const [viewM, setViewM] = useState(new Date().getMonth());
  const [rect, setRect]   = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(ev: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(ev.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  function parseDob(): { d: number; m: number; y: number } | null {
    if (!value) return null;
    const [mm, dd, yyyy] = value.split('-').map(Number);
    if (!mm || !dd || !yyyy || yyyy < 1900) return null;
    return { d: dd, m: mm - 1, y: yyyy };
  }

  function toggle() {
    if (!open && anchorRef.current) {
      setRect(anchorRef.current.getBoundingClientRect());
      const p = parseDob();
      if (p) { setViewY(p.y); setViewM(p.m); }
      else { const now = new Date(); setViewY(now.getFullYear()); setViewM(now.getMonth()); }
    }
    setOpen(v => !v);
  }

  function select(d: number, m: number, y: number) {
    onChange(`${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}-${y}`);
    setOpen(false);
  }

  function prevMonth() { viewM === 0 ? (setViewM(11), setViewY(y => y - 1)) : setViewM(m => m - 1); }
  function nextMonth() { viewM === 11 ? (setViewM(0), setViewY(y => y + 1)) : setViewM(m => m + 1); }

  const sel = parseDob();
  const today = new Date();
  const cells = buildGrid(viewY, viewM);

  // Clamp popup so it doesn't go off-screen
  const popLeft  = rect ? Math.min(rect.left, window.innerWidth - 290) : 0;
  const popTop   = rect ? (rect.bottom + 4 + 320 > window.innerHeight ? rect.top - 324 : rect.bottom + 4) : 0;

  return (
    <>
      <div ref={anchorRef}>
        <div style={{ display: 'flex', alignItems: 'center', height: 34, border: `1px solid ${hasError ? '#c62828' : '#aeb7c2'}`, borderRadius: 3, background: hasError ? '#fff5f5' : '#f6f8fb', overflow: 'hidden' }}>
          <input
            type="text"
            value={value}
            onChange={ev => onChange(ev.target.value)}
            placeholder="MM-DD-YYYY"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, padding: '0 10px', height: '100%' }}
          />
          <button type="button" onClick={toggle} style={{ height: 34, width: 36, border: 'none', borderLeft: '1px solid #e5e7eb', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
        </div>
      </div>

      {open && rect && (
        <div ref={popupRef} style={{ position: 'fixed', top: popTop, left: popLeft, zIndex: 9999, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', width: 282, padding: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              <span style={{ color: '#111827' }}>{viewY}</span>{' '}
              <span style={{ color: '#1e40af' }}>{MONTHS_LONG[viewM]}</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" onClick={prevMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button type="button" onClick={nextMonth} style={{ width: 28, height: 28, border: '1px solid #e5e7eb', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
          {/* Day names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
            {DAY_NAMES.map(n => (
              <div key={n} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6b7280', padding: '3px 0' }}>{n}</div>
            ))}
          </div>
          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
            {cells.map((cell, i) => {
              const isCur = cell.m === viewM;
              const isToday = cell.d === today.getDate() && cell.m === today.getMonth() && cell.y === today.getFullYear();
              const isSel  = sel && cell.d === sel.d && cell.m === sel.m && cell.y === sel.y;
              return (
                <button key={i} type="button" onClick={() => select(cell.d, cell.m, cell.y)}
                  style={{ width: '100%', aspectRatio: '1', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 12, fontWeight: isToday ? 700 : 400, color: isSel ? '#fff' : isCur ? '#111827' : '#d1d5db', background: isSel ? '#0B5AA0' : 'transparent', outline: isToday && !isSel ? '2px solid #374151' : 'none', outlineOffset: -2 }}>
                  {cell.d}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// Masked input: shows XXX-XX-{last4} when blurred, actual value when focused
function MaskedSsnInput({ value, onChange, hasError }: {
  value: string; onChange: (v: string) => void; hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  function maskedDisplay(formatted: string): string {
    const digits = formatted.replace(/\D/g, '');
    if (digits.length < 6) return formatted;
    return `XXX-XX-${digits.slice(-4)}`;
  }

  return (
    <input
      type="text"
      value={focused ? value : maskedDisplay(value)}
      onChange={e => onChange(formatSsnLike(e.target.value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="XXX-XX-XXXX"
      maxLength={focused ? 11 : undefined}
      style={{ ...inputBase, border: `1px solid ${hasError ? '#c62828' : '#aeb7c2'}`, background: hasError ? '#fff5f5' : '#f6f8fb' }}
    />
  );
}

function FileBox({ compact }: { compact?: boolean }) {
  return (
    <div style={{ border: '1px dashed #cbd5e1', borderRadius: 3, minHeight: compact ? 150 : 140, background: '#f8f9fc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Drag and Drop File Here or Select a File</div>
      <div style={{ textAlign: 'center', color: '#334155', fontSize: 12, lineHeight: 1.8 }}>
        <div>Supported formats are {compact ? 'XLS, JPG, DOC, PNG & JPEG.' : 'PNG, JPEG & GIF.'}</div>
        <div>File size : 10 KB-10 MB</div>
      </div>
      <button type="button" style={{ height: 34, minWidth: 168, border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#fff', borderRadius: 3, fontSize: 13 }}>Browse File</button>
    </div>
  );
}

function SectionTitle({ title, icon = '-' }: { title: string; icon?: '+' | '-' }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid #111827', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, lineHeight: 1 }}>{icon}</span>
      {title}
    </h2>
  );
}

function TopButton() {
  return (
    <button type="button" onClick={() => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', right: 28, bottom: 72, width: 58, height: 58, borderRadius: '50%', background: '#0B5AA0', color: '#fff', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(11,90,160,0.28)', zIndex: 40, fontSize: 11, fontWeight: 700 }}>
      <svg width="24" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7" /><path d="m5 21 7-7 7 7" /></svg>
      Top
    </button>
  );
}

function AccessMatrix({ perms, onToggle }: {
  perms: Record<string, string[]>;
  onToggle: (screen: string, perm: string, checked: boolean) => void;
}) {
  return (
    <section style={sectionStyle}>
      <div style={{ padding: '14px 16px' }}><SectionTitle title="User Access" /></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1260, borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {claimAccessRows.map(screen => (
              <tr key={screen}>
                <td style={{ width: 210, padding: '11px 12px', border: '1px solid #d6d6d6', fontWeight: 700 }}>{screen}</td>
                {permissionColumns.map(p => (
                  <td key={p} style={{ padding: '8px 12px', border: '1px solid #d6d6d6', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>{p}</div>
                    <input
                      type="checkbox"
                      checked={perms[screen]?.includes(p) ?? false}
                      onChange={ev => onToggle(screen, p, ev.target.checked)}
                      style={{ width: 14, height: 14, accentColor: '#0B5AA0' }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddAdjusterPage() {
  const navigate = useNavigate();
  const [form, setForm]           = useState<UpsertTempAdjusterRequest>(emptyForm);
  const [npn, setNpn]             = useState('');
  const [altTerr, setAltTerr]     = useState('');
  const [sameAddr, setSameAddr]   = useState(false);
  const [accessPerms, setAccessPerms] = useState<Record<string, string[]>>({});
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const togglePerm = (screen: string, perm: string, checked: boolean) =>
    setAccessPerms(prev => {
      const curr = prev[screen] ?? [];
      return { ...prev, [screen]: checked ? [...curr, perm] : curr.filter(p => p !== perm) };
    });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (key: keyof UpsertTempAdjusterRequest, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const clr = (key: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  // Input helpers
  const inp = (key: keyof UpsertTempAdjusterRequest, placeholder = '', disabled = false) => {
    const hasErr = !!errors[key as string];
    return (
      <input
        value={(form[key] as string | null | undefined) ?? ''}
        onChange={e => { set(key, e.target.value); clr(key as string); }}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...inputBase, border: `1px solid ${hasErr ? '#c62828' : '#aeb7c2'}`, background: disabled ? '#e5e5e5' : hasErr ? '#fff5f5' : '#f6f8fb' }}
      />
    );
  };

  const sel = (key: keyof UpsertTempAdjusterRequest, options: string[], placeholder = 'Select...') => {
    const hasErr = !!errors[key as string];
    return (
      <select
        value={(form[key] as string | null | undefined) ?? ''}
        onChange={e => { set(key, e.target.value); clr(key as string); }}
        style={{ ...inputBase, border: `1px solid ${hasErr ? '#c62828' : '#aeb7c2'}`, background: hasErr ? '#fff5f5' : '#f6f8fb' }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    );
  };

  const updateLicense = (i: number, key: keyof TempAdjusterLicenseDto, val: string) =>
    setForm(f => ({ ...f, licenses: (f.licenses ?? []).map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  const addLicense = () =>
    setForm(f => ({ ...f, licenses: [...(f.licenses ?? []), { licensedState: '', licenseNumber: '', licenseStartDate: '', licenseExpirationDate: '' }] }));

  const removeLicense = (i: number) =>
    setForm(f => ({ ...f, licenses: (f.licenses ?? []).length <= 1 ? f.licenses : (f.licenses ?? []).filter((_, idx) => idx !== i) }));

  const handleSameAddr = (checked: boolean) => {
    setSameAddr(checked);
    if (checked) {
      setForm(f => ({
        ...f,
        mailingAddressLine1: f.registeredAddressLine1, mailingAddressLine2: f.registeredAddressLine2,
        mailingCountry: f.registeredCountry, mailingState: f.registeredState,
        mailingCity: f.registeredCity, mailingCounty: f.registeredCounty,
        mailingZipCode: f.registeredZipCode, mailingLatitude: f.registeredLatitude,
        mailingLongitude: f.registeredLongitude,
      }));
    }
  };

  const save = async () => {
    const errs = validateForm(form, npn);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        const el = document.querySelector('[data-field-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const payload = { ...form, accessJson: JSON.stringify({ npn, altTerr, accessPerms }) };
      const saved = await adjustersApi.create(payload);
      navigate(`/claims/adjusters/${saved.id}`);
    } catch {
      setSaveError('Unable to save adjuster details. Please check the API/database connection.');
    } finally {
      setSaving(false);
    }
  };

  const e = errors;

  return (
    <div style={{ padding: '16px 16px 78px', background: '#fff', minHeight: '100%', position: 'relative' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#111827' }}>Add Adjuster</h1>
      <div style={{ fontSize: 12, color: '#0f172a', marginTop: 6, marginBottom: 16 }}>Adjuster Management / Primary Information</div>
      {saveError && <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 13 }}>{saveError}</div>}

      {/* ── Primary Info + Addresses ── */}
      <section style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: '1fr 2fr', marginBottom: 16 }}>

        {/* Left column */}
        <div style={{ padding: 16, borderRight: '1px solid #d8dee6' }}>
          <SectionTitle title="User Primary Information" />
          <div style={{ marginTop: 16, height: 40, background: '#e3faef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', fontSize: 13, color: '#006b3c' }}>
            <strong>User ID - Auto</strong>
            <span style={{ color: '#000', fontSize: 11 }}>Auto Generated</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Upload User Profile Image" required>
              <FileBox />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <Field label="First Name" required error={e.firstName}>
              <div data-field-error={!!e.firstName || undefined}>{inp('firstName')}</div>
            </Field>
            <Field label="Middle Name / Initial">{inp('middleName')}</Field>

            <Field label="Last Name" required error={e.lastName}>
              <div data-field-error={!!e.lastName || undefined}>{inp('lastName')}</div>
            </Field>
            <Field label="Date of Birth" required error={e.dateOfBirth}>
              <div data-field-error={!!e.dateOfBirth || undefined}>
                <DatePicker
                  value={form.dateOfBirth ?? ''}
                  onChange={v => { set('dateOfBirth', v); clr('dateOfBirth'); }}
                  hasError={!!e.dateOfBirth}
                />
              </div>
            </Field>

            <Field label="SSN">{inp('ssn')}</Field>
            <Field label="Tax ID" required error={e.taxId}>
              <div data-field-error={!!e.taxId || undefined}>
                <MaskedSsnInput value={form.taxId ?? ''} onChange={v => { set('taxId', v); clr('taxId'); }} hasError={!!e.taxId} />
              </div>
            </Field>

            <Field label="Role" required error={e.role}>
              <div data-field-error={!!e.role || undefined}>
                {sel('role', ['Junior Adjuster', 'Senior Adjuster', 'Supervisor'])}
              </div>
            </Field>
            <Field label="Adjuster Type" required error={e.adjusterType}>
              <div data-field-error={!!e.adjusterType || undefined}>
                {sel('adjusterType', ['External', 'Internal'])}
              </div>
            </Field>

            <Field label="Status" required error={e.status}>
              <div data-field-error={!!e.status || undefined}>
                {sel('status', ['Active', 'Inactive'])}
              </div>
            </Field>
            <Field label="Claim Types Handled" required error={e.claimTypesHandled}>
              <div data-field-error={!!e.claimTypesHandled || undefined}>
                {sel('claimTypesHandled', ['Auto', 'Property', 'Liability'])}
              </div>
            </Field>

            <Field label="Territory Type" required error={e.territoryType}>
              <div data-field-error={!!e.territoryType || undefined}>
                {sel('territoryType', ['State', 'County', 'City'])}
              </div>
            </Field>
            <Field label="Territories Assigned" required error={e.territoriesAssigned}>
              <div data-field-error={!!e.territoriesAssigned || undefined}>
                {sel('territoriesAssigned', ['Alabama', 'California', 'Texas'])}
              </div>
            </Field>

            <Field label="Alternate Territories Assigned">
              <input value={altTerr} onChange={ev => setAltTerr(ev.target.value)} style={inputBase} />
            </Field>
            <Field label="National Producer Number (NPN)" required error={e.npn}>
              <div data-field-error={!!e.npn || undefined}>
                <MaskedSsnInput value={npn} onChange={v => { setNpn(v); clr('npn'); }} hasError={!!e.npn} />
              </div>
            </Field>
          </div>

          {/* Contact Details */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 16, paddingTop: 16 }}>
            <SectionTitle title="Contact Details" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
              <Field label="Preferred Mode of Communication" required error={e.preferredCommunication}>
                <div data-field-error={!!e.preferredCommunication || undefined}>
                  {sel('preferredCommunication', ['Email', 'Phone', 'SMS'])}
                </div>
              </Field>
              <Field label="Telephone Number" required error={e.telephoneNumber}>
                <div data-field-error={!!e.telephoneNumber || undefined}>
                  <PhoneInput
                    value={form.telephoneNumber ?? ''}
                    onChange={v => { set('telephoneNumber', v); clr('telephoneNumber'); }}
                    hasError={!!e.telephoneNumber}
                  />
                </div>
              </Field>

              <Field label="Extension">{inp('extension')}</Field>
              <Field label="Alternative Telephone Number">
                <PhoneInput
                  value={form.alternativeTelephoneNumber ?? ''}
                  onChange={v => set('alternativeTelephoneNumber', v)}
                />
              </Field>

              <Field label="Email ID" required error={e.emailId}>
                <div data-field-error={!!e.emailId || undefined}>{inp('emailId')}</div>
              </Field>
            </div>
          </div>
        </div>

        {/* Right column: Addresses */}
        <div style={{ padding: 16 }}>
          <SectionTitle title="Registered Address" />
          <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
            <Field label="Google Address Search"><input style={inputBase} /></Field>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} /> Enter Address Manually
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Address Line 1" required error={e.registeredAddressLine1}>
                <div data-field-error={!!e.registeredAddressLine1 || undefined}>{inp('registeredAddressLine1')}</div>
              </Field>
              <Field label="Address Line 2">{inp('registeredAddressLine2')}</Field>

              <Field label="Country" required>
                <input value="United States" readOnly style={{ ...inputBase, background: '#e5e5e5' }} />
              </Field>
              <Field label="State" required error={e.registeredState}>
                <div data-field-error={!!e.registeredState || undefined}>{inp('registeredState')}</div>
              </Field>

              <Field label="City" required error={e.registeredCity}>
                <div data-field-error={!!e.registeredCity || undefined}>{inp('registeredCity')}</div>
              </Field>
              <Field label="County" required error={e.registeredCounty}>
                <div data-field-error={!!e.registeredCounty || undefined}>{inp('registeredCounty')}</div>
              </Field>

              <Field label="Zip Code" required error={e.registeredZipCode}>
                <div data-field-error={!!e.registeredZipCode || undefined}>{inp('registeredZipCode')}</div>
              </Field>
              <Field label="Latitude">{inp('registeredLatitude')}</Field>
              <Field label="Longitude">{inp('registeredLongitude')}</Field>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #d8dee6', marginTop: 16, paddingTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <SectionTitle title="Mailing Address" />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={sameAddr} onChange={ev => handleSameAddr(ev.target.checked)} style={{ width: 16, height: 16 }} />
                Same as Registered Address
              </label>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Google Address Search"><input style={inputBase} /></Field>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" style={{ width: 18, height: 18 }} /> Enter Address Manually
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Address Line 1" required error={e.mailingAddressLine1}>
                  <div data-field-error={!!e.mailingAddressLine1 || undefined}>{inp('mailingAddressLine1')}</div>
                </Field>
                <Field label="Address Line 2">{inp('mailingAddressLine2')}</Field>

                <Field label="Country" required>
                  <input value="United States" readOnly style={{ ...inputBase, background: '#e5e5e5' }} />
                </Field>
                <Field label="State" required error={e.mailingState}>
                  <div data-field-error={!!e.mailingState || undefined}>{inp('mailingState')}</div>
                </Field>

                <Field label="City" required error={e.mailingCity}>
                  <div data-field-error={!!e.mailingCity || undefined}>{inp('mailingCity')}</div>
                </Field>
                <Field label="County" required error={e.mailingCounty}>
                  <div data-field-error={!!e.mailingCounty || undefined}>{inp('mailingCounty')}</div>
                </Field>

                <Field label="Zip Code" required error={e.mailingZipCode}>
                  <div data-field-error={!!e.mailingZipCode || undefined}>{inp('mailingZipCode')}</div>
                </Field>
                <Field label="Latitude">{inp('mailingLatitude')}</Field>
                <Field label="Longitude">{inp('mailingLongitude')}</Field>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── License Details ── */}
      <section style={{ ...sectionStyle, padding: 16, marginBottom: 16 }}>
        <SectionTitle title="Adjuster License Details" />
        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {(form.licenses ?? []).map((row, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}>
              <Field label="Licensed States" required error={e[`lic_${idx}_state`]}>
                <div data-field-error={!!e[`lic_${idx}_state`] || undefined}>
                  <input
                    value={row.licensedState ?? ''}
                    onChange={ev => { updateLicense(idx, 'licensedState', ev.target.value); clr(`lic_${idx}_state`); }}
                    style={{ ...inputBase, border: `1px solid ${e[`lic_${idx}_state`] ? '#c62828' : '#aeb7c2'}`, background: e[`lic_${idx}_state`] ? '#fff5f5' : '#f6f8fb' }}
                  />
                </div>
              </Field>
              <Field label="License Number" required error={e[`lic_${idx}_number`]}>
                <div data-field-error={!!e[`lic_${idx}_number`] || undefined}>
                  <input
                    value={row.licenseNumber ?? ''}
                    onChange={ev => { updateLicense(idx, 'licenseNumber', ev.target.value.slice(0, 20)); clr(`lic_${idx}_number`); }}
                    maxLength={20}
                    style={{ ...inputBase, border: `1px solid ${e[`lic_${idx}_number`] ? '#c62828' : '#aeb7c2'}`, background: e[`lic_${idx}_number`] ? '#fff5f5' : '#f6f8fb' }}
                  />
                  <div style={{ textAlign: 'right', fontSize: 11, color: (row.licenseNumber?.length ?? 0) >= 20 ? '#c62828' : '#94a3b8', marginTop: 2 }}>
                    {row.licenseNumber?.length ?? 0}/20
                  </div>
                </div>
              </Field>
              <Field label="License Start Date">
                <input value={row.licenseStartDate ?? ''} onChange={ev => updateLicense(idx, 'licenseStartDate', ev.target.value)} placeholder="MM-DD-YYYY" style={inputBase} />
              </Field>
              <Field label="License Expiration Date">
                <input value={row.licenseExpirationDate ?? ''} onChange={ev => updateLicense(idx, 'licenseExpirationDate', ev.target.value)} placeholder="MM-DD-YYYY" style={inputBase} />
              </Field>
              <button type="button" onClick={() => removeLicense(idx)} title="Delete" style={{ height: 34, background: 'transparent', border: 'none', color: '#111827', cursor: 'pointer', alignSelf: 'end' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 15h10l1-15" /><path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" onClick={addLicense} style={{ height: 34, border: '1px solid #0B5AA0', color: '#fff', background: '#0B5AA0', borderRadius: 3, padding: '0 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Add New Adjuster License
          </button>
        </div>
        <div style={{ borderTop: '1px solid #d8dee6', marginTop: 16, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div><h3 style={{ fontSize: 16, marginBottom: 12 }}>Upload License Documents</h3><FileBox compact /></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>No Data Available</div>
        </div>
      </section>

      {/* ── Payment Method ── */}
      <section style={{ ...sectionStyle, padding: 16, marginBottom: 16 }}>
        <SectionTitle title="Payment Method" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 14, marginTop: 16 }}>
          <Field label="Payment Method" required error={e.paymentMethod}>
            <div data-field-error={!!e.paymentMethod || undefined}>{sel('paymentMethod', ['ACH', 'Check', 'Wire'])}</div>
          </Field>
          <Field label="Rate per Hour" required error={e.ratePerHour}>
            <div data-field-error={!!e.ratePerHour || undefined}>
              <input
                value={form.ratePerHour ?? ''}
                onChange={ev => {
                  const v = ev.target.value.replace(/\D/g, '').slice(0, 5);
                  set('ratePerHour', v);
                  clr('ratePerHour');
                }}
                placeholder="0"
                maxLength={5}
                inputMode="numeric"
                style={{ ...inputBase, border: `1px solid ${e.ratePerHour ? '#c62828' : '#aeb7c2'}`, background: e.ratePerHour ? '#fff5f5' : '#f6f8fb' }}
              />
              <div style={{ textAlign: 'right', fontSize: 11, color: (form.ratePerHour?.length ?? 0) >= 5 ? '#c62828' : '#94a3b8', marginTop: 2 }}>
                {form.ratePerHour?.length ?? 0}/5
              </div>
            </div>
          </Field>
        </div>
      </section>

      {/* ── Audit & Compliance ── */}
      <section style={{ ...sectionStyle, padding: 16, marginBottom: 16 }}>
        <SectionTitle title="Audit & Compliance" icon="+" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginTop: 16 }}>
          <Field label="Created By"><div style={{ fontSize: 13 }}>-</div></Field>
          <Field label="Updated By"><div style={{ fontSize: 13 }}>-</div></Field>
          <Field label="Updated Date"><div style={{ fontSize: 13 }}>-</div></Field>
          <Field label="Compliance Flag">{sel('complianceFlag', ['Authorized', 'Review Required'])}</Field>
        </div>
      </section>

      <AccessMatrix perms={accessPerms} onToggle={togglePerm} />
      <TopButton />

      {/* ── Footer ── */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 52, background: '#fff', boxShadow: '0 -2px 8px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14, padding: '0 28px', zIndex: 35 }}>
        <button onClick={() => setCancelOpen(true)} style={{ height: 34, minWidth: 134, border: '1px solid #d8dee6', color: '#0B5AA0', background: '#fff', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving} style={{ height: 34, minWidth: 134, border: '1px solid #0B5AA0', color: '#fff', background: '#0B5AA0', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Register'}
        </button>
      </div>

      {/* ── Cancel modal ── */}
      {cancelOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 314, minHeight: 214, background: '#fff', borderRadius: 6, boxShadow: '0 10px 28px rgba(15,23,42,0.22)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, lineHeight: 1.45, marginBottom: 18 }}>
              Are you sure, you want to cancel the adjuster creation?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%' }}>
              <button onClick={() => navigate('/claims/adjusters')} style={{ height: 34, border: '1px solid #0B5AA0', color: '#0B5AA0', background: '#e3f5ff', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => setCancelOpen(false)} style={{ height: 34, border: '1px solid #e54858', color: '#fff', background: '#e54858', borderRadius: 4, fontWeight: 700, cursor: 'pointer' }}>
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
