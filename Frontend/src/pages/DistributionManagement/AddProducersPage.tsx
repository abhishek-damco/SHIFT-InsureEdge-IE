import React, { useState, useRef, useEffect } from 'react';
import { distributionApi as _api } from '../../api/distribution';

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

interface ProducerForm {
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

let _pid = 1;

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
  producer: ProducerEntry;
  index: number;
  savedNames: string[];
  countryOpts: string[];
  onUpdate: (id: string, patch: Partial<ProducerForm>) => void;
  onValidateSave: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenAddNR: (id: string) => void;
  onRemoveNR: (producerId: string, nrId: string) => void;
}

function ProducerCard({
  producer, index, savedNames, countryOpts,
  onUpdate, onValidateSave, onToggleExpand, onDelete, onOpenAddNR, onRemoveNR,
}: ProducerCardProps) {
  const { id, expanded, saved, form, errors } = producer;
  const sf = (k: keyof ProducerForm, v: unknown) => onUpdate(id, { [k]: v } as Partial<ProducerForm>);
  const picRef = useRef<HTMLInputElement>(null);
  const displayName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' ') || `Producer ${index + 1}`;

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
                <input className={`fi${errors.combinedLicense ? ' fi--err' : ''}`}
                  value={form.combinedLicense} onChange={e => sf('combinedLicense', e.target.value)} />
                <Err msg={errors.combinedLicense} />
              </div>
            </div>
          ) : (
            <div className="fg2 fg-mb">
              <div className="fc">
                <label className="fl"><span className="req">*</span> P&amp;C License (Personal)</label>
                <input className={`fi${errors.plLicense ? ' fi--err' : ''}`}
                  value={form.plLicense} onChange={e => sf('plLicense', e.target.value)} />
                <Err msg={errors.plLicense} />
              </div>
              <div className="fc">
                <label className="fl"><span className="req">*</span> P&amp;C License (Commercial)</label>
                <input className={`fi${errors.clLicense ? ' fi--err' : ''}`}
                  value={form.clLicense} onChange={e => sf('clLicense', e.target.value)} />
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

export default function AddProducersPage({ onBack, onNext }: { onBack: () => void; onNext?: () => void }) {
  const [producers, setProducers] = useState<ProducerEntry[]>([
    { id: String(_pid++), expanded: true, saved: false, form: { ...DEFAULT_FORM }, errors: {} },
  ]);
  const [countryOpts] = useState(COUNTRY_OPTS);
  const [toast, setToast] = useState<{ msg: string; type: 'info' | 'error' } | null>(null);
  const [addNRFor, setAddNRFor] = useState<string | null>(null);
  const [modalNR, setModalNR] = useState({ state: '', license: '' });
  const [modalNRErr, setModalNRErr] = useState<{ state?: string; license?: string }>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('shift_step4');
      if (saved) {
        const r = JSON.parse(saved);
        if (Array.isArray(r) && r.length > 0) setProducers(r);
      }
    } catch { /* ignore */ }
  }, []);

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

  function validateAndSave(id: string) {
    const entry = producers.find(e => e.id === id);
    if (!entry) return;
    const f = entry.form;
    const errs: Record<string, string> = {};
    if (!f.firstName.trim()) errs.firstName = 'Required';
    if (!f.lastName.trim())  errs.lastName  = 'Required';
    if (!f.country.trim())   errs.country   = 'Required';
    if (!f.residentState)    errs.residentState = 'Required';
    if (f.licReq === 'Combined' && !f.combinedLicense.trim()) errs.combinedLicense = 'Required';
    if (f.licReq === 'Separate') {
      if (!f.plLicense.trim()) errs.plLicense = 'Required';
      if (!f.clLicense.trim()) errs.clLicense = 'Required';
    }
    if (!f.phone.trim()) errs.phone = 'Required';
    if (!f.email.trim()) errs.email = 'Required';
    if (Object.keys(errs).length > 0) {
      setProducers(p => p.map(e => e.id !== id ? e : { ...e, errors: errs }));
      showToast('Please fix the errors before saving.', 'error');
      return;
    }
    setProducers(p => p.map(e => e.id !== id ? e : { ...e, saved: true, expanded: false, errors: {} }));
  }

  function addProducer() {
    setProducers(p => [...p, {
      id: String(_pid++), expanded: true, saved: false,
      form: { ...DEFAULT_FORM }, errors: {},
    }]);
  }

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

      <main className="wi-main" ref={mainRef}>

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

      {/* Producer cards */}
      <div className="prod-list">
        {producers.map((prod, idx) => (
          <ProducerCard
            key={prod.id}
            producer={prod}
            index={idx}
            savedNames={getSavedNames(prod.id)}
            countryOpts={countryOpts}
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
          onClick={() => showToast('Functionality Coming Soon', 'info')}>
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
        <button className="prod-footer-prev" type="button" onClick={onBack}>Previous</button>
        <button className="footer-save" type="button" onClick={() => {
          try {
            const serializable = producers.map(p => ({ ...p, form: { ...p.form, profilePic: null } }));
            sessionStorage.setItem('shift_step4', JSON.stringify(serializable));
          } catch { /* ignore */ }
          onNext?.();
        }}>Save &amp; Next</button>
      </div>

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
