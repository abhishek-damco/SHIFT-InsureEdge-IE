import React, { useCallback, useEffect, useState } from 'react';
import { clientManagementApi } from '../../api/clientManagement';
import type {
  AddressDto, ClientDetail, CompanyDto, ContactDto, JurisdictionDto, ProductAccessDto,
  SaveAddressRequest, SaveCompanyRequest, SaveContactRequest,
} from '../../types/ClientManagement';
import { AddressEditor, type AddressForm, toAddressForm } from './AddressEditor';
import {
  ContactListEditor, ExtensionInput, Field, PHONE_CC_US, PhoneInput, Select, TextInput,
  emptyContact, formatPhoneWithFlag, toContactRequest, validateContactList,
} from './ClientFormFields';
import {
  BUSINESS_DESCRIPTION_MAX, CANADA, COUNTRIES, type Errors, apiErrorMessage, digitsOnly,
  formatFederalTaxId, regionOptions, stateLabel, validateAddress, validateBusinessDescription,
  validateCompanyForm,
} from './validation';

const blue = '#0B5AA0';
const border = '#d8dee6';
const button: React.CSSProperties = { height: 34, padding: '0 16px', borderRadius: 3, fontSize: 13, cursor: 'pointer' };
const primaryButton: React.CSSProperties = { ...button, border: 0, background: blue, color: '#fff', fontWeight: 700 };
const secondaryButton: React.CSSProperties = { ...button, border: `1px solid ${border}`, background: '#fff', color: blue };
const section: React.CSSProperties = { border: `1px solid ${border}`, borderRadius: 4, padding: 16, background: '#fff' };

function Pencil() {
  return <span aria-hidden="true" style={{ fontSize: 16 }}>✎</span>;
}

function AddCompanyIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 21V7.5h9V21M7.5 7.5V3h3v4.5M2.5 21h13" />
    <path d="M7.5 11h.01M10.5 11h.01M7.5 14.5h.01M10.5 14.5h.01M7.5 18h.01M10.5 18h.01" strokeWidth="2" />
    <path d="M18.5 11.5v7M15 15h7" strokeWidth="1.8" />
  </svg>;
}

function DashField({ label, value }: { label: string; value?: string | number | null }) {
  return <div style={{ minWidth: 0 }}><div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 13, color: '#111827', overflowWrap: 'anywhere' }}>{value == null || String(value).trim() === '' ? '-' : value}</div></div>;
}

