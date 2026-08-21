import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adjustersApi } from '../api/adjusters';
import type { TempAdjusterDto, TempAdjusterLicenseDto, UpsertTempAdjusterRequest } from '../types/Adjuster';

const inputStyle: CSSProperties = { height: 34, border: '1px solid #aeb7c2', borderRadius: 3, background: '#f6f8fb', padding: '0 10px', fontSize: 13, width: '100%' };
const panelStyle: CSSProperties = { border: '1px solid #d8dee6', borderRadius: 4, background: '#fff', padding: 16, marginBottom: 16 };
const claimAccessRows = ['Claims Inquiry', 'Claims Dashboard', 'FNOL Registration', 'Bulk Claim Upload', 'Claims Authority', 'Adjuster Management', 'Payee List', 'Catastrophic Events', 'Claim Letter Template', 'Claims Master Configuration', 'Claim Summary', 'Loss Information', 'Claim Review', 'Documents', 'Financials - Worksheet', 'Financials - Claims Payee', 'Insured & Policy', 'Claim Escalation', 'Recovery', 'Claim Referred', 'Under Litigation', 'Task', 'Templates', 'Claim Letters'];
const permissionColumns = ['View', 'Add', 'Edit', 'Clone', 'Upload', 'Download', 'Sensitive Data', 'Sensitive Documents', 'Approve/Reject'];

type Section = 'primary' | 'contact' | 'registered' | 'mailing' | 'license' | 'payment' | 'access' | null;
type FormKey = keyof UpsertTempAdjusterRequest;

const emptyForm: UpsertTempAdjusterRequest = {
  firstName: '', middleName: '', lastName: '', dateOfBirth: '', ssn: '', taxId: '', role: '', adjusterType: '', status: '', claimTypesHandled: '', territoryType: '', territoriesAssigned: '', preferredCommunication: '', telephoneNumber: '', extension: '', alternativeTelephoneNumber: '', emailId: '', registeredAddressLine1: '', registeredAddressLine2: '', registeredCountry: '', registeredState: '', registeredCity: '', registeredCounty: '', registeredZipCode: '', registeredLatitude: '', registeredLongitude: '', mailingAddressLine1: '', mailingAddressLine2: '', mailingCountry: '', mailingState: '', mailingCity: '', mailingCounty: '', mailingZipCode: '', mailingLatitude: '', mailingLongitude: '', paymentMethod: '', ratePerHour: '', complianceFlag: '', accessJson: '', licenses: []
};

function toRequest(data: TempAdjusterDto): UpsertTempAdjusterRequest {
  const { id: _id, userCode: _userCode, createdOn: _createdOn, ...rest } = data;
  return rest;
}

function PencilIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}

function SectionTitle({ title, editing, onEdit }: { title: string; editing: boolean; onEdit: () => void }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}><h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>{title}</h2>{!editing && <button type="button" onClick={onEdit} title="Edit" style={{ background: 'transparent', color: '#111827', padding: 4 }}><PencilIcon /></button>}</div>;
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}><div style={{ fontSize: 12, color: '#334155', marginBottom: 5 }}>{label}</div><div style={{ fontSize: 14, color: '#000', fontWeight: 500 }}>{value || '-'}</div></div>;
}

function EditField({ label, value, onChange }: { label: string; value?: string | null; onChange: (value: string) => void }) {
  return <label style={{ display: 'grid', gap: 6, fontSize: 13, color: '#000', fontWeight: 500 }}>{label}<input value={value ?? ''} onChange={event => onChange(event.target.value)} style={inputStyle} /></label>;
}

function Actions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}><button type="button" onClick={onCancel} className="btn-secondary" style={{ fontSize: 13 }}>Cancel</button><button type="button" onClick={onSave} disabled={saving} className="btn-primary" style={{ fontSize: 13 }}>{saving ? 'Saving...' : 'Save'}</button></div>;
}

