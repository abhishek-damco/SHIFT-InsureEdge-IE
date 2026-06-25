import { useState, useRef, useEffect } from 'react'
import { Pencil, ChevronUp, RefreshCw, X, Check } from 'lucide-react'
import type { User, PermissionModule } from '../data/types'
import { defaultModules } from '../data/mockPermissions'
import { useToast } from '../context/ToastContext'
import PermissionGrid from '../components/PermissionGrid'
import { usersApi, type ApiUser } from '../api/users'
import { apiPermissionsToModules, modulesToApiPermissions } from '../data/screenMap'

// ── Constants shared with AddUserPage ────────────────────────────────────────

const OFFICE_LOCATIONS = [
  { label: 'Legal- 579 North Valley Parkway, Lewisville 75067',   addressLine1: '579 North Valley Parkway', city: 'Lewisville', state: 'Texas', country: 'United States', zip: '75067', county: 'Denton County', latitude: '33.0489693', longitude: '-97.0202186' },
  { label: 'Mailing- 579 North Valley Parkway, Lewisville 75067', addressLine1: '579 North Valley Parkway', city: 'Lewisville', state: 'Texas', country: 'United States', zip: '75067', county: 'Denton County', latitude: '33.0489693', longitude: '-97.0202186' },
]

const COUNTRY_STATES: Record<string, string[]> = {
  'United States': ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  'Canada': ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
  'India': ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
  'United Kingdom': ['England','Scotland','Wales','Northern Ireland'],
  'Australia': ['New South Wales','Victoria','Queensland','South Australia','Western Australia','Tasmania','Australian Capital Territory','Northern Territory'],
}
const COUNTRIES = Object.keys(COUNTRY_STATES)

const STATE_CODE_TO_NAME: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',
  NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',
  PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  AB:'Alberta',BC:'British Columbia',MB:'Manitoba',NB:'New Brunswick',
  NL:'Newfoundland and Labrador',NT:'Northwest Territories',NS:'Nova Scotia',
  NU:'Nunavut',ON:'Ontario',PE:'Prince Edward Island',QC:'Quebec',SK:'Saskatchewan',YT:'Yukon',
  ENG:'England',SCT:'Scotland',WLS:'Wales',NIR:'Northern Ireland',
  NSW:'New South Wales',VIC:'Victoria',QLD:'Queensland',SA2:'South Australia',
  WA2:'Western Australia',TAS:'Tasmania',ACT:'Australian Capital Territory',NT2:'Northern Territory',
}

const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([k, v]) => [v, k])
)

const COUNTRY_CODE_TO_NAME: Record<string, string> = { US:'United States', CA:'Canada', IN:'India', GB:'United Kingdom', AU:'Australia' }
const COUNTRY_NAME_TO_CODE: Record<string, string> = { 'United States':'US', 'Canada':'CA', 'India':'IN', 'United Kingdom':'GB', 'Australia':'AU' }

const PHONE_COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'United States', dial: '+1' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada', dial: '+1' },
  { code: 'IN', flag: '🇮🇳', name: 'India', dial: '+91' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', dial: '+44' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', dial: '+61' },
]

// ── Shared sub-components ────────────────────────────────────────────────────

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onChange}>
      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{ borderColor: checked ? '#0B5AA0' : '#d1d5db' }}>
        {checked && <span className="w-2 h-2 rounded-full block" style={{ background: '#0B5AA0' }} />}
      </span>
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  )
}

