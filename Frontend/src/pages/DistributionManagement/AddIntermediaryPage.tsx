import React, { useState, useRef, useEffect } from 'react';
import { distributionApi as api } from '../../api/distribution';

const WIZARD_STEPS = [
  { n: 1, l1: 'Add',    l2: 'Intermediary Details' },
  { n: 2, l1: 'Assign', l2: 'Rights'               },
  { n: 3, l1: 'Assign', l2: 'Products'             },
  { n: 4, l1: 'Add',    l2: 'Producers'            },
  { n: 5, l1: 'Review', l2: 'and Submit'           },
];

const LEGAL_ENTITY_OPTS = ['Corporation', 'Limited Liability Company', 'Partnership', 'Sole Proprietorship'];
const INTERMEDIARY_TYPE_OPTS = ['MGA', 'Broker', 'Carrier', 'Agency', 'Brokerage', 'Other'];
const COUNTRY_OPTS = ['United States', 'Canada', 'United Kingdom'];
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

interface Contact {
  id: string; persistedId?: number; isAlsoProducer: boolean;
  name: string; title: string; email: string;
  phone: string; extension: string; altPhone: string;
}

interface NRState { id: string; persistedId?: number; state: string; license: string; }

interface Form {
  status: boolean; allowFPV: boolean;
  name: string; dba: string; legalEntity: string; federalTaxId: string;
  intermediaryType: string; country: string; residentState: string; licenseNumber: string;
  googleSearch: string; enterManually: boolean;
  addrLine1: string; addrLine2: string; addrCountry: string; addrState: string;
  city: string; county: string; zipCode: string; latitude: string; longitude: string;
  businessName: string; disbursementEmail: string;
  addressId?: number;
}

const EMPTY_FORM: Form = {
  status: false, allowFPV: true,
  name: '', dba: '', legalEntity: '', federalTaxId: '', intermediaryType: '',
  country: '', residentState: '', licenseNumber: '',
  googleSearch: '', enterManually: false,
  addrLine1: '', addrLine2: '', addrCountry: 'United States', addrState: '',
  city: '', county: '', zipCode: '', latitude: '', longitude: '',
  businessName: '', disbursementEmail: '',
};

function normalizeCountry(value: string | null | undefined): string {
  if (!value) return '';
  const v = String(value).trim();
  if (/^(usa|us|u\.s\.|united states of america)$/i.test(v)) return 'United States';
  return v;
}

function uniqueOptions(options: string[], current: string): string[] {
  return current && !options.includes(current) ? [current, ...options] : options;
}

async function loadIntermediaryStep1(id: number) {
  const [details, address, contacts, nrStates] = await Promise.all([
    api.intermediaries.get(id).catch(() => null),
    api.address.get(id).catch(() => null),
    api.contacts.list(id).catch(() => []),
    api.nrStates.list(id).catch(() => []),
  ]);

  const form: Form = {
    ...EMPTY_FORM,
    status: (details?.status ?? 'Active') !== 'Inactive',
    allowFPV: details?.allow_full_producer_visibility ?? true,
    name: details?.intermediary_name ?? '',
    dba: details?.doing_business_as ?? '',
    legalEntity: details?.legal_entity ?? '',
    federalTaxId: details?.federal_tax_id ?? '',
    intermediaryType: details?.type_of_intermediary ?? '',
    country: normalizeCountry(details?.country),
    residentState: details?.residential_state ?? '',
    licenseNumber: details?.license ?? '',
    addrLine1: address?.address_line1 ?? '',
    addrLine2: address?.address_line2 ?? '',
    addrCountry: normalizeCountry(address?.country) || 'United States',
    addrState: address?.state ?? '',
    city: address?.city ?? '',
    county: address?.county ?? '',
    zipCode: address?.zip_code ?? '',
    latitude: address?.latitude == null ? '' : String(address.latitude),
    longitude: address?.longitude == null ? '' : String(address.longitude),
    addressId: address?.id,
    businessName: details?.commission_disburse_business_name ?? details?.intermediary_name ?? '',
    disbursementEmail: details?.commission_disburse_email ?? '',
  };

  const mappedContacts: Contact[] = (contacts as any[])
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
    .map((c, index) => ({
      id: String(c.id ?? index + 1),
      isAlsoProducer: c.is_also_producer ?? false,
      name: c.name ?? '',
      title: c.title ?? '',
      email: c.email_id ?? '',
      phone: c.telephone_number ?? '',
      extension: c.extension ?? '',
      altPhone: c.alt_telephone_no ?? '',
    }));

  const mappedNrStates: NRState[] = (nrStates as any[]).map((nr, index) => ({
    id: String(nr.id ?? index + 1),
    state: nr.state ?? '',
    license: nr.license ?? '',
  }));

  return {
    form,
    contacts: mappedContacts.length > 0 ? mappedContacts : [{ id: '1', isAlsoProducer: false, name: '', title: '', email: '', phone: '', extension: '', altPhone: '' }],
    nrStates: mappedNrStates,
  };
}
function formatEIN(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '-' + digits.slice(2);
}

function formatUSPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  if (digits.length <= 3)  return `(${digits}`;
  if (digits.length <= 6)  return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function blockNonDigit(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="wi-toggle" onClick={() => onChange(!checked)}>
      <span className={`wi-toggle__track${checked ? ' wi-toggle__track--on' : ''}`}>
        <span className="wi-toggle__thumb" />
      </span>
    </label>
  );
}

function ClearSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string;
}) {
  return (
    <div className="cs-wrap">
      <select className="cs-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {value && <button className="cs-clear" type="button" onClick={() => onChange('')}>×</button>}
      <span className="cs-arrow">▼</span>
    </div>
  );
}

function PhoneField({ value, onChange, hasError }: {
  value: string; onChange: (v: string) => void; hasError?: boolean;
}) {
  return (
    <div className={`ph-wrap${hasError ? ' ph-wrap--err' : ''}`}>
      <button className="ph-flag" type="button">🇺🇸 <span className="ph-flag__arrow">▼</span></button>
      <input className="ph-input" type="tel" value={value}
        onChange={e => onChange(formatUSPhone(e.target.value))}
        onKeyDown={blockNonDigit}
        placeholder="(###) ###-####"
        maxLength={14} />
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="ferr"><span className="ferr__ico">⊘</span>{msg}</span>;
}

export default function AddIntermediaryPage({ onBack, onNext }: { onBack: () => void; onNext?: () => void }) {
  const [editId, setEditId] = useState<number | null>(null);

  const [form, setForm] = useState<Form>(EMPTY_FORM);

  const [contacts, setContacts] = useState<Contact[]>([
    { id: '1', isAlsoProducer: false, name: '', title: '', email: '', phone: '', extension: '', altPhone: '' },
  ]);
  const [nrStates, setNrStates] = useState<NRState[]>([]);
  const [nrSearch, setNrSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCancel, setShowCancel] = useState(false);
  const [showAddState, setShowAddState] = useState(false);
  const [modalNR, setModalNR] = useState({ state: '', license: '' });
  const [modalErr, setModalErr] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoErr, setLogoErr] = useState('');
  const [toast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const sf = (k: keyof Form, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    let cancelled = false;

    const applyStep = (step: { form?: Form; contacts?: Contact[]; nrStates?: NRState[] }) => {
      if (cancelled) return;
      if (step.form) setForm(step.form);
      if (step.contacts && step.contacts.length > 0) setContacts(step.contacts);
      if (step.nrStates) setNrStates(step.nrStates);
    };

    try {
      const rawEditId = sessionStorage.getItem('shift_edit_id');
      const parsedEditId = rawEditId ? Number(rawEditId) : null;
      if (parsedEditId && Number.isFinite(parsedEditId)) setEditId(parsedEditId);

      const saved = sessionStorage.getItem('shift_step1');
      if (saved) {
        applyStep(JSON.parse(saved));
        return () => { cancelled = true; };
      }

      if (parsedEditId && Number.isFinite(parsedEditId)) {
        loadIntermediaryStep1(parsedEditId)
          .then(step => {
            if (cancelled) return;
            applyStep(step);
            sessionStorage.setItem('shift_step1', JSON.stringify(step));
          })
          .catch(() => undefined);
      }
    } catch { /* ignore */ }

    return () => { cancelled = true; };
  }, []);

  const handleFile = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type)) {
      setLogoErr('Invalid file format. Only PNG, JPEG, and GIF are supported.'); setLogo(null); return;
    }
    if (file.size < 10240) { setLogoErr('File is too small. Minimum size is 10 KB.'); setLogo(null); return; }
    if (file.size > 10485760) { setLogoErr('File is too large. Maximum size is 10 MB.'); setLogo(null); return; }
    setLogoErr(''); setLogo(file); setLogoUrl(URL.createObjectURL(file));
  };

  const updContact = (id: string, k: keyof Contact, v: unknown) =>
    setContacts(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));

  const addContact = () => setContacts(p => [
    ...p,
    { id: String(Date.now()), isAlsoProducer: false, name: '', title: '', email: '', phone: '', extension: '', altPhone: '' },
  ]);

  const displayId = editId ? String(editId).padStart(5, '0') : '00062';
  const pageVerb = editId ? 'Edit' : 'Add';

  const filteredNR = nrStates.filter(s =>
    s.state.toLowerCase().includes(nrSearch.toLowerCase()) ||
    s.license.toLowerCase().includes(nrSearch.toLowerCase())
  );

  const saveExistingStep1 = async (id: number) => {
    await api.intermediaries.update(id, {
      intermediary_name: form.name,
      doing_business_as: form.dba || null,
      legal_entity: form.legalEntity,
      federal_tax_id: form.federalTaxId,
      type_of_intermediary: form.intermediaryType,
      country: form.country,
      residential_state: form.residentState,
      license: form.licenseNumber,
      allow_full_producer_visibility: form.allowFPV,
      commission_disburse_business_name: form.businessName,
      commission_disburse_email: form.disbursementEmail,
      status: form.status ? 'Active' : 'Inactive',
      status_toggle: form.status,
    });

    const addressPayload = {
      address_line1: form.addrLine1,
      address_line2: form.addrLine2 || null,
      country: form.addrCountry,
      state: form.addrState,
      city: form.city,
      county: form.county,
      zip_code: form.zipCode,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
    };
    if (form.addressId) await api.address.update(id, form.addressId, addressPayload);
    else {
      const created = await api.address.create(id, addressPayload);
      setForm(prev => ({ ...prev, addressId: created?.id }));
    }

    await Promise.all(contacts.map((contact, index) => {
      const payload = {
        name: contact.name,
        title: contact.title,
        email_id: contact.email,
        telephone_number: contact.phone,
        extension: contact.extension || null,
        alt_telephone_no: contact.altPhone || null,
        is_primary: index === 0,
        is_also_producer: contact.isAlsoProducer,
      };
      return contact.persistedId
        ? api.contacts.update(id, contact.persistedId, payload)
        : api.contacts.create(id, payload);
    }));

    await Promise.all(nrStates.map(nr => {
      const payload = { state: nr.state, license: nr.license, is_available_in_search: false };
      return nr.persistedId
        ? api.nrStates.update(id, nr.persistedId, payload)
        : api.nrStates.create(id, payload);
    }));
  };
  const validate = () => {
    const e: Record<string, string> = {};
    const req = (k: string, v: string) => { if (!v.trim()) e[k] = 'This field is required.'; };
    req('name', form.name); req('legalEntity', form.legalEntity);
    if (!form.federalTaxId.trim()) e['federalTaxId'] = 'This field is required.';
    else if (!/^\d{2}-\d{7}$/.test(form.federalTaxId)) e['federalTaxId'] = 'Federal Tax ID format must be ##-#######.';
    req('intermediaryType', form.intermediaryType); req('country', form.country);
    req('residentState', form.residentState); req('licenseNumber', form.licenseNumber);
    req('addrLine1', form.addrLine1); req('addrCountry', form.addrCountry);
    req('addrState', form.addrState); req('city', form.city);
    req('county', form.county); req('zipCode', form.zipCode);
    contacts.forEach((c, i) => {
      const p = `c${i}`;
      if (!c.name.trim())  e[`${p}_name`]  = 'Provide Name to continue';
      if (!c.title.trim()) e[`${p}_title`] = 'Provide Title to continue';
      if (!c.email.trim()) e[`${p}_email`] = 'Provide Email ID to continue';
      if (!c.phone.trim()) e[`${p}_phone`] = 'Provide Telephone Number to continue';
    });
    req('businessName', form.businessName); req('disbursementEmail', form.disbursementEmail);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCancel = () => {
    const isDirty =
      form.name !== '' || form.dba !== '' || form.legalEntity !== '' ||
      form.federalTaxId !== '' || form.intermediaryType !== '' ||
      form.country !== '' || form.residentState !== '' || form.licenseNumber !== '' ||
      form.googleSearch !== '' || form.addrLine1 !== '' || form.addrLine2 !== '' ||
      form.addrState !== '' || form.city !== '' || form.county !== '' ||
      form.zipCode !== '' || form.businessName !== '' || form.disbursementEmail !== '' ||
      logo !== null || nrStates.length > 0 ||
      contacts.some(c => c.name !== '' || c.title !== '' || c.email !== '' || c.phone !== '');
    if (isDirty) setShowCancel(true);
    else onBack();
  };

  const handleSaveNext = async () => {
    if (!validate()) return;
    try {
      if (editId) await saveExistingStep1(editId);
      sessionStorage.setItem('shift_step1', JSON.stringify({ form, contacts, nrStates }));
      onNext?.();
    } catch (err: any) {
      alert(err?.message ?? 'Failed to save intermediary details.');
    }
  };

  const handleAddStateSave = () => {
    const me: Record<string, string> = {};
    if (!modalNR.state) me['state'] = 'State is required.';
    if (!modalNR.license.trim()) me['license'] = 'License Number is required.';
    if (modalNR.state && nrStates.some(s => s.state === modalNR.state)) me['state'] = 'This state is already added.';
    setModalErr(me);
    if (Object.keys(me).length) return;
    setNrStates(p => [...p, { id: String(Date.now()), ...modalNR }]);
    setModalNR({ state: '', license: '' }); setModalErr({}); setShowAddState(false);
  };

  const closeAddState = () => { setShowAddState(false); setModalNR({ state: '', license: '' }); setModalErr({}); };

  return (
    <>
      {toast && <div className="toast" role="alert">{toast}</div>}

      {/* Scrollable main */}
      <main className="app-page distribution-form-page" ref={mainRef}>

        {/* Page head */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{pageVerb} Intermediary</h1>
            <p className="distribution-breadcrumb">
              <span className="distribution-breadcrumb__link" onClick={onBack}>Distribution Management</span>
              {' / '}
              <span>{pageVerb} Intermediary</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" type="button" onClick={handleCancel}>Cancel</button>
            <button className="btn-primary" type="button" onClick={handleSaveNext}>Save &amp; Next</button>
          </div>
        </div>

        {/* Wizard bar */}
        <div className="distribution-stepper">
          {WIZARD_STEPS.map((step, idx) => (
            <div key={step.n} className="wiz-item">
              <div className="wiz-step">
                <div className={`wiz-circle${step.n === 1 ? ' wiz-circle--active' : ''}`}>{step.n}</div>
                <div className={`wiz-lbl${step.n === 1 ? ' wiz-lbl--active' : ''}`}>
                  <span>{step.l1}</span><span>{step.l2}</span>
                </div>
              </div>
              {idx < WIZARD_STEPS.length - 1 && <div className="wiz-connector" />}
            </div>
          ))}
        </div>

        {/* Two-column cards */}
        <div className="app-section-grid distribution-form-grid">

          {/* ── LEFT CARD ── */}
          <div className="card distribution-form-card">
            <h2 className="wi-sec-title">Intermediary Details</h2>

            {/* ID Banner */}
            <div className="id-banner">
              <span className="id-banner__text">Intermediary ID -{displayId}</span>
              <span className="id-banner__tag">Auto Generated</span>
            </div>

            {/* Toggles */}
            <div className="toggle-row">
              <div className="toggle-grp">
                <span className="toggle-lbl">Status :</span>
                <Toggle checked={form.status} onChange={v => sf('status', v)} />
              </div>
              <div className="toggle-grp">
                <span className="toggle-lbl">Allow Full Producer Visibility</span>
                <Toggle checked={form.allowFPV} onChange={v => sf('allowFPV', v)} />
              </div>
            </div>

            {/* Logo */}
            <div className="logo-sec">
              <p className="logo-sec__lbl">Upload Logo</p>
              <div className="logo-zone"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => !logo && fileRef.current?.click()}>
                {logo ? (
                  <div className="logo-preview">
                    <img src={logoUrl!} alt="Logo" className="logo-preview__img" />
                    <div className="logo-preview__btns">
                      <button className="btn-txt" type="button"
                        onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Replace File</button>
                      <button className="btn-txt btn-txt--red" type="button"
                        onClick={e => { e.stopPropagation(); setLogo(null); setLogoUrl(null); }}>Remove File</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="logo-zone__title">Drag and Drop File Here or Select a File</p>
                    <p className="logo-zone__hint">Supported formats are PNG, JPEG &amp; GIF.</p>
                    <p className="logo-zone__hint">File size : 10 KB-10 MB</p>
                    <button className="btn-browse" type="button"
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>⊕ Browse File</button>
                  </>
                )}
              </div>
              {logoErr && <Err msg={logoErr} />}
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.gif" className="hidden-file"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Name + DBA */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Name</label>
                <input className={`fi${errors.name ? ' fi--err' : ''}`}
                  value={form.name} onChange={e => sf('name', e.target.value)} />
                <Err msg={errors.name} />
              </div>
              <div className="fc">
                <label className="fl">Doing Business As</label>
                <input className="fi" value={form.dba} onChange={e => sf('dba', e.target.value)} />
              </div>
            </div>

            {/* Legal Entity + Federal Tax ID */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Legal Entity</label>
                <div className="sw">
                  <select className={`fs${errors.legalEntity ? ' fi--err' : ''}`}
                    value={form.legalEntity} onChange={e => sf('legalEntity', e.target.value)}>
                    <option value="">Select...</option>
                    {uniqueOptions(LEGAL_ENTITY_OPTS, form.legalEntity).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="sw__arr">▼</span>
                </div>
                <Err msg={errors.legalEntity} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> Federal Tax ID</label>
                <input className={`fi${errors.federalTaxId ? ' fi--err' : ''}`}
                  value={form.federalTaxId} onChange={e => sf('federalTaxId', formatEIN(e.target.value))}
                  onKeyDown={blockNonDigit}
                  placeholder="12-3456789"
                  maxLength={10} />
                <Err msg={errors.federalTaxId} />
              </div>
            </div>

            {/* Type + Country */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Type of Intermediary</label>
                <div className="sw">
                  <select className={`fs${errors.intermediaryType ? ' fi--err' : ''}`}
                    value={form.intermediaryType} onChange={e => sf('intermediaryType', e.target.value)}>
                    <option value="">Select...</option>
                    {uniqueOptions(INTERMEDIARY_TYPE_OPTS, form.intermediaryType).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <span className="sw__arr">▼</span>
                </div>
                <Err msg={errors.intermediaryType} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> Country</label>
                <ClearSelect value={form.country} onChange={v => sf('country', v)} options={uniqueOptions(COUNTRY_OPTS, form.country)} />
                <Err msg={errors.country} />
              </div>
            </div>

            {/* Resident State + License */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Resident State</label>
                <div className="sw">
                  <select className={`fs${errors.residentState ? ' fi--err' : ''}`}
                    value={form.residentState} onChange={e => sf('residentState', e.target.value)}>
                    <option value="">Select...</option>
                    {uniqueOptions(US_STATES, form.residentState).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="sw__arr">▼</span>
                </div>
                <Err msg={errors.residentState} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> License</label>
                <input className={`fi${errors.licenseNumber ? ' fi--err' : ''}`}
                  value={form.licenseNumber} onChange={e => sf('licenseNumber', e.target.value)}
                  maxLength={10} />
                <Err msg={errors.licenseNumber} />
              </div>
            </div>
          </div>

          {/* ── RIGHT CARD ── */}
          <div className="card distribution-form-card">
            <h2 className="wi-sec-title">Home Office / Legal Address</h2>

            {/* Google search */}
            <div className="fc fg-mb">
              <label className="fl-plain">Google Address Search</label>
              <input className="fi" value={form.googleSearch}
                onChange={e => sf('googleSearch', e.target.value)} />
            </div>

            {/* Enter manually checkbox */}
            <label className="manual-chk">
              <input type="checkbox" checked={form.enterManually}
                onChange={e => sf('enterManually', e.target.checked)} />
              Enter Address Manually
            </label>

            {/* Address Line 1 + 2 */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Address Line 1</label>
                <input className={`fi${errors.addrLine1 ? ' fi--err' : ''}${!form.enterManually ? ' fi--disabled' : ''}`}
                  value={form.addrLine1} onChange={e => sf('addrLine1', e.target.value)}
                  disabled={!form.enterManually} />
                <Err msg={errors.addrLine1} />
              </div>
              <div className="fc">
                <label className="fl">Address Line 2 <span className="fi-info">ⓘ</span></label>
                <input className={`fi${!form.enterManually ? ' fi--disabled' : ''}`}
                  value={form.addrLine2} onChange={e => sf('addrLine2', e.target.value)}
                  disabled={!form.enterManually} />
              </div>
            </div>

            {/* Country + State + City */}
            <div className="fg3 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> Country</label>
                <ClearSelect value={form.addrCountry} onChange={v => sf('addrCountry', v)} options={uniqueOptions(COUNTRY_OPTS, form.addrCountry)} />
                <Err msg={errors.addrCountry} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> State</label>
                <ClearSelect value={form.addrState} onChange={v => sf('addrState', v)}
                  options={uniqueOptions(US_STATES, form.addrState)} placeholder="Select..." />
                <Err msg={errors.addrState} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> City</label>
                <input className={`fi${errors.city ? ' fi--err' : ''}${!form.enterManually ? ' fi--disabled' : ''}`}
                  value={form.city} onChange={e => sf('city', e.target.value)} disabled={!form.enterManually} />
                <Err msg={errors.city} />
              </div>
            </div>

            {/* County + Zip */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> County</label>
                <input className={`fi${errors.county ? ' fi--err' : ''}${!form.enterManually ? ' fi--disabled' : ''}`}
                  value={form.county} onChange={e => sf('county', e.target.value)} disabled={!form.enterManually} />
                <Err msg={errors.county} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> Zip Code</label>
                <input className={`fi${errors.zipCode ? ' fi--err' : ''}${!form.enterManually ? ' fi--disabled' : ''}`}
                  value={form.zipCode} onChange={e => sf('zipCode', e.target.value)} disabled={!form.enterManually} />
                <Err msg={errors.zipCode} />
              </div>
            </div>

            {/* Lat + Lng */}
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl-plain">Latitude</label>
                <input className="fi fi--ro" value={form.latitude} readOnly />
              </div>
              <div className="fc">
                <label className="fl-plain">Longitude</label>
                <input className="fi fi--ro" value={form.longitude} readOnly />
              </div>
            </div>

            {/* Contact Details */}
            <div className="contact-divider" />
            <h2 className="wi-sec-title">Contact Details</h2>

            {contacts.map((c, idx) => (
              <div key={c.id} className="contact-blk">
                <div className="contact-hdr">
                  <h3 className="contact-name">{idx === 0 ? 'Primary Contact' : `Secondary Contact ${idx}`}</h3>
                  {idx > 0 && (
                    <button className="contact-del" type="button"
                      onClick={() => setContacts(p => p.filter(x => x.id !== c.id))}>🗑</button>
                  )}
                </div>
                <label className="producer-chk">
                  <input type="checkbox" checked={c.isAlsoProducer}
                    onChange={e => updContact(c.id, 'isAlsoProducer', e.target.checked)} />
                  Is also a Producer
                </label>
                <div className="fg3 fg-mb">
                  <div className="fc">
                    <label className="fl"><span className="req">*</span> Name</label>
                    <input className={`fi${errors[`c${idx}_name`] ? ' fi--err' : ''}`}
                      value={c.name} onChange={e => updContact(c.id, 'name', e.target.value)} />
                    <Err msg={errors[`c${idx}_name`]} />
                  </div>
                  <div className="fc">
                    <label className="fl"><span className="req">*</span> Title</label>
                    <input className={`fi${errors[`c${idx}_title`] ? ' fi--err' : ''}`}
                      value={c.title} onChange={e => updContact(c.id, 'title', e.target.value)} />
                    <Err msg={errors[`c${idx}_title`]} />
                  </div>
                  <div className="fc">
                    <label className="fl"><span className="req">*</span> Email ID</label>
                    <input className={`fi${errors[`c${idx}_email`] ? ' fi--err' : ''}`}
                      type="email" value={c.email} onChange={e => updContact(c.id, 'email', e.target.value)} />
                    <Err msg={errors[`c${idx}_email`]} />
                  </div>
                </div>
                <div className="fg3 fg-mb">
                  <div className="fc">
                    <label className="fl"><span className="req">*</span> Telephone Number</label>
                    <PhoneField value={c.phone} onChange={v => updContact(c.id, 'phone', v)}
                      hasError={!!errors[`c${idx}_phone`]} />
                    <Err msg={errors[`c${idx}_phone`]} />
                  </div>
                  <div className="fc">
                    <label className="fl-plain">Extension</label>
                    <input className="fi" value={c.extension}
                      onChange={e => updContact(c.id, 'extension', e.target.value)} />
                  </div>
                  <div className="fc">
                    <label className="fl-plain">Alternative Telephone Number</label>
                    <PhoneField value={c.altPhone} onChange={v => updContact(c.id, 'altPhone', v)} />
                  </div>
                </div>
              </div>
            ))}

            <div className="add-contacts-row">
              <button className="btn-add-contacts" type="button" onClick={addContact}>+ Add Contacts</button>
            </div>
          </div>
        </div>

        {/* Commission Disbursement */}
        <div className="card distribution-form-card">
          <h2 className="wi-sec-title">Commission Disbursement Credentials</h2>
          <p className="disburse-desc">
            An email address is required to create an account in DisburseCloud, which is our vendor to disburse
            monthly commissions. Please enter the email address which you want to use to create an account in
            DisburseCloud. This will be included in an email to the Intermediary once the record has been created.
          </p>
          <div className="fg-disburse">
            <div className="fc">
              <label className="fl"><span className="req">*</span> Business Name</label>
              <input className={`fi${errors.businessName ? ' fi--err' : ''}`}
                value={form.businessName} onChange={e => sf('businessName', e.target.value)} />
              <Err msg={errors.businessName} />
            </div>
            <div className="fc">
              <label className="fl"><span className="req">*</span> Email</label>
              <input className={`fi${errors.disbursementEmail ? ' fi--err' : ''}`}
                type="email" value={form.disbursementEmail}
                onChange={e => sf('disbursementEmail', e.target.value)} />
              <Err msg={errors.disbursementEmail} />
            </div>
          </div>
        </div>

        {/* Non-Resident States */}
        <div className="card distribution-form-card distribution-form-card--last">
          <h2 className="wi-sec-title">Non-Resident State(s)</h2>
          <div className="nr-bar">
            <div className="nr-search-wrap">
              <span className="nr-search-ico">🔍</span>
              <input className="nr-search" placeholder="Search by state or License"
                value={nrSearch} onChange={e => setNrSearch(e.target.value)} />
            </div>
            <button className="btn-add-state" type="button" onClick={() => setShowAddState(true)}>+ Add State</button>
          </div>
          {nrStates.length === 0
            ? <div className="nr-empty">No Data Available</div>
            : (
              <table className="nr-table">
                <thead><tr><th>Non-Resident State</th><th>License Number</th><th /></tr></thead>
                <tbody>
                  {filteredNR.map(r => (
                    <tr key={r.id}>
                      <td>{r.state}</td>
                      <td>{r.license}</td>
                      <td>
                        <button className="nr-del" type="button"
                          onClick={() => setNrStates(p => p.filter(s => s.id !== r.id))}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        <div style={{ height: 76 }} />
      </main>

      {/* Floating Top */}
      <button className="float-top" type="button"
        onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span style={{ fontSize: 16 }}>⌃</span>
        <span style={{ fontSize: 9 }}>Top</span>
      </button>


      {/* Cancel confirmation modal */}
      {showCancel && (
        <div className="vi-modal-overlay" onClick={() => setShowCancel(false)}>
          <div className="vi-modal vi-modal--sm" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', padding: '28px 24px 24px' }}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>⚠️</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>
                Are you sure you want to navigate out of this Intermediary?
              </h3>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 22px' }}>
                Your data may not be saved.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="vi-btn-outline" onClick={() => setShowCancel(false)}>Stay Here</button>
                <button className="vi-btn-danger" onClick={() => { setShowCancel(false); onBack(); }}>Yes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add State modal */}
      {showAddState && (
        <div className="overlay" onClick={closeAddState}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hdr">
              <h3 className="modal__title">Add Non-Resident State(s)</h3>
              <button className="modal__close" onClick={closeAddState}>×</button>
            </div>
            <div className="modal__body-pad">
              <div className="fc fg-mb">
                <label className="fl"><span className="req">*</span> Non-Resident State</label>
                <div className="sw">
                  <select className={`fs${modalErr.state ? ' fi--err' : ''}`}
                    value={modalNR.state} onChange={e => setModalNR(p => ({ ...p, state: e.target.value }))}>
                    <option value="">Select...</option>
                    {uniqueOptions(US_STATES, modalNR.state).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="sw__arr">▼</span>
                </div>
                <Err msg={modalErr.state} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> License Number</label>
                <input className={`fi${modalErr.license ? ' fi--err' : ''}`}
                  value={modalNR.license} onChange={e => setModalNR(p => ({ ...p, license: e.target.value }))} />
                <Err msg={modalErr.license} />
              </div>
            </div>
            <div className="modal__foot">
              <button className="modal-btn modal-btn--outline" onClick={closeAddState}>Cancel</button>
              <button className="modal-btn modal-btn--navy" onClick={handleAddStateSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}









