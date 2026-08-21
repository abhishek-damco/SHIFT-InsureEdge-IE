import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usersApi, referenceApi } from '../../api/users'
import type { UserDetail, CountryRow, StateRow, GroupRow, ManagerRow, OptionRow, ModuleRow, PermissionInput } from '../../types/User'
import SearchableSelect from '../../components/ui/SearchableSelect'
import PermissionsGrid from '../UserForm/PermissionsGrid'

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say']
const DEPARTMENTS = [
  'Operations', 'Fraud_SIU', 'ProgramManagement', 'VendorManagement',
  'CatastropheManagement', 'UserExperience', 'Underwriting', 'ProductManagement',
  'Actuarial', 'SalesDistribution', 'PolicyAdministration', 'Claims',
  'Reinsurance', 'RiskManagement', 'ComplianceRegulatory', 'Legal',
  'InternalAudit', 'FinanceAccounting', 'DataAnalytics', 'CustomerService',
].map(d => ({ value: d, label: d }))

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

type Section = 'primary' | 'address' | 'contact'

interface EditState {
  status: boolean
  firstName: string; middleName: string; lastName: string; suffix: string
  dateOfBirth: string; gender: string
  isRemoteWorking: boolean; isManager: boolean
  officeLocation: string; groupId: string; department: string; reportsTo: string
  addressLine1: string; addressLine2: string
  country: string; state: string; city: string; zipCode: string
  latitude: string; longitude: string
  telephone: string; extension: string; altTelephone: string; email: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #d1d5db', borderRadius: 4,
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 5 }}>
      {required && <span style={{ color: '#ef4444', marginRight: 2 }}>*</span>}
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: value ? '#111827' : '#d1d5db' }}>{value || '–'}</div>
    </div>
  )
}

function StyledSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string; disabled?: boolean
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        style={{
          ...inputStyle,
          appearance: 'none', paddingRight: 28,
          background: disabled ? '#f9fafb' : '#fff',
          color: disabled ? '#9ca3af' : '#111827',
          cursor: disabled ? 'not-allowed' : 'default',
        }}>
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}>
        <ChevronIcon />
      </span>
    </div>
  )
}

function RadioGroup({ name, value, onChange }: { name: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={value} onChange={() => onChange(true)} style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
        Yes
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
        <input type="radio" name={name} checked={!value} onChange={() => onChange(false)} style={{ accentColor: '#0B5AA0', width: 15, height: 15 }} />
        No
      </label>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
  boxShadow: '0 1px 3px rgba(15,23,42,0.07)', overflow: 'visible', marginBottom: 16,
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</span>
      {children}
    </div>
  )
}

