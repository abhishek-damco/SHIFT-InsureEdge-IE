import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi, referenceApi, sanitizePermissions } from '../../api/users';
import type { CountryRow, StateRow, GroupRow, ManagerRow, OptionRow, ModuleRow, PermissionInput } from '../../types/User';
import SearchableSelect from '../../components/ui/SearchableSelect';
import PermissionsGrid from './PermissionsGrid';
import { AddressFields, type AddressFieldName, type AddressFieldsValue } from '../../components/address/AddressFields';
import * as fv from '../../utils/fieldValidation';

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say'];
const DEPARTMENTS = [
  'Operations', 'Fraud_SIU', 'ProgramManagement', 'VendorManagement',
  'CatastropheManagement', 'UserExperience', 'Underwriting', 'ProductManagement',
  'Actuarial', 'SalesDistribution', 'PolicyAdministration', 'Claims',
  'Reinsurance', 'RiskManagement', 'ComplianceRegulatory', 'Legal',
  'InternalAudit', 'FinanceAccounting', 'DataAnalytics', 'CustomerService',
].map(d => ({ value: d, label: d }));

interface FormState {
  status: boolean;
  firstName: string; middleName: string; lastName: string; suffix: string;
  dateOfBirth: string; // MM-DD-YYYY in the form; converted to/from ISO at the API boundary
  gender: string;
  isRemoteWorking: boolean | null; // null = not chosen yet (required)
  isManager: boolean;
  officeLocation: string; groupId: string; department: string; reportsTo: string;
  sameAsOffice: boolean;
  googleSearch: string; enterManually: boolean;
  addressLine1: string; addressLine2: string;
  country: string; state: string; city: string; zipCode: string;
  latitude: string; longitude: string;
  telephone: string; extension: string; altTelephone: string; email: string;
}

const EMPTY: FormState = {
  status: true,
  firstName: '', middleName: '', lastName: '', suffix: '',
  dateOfBirth: '', gender: '',
  isRemoteWorking: null, isManager: false,
  officeLocation: '', groupId: '', department: '', reportsTo: '',
  sameAsOffice: false,
  googleSearch: '', enterManually: false,
  addressLine1: '', addressLine2: '', country: '', state: '', city: '', zipCode: '',
  latitude: '', longitude: '',
  telephone: '', extension: '', altTelephone: '', email: '',
};

const DOB_MIN = '01-01-1900';

// QA §2 standard messages; keys match FormState field names.
function validateUser(f: FormState, countryName?: string): fv.Errors {
  const e: fv.Errors = {};
  const req = (key: keyof FormState, label: string) => { if (fv.isBlank(f[key] as string)) e[key] = fv.required(label); };
  req('firstName', 'First Name');
  req('lastName', 'Last Name');
  if (f.dateOfBirth && !fv.isValidDate(f.dateOfBirth, DOB_MIN, fv.todayMmDdYyyy())) e.dateOfBirth = fv.invalid('Date of Birth');
  req('gender', 'Gender');
  if (f.isRemoteWorking === null) e.isRemoteWorking = fv.required('Works Remotely');
  req('officeLocation', 'Office Location');
  req('groupId', 'Group');
  req('department', 'Department / Function');
  // Q7 default: a non-manager must report to someone.
  if (!f.isManager) req('reportsTo', 'Reports To');
  req('addressLine1', 'Address Line 1');
  req('country', 'Country');
  if (fv.isBlank(f.state)) e.state = fv.required(fv.stateLabel(countryName));
  req('city', 'City');
  fv.checkZip(e, 'zipCode', f.zipCode, countryName);
  fv.checkPhone(e, 'telephone', f.telephone, 'Telephone Number', true);
  fv.checkExtension(e, 'extension', f.extension);
  fv.checkPhone(e, 'altTelephone', f.altTelephone, 'Alternative Telephone Number');
  fv.checkEmail(e, 'email', f.email, 'Email ID', true);
  return e;
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{msg}</div> : null;
}

function UploadIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', marginBottom: 20 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 5 }}>
      {required && <span style={{ color: '#ef4444', marginRight: 2 }}>*</span>}
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #d1d5db', borderRadius: 4,
  outline: 'none', background: '#fff', boxSizing: 'border-box',
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle, background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed',
};

function StyledSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        style={{
          ...(disabled ? disabledInputStyle : inputStyle),
          appearance: 'none', paddingRight: 28,
        }}
      >
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
      </span>
    </div>
  );
}

