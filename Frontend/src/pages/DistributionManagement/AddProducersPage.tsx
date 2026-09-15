import React, { useState, useRef, useEffect } from 'react';
import { distributionApi as _api } from '../../api/distribution';
import BulkUploadModal from './BulkUploadModal';
import { includeLegacyValue, jurisdictionOptions } from './IntermediaryReferenceData';
import './ProducerCreation.css';
import ProducerLicenseInput, { validateProducerLicense } from './ProducerLicenseInput';

const WIZARD_STEPS = [
  { n: 1, l1: 'Add',    l2: 'Intermediary Details' },
  { n: 2, l1: 'Assign', l2: 'Rights'               },
  { n: 3, l1: 'Assign', l2: 'Products'             },
  { n: 4, l1: 'Add',    l2: 'Producers'            },
  { n: 5, l1: 'Review', l2: 'and Submit'           },
];

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

interface NRRow { id: string; state: string; license: string; }

export interface ProducerForm {
  suffix?: string; isManager?: boolean; reportsTo?: string;
  sameAsIntermediary?: boolean; enterManually?: boolean; googleSearch?: string;
  addrLine1?: string; addrLine2?: string; addrCountry?: string; addrState?: string;
  city?: string; county?: string; zipCode?: string; latitude?: string; longitude?: string;
  status: boolean;
  firstName: string; middleName: string; lastName: string;
  country: string; residentState: string;
  licReq: string; combinedLicense: string; plLicense: string; clLicense: string;
  pcLicenseRequirement: string;
  phoneCC: string; phone: string; ext: string; altPhone: string; altExt: string;
  email: string;
  profilePic: File | null;
  nrRows: NRRow[];
}

interface ProducerEntry {
  id: string;
  dbId?: number;
  producerCode?: string;
  draftToken?: string;
  reserving?: boolean;
  reservationError?: string;
  saveMessage?: string;
  expanded: boolean;
  saved: boolean;
  form: ProducerForm;
  errors: Record<string, string>;
}

const DEFAULT_FORM: ProducerForm = {
  status: true, firstName: '', middleName: '', lastName: '',
  country: 'United States', residentState: '', licReq: 'Combined',
  combinedLicense: '', plLicense: '', clLicense: '',
  pcLicenseRequirement: 'Combined',
  phoneCC: '1', phone: '', ext: '', altPhone: '', altExt: '', email: '',
  profilePic: null, nrRows: [],
};

function newProducerDraft(id: string): ProducerEntry {
  return { id, expanded: true, saved: false, form: { ...DEFAULT_FORM, nrRows: [] }, errors: {} };
}

function existingProducerEntry(row: any): ProducerEntry {
  return { id: 'saved-' + row.id, dbId: row.id, producerCode: row.producer_code, saved: true, expanded: false, errors: {},
    form: { ...DEFAULT_FORM, nrRows: [], status: row.status_toggle ?? row.status === 'Active',
      firstName: row.first_name ?? '', middleName: row.middle_name ?? '', lastName: row.last_name ?? '', suffix: row.suffix ?? '',
      country: row.country ?? '', residentState: row.residential_state ?? '', licReq: row.pc_license_requirement ?? row.pc_licence_requirement ?? 'Combined',
      combinedLicense: row.plcl_combined_license ?? '', plLicense: row.pl_license ?? '', clLicense: row.cl_license ?? '',
      phoneCC: row.telephone_number_cc ?? '1', phone: row.telephone_number ?? '', altPhone: row.alt_telephone_number ?? '',
      ext: String(row.extension ?? ''), email: row.email ?? '', isManager: row.is_manager ?? false, reportsTo: String(row.manager_id ?? '') } };
}

