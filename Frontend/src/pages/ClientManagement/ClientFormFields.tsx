// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Form atoms shared by the Client Information tab and the Office pop-up.
import React, { useEffect, useRef, useState } from 'react';
import DatePicker from '../../components/ui/DatePicker';
import PhoneCountrySelect, { PHONE_COUNTRY_CA, PHONE_COUNTRY_US } from '../../components/ui/PhoneCountrySelect';
import SearchableSelect from '../../components/ui/SearchableSelect';
import type { ContactDto, SaveContactRequest } from '../../types/ClientManagement';
import {
  type Errors, digitsOnly, formatPhone, isContactEmpty, normalizeNorthAmericanPhone, pickErrors, validateContact,
} from './validation';

// ── Field shell ────────────────────────────────────────────────────────────────
export function ErrorText({ message }: { message?: string }) {
  return message ? <span className="ferr"><span className="ferr__ico">⊘</span>{message}</span> : null;
}

export function Field({ label, required, error, children, style }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div className="fc" style={style}>
      <label className={required ? 'fl' : 'fl-plain'}>{required && <span className="req">* </span>}{label}</label>
      {children}
      <ErrorText message={error} />
    </div>
  );
}

const inputClass = (error?: string, disabled?: boolean) =>
  `fi${error ? ' fi--err' : ''}${disabled ? ' fi--disabled' : ''}`;

export function TextInput({ value, onChange, error, disabled, maxLength, placeholder, textarea, readOnly }: {
  value?: string | number | null; onChange: (v: string) => void; error?: string; disabled?: boolean;
  maxLength?: number; placeholder?: string; textarea?: boolean; readOnly?: boolean;
}) {
  const common = {
    className: inputClass(error, disabled || readOnly),
    value: value ?? '',
    disabled,
    readOnly,
    maxLength,
    placeholder,
    style: { width: '100%', boxSizing: 'border-box' as const },
  };
  return textarea
    ? <textarea {...common} rows={3} style={{ ...common.style, height: 'auto', resize: 'vertical' }} onChange={e => onChange(e.target.value)} />
    : <input {...common} onChange={e => onChange(e.target.value)} />;
}

export function YearPicker({ value, onChange, error, disabled }: {
  value?: string; onChange: (value: string) => void; error?: string; disabled?: boolean;
}) {
  return <DatePicker mode="year" value={value ?? ''} onChange={onChange} hasError={Boolean(error)} disabled={disabled} placeholder="####" />;
}

export function Select({ value, onChange, options, disabled, error }: {
  value?: string; onChange: (v: string) => void; options: readonly string[]; disabled?: boolean; error?: string;
}) {
  const opts = options.map(o => ({ value: o, label: o }));
  return (
    <div className={error ? 'ph-wrap--err' : undefined} style={error ? { border: '1px solid', borderRadius: 4 } : undefined}>
      <SearchableSelect value={value ?? ''} onChange={onChange} options={opts} placeholder="Select..." clearable disabled={disabled} />
    </div>
  );
}