function Panel({ children }: { children: ReactNode }) {
  return <section style={panelStyle}>{children}</section>;
}

function ProfileImage() {
  return <div style={{ height: 166, background: '#f7f8fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><div style={{ width: 144, height: 144, background: '#d8d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="86" height="86" viewBox="0 0 24 24" fill="#b7b7b7"><path d="M12 12c2.7 0 4-2.2 4-5s-1.3-5-4-5-4 2.2-4 5 1.3 5 4 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" /></svg></div></div>;
}

export default function AdjusterDetailPage() {
  const { id } = useParams();
  const adjusterId = Number(id);
  const navigate = useNavigate();
  const [record, setRecord] = useState<TempAdjusterDto | null>(null);
  const [form, setForm] = useState<UpsertTempAdjusterRequest>(emptyForm);
  const [editing, setEditing] = useState<Section>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [accessPerms, setAccessPerms] = useState<Record<string, string[]>>({});
  const [savedAccessPerms, setSavedAccessPerms] = useState<Record<string, string[]>>({});

  function parseAccessPerms(ajson?: string | null): Record<string, string[]> {
    try { return JSON.parse(ajson ?? '{}').accessPerms ?? {}; } catch { return {}; }
  }

  useEffect(() => {
    let active = true;
    adjustersApi.getById(adjusterId).then(data => {
      if (!active) return;
      setRecord(data);
      setForm(toRequest(data));
      const p = parseAccessPerms(data.accessJson);
      setAccessPerms(p);
      setSavedAccessPerms(p);
    }).catch(() => setError('Unable to load adjuster details.'));
    return () => { active = false; };
  }, [adjusterId]);

  const togglePerm = (screen: string, perm: string, checked: boolean) =>
    setAccessPerms(prev => {
      const curr = prev[screen] ?? [];
      return { ...prev, [screen]: checked ? [...curr, perm] : curr.filter(p => p !== perm) };
    });

  const setValue = (key: FormKey, value: string) => setForm(current => ({ ...current, [key]: value }));
  const saveSection = async () => {
    setSaving(true);
    setError('');
    try {
      let payload = form;
      if (editing === 'access') {
        // Merge accessPerms into the existing accessJson blob
        let existing: Record<string, unknown> = {};
        try { existing = JSON.parse(form.accessJson ?? '{}'); } catch { /* ignore */ }
        payload = { ...form, accessJson: JSON.stringify({ ...existing, accessPerms }) };
      }
      const saved = await adjustersApi.update(adjusterId, payload);
      setRecord(saved);
      setForm(toRequest(saved));
      if (editing === 'access') {
        setSavedAccessPerms(accessPerms);
      }
      setEditing(null);
    } catch {
      setError('Unable to save adjuster details. Please check the API/database connection.');
    } finally {
      setSaving(false);
    }
  };
  const cancelEdit = () => {
    if (record) {
      setForm(toRequest(record));
      setAccessPerms(savedAccessPerms);
    }
    setEditing(null);
  };
  const licenseRows = form.licenses ?? [];
  const updateLicense = (index: number, key: keyof TempAdjusterLicenseDto, value: string) => setForm(current => ({ ...current, licenses: (current.licenses ?? []).map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }));

  if (error && !record) return <div style={{ padding: 16, background: '#fff', minHeight: '100%' }}>{error}</div>;
  if (!record) return <div style={{ padding: 16, background: '#fff', minHeight: '100%' }}>Loading...</div>;

  const primaryFields: [string, FormKey][] = [['First Name', 'firstName'], ['Middle Name / Initial', 'middleName'], ['Last Name', 'lastName'], ['Date of Birth', 'dateOfBirth'], ['SSN', 'ssn'], ['Tax ID', 'taxId'], ['Role', 'role'], ['Adjuster Type', 'adjusterType'], ['Status', 'status'], ['Claim Types Handled', 'claimTypesHandled'], ['Territory Type', 'territoryType'], ['Territories Assigned', 'territoriesAssigned']];
  const contactFields: [string, FormKey][] = [['Preferred Mode of Communication', 'preferredCommunication'], ['Telephone Number', 'telephoneNumber'], ['Extension', 'extension'], ['Alternative Telephone Number', 'alternativeTelephoneNumber'], ['Email ID', 'emailId']];
  const registeredFields: [string, FormKey][] = [['Address Line 1', 'registeredAddressLine1'], ['Address Line 2', 'registeredAddressLine2'], ['Country', 'registeredCountry'], ['State', 'registeredState'], ['City', 'registeredCity'], ['County', 'registeredCounty'], ['Zip Code', 'registeredZipCode'], ['Latitude', 'registeredLatitude'], ['Longitude', 'registeredLongitude']];
  const mailingFields: [string, FormKey][] = [['Address Line 1', 'mailingAddressLine1'], ['Address Line 2', 'mailingAddressLine2'], ['Country', 'mailingCountry'], ['State', 'mailingState'], ['City', 'mailingCity'], ['County', 'mailingCounty'], ['Zip Code', 'mailingZipCode'], ['Latitude', 'mailingLatitude'], ['Longitude', 'mailingLongitude']];

  const renderSection = (title: string, section: Section, fields: [string, FormKey][], columns = '1fr 1fr') => <Panel><SectionTitle title={title} editing={editing === section} onEdit={() => setEditing(section)} />{editing === section ? <><div style={{ display: 'grid', gridTemplateColumns: columns, gap: 14 }}>{fields.map(([label, key]) => <EditField key={key} label={label} value={form[key] as string | null | undefined} onChange={value => setValue(key, value)} />)}</div><Actions onCancel={cancelEdit} onSave={saveSection} saving={saving} /></> : <div style={{ display: 'grid', gridTemplateColumns: columns, gap: '22px 16px' }}>{fields.map(([label, key]) => <ReadField key={key} label={label} value={record[key as keyof TempAdjusterDto] as string | null | undefined} />)}</div>}</Panel>;

  return <div style={{ padding: '16px 16px 78px', background: '#fff', minHeight: '100%' }}><h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#111827' }}>View Adjuster</h1><div style={{ fontSize: 12, color: '#0f172a', marginTop: 6, marginBottom: 16 }}>Adjuster Management / Primary Information</div>{error && <div style={{ marginBottom: 12, color: '#b91c1c', fontSize: 13 }}>{error}</div>}<div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 0, border: '1px solid #d8dee6', borderRadius: 4, marginBottom: 16 }}><div style={{ padding: 16, borderRight: '1px solid #d8dee6' }}><Panel><SectionTitle title="User Primary Information" editing={editing === 'primary'} onEdit={() => setEditing('primary')} /><div style={{ height: 42, background: '#e3faef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', color: '#006b3c', marginBottom: 16 }}><strong>User ID - {record.userCode}</strong><span style={{ color: '#000', fontSize: 11 }}>Auto Generated</span></div>{editing === 'primary' ? <><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{primaryFields.map(([label, key]) => <EditField key={key} label={label} value={form[key] as string | null | undefined} onChange={value => setValue(key, value)} />)}</div><Actions onCancel={cancelEdit} onSave={saveSection} saving={saving} /></> : <><ProfileImage /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px 16px' }}>{primaryFields.map(([label, key]) => <ReadField key={key} label={label} value={record[key as keyof TempAdjusterDto] as string | null | undefined} />)}</div></>}</Panel>{renderSection('Contact Details', 'contact', contactFields)}</div><div style={{ padding: 16 }}>{renderSection('Registered Address', 'registered', registeredFields, '1fr 1fr 1fr')}{renderSection('Mailing Address', 'mailing', mailingFields, '1fr 1fr 1fr')}</div></div>
    <Panel><SectionTitle title="Adjuster License Details" editing={editing === 'license'} onEdit={() => setEditing('license')} />{editing === 'license' ? <><div style={{ display: 'grid', gap: 12 }}>{licenseRows.map((row, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 14, alignItems: 'end' }}><EditField label="Licensed States" value={row.licensedState} onChange={value => updateLicense(index, 'licensedState', value)} /><EditField label="License Number" value={row.licenseNumber} onChange={value => updateLicense(index, 'licenseNumber', value)} /><EditField label="License Start Date" value={row.licenseStartDate} onChange={value => updateLicense(index, 'licenseStartDate', value)} /><EditField label="License Expiration Date" value={row.licenseExpirationDate} onChange={value => updateLicense(index, 'licenseExpirationDate', value)} /><button type="button" onClick={() => setForm(current => ({ ...current, licenses: licenseRows.length <= 1 ? licenseRows : licenseRows.filter((_, rowIndex) => rowIndex !== index) }))} style={{ height: 34, background: 'transparent', color: '#111827' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M6 6l1 15h10l1-15" /></svg></button></div>)}</div><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}><button type="button" onClick={() => setForm(current => ({ ...current, licenses: [...(current.licenses ?? []), { licensedState: '', licenseNumber: '', licenseStartDate: '', licenseExpirationDate: '' }] }))} style={{ height: 34, border: '1px solid #0B5AA0', background: '#0B5AA0', color: '#fff', borderRadius: 3, padding: '0 16px', fontWeight: 700 }}>+ Add New Adjuster License</button></div><Actions onCancel={cancelEdit} onSave={saveSection} saving={saving} /></> : <div style={{ display: 'grid', gap: 12 }}>{(record.licenses.length ? record.licenses : [{ licensedState: '-', licenseNumber: '-', licenseStartDate: '-', licenseExpirationDate: '-' }]).map((row, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}><ReadField label="Licensed States" value={row.licensedState} /><ReadField label="License Number" value={row.licenseNumber} /><ReadField label="License Start Date" value={row.licenseStartDate} /><ReadField label="License Expiration Date" value={row.licenseExpirationDate} /></div>)}</div>}</Panel>
    {renderSection('Payment, Audit & Compliance', 'payment', [['Payment Method', 'paymentMethod'], ['Rate per Hour', 'ratePerHour'], ['Compliance Flag', 'complianceFlag']], 'repeat(3, 1fr)')}
    <Panel><SectionTitle title="User Access" editing={editing === 'access'} onEdit={() => setEditing('access')} /><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: 1260, borderCollapse: 'collapse', fontSize: 12 }}><tbody>{claimAccessRows.map(screen => <tr key={screen}><td style={{ width: 210, padding: '11px 12px', border: '1px solid #d6d6d6', fontWeight: 700 }}>{screen}</td>{permissionColumns.map(permission => <td key={permission} style={{ padding: '8px 12px', border: '1px solid #d6d6d6', textAlign: 'center' }}><div style={{ fontWeight: 700, marginBottom: 10 }}>{permission}</div><input type="checkbox" checked={accessPerms[screen]?.includes(permission) ?? false} disabled={editing !== 'access'} onChange={ev => { if (editing === 'access') togglePerm(screen, permission, ev.target.checked); }} style={{ width: 14, height: 14, accentColor: '#0B5AA0' }} /></td>)}</tr>)}</tbody></table></div>{editing === 'access' && <Actions onCancel={cancelEdit} onSave={saveSection} saving={saving} />}</Panel><div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 52, background: '#fff', boxShadow: '0 -2px 8px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 28px', zIndex: 35 }}><button onClick={() => navigate('/claims/adjusters')} style={{ height: 34, minWidth: 134, border: '1px solid #d8dee6', color: '#0B5AA0', background: '#fff', borderRadius: 4, fontSize: 13 }}>Back</button></div></div>;
}
