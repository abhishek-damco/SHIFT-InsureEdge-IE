// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Additional Office Locations: search strip, office cards and the Add/View/Edit pop-up (QA report §5.5/§5.6).
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';
import type { OfficeDto, SaveContactRequest, SaveOfficeRequest } from '../../types/ClientManagement';
import { AddressEditor, type AddressForm, toAddressForm } from './AddressEditor';
import {
  ConfirmModal, ContactListEditor, Field, Select, TextInput, toContactRequest, validateContactList,
} from './ClientFormFields';
import { CANADA, type Errors, OFFICE_TYPES, apiErrorMessage, pickErrors, validateAddress } from './validation';

type Mode = 'view' | 'edit';

interface OfficeForm {
  officeName: string;
  officeType: string;
  address: AddressForm;
  primary: SaveContactRequest;
  secondaries: SaveContactRequest[];
}

const toForm = (o?: OfficeDto): OfficeForm => ({
  officeName: o?.officeName ?? '',
  officeType: o?.officeType ?? '',
  address: toAddressForm(o ? { ...o, isManual: false } : null),
  primary: toContactRequest(o && {
    contactType: 'Primary', name: o.contactName, suffix: o.contactSuffix, title: o.contactTitle, emailId: o.contactEmail,
    telephoneNumber: o.contactPhone, telephoneNumberCc: o.contactPhoneCc, extension: o.contactExt,
    altTelephoneNumber: o.contactAltPhone, altTelephoneNumberCc: o.contactAltPhoneCc,
  }),
  secondaries: (o?.secondaryContacts ?? []).map(toContactRequest),
});

const toRequest = (id: number | undefined, f: OfficeForm): SaveOfficeRequest => ({
  id,
  officeName: f.officeName.trim(),
  officeType: f.officeType,
  addressLine1: f.address.addressLine1,
  addressLine2: f.address.addressLine2,
  country: f.address.country,
  state: f.address.state,
  city: f.address.city,
  county: f.address.country === CANADA ? '' : f.address.county,
  zipCode: f.address.zipCode,
  latitude: f.address.latitude,
  longitude: f.address.longitude,
  contactName: f.primary.name,
  contactSuffix: f.primary.suffix,
  contactTitle: f.primary.title,
  contactEmail: f.primary.emailId,
  contactPhone: f.primary.telephoneNumber,
  contactPhoneCc: f.primary.telephoneNumberCc,
  contactExt: f.primary.extension,
  contactAltPhone: f.primary.altTelephoneNumber,
  contactAltPhoneCc: f.primary.altTelephoneNumberCc,
  secondaryContacts: f.secondaries,
});

function validateOffice(f: OfficeForm): Errors {
  const e: Errors = {};
  if (!f.officeName.trim()) e.officeName = 'Provide Office Name to continue';
  if (!f.officeType) e.officeType = 'Provide Office Type to continue';
  for (const [k, v] of Object.entries(validateAddress(f.address))) e[`addr.${k}`] = v;
  Object.assign(e, validateContactList(f.primary, f.secondaries));
  return e;
}

export const formatAddress = (a: { addressLine1?: string; addressLine2?: string; city?: string; state?: string; zipCode?: string; country?: string }) =>
  [a.addressLine1, a.addressLine2, a.city, [a.state, a.zipCode].filter(Boolean).join(' '), a.country].filter(Boolean).join(', ');

// ── Pop-up ─────────────────────────────────────────────────────────────────────
function OfficeModal({ office, initialMode, onSave, onClose }: {
  office?: OfficeDto;
  initialMode: Mode;
  onSave: (req: SaveOfficeRequest) => Promise<void>;
  onClose: () => void;
}) {
  const initial = useMemo(() => toForm(office), [office]);
  const [form, setForm] = useState<OfficeForm>(initial);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const viewing = mode === 'view';
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  // Re-validate live once the user has tried to save, so errors clear as fields are fixed.
  const update = (next: OfficeForm) => { setForm(next); if (submitted) setErrors(validateOffice(next)); };
  const updateWith = (fn: (prev: OfficeForm) => OfficeForm) => setForm(prev => {
    const next = fn(prev);
    if (submitted) setErrors(validateOffice(next));
    return next;
  });

  const handleCancel = () => (dirty ? setConfirmCancel(true) : onClose());

  const handleSave = async () => {
    setSubmitted(true);
    const errs = validateOffice(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setServerError('');
    try { await onSave(toRequest(office?.id, form)); onClose(); }
    catch (err) { setServerError(apiErrorMessage(err, 'Failed to save. Please try again.')); }
    finally { setSaving(false); }
  };

  const title = viewing ? 'View Office Location' : office ? 'Edit Office Location' : 'Add Additional Office Location';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" className="cm-scope" style={{ background: '#fff', borderRadius: 6, padding: 24, width: 1040, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #d8dee6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h2>
          <button type="button" aria-label="Close" onClick={viewing ? onClose : handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20 }}>×</button>
        </div>
        {serverError && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 4, fontSize: 13, marginBottom: 14 }}>{serverError}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 28 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Office Address</div>
            <div className="fg2">
              <Field label="Office Name" required error={errors.officeName}>
                <TextInput value={form.officeName} onChange={v => update({ ...form, officeName: v })} maxLength={75} error={errors.officeName} disabled={viewing} />
              </Field>
              <Field label="Office Type" required error={errors.officeType}>
                <Select value={form.officeType} onChange={v => update({ ...form, officeType: v })} options={OFFICE_TYPES} error={errors.officeType} disabled={viewing} />
              </Field>
            </div>
            <AddressEditor value={form.address} disabled={viewing} errors={pickErrors('addr.', errors)}
              onChange={fn => updateWith(prev => ({ ...prev, address: fn(prev.address) }))} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginBottom: 14 }}>Office Contact Details</div>
            <ContactListEditor cols={2} disabled={viewing} errors={errors}
              primary={form.primary} secondaries={form.secondaries}
              onPrimaryChange={primary => update({ ...form, primary })}
              onSecondariesChange={secondaries => update({ ...form, secondaries })} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          {viewing ? (
            <>
              <button type="button" onClick={onClose} style={btnSecondary}>Close</button>
              <button type="button" onClick={() => setMode('edit')} style={btnPrimary}>Edit</button>
            </>
          ) : (
            <>
              <button type="button" onClick={handleCancel} style={btnSecondary} disabled={saving}>Cancel</button>
              <button type="button" onClick={handleSave} style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </>
          )}
        </div>
      </div>
      {confirmCancel && <ConfirmModal kind="cancel" onConfirm={onClose} onCancel={() => setConfirmCancel(false)} />}
    </div>
  );
}