function SectionTitle({ children, onEdit }: { children: React.ReactNode; onEdit?: () => void }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
    <h3 style={{ margin: 0, fontSize: 14, color: '#111827' }}>{children}</h3>
    {onEdit && <button type="button" aria-label={`Edit ${String(children)}`} title="Edit" onClick={onEdit} style={{ border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer' }}><Pencil /></button>}
  </div>;
}

const companyAddress = (address: AddressDto | undefined, type: 'Legal' | 'Mailing'): SaveAddressRequest => ({
  ...toAddressForm(address), addressType: type,
});

const companyRequest = (company: CompanyDto): SaveCompanyRequest => ({
  id: company.id,
  companyName: company.companyName,
  domicileCountry: company.domicileCountry,
  stateOfDomicile: company.stateOfDomicile,
  naicCode: company.naicCode,
  emailId: company.emailId,
  telephoneNumber: company.telephoneNumber,
  telephoneNumberCc: company.telephoneNumberCc,
  extension: company.extension,
  federalTaxId: company.federalTaxId,
  url: company.url,
  businessDescription: company.businessDescription,
  status: company.status,
  logoBase64: company.logoBase64,
  logoContentType: company.logoContentType,
  legalAddress: companyAddress(company.legalAddress, 'Legal'),
  mailingAddress: companyAddress(company.mailingAddress, 'Mailing'),
  primaryContact: toContactRequest(company.primaryContact),
  secondaryContacts: company.secondaryContacts.map(toContactRequest),
});

const blankCompany = (): SaveCompanyRequest => ({
  companyName: '', domicileCountry: 'United States', stateOfDomicile: '', naicCode: '',
  emailId: '', telephoneNumber: '', telephoneNumberCc: PHONE_CC_US, extension: undefined,
  federalTaxId: '', url: '', businessDescription: '', status: 'Active',
  legalAddress: { ...toAddressForm(), addressType: 'Legal' },
  mailingAddress: { ...toAddressForm(), addressType: 'Mailing' },
  primaryContact: emptyContact(), secondaryContacts: [],
});

function LogoField({ form, setForm, error, existing }: {
  form: SaveCompanyRequest; setForm: React.Dispatch<React.SetStateAction<SaveCompanyRequest>>; error?: string; existing?: boolean;
}) {
  const [localError, setLocalError] = useState('');
  const choose = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size < 10 * 1024 || file.size > 10 * 1024 * 1024) {
      setLocalError('Provide valid Company Logo to continue'); return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result); setLocalError('');
      setForm(current => ({ ...current, logoBase64: result.split(',')[1], logoContentType: file.type, logoFileName: file.name }));
    };
    reader.readAsDataURL(file);
  };
  const selectedFileName = form.logoFileName;
  const buttonLabel = selectedFileName
    ? `${selectedFileName.slice(0, 8)}${selectedFileName.length > 8 ? '...' : ''}`
    : existing ? 'Stored Logo' : 'Browse File';
  return <Field label="Upload Company Logo" required error={localError || error}>
    <label onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files?.[0]); }} style={{ minHeight: 112, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${localError || error ? '#dc2626' : '#cbd5e1'}`, borderRadius: 4, padding: 12, textAlign: 'center', cursor: 'pointer', color: '#111827', background: '#f8f9fc', fontSize: 12 }}>
      <input type="file" accept="image/png,image/jpeg,image/gif" style={{ display: 'none' }} onChange={e => choose(e.target.files?.[0])} />
      <strong style={{ fontWeight: 600 }}>Drag and Drop File Here or Select a File</strong>
      <div style={{ color: '#64748b', marginTop: 8, fontSize: 10 }}>Supported formats are PNG, JPEG &amp; GIF.</div>
      <div style={{ color: '#64748b', marginTop: 3, fontSize: 10 }}>File size : 10 KB-10 MB</div>
      <span title={selectedFileName || undefined} style={{ marginTop: 12, width: 134, height: 28, padding: '0 12px', border: `1px solid ${blue}`, borderRadius: 3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, color: blue, background: '#fff', boxSizing: 'border-box' }}>
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6.5h6l2 2h10v9H3z" /><path d="M3 8.5V5h6l2 2" /></svg>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buttonLabel}</span>
      </span>
    </label>
  </Field>;
}

function StatusToggle({ active, onChange }: { active: boolean; onChange: (active: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={active} aria-label="Company status" onClick={() => onChange(!active)} style={{ width: 37, height: 20, padding: 2, border: 0, borderRadius: 999, background: active ? '#1372bd' : '#94a3b8', cursor: 'pointer', display: 'inline-flex', justifyContent: active ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
  </button>;
}

function PrimaryFields({ form, setForm, errors, existingLogo }: {
  form: SaveCompanyRequest; setForm: React.Dispatch<React.SetStateAction<SaveCompanyRequest>>; errors: Errors; existingLogo?: boolean;
}) {
  const set = <K extends keyof SaveCompanyRequest>(key: K, value: SaveCompanyRequest[K]) => setForm(current => ({ ...current, [key]: value }));
  const states = regionOptions(form.domicileCountry);
  return <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, minHeight: 22 }}><strong style={{ fontSize: 12 }}>Status :</strong><StatusToggle active={form.status !== 'Inactive'} onChange={active => set('status', active ? 'Active' : 'Inactive')} /></div>
    <LogoField form={form} setForm={setForm} error={errors.logo} existing={existingLogo} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12, rowGap: 10, marginTop: 12 }}>
      <Field label="Company Name" required error={errors.companyName}><TextInput value={form.companyName} onChange={v => set('companyName', v)} maxLength={75} error={errors.companyName} /></Field>
      <Field label="Domicile Country" required error={errors.domicileCountry}><Select value={form.domicileCountry} options={COUNTRIES} error={errors.domicileCountry} onChange={v => setForm(current => ({ ...current, domicileCountry: v, stateOfDomicile: '' }))} /></Field>
      <Field label={stateLabel(form.domicileCountry) + ' of Domicile'} required error={errors.stateOfDomicile}><Select value={form.stateOfDomicile} options={states} error={errors.stateOfDomicile} onChange={v => set('stateOfDomicile', v)} /></Field>
      <Field label="NAIC Code" required error={errors.naicCode}><TextInput value={form.naicCode} onChange={v => set('naicCode', digitsOnly(v, 10))} error={errors.naicCode} /></Field>
      <Field label="Email ID"><TextInput value={form.emailId} onChange={v => set('emailId', v)} maxLength={50} /></Field>
      <Field label="Telephone Number"><PhoneInput value={form.telephoneNumber} cc={form.telephoneNumberCc} onChange={v => set('telephoneNumber', v)} onCcChange={v => set('telephoneNumberCc', v)} /></Field>
      <Field label="Extension"><ExtensionInput value={form.extension} onChange={v => set('extension', v)} /></Field>
      <Field label="Federal Tax ID" required error={errors.federalTaxId}><TextInput value={form.federalTaxId} onChange={v => set('federalTaxId', formatFederalTaxId(v))} maxLength={10} error={errors.federalTaxId} /></Field>
      <Field label="URL" style={{ gridColumn: '1 / -1' }}><TextInput value={form.url} onChange={v => set('url', v)} maxLength={200} /></Field>
      <Field label="Business Description" error={errors.businessDescription} style={{ gridColumn: '1 / -1' }}><TextInput textarea value={form.businessDescription} onChange={v => set('businessDescription', v)} maxLength={BUSINESS_DESCRIPTION_MAX} error={errors.businessDescription} /></Field>
    </div>
  </div>;
}

function AddressFormBlock({ title, type, value, setValue, errors, legal }: {
  title: string; type: 'Legal' | 'Mailing'; value: SaveAddressRequest; setValue: (value: SaveAddressRequest) => void; errors: Errors; legal?: SaveAddressRequest;
}) {
  const same = Boolean(value.isSameAsLegal);
  const update = (fn: (previous: AddressForm) => AddressForm) => setValue({ ...fn(value), addressType: type });
  const toggleSame = (checked: boolean) => setValue(checked && legal
    ? { ...legal, addressType: 'Mailing', isSameAsLegal: true }
    : { ...value, isSameAsLegal: false });
  return <div>
    {title && <div className="cm-company-section-heading"><h3>{title}</h3>{type === 'Mailing' && <label><input type="checkbox" checked={same} onChange={e => toggleSame(e.target.checked)} /> Same as Home Office / Legal Address</label>}</div>}
    <AddressEditor value={value} onChange={update} errors={errors} disabled={same} />
  </div>;
}

function NewCompanyForm({ sequence, onSaved, onToast }: { sequence: number; onSaved: () => Promise<void> | void; onToast: (message: string, ok?: boolean) => void }) {
  const [form, setForm] = useState(blankCompany);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const nextErrors = validateCompanyForm(form); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { onToast('Please fill all the mandatory field of contact details with valid data before saving...', false); return; }
    setSaving(true);
    try { await clientManagementApi.saveCompany(form); await onSaved(); onToast('Company saved.'); }
    catch (error) { onToast(apiErrorMessage(error, 'Failed to save company.'), false); }
    finally { setSaving(false); }
  };
  const setAddress = (key: 'legalAddress' | 'mailingAddress', value: SaveAddressRequest) => setForm(current => ({ ...current, [key]: value }));
  const generatedCompanyCode = String(sequence).padStart(5, '0');
  return <div className="cm-scope cm-company-form">
    <div className="cm-company-layout">
      <div className="cm-company-primary-column">
        <div className="cm-company-section cm-company-primary-section">
          <h3 className="cm-company-section-title">Company Primary Information</h3>
      <div style={{ background: '#e5faf2', marginBottom: 14, padding: '10px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}><strong style={{ color: '#006b4f' }}>Client Company ID - {generatedCompanyCode}</strong><span style={{ fontSize: 9 }}>Auto Generated</span></div>
          <PrimaryFields form={form} setForm={setForm} errors={errors} />
        </div>
      </div>
      <div className="cm-company-detail-column">
        <div className="cm-company-section">
      <AddressFormBlock title="Home Office / Legal Address" type="Legal" value={form.legalAddress!} setValue={v => setAddress('legalAddress', v)} errors={prefixErrors('legal.', errors)} />
    </div>
    <div className="cm-company-section">
      <AddressFormBlock title="Mailing Address" type="Mailing" value={form.mailingAddress!} legal={form.legalAddress} setValue={v => setAddress('mailingAddress', v)} errors={prefixErrors('mailing.', errors)} />
    </div>
    <div className="cm-company-section"><h3 className="cm-company-section-title">Contact Details</h3><ContactListEditor primary={form.primaryContact!} secondaries={form.secondaryContacts ?? []} onPrimaryChange={v => setForm(c => ({ ...c, primaryContact: v }))} onSecondariesChange={v => setForm(c => ({ ...c, secondaryContacts: v }))} errors={errors} cols={3} /></div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 2px' }}><button type="button" style={{ ...secondaryButton, width: 106, height: 28, borderColor: blue, borderRadius: 2, fontSize: 11 }} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button></div>
      </div>
    </div>
  </div>;
}

function prefixErrors(prefix: string, errors: Errors) {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key.startsWith(prefix)).map(([key, value]) => [key.slice(prefix.length), value]));
}

function AddressRead({ address }: { address?: AddressDto }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px 12px' }}>
    <DashField label="Address Line 1" value={address?.addressLine1} /><DashField label="Address Line 2" value={address?.addressLine2} />
    <DashField label="Country" value={address?.country} /><DashField label={stateLabel(address?.country)} value={address?.state} /><DashField label="City" value={address?.city} />
    <DashField label="County" value={address?.county} /><DashField label="Zip Code" value={address?.zipCode} /><DashField label="Latitude" value={address?.latitude} /><DashField label="Longitude" value={address?.longitude} />
  </div>;
}

function ContactRead({ company }: { company: CompanyDto }) {
  const contacts = [company.primaryContact, ...company.secondaryContacts].filter(Boolean) as ContactDto[];
  return <>{contacts.length === 0 ? <div style={{ color: '#64748b' }}>-</div> : contacts.map((contact, index) => <div key={contact.id ?? index} style={{ marginTop: index ? 18 : 0 }}>
    <strong style={{ fontSize: 12 }}>{index ? `Secondary Contact ${index}` : 'Primary Contact'}</strong>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px 12px', marginTop: 10 }}>
      <DashField label="Name" value={contact.name} /><DashField label="Suffix" value={contact.suffix} /><DashField label="Title" value={contact.title} />
      <DashField label="Email ID" value={contact.emailId} /><DashField label="Telephone Number" value={formatPhoneWithFlag(contact.telephoneNumber, contact.telephoneNumberCc)} /><DashField label="Extension" value={contact.extension} />
      <DashField label="Alternative Telephone Number" value={formatPhoneWithFlag(contact.altTelephoneNumber, contact.altTelephoneNumberCc)} />
    </div>
  </div>)}</>;
}

type CompanyEdit = 'primary' | 'legal' | 'mailing' | 'contacts' | null;

function CompanyDetails({ company, refresh, toast }: { company: CompanyDto; refresh: () => Promise<void> | void; toast: (message: string, ok?: boolean) => void }) {
  const [editing, setEditing] = useState<CompanyEdit>(null);
  const [form, setForm] = useState(() => companyRequest(company));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(companyRequest(company)); }, [company]);
  const begin = (mode: CompanyEdit) => { setForm(companyRequest(company)); setErrors({}); setEditing(mode); };
  const save = async () => {
    const next = validateCompanyForm(form, Boolean(company.logoBase64)); setErrors(next);
    if (Object.keys(next).length) { toast('Please fill all the mandatory field of contact details with valid data before saving...', false); return; }
    setSaving(true);
    try { await clientManagementApi.saveCompany(form); await refresh(); setEditing(null); toast('Company saved.'); }
    catch (error) { toast(apiErrorMessage(error, 'Failed to save company.'), false); }
    finally { setSaving(false); }
  };
  const actions = <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><button style={secondaryButton} disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button style={primaryButton} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</button></div>;
  return <div style={{ padding: 16, background: '#f8fafc' }} className="cm-scope">
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, .9fr) minmax(460px, 1.35fr)', gap: 16 }}>
      <section style={section}><SectionTitle onEdit={editing ? undefined : () => begin('primary')}>Primary Information</SectionTitle>
        {editing === 'primary' ? <><PrimaryFields form={form} setForm={setForm} errors={errors} existingLogo />{actions}</> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '18px 14px' }}>
          <DashField label="Company Name" value={company.companyName} /><DashField label="Domicile Country" value={company.domicileCountry} /><DashField label="State of Domicile" value={company.stateOfDomicile} /><DashField label="NAIC Code" value={company.naicCode} /><DashField label="Client Company ID" value={company.companyCode} /><DashField label="Status" value={company.status} /><DashField label="Email ID" value={company.emailId} /><DashField label="Telephone Number" value={formatPhoneWithFlag(company.telephoneNumber, company.telephoneNumberCc)} /><DashField label="Extension" value={company.extension} /><DashField label="Federal Tax ID" value={company.federalTaxId} /><DashField label="Client URL" value={company.url} /><DashField label="Business Description" value={company.businessDescription} />
        </div>}
      </section>
      <div style={{ display: 'grid', gap: 16 }}>
        {(['legal', 'mailing'] as const).map(mode => {
          const isLegal = mode === 'legal'; const address = isLegal ? company.legalAddress : company.mailingAddress; const key = isLegal ? 'legalAddress' : 'mailingAddress';
          return <section style={section} key={mode}><SectionTitle onEdit={editing ? undefined : () => begin(mode)}>{isLegal ? 'Home Office / Legal Address' : 'Mailing Address'}</SectionTitle>
            {editing === mode ? <><AddressFormBlock title="" type={isLegal ? 'Legal' : 'Mailing'} value={form[key]!} legal={form.legalAddress} setValue={value => setForm(current => ({ ...current, [key]: value }))} errors={prefixErrors(`${mode}.`, errors)} />{actions}</> : <AddressRead address={address} />}
          </section>;
        })}
        <section style={section}><SectionTitle onEdit={editing ? undefined : () => begin('contacts')}>Contact Details</SectionTitle>
          {editing === 'contacts' ? <><ContactListEditor primary={form.primaryContact!} secondaries={form.secondaryContacts ?? []} onPrimaryChange={value => setForm(current => ({ ...current, primaryContact: value }))} onSecondariesChange={value => setForm(current => ({ ...current, secondaryContacts: value }))} errors={errors} cols={2} />{actions}</> : <ContactRead company={company} />}
        </section>
      </div>
    </div>
  </div>;
}

export function ClientCompanyInformation({ client, refresh, toast, onDraftStateChange }: { client: ClientDetail; refresh: () => Promise<void> | void; toast: (message: string, ok?: boolean) => void; onDraftStateChange?: (active: boolean) => void }) {
  const [expanded, setExpanded] = useState<string | number | null>(null);
  const [draft, setDraft] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  useEffect(() => { onDraftStateChange?.(draft); }, [draft, onDraftStateChange]);
  const toggle = (key: string | number) => setExpanded(current => current === key ? null : key);
  const remove = async () => {
    if (deleteId == null) return;
    try { await clientManagementApi.deleteCompany(deleteId); setDeleteId(null); await refresh(); toast('Company deleted.'); }
    catch (error) { toast(apiErrorMessage(error, 'Failed to delete company.'), false); }
  };
  const rows: Array<{ key: string | number; label: string; company?: CompanyDto }> = client.companies.map(company => ({ key: company.id, label: company.companyName, company }));
  if (draft) rows.push({ key: 'draft', label: `Company ${client.companies.length + 1}` });
  return <div>
    {rows.length === 0 && <div style={{ ...section, textAlign: 'center', color: '#64748b', marginBottom: 12 }}>No companies added yet.</div>}
    {rows.map(row => <div key={row.key} style={{ border: `1px solid ${border}`, borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
        <button type="button" aria-expanded={expanded === row.key} aria-label={`${expanded === row.key ? 'Collapse' : 'Expand'} ${row.label}`} onClick={() => toggle(row.key)} style={{ flex: 1, border: 0, background: 'transparent', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#1d4ed8', fontWeight: 700 }}>
          <span style={{ width: 21, height: 21, borderRadius: '50%', border: '2px solid #93c5fd', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{expanded === row.key ? '−' : '+'}</span>{row.label}
        </button>
        {row.company && <button type="button" aria-label={`Delete ${row.label}`} title="Delete" onClick={() => setDeleteId(row.company!.id)} style={{ width: 48, alignSelf: 'stretch', border: 0, background: 'transparent', color: '#111827', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v6M14 11v6" />
          </svg>
        </button>}
      </div>
      {row.company
        ? expanded === row.key && <CompanyDetails company={row.company} refresh={refresh} toast={toast} />
        : <div hidden={expanded !== row.key}><NewCompanyForm sequence={client.companies.length + 1} onSaved={async () => { setDraft(false); setExpanded(null); await refresh(); }} onToast={toast} /></div>}
    </div>)}
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button type="button" style={{ ...secondaryButton, height: 37, padding: '0 14px', borderColor: blue, borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }} onClick={() => { setDraft(true); setExpanded('draft'); }}><AddCompanyIcon /><span>Add Company</span></button></div>
    {deleteId != null && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1200, display: 'grid', placeItems: 'center' }}><div role="dialog" aria-modal="true" style={{ background: '#fff', padding: 28, width: 390, borderRadius: 6, textAlign: 'center' }}><h3>Delete company</h3><p style={{ color: '#64748b', fontSize: 13 }}>Are you sure you want to delete this? This action cannot be undone.</p><div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}><button style={secondaryButton} onClick={() => setDeleteId(null)}>Cancel</button><button style={{ ...primaryButton, background: '#dc2626' }} onClick={remove}>Delete</button></div></div></div>}
  </div>;
}

const catalogOrder: Record<string, string[]> = {
  Personal: ['Auto', 'Dwelling Fire', 'Homeowners', 'Inland Marine', 'Umbrella'],
  Commercial: ['Auto', 'Business Owners', 'General Liability', 'Inland Marine', 'Property', 'Umbrella', 'Workmen Compensation'],
  Specialty: ['E&S Homeowners'],
};

function JurisdictionDialog({ product, save, close }: { product: ProductAccessDto; save: (states: JurisdictionDto[]) => Promise<void>; close: () => void }) {
  const [states, setStates] = useState<JurisdictionDto[]>([]); const [loadError, setLoadError] = useState('');
  useEffect(() => { clientManagementApi.getJurisdictionStates()
    .then(rows => setStates(rows.map(row => ({ stateCode: row.code, stateName: row.name }))))
    .catch(cause => setLoadError(apiErrorMessage(cause, 'Unable to load states.'))); }, []);
  const [editing, setEditing] = useState(false); const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set(product.jurisdictions.map(j => j.stateCode))); const [saving, setSaving] = useState(false);
  const filtered = states.filter(state => state.stateName.toLowerCase().includes(search.trim().toLowerCase()));
  const all = states.every(state => selected.has(state.stateCode));
  const toggle = (code: string) => setSelected(current => { const next = new Set(current); next.has(code) ? next.delete(code) : next.add(code); return next; });
  const add = async () => { setSaving(true); try { await save(states.filter(state => selected.has(state.stateCode))); close(); } finally { setSaving(false); } };
  return <div style={{ position: 'fixed', inset: 0, zIndex: 1250, background: 'rgba(0,0,0,.42)', display: 'grid', placeItems: 'center' }}><div role="dialog" aria-modal="true" aria-labelledby="jurisdiction-title" style={{ width: 720, maxWidth: 'calc(100vw - 32px)', maxHeight: '82vh', background: '#fff', borderRadius: 6, padding: 22, display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}><h2 id="jurisdiction-title" style={{ fontSize: 16, margin: 0 }}>Set Jurisdiction of Line of Business/Sub-Products</h2><button aria-label="Close" onClick={close} style={{ border: 0, background: 'transparent', fontSize: 20 }}>×</button></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px' }}><strong style={{ fontSize: 13 }}>Selected States ({selected.size})</strong>{!editing && <button aria-label="Edit jurisdictions" onClick={() => setEditing(true)} style={{ border: 0, background: 'transparent', color: blue }}><Pencil /></button>}</div>
    <div style={{ position: 'relative', marginBottom: 10 }}><input aria-label="Search State By Name" placeholder="Search State By Name" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', height: 34, boxSizing: 'border-box', padding: '0 72px 0 10px', border: `1px solid ${border}` }} />{search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 6, top: 4, height: 26, border: 0, background: 'transparent', color: blue }}>Clear</button>}</div>
    <label style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 10 }}><input type="checkbox" disabled={!editing} checked={all} onChange={e => setSelected(e.target.checked ? new Set(states.map(s => s.stateCode)) : new Set())} /> Select All</label>
    {loadError && <div role="alert" style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{loadError}</div>}
    <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, flex: 1 }}>{filtered.map(state => <label key={state.stateCode} style={{ padding: '7px 9px', background: '#f8fafc', display: 'flex', gap: 7, fontSize: 12 }}>
      {editing ? <input type="checkbox" checked={selected.has(state.stateCode)} onChange={() => toggle(state.stateCode)} /> : <span aria-hidden="true" style={{ color: selected.has(state.stateCode) ? '#16a34a' : '#94a3b8' }}>{selected.has(state.stateCode) ? '✓' : '⊘'}</span>}{state.stateName}
    </label>)}</div>
    {editing && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}><button style={secondaryButton} onClick={() => { setSelected(new Set(product.jurisdictions.map(j => j.stateCode))); setEditing(false); }}>Cancel</button><button style={primaryButton} disabled={saving} onClick={add}>{saving ? 'Adding…' : 'Add'}</button></div>}
  </div></div>;
}

export function ClientCompanyProducts({ client, toast }: { client: ClientDetail; toast: (message: string, ok?: boolean) => void }) {
  const [companyId, setCompanyId] = useState<number | null>(client.companies[0]?.id ?? null);
  const [category, setCategory] = useState<'Personal' | 'Commercial' | 'Specialty'>('Personal');
  const [products, setProducts] = useState<ProductAccessDto[]>([]); const [productId, setProductId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false); const [draftIds, setDraftIds] = useState<Set<number>>(new Set()); const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<number | null>(null); const [jurisdiction, setJurisdiction] = useState<ProductAccessDto | null>(null);
  const load = useCallback(async (id: number, preserveProduct?: number | null) => {
    setLoading(true); setError('');
    try { const data = await clientManagementApi.getProductAccess(id); setProducts(data); setProductId(preserveProduct && data.some(p => p.productId === preserveProduct) ? preserveProduct : null); }
    catch (cause) { setError(apiErrorMessage(cause, 'Unable to load company products.')); setProducts([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (companyId != null) void load(companyId); else setProducts([]); }, [companyId, load]);
  const selectedCompany = client.companies.find(c => c.id === companyId); const selected = products.find(p => p.productId === productId);
  const filtered = products.filter(p => p.category === category).sort((a, b) => (catalogOrder[category].indexOf(a.productName) + 1 || 999) - (catalogOrder[category].indexOf(b.productName) + 1 || 999));
  const chooseProduct = (product: ProductAccessDto) => { setProductId(product.productId); setEditing(false); setDraftIds(new Set(product.subProducts.filter(s => s.isSelected).map(s => s.id))); };
  const saveAccess = async (product: ProductAccessDto, ids: number[], jurisdictions = product.jurisdictions) => {
    if (companyId == null) return; setSaving(true);
    try { await clientManagementApi.saveProductAccess(companyId, { productId: product.productId, subProductIds: ids, jurisdictions }); await load(companyId, product.productId); toast('Product access saved.'); setEditing(false); }
    catch (cause) { toast(apiErrorMessage(cause, 'Failed to save product access.'), false); }
    finally { setSaving(false); }
  };
  const removeAccess = async (product: ProductAccessDto) => {
    if (companyId == null) return; setSaving(true);
    try { await clientManagementApi.deleteProductAccess(companyId, product.productId); await load(companyId); toast('Product access removed.'); setProductId(null); setMenu(null); }
    catch (cause) { toast(apiErrorMessage(cause, 'Failed to remove product access.'), false); }
    finally { setSaving(false); }
  };
  if (client.companies.length === 0) return <div style={{ ...section, textAlign: 'center', color: '#64748b' }}>Add a saved company before configuring product access.</div>;
  return <div style={{ border: `1px solid ${border}`, borderRadius: 4, background: '#fff', minHeight: 540, display: 'flex', overflow: 'hidden' }}>
    <aside style={{ width: collapsed ? 46 : 220, borderRight: `1px solid ${border}`, transition: 'width .15s', flexShrink: 0 }}><div style={{ height: 45, display: 'flex', justifyContent: collapsed ? 'center' : 'space-between', alignItems: 'center', padding: '0 12px', background: '#f8fafc' }}>{!collapsed && <strong style={{ fontSize: 12 }}>List Of Companies</strong>}<button aria-label={collapsed ? 'Expand company list' : 'Collapse company list'} onClick={() => setCollapsed(v => !v)} style={{ border: 0, background: 'transparent' }}>{collapsed ? '›' : '‹'}</button></div>
      {!collapsed && client.companies.map(company => <button key={company.id} onClick={() => { setCompanyId(company.id); setCategory('Personal'); setProductId(null); setEditing(false); }} style={{ width: '100%', padding: '12px', border: 0, borderBottom: '1px solid #eef2f7', background: company.id === companyId ? '#eaf4ff' : '#fff', textAlign: 'left', cursor: 'pointer' }}><strong style={{ fontSize: 13 }}>{company.companyName}</strong><div style={{ color: '#64748b', fontSize: 11 }}>{company.companyCode}</div></button>)}
    </aside>
    <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, fontWeight: 700, fontSize: 13 }}>{selectedCompany?.companyName} - Line of Business &amp; Product Access</div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>{(['Personal','Commercial','Specialty'] as const).map(item => <button key={item} onClick={() => { setCategory(item); setProductId(null); setEditing(false); }} style={{ padding: '10px 20px', border: 0, borderBottom: category === item ? `2px solid ${blue}` : '2px solid transparent', background: '#fff', color: category === item ? blue : '#64748b', fontWeight: category === item ? 700 : 400 }}>{item}</button>)}</div>
      {loading ? <div role="status" style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#64748b' }}>Loading product access…</div> : error ? <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}><div style={{ textAlign: 'center', color: '#dc2626' }}>{error}<div><button style={{ ...secondaryButton, marginTop: 12 }} onClick={() => companyId && load(companyId)}>Retry</button></div></div></div> : <div style={{ display: 'grid', gridTemplateColumns: 'minmax(270px, .8fr) minmax(360px, 1.2fr)', flex: 1, minHeight: 0 }}>
        <div style={{ borderRight: `1px solid ${border}`, overflowY: 'auto', background: '#f8fafc' }}>{filtered.map(product => <div key={product.productId} onClick={() => chooseProduct(product)} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #e8edf3', background: productId === product.productId ? '#eaf4ff' : 'transparent', cursor: 'pointer' }}><div style={{ flex: 1 }}><strong style={{ fontSize: 13 }}>{product.productName}</strong><div style={{ color: '#64748b', fontSize: 11 }}>Jurisdiction Count ({product.jurisdictionCount})</div></div><span style={{ fontSize: 12 }}>({product.selectedSubProductCount})</span><div style={{ position: 'relative' }}><button aria-label={`${product.productName} actions`} onClick={event => { event.stopPropagation(); setMenu(menu === product.productId ? null : product.productId); }} style={{ border: 0, background: 'transparent', fontSize: 18 }}>⋮</button>{menu === product.productId && <button onClick={event => { event.stopPropagation(); setJurisdiction(product); setMenu(null); }} style={{ position: 'absolute', right: 0, top: 25, zIndex: 10, width: 185, padding: 9, border: `1px solid ${border}`, background: '#fff', textAlign: 'left' }}>Set State Jurisdiction</button>}</div></div>)}{filtered.length === 0 && <div style={{ padding: 20, color: '#64748b' }}>No lines of business are available.</div>}</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>{selected ? <><div style={{ padding: '12px 16px', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between' }}><strong>{selected.productName} Sub-Products</strong>{!editing && <button aria-label="Edit sub-products" onClick={() => { setDraftIds(new Set(selected.subProducts.filter(s => s.isSelected).map(s => s.id))); setEditing(true); }} style={{ border: 0, background: 'transparent', color: blue }}><Pencil /></button>}</div><div style={{ padding: 16, flex: 1 }}>
          {editing && <label style={{ display: 'flex', gap: 8, marginBottom: 12, fontSize: 13 }}><input type="checkbox" checked={draftIds.size === selected.subProducts.length && selected.subProducts.length > 0} onChange={event => setDraftIds(event.target.checked ? new Set(selected.subProducts.map(s => s.id)) : new Set())} /> All Access</label>}
          {selected.subProducts.map(sub => <label key={sub.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderBottom: '1px solid #eef2f7', fontSize: 13 }}>{editing ? <input type="checkbox" checked={draftIds.has(sub.id)} onChange={() => setDraftIds(current => { const next = new Set(current); next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id); return next; })} /> : <span style={{ color: sub.isSelected ? '#16a34a' : '#94a3b8' }}>{sub.isSelected ? '✓' : '⊘'}</span>}{sub.subProductName}</label>)}
          {editing && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><button style={secondaryButton} disabled={saving} onClick={() => { setEditing(false); setDraftIds(new Set(selected.subProducts.filter(s => s.isSelected).map(s => s.id))); }}>Cancel</button><button style={primaryButton} disabled={saving} onClick={() => saveAccess(selected, [...draftIds])}>{saving ? 'Saving…' : 'Save'}</button></div>}
        </div></> : <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: '#64748b' }}>Please select LOB to view the subproducts</div>}</div>
      </div>}
      <footer style={{ padding: '10px 16px', background: '#f8fafc', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'flex-end', gap: 24, fontSize: 12 }}><span>Total Line of Business Selected - <strong>{products.filter(p => p.selectedSubProductCount > 0).length}</strong></span><span>Total Sub Products Selected - <strong>{products.reduce((sum, p) => sum + p.selectedSubProductCount, 0)}</strong></span></footer>
    </main>
    {jurisdiction && <JurisdictionDialog product={jurisdiction} close={() => setJurisdiction(null)} save={states => saveAccess(jurisdiction, jurisdiction.subProducts.filter(s => s.isSelected).map(s => s.id), states)} />}
  </div>;
}