// Multi-select with search; value is stored comma-separated (client.state_allowed_to_operate).
export function MultiSelect({ value, onChange, options, disabled }: {
  value?: string; onChange: (v: string) => void; options: readonly string[]; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = new Set((value ?? '').split(',').map(s => s.trim()).filter(Boolean));
  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const toggle = (o: string) => {
    const next = new Set(selected);
    if (next.has(o)) next.delete(o); else next.add(o);
    onChange(options.filter(x => next.has(x)).join(', '));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="fi" disabled={disabled} onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: disabled ? undefined : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: disabled ? 'default' : 'pointer' }}>
        {selected.size ? `${selected.size} selected — ${[...selected].join(', ')}` : <span style={{ color: '#9ca3af' }}>Select...</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', zIndex: 50, top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d1d5db', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 2 }}>
          <input className="fi" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: 'calc(100% - 12px)', margin: 6, boxSizing: 'border-box' }} autoFocus />
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.map(o => (
              <label key={o} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 10px', fontSize: 13, cursor: 'pointer', background: selected.has(o) ? '#eff6ff' : undefined }}>
                <input type="checkbox" checked={selected.has(o)} onChange={() => toggle(o)} style={{ accentColor: '#0B5AA0' }} /> {o}
              </label>
            ))}
            {filtered.length === 0 && <div style={{ padding: 10, fontSize: 12, color: '#9ca3af' }}>No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Phone with US/Canada flag. Both are +1; the stored code distinguishes them ('+1' = US for legacy rows).
export const PHONE_CC_US = '+1';
export const PHONE_CC_CA = 'CA +1';
export const formatPhoneWithFlag = (phone?: string | null, cc?: string | null) =>
  phone ? `+1 ${formatPhone(phone)}` : undefined;

export function PhoneInput({ value, cc, onChange, onCcChange, error, disabled }: {
  value?: string; cc?: string; onChange: (v: string) => void; onCcChange: (cc: string) => void; error?: string; disabled?: boolean;
}) {
  const selectedCc = cc === PHONE_CC_CA ? PHONE_CC_CA : PHONE_CC_US;

  return (
    <div className={`ph-wrap${error ? ' ph-wrap--err' : ''}`}>
      <PhoneCountrySelect disabled={disabled}
        value={selectedCc === PHONE_CC_CA ? PHONE_COUNTRY_CA : PHONE_COUNTRY_US}
        onChange={country => onCcChange(country === PHONE_COUNTRY_CA ? PHONE_CC_CA : PHONE_CC_US)} />
      <input className={`ph-input fi${disabled ? ' fi--disabled' : ''}`} type="tel" value={formatPhone(value)} disabled={disabled}
        placeholder="(###) ###-####" maxLength={14} style={{ flex: 1, minWidth: 0 }}
        onChange={e => onChange(normalizeNorthAmericanPhone(e.target.value).slice(0, 10))} />
    </div>
  );
}

export function ExtensionInput({ value, onChange, error, disabled }: {
  value?: number | null; onChange: (v: number | undefined) => void; error?: string; disabled?: boolean;
}) {
  return (
    <TextInput value={value ?? ''} error={error} disabled={disabled} maxLength={6} placeholder="######"
      onChange={v => { const d = digitsOnly(v, 6); onChange(d ? Number(d) : undefined); }} />
  );
}

// ── Confirmation modals (QA report §2 standard wording) ───────────────────────
export function ConfirmModal({ kind, onConfirm, onCancel }: {
  kind: 'delete' | 'cancel'; onConfirm: () => void; onCancel: () => void;
}) {
  const text = kind === 'delete'
    ? 'Are you sure you want to delete this? This Action cannot be undone. Please confirm if you want to proceed.'
    : 'Are you sure you want to cancel this? Please confirm if you want to cancel your current transactions. As your data is not saved.';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 8, padding: 28, width: 420, textAlign: 'center', border: '1px solid #d8dee6' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: '#111827' }}>{kind === 'delete' ? 'Delete' : 'Cancel'}</div>
        <div style={{ color: '#4b5563', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>{text}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" onClick={onCancel} style={{ height: 34, padding: '0 16px', background: '#fff', color: '#0B5AA0', border: '1px solid #d8dee6', borderRadius: 3, fontSize: 13, cursor: 'pointer' }}>No, Keep It</button>
          <button type="button" onClick={onConfirm} style={{ height: 34, padding: '0 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 3, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {kind === 'delete' ? 'Yes, Delete It' : 'Yes, Cancel It'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contacts ───────────────────────────────────────────────────────────────────
export const emptyContact = (): SaveContactRequest => ({
  name: '', suffix: '', title: '', emailId: '', telephoneNumber: '', telephoneNumberCc: PHONE_CC_US, altTelephoneNumber: '', altTelephoneNumberCc: PHONE_CC_US,
});

export const toContactRequest = (c?: ContactDto | null): SaveContactRequest => ({
  name: c?.name ?? '', suffix: c?.suffix ?? '', title: c?.title ?? '', emailId: c?.emailId ?? '',
  telephoneNumber: c?.telephoneNumber ?? '', telephoneNumberCc: c?.telephoneNumberCc ?? PHONE_CC_US,
  extension: c?.extension ?? undefined,
  altTelephoneNumber: c?.altTelephoneNumber ?? '', altTelephoneNumberCc: c?.altTelephoneNumberCc ?? PHONE_CC_US,
});

export function ContactFields({ value, onChange, errors = {}, disabled, cols = 3 }: {
  value: SaveContactRequest; onChange: (v: SaveContactRequest) => void; errors?: Errors; disabled?: boolean; cols?: 2 | 3;
}) {
  const up = <K extends keyof SaveContactRequest>(k: K, v: SaveContactRequest[K]) => onChange({ ...value, [k]: v });
  return (
    <div className={cols === 3 ? 'fg3' : 'fg2'}>
      <Field label="Name" required error={errors.name}>
        <TextInput value={value.name} onChange={v => up('name', v.replace(/^ +/, ''))} maxLength={50} error={errors.name} disabled={disabled} />
      </Field>
      <Field label="Suffix" error={errors.suffix}>
        <TextInput value={value.suffix} onChange={v => up('suffix', v)} maxLength={4} error={errors.suffix} disabled={disabled} />
      </Field>
      <Field label="Title" required error={errors.title}>
        <TextInput value={value.title} onChange={v => up('title', v)} maxLength={50} error={errors.title} disabled={disabled} />
      </Field>
      <Field label="Email ID" required error={errors.emailId}>
        <TextInput value={value.emailId} onChange={v => up('emailId', v)} maxLength={50} error={errors.emailId} disabled={disabled} />
      </Field>
      <Field label="Telephone" error={errors.telephoneNumber}>
        <PhoneInput value={value.telephoneNumber} cc={value.telephoneNumberCc} disabled={disabled} error={errors.telephoneNumber}
          onChange={v => up('telephoneNumber', v)} onCcChange={v => up('telephoneNumberCc', v)} />
      </Field>
      <Field label="Extension" error={errors.extension}>
        <ExtensionInput value={value.extension} onChange={v => up('extension', v)} error={errors.extension} disabled={disabled} />
      </Field>
      <Field label="Alternative Telephone" error={errors.altTelephoneNumber}>
        <PhoneInput value={value.altTelephoneNumber} cc={value.altTelephoneNumberCc} disabled={disabled} error={errors.altTelephoneNumber}
          onChange={v => up('altTelephoneNumber', v)} onCcChange={v => up('altTelephoneNumberCc', v)} />
      </Field>
    </div>
  );
}

// Validates primary + secondaries; keys are "primary.<field>" and "secondary.<i>.<field>".
export function validateContactList(primary: SaveContactRequest, secondaries: SaveContactRequest[]): Errors {
  const e: Errors = {};
  for (const [k, v] of Object.entries(validateContact(primary))) e[`primary.${k}`] = v;
  secondaries.forEach((s, i) => {
    for (const [k, v] of Object.entries(validateContact(s))) e[`secondary.${i}.${k}`] = v;
  });
  return e;
}

export function ContactListEditor({ primary, secondaries, onPrimaryChange, onSecondariesChange, errors = {}, disabled, cols = 3 }: {
  primary: SaveContactRequest;
  secondaries: SaveContactRequest[];
  onPrimaryChange: (c: SaveContactRequest) => void;
  onSecondariesChange: (list: SaveContactRequest[]) => void;
  errors?: Errors;
  disabled?: boolean;
  cols?: 2 | 3;
}) {
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  // Add Contact unlocks once every mandatory Primary Contact field is filled in validly.
  const canAdd = !disabled && Object.keys(validateContact(primary)).length === 0;

  const remove = (i: number) => onSecondariesChange(secondaries.filter((_, j) => j !== i));
  const requestRemove = (i: number) => (isContactEmpty(secondaries[i]) ? remove(i) : setConfirmIndex(i));

  return (
    <>
      <div className="contact-name" style={{ marginBottom: 12 }}>Primary Contact</div>
      <ContactFields value={primary} onChange={onPrimaryChange} errors={pickErrors('primary.', errors)} disabled={disabled} cols={cols} />

      {secondaries.map((s, i) => (
        <div key={i} className="contact-blk">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="contact-name">Secondary Contact {i + 1}</span>
            {!disabled && (
              <button type="button" className="contact-del" title="Delete" aria-label={`Delete Secondary Contact ${i + 1}`} onClick={() => requestRemove(i)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" /></svg>
              </button>
            )}
          </div>
          <ContactFields value={s} disabled={disabled} cols={cols} errors={pickErrors(`secondary.${i}.`, errors)}
            onChange={c => onSecondariesChange(secondaries.map((x, j) => (j === i ? c : x)))} />
        </div>
      ))}

      {!disabled && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn-add-contacts" disabled={!canAdd}
            title={canAdd ? undefined : 'Fill in the Primary Contact first'}
            onClick={() => onSecondariesChange([...secondaries, emptyContact()])}
            style={{ height: 32, padding: '0 14px', borderRadius: 3, fontSize: 13, cursor: canAdd ? 'pointer' : 'not-allowed', opacity: canAdd ? 1 : 0.5 }}>
            + Add Contact
          </button>
        </div>
      )}

      {confirmIndex !== null && (
        <ConfirmModal kind="delete"
          onConfirm={() => { remove(confirmIndex); setConfirmIndex(null); }}
          onCancel={() => setConfirmIndex(null)} />
      )}
    </>
  );
}