function formatUSPhone(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  if (d.length <= 3)  return `(${d}`;
  if (d.length <= 6)  return `(${d.slice(0,3)}) ${d.slice(3)}`;
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

function blockNonDigit(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Home','End'];
  if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault();
}

function PhoneField({ value, onChange, hasError }: { value: string; onChange: (v: string) => void; hasError?: boolean }) {
  return (
    <div className={`ph-wrap${hasError ? ' ph-wrap--err' : ''}`}>
      <button className="ph-flag" type="button">🇺🇸 <span className="ph-flag__arrow">▼</span></button>
      <input className="ph-input" type="tel" value={value}
        onChange={e => onChange(formatUSPhone(e.target.value))}
        onKeyDown={blockNonDigit} placeholder="(###) ###-####" maxLength={14} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`prod-toggle${checked ? ' prod-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}>
      <span className="prod-toggle__thumb" />
    </button>
  );
}

function ClearSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; options: string[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div className="cs-wrap">
      <select className={`cs-select${disabled ? ' cs-select--dis' : ''}`} value={value}
        onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {value && !disabled && <button className="cs-clear" type="button" onClick={() => onChange('')}>×</button>}
      <span className="cs-arrow">▼</span>
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <span className="ferr"><span className="ferr__ico">⊘</span>{msg}</span>;
}

export function getProducerErrors(form: ProducerForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.firstName.trim()) errors.firstName = 'Required';
  if (!form.lastName.trim()) errors.lastName = 'Required';
  if (!form.country.trim()) errors.country = 'Required';
  if (!form.residentState) errors.residentState = 'Required';
  if (form.licReq === 'Combined') {
    const error = validateProducerLicense(form.combinedLicense);
    if (error) errors.combinedLicense = error;
  }
  if (form.licReq === 'Separate') {
    const plError = validateProducerLicense(form.plLicense);
    const clError = validateProducerLicense(form.clLicense);
    if (plError) errors.plLicense = plError;
    if (clError) errors.clLicense = clError;
  }
  if (!form.phone.trim()) errors.phone = 'Required';
  if (!form.email.trim()) errors.email = 'Required';
  return errors;
}

function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

interface ProducerCardProps {
  standalone?: boolean;
  intermediaryId?: number;
  managers?: { id: number; name: string }[];
  saving?: boolean;
  producer: ProducerEntry;
  index: number;
  savedNames: string[];
  countryOpts: string[];
  onRetryReservation?: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ProducerForm>) => void;
  onValidateSave: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenAddNR: (id: string) => void;
  onRemoveNR: (producerId: string, nrId: string) => void;
}

function ProducerCard({
  producer, index, savedNames, countryOpts, standalone = false, intermediaryId, managers = [], saving = false,
  onUpdate, onValidateSave, onToggleExpand, onDelete, onOpenAddNR, onRemoveNR, onRetryReservation,
}: ProducerCardProps) {
  const { id, expanded, saved, form, errors } = producer;
  const sf = (k: keyof ProducerForm, v: unknown) => onUpdate(id, { [k]: v } as Partial<ProducerForm>);
  const picRef = useRef<HTMLInputElement>(null);
  const displayName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ') || `Producer ${index + 1}`;

  const [stateSearch, setStateSearch] = useState('');
  const [pictureUrl, setPictureUrl] = useState('');
  const [detailError, setDetailError] = useState('');
  const [copyingAddress, setCopyingAddress] = useState(false);
  useEffect(() => {
    if (!standalone || !form.profilePic) { setPictureUrl(''); return; }
    const url = URL.createObjectURL(form.profilePic);
    setPictureUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [standalone, form.profilePic]);

  function selectPicture(file?: File) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setDetailError('Choose a PNG, JPEG or GIF file up to 10 MB.'); return;
    }
    setDetailError(''); sf('profilePic', file);
  }

  async function copyIntermediaryAddress(checked: boolean) {
    if (!checked) { sf('sameAsIntermediary', false); return; }
    if (!intermediaryId) return;
    setCopyingAddress(true); setDetailError('');
    try {
      const row = await _api.address.get(intermediaryId);
      if (!row) throw new Error('No intermediary address is available.');
      onUpdate(id, { sameAsIntermediary: true, enterManually: false,
        addrLine1: row.address_line1 ?? '', addrLine2: row.address_line2 ?? '',
        addrCountry: row.country ?? '', addrState: row.state ?? '', city: row.city ?? '',
        county: row.county ?? '', zipCode: row.zip_code ?? '', latitude: String(row.latitude ?? ''), longitude: String(row.longitude ?? '') });
    } catch { setDetailError('The intermediary address could not be loaded. Enter the address manually.'); }
    finally { setCopyingAddress(false); }
  }

  function inputField(key: keyof ProducerForm, label: string, required = false, disabled = false) {
    return <label className="pc-field" key={key}><span>{required && <span className="req">* </span>}{label}</span>
      <input className={errors[key] ? 'fi fi--err' : 'fi'} aria-required={required} disabled={disabled}
        value={String(form[key] ?? '')} onChange={event => sf(key, event.target.value)} />
      <Err msg={errors[key]} />
    </label>;
  }
  const manualDisabled = !form.enterManually || !!form.sameAsIntermediary;
  const visibleStates = form.nrRows.filter(row => (row.state + ' ' + row.license).toLowerCase().includes(stateSearch.trim().toLowerCase()));

  if (standalone) return <section className="pc-card" id={id} aria-label={displayName}>
    <header className="pc-card-header">
      <button type="button" className="pc-expand" aria-expanded={expanded} onClick={() => onToggleExpand(id)}><span aria-hidden="true">{expanded ? '\u2296' : '\u2295'}</span> {displayName}</button>
      {!producer.dbId && <button type="button" aria-label="Remove unsaved producer" onClick={() => onDelete(id)}><TrashIcon /></button>}
    </header>
    {expanded && <>
      <fieldset className="pc-details" disabled={saving || saved}>
        <section className="pc-primary">
          <h2>Producer Primary Information</h2>
          <div className="pc-generated"><span>Producer ID - {producer.producerCode || (producer.reserving ? 'Generating...' : 'Unavailable')}</span><small>Auto Generated</small></div>
          {producer.reservationError && <p role="alert" className="ferr">{producer.reservationError} <button type="button" disabled={producer.reserving} onClick={() => onRetryReservation?.(id)}>Retry ID</button></p>}
          <div className="pc-status">Status: <Toggle checked={form.status} onChange={value => sf('status', value)} /></div>
          <p className="pc-picture-label">Upload Producer Profile Picture</p>
          <div className="pc-upload" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!saving && !saved) selectPicture(event.dataTransfer.files[0]); }}>
            {pictureUrl && <img src={pictureUrl} alt="Selected producer profile" />}
            <span>Drag and Drop File Here or Select a File</span>
            <small>Supported formats are PNG, JPEG &amp; GIF.<br />File size: up to 10 MB</small>
            <button type="button" onClick={() => picRef.current?.click()}>Browse File</button>
            <input ref={picRef} type="file" accept="image/png,image/jpeg,image/gif" hidden onChange={event => selectPicture(event.target.files?.[0])} />
          </div>
          <div className="pc-grid">
            {inputField('firstName', 'First Name', true)}{inputField('middleName', 'Middle / Initial Name')}
            {inputField('lastName', 'Last Name', true)}{inputField('suffix', 'Suffix')}
            <label className="pc-field"><span><span className="req">* </span>Country</span><ClearSelect value={form.country} options={countryOpts}
              onChange={country => onUpdate(id, { country, residentState: '' })} /><Err msg={errors.country} /></label>
            <label className="pc-field"><span><span className="req">* </span>Resident State</span><ClearSelect value={form.residentState}
              options={includeLegacyValue(jurisdictionOptions(form.country), form.residentState)} onChange={value => sf('residentState', value)} /><Err msg={errors.residentState} /></label>
            <label className="pc-field"><span><span className="req">* </span>P&amp;C Licensing Requirement</span><select value={form.licReq} onChange={event => sf('licReq', event.target.value)}>
              <option>Combined</option><option>Separate</option></select></label><span />
            {form.licReq === 'Combined' ? <><label className="pc-field"><span><span className="req">* </span>P&amp;C Combined License</span><ProducerLicenseInput className="fi" value={form.combinedLicense} onChange={value => sf('combinedLicense', value)} /><Err msg={errors.combinedLicense} /></label><span /></>
              : <>{(['plLicense', 'clLicense'] as const).map(key => <label className="pc-field" key={key}><span><span className="req">* </span>{key === 'plLicense' ? 'PL License' : 'CL License'}</span><ProducerLicenseInput className="fi" value={form[key]} onChange={value => sf(key, value)} /><Err msg={errors[key]} /></label>)}</>}
            <div className="pc-field"><span>Is a Manager</span><div className="pc-radio">{[true, false].map(value => <label key={String(value)}><input type="radio" name={`manager-${id}`} checked={!!form.isManager === value} onChange={() => onUpdate(id, { isManager: value, reportsTo: '' })} />{value ? 'Yes' : 'No'}</label>)}</div></div>
            <label className="pc-field"><span>Reports To</span><select value={form.reportsTo || ''} disabled={form.isManager} onChange={event => sf('reportsTo', event.target.value)}><option value="">Select...</option>{managers.map(manager => <option key={manager.id} value={manager.id}>{manager.name}</option>)}</select></label>
          </div>
        </section>
        <section className="pc-contact">
          <h2>Contact Details</h2>
          <div className="pc-grid pc-contact-grid">
            <label className="pc-field"><span><span className="req">* </span>Telephone Number</span><PhoneField value={form.phone} onChange={value => sf('phone', value)} hasError={!!errors.phone} /><Err msg={errors.phone} /></label>
            {inputField('ext', 'Extension')}
            <label className="pc-field"><span>Alternative Telephone Number</span><PhoneField value={form.altPhone} onChange={value => sf('altPhone', value)} /></label>
            <label className="pc-field"><span><span className="req">* </span>Email ID</span><input className="fi" type="email" value={form.email} onChange={event => sf('email', event.target.value)} /><Err msg={errors.email} /></label>
          </div>
          <div className="pc-address-header"><h2>Office Address</h2><label><input type="checkbox" disabled={copyingAddress} checked={!!form.sameAsIntermediary} onChange={event => void copyIntermediaryAddress(event.target.checked)} />Same as Intermediary Location</label></div>
          {inputField('googleSearch', 'Google Address Search', false, !!form.sameAsIntermediary)}
          <label className="pc-manual"><input type="checkbox" checked={!!form.enterManually} disabled={form.sameAsIntermediary} onChange={event => sf('enterManually', event.target.checked)} />Enter Address Manually</label>
          <div className="pc-grid pc-address-grid">
            <div className="pc-address-line">{inputField('addrLine1', 'Address Line 1', true, manualDisabled)}</div><div className="pc-address-line">{inputField('addrLine2', 'Address Line 2', false, manualDisabled)}</div>
            <label className="pc-field"><span><span className="req">* </span>Country</span><ClearSelect disabled={manualDisabled} value={form.addrCountry || 'United States'} options={countryOpts} onChange={value => onUpdate(id, { addrCountry: value, addrState: '' })} /></label>
            <label className="pc-field"><span><span className="req">* </span>State</span><ClearSelect disabled={manualDisabled} value={form.addrState || ''} options={includeLegacyValue(jurisdictionOptions(form.addrCountry || 'United States'), form.addrState || '')} onChange={value => sf('addrState', value)} /></label>
            {inputField('city', 'City', true, manualDisabled)}{inputField('county', 'County', true, manualDisabled)}{inputField('zipCode', 'Zip Code', true, manualDisabled)}<span />
            {inputField('latitude', 'Latitude', false, manualDisabled)}{inputField('longitude', 'Longitude', false, manualDisabled)}
          </div>
          {detailError && <p className="ferr" role="alert">{detailError}</p>}
        </section>
      </fieldset>
      <section className="pc-nr"><h2>Non-Resident State(s)</h2><div className="pc-nr-controls"><input aria-label="Search by state or License" placeholder="Search by state or License" value={stateSearch} onChange={event => setStateSearch(event.target.value)} /><button disabled={saving || saved} type="button" onClick={() => onOpenAddNR(id)}>+ Add State</button></div>
        {visibleStates.length === 0 ? <p className="pc-empty">No Data Available</p> : <table className="nr-table"><thead><tr><th>State</th><th>License</th><th /></tr></thead><tbody>{visibleStates.map(row => <tr key={row.id}><td>{row.state}</td><td>{row.license}</td><td><button disabled={saving || saved} aria-label={`Remove ${row.state}`} onClick={() => onRemoveNR(id, row.id)}><TrashIcon /></button></td></tr>)}</tbody></table>}
      </section>
      {producer.saveMessage && <p className="pc-save-message" role="status">{producer.saveMessage}</p>}
      <footer className="pc-save"><button type="button" disabled={saving || saved || !producer.draftToken} onClick={() => onValidateSave(id)}>{saving ? 'Saving...' : saved ? 'Saved' : 'Save'}</button></footer>
    </>}
  </section>;

  return (
    <div className={`prod-card${saved ? ' prod-card--saved' : ''}`}>
      <div className="prod-card__hdr">
        <div className="prod-card__hdr-left">
          {saved ? (
            <>
              {form.profilePic && (
                <img src={URL.createObjectURL(form.profilePic)} alt="pic"
                  className="prod-card__avatar" />
              )}
              <div>
                <div className="prod-card__name">{displayName}</div>
                <div className="prod-card__meta">{form.residentState || '—'} &bull; {form.email || '—'}</div>
              </div>
            </>
          ) : (
            <div className="prod-card__name">{displayName}</div>
          )}
        </div>
        <div className="prod-card__hdr-right">
          <span className={`prod-card__status${form.status ? ' prod-card__status--active' : ' prod-card__status--inactive'}`}>
            {form.status ? 'Active' : 'Inactive'}
          </span>
          {saved && (
            <button type="button" className="prod-card__edit-btn"
              onClick={() => onToggleExpand(id)} title="Edit">
              <EditIcon size={14} />
            </button>
          )}
          <button type="button" className="prod-card__del-btn"
            onClick={() => onDelete(id)} title="Delete">
            <TrashIcon size={14} />
          </button>
          <button type="button" className="prod-card__expand-btn"
            onClick={() => onToggleExpand(id)}>
            {expanded ? '⊖' : '⊕'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="prod-card__body">
          <div className="prod-card__section-hdr">
            <h3 className="prod-card__section-title">Producer Details</h3>
            <div className="prod-card__status-row">
              <span className="prod-card__status-lbl">Status</span>
              <Toggle checked={form.status} onChange={v => sf('status', v)} />
            </div>
          </div>

          {/* Profile pic */}
          <div className="prod-pic-sec">
            <div className="prod-pic-wrap" onClick={() => picRef.current?.click()}>
              {form.profilePic
                ? <img src={URL.createObjectURL(form.profilePic)} alt="Profile" className="prod-pic-img" />
                : <span className="prod-pic-ph">👤</span>
              }
            </div>
            <div className="prod-pic-info">
              <p className="prod-pic-lbl">Profile Picture</p>
              <p className="prod-pic-hint">PNG, JPEG, GIF up to 10MB</p>
              <button type="button" className="prod-btn-pic" onClick={() => picRef.current?.click()}>
                {form.profilePic ? 'Replace' : 'Upload'}
              </button>
            </div>
            <input ref={picRef} type="file" accept=".png,.jpg,.jpeg,.gif" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) sf('profilePic', f); }} />
          </div>

          {/* Name row */}
          <div className="fg3 fg-mb">
            <div className="fc">
              <label className="fl"><span className="req">*</span> First Name</label>
              <input className={`fi${errors.firstName ? ' fi--err' : ''}`}
                value={form.firstName} onChange={e => sf('firstName', e.target.value)} />
              <Err msg={errors.firstName} />
            </div>
            <div className="fc">
              <label className="fl-plain">Middle Name</label>
              <input className="fi" value={form.middleName} onChange={e => sf('middleName', e.target.value)} />
            </div>
            <div className="fc">
              <label className="fl"><span className="req">*</span> Last Name</label>
              <input className={`fi${errors.lastName ? ' fi--err' : ''}`}
                value={form.lastName} onChange={e => sf('lastName', e.target.value)} />
              <Err msg={errors.lastName} />
            </div>
          </div>

          {/* Country + State */}
          <div className="fg2 fg-mb">
            <div className="fc">
              <label className="fl"><span className="req">*</span> Country</label>
              <ClearSelect value={form.country} onChange={v => sf('country', v)} options={countryOpts} />
              <Err msg={errors.country} />
            </div>
            <div className="fc">
              <label className="fl"><span className="req">*</span> Resident State</label>
              <div className="sw">
                <select className={`fs${errors.residentState ? ' fi--err' : ''}`}
                  value={form.residentState} onChange={e => sf('residentState', e.target.value)}>
                  <option value="">Select...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className="sw__arr">▼</span>
              </div>
              <Err msg={errors.residentState} />
            </div>
          </div>

          {/* License requirement */}
          <div className="fg-mb">
            <label className="fl"><span className="req">*</span> PC License Requirement</label>
            <div className="prod-radio-row">
              {['Combined', 'Separate'].map(opt => (
                <label key={opt} className="prod-radio">
                  <input type="radio" name={`licReq-${id}`} value={opt}
                    checked={form.licReq === opt} onChange={() => sf('licReq', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {form.licReq === 'Combined' ? (
            <div className="fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> License Number</label>
                <ProducerLicenseInput className={`fi${errors.combinedLicense ? ' fi--err' : ''}`}
                  value={form.combinedLicense} onChange={value => sf('combinedLicense', value)} />
                <Err msg={errors.combinedLicense} />
              </div>
            </div>
          ) : (
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> P&amp;C License (Personal)</label>
                <ProducerLicenseInput className={`fi${errors.plLicense ? ' fi--err' : ''}`}
                  value={form.plLicense} onChange={value => sf('plLicense', value)} />
                <Err msg={errors.plLicense} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> P&amp;C License (Commercial)</label>
                <ProducerLicenseInput className={`fi${errors.clLicense ? ' fi--err' : ''}`}
                  value={form.clLicense} onChange={value => sf('clLicense', value)} />
                <Err msg={errors.clLicense} />
              </div>
            </div>
          )}

          {/* Phone */}
          <div className="fg3 fg-mb">
            <div className="fc">
              <label className="fl"><span className="req">*</span> Telephone Number</label>
              <PhoneField value={form.phone} onChange={v => sf('phone', v)} hasError={!!errors.phone} />
              <Err msg={errors.phone} />
            </div>
            <div className="fc">
              <label className="fl-plain">Extension</label>
              <input className="fi" value={form.ext} onChange={e => sf('ext', e.target.value)} />
            </div>
            <div className="fc">
              <label className="fl-plain">Alt. Telephone</label>
              <PhoneField value={form.altPhone} onChange={v => sf('altPhone', v)} />
            </div>
          </div>

          {/* Email */}
          <div className="fg-mb">
            <div className="fc">
              <label className="fl"><span className="req">*</span> Email</label>
              <input className={`fi${errors.email ? ' fi--err' : ''}`} type="email"
                value={form.email} onChange={e => sf('email', e.target.value)} />
              <Err msg={errors.email} />
            </div>
          </div>

          {/* Non-Resident States */}
          <div className="prod-nr-section">
            <div className="prod-nr-hdr">
              <span className="prod-nr-title">Non-Resident State(s)</span>
              {savedNames.length > 0 && (
                <div className="prod-nr-tags">
                  {savedNames.map(name => (
                    <span key={name} className="prod-nr-tag">{name}</span>
                  ))}
                </div>
              )}
              <button type="button" className="prod-btn-nr" onClick={() => onOpenAddNR(id)}>+ Add NR State</button>
            </div>
            {form.nrRows.length > 0 && (
              <table className="nr-table" style={{ marginTop: 8 }}>
                <thead><tr><th>State</th><th>License</th><th /></tr></thead>
                <tbody>
                  {form.nrRows.map(r => (
                    <tr key={r.id}>
                      <td>{r.state}</td>
                      <td>{r.license}</td>
                      <td>
                        <button type="button" className="nr-del"
                          onClick={() => onRemoveNR(id, r.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="prod-card__footer">
            <button type="button" className="btn btn--primary" onClick={() => onValidateSave(id)}>
              Save Producer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Reuses the same create endpoint and field contract as View Intermediary.
// The backend assigns both the database ID and the display producer code.
export async function createStandaloneProducer(intermediaryId: number, form: ProducerForm, draftToken?: string) {
  let os_user_id: number | null = null;
  try {
    const user = await _api.users.create({ email: form.email, name: [form.firstName, form.lastName].filter(Boolean).join(' ') });
    os_user_id = user.id;
  } catch { /* Existing user setup is non-fatal to producer creation. */ }
  const created = await _api.producers.create({
    ...(draftToken ? { producer_draft_token: draftToken } : {}),
    intermediary_id: intermediaryId, status: form.status ? 'Active' : 'Inactive', status_toggle: form.status,
    first_name: form.firstName, middle_name: form.middleName || null, last_name: form.lastName, suffix: form.suffix || null,
    pc_licence_requirement: form.licReq, country: form.country, residential_state: form.residentState,
    pl_license: form.licReq === 'Separate' ? form.plLicense : null,
    cl_license: form.licReq === 'Separate' ? form.clLicense : null,
    plcl_combined_license: form.licReq === 'Combined' ? form.combinedLicense : null,
    telephone_number_cc: form.phoneCC ? '+' + form.phoneCC.replace(/^\+/, '') : null,
    telephone_number: form.phone, alt_telephone_number_cc: form.altPhone ? '+1' : null,
    alt_telephone_number: form.altPhone || null, extension: form.ext ? Number(form.ext) : null,
    email: form.email, is_manager: form.isManager ?? false,
    manager_id: !form.isManager && form.reportsTo ? Number(form.reportsTo) : null, os_user_id,
  });
  const warnings: string[] = [];
  if (form.addrLine1) {
    try {
      await _api.producerAddress.create(created.id, { address_line1: form.addrLine1, address_line2: form.addrLine2 || '',
        country: form.addrCountry || 'United States', state: form.addrState || '', city: form.city || '', county: form.county || '',
        zip_code: form.zipCode || '', latitude: form.latitude || null, longitude: form.longitude || null });
    } catch { warnings.push('Office address was not saved because the address service is unavailable.'); }
  }
  for (const row of form.nrRows) {
    try { await _api.producerNrStates.create(created.id, { state: row.state, license_number: row.license }); }
    catch { warnings.push('Non-resident state ' + row.state + ' was not saved.'); }
  }
  if (form.profilePic) warnings.push('The profile picture is a local preview; this API does not support picture uploads.');
  return { created, warnings };
}

export default function AddProducersPage({ onBack, onNext, intermediaryId, addRequests = 1 }: { onBack: () => void; onNext?: () => void; intermediaryId?: number; addRequests?: number }) {
  const standalone = intermediaryId !== undefined;
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const inFlight = useRef(new Set<string>());
  const nextDraftKey = useRef(1);
  const seenAddRequests = useRef(0);
  const reservationQueue = useRef<Promise<void>>(Promise.resolve());
  const [producers, setProducers] = useState<ProducerEntry[]>(() => standalone ? [] : [newProducerDraft('draft-0')]);
  const [countryOpts] = useState(COUNTRY_OPTS);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);
  const [addNRFor, setAddNRFor] = useState<string | null>(null);
  const [modalNR, setModalNR] = useState({ state: '', license: '' });
  const [modalNRErr, setModalNRErr] = useState<{ state?: string; license?: string }>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (standalone) return;
    try {
      const saved = sessionStorage.getItem('shift_step4');
      if (saved) {
        const r = JSON.parse(saved);
        if (Array.isArray(r) && r.length > 0) setProducers(r);
      }
    } catch { /* ignore */ }
  }, [standalone]);

  useEffect(() => {
    if (intermediaryId === undefined) return;
    let cancelled = false;
    _api.producers.listByIntermediary(intermediaryId).then(rows => {
      if (!cancelled) {
        setManagers(rows.map(row => ({ id: row.id, name: [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ') })));
        setProducers(previous => [...rows.filter(row => !previous.some(entry => entry.dbId === row.id)).map(existingProducerEntry), ...previous]);
      }
    }).catch(() => { if (!cancelled) setToast({ msg: 'Reports To options could not be loaded.', type: 'error' }); });
    return () => { cancelled = true; };
  }, [intermediaryId]);

  function showToast(msg: string, type: 'info' | 'error' = 'info') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function updateProducer(id: string, patch: Partial<ProducerForm>) {
    setProducers(p => p.map(e => e.id !== id ? e : { ...e, form: { ...e.form, ...patch } }));
  }

  function toggleExpand(id: string) {
    setProducers(p => p.map(e => e.id !== id ? e : { ...e, expanded: !e.expanded }));
  }

  async function validateAndSave(id: string) {
    const entry = producers.find(e => e.id === id);
    if (!entry || inFlight.current.has(id) || (standalone && entry.dbId)) return;
    if (standalone && !entry.draftToken) return;
    const errs = getProducerErrors(entry.form);
    if (Object.keys(errs).length > 0) {
      setProducers(p => p.map(e => e.id !== id ? e : { ...e, errors: errs }));
      showToast('Please fix the errors before saving.', 'error');
      return;
    }
    if (standalone && intermediaryId !== undefined) {
      inFlight.current.add(id); setSavingIds(previous => [...previous, id]);
      try {
        const { created, warnings } = await createStandaloneProducer(intermediaryId, entry.form, entry.draftToken);
        setProducers(previous => previous.map(item => item.id !== id ? item : { ...item, dbId: created.id,
          producerCode: created.producer_code, saved: true, errors: {}, saveMessage: ['Producer saved.', ...warnings].join(' ') }));
        setManagers(previous => [...previous, { id: created.id, name: [entry.form.firstName, entry.form.lastName].join(' ') }]);
      } catch (error: any) {
        setProducers(previous => previous.map(item => item.id !== id ? item : { ...item, saveMessage: error.response?.data?.error || 'Producer could not be saved. Please try again.' }));
      } finally {
        inFlight.current.delete(id); setSavingIds(previous => previous.filter(value => value !== id));
      }
      return;
    }
    setProducers(p => p.map(e => e.id !== id ? e : { ...e, saved: true, expanded: false, errors: {} }));
  }

  function saveAndNext() {
    const validated = producers.map(producer => {
      const errors = getProducerErrors(producer.form);
      return Object.keys(errors).length > 0
        ? { ...producer, saved: false, expanded: true, errors }
        : { ...producer, errors: {} };
    });
    if (validated.some(producer => Object.keys(producer.errors).length > 0)) {
      setProducers(validated);
      showToast('Please fix the errors before saving.', 'error');
      return;
    }

    try {
      const serializable = validated.map(p => ({ ...p, form: { ...p.form, profilePic: null } }));
      sessionStorage.setItem('shift_step4', JSON.stringify(serializable));
    } catch { /* ignore */ }
    onNext?.();
  }

  function reserveDraftId(id: string) {
    if (intermediaryId === undefined) return;
    setProducers(previous => previous.map(entry => entry.id === id ? { ...entry, reserving: true, reservationError: undefined } : entry));
    // Serial requests preserve card order even when Add is clicked rapidly.
    reservationQueue.current = reservationQueue.current.then(async () => {
      try {
        const reservation = await _api.producers.reserveId(intermediaryId);
        setProducers(previous => previous.map(entry => entry.id === id ? { ...entry, reserving: false,
          producerCode: reservation.producer_code, draftToken: reservation.producer_draft_token } : entry));
      } catch (error: any) {
        setProducers(previous => previous.map(entry => entry.id === id ? { ...entry, reserving: false,
          reservationError: error.response?.data?.error || 'Producer ID could not be generated.' } : entry));
      }
    });
  }

  function addProducer() {
    // Construct the draft outside the updater: React StrictMode may invoke updaters twice.
    let key: string;
    do { key = 'draft-' + nextDraftKey.current++; } while (producers.some(entry => entry.id === key));
    const draft = newProducerDraft(key);
    setProducers(previous => [...previous, draft]);
    if (standalone) reserveDraftId(draft.id);
  }

  useEffect(() => {
    if (!standalone) return;
    while (seenAddRequests.current < addRequests) {
      seenAddRequests.current++;
      addProducer();
    }
  }, [standalone, addRequests]);

  function openAddNR(producerId: string) {
    setAddNRFor(producerId);
    setModalNR({ state: '', license: '' });
    setModalNRErr({});
  }

  function closeAddNR() { setAddNRFor(null); }

  function saveNR() {
    const errs: { state?: string; license?: string } = {};
    if (!modalNR.state) errs.state = 'State is required.';
    if (!modalNR.license.trim()) errs.license = 'License is required.';
    if (standalone) { const licenseError = validateProducerLicense(modalNR.license); if (licenseError) errs.license = licenseError; }
    if (addNRFor) {
      const entry = producers.find(e => e.id === addNRFor);
      if (entry && entry.form.nrRows.some(r => r.state === modalNR.state)) {
        errs.state = 'This state is already added.';
      }
    }
    setModalNRErr(errs);
    if (Object.keys(errs).length) return;
    if (!addNRFor) return;
    const nrRow: NRRow = { id: String(Date.now()), state: modalNR.state, license: modalNR.license };
    setProducers(p => p.map(e => e.id !== addNRFor ? e : {
      ...e, form: { ...e.form, nrRows: [...e.form.nrRows, nrRow] },
    }));
    closeAddNR();
  }

  function removeNR(producerId: string, nrId: string) {
    setProducers(p => p.map(e => e.id !== producerId ? e : {
      ...e, form: { ...e.form, nrRows: e.form.nrRows.filter(r => r.id !== nrId) },
    }));
  }

  function getSavedNames(producerId: string): string[] {
    return producers.filter(e => e.id !== producerId && e.saved)
      .map(e => [e.form.firstName, e.form.middleName, e.form.lastName].filter(Boolean).join(' '));
  }

  function handleDeleteClick(id: string) { setDeleteConfirmId(id); }
  function handleConfirmDelete() {
    if (deleteConfirmId) setProducers(p => p.filter(e => e.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  }
  function handleCancelDelete() { setDeleteConfirmId(null); }

  return (
    <>
      {toast && (
        <div className={`prod-toast prod-toast--${toast.type}`}>
          <span className="prod-toast__icon">{toast.type === 'info' ? '!' : '✕'}</span>
          <span>{toast.msg}</span>
          <button className="prod-toast__close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <main className={standalone ? "wi-main pc-page" : "wi-main"} ref={mainRef}>

      {!standalone && <>
      {/* Page head */}
      <div className="wi-head">
        <h1 className="wi-title">Add Intermediary / Pragya Jha</h1>
        <p className="wi-breadcrumb">
          <span className="wi-breadcrumb__link" onClick={onBack}>Distribution Management</span>
          {' / '}
          <span className="wi-breadcrumb__cur">Add Intermediary</span>
        </p>
      </div>

      {/* Wizard bar */}
      <div className="rgt-wiz-bar">
        {WIZARD_STEPS.map((step, i) => (
          <React.Fragment key={step.n}>
            {i > 0 && (
              <div className={`rgt-wiz-connector${step.n <= 4 ? ' rgt-wiz-connector--done' : ''}`} />
            )}
            <div className="rgt-wiz-step">
              <div className={`rgt-wiz-circle${step.n < 4 ? ' rgt-wiz-circle--done' : step.n === 4 ? ' rgt-wiz-circle--active' : ''}`}>
                {step.n < 4 ? '✓' : step.n}
              </div>
              <div className={`rgt-wiz-lbl${step.n === 4 ? ' rgt-wiz-lbl--active' : ''}`}>
                <span>{step.l1}</span><span>{step.l2}</span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      </>}
      {/* Producer cards */}
      <div className="prod-list">
        {producers.map((prod, idx) => (
          <ProducerCard
            key={prod.id}
            producer={prod}
            standalone={standalone}
            intermediaryId={intermediaryId}
            managers={managers}
            saving={savingIds.includes(prod.id)}
            index={idx}
            savedNames={getSavedNames(prod.id)}
            countryOpts={countryOpts}
            onRetryReservation={reserveDraftId}
            onUpdate={updateProducer}
            onValidateSave={validateAndSave}
            onToggleExpand={toggleExpand}
            onDelete={handleDeleteClick}
            onOpenAddNR={openAddNR}
            onRemoveNR={removeNR}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="prod-actions">
        <button className="prod-btn-bulk" type="button"
          onClick={() => standalone ? setShowBulkUpload(true) : showToast('Functionality Coming Soon', 'info')}>
          ↑ Producer Bulk Upload
        </button>
        <button className="prod-btn-add" type="button" onClick={addProducer}>
          + Add Producers
        </button>
      </div>

      <div style={{ height: 76 }} />

      {/* Floating top */}
      <button className="float-top" type="button"
        onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span style={{ fontSize: 16 }}>⌃</span>
        <span style={{ fontSize: 9 }}>Top</span>
      </button>

      {/* Fixed footer */}
      <div className="fixed-footer">
        <button className="prod-footer-prev" type="button" disabled={savingIds.length > 0} onClick={onBack}>{standalone ? 'Back' : 'Previous'}</button>
        {!standalone && <button className="footer-save" type="button" onClick={saveAndNext}>Save &amp; Next</button>}
      </div>

      {showBulkUpload && <BulkUploadModal onClose={() => setShowBulkUpload(false)} />}
      {/* Add Non-Resident State modal */}
      {addNRFor && (
        <div className="overlay" onClick={closeAddNR}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__hdr">
              <h3 className="modal__title" style={{ padding: 0 }}>Add Non-Resident State(s)</h3>
              <button className="modal__close" onClick={closeAddNR}>×</button>
            </div>
            <div className="modal__body-pad">
              <div className="fc fg-mb">
                <label className="fl"><span className="req">*</span> Non-Resident State</label>
                <div className="sw">
                  <select className={`fs${modalNRErr.state ? ' fi--err' : ''}`}
                    value={modalNR.state} onChange={e => setModalNR(p => ({ ...p, state: e.target.value }))}>
                    <option value="">Select...</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="sw__arr">▼</span>
                </div>
                {modalNRErr.state && <span className="ferr">{modalNRErr.state}</span>}
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> License Number</label>
                <input className={`fi${modalNRErr.license ? ' fi--err' : ''}`}
                  value={modalNR.license} onChange={e => setModalNR(p => ({ ...p, license: e.target.value }))} />
                {modalNRErr.license && <span className="ferr">{modalNRErr.license}</span>}
              </div>
            </div>
            <div className="modal__foot">
              <button className="modal-btn modal-btn--outline" onClick={closeAddNR}>Cancel</button>
              <button className="modal-btn modal-btn--navy" onClick={saveNR}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="overlay" onClick={handleCancelDelete}>
          <div className="prod-del-modal" onClick={e => e.stopPropagation()}>
            <div className="prod-del-modal__icon-wrap">
              <TrashIcon size={36} />
            </div>
            <h3 className="prod-del-modal__title">Are you sure you want to delete this?</h3>
            <p className="prod-del-modal__desc">
              This Action cannot be undone. Please confirm if you want to proceed
            </p>
            <div className="prod-del-modal__foot">
              <button className="prod-del-modal__btn prod-del-modal__btn--keep"
                onClick={handleCancelDelete}>No, Keep It</button>
              <button className="prod-del-modal__btn prod-del-modal__btn--del"
                onClick={handleConfirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
}
