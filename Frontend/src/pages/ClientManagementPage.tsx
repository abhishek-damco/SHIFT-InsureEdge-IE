// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
import React, { useCallback, useEffect, useState } from 'react';
import { clientManagementApi } from '../api/clientManagement';
import type {
  ClientDetail,
  AddressDto,
  ContactDto,
  OfficeDto,
  CompanyDto,
  ProductAccessDto,
  SaveClientInfoRequest,
  SaveAddressRequest,
  SaveContactRequest,
  SaveOfficeRequest,
  SaveCompanyRequest,
  SaveProductAccessRequest,
  JurisdictionDto,
} from '../types/ClientManagement';

// ── Styles (matching app design system) ───────────────────────────────────────
const inp: React.CSSProperties = {
  height: 34, border: '1px solid #aeb7c2', borderRadius: 3,
  background: '#f6f8fb', padding: '0 10px', fontSize: 13, width: '100%',
  boxSizing: 'border-box',
};
const panel: React.CSSProperties = {
  border: '1px solid #d8dee6', borderRadius: 4, background: '#fff',
  padding: 16, marginBottom: 16,
};
const editingPanel: React.CSSProperties = { ...panel, border: '1px solid #bfdbfe' };
const btnPrimary: React.CSSProperties = {
  height: 34, padding: '0 16px', background: '#0B5AA0', color: '#fff',
  border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  height: 34, padding: '0 16px', background: '#fff', color: '#0B5AA0',
  border: '1px solid #d8dee6', borderRadius: 3, fontSize: 13, cursor: 'pointer',
};
const btnDanger: React.CSSProperties = {
  height: 34, padding: '0 14px', background: '#fff', color: '#dc2626',
  border: '1px solid #fca5a5', borderRadius: 3, fontSize: 13, cursor: 'pointer',
};

// ── US States ─────────────────────────────────────────────────────────────────
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
];

// ── Tiny atoms ─────────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />
    </svg>
  );
}

function ImageUpload({ value, contentType, onChange }: {
  value?: string | null;
  contentType?: string | null;
  onChange: (base64: string, contentType: string, fileName: string) => void;
}) {
  const [dragging, setDragging] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      // result is "data:image/png;base64,XXXX" — extract just the base64 part
      const [header, b64] = result.split(',');
      const ct = header.replace('data:', '').replace(';base64', '');
      onChange(b64, ct, file.name);
    };
    reader.readAsDataURL(file);
  };

  const preview = value ? `data:${contentType ?? 'image/png'};base64,${value}` : null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 6 }}>Logo / Image</div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f?.type.startsWith('image/')) handleFile(f);
        }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#0B5AA0' : '#d1d5db'}`,
          borderRadius: 8, padding: '16px 12px',
          background: dragging ? '#eff6ff' : '#fafafa',
          cursor: 'pointer', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        {preview ? (
          <img src={preview} alt="logo" style={{ maxHeight: 72, maxWidth: 180, objectFit: 'contain', borderRadius: 4 }} />
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>
            </svg>
            <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Drag and Drop or Select a File</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPEG, GIF · 10 KB – 10 MB</div>
          </>
        )}
        <button type="button"
          onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ ...btnSecondary, height: 28, padding: '0 12px', fontSize: 11, marginTop: 2 }}>
          {preview ? 'Change Image' : 'Browse File'}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8, marginBottom: 0 }}>
      <div style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{value ?? '-'}</div>
    </div>
  );
}

function EditField({ label, value, onChange, textarea }: {
  label: string; value?: string | number | null;
  onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: 5, fontSize: 13, color: '#111827', fontWeight: 500 }}>
      {label}
      {textarea
        ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={3}
            style={{ ...inp, height: 'auto', padding: '6px 10px', resize: 'vertical' }} />
        : <input value={value ?? ''} onChange={e => onChange(e.target.value)} style={inp} />
      }
    </label>
  );
}

function SectionHeader({ title, editing, onEdit }: { title: string; editing: boolean; onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h2>
      {!editing && (
        <button onClick={onEdit} title="Edit" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex' }}>
          <PencilIcon />
        </button>
      )}
    </div>
  );
}

function SectionActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
      <button onClick={onCancel} style={btnSecondary} disabled={saving}>Cancel</button>
      <button onClick={onSave} style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
    </div>
  );
}

function FieldGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '20px 16px' }}>
      {children}
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: ok ? '#dcfce7' : '#fee2e2', color: ok ? '#16a34a' : '#dc2626',
      padding: '12px 20px', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      fontSize: 14, fontWeight: 500,
    }}>{msg}</div>
  );
}