function PhonePicker({ selected, onSelect }: { selected: typeof PHONE_COUNTRIES[0]; onSelect: (p: typeof PHONE_COUNTRIES[0]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-2 text-sm border-r border-gray-200 bg-white hover:bg-gray-50">
        <span>{selected.flag}</span>
        <span className="text-xs text-gray-600">{selected.dial}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg z-50">
          {PHONE_COUNTRIES.map(p => (
            <button key={p.code} type="button"
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-xs"
              onClick={() => { onSelect(p); setOpen(false) }}>
              <span>{p.flag}</span><span>{p.name}</span><span className="ml-auto text-gray-400">{p.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

// ── View-only read field ────────────────────────────────────────────────────

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value || '-'}</div>
    </div>
  )
}

// ── Editable field wrapper ────────────────────────────────────────────────────

const inputCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'
const selectCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white appearance-none'

function EditField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-700 mb-1">
        {required && <span className="text-red-500 mr-0.5">*</span>}
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Section card with edit/save/cancel header ─────────────────────────────────

function SectionCard({
  title, children, editing, onEdit, onSave, onCancel, saving,
}: {
  title: string
  children: React.ReactNode
  editing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
              <X size={12} /> Cancel
            </button>
            <button onClick={onSave} disabled={saving}
              className="flex items-center gap-1 text-xs text-white rounded px-2 py-1 disabled:opacity-60"
              style={{ background: '#0B5AA0' }}>
              {saving ? '...' : <><Check size={12} /> Save</>}
            </button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil size={15} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}


// ── Props ─────────────────────────────────────────────────────────────────────

interface ViewUserPageProps {
  user: User
  onBack: () => void
  onEdit: (user: User) => void
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ViewUserPage({ user, onBack }: ViewUserPageProps) {
  const toast = useToast()
  const topRef = useRef<HTMLDivElement>(null)
  const [showPwReset, setShowPwReset] = useState(false)
  const [apiUser, setApiUser] = useState<ApiUser | null>(null)
  const [modules, setModules] = useState<PermissionModule[]>(defaultModules)

  // ── fetch user ──
  useEffect(() => {
    if (user.id) {
      usersApi.get(parseInt(user.id))
        .then(u => {
          setApiUser(u)
          syncForms(u)
          setModules(apiPermissionsToModules(u.permissions ?? []))
        })
        .catch(console.error)
    }
  }, [user.id])

  // ── Section: Primary Info ────────────────────────────────────────────────

  const [editingPrimary, setEditingPrimary] = useState(false)
  const [savingPrimary, setSavingPrimary] = useState(false)
  const [primary, setPrimary] = useState({
    firstName: '', middleName: '', lastName: '', suffix: '',
    dob: '', gender: '', worksRemotely: false, officeLocation: '',
    group: '', department: '', isManager: false, managerId: '',
  })

  // ── Section: Address ─────────────────────────────────────────────────────

  const [editingAddr, setEditingAddr] = useState(false)
  const [savingAddr, setSavingAddr] = useState(false)
  const [addr, setAddr] = useState({
    addressLine1: '', addressLine2: '', country: 'United States',
    state: '', city: '', county: '', zip: '', latitude: '', longitude: '',
  })

  // ── Section: Contact Details ─────────────────────────────────────────────

  const [editingContact, setEditingContact] = useState(false)
  const [savingContact, setSavingContact] = useState(false)
  const [contact, setContact] = useState({ phone: '', extension: '', altPhone: '', email: '' })
  const [phonePrimary, setPhonePrimary] = useState(PHONE_COUNTRIES[0])
  const [phoneAlt, setPhoneAlt] = useState(PHONE_COUNTRIES[0])

  // ── Section: Permissions ─────────────────────────────────────────────────

  const [editingPerms, setEditingPerms] = useState(false)
  const [savingPerms, setSavingPerms] = useState(false)
  const [editModules, setEditModules] = useState<PermissionModule[]>(defaultModules)

  // ── Sync all forms from API user ─────────────────────────────────────────

  function syncForms(u: ApiUser) {
    const countryName = COUNTRY_CODE_TO_NAME[u.country_code ?? ''] ?? u.country_name ?? ''
    const stateName = STATE_CODE_TO_NAME[u.state_code ?? ''] ?? u.state_name ?? u.state_code ?? ''
    const cc = u.telephone_number_cc ?? '+1'
    const altCc = u.alt_telephone_number_cc ?? '+1'

    setPrimary({
      firstName: u.first_name ?? '',
      middleName: u.middle_name ?? '',
      lastName: u.last_name ?? '',
      suffix: u.suffix ?? '',
      dob: u.date_of_birth ? u.date_of_birth.slice(0, 10) : '',
      gender: u.gender ?? '',
      worksRemotely: u.is_remote_working ?? false,
      officeLocation: u.office_location ?? '',
      group: u.groups?.[0]?.group_name ?? '',
      department: u.department ?? '',
      isManager: u.is_manager ?? false,
      managerId: u.reports_to ? String(u.reports_to) : '',
    })
    setAddr({
      addressLine1: u.address_line1 ?? '',
      addressLine2: u.address_line2 ?? '',
      country: countryName,
      state: stateName,
      city: u.city ?? '',
      county: u.county ?? '',
      zip: u.zip_code ?? '',
      latitude: u.latitude ?? '',
      longitude: u.longitude ?? '',
    })
    setContact({
      phone: formatPhone(u.telephone_number ?? ''),
      extension: u.extension ?? '',
      altPhone: formatPhone(u.alt_telephone_number ?? ''),
      email: u.email ?? '',
    })
    setPhonePrimary(PHONE_COUNTRIES.find(p => p.dial === cc) ?? PHONE_COUNTRIES[0])
    setPhoneAlt(PHONE_COUNTRIES.find(p => p.dial === altCc) ?? PHONE_COUNTRIES[0])
  }

  // ── Save helpers ─────────────────────────────────────────────────────────

  const userId = parseInt(user.id)

  // Build full PUT payload by merging current DB values with changed section
  function fullPayload(overrides: Record<string, unknown>) {
    const u = apiUser!
    return {
      first_name: u.first_name,
      middle_name: u.middle_name,
      last_name: u.last_name,
      suffix: u.suffix,
      date_of_birth: u.date_of_birth,
      gender: u.gender,
      is_remote_working: u.is_remote_working,
      office_location: u.office_location,
      department: u.department,
      is_manager: u.is_manager,
      reports_to: u.reports_to,
      address_line1: u.address_line1,
      address_line2: u.address_line2,
      country_code: u.country_code,
      state_code: u.state_code,
      city: u.city,
      county: u.county,
      zip_code: u.zip_code,
      latitude: u.latitude,
      longitude: u.longitude,
      telephone_number: u.telephone_number,
      telephone_number_cc: u.telephone_number_cc,
      alt_telephone_number: u.alt_telephone_number,
      alt_telephone_number_cc: u.alt_telephone_number_cc,
      email: u.email,
      extension: u.extension,
      bio: u.bio,
      group_ids: u.groups?.map(g => g.id) ?? [],
      ...overrides,
    }
  }

  async function savePrimary() {
    setSavingPrimary(true)
    try {
      await usersApi.update(userId, fullPayload({
        first_name: primary.firstName,
        middle_name: primary.middleName || null,
        last_name: primary.lastName,
        suffix: primary.suffix || null,
        date_of_birth: primary.dob || null,
        gender: primary.gender || null,
        is_remote_working: primary.worksRemotely,
        office_location: primary.officeLocation || null,
        department: primary.department || null,
        is_manager: primary.isManager,
        reports_to: primary.managerId ? parseInt(primary.managerId) : null,
      }))
      const updated = await usersApi.get(userId)
      setApiUser(updated)
      syncForms(updated)
      setEditingPrimary(false)
      toast('success', 'Primary information updated.')
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally { setSavingPrimary(false) }
  }

  async function saveAddr() {
    setSavingAddr(true)
    try {
      await usersApi.update(userId, fullPayload({
        address_line1: addr.addressLine1 || null,
        address_line2: addr.addressLine2 || null,
        country_code: COUNTRY_NAME_TO_CODE[addr.country] ?? null,
        state_code: addr.state ? (STATE_NAME_TO_CODE[addr.state] ?? addr.state) : null,
        city: addr.city || null,
        county: addr.county || null,
        zip_code: addr.zip || null,
        latitude: addr.latitude || null,
        longitude: addr.longitude || null,
      }))
      const updated = await usersApi.get(userId)
      setApiUser(updated)
      syncForms(updated)
      setEditingAddr(false)
      toast('success', 'Address updated.')
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally { setSavingAddr(false) }
  }

  async function saveContact() {
    setSavingContact(true)
    try {
      await usersApi.update(userId, fullPayload({
        telephone_number: contact.phone.replace(/\D/g, '') || null,
        telephone_number_cc: phonePrimary.dial,
        alt_telephone_number: contact.altPhone.replace(/\D/g, '') || null,
        alt_telephone_number_cc: phoneAlt.dial,
        email: contact.email,
        extension: contact.extension || null,
      }))
      const updated = await usersApi.get(userId)
      setApiUser(updated)
      syncForms(updated)
      setEditingContact(false)
      toast('success', 'Contact details updated.')
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally { setSavingContact(false) }
  }

  async function savePerms() {
    setSavingPerms(true)
    try {
      await usersApi.update(userId, fullPayload({
        permissions: modulesToApiPermissions(editModules),
      }))
      setModules(editModules)
      setEditingPerms(false)
      toast('success', 'Permissions updated.')
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Save failed.')
    } finally { setSavingPerms(false) }
  }

  // ── Derived display values ────────────────────────────────────────────────

  const managerName = apiUser?.manager_name ?? undefined
  const countryDisplay = apiUser ? (COUNTRY_CODE_TO_NAME[apiUser.country_code ?? ''] ?? apiUser.country_name ?? '') : ''
  const stateDisplay = apiUser ? (STATE_CODE_TO_NAME[apiUser.state_code ?? ''] ?? apiUser.state_name ?? apiUser.state_code ?? '') : ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-50" ref={topRef}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 bg-gray-50">
        <div className="text-xs text-gray-400 mb-1">
          <button onClick={onBack} className="hover:underline" style={{ color: '#0B5AA0' }}>User Management</button>
          <span className="mx-1">/</span>
          <span>View User</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">
          {apiUser ? `${apiUser.first_name} ${apiUser.last_name}` : `${user.firstName} ${user.lastName}`}
        </h1>
      </div>

      <div className="px-6 pb-16">
        <div className="flex gap-4 items-start">

          {/* ── LEFT: User Primary Information ── */}
          <div className="w-[420px] flex-shrink-0">
            <SectionCard
              title="User Primary Information"
              editing={editingPrimary}
              onEdit={() => setEditingPrimary(true)}
              onSave={savePrimary}
              onCancel={() => { syncForms(apiUser!); setEditingPrimary(false) }}
              saving={savingPrimary}
            >
              {/* Profile image */}
              <div className="flex justify-center mb-4">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-24 h-28 object-cover rounded border border-gray-200" />
                ) : (
                  <div className="w-24 h-28 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                    <svg viewBox="0 0 80 96" width="80" height="96" fill="none">
                      <rect width="80" height="96" rx="4" fill="#f3f4f6" />
                      <circle cx="40" cy="35" r="16" fill="#d1d5db" />
                      <path d="M8 90 Q8 62 40 62 Q72 62 72 90" fill="#d1d5db" />
                    </svg>
                  </div>
                )}
              </div>

              {editingPrimary ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="First Name" required>
                      <input value={primary.firstName} onChange={e => setPrimary(p => ({ ...p, firstName: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Middle / Initial Name">
                      <input value={primary.middleName} onChange={e => setPrimary(p => ({ ...p, middleName: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Last Name" required>
                      <input value={primary.lastName} onChange={e => setPrimary(p => ({ ...p, lastName: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Suffix">
                      <input value={primary.suffix} onChange={e => setPrimary(p => ({ ...p, suffix: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Date of Birth">
                      <input type="date" value={primary.dob} onChange={e => setPrimary(p => ({ ...p, dob: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Gender">
                      <div className="relative">
                        <select value={primary.gender} onChange={e => setPrimary(p => ({ ...p, gender: e.target.value }))} className={selectCls}>
                          <option value="">Select</option>
                          <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                      </div>
                    </EditField>
                  </div>

                  <EditField label="Works Remotely" required>
                    <div className="flex gap-6">
                      <Radio checked={primary.worksRemotely} onChange={() => setPrimary(p => ({ ...p, worksRemotely: true }))} label="Yes" />
                      <Radio checked={!primary.worksRemotely} onChange={() => setPrimary(p => ({ ...p, worksRemotely: false }))} label="No" />
                    </div>
                  </EditField>

                  <EditField label="Office Location">
                    <div className="relative">
                      <select value={primary.officeLocation} onChange={e => setPrimary(p => ({ ...p, officeLocation: e.target.value }))} className={selectCls}>
                        <option value="">Select...</option>
                        {OFFICE_LOCATIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                    </div>
                  </EditField>

                  <EditField label="Department / Function">
                    <div className="relative">
                      <select value={primary.department} onChange={e => setPrimary(p => ({ ...p, department: e.target.value }))} className={selectCls}>
                        <option value="">Select...</option>
                        {['Underwriting','Claims','Finance','Operations','HR','Actuarial'].map(d => <option key={d}>{d}</option>)}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                    </div>
                  </EditField>

                  <div className="grid grid-cols-2 gap-3 items-start">
                    <EditField label="Is a Manager" required>
                      <div className="flex gap-4">
                        <Radio checked={primary.isManager} onChange={() => setPrimary(p => ({ ...p, isManager: true }))} label="Yes" />
                        <Radio checked={!primary.isManager} onChange={() => setPrimary(p => ({ ...p, isManager: false }))} label="No" />
                      </div>
                    </EditField>
                    {!primary.isManager && (
                      <EditField label="Reports To">
                        <input value={primary.managerId} onChange={e => setPrimary(p => ({ ...p, managerId: e.target.value }))} className={inputCls} placeholder="Manager ID" />
                      </EditField>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <ReadField label="User ID" value={apiUser?.user_code ?? user.userId} />
                    <ReadField label="Status" value={apiUser?.status ?? user.status} />
                    <ReadField label="First Name" value={apiUser?.first_name ?? user.firstName} />
                    <ReadField label="Middle / Initial Name" value={apiUser?.middle_name} />
                    <ReadField label="Last Name" value={apiUser?.last_name ?? user.lastName} />
                    <ReadField label="Suffix" value={apiUser?.suffix} />
                    <ReadField label="Date of Birth" value={apiUser?.date_of_birth?.slice(0, 10)} />
                    <ReadField label="Gender" value={apiUser?.gender} />
                    <ReadField label="Work Remotely" value={apiUser?.is_remote_working ? 'Yes' : 'No'} />
                    <ReadField label="Office Location" value={apiUser?.office_location} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 mb-0.5">Group(s)</div>
                      <div className="text-sm text-gray-800">
                        {(apiUser?.groups?.map(g => g.group_name) ?? user.groups).join(', ') || '-'}
                      </div>
                    </div>
                    <ReadField label="Department / Function" value={apiUser?.department ?? user.department} />
                    <div />
                    <ReadField label="Is Manager" value={apiUser?.is_manager ? 'Yes' : 'No'} />
                    <ReadField label="Reports To" value={managerName} />
                  </div>
                </>
              )}

              {/* Reset Password — always shown */}
              <div className="mt-5 border border-gray-200 rounded-lg p-4 text-center">
                <button
                  onClick={() => setShowPwReset(true)}
                  className="flex items-center gap-2 mx-auto border rounded px-4 py-1.5 text-sm font-medium transition-colors hover:bg-blue-50"
                  style={{ borderColor: '#0B5AA0', color: '#0B5AA0' }}
                >
                  <RefreshCw size={14} />
                  Reset User Password
                </button>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Selecting the Reset User Password will generate an email to the user's registered email with a temporary password and password reset instructions
                </p>
              </div>
            </SectionCard>
          </div>

          {/* ── RIGHT: Address + Contact ── */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Address */}
            <SectionCard
              title="Address"
              editing={editingAddr}
              onEdit={() => setEditingAddr(true)}
              onSave={saveAddr}
              onCancel={() => { syncForms(apiUser!); setEditingAddr(false) }}
              saving={savingAddr}
            >
              {editingAddr ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="Address Line 1">
                      <input value={addr.addressLine1} onChange={e => setAddr(a => ({ ...a, addressLine1: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Address Line 2">
                      <input value={addr.addressLine2} onChange={e => setAddr(a => ({ ...a, addressLine2: e.target.value }))} className={inputCls} />
                    </EditField>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <EditField label="Country">
                      <div className="relative">
                        <select value={addr.country} onChange={e => setAddr(a => ({ ...a, country: e.target.value, state: '' }))} className={selectCls}>
                          <option value="">Select...</option>
                          {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                      </div>
                    </EditField>
                    <EditField label="State">
                      <div className="relative">
                        <select value={addr.state} onChange={e => setAddr(a => ({ ...a, state: e.target.value }))} className={selectCls}>
                          <option value="">Select...</option>
                          {(COUNTRY_STATES[addr.country] ?? []).map(s => <option key={s}>{s}</option>)}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                      </div>
                    </EditField>
                    <EditField label="City">
                      <input value={addr.city} onChange={e => setAddr(a => ({ ...a, city: e.target.value }))} className={inputCls} />
                    </EditField>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <EditField label="County">
                      <input value={addr.county} onChange={e => setAddr(a => ({ ...a, county: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Zip Code">
                      <input value={addr.zip} onChange={e => setAddr(a => ({ ...a, zip: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Latitude">
                      <input value={addr.latitude} onChange={e => setAddr(a => ({ ...a, latitude: e.target.value }))} className={inputCls} />
                    </EditField>
                    <EditField label="Longitude">
                      <input value={addr.longitude} onChange={e => setAddr(a => ({ ...a, longitude: e.target.value }))} className={inputCls} />
                    </EditField>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <ReadField label="Address Line 1" value={apiUser?.address_line1} />
                  <ReadField label="Address Line 2" value={apiUser?.address_line2} />
                  <ReadField label="Country" value={countryDisplay} />
                  <ReadField label="State" value={stateDisplay} />
                  <ReadField label="City" value={apiUser?.city} />
                  <ReadField label="County" value={apiUser?.county} />
                  <ReadField label="Zip Code" value={apiUser?.zip_code} />
                  <div />
                  <ReadField label="Latitude" value={apiUser?.latitude} />
                  <ReadField label="Longitude" value={apiUser?.longitude} />
                </div>
              )}
            </SectionCard>

            {/* Contact Details */}
            <SectionCard
              title="Contact Details"
              editing={editingContact}
              onEdit={() => setEditingContact(true)}
              onSave={saveContact}
              onCancel={() => { syncForms(apiUser!); setEditingContact(false) }}
              saving={savingContact}
            >
              {editingContact ? (
                <div className="grid grid-cols-2 gap-3">
                  <EditField label="Telephone Number">
                    <div className="flex items-center border border-gray-200 rounded overflow-visible bg-white">
                      <PhonePicker selected={phonePrimary} onSelect={setPhonePrimary} />
                      <input
                        value={contact.phone}
                        onChange={e => setContact(c => ({ ...c, phone: formatPhone(e.target.value) }))}
                        inputMode="numeric" maxLength={14}
                        className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                        placeholder="(###) ###-####"
                      />
                    </div>
                  </EditField>
                  <EditField label="Extension">
                    <input value={contact.extension} onChange={e => setContact(c => ({ ...c, extension: e.target.value }))} className={inputCls} />
                  </EditField>
                  <EditField label="Alternative Telephone Number">
                    <div className="flex items-center border border-gray-200 rounded overflow-visible bg-white">
                      <PhonePicker selected={phoneAlt} onSelect={setPhoneAlt} />
                      <input
                        value={contact.altPhone}
                        onChange={e => setContact(c => ({ ...c, altPhone: formatPhone(e.target.value) }))}
                        inputMode="numeric" maxLength={14}
                        className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                        placeholder="(###) ###-####"
                      />
                    </div>
                  </EditField>
                  <EditField label="Email ID" required>
                    <input value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className={inputCls} type="email" />
                  </EditField>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <ReadField label="Telephone Number" value={
                    apiUser?.telephone_number
                      ? `${apiUser.telephone_number_cc ?? ''} ${formatPhone(apiUser.telephone_number)}`.trim()
                      : undefined
                  } />
                  <ReadField label="Extension" value={apiUser?.extension} />
                  <ReadField label="Alternative Telephone Number" value={
                    apiUser?.alt_telephone_number
                      ? `${apiUser.alt_telephone_number_cc ?? ''} ${formatPhone(apiUser.alt_telephone_number)}`.trim()
                      : undefined
                  } />
                  <ReadField label="Email ID" value={apiUser?.email ?? user.email} />
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ── User Rights (Permissions) ── */}
        <div className="bg-white border border-gray-200 rounded-lg mt-4 p-5">
          <div className="flex items-center justify-between mb-1">
            <span />
            {editingPerms ? (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditModules(modules); setEditingPerms(false) }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1">
                  <X size={12} /> Cancel
                </button>
                <button onClick={savePerms} disabled={savingPerms}
                  className="flex items-center gap-1 text-xs text-white rounded px-2 py-1 disabled:opacity-60"
                  style={{ background: '#0B5AA0' }}>
                  {savingPerms ? '...' : <><Check size={12} /> Save</>}
                </button>
              </div>
            ) : (
              <button onClick={() => { setEditModules(modules); setEditingPerms(true) }} className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5">
                <Pencil size={15} />
              </button>
            )}
          </div>
          <PermissionGrid
            modules={editingPerms ? editModules : modules}
            onChange={setEditModules}
            readOnly={!editingPerms}
          />
        </div>

        {/* Back button */}
        <div className="flex justify-end mt-4">
          <button onClick={onBack} className="px-5 py-2 text-sm border border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition-colors">
            Back
          </button>
        </div>
      </div>

      {/* Floating Top button */}
      <button
        onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-8 right-6 w-12 h-12 rounded-full text-white flex flex-col items-center justify-center text-xs font-medium shadow-lg z-40"
        style={{ background: '#0B5AA0' }}
      >
        <ChevronUp size={16} />
        <span className="text-[10px] leading-none">Top</span>
      </button>

      {/* Password Reset modal */}
      {showPwReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-6">
            <div className="flex items-start gap-3 mb-4">
              <RefreshCw size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Reset Password</div>
                <div className="text-xs text-gray-500">
                  A password reset email will be sent to <strong>{apiUser?.email ?? user.email}</strong>. Are you sure?
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPwReset(false)}
                className="px-4 py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => { setShowPwReset(false); toast('success', 'Password reset email dispatched.') }}
                className="px-4 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700">
                Send Reset Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