function RadioGroup({ name, value, onChange, options }: {
  name: string; value: boolean | null; // null = neither option selected
  onChange: (v: boolean) => void;
  options?: [string, string];
}) {
  const [yes, no] = options ?? ['Yes', 'No'];
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={value === true} onChange={() => onChange(true)}
          style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
        {yes}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={value === false} onChange={() => onChange(false)}
          style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
        {no}
      </label>
    </div>
  );
}

export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [states, setStates] = useState<StateRow[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [officeOpts, setOfficeOpts] = useState<OptionRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionInput[]>([]);
  const [permissionsFromGroup, setPermissionsFromGroup] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<fv.Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [userCode, setUserCode] = useState('IE0001');

  useEffect(() => {
    referenceApi.countries().then(setCountries).catch(() => {});
    referenceApi.groups().then(setGroups).catch(() => {});
    referenceApi.managers().then(setManagers).catch(() => {});
    referenceApi.officeLocations().then(setOfficeOpts).catch(() => {});
    referenceApi.modules().then(data => {
      setModules(data);
      setPermissions(sanitizePermissions(data.flatMap(m => m.screens.map(s => ({
        screenId: s.id,
        isViewPermission: false, isCreatePermission: false, isEditPermission: false,
        isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false,
        isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false, allAccess: false,
      })))));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.country) referenceApi.states(form.country).then(setStates).catch(() => setStates([]));
    else setStates([]);
  }, [form.country]);

  // Google returns a state name; User Management persists the reference-state code.
  // Normalize only after the selected country's options have been loaded.
  useEffect(() => {
    const match = states.find(state => state.name === form.state);
    if (match && match.code !== form.state) setForm(current => ({ ...current, state: match.code }));
  }, [states, form.state]);

  useEffect(() => {
    if (!form.groupId || isEdit) return;
    referenceApi.groupPermissions(Number(form.groupId)).then(rows => {
      if (rows.length === 0) return;
      setPermissions(prev => {
        const map = new Map(prev.map(p => [p.screenId, { ...p }]));
        for (const r of rows) {
          const existing = map.get(r.screenId) ?? {
            screenId: r.screenId,
            isViewPermission: false, isCreatePermission: false, isEditPermission: false,
            isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false,
            isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false, allAccess: false,
          };
          const merged = { ...existing, ...r };
          merged.allAccess = [
            merged.isViewPermission, merged.isCreatePermission, merged.isEditPermission,
            merged.isDuplicatePermission, merged.isUploadPermission, merged.isDownloadPermission,
            merged.isViewSensitiveInfo, merged.isAccessSensitiveDoc, merged.isApproveReject,
          ].every(Boolean);
          map.set(r.screenId, merged);
        }
        return sanitizePermissions(Array.from(map.values()));
      });
      setPermissionsFromGroup(true);
    }).catch(() => {});
  }, [form.groupId, isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    usersApi.get(Number(id)).then(u => {
      setUserCode(u.userCode ?? '');
      setForm({
        status: u.status === 'Active',
        firstName: u.firstName ?? '', middleName: u.middleName ?? '',
        lastName: u.lastName ?? '', suffix: u.suffix ?? '',
        dateOfBirth: fv.isoToMmddyyyy(u.dateOfBirth),
        gender: u.gender ?? '',
        isRemoteWorking: u.isRemoteWorking, isManager: u.isManager,
        officeLocation: u.officeLocation ?? '',
        groupId: u.groups?.[0]?.id ? String(u.groups[0].id) : '',
        department: u.department ?? '',
        reportsTo: u.reportsTo ? String(u.reportsTo) : '',
        sameAsOffice: false,
        googleSearch: '', enterManually: false,
        addressLine1: u.addressLine1 ?? '', addressLine2: u.addressLine2 ?? '',
        country: u.countryCode ?? '', state: u.stateCode ?? '',
        city: u.city ?? '', zipCode: u.zipCode ?? '',
        latitude: u.latitude != null ? String(u.latitude) : '',
        longitude: u.longitude != null ? String(u.longitude) : '',
        telephone: u.telephoneNumber ?? '', extension: u.extension ?? '',
        altTelephone: u.altTelephoneNumber ?? '', email: u.email ?? '',
      });
      if (u.permissions) setPermissions(u.permissions.map(p => ({ ...p })));
    }).catch(() => {});
  }, [id, isEdit]);

  const countryName = (code: string) => countries.find(c => c.code === code)?.name ?? code;

  // After the first Save attempt, re-validate on every change so errors clear once valid (D1-X6).
  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (submitted) setErrors(validateUser(next, countryName(next.country)));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validateUser(form, countryName(form.country));
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setError('');
    try {
      const payload = {
        firstName: form.firstName, middleName: form.middleName || undefined,
        lastName: form.lastName, suffix: form.suffix || undefined,
        email: form.email.trim(), dateOfBirth: fv.mmddyyyyToIso(form.dateOfBirth) || undefined,
        gender: form.gender || undefined,
        isRemoteWorking: form.isRemoteWorking === true, isManager: form.isManager,
        officeLocation: form.officeLocation || undefined,
        department: form.department || undefined,
        reportsTo: form.reportsTo ? Number(form.reportsTo) : undefined,
        addressLine1: form.addressLine1 || undefined, addressLine2: form.addressLine2 || undefined,
        countryCode: form.country || undefined, stateCode: form.state || undefined,
        city: form.city || undefined, zipCode: form.zipCode || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        telephoneNumber: form.telephone || undefined, extension: form.extension || undefined,
        altTelephoneNumber: form.altTelephone || undefined,
        groupIds: form.groupId ? [Number(form.groupId)] : [],
        permissions,
      };
      if (isEdit) await usersApi.update(Number(id), payload);
      else await usersApi.create(payload);
      navigate('/users');
    } catch (err: unknown) {
      setError(fv.apiErrorMessage(err, 'Failed to save. Please try again.'));
    } finally { setSaving(false); }
  }

  const groupOpts = groups.map(g => ({ value: String(g.id), label: g.groupName }));
  const managerOpts = managers.map(m => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }));
  const countryOpts = countries.map(c => ({ value: c.code, label: c.name }));
  const stateOpts = states.map(s => ({ value: s.code, label: s.name }));
  const addrDisabled = form.sameAsOffice;
  const addressValue: AddressFieldsValue = {
    googleSearch: form.googleSearch, enterManually: form.enterManually,
    addressLine1: form.addressLine1, addressLine2: form.addressLine2,
    country: form.country, state: form.state, city: form.city, county: '', zipCode: form.zipCode,
    latitude: form.latitude, longitude: form.longitude,
  };
  const setAddress = (field: AddressFieldName, value: string | boolean) => {
    if (field === 'country') {
      const country = countryOpts.find(option => option.value === value || option.label === value)?.value ?? String(value);
      set('country', country); return;
    }
    if (field === 'state') {
      const state = stateOpts.find(option => option.value === value || option.label === value)?.value ?? String(value);
      set('state', state); return;
    }
    if (field === 'county') return;
    const userField: Partial<Record<AddressFieldName, keyof FormState>> = {
      googleSearch: 'googleSearch', enterManually: 'enterManually', addressLine1: 'addressLine1', addressLine2: 'addressLine2',
      city: 'city', zipCode: 'zipCode', latitude: 'latitude', longitude: 'longitude',
    };
    const userKey = userField[field];
    if (userKey) set(userKey, value as never);
  };

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
    boxShadow: '0 1px 3px rgba(15,23,42,0.07)', overflow: 'hidden', marginBottom: 16,
  };
  const cardBody: React.CSSProperties = { padding: '0 20px 20px' };
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 };
  const field: React.CSSProperties = { marginBottom: 14 };
  const fieldStyle = (key: string): React.CSSProperties =>
    errors[key] ? { ...inputStyle, borderColor: '#dc2626' } : inputStyle;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f5f7fa' }}>

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{isEdit ? 'Edit User' : 'Add User'}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>User Management / {isEdit ? 'Edit User' : 'Add User'}</div>
      </div>

      {error && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
          {error}
        </div>
      )}

      {/* noValidate: use the standard inline messages instead of the browser's own pop-ups (D1-18). */}
      <form id="user-form" onSubmit={handleSubmit} noValidate style={{ flex: 1, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* LEFT: User Primary Information */}
          <div style={card}>
            <SectionHeader title="User Primary Information" />
            <div style={cardBody}>

              {/* User ID badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>User ID - {isEdit ? userCode : 'IE0001'}</span>
                <span style={{ fontSize: 11, color: '#16a34a' }}>Auto Generated</span>
              </div>

              {/* Status toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Status :</span>
                <button type="button" onClick={() => set('status', !form.status)}
                  style={{
                    position: 'relative', display: 'inline-flex', width: 40, height: 22,
                    borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: form.status ? '#0B5AA0' : '#d1d5db', transition: 'background 0.2s',
                    padding: 0, flexShrink: 0,
                  }}>
                  <span style={{
                    position: 'absolute', top: 3, left: form.status ? 20 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                  }} />
                </button>
                <span style={{ fontSize: 12, color: form.status ? '#0B5AA0' : '#9ca3af', fontWeight: 500 }}>
                  {form.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Profile image upload */}
              <div style={field}>
                <Label>Upload User Profile Image</Label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f?.type.startsWith('image/')) setImageUrl(URL.createObjectURL(f));
                  }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? '#0B5AA0' : '#d1d5db'}`,
                    borderRadius: 8, padding: '20px 16px',
                    background: dragging ? '#eff6ff' : '#fafafa',
                    cursor: 'pointer', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <>
                      <UploadIcon />
                      <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>Drag and Drop File Here or Select a File</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>Supported formats are PNG, JPEG &amp; GIF.</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>File size : 10 KB - 10 MB</div>
                      <button type="button"
                        onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: '5px 14px', marginTop: 4 }}>
                        Browse File
                      </button>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) setImageUrl(URL.createObjectURL(f)); }} />
              </div>

              <div style={row2}>
                <div><Label required>First Name</Label><input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={fieldStyle('firstName')} /><FieldError msg={errors.firstName} /></div>
                <div><Label>Middle / Initial Name</Label><input value={form.middleName} onChange={e => set('middleName', e.target.value)} style={inputStyle} /></div>
              </div>

              <div style={row2}>
                <div><Label required>Last Name</Label><input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={fieldStyle('lastName')} /><FieldError msg={errors.lastName} /></div>
                <div><Label>Suffix</Label><input value={form.suffix} onChange={e => set('suffix', e.target.value)} placeholder="e.g. Jr." style={inputStyle} /></div>
              </div>

              <div style={row2}>
                <div>
                  <Label>Date of Birth</Label>
                  {/* D1-19/20: MM-DD-YYYY text input, 01-01-1900 to today */}
                  <input value={form.dateOfBirth} onChange={e => set('dateOfBirth', fv.formatDateInput(e.target.value))}
                    placeholder="MM-DD-YYYY" inputMode="numeric" maxLength={10} style={fieldStyle('dateOfBirth')} />
                  <FieldError msg={errors.dateOfBirth} />
                </div>
                <div>
                  <Label required>Gender</Label>
                  <StyledSelect value={form.gender} onChange={v => set('gender', v)} placeholder="Select"
                    options={GENDERS.map(g => ({ value: g, label: g }))} />
                  <FieldError msg={errors.gender} />
                </div>
              </div>

              <div style={field}>
                <Label required>Works Remotely</Label>
                <RadioGroup name="remote" value={form.isRemoteWorking} onChange={v => set('isRemoteWorking', v)} />
                <FieldError msg={errors.isRemoteWorking} />
              </div>

              <div style={field}>
                <Label required>Office Location</Label>
                <SearchableSelect options={officeOpts} value={form.officeLocation} onChange={v => set('officeLocation', v)} placeholder="Select..." />
                <FieldError msg={errors.officeLocation} />
              </div>

              <div style={field}>
                <Label required>Group</Label>
                <SearchableSelect options={groupOpts} value={form.groupId} onChange={v => set('groupId', v)} placeholder="Select..." />
                <FieldError msg={errors.groupId} />
              </div>

              <div style={field}>
                <Label required>Department / Function</Label>
                <SearchableSelect options={DEPARTMENTS} value={form.department} onChange={v => set('department', v)} placeholder="Select..." />
                <FieldError msg={errors.department} />
              </div>

              <div style={row2}>
                <div>
                  <Label required>Is a Manager</Label>
                  <RadioGroup name="manager" value={form.isManager} onChange={v => set('isManager', v)} />
                </div>
                <div>
                  {/* D1-22: mandatory when the user is not a manager */}
                  <Label required={!form.isManager}>Reports To</Label>
                  <StyledSelect value={form.reportsTo} onChange={v => set('reportsTo', v)} placeholder="Select..." options={managerOpts} />
                  <FieldError msg={errors.reportsTo} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT column */}
          <div>

            {/* Address */}
            <div style={card}>
              <SectionHeader title="Address" />
              <div style={cardBody}>

                {/* Same as office */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.sameAsOffice}
                    onChange={async e => {
                      const checked = e.target.checked;
                      set('sameAsOffice', checked);
                      if (checked && form.officeLocation) {
                        try {
                          const addr = await referenceApi.officeAddress(form.officeLocation);
                          if (addr) {
                            setForm(f => ({
                              ...f, sameAsOffice: true,
                              addressLine1: addr.addressLine1 ?? '',
                              addressLine2: addr.addressLine2 ?? '',
                              country: addr.countryCode ?? '',
                              state: addr.stateCode ?? '',
                              city: addr.city ?? '',
                              zipCode: addr.zipCode ?? '',
                              latitude: addr.latitude != null ? String(addr.latitude) : '',
                              longitude: addr.longitude != null ? String(addr.longitude) : '',
                            }));
                          }
                        } catch { /* best-effort */ }
                      }
                    }}
                    style={{ accentColor: '#0B5AA0', width: 14, height: 14 }} />
                  <span style={{ fontSize: 13, color: '#374151' }}>Same as Office Location</span>
                </label>

                <AddressFields
                  value={addressValue}
                  onChange={setAddress}
                  countryOptions={countryOpts}
                  stateOptions={stateOpts}
                  disabled={addrDisabled}
                  showCounty={false}
                  coordinatesReadOnly={false}
                  errors={errors}
                  stateLabel={fv.stateLabel(countryName(form.country))}
                  zipLabel={fv.zipLabel(countryName(form.country))}
                />
              </div>
            </div>

            {/* Contact Details */}
            <div style={card}>
              <SectionHeader title="Contact Details" />
              <div style={cardBody}>

                <div style={row2}>
                  <div>
                    <Label required>Telephone Number</Label>
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '7px 8px', border: '1px solid #d1d5db', borderRight: 'none',
                        borderRadius: '4px 0 0 4px', background: '#f9fafb', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span>
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                      </div>
                      <input value={form.telephone} onChange={e => set('telephone', fv.formatPhone(e.target.value))}
                        placeholder="(###) ###-####" maxLength={14}
                        style={{ ...fieldStyle('telephone'), borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                    </div>
                    <FieldError msg={errors.telephone} />
                  </div>
                  <div>
                    <Label>Extension</Label>
                    {/* D1-23: digits only, max 6 */}
                    <input value={form.extension} onChange={e => set('extension', fv.digitsOnly(e.target.value, 6))}
                      placeholder="######" inputMode="numeric" maxLength={6} style={fieldStyle('extension')} />
                    <FieldError msg={errors.extension} />
                  </div>
                </div>

                <div style={row2}>
                  <div>
                    <Label>Alternative Telephone Number</Label>
                    <div style={{ display: 'flex' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '7px 8px', border: '1px solid #d1d5db', borderRight: 'none',
                        borderRadius: '4px 0 0 4px', background: '#f9fafb', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span>
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                      </div>
                      <input value={form.altTelephone} onChange={e => set('altTelephone', fv.formatPhone(e.target.value))}
                        placeholder="(###) ###-####" maxLength={14}
                        style={{ ...fieldStyle('altTelephone'), borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                    </div>
                    <FieldError msg={errors.altTelephone} />
                  </div>
                  <div>
                    <Label required>Email ID</Label>
                    <input value={form.email} onChange={e => set('email', e.target.value)} maxLength={50} style={fieldStyle('email')} />
                    <FieldError msg={errors.email} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Rights */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>User Rights</span>
            {permissionsFromGroup && (
              <span style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '3px 10px' }}>
                Permissions inherited from group — read only
              </span>
            )}
          </div>
          <div style={{ padding: 20 }}>
            <PermissionsGrid
              modules={modules}
              permissions={permissions}
              onChange={setPermissions}
              readOnly={permissionsFromGroup}
            />
          </div>
        </div>
      </form>

      {/* Footer actions */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" onClick={() => navigate('/users')} className="btn-secondary" style={{ fontSize: 13, padding: '8px 20px' }}>
          Cancel
        </button>
        <button type="submit" form="user-form" disabled={saving} className="btn-primary" style={{ fontSize: 13, padding: '8px 20px' }}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save'}
        </button>
      </div>
    </div>
  );
}