// ── Delete confirm modal ───────────────────────────────────────────────────────
function DeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 8, padding: 32, width: 380, textAlign: 'center', border: '1px solid #d8dee6' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <TrashIcon />
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#111827' }}>Delete {label}?</div>
        <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={onCancel} style={btnSecondary}>No, Keep It</button>
          <button onClick={onConfirm} style={{ ...btnPrimary, background: '#dc2626' }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Jurisdiction modal ─────────────────────────────────────────────────────────
function JurisdictionModal({ current, onSave, onClose }: {
  current: JurisdictionDto[];
  onSave: (j: JurisdictionDto[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(new Set(current.map(j => j.stateCode)));
  const [search, setSearch] = useState('');
  const filtered = US_STATES.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const allSelected = filtered.every(s => selected.has(s.code));

  const toggle = (code: string) => setSelected(prev => {
    const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n;
  });
  const toggleAll = () => {
    if (allSelected) { const n = new Set(selected); filtered.forEach(s => n.delete(s.code)); setSelected(n); }
    else { const n = new Set(selected); filtered.forEach(s => n.add(s.code)); setSelected(n); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 24, width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid #d8dee6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Set State Jurisdiction</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Selected: {selected.size} state{selected.size !== 1 ? 's' : ''}</div>
        <input placeholder="Search state..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ width: 14, height: 14, accentColor: '#0B5AA0' }} />
          <span style={{ fontSize: 13, color: '#374151' }}>Select All ({filtered.length})</span>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {filtered.map(s => (
            <label key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', cursor: 'pointer', borderRadius: 3, background: selected.has(s.code) ? '#eff6ff' : 'transparent', fontSize: 13 }}>
              <input type="checkbox" checked={selected.has(s.code)} onChange={() => toggle(s.code)} style={{ width: 13, height: 13, accentColor: '#0B5AA0' }} />
              {s.name}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={() => { onSave(US_STATES.filter(s => selected.has(s.code)).map(s => ({ stateCode: s.code, stateName: s.name }))); onClose(); }} style={btnPrimary}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Office form modal ──────────────────────────────────────────────────────────
function OfficeModal({ office, onSave, onClose }: {
  office?: OfficeDto;
  onSave: (req: SaveOfficeRequest) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SaveOfficeRequest>({
    id: office?.id,
    officeName: office?.officeName ?? '',
    officeType: office?.officeType ?? '',
    addressLine1: office?.addressLine1 ?? '',
    addressLine2: office?.addressLine2 ?? '',
    country: office?.country ?? 'United States',
    state: office?.state ?? '',
    city: office?.city ?? '',
    county: office?.county ?? '',
    zipCode: office?.zipCode ?? '',
    latitude: office?.latitude ?? '',
    longitude: office?.longitude ?? '',
    contactName: office?.contactName ?? '',
    contactSuffix: office?.contactSuffix ?? '',
    contactTitle: office?.contactTitle ?? '',
    contactEmail: office?.contactEmail ?? '',
    contactPhone: office?.contactPhone ?? '',
    contactPhoneCc: office?.contactPhoneCc ?? '+1',
    contactExt: office?.contactExt,
    contactAltPhone: office?.contactAltPhone ?? '',
    contactAltPhoneCc: office?.contactAltPhoneCc ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const up = <K extends keyof SaveOfficeRequest>(k: K, v: SaveOfficeRequest[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.officeName.trim()) { setErr('Office Name is required.'); return; }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch { setErr('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 24, width: 740, maxHeight: '88vh', overflowY: 'auto', border: '1px solid #d8dee6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{office ? 'Edit' : 'Add'} Office Location</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20 }}>×</button>
        </div>
        {err && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Office Address</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <EditField label="Office Name *" value={form.officeName} onChange={v => up('officeName', v)} />
              <EditField label="Office Type" value={form.officeType} onChange={v => up('officeType', v)} />
              <EditField label="Address Line 1" value={form.addressLine1} onChange={v => up('addressLine1', v)} />
              <EditField label="Address Line 2" value={form.addressLine2} onChange={v => up('addressLine2', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EditField label="Country" value={form.country} onChange={v => up('country', v)} />
                <EditField label="State" value={form.state} onChange={v => up('state', v)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <EditField label="City" value={form.city} onChange={v => up('city', v)} />
                <EditField label="Zip Code" value={form.zipCode} onChange={v => up('zipCode', v)} />
              </div>
              <EditField label="County" value={form.county} onChange={v => up('county', v)} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Primary Contact</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <EditField label="Name" value={form.contactName} onChange={v => up('contactName', v)} />
              <EditField label="Suffix" value={form.contactSuffix} onChange={v => up('contactSuffix', v)} />
              <EditField label="Title" value={form.contactTitle} onChange={v => up('contactTitle', v)} />
              <EditField label="Email ID" value={form.contactEmail} onChange={v => up('contactEmail', v)} />
              <EditField label="Telephone Number" value={form.contactPhone} onChange={v => up('contactPhone', v)} />
              <EditField label="Alt. Telephone" value={form.contactAltPhone} onChange={v => up('contactAltPhone', v)} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Company form modal ─────────────────────────────────────────────────────────
function CompanyModal({ company, onSave, onClose }: {
  company?: CompanyDto;
  onSave: (req: SaveCompanyRequest) => Promise<void>;
  onClose: () => void;
}) {
  const blankAddr = (type: string): SaveAddressRequest => ({ addressType: type, country: 'United States', isManual: false });
  const [form, setForm] = useState<SaveCompanyRequest>({
    id: company?.id,
    companyName: company?.companyName ?? '',
    domicileCountry: company?.domicileCountry ?? 'United States',
    stateOfDomicile: company?.stateOfDomicile ?? '',
    naicCode: company?.naicCode ?? '',
    emailId: company?.emailId ?? '',
    telephoneNumber: company?.telephoneNumber ?? '',
    telephoneNumberCc: company?.telephoneNumberCc ?? '+1',
    federalTaxId: company?.federalTaxId ?? '',
    url: company?.url ?? '',
    businessDescription: company?.businessDescription ?? '',
    status: company?.status ?? 'Active',
    legalAddress: company?.legalAddress
      ? { addressType: 'Legal', addressLine1: company.legalAddress.addressLine1, addressLine2: company.legalAddress.addressLine2, country: company.legalAddress.country ?? 'United States', state: company.legalAddress.state, city: company.legalAddress.city, county: company.legalAddress.county, zipCode: company.legalAddress.zipCode, isManual: false }
      : blankAddr('Legal'),
    mailingAddress: company?.mailingAddress
      ? { addressType: 'Mailing', addressLine1: company.mailingAddress.addressLine1, country: company.mailingAddress.country ?? 'United States', state: company.mailingAddress.state, city: company.mailingAddress.city, county: company.mailingAddress.county, zipCode: company.mailingAddress.zipCode, isManual: false }
      : blankAddr('Mailing'),
    primaryContact: {
      name: company?.primaryContact?.name ?? '',
      title: company?.primaryContact?.title ?? '',
      emailId: company?.primaryContact?.emailId ?? '',
      telephoneNumber: company?.primaryContact?.telephoneNumber ?? '',
    },
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const upLegal = (k: keyof SaveAddressRequest, v: string) =>
    setForm(f => ({ ...f, legalAddress: { ...f.legalAddress!, [k]: v } }));
  const upMailing = (k: keyof SaveAddressRequest, v: string) =>
    setForm(f => ({ ...f, mailingAddress: { ...f.mailingAddress!, [k]: v } }));
  const upContact = (k: keyof SaveContactRequest, v: string) =>
    setForm(f => ({ ...f, primaryContact: { ...f.primaryContact, [k]: v } }));

  const handleSave = async () => {
    if (!form.companyName.trim()) { setErr('Company Name is required.'); return; }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch { setErr('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 6, padding: 24, width: 880, maxHeight: '92vh', overflowY: 'auto', border: '1px solid #d8dee6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{company ? 'Edit' : 'Add'} Company</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20 }}>×</button>
        </div>
        {company && (
          <div style={{ background: '#e3faef', color: '#006b3c', fontSize: 12, padding: '6px 12px', borderRadius: 3, marginBottom: 16 }}>
            Client Company ID — {company.companyCode} &nbsp;·&nbsp; Auto Generated
          </div>
        )}
        {err && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{err}</div>}

        <ImageUpload
          value={form.logoBase64 ?? company?.logoBase64}
          contentType={form.logoContentType ?? company?.logoContentType}
          onChange={(b64, ct, name) => setForm(f => ({ ...f, logoBase64: b64, logoContentType: ct, logoFileName: name }))}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {/* Column 1: primary info */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Primary Information</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34 }}>
                <label style={{ fontSize: 13, color: '#374151' }}>Status:</label>
                {(['Active', 'Inactive'] as const).map(s => (
                  <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s }))} style={{ accentColor: '#0B5AA0' }} /> {s}
                  </label>
                ))}
              </div>
              <EditField label="Company Name *" value={form.companyName} onChange={v => setForm(f => ({ ...f, companyName: v }))} />
              <EditField label="Domicile Country" value={form.domicileCountry} onChange={v => setForm(f => ({ ...f, domicileCountry: v }))} />
              <EditField label="State of Domicile" value={form.stateOfDomicile} onChange={v => setForm(f => ({ ...f, stateOfDomicile: v }))} />
              <EditField label="NAIC Code" value={form.naicCode} onChange={v => setForm(f => ({ ...f, naicCode: v }))} />
              <EditField label="Federal Tax ID" value={form.federalTaxId} onChange={v => setForm(f => ({ ...f, federalTaxId: v }))} />
              <EditField label="Email ID" value={form.emailId} onChange={v => setForm(f => ({ ...f, emailId: v }))} />
              <EditField label="Telephone Number" value={form.telephoneNumber} onChange={v => setForm(f => ({ ...f, telephoneNumber: v }))} />
              <EditField label="Website URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} />
              <EditField label="Business Description" value={form.businessDescription} onChange={v => setForm(f => ({ ...f, businessDescription: v }))} textarea />
            </div>
          </div>

          {/* Column 2: legal address */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Home Office / Legal Address</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <EditField label="Address Line 1" value={form.legalAddress?.addressLine1} onChange={v => upLegal('addressLine1', v)} />
              <EditField label="Address Line 2" value={form.legalAddress?.addressLine2} onChange={v => upLegal('addressLine2', v)} />
              <EditField label="Country" value={form.legalAddress?.country} onChange={v => upLegal('country', v)} />
              <EditField label="State" value={form.legalAddress?.state} onChange={v => upLegal('state', v)} />
              <EditField label="City" value={form.legalAddress?.city} onChange={v => upLegal('city', v)} />
              <EditField label="County" value={form.legalAddress?.county} onChange={v => upLegal('county', v)} />
              <EditField label="Zip Code" value={form.legalAddress?.zipCode} onChange={v => upLegal('zipCode', v)} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', margin: '20px 0 14px' }}>Mailing Address</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <EditField label="Address Line 1" value={form.mailingAddress?.addressLine1} onChange={v => upMailing('addressLine1', v)} />
              <EditField label="Country" value={form.mailingAddress?.country} onChange={v => upMailing('country', v)} />
              <EditField label="State" value={form.mailingAddress?.state} onChange={v => upMailing('state', v)} />
              <EditField label="City" value={form.mailingAddress?.city} onChange={v => upMailing('city', v)} />
              <EditField label="Zip Code" value={form.mailingAddress?.zipCode} onChange={v => upMailing('zipCode', v)} />
            </div>
          </div>

          {/* Column 3: contact */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Primary Contact</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <EditField label="Name" value={form.primaryContact?.name} onChange={v => upContact('name', v)} />
              <EditField label="Title" value={form.primaryContact?.title} onChange={v => upContact('title', v)} />
              <EditField label="Email ID" value={form.primaryContact?.emailId} onChange={v => upContact('emailId', v)} />
              <EditField label="Telephone Number" value={form.primaryContact?.telephoneNumber} onChange={v => upContact('telephoneNumber', v)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button onClick={onClose} style={btnSecondary}>Cancel</button>
          <button onClick={handleSave} style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Address inline-edit section ────────────────────────────────────────────────
function AddressSection({ title, addr, onSave }: {
  title: string;
  addr?: AddressDto | null;
  onSave: (req: SaveAddressRequest) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SaveAddressRequest>({
    addressType: addr?.addressType ?? 'Legal',
    addressLine1: addr?.addressLine1 ?? '',
    addressLine2: addr?.addressLine2 ?? '',
    country: addr?.country ?? '',
    state: addr?.state ?? '',
    city: addr?.city ?? '',
    county: addr?.county ?? '',
    zipCode: addr?.zipCode ?? '',
    latitude: addr?.latitude ?? '',
    longitude: addr?.longitude ?? '',
    isManual: addr?.isManual ?? false,
  });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({
      addressType: addr?.addressType ?? title.includes('Mailing') ? 'Mailing' : 'Legal',
      addressLine1: addr?.addressLine1 ?? '',
      addressLine2: addr?.addressLine2 ?? '',
      country: addr?.country ?? '',
      state: addr?.state ?? '',
      city: addr?.city ?? '',
      county: addr?.county ?? '',
      zipCode: addr?.zipCode ?? '',
      latitude: addr?.latitude ?? '',
      longitude: addr?.longitude ?? '',
      isManual: addr?.isManual ?? false,
    });
    setEditing(true);
  };

  const up = (k: keyof SaveAddressRequest, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await onSave(form); setEditing(false); }
    finally { setSaving(false); }
  };

  return (
    <section style={editing ? editingPanel : panel}>
      <SectionHeader title={title} editing={editing} onEdit={startEdit} />
      {editing ? (
        <>
          <FieldGrid cols={3}>
            <EditField label="Address Line 1" value={form.addressLine1} onChange={v => up('addressLine1', v)} />
            <EditField label="Address Line 2" value={form.addressLine2} onChange={v => up('addressLine2', v)} />
            <span />
            <EditField label="Country" value={form.country} onChange={v => up('country', v)} />
            <EditField label="State" value={form.state} onChange={v => up('state', v)} />
            <EditField label="City" value={form.city} onChange={v => up('city', v)} />
            <EditField label="County" value={form.county} onChange={v => up('county', v)} />
            <EditField label="Zip Code" value={form.zipCode} onChange={v => up('zipCode', v)} />
            <span />
            <EditField label="Latitude" value={form.latitude} onChange={v => up('latitude', v)} />
            <EditField label="Longitude" value={form.longitude} onChange={v => up('longitude', v)} />
          </FieldGrid>
          <SectionActions onCancel={() => setEditing(false)} onSave={save} saving={saving} />
        </>
      ) : (
        <FieldGrid cols={3}>
          <ReadField label="Address Line 1" value={addr?.addressLine1} />
          <ReadField label="Address Line 2" value={addr?.addressLine2} />
          <span />
          <ReadField label="Country" value={addr?.country} />
          <ReadField label="State" value={addr?.state} />
          <ReadField label="City" value={addr?.city} />
          <ReadField label="County" value={addr?.county} />
          <ReadField label="Zip Code" value={addr?.zipCode} />
          <span />
          <ReadField label="Latitude" value={addr?.latitude} />
          <ReadField label="Longitude" value={addr?.longitude} />
        </FieldGrid>
      )}
    </section>
  );
}

// ── Contact inline-edit section ────────────────────────────────────────────────
function ContactSection({ title, contact, onSave }: {
  title: string;
  contact?: ContactDto | null;
  onSave: (req: SaveContactRequest) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SaveContactRequest>({
    name: contact?.name ?? '',
    suffix: contact?.suffix ?? '',
    title: contact?.title ?? '',
    emailId: contact?.emailId ?? '',
    telephoneNumber: contact?.telephoneNumber ?? '',
    telephoneNumberCc: contact?.telephoneNumberCc ?? '+1',
    altTelephoneNumber: contact?.altTelephoneNumber ?? '',
  });
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setForm({
      name: contact?.name ?? '',
      suffix: contact?.suffix ?? '',
      title: contact?.title ?? '',
      emailId: contact?.emailId ?? '',
      telephoneNumber: contact?.telephoneNumber ?? '',
      telephoneNumberCc: contact?.telephoneNumberCc ?? '+1',
      altTelephoneNumber: contact?.altTelephoneNumber ?? '',
    });
    setEditing(true);
  };

  const up = (k: keyof SaveContactRequest, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => { setSaving(true); try { await onSave(form); setEditing(false); } finally { setSaving(false); } };

  return (
    <section style={editing ? editingPanel : panel}>
      <SectionHeader title={title} editing={editing} onEdit={startEdit} />
      {editing ? (
        <>
          <FieldGrid cols={3}>
            <EditField label="Name" value={form.name} onChange={v => up('name', v)} />
            <EditField label="Suffix" value={form.suffix} onChange={v => up('suffix', v)} />
            <EditField label="Title" value={form.title} onChange={v => up('title', v)} />
            <EditField label="Email ID" value={form.emailId} onChange={v => up('emailId', v)} />
            <EditField label="Telephone Number" value={form.telephoneNumber} onChange={v => up('telephoneNumber', v)} />
            <EditField label="Alt. Telephone" value={form.altTelephoneNumber} onChange={v => up('altTelephoneNumber', v)} />
          </FieldGrid>
          <SectionActions onCancel={() => setEditing(false)} onSave={save} saving={saving} />
        </>
      ) : (
        <FieldGrid cols={3}>
          <ReadField label="Name" value={contact?.name} />
          <ReadField label="Suffix" value={contact?.suffix} />
          <ReadField label="Title" value={contact?.title} />
          <ReadField label="Email ID" value={contact?.emailId} />
          <ReadField label="Telephone Number" value={contact?.telephoneNumber} />
          <ReadField label="Alt. Telephone" value={contact?.altTelephoneNumber} />
        </FieldGrid>
      )}
    </section>
  );
}

// ── Tab 1: Client Information ──────────────────────────────────────────────────
function ClientInfoTab({ client, onRefresh, showToast }: {
  client: ClientDetail;
  onRefresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SaveClientInfoRequest>({ companyName: client.companyName });
  const [saving, setSaving] = useState(false);
  const [officeSearch, setOfficeSearch] = useState('');
  const [showOfficeModal, setShowOfficeModal] = useState<'add' | OfficeDto | null>(null);
  const [deletingOfficeId, setDeletingOfficeId] = useState<number | null>(null);

  const startEdit = () => {
    setForm({
      companyName: client.companyName, typeOfCompany: client.typeOfCompany,
      naicCode: client.naicCode, registeredTradeMark: client.registeredTradeMark,
      domicileCountry: client.domicileCountry, stateOfDomicile: client.stateOfDomicile,
      stateAllowedToOperate: client.stateAllowedToOperate, federalTaxId: client.federalTaxId,
      ownedBy: client.ownedBy, numberOfEmployees: client.numberOfEmployees,
      estDirectWrittenPremium: client.estDirectWrittenPremium, yearBusinessStarted: client.yearBusinessStarted,
      businessDescription: client.businessDescription, emailId: client.emailId,
      telephoneNumber: client.telephoneNumber, telephoneNumberCc: client.telephoneNumberCc,
      extension: client.extension, clientUrl: client.clientUrl,
      clientOnboardingDate: client.clientOnboardingDate, status: client.status,
    });
    setEditing(true);
  };

  const up = (k: keyof SaveClientInfoRequest, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await clientManagementApi.updateInfo(form);
      await onRefresh();
      setEditing(false);
      showToast('Client information saved.');
    } catch { showToast('Failed to save.', false); }
    finally { setSaving(false); }
  };

  const handleSaveAddress = async (req: SaveAddressRequest) => {
    await clientManagementApi.saveAddress(req);
    onRefresh();
    showToast('Address saved.');
  };

  const handleSaveContact = async (req: SaveContactRequest) => {
    await clientManagementApi.saveContact(req);
    onRefresh();
    showToast('Contact saved.');
  };

  const handleSaveOffice = async (req: SaveOfficeRequest) => {
    await clientManagementApi.saveOffice(req);
    onRefresh();
    showToast('Office saved.');
  };

  const handleDeleteOffice = async () => {
    if (deletingOfficeId == null) return;
    await clientManagementApi.deleteOffice(deletingOfficeId);
    setDeletingOfficeId(null);
    onRefresh();
    showToast('Office deleted.');
  };

  const filteredOffices = client.offices.filter(o =>
    !officeSearch || o.officeName.toLowerCase().includes(officeSearch.toLowerCase())
  );

  return (
    <div>
      {/* Client Primary Information */}
      <section style={editing ? editingPanel : panel}>
        <SectionHeader title="Client Primary Information" editing={editing} onEdit={startEdit} />

        {/* Auto-generated ID banner */}
        <div style={{ height: 38, background: '#e3faef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', color: '#006b3c', borderRadius: 3, marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Client ID — {client.clientCode}</strong>
          <span style={{ fontSize: 11, color: '#374151' }}>Auto Generated</span>
        </div>

        {/* Logo */}
        {!editing && (
          <div style={{ width: 120, height: 72, background: '#f6f8fb', border: '1px solid #d8dee6', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11, marginBottom: 16 }}>
            {client.logoBase64
              ? <img src={`data:${client.logoContentType};base64,${client.logoBase64}`} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 3 }} />
              : 'No Logo'}
          </div>
        )}

        {editing ? (
          <>
            <ImageUpload
              value={form.logoBase64 ?? client.logoBase64}
              contentType={form.logoContentType ?? client.logoContentType}
              onChange={(b64, ct, name) => setForm(f => ({ ...f, logoBase64: b64, logoContentType: ct, logoFileName: name }))}
            />
            <FieldGrid cols={3}>
              <EditField label="Company Name *" value={form.companyName} onChange={v => up('companyName', v)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>Status</span>
                <div style={{ display: 'flex', gap: 12, height: 34, alignItems: 'center' }}>
                  {(['Active', 'Inactive'] as const).map(s => (
                    <label key={s} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" checked={form.status === s} onChange={() => setForm(f => ({ ...f, status: s }))} style={{ accentColor: '#0B5AA0' }} /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <EditField label="Type of Company" value={form.typeOfCompany} onChange={v => up('typeOfCompany', v)} />
              <EditField label="NAIC Code" value={form.naicCode} onChange={v => up('naicCode', v)} />
              <EditField label="Registered Trade Mark" value={form.registeredTradeMark} onChange={v => up('registeredTradeMark', v)} />
              <EditField label="Domicile Country" value={form.domicileCountry} onChange={v => up('domicileCountry', v)} />
              <EditField label="State of Domicile" value={form.stateOfDomicile} onChange={v => up('stateOfDomicile', v)} />
              <EditField label="State Allowed to Operate" value={form.stateAllowedToOperate} onChange={v => up('stateAllowedToOperate', v)} />
              <EditField label="Federal Tax ID" value={form.federalTaxId} onChange={v => up('federalTaxId', v)} />
              <EditField label="Owned By" value={form.ownedBy} onChange={v => up('ownedBy', v)} />
              <EditField label="No. of Employees" value={form.numberOfEmployees} onChange={v => up('numberOfEmployees', v)} />
              <EditField label="Est. Direct Written Premium" value={form.estDirectWrittenPremium} onChange={v => up('estDirectWrittenPremium', v)} />
              <EditField label="Year Business Started" value={form.yearBusinessStarted} onChange={v => up('yearBusinessStarted', v)} />
              <EditField label="Email ID" value={form.emailId} onChange={v => up('emailId', v)} />
              <EditField label="Telephone Number" value={form.telephoneNumber} onChange={v => up('telephoneNumber', v)} />
              <EditField label="Client Onboarding Date" value={form.clientOnboardingDate} onChange={v => up('clientOnboardingDate', v)} />
              <EditField label="Client URL" value={form.clientUrl} onChange={v => up('clientUrl', v)} />
              <div style={{ gridColumn: '1 / -1' }}>
                <EditField label="Business Description" value={form.businessDescription} onChange={v => up('businessDescription', v)} textarea />
              </div>
            </FieldGrid>
            <SectionActions onCancel={() => setEditing(false)} onSave={save} saving={saving} />
          </>
        ) : (
          <FieldGrid cols={3}>
            <ReadField label="Company Name" value={client.companyName} />
            <ReadField label="Status" value={client.status} />
            <ReadField label="Type of Company" value={client.typeOfCompany} />
            <ReadField label="NAIC Code" value={client.naicCode} />
            <ReadField label="Registered Trade Mark" value={client.registeredTradeMark} />
            <ReadField label="Domicile Country" value={client.domicileCountry} />
            <ReadField label="State of Domicile" value={client.stateOfDomicile} />
            <ReadField label="State Allowed to Operate" value={client.stateAllowedToOperate} />
            <ReadField label="Federal Tax ID" value={client.federalTaxId} />
            <ReadField label="Owned By" value={client.ownedBy} />
            <ReadField label="No. of Employees" value={client.numberOfEmployees} />
            <ReadField label="Est. Direct Written Premium" value={client.estDirectWrittenPremium} />
            <ReadField label="Year Business Started" value={client.yearBusinessStarted} />
            <ReadField label="Email ID" value={client.emailId} />
            <ReadField label="Telephone Number" value={client.telephoneNumber} />
            <ReadField label="Client Onboarding Date" value={client.clientOnboardingDate} />
            <ReadField label="Client URL" value={client.clientUrl} />
            <ReadField label="Business Description" value={client.businessDescription} />
          </FieldGrid>
        )}
      </section>

      <AddressSection
        title="Home Office / Legal Address"
        addr={client.legalAddress}
        onSave={req => handleSaveAddress({ ...req, addressType: 'Legal' })}
      />
      <AddressSection
        title="Mailing Address"
        addr={client.mailingAddress}
        onSave={req => handleSaveAddress({ ...req, addressType: 'Mailing' })}
      />
      <ContactSection
        title="Contact Details — Primary Contact"
        contact={client.primaryContact}
        onSave={handleSaveContact}
      />

      {/* Additional Office Locations */}
      <section style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Additional Office Locations</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              placeholder="Search offices..."
              value={officeSearch}
              onChange={e => setOfficeSearch(e.target.value)}
              style={{ ...inp, width: 180 }}
            />
            <button onClick={() => setShowOfficeModal('add')} style={btnPrimary}>+ Add Office</button>
          </div>
        </div>

        {filteredOffices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#6b7280', fontSize: 13 }}>No office locations added.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f6f8fb', borderBottom: '1px solid #d8dee6' }}>
                  {['Office Name', 'Type', 'City', 'State', 'Contact Name', 'Contact Email', ''].map(h => (
                    <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOffices.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 500 }}>{o.officeName}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{o.officeType || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{o.city || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{o.state || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{o.contactName || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#6b7280' }}>{o.contactEmail || '-'}</td>
                    <td style={{ padding: '9px 12px', display: 'flex', gap: 6 }}>
                      <button onClick={() => setShowOfficeModal(o)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4, display: 'flex' }}><PencilIcon /></button>
                      <button onClick={() => setDeletingOfficeId(o.id!)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex' }}><TrashIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showOfficeModal && (
        <OfficeModal
          office={showOfficeModal === 'add' ? undefined : showOfficeModal}
          onSave={handleSaveOffice}
          onClose={() => setShowOfficeModal(null)}
        />
      )}
      {deletingOfficeId != null && (
        <DeleteModal label="office location" onConfirm={handleDeleteOffice} onCancel={() => setDeletingOfficeId(null)} />
      )}
    </div>
  );
}

// ── Tab 2: Client Company Information ─────────────────────────────────────────
function CompanyInfoTab({ client, onRefresh, showToast }: {
  client: ClientDetail;
  onRefresh: () => void;
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showCompanyModal, setShowCompanyModal] = useState<'add' | CompanyDto | null>(null);
  const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);

  const toggleExpand = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSaveCompany = async (req: SaveCompanyRequest) => {
    try {
      await clientManagementApi.saveCompany(req);
      onRefresh();
      showToast('Company saved.');
    } catch { showToast('Failed to save company.', false); throw new Error(); }
  };

  const handleDeleteCompany = async () => {
    if (deletingCompanyId == null) return;
    await clientManagementApi.deleteCompany(deletingCompanyId);
    setDeletingCompanyId(null);
    onRefresh();
    showToast('Company deleted.');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button onClick={() => setShowCompanyModal('add')} style={btnPrimary}>+ Add Company</button>
      </div>

      {client.companies.length === 0 && (
        <div style={{ ...panel, textAlign: 'center', padding: '36px 0', color: '#6b7280', fontSize: 13 }}>
          No companies added yet.
        </div>
      )}

      {client.companies.map(co => (
        <div key={co.id} style={{ border: '1px solid #d8dee6', borderRadius: 4, marginBottom: 10, overflow: 'hidden', background: '#fff' }}>
          {/* Accordion header */}
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: expanded.has(co.id) ? '#eff6ff' : '#f6f8fb', cursor: 'pointer', borderBottom: expanded.has(co.id) ? '1px solid #d8dee6' : 'none' }}
            onClick={() => toggleExpand(co.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #93c5fd', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {expanded.has(co.id) ? '−' : '+'}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8' }}>{co.companyName}</span>
              <span style={{ fontSize: 11, color: '#6b7280', background: '#e5e7eb', padding: '2px 8px', borderRadius: 10 }}>{co.companyCode}</span>
              <span style={{ fontSize: 11, color: co.status === 'Active' ? '#16a34a' : '#6b7280', background: co.status === 'Active' ? '#dcfce7' : '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>{co.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowCompanyModal(co)} title="Edit" style={{ ...btnSecondary, height: 28, padding: '0 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <PencilIcon /> Edit
              </button>
              <button onClick={() => setDeletingCompanyId(co.id)} title="Delete" style={{ ...btnDanger, height: 28, padding: '0 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrashIcon /> Delete
              </button>
            </div>
          </div>

          {expanded.has(co.id) && (
            <div style={{ padding: 16 }}>
              {/* Company Primary Info (read-only view; edit via modal) */}
              <section style={panel}>
                <div style={{ height: 38, background: '#e3faef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', color: '#006b3c', borderRadius: 3, marginBottom: 14 }}>
                  <strong style={{ fontSize: 13 }}>Client Company ID — {co.companyCode}</strong>
                  <span style={{ fontSize: 11, color: '#374151' }}>Auto Generated</span>
                </div>
                <FieldGrid cols={3}>
                  <ReadField label="Company Name" value={co.companyName} />
                  <ReadField label="Status" value={co.status} />
                  <ReadField label="Domicile Country" value={co.domicileCountry} />
                  <ReadField label="State of Domicile" value={co.stateOfDomicile} />
                  <ReadField label="NAIC Code" value={co.naicCode} />
                  <ReadField label="Federal Tax ID" value={co.federalTaxId} />
                  <ReadField label="Email ID" value={co.emailId} />
                  <ReadField label="Telephone Number" value={co.telephoneNumber} />
                  <ReadField label="URL" value={co.url} />
                  <ReadField label="Business Description" value={co.businessDescription} />
                </FieldGrid>
              </section>

              {/* Addresses */}
              <section style={panel}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>Home Office / Legal Address</h2>
                <FieldGrid cols={3}>
                  <ReadField label="Address Line 1" value={co.legalAddress?.addressLine1} />
                  <ReadField label="Country" value={co.legalAddress?.country} />
                  <ReadField label="State" value={co.legalAddress?.state} />
                  <ReadField label="City" value={co.legalAddress?.city} />
                  <ReadField label="County" value={co.legalAddress?.county} />
                  <ReadField label="Zip Code" value={co.legalAddress?.zipCode} />
                </FieldGrid>
              </section>

              <section style={panel}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>Mailing Address</h2>
                <FieldGrid cols={3}>
                  <ReadField label="Address Line 1" value={co.mailingAddress?.addressLine1} />
                  <ReadField label="Country" value={co.mailingAddress?.country} />
                  <ReadField label="State" value={co.mailingAddress?.state} />
                  <ReadField label="City" value={co.mailingAddress?.city} />
                  <ReadField label="County" value={co.mailingAddress?.county} />
                  <ReadField label="Zip Code" value={co.mailingAddress?.zipCode} />
                </FieldGrid>
              </section>

              <section style={panel}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 14px' }}>Primary Contact</h2>
                <FieldGrid cols={3}>
                  <ReadField label="Name" value={co.primaryContact?.name} />
                  <ReadField label="Title" value={co.primaryContact?.title} />
                  <ReadField label="Email ID" value={co.primaryContact?.emailId} />
                  <ReadField label="Telephone Number" value={co.primaryContact?.telephoneNumber} />
                </FieldGrid>
              </section>
            </div>
          )}
        </div>
      ))}

      {showCompanyModal && (
        <CompanyModal
          company={showCompanyModal === 'add' ? undefined : showCompanyModal}
          onSave={handleSaveCompany}
          onClose={() => setShowCompanyModal(null)}
        />
      )}
      {deletingCompanyId != null && (
        <DeleteModal label="company" onConfirm={handleDeleteCompany} onCancel={() => setDeletingCompanyId(null)} />
      )}
    </div>
  );
}

// ── Tab 3: Client Company Products ────────────────────────────────────────────
function ProductsTab({ client }: { client: ClientDetail }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    client.companies.length > 0 ? client.companies[0].id : null
  );
  const [category, setCategory] = useState<'Personal' | 'Commercial' | 'Specialty'>('Personal');
  const [productAccess, setProductAccess] = useState<ProductAccessDto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductAccessDto | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [jurisdictionModal, setJurisdictionModal] = useState<ProductAccessDto | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async (companyId: number) => {
    const result = await clientManagementApi.getProductAccess(companyId);
    setProductAccess(result);
    setSelectedProduct(null);
  }, []);

  useEffect(() => {
    if (selectedCompanyId != null) loadProducts(selectedCompanyId);
  }, [selectedCompanyId, loadProducts]);

  const filtered = productAccess.filter(p => p.category === category);
  const selectedCompany = client.companies.find(c => c.id === selectedCompanyId);
  const totalLob = productAccess.filter(p => p.selectedSubProductCount > 0).length;
  const totalSub = productAccess.reduce((sum, p) => sum + p.selectedSubProductCount, 0);

  const toggleSubProduct = async (product: ProductAccessDto, subId: number, checked: boolean) => {
    if (!selectedCompanyId) return;
    const updatedIds = checked
      ? [...product.subProducts.filter(s => s.isSelected).map(s => s.id), subId]
      : product.subProducts.filter(s => s.isSelected && s.id !== subId).map(s => s.id);
    const req: SaveProductAccessRequest = { productId: product.productId, subProductIds: updatedIds, jurisdictions: product.jurisdictions };
    setSaving(true);
    try {
      await clientManagementApi.saveProductAccess(selectedCompanyId, req);
      await loadProducts(selectedCompanyId);
      setSelectedProduct(prev => prev?.productId === product.productId
        ? { ...product, subProducts: product.subProducts.map(s => ({ ...s, isSelected: updatedIds.includes(s.id) })), selectedSubProductCount: updatedIds.length }
        : prev);
    } finally { setSaving(false); }
  };

  const handleJurisdictionSave = async (jurisdictions: JurisdictionDto[]) => {
    if (!selectedCompanyId || !jurisdictionModal) return;
    const req: SaveProductAccessRequest = {
      productId: jurisdictionModal.productId,
      subProductIds: jurisdictionModal.subProducts.filter(s => s.isSelected).map(s => s.id),
      jurisdictions,
    };
    await clientManagementApi.saveProductAccess(selectedCompanyId, req);
    await loadProducts(selectedCompanyId);
  };

  return (
    <div style={{ display: 'flex', height: 560, border: '1px solid #d8dee6', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
      {/* Company list panel */}
      <div style={{ width: panelCollapsed ? 36 : 210, borderRight: '1px solid #d8dee6', transition: 'width 0.2s', flexShrink: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 42, borderBottom: '1px solid #d8dee6', display: 'flex', alignItems: 'center', justifyContent: panelCollapsed ? 'center' : 'space-between', padding: panelCollapsed ? '0 6px' : '0 12px', background: '#f6f8fb' }}>
          {!panelCollapsed && <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 0.5 }}>CLIENT COMPANIES</span>}
          <button onClick={() => setPanelCollapsed(!panelCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16, padding: 0 }}>
            {panelCollapsed ? '▶' : '◀'}
          </button>
        </div>
        {!panelCollapsed && (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {client.companies.length === 0 && <div style={{ padding: 14, color: '#9ca3af', fontSize: 12 }}>No companies</div>}
            {client.companies.map(co => (
              <div key={co.id} onClick={() => setSelectedCompanyId(co.id)}
                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', borderLeft: selectedCompanyId === co.id ? '3px solid #0B5AA0' : '3px solid transparent', background: selectedCompanyId === co.id ? '#eff6ff' : 'transparent' }}>
                <div style={{ fontSize: 13, fontWeight: selectedCompanyId === co.id ? 700 : 400, color: '#111827' }}>{co.companyName}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{co.companyCode}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOB panel */}
      <div style={{ width: 290, borderRight: '1px solid #d8dee6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {selectedCompany ? (
          <>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #d8dee6', background: '#f6f8fb' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{selectedCompany.companyName}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Line of Business & Product Access</div>
            </div>
            <div style={{ display: 'flex', borderBottom: '1px solid #d8dee6' }}>
              {(['Personal', 'Commercial', 'Specialty'] as const).map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setSelectedProduct(null); }}
                  style={{ flex: 1, height: 36, fontSize: 12, fontWeight: category === cat ? 700 : 400, border: 'none', borderBottom: category === cat ? '2px solid #0B5AA0' : '2px solid transparent', background: 'transparent', cursor: 'pointer', color: category === cat ? '#0B5AA0' : '#6b7280' }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.map(p => (
                <div key={p.productId} onClick={() => setSelectedProduct(p)}
                  style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', background: selectedProduct?.productId === p.productId ? '#eff6ff' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{p.productName}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Jurisdictions: {p.jurisdictionCount}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.selectedSubProductCount > 0 && (
                      <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 10, padding: '2px 7px', fontSize: 11, fontWeight: 700 }}>{p.selectedSubProductCount}</span>
                    )}
                    <div style={{ position: 'relative' }}>
                      <button onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === p.productId ? null : p.productId); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>⋮</button>
                      {menuOpen === p.productId && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid #d8dee6', borderRadius: 4, zIndex: 20, minWidth: 190, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <button onClick={e => { e.stopPropagation(); setJurisdictionModal(p); setMenuOpen(null); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#111827' }}>
                            Set State Jurisdiction
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: 20, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>No LOBs in this category</div>}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', fontSize: 13 }}>Select a company to view LOBs</div>
        )}
      </div>

      {/* Sub-products panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedProduct ? (
          <>
            <div style={{ height: 42, padding: '0 16px', borderBottom: '1px solid #d8dee6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f6f8fb' }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>{selectedProduct.productName} — Sub Products</span>
              {saving && <span style={{ fontSize: 12, color: '#6b7280' }}>Saving…</span>}
            </div>
            <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
              {selectedProduct.subProducts.map(sp => (
                <div key={sp.id} onClick={() => toggleSubProduct(selectedProduct, sp.id, !sp.isSelected)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 3, marginBottom: 6, cursor: 'pointer', background: sp.isSelected ? '#f0fdf4' : '#f6f8fb', border: `1px solid ${sp.isSelected ? '#86efac' : '#d8dee6'}` }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: sp.isSelected ? '#16a34a' : '#e5e7eb', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                    {sp.isSelected ? '✓' : ''}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: sp.isSelected ? 600 : 400, color: '#111827' }}>{sp.subProductName}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', fontSize: 13 }}>
            Select a Line of Business to view sub-products
          </div>
        )}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #d8dee6', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, fontSize: 13, background: '#f6f8fb' }}>
          <span style={{ color: '#374151' }}>LOBs selected: <strong>{totalLob}</strong></span>
          <span style={{ color: '#374151' }}>Sub-products selected: <strong>{totalSub}</strong></span>
        </div>
      </div>

      {jurisdictionModal && (
        <JurisdictionModal
          current={jurisdictionModal.jurisdictions}
          onSave={handleJurisdictionSave}
          onClose={() => setJurisdictionModal(null)}
        />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ClientManagementPage() {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'companies' | 'products'>('info');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setClient(await clientManagementApi.getMyDetail()); }
    catch { setError('Failed to load client profile.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { key: 'info' as const, label: 'Client Information' },
    { key: 'companies' as const, label: 'Client Company Information' },
    { key: 'products' as const, label: 'Client Company Products' },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>Loading client profile…</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{error}</div>;
  if (!client) return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontSize: 14 }}>No client data found.</div>;

  return (
    <div style={{ padding: '16px 20px 60px', background: '#fff', minHeight: '100%' }}>
      {/* Breadcrumb + title */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>Client Management / View Client</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>{client.companyName}</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 20, gap: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding: '9px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontWeight: activeTab === t.key ? 700 : 400, fontSize: 14,
              color: activeTab === t.key ? '#0B5AA0' : '#6b7280',
              borderBottom: activeTab === t.key ? '2px solid #0B5AA0' : '2px solid transparent',
              marginBottom: -2,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && <ClientInfoTab client={client} onRefresh={load} showToast={showToast} />}
      {activeTab === 'companies' && <CompanyInfoTab client={client} onRefresh={load} showToast={showToast} />}
      {activeTab === 'products' && <ProductsTab client={client} />}

      {/* Fixed footer with Back */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 52, background: '#fff', boxShadow: '0 -2px 8px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 28px', zIndex: 35 }}>
        <button onClick={() => window.history.back()} style={btnSecondary}>Back</button>
      </div>

      {toast && <Toast msg={toast.msg} ok={toast.ok} />}
    </div>
  );
}