// ── Cards ──────────────────────────────────────────────────────────────────────
const btnPrimary: CSSProperties = {
  height: 34, padding: '0 16px', background: '#0B5AA0', color: '#fff',
  border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const btnSecondary: CSSProperties = {
  height: 34, padding: '0 16px', background: '#fff', color: '#0B5AA0',
  border: '1px solid #d8dee6', borderRadius: 3, fontSize: 13, cursor: 'pointer',
};
const cardBase: CSSProperties = {
  border: '1px solid #d8dee6', borderRadius: 6, padding: 14, background: '#fff',
  minHeight: 210, display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s, box-shadow 0.15s',
};
const cardHover: CSSProperties = { borderColor: '#0B5AA0', boxShadow: '0 2px 8px rgba(11,90,160,0.12)' };

function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? (danger ? '#fee2e2' : '#eff6ff') : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', color: danger ? '#dc2626' : hover ? '#0B5AA0' : '#6b7280', padding: 6, display: 'flex' }}>
      {children}
    </button>
  );
}

function OfficeCard({ office, onView, onEdit, onDelete }: { office: OfficeDto; onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [hover, setHover] = useState(false);
  const initial = office.contactName?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div style={{ ...cardBase, ...(hover ? cardHover : {}) }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {office.officeType && (
        <span style={{ alignSelf: 'flex-start', background: '#dbeafe', color: '#1e40af', borderRadius: 10, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{office.officeType}</span>
      )}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 10 }}>{office.officeName}</div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#0B5AA0', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{initial}</span>
        <div style={{ minWidth: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: '#111827' }}>{office.contactName || '-'}</div>
          <div>{office.contactTitle || '-'}</div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{office.contactEmail || '-'}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>Address</div>
      <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.5, flex: 1 }}>{formatAddress(office) || '-'}</div>
      <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        <IconButton label="View" onClick={onView}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
        </IconButton>
        <IconButton label="Edit" onClick={onEdit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
        </IconButton>
        <IconButton label="Delete" onClick={onDelete} danger>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" /></svg>
        </IconButton>
      </div>
    </div>
  );
}

function AddLocationCard({ onAdd }: { onAdd: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ ...cardBase, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 12, ...(hover ? cardHover : {}) }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>Add New Location</div>
      <button type="button" onClick={onAdd} style={btnPrimary}>+ Add Office</button>
    </div>
  );
}

export function OfficeLocations({ offices, onSave, onDelete }: {
  offices: OfficeDto[];
  onSave: (req: SaveOfficeRequest) => Promise<void>;
  onDelete: (officeId: number) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ office?: OfficeDto; mode: Mode } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const q = search.trim().toLowerCase();
  const filtered = offices.filter(o => !q || [o.officeName, o.officeType, o.contactName, o.contactEmail, formatAddress(o)]
    .some(v => v?.toLowerCase().includes(q)));

  return (
    <section style={{ border: '1px solid #d8dee6', borderRadius: 4, background: '#fff', padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: 0 }}>Additional Office Locations</h2>
        <input className="fi" placeholder="Search..." aria-label="Search offices" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        <AddLocationCard onAdd={() => setModal({ mode: 'edit' })} />
        {filtered.map(o => (
          <OfficeCard key={o.id} office={o}
            onView={() => setModal({ office: o, mode: 'view' })}
            onEdit={() => setModal({ office: o, mode: 'edit' })}
            onDelete={() => setDeletingId(o.id!)} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0 4px', color: '#6b7280', fontSize: 13 }}>No Data Available</div>
      )}

      {modal && <OfficeModal office={modal.office} initialMode={modal.mode} onSave={onSave} onClose={() => setModal(null)} />}
      {deletingId !== null && (
        <ConfirmModal kind="delete"
          onConfirm={async () => { const id = deletingId; setDeletingId(null); await onDelete(id); }}
          onCancel={() => setDeletingId(null)} />
      )}
    </section>
  );
}
