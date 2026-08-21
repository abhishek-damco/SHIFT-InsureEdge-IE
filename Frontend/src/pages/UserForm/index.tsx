import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usersApi, referenceApi } from '../../api/users';
import type { CountryRow, StateRow, GroupRow, ManagerRow, OptionRow, ModuleRow, PermissionInput } from '../../types/User';
import SearchableSelect from '../../components/ui/SearchableSelect';
import PermissionsGrid from './PermissionsGrid';

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
  dateOfBirth: string; gender: string;
  isRemoteWorking: boolean; isManager: boolean;
  officeLocation: string; groupId: string; department: string; reportsTo: string;
  sameAsOffice: boolean;
  addressLine1: string; addressLine2: string;
  country: string; state: string; city: string; zipCode: string;
  latitude: string; longitude: string;
  telephone: string; extension: string; altTelephone: string; email: string;
}

const EMPTY: FormState = {
  status: true,
  firstName: '', middleName: '', lastName: '', suffix: '',
  dateOfBirth: '', gender: '',
  isRemoteWorking: true, isManager: false,
  officeLocation: '', groupId: '', department: '', reportsTo: '',
  sameAsOffice: false,
  addressLine1: '', addressLine2: '', country: '', state: '', city: '', zipCode: '',
  latitude: '', longitude: '',
  telephone: '', extension: '', altTelephone: '', email: '',
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
  name: string; value: boolean;
  onChange: (v: boolean) => void;
  options?: [string, string];
}) {
  const [yes, no] = options ?? ['Yes', 'No'];
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={value} onChange={() => onChange(true)}
          style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
        {yes}
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={!value} onChange={() => onChange(false)}
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
  const [userCode, setUserCode] = useState('IE0001');

  useEffect(() => {
    referenceApi.countries().then(setCountries).catch(() => {});
    referenceApi.groups().then(setGroups).catch(() => {});
    referenceApi.managers().then(setManagers).catch(() => {});
    referenceApi.officeLocations().then(setOfficeOpts).catch(() => {});
    referenceApi.modules().then(data => {
      setModules(data);
      setPermissions(data.flatMap(m => m.screens.map(s => ({
        screenId: s.id,
        isViewPermission: false, isCreatePermission: false, isEditPermission: false,
        isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false,
        isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false, allAccess: false,
      }))));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.country) referenceApi.states(form.country).then(setStates).catch(() => setStates([]));
    else setStates([]);
  }, [form.country]);

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
        return Array.from(map.values());
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
        dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).split('T')[0] : '',
        gender: u.gender ?? '',
        isRemoteWorking: u.isRemoteWorking, isManager: u.isManager,
        officeLocation: u.officeLocation ?? '',
        groupId: u.groups?.[0]?.id ? String(u.groups[0].id) : '',
        department: u.department ?? '',
        reportsTo: u.reportsTo ? String(u.reportsTo) : '',
        sameAsOffice: false,
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

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        firstName: form.firstName, middleName: form.middleName || undefined,
        lastName: form.lastName, suffix: form.suffix || undefined,
        email: form.email, dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        isRemoteWorking: form.isRemoteWorking, isManager: form.isManager,
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
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSaving(false); }
  }

  const groupOpts = groups.map(g => ({ value: String(g.id), label: g.groupName }));
  const managerOpts = managers.map(m => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }));
  const countryOpts = countries.map(c => ({ value: c.code, label: c.name }));
  const stateOpts = states.map(s => ({ value: s.code, label: s.name }));
  const addrDisabled = form.sameAsOffice;

  const card: React.CSSProperties = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
    boxShadow: '0 1px 3px rgba(15,23,42,0.07)', overflow: 'hidden', marginBottom: 16,
  };
  const cardBody: React.CSSProperties = { padding: '0 20px 20px' };
  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 };
  const field: React.CSSProperties = { marginBottom: 14 };

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

      <form id="user-form" onSubmit={handleSubmit} style={{ flex: 1, padding: 16 }}>
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
                <div><Label required>First Name</Label><input required value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} /></div>
                <div><Label>Middle / Initial Name</Label><input value={form.middleName} onChange={e => set('middleName', e.target.value)} style={inputStyle} /></div>
              </div>

              <div style={row2}>
                <div><Label required>Last Name</Label><input required value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} /></div>
                <div><Label>Suffix</Label><input value={form.suffix} onChange={e => set('suffix', e.target.value)} placeholder="e.g. Jr." style={inputStyle} /></div>
              </div>

              <div style={row2}>
                <div><Label>Date of Birth</Label><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} /></div>
                <div>
                  <Label required>Gender</Label>
                  <StyledSelect value={form.gender} onChange={v => set('gender', v)} placeholder="Select"
                    options={GENDERS.map(g => ({ value: g, label: g }))} />
                </div>
              </div>

              <div style={field}>
                <Label required>Works Remotely</Label>
                <RadioGroup name="remote" value={form.isRemoteWorking} onChange={v => set('isRemoteWorking', v)} />
              </div>

              <div style={field}>
                <Label required>Office Location</Label>
                <SearchableSelect options={officeOpts} value={form.officeLocation} onChange={v => set('officeLocation', v)} placeholder="Select..." />
              </div>

              <div style={field}>
                <Label required>Group</Label>
                <SearchableSelect options={groupOpts} value={form.groupId} onChange={v => set('groupId', v)} placeholder="Select..." />
              </div>

              <div style={field}>
                <Label required>Department / Function</Label>
                <SearchableSelect options={DEPARTMENTS} value={form.department} onChange={v => set('department', v)} placeholder="Select..." />
              </div>

              <div style={row2}>
                <div>
                  <Label required>Is a Manager</Label>
                  <RadioGroup name="manager" value={form.isManager} onChange={v => set('isManager', v)} />
                </div>
                <div>
                  <Label>Reports To</Label>
                  <StyledSelect value={form.reportsTo} onChange={v => set('reportsTo', v)} placeholder="Select..." options={managerOpts} />
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

                <div style={row2}>
                  <div>
                    <Label required>Address Line 1</Label>
                    <input value={form.addressLine1} disabled={addrDisabled} onChange={e => set('addressLine1', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                  <div>
                    <Label>Address Line 2</Label>
                    <input value={form.addressLine2} disabled={addrDisabled} onChange={e => set('addressLine2', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                </div>

                <div style={row3}>
                  <div>
                    <Label required>Country</Label>
                    <SearchableSelect options={countryOpts} value={form.country} onChange={v => set('country', v)} placeholder="Select..." disabled={addrDisabled} />
                  </div>
                  <div>
                    <Label required>State</Label>
                    <SearchableSelect options={stateOpts} value={form.state} onChange={v => set('state', v)} placeholder="Select..." disabled={addrDisabled || !form.country} />
                  </div>
                  <div>
                    <Label required>City</Label>
                    <input value={form.city} disabled={addrDisabled} onChange={e => set('city', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                </div>

                <div style={row3}>
                  <div>
                    <Label required>Zip Code</Label>
                    <input value={form.zipCode} disabled={addrDisabled} onChange={e => set('zipCode', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                  <div>
                    <Label>Latitude</Label>
                    <input value={form.latitude} disabled={addrDisabled} onChange={e => set('latitude', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <input value={form.longitude} disabled={addrDisabled} onChange={e => set('longitude', e.target.value)}
                      style={addrDisabled ? disabledInputStyle : inputStyle} />
                  </div>
                </div>
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
                      <input required value={form.telephone} onChange={e => set('telephone', formatPhone(e.target.value))}
                        placeholder="(###) ###-####"
                        style={{ ...inputStyle, borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                    </div>
                  </div>
                  <div>
                    <Label>Extension</Label>
                    <input value={form.extension} onChange={e => set('extension', e.target.value)} style={inputStyle} />
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
                      <input value={form.altTelephone} onChange={e => set('altTelephone', formatPhone(e.target.value))}
                        placeholder="(###) ###-####"
                        style={{ ...inputStyle, borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                    </div>
                  </div>
                  <div>
                    <Label required>Email ID</Label>
                    <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} />
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