function EditButtons({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button type="button" onClick={onCancel} className="btn-secondary" style={{ fontSize: 12, padding: '5px 14px' }}>Cancel</button>
      <button type="button" onClick={onSave} disabled={saving} className="btn-primary" style={{ fontSize: 12, padding: '5px 14px' }}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

export default function ViewUser() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editSection, setEditSection] = useState<Section | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [countries, setCountries] = useState<CountryRow[]>([])
  const [states, setStates] = useState<StateRow[]>([])
  const [groups, setGroups] = useState<GroupRow[]>([])
  const [managers, setManagers] = useState<ManagerRow[]>([])
  const [officeOpts, setOfficeOpts] = useState<OptionRow[]>([])
  const [modules, setModules] = useState<ModuleRow[]>([])
  const [permissions, setPermissions] = useState<PermissionInput[]>([])
  const [rightsEditing, setRightsEditing] = useState(false)
  const [rightsDraft, setRightsDraft] = useState<PermissionInput[]>([])
  const [rightsSearch, setRightsSearch] = useState('')

  useEffect(() => {
    referenceApi.countries().then(setCountries).catch(() => {})
    referenceApi.groups().then(setGroups).catch(() => {})
    referenceApi.managers().then(setManagers).catch(() => {})
    referenceApi.officeLocations().then(setOfficeOpts).catch(() => {})
    referenceApi.modules().then(setModules).catch(() => {})
  }, [])

  useEffect(() => {
    if (edit?.country) referenceApi.states(edit.country).then(setStates).catch(() => setStates([]))
    else setStates([])
  }, [edit?.country])

  // Also load states for view mode (to resolve state code → name)
  useEffect(() => {
    if (user?.countryCode) referenceApi.states(user.countryCode).then(setStates).catch(() => {})
  }, [user?.countryCode])

  function loadUser() {
    if (!id) return
    setLoading(true)
    usersApi.get(Number(id)).then(u => {
      setUser(u)
      setPermissions(u.permissions ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }
  useEffect(loadUser, [id])

  function startEdit(section: Section) {
    if (!user) return
    setEdit({
      status: user.status === 'Active',
      firstName: user.firstName ?? '', middleName: user.middleName ?? '',
      lastName: user.lastName ?? '', suffix: user.suffix ?? '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user.gender ?? '',
      isRemoteWorking: user.isRemoteWorking, isManager: user.isManager,
      officeLocation: user.officeLocation ?? '',
      groupId: user.groups?.[0]?.id ? String(user.groups[0].id) : '',
      department: user.department ?? '',
      reportsTo: user.reportsTo ? String(user.reportsTo) : '',
      addressLine1: user.addressLine1 ?? '', addressLine2: user.addressLine2 ?? '',
      country: user.countryCode ?? '', state: user.stateCode ?? '',
      city: user.city ?? '', zipCode: user.zipCode ?? '',
      latitude: user.latitude != null ? String(user.latitude) : '',
      longitude: user.longitude != null ? String(user.longitude) : '',
      telephone: user.telephoneNumber ?? '', extension: user.extension ?? '',
      altTelephone: user.altTelephoneNumber ?? '', email: user.email ?? '',
    })
    setEditSection(section)
    setSaveError('')
  }

  function cancelEdit() { setEditSection(null); setEdit(null); setSaveError('') }

  function setF<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEdit(f => f ? { ...f, [key]: value } : f)
  }

  async function saveSection() {
    if (!edit || !user) return
    setSaving(true); setSaveError('')
    try {
      await usersApi.update(Number(id), {
        firstName: edit.firstName, middleName: edit.middleName || undefined,
        lastName: edit.lastName, suffix: edit.suffix || undefined,
        email: edit.email, dateOfBirth: edit.dateOfBirth || undefined,
        gender: edit.gender || undefined,
        isRemoteWorking: edit.isRemoteWorking, isManager: edit.isManager,
        officeLocation: edit.officeLocation || undefined,
        department: edit.department || undefined,
        reportsTo: edit.reportsTo ? Number(edit.reportsTo) : undefined,
        addressLine1: edit.addressLine1 || undefined, addressLine2: edit.addressLine2 || undefined,
        countryCode: edit.country || undefined, stateCode: edit.state || undefined,
        city: edit.city || undefined, zipCode: edit.zipCode || undefined,
        latitude: edit.latitude ? Number(edit.latitude) : undefined,
        longitude: edit.longitude ? Number(edit.longitude) : undefined,
        telephoneNumber: edit.telephone || undefined, extension: edit.extension || undefined,
        altTelephoneNumber: edit.altTelephone || undefined,
        groupIds: edit.groupId ? [Number(edit.groupId)] : [],
        permissions: user.permissions ?? [],
      })
      cancelEdit()
      loadUser()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setSaving(false) }
  }

  async function saveRights() {
    if (!user) return
    setSaving(true)
    try {
      await usersApi.update(Number(id), {
        firstName: user.firstName, lastName: user.lastName, email: user.email,
        isRemoteWorking: user.isRemoteWorking, isManager: user.isManager,
        groupIds: user.groups?.map(g => g.id) ?? [],
        permissions: rightsDraft,
      })
      setPermissions(rightsDraft)
      setRightsEditing(false)
    } catch { /* ignore */ } finally { setSaving(false) }
  }

  const groupOpts = groups.map(g => ({ value: String(g.id), label: g.groupName }))
  const managerOpts = managers.map(m => ({ value: String(m.id), label: `${m.firstName} ${m.lastName}` }))
  const countryOpts = countries.map(c => ({ value: c.code, label: c.name }))
  const stateOpts = states.map(s => ({ value: s.code, label: s.name }))

  const countryName = user ? (countries.find(c => c.code === user.countryCode)?.name ?? user.countryCode) : ''
  const stateName = user ? (states.find(s => s.code === user.stateCode)?.name ?? user.stateCode) : ''
  const reportsToManager = user?.reportsTo ? managers.find(m => m.id === user.reportsTo) : null
  const managerName = reportsToManager ? `${reportsToManager.firstName} ${reportsToManager.lastName}` : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, fontSize: 13, color: '#9ca3af' }}>
      Loading...
    </div>
  )
  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, fontSize: 13, color: '#9ca3af' }}>
      User not found
    </div>
  )

  const isPrimaryEdit = editSection === 'primary'
  const isAddressEdit = editSection === 'address'
  const isContactEdit = editSection === 'contact'

  const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }
  const row3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }
  const divider: React.CSSProperties = { borderBottom: '1px solid #f3f4f6', marginBottom: 0 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f5f7fa' }}>

      {/* Page header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{user.firstName} {user.lastName}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>User Management / View User</div>
      </div>

      {saveError && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
          {saveError}
        </div>
      )}

      <div style={{ flex: 1, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* LEFT: User Primary Information */}
          <div style={card}>
            <SectionHead title="User Primary Information">
              {isPrimaryEdit
                ? <EditButtons onCancel={cancelEdit} onSave={saveSection} saving={saving} />
                : (
                  <button type="button" onClick={() => startEdit('primary')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0B5AA0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                    <PencilIcon />
                  </button>
                )
              }
            </SectionHead>

            {isPrimaryEdit && edit ? (
              <div style={{ padding: 20 }}>
                {/* User ID badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>User ID - {user.userCode}</span>
                  <span style={{ fontSize: 11, color: '#16a34a' }}>Auto Generated</span>
                </div>

                {/* Status toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Status :</span>
                  <button type="button" onClick={() => setF('status', !edit.status)}
                    style={{
                      position: 'relative', display: 'inline-flex', width: 40, height: 22,
                      borderRadius: 999, border: 'none', cursor: 'pointer',
                      background: edit.status ? '#0B5AA0' : '#d1d5db', transition: 'background 0.2s', padding: 0,
                    }}>
                    <span style={{
                      position: 'absolute', top: 3, left: edit.status ? 20 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                    }} />
                  </button>
                  <span style={{ fontSize: 12, color: edit.status ? '#0B5AA0' : '#9ca3af', fontWeight: 500 }}>
                    {edit.status ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={row2}>
                  <div><Label required>First Name</Label><input required value={edit.firstName} onChange={e => setF('firstName', e.target.value)} style={inputStyle} /></div>
                  <div><Label>Middle / Initial Name</Label><input value={edit.middleName} onChange={e => setF('middleName', e.target.value)} style={inputStyle} /></div>
                </div>
                <div style={row2}>
                  <div><Label required>Last Name</Label><input required value={edit.lastName} onChange={e => setF('lastName', e.target.value)} style={inputStyle} /></div>
                  <div><Label>Suffix</Label><input value={edit.suffix} onChange={e => setF('suffix', e.target.value)} placeholder="e.g. Jr." style={inputStyle} /></div>
                </div>
                <div style={row2}>
                  <div><Label>Date of Birth</Label><input type="date" value={edit.dateOfBirth} onChange={e => setF('dateOfBirth', e.target.value)} style={inputStyle} /></div>
                  <div><Label required>Gender</Label>
                    <StyledSelect value={edit.gender} onChange={v => setF('gender', v)} placeholder="Select" options={GENDERS.map(g => ({ value: g, label: g }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Label required>Works Remotely</Label>
                  <RadioGroup name="remote-edit" value={edit.isRemoteWorking} onChange={v => setF('isRemoteWorking', v)} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Label required>Office Location</Label>
                  <SearchableSelect options={officeOpts} value={edit.officeLocation} onChange={v => setF('officeLocation', v)} placeholder="Select..." />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Label required>Group</Label>
                  <SearchableSelect options={groupOpts} value={edit.groupId} onChange={v => setF('groupId', v)} placeholder="Select..." />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <Label required>Department / Function</Label>
                  <SearchableSelect options={DEPARTMENTS} value={edit.department} onChange={v => setF('department', v)} placeholder="Select..." />
                </div>
                <div style={row2}>
                  <div><Label required>Is a Manager</Label>
                    <RadioGroup name="manager-edit" value={edit.isManager} onChange={v => setF('isManager', v)} />
                  </div>
                  <div><Label>Reports To</Label>
                    <StyledSelect value={edit.reportsTo} onChange={v => setF('reportsTo', v)} placeholder="Select..." options={managerOpts} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0 20px' }}>
                {/* Avatar */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 12,
                    background: '#dbeafe', border: '1px solid #bfdbfe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: '#1d4ed8',
                  }}>
                    {(user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')}
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600, padding: '3px 12px', borderRadius: 999,
                    background: user.status === 'Active' ? '#d7f7e4' : '#ffe9e9',
                    color: user.status === 'Active' ? '#008c55' : '#d82929',
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: user.status === 'Active' ? '#008c55' : '#d82929',
                    }} />
                    {user.status}
                  </span>
                </div>

                <div style={divider}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                    <Field label="User ID" value={user.userCode} />
                    <Field label="Status" value={user.status} />
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                    <Field label="First Name" value={user.firstName} />
                    <Field label="Middle / Initial Name" value={user.middleName} />
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                    <Field label="Last Name" value={user.lastName} />
                    <Field label="Suffix" value={user.suffix} />
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                    <Field label="Date of Birth" value={user.dateOfBirth ? user.dateOfBirth.split('T')[0] : undefined} />
                    <Field label="Gender" value={user.gender} />
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                    <Field label="Work Remotely" value={user.isRemoteWorking ? 'Yes' : 'No'} />
                    <Field label="Office Location" value={user.officeLocation} />
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6, fontWeight: 500 }}>Group(s)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {user.groups?.length
                        ? user.groups.map(g => (
                          <span key={g.id} style={{
                            padding: '2px 12px', fontSize: 12,
                            border: '1px solid #93c5fd', color: '#1d4ed8',
                            borderRadius: 999, background: '#eff6ff',
                          }}>{g.groupName}</span>
                        ))
                        : <span style={{ fontSize: 13, color: '#d1d5db' }}>–</span>
                      }
                    </div>
                  </div>
                </div>
                <div style={divider}>
                  <div style={{ padding: '12px 0' }}>
                    <Field label="Department / Function" value={user.department} />
                  </div>
                </div>
                <div style={{ padding: '12px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Is Manager" value={user.isManager ? 'Yes' : 'No'} />
                    <Field label="Reports To" value={managerName || undefined} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div>

            {/* Address */}
            <div style={card}>
              <SectionHead title="Address">
                {isAddressEdit
                  ? <EditButtons onCancel={cancelEdit} onSave={saveSection} saving={saving} />
                  : (
                    <button type="button" onClick={() => startEdit('address')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#0B5AA0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                      <PencilIcon />
                    </button>
                  )
                }
              </SectionHead>

              {isAddressEdit && edit ? (
                <div style={{ padding: 20 }}>
                  <div style={row2}>
                    <div><Label required>Address Line 1</Label><input value={edit.addressLine1} onChange={e => setF('addressLine1', e.target.value)} style={inputStyle} /></div>
                    <div><Label>Address Line 2</Label><input value={edit.addressLine2} onChange={e => setF('addressLine2', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={row3}>
                    <div><Label required>Country</Label>
                      <SearchableSelect options={countryOpts} value={edit.country} onChange={v => setF('country', v)} placeholder="Select..." />
                    </div>
                    <div><Label required>State</Label>
                      <SearchableSelect options={stateOpts} value={edit.state} onChange={v => setF('state', v)} placeholder="Select..." disabled={!edit.country} />
                    </div>
                    <div><Label required>City</Label><input value={edit.city} onChange={e => setF('city', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={row3}>
                    <div><Label required>Zip Code</Label><input value={edit.zipCode} onChange={e => setF('zipCode', e.target.value)} style={inputStyle} /></div>
                    <div><Label>Latitude</Label><input value={edit.latitude} onChange={e => setF('latitude', e.target.value)} style={inputStyle} /></div>
                    <div><Label>Longitude</Label><input value={edit.longitude} onChange={e => setF('longitude', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0 20px' }}>
                  <div style={divider}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                      <Field label="Address Line 1" value={user.addressLine1} />
                      <Field label="Address Line 2" value={user.addressLine2} />
                    </div>
                  </div>
                  <div style={divider}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '12px 0' }}>
                      <Field label="Country" value={countryName || undefined} />
                      <Field label="State" value={stateName || undefined} />
                      <Field label="City" value={user.city} />
                    </div>
                  </div>
                  <div style={divider}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                      <Field label="County" value={user.county} />
                      <Field label="Zip Code" value={user.zipCode} />
                    </div>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Latitude" value={user.latitude != null ? String(user.latitude) : undefined} />
                      <Field label="Longitude" value={user.longitude != null ? String(user.longitude) : undefined} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div style={card}>
              <SectionHead title="Contact Details">
                {isContactEdit
                  ? <EditButtons onCancel={cancelEdit} onSave={saveSection} saving={saving} />
                  : (
                    <button type="button" onClick={() => startEdit('contact')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#0B5AA0')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                      <PencilIcon />
                    </button>
                  )
                }
              </SectionHead>

              {isContactEdit && edit ? (
                <div style={{ padding: 20 }}>
                  <div style={row2}>
                    <div>
                      <Label required>Telephone Number</Label>
                      <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', border: '1px solid #d1d5db', borderRight: 'none', borderRadius: '4px 0 0 4px', background: '#f9fafb', flexShrink: 0 }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span><span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                        </div>
                        <input value={edit.telephone} onChange={e => setF('telephone', formatPhone(e.target.value))} placeholder="(###) ###-####"
                          style={{ ...inputStyle, borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                      </div>
                    </div>
                    <div><Label>Extension</Label><input value={edit.extension} onChange={e => setF('extension', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={row2}>
                    <div>
                      <Label>Alternative Telephone Number</Label>
                      <div style={{ display: 'flex' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 8px', border: '1px solid #d1d5db', borderRight: 'none', borderRadius: '4px 0 0 4px', background: '#f9fafb', flexShrink: 0 }}>
                          <span style={{ fontSize: 16, lineHeight: 1 }}>🇺🇸</span><span style={{ color: '#9ca3af', fontSize: 11 }}>·</span>
                        </div>
                        <input value={edit.altTelephone} onChange={e => setF('altTelephone', formatPhone(e.target.value))} placeholder="(###) ###-####"
                          style={{ ...inputStyle, borderRadius: '0 4px 4px 0', flex: 1, width: 'auto' }} />
                      </div>
                    </div>
                    <div><Label required>Email ID</Label><input type="email" value={edit.email} onChange={e => setF('email', e.target.value)} style={inputStyle} /></div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0 20px' }}>
                  <div style={divider}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
                      <Field label="Telephone Number" value={user.telephoneNumber} />
                      <Field label="Extension" value={user.extension} />
                    </div>
                  </div>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Alternative Telephone Number" value={user.altTelephoneNumber} />
                      <Field label="Email ID" value={user.email} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Rights */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>User Rights</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Grant access to system modules and sub-modules for this user</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {rightsEditing ? (
                <EditButtons onCancel={() => setRightsEditing(false)} onSave={saveRights} saving={saving} />
              ) : (
                <>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>
                      <SearchIcon />
                    </span>
                    <input type="text" value={rightsSearch} onChange={e => setRightsSearch(e.target.value)}
                      placeholder="Search module or feature"
                      style={{ ...inputStyle, paddingLeft: 28, width: 200, fontSize: 12 }} />
                  </div>
                  <button type="button" onClick={() => { setRightsDraft([...permissions]); setRightsEditing(true) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#0B5AA0')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                    <PencilIcon />
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <PermissionsGrid
              modules={modules}
              permissions={rightsEditing ? rightsDraft : permissions}
              onChange={rightsEditing ? setRightsDraft : () => {}}
              readOnly={!rightsEditing}
              searchQuery={rightsSearch}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => navigate('/users')} className="btn-secondary" style={{ fontSize: 13, padding: '8px 20px' }}>
          Back
        </button>
      </div>
    </div>
  )
}
