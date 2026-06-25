import { useState, useRef, useEffect } from 'react'
import { AlertTriangle, RefreshCw, ChevronUp, Info, MapPin } from 'lucide-react'
import type { PermissionModule } from '../data/types'
import { defaultModules } from '../data/mockPermissions'
import { useToast } from '../context/ToastContext'
import PermissionGrid from '../components/PermissionGrid'
import { usersApi, referenceApi, type ApiUser } from '../api/users'
import { groupsApi } from '../api/groups'
import { modulesToApiPermissions } from '../data/screenMap'

interface AddUserPageProps {
  onCancel: () => void
  onSave: () => void
}

interface FormState {
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  dob: string
  gender: string
  worksRemotely: boolean
  officeLocation: string
  groupId: string
  department: string
  isManager: boolean
  managerId: string
  sameAsOffice: boolean
  enterManually: boolean
  googleSearch: string
  addressLine1: string
  addressLine2: string
  country: string
  state: string
  city: string
  county: string
  zip: string
  latitude: string
  longitude: string
  phone: string
  extension: string
  altPhone: string
  email: string
}

// ── Office Locations (Fix 1 + 3) ─────────────────────────────────────────────
interface OfficeLocation {
  label: string
  addressLine1: string
  city: string
  state: string
  country: string
  zip: string
  county: string
  latitude: string
  longitude: string
}
const OFFICE_LOCATIONS: OfficeLocation[] = [
  { label: 'Legal- 579 North Valley Parkway, Lewisville 75067',   addressLine1: '579 North Valley Parkway', city: 'Lewisville', state: 'Texas', country: 'United States', zip: '75067', county: 'Denton County', latitude: '33.0489693', longitude: '-97.0202186' },
  { label: 'Mailing- 579 North Valley Parkway, Lewisville 75067', addressLine1: '579 North Valley Parkway', city: 'Lewisville', state: 'Texas', country: 'United States', zip: '75067', county: 'Denton County', latitude: '33.0489693', longitude: '-97.0202186' },
]

function OfficePicker({ value, onChange }: { value: string; onChange: (loc: OfficeLocation) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = OFFICE_LOCATIONS.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded px-3 py-2 text-sm bg-white text-left focus:outline-none"
        style={open ? { borderColor: '#0B5AA0' } : {}}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || 'Select...'}</span>
        <span className="text-gray-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg z-50">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(loc => (
              <div
                key={loc.label}
                onMouseDown={e => { e.preventDefault(); onChange(loc); setOpen(false); setSearch('') }}
                className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0"
                style={{ color: loc.label.startsWith('Legal') ? '#e53e3e' : '#d97706' }}
              >
                {loc.label}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-3 py-3 text-sm text-gray-400">No results</div>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Country / State data ──────────────────────────────────────────────────────
const COUNTRY_STATES: Record<string, string[]> = {
  'United States': ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  'Canada': ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'],
  'India': ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'],
  'United Kingdom': ['England','Scotland','Wales','Northern Ireland'],
  'Australia': ['New South Wales','Victoria','Queensland','South Australia','Western Australia','Tasmania','Australian Capital Territory','Northern Territory'],
}
const COUNTRIES = Object.keys(COUNTRY_STATES)

// Maps full state name → 2-letter code matching the DB state table
const STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',
  Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',
  Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',
  Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',
  Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV',
  'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
  'North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',
  Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',
  Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA',
  'West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY',
  // Canada
  Alberta:'AB','British Columbia':'BC',Manitoba:'MB','New Brunswick':'NB',
  'Newfoundland and Labrador':'NL','Northwest Territories':'NT','Nova Scotia':'NS',
  Nunavut:'NU',Ontario:'ON','Prince Edward Island':'PE',Quebec:'QC',Saskatchewan:'SK',Yukon:'YT',
  // India
  'Andhra Pradesh':'AP','Arunachal Pradesh':'AR2',Assam:'AS',Bihar:'BR',
  Chhattisgarh:'CG',Goa:'GA2',Gujarat:'GJ',Haryana:'HR','Himachal Pradesh':'HP',
  Jharkhand:'JH',Karnataka:'KA',Kerala:'KL','Madhya Pradesh':'MP',Maharashtra:'MH',
  Manipur:'MN2',Meghalaya:'ML',Mizoram:'MZ',Nagaland:'NL2',Odisha:'OR2',
  Punjab:'PB',Rajasthan:'RJ',Sikkim:'SK2','Tamil Nadu':'TN2',Telangana:'TS',
  Tripura:'TR','Uttar Pradesh':'UP',Uttarakhand:'UK','West Bengal':'WB',Delhi:'DL',
  // United Kingdom
  England:'ENG',Scotland:'SCT',Wales:'WLS','Northern Ireland':'NIR',
  // Australia
  'New South Wales':'NSW',Victoria:'VIC',Queensland:'QLD','South Australia':'SA2',
  'Western Australia':'WA2',Tasmania:'TAS','Australian Capital Territory':'ACT',
  'Northern Territory':'NT2',
}

// ── Phone country data ────────────────────────────────────────────────────────
const PHONE_COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'United States', dial: '+1' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada', dial: '+1' },
  { code: 'IN', flag: '🇮🇳', name: 'India', dial: '+91' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', dial: '+44' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', dial: '+61' },
]

// ── Google Places mock suggestions ───────────────────────────────────────────
interface PlaceSuggestion {
  primary: string
  secondary: string
  city: string
  state: string
  country: string
  zip: string
  lat: string
  lng: string
}
const PLACE_DB: PlaceSuggestion[] = [
  { primary: 'Indore', secondary: 'Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', zip: '452001', lat: '22.7196', lng: '75.8577' },
  { primary: 'Indore Airport', secondary: 'Depalpur Road, Devi Ahillyabai Holkar Airport Area, Indore, Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', zip: '452005', lat: '22.7218', lng: '75.8014' },
  { primary: 'Indore Junction Railway Station', secondary: 'Chhoti Gwaltoli, Indore, Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', zip: '452007', lat: '22.7208', lng: '75.8599' },
  { primary: 'Indore railway station ( platform 3)', secondary: 'Chhoti Gwaltoli, Indore, Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', zip: '452007', lat: '22.7207', lng: '75.8598' },
  { primary: 'Indore physical Academy', secondary: 'square, Navlakha, Davv Takshila Parisar, Indore, Madhya Pradesh, India', city: 'Indore', state: 'Madhya Pradesh', country: 'India', zip: '452001', lat: '22.7325', lng: '75.8804' },
  { primary: 'San Francisco', secondary: 'California, United States', city: 'San Francisco', state: 'California', country: 'United States', zip: '94102', lat: '37.7749', lng: '-122.4194' },
  { primary: '55 Music Concourse Drive', secondary: 'San Francisco, CA 94118, United States', city: 'San Francisco', state: 'California', country: 'United States', zip: '94118', lat: '37.7700', lng: '-122.4668' },
  { primary: '579 North Valley Parkway', secondary: 'San Jose, CA 95128, United States', city: 'San Jose', state: 'California', country: 'United States', zip: '95128', lat: '37.3382', lng: '-121.8863' },
  { primary: 'New York', secondary: 'New York, United States', city: 'New York', state: 'New York', country: 'United States', zip: '10001', lat: '40.7128', lng: '-74.0060' },
  { primary: 'Mumbai', secondary: 'Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India', zip: '400001', lat: '19.0760', lng: '72.8777' },
  { primary: 'London', secondary: 'England, United Kingdom', city: 'London', state: 'England', country: 'United Kingdom', zip: 'EC1A 1BB', lat: '51.5074', lng: '-0.1278' },
  { primary: 'Toronto', secondary: 'Ontario, Canada', city: 'Toronto', state: 'Ontario', country: 'Canada', zip: 'M5H 2N2', lat: '43.6532', lng: '-79.3832' },
]

// ── Sub-components ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0"
      style={{ background: checked ? '#0B5AA0' : '#d1d5db' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onChange}>
      <span
        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{ borderColor: checked ? '#0B5AA0' : '#d1d5db' }}
      >
        {checked && <span className="w-2 h-2 rounded-full block" style={{ background: '#0B5AA0' }} />}
      </span>
      <span className="text-xs text-gray-700">{label}</span>
    </label>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

// Google-style address autocomplete
function GoogleSearch({
  value,
  onChange,
  disabled,
  onSelect,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
  onSelect: (s: PlaceSuggestion) => void
}) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleInput = (v: string) => {
    onChange(v)
    if (v.length < 2) { setSuggestions([]); setOpen(false); return }
    const q = v.toLowerCase()
    const matches = PLACE_DB.filter(p =>
      p.primary.toLowerCase().includes(q) || p.secondary.toLowerCase().includes(q)
    ).slice(0, 5)
    setSuggestions(matches)
    setOpen(matches.length > 0)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <span>{text}</span>
    return (
      <>
        <span>{text.slice(0, idx)}</span>
        <span className="font-bold">{text.slice(idx, idx + query.length)}</span>
        <span>{text.slice(idx + query.length)}</span>
      </>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        disabled={disabled}
        placeholder=""
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-100 placeholder:text-gray-300 transition-colors"
        style={{ outlineColor: '#0B5AA0' }}
      />
      {open && (
        <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-50 mt-0.5">
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={e => { e.preventDefault(); onSelect(s); setOpen(false) }}
              className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
            >
              <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-800 leading-snug">
                {highlightMatch(s.primary, value)}
                <span className="text-gray-500 font-normal text-xs"> {s.secondary}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-end px-3 py-1.5 border-t border-gray-100">
            <span className="text-xs text-gray-400">powered by <span className="text-blue-500 font-medium">G</span><span className="text-red-500 font-medium">o</span><span className="text-yellow-500 font-medium">o</span><span className="text-blue-500 font-medium">g</span><span className="text-green-500 font-medium">l</span><span className="text-red-500 font-medium">e</span></span>
          </div>
        </div>
      )}
    </div>
  )
}

// Format phone number as (###) ###-####
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Phone country picker dropdown
function PhonePicker({
  selected,
  onSelect,
  disabled,
}: {
  selected: typeof PHONE_COUNTRIES[0]
  onSelect: (c: typeof PHONE_COUNTRIES[0]) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 px-2 py-2 border-r border-gray-200 bg-gray-50 text-sm hover:bg-gray-100 transition-colors disabled:opacity-60"
      >
        <span>{selected.flag}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg z-50 w-48">
          {PHONE_COUNTRIES.map(c => (
            <div
              key={c.code}
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
              style={{ background: c.code === selected.code ? '#f0f9ff' : undefined }}
            >
              <span className="text-base">{c.flag}</span>
              <span className="text-gray-700 flex-1">{c.name}</span>
              <span className="text-gray-400 text-xs">{c.dial}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputCls = "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none bg-white disabled:bg-gray-100 placeholder:text-gray-300 transition-colors"
const selectCls = "w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"

export default function AddUserPage({ onCancel, onSave }: AddUserPageProps) {
  const toast = useToast()
  const topRef = useRef<HTMLDivElement>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showPwReset, setShowPwReset] = useState(false)
  const [modules, setModules] = useState<PermissionModule[]>(defaultModules)
  const [profileImg, setProfileImg] = useState<string | null>(null)
  const [phonePrimary, setPhonePrimary] = useState(PHONE_COUNTRIES[0])
  const [phoneAlt, setPhoneAlt] = useState(PHONE_COUNTRIES[0])
  const [managers, setManagers] = useState<ApiUser[]>([])
  const [groupOptions, setGroupOptions] = useState<{ id: number; groupName: string }[]>([])

  useEffect(() => {
    referenceApi.managers().then(setManagers).catch(console.error)
    groupsApi.list({ pageSize: 200 })
      .then(data => setGroupOptions(data.items.map(g => ({ id: g.id, groupName: g.groupName }))))
      .catch(console.error)
  }, [])

  // Fix 1: compute once so status toggle doesn't regenerate it
  const [autoUserId] = useState('IE' + String(Math.floor(Math.random() * 9000) + 1000))

  const [form, setForm] = useState<FormState>({
    firstName: '', middleName: '', lastName: '', suffix: '',
    dob: '', gender: '', worksRemotely: false,
    officeLocation: '', groupId: '', department: '', isManager: false, managerId: '',
    sameAsOffice: false, enterManually: false, googleSearch: '',
    addressLine1: '', addressLine2: '', country: 'United States',
    state: '', city: '', county: '', zip: '', latitude: '', longitude: '',
    phone: '', extension: '', altPhone: '', email: '',
  })

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    setIsDirty(true)
  }
  const setBool = (field: keyof FormState, val: boolean) => {
    setForm(f => ({ ...f, [field]: val }))
    setIsDirty(true)
  }

  const handleCancel = () => isDirty ? setShowUnsaved(true) : onCancel()

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast('error', 'First Name and Last Name are required.')
      return
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast('error', 'A valid Email ID is required.')
      return
    }
    if (!form.phone.trim()) {
      toast('error', 'Telephone Number is required.')
      return
    }
    try {
      await usersApi.create({
        first_name: form.firstName,
        middle_name: form.middleName || null,
        last_name: form.lastName,
        suffix: form.suffix || null,
        date_of_birth: form.dob || null,
        gender: form.gender || null,
        is_remote_working: form.worksRemotely,
        office_location: form.officeLocation || null,
        department: form.department || null,
        is_manager: form.isManager,
        reports_to: form.managerId ? parseInt(form.managerId) : null,
        address_line1: form.addressLine1 || null,
        address_line2: form.addressLine2 || null,
        country_code: form.country
          ? (form.country === 'United States' ? 'US'
            : form.country === 'Canada' ? 'CA'
            : form.country === 'India' ? 'IN'
            : form.country === 'United Kingdom' ? 'GB'
            : form.country === 'Australia' ? 'AU' : null)
          : null,
        state_code: form.state ? (STATE_NAME_TO_CODE[form.state] ?? form.state) : null,
        city: form.city || null,
        county: form.county || null,
        zip_code: form.zip || null,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        telephone_number: form.phone.replace(/\D/g, '') || null,
        telephone_number_cc: phonePrimary.dial,
        alt_telephone_number: form.altPhone.replace(/\D/g, '') || null,
        alt_telephone_number_cc: phoneAlt.dial,
        email: form.email,
        extension: form.extension || null,
        group_ids: form.groupId ? [parseInt(form.groupId)] : [],
        permissions: modulesToApiPermissions(modules),
      })
      toast('success', `User "${form.firstName} ${form.lastName}" created successfully.`)
      onSave()
    } catch (err: unknown) {
      toast('error', err instanceof Error ? err.message : 'Failed to create user.')
    }
  }

  // Fix 1+3: office location selected → store label, optionally auto-fill address
  const handleOfficeSelect = (loc: OfficeLocation) => {
    setForm(f => {
      const next: FormState = { ...f, officeLocation: loc.label }
      if (f.sameAsOffice) {
        next.addressLine1 = loc.addressLine1
        next.city = loc.city
        next.state = loc.state
        next.country = loc.country
        next.zip = loc.zip
        next.county = loc.county
        next.latitude = loc.latitude
        next.longitude = loc.longitude
      }
      return next
    })
    setIsDirty(true)
  }

  // Fix 3: same as office checkbox → auto-fill address from selected office
  const handleSameAsOffice = (checked: boolean) => {
    if (checked) {
      const office = OFFICE_LOCATIONS.find(o => o.label === form.officeLocation)
      if (office) {
        setForm(f => ({
          ...f, sameAsOffice: true,
          addressLine1: office.addressLine1, city: office.city,
          state: office.state, country: office.country, zip: office.zip,
          county: office.county, latitude: office.latitude, longitude: office.longitude,
        }))
      } else {
        setForm(f => ({ ...f, sameAsOffice: true }))
      }
    } else {
      setForm(f => ({ ...f, sameAsOffice: false }))
    }
    setIsDirty(true)
  }

  // When country changes, reset state
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm(f => ({ ...f, country: e.target.value, state: '' }))
    setIsDirty(true)
  }

  // When google suggestion is selected, fill address fields
  const handlePlaceSelect = (s: PlaceSuggestion) => {
    setForm(f => ({
      ...f,
      googleSearch: s.primary + ', ' + s.secondary,
      addressLine1: s.primary,
      city: s.city,
      state: s.state,
      country: s.country,
      zip: s.zip,
      latitude: s.lat,
      longitude: s.lng,
    }))
    setIsDirty(true)
  }

  const addrDisabled = form.sameAsOffice && !form.enterManually

  return (
    <div className="min-h-full bg-gray-50" ref={topRef}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 bg-gray-50">
        <div className="text-xs text-gray-400 mb-1">
          <button onClick={handleCancel} className="hover:underline" style={{ color: '#0B5AA0' }}>User Management</button>
          <span className="mx-1">/</span>
          <span>Add User</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800">Add User</h1>
      </div>

      <div className="px-6 pb-24">
        {/* Two-column main card */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex">

          {/* LEFT COLUMN — User Primary Information */}
          <div className="w-[420px] flex-shrink-0 border-r border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">User Primary Information</h2>

            {/* Auto-generated User ID */}
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded px-3 py-2">
              <span className="text-sm font-medium" style={{ color: '#0B5AA0' }}>User ID - {autoUserId}</span>
              <span className="text-xs text-gray-400">Auto Generated</span>
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-700">Status :</span>
              <Toggle checked={form.worksRemotely} onChange={v => setBool('worksRemotely', v)} />
            </div>

            {/* Profile image upload */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Upload User Profile Image</p>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-5 text-center cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => document.getElementById('profile-upload')?.click()}
              >
                {profileImg ? (
                  <img src={profileImg} alt="Profile" className="w-16 h-16 rounded-full object-cover mx-auto" />
                ) : (
                  <>
                    <p className="text-xs font-medium text-gray-600 mb-1">Drag and Drop File Here or Select a File</p>
                    <p className="text-xs text-gray-400 mb-3">Supported formats are PNG, JPEG &amp; GIF.<br />File size : 10 KB-10 MB</p>
                    <button
                      type="button"
                      className="border rounded px-4 py-1.5 text-xs flex items-center gap-2 mx-auto hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#0B5AA0', color: '#0B5AA0' }}
                    >
                      <span>🗂</span> Browse File
                    </button>
                  </>
                )}
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) setProfileImg(URL.createObjectURL(f))
                  }}
                />
              </div>
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" required>
                <input value={form.firstName} onChange={set('firstName')} className={inputCls} />
              </Field>
              <Field label="Middle / Initial Name">
                <input value={form.middleName} onChange={set('middleName')} className={inputCls} />
              </Field>
              <Field label="Last Name" required>
                <input value={form.lastName} onChange={set('lastName')} className={inputCls} />
              </Field>
              <Field label="Suffix">
                <input value={form.suffix} onChange={set('suffix')} className={inputCls} />
              </Field>
            </div>

            {/* DOB + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date of Birth">
                <input type="date" value={form.dob} onChange={set('dob')} className={inputCls} />
              </Field>
              <Field label="Gender" required>
                <div className="relative">
                  <select value={form.gender} onChange={set('gender')} className={selectCls}>
                    <option value="">Select</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                </div>
              </Field>
            </div>

            {/* Works Remotely */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2"><span className="text-red-500 mr-0.5">*</span>Works Remotely</p>
              <div className="flex gap-6">
                <Radio checked={form.worksRemotely} onChange={() => setBool('worksRemotely', true)} label="Yes" />
                <Radio checked={!form.worksRemotely} onChange={() => setBool('worksRemotely', false)} label="No" />
              </div>
            </div>

            {/* Fix 1: Office Location searchable dropdown */}
            <Field label="Office Location" required>
              <OfficePicker value={form.officeLocation} onChange={handleOfficeSelect} />
            </Field>

            {/* Group */}
            <Field label="Group" required>
              <div className="relative">
                <select value={form.groupId} onChange={set('groupId')} className={selectCls}>
                  <option value="">Select...</option>
                  {groupOptions.map(g => (
                    <option key={g.id} value={g.id}>{g.groupName}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
              </div>
            </Field>

            {/* Department */}
            <Field label="Department / Function" required>
              <div className="relative">
                <select value={form.department} onChange={set('department')} className={selectCls}>
                  <option value="">Select...</option>
                  <option>Actuarial</option>
                  <option>Catastrophe Management</option>
                  <option>Claims</option>
                  <option>Compliance &amp; Regulatory</option>
                  <option>Customer Service</option>
                  <option>Data &amp; Analytics</option>
                  <option>Finance &amp; Accounting</option>
                  <option>Fraud/SIU</option>
                  <option>Internal Audit</option>
                  <option>Legal</option>
                  <option>Operations</option>
                  <option>Policy Administration</option>
                  <option>Product Management</option>
                  <option>Program Management</option>
                  <option>Reinsurance</option>
                  <option>Risk Management</option>
                  <option>Sales &amp; Distribution</option>
                  <option>Underwriting</option>
                  <option>User Experience</option>
                  <option>Vendor Management</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
              </div>
            </Field>

            {/* Is Manager + Reports To */}
            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2"><span className="text-red-500 mr-0.5">*</span>Is a Manager</p>
                <div className="flex gap-4">
                  <Radio checked={form.isManager} onChange={() => setBool('isManager', true)} label="Yes" />
                  <Radio checked={!form.isManager} onChange={() => setBool('isManager', false)} label="No" />
                </div>
              </div>
              <Field label="Reports To" required={!form.isManager}>
                <div className="relative">
                  <select value={form.managerId} onChange={set('managerId')} className={selectCls}>
                    <option value="">Select...</option>
                    {managers.map(u => (
                      <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                </div>
              </Field>
            </div>
          </div>

          {/* RIGHT COLUMN — Address + Contact Details */}
          <div className="flex-1 p-5 space-y-6">

            {/* ADDRESS */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Address</h2>

              {/* Fix 2: sameAsOffice disables all address fields */}
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sameAsOffice}
                  onChange={e => handleSameAsOffice(e.target.checked)}
                  className="w-3.5 h-3.5 rounded"
                  style={{ accentColor: '#0B5AA0' }}
                />
                <span className="text-xs text-gray-700">Same as Office Location</span>
              </label>

              {/* Fix 3 & 4: Google search with autocomplete; disabled when enterManually */}
              <Field label="Google Address Search">
                <GoogleSearch
                  value={form.googleSearch}
                  onChange={v => { setForm(f => ({ ...f, googleSearch: v })); setIsDirty(true) }}
                  disabled={form.sameAsOffice || form.enterManually}
                  onSelect={handlePlaceSelect}
                />
              </Field>

              {/* Fix 4: entering manually disables google search (done above) */}
              <label className="flex items-center gap-2 mt-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enterManually}
                  onChange={e => setBool('enterManually', e.target.checked)}
                  className="w-3.5 h-3.5"
                  style={{ accentColor: '#0B5AA0' }}
                />
                <span className="text-xs text-gray-700">Enter Address Manually</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Address Line 1" required>
                  <input value={form.addressLine1} onChange={set('addressLine1')} className={inputCls} disabled={addrDisabled} />
                </Field>

                {/* Fix 5: tooltip on ⓘ icon */}
                <Field label="Address Line 2">
                  <div className="flex items-center gap-1.5">
                    <input value={form.addressLine2} onChange={set('addressLine2')} className={inputCls} disabled={addrDisabled} />
                    <div className="relative group flex-shrink-0">
                      <Info size={15} className="text-gray-400 cursor-help" />
                      <div className="absolute right-0 bottom-full mb-2 w-64 z-50 hidden group-hover:block pointer-events-none">
                        <div className="bg-gray-800 text-white text-xs rounded px-3 py-2 leading-relaxed shadow-lg">
                          Address Line 2 can store additional information including: PO Box, Suite/Apartment Number, Community Name, etc.
                          <div className="absolute right-2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Field>
              </div>

              {/* Fix 6: Country as proper select; state updates by country */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <Field label="Country" required>
                  <div className="relative">
                    <select
                      value={form.country}
                      onChange={handleCountryChange}
                      disabled={addrDisabled}
                      className={selectCls}
                    >
                      <option value="">Select...</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                  </div>
                </Field>
                <Field label="State" required>
                  <div className="relative">
                    <select
                      value={form.state}
                      onChange={set('state')}
                      disabled={addrDisabled}
                      className={selectCls}
                    >
                      <option value="">Select...</option>
                      {(COUNTRY_STATES[form.country] ?? []).map(s => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▾</span>
                  </div>
                </Field>
                <Field label="City" required>
                  <input value={form.city} onChange={set('city')} className={inputCls} disabled={addrDisabled} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Field label="County" required>
                  <input value={form.county} onChange={set('county')} className={inputCls} disabled={addrDisabled} />
                </Field>
                <Field label="Zip Code" required>
                  <input value={form.zip} onChange={set('zip')} className={inputCls} disabled={addrDisabled} />
                </Field>
                <Field label="Latitude">
                  <input value={form.latitude} onChange={set('latitude')} className={inputCls} disabled={addrDisabled} />
                </Field>
                <Field label="Longitude">
                  <input value={form.longitude} onChange={set('longitude')} className={inputCls} disabled={addrDisabled} />
                </Field>
              </div>
            </div>

            {/* CONTACT DETAILS */}
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-4">Contact Details</h2>
              <div className="grid grid-cols-2 gap-3">

                {/* Fix 7: Telephone with flag picker */}
                <Field label="Telephone Number" required>
                  <div className="flex items-center border border-gray-200 rounded overflow-visible bg-white">
                    <PhonePicker selected={phonePrimary} onSelect={setPhonePrimary} />
                    <input
                      value={form.phone}
                      onChange={e => { setForm(f => ({ ...f, phone: formatPhone(e.target.value) })); setIsDirty(true) }}
                      inputMode="numeric"
                      maxLength={14}
                      className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                      placeholder="(###) ###-####"
                    />
                  </div>
                </Field>

                <Field label="Extension">
                  <input value={form.extension} onChange={set('extension')} className={inputCls} />
                </Field>

                {/* Fix 7: Alt phone with flag picker */}
                <Field label="Alternative Telephone Number">
                  <div className="flex items-center border border-gray-200 rounded overflow-visible bg-white">
                    <PhonePicker selected={phoneAlt} onSelect={setPhoneAlt} />
                    <input
                      value={form.altPhone}
                      onChange={e => { setForm(f => ({ ...f, altPhone: formatPhone(e.target.value) })); setIsDirty(true) }}
                      inputMode="numeric"
                      maxLength={14}
                      className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                      placeholder="(###) ###-####"
                    />
                  </div>
                </Field>

                <Field label="Email ID" required>
                  <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
                </Field>
              </div>
            </div>
          </div>
        </div>

        {/* USER RIGHTS — full width */}
        <div className="bg-white border border-gray-200 rounded-lg mt-4 p-5">
          <PermissionGrid
            modules={modules}
            onChange={m => { setModules(m); setIsDirty(true) }}
          />
        </div>
      </div>

      {/* Floating "Top" button */}
      <button
        onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-20 right-6 w-12 h-12 rounded-full text-white flex flex-col items-center justify-center text-xs font-medium shadow-lg z-40"
        style={{ background: '#0B5AA0' }}
      >
        <ChevronUp size={16} />
        <span className="text-[10px] leading-none">Top</span>
      </button>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-end gap-3 z-30">
        <button onClick={handleCancel} className="btn-cancel">Cancel</button>
        <button onClick={handleSave} className="btn-save">Save</button>
      </div>

      {/* Unsaved Changes modal */}
      {showUnsaved && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Discard unsaved changes?</div>
                <div className="text-xs text-gray-500">You have unsaved changes. If you leave now, your changes will be lost.</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowUnsaved(false)} className="px-4 py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Stay</button>
              <button onClick={() => { setShowUnsaved(false); onCancel() }} className="px-4 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700">Discard & Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset modal */}
      {showPwReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-80 p-6">
            <div className="flex items-start gap-3 mb-4">
              <RefreshCw size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-1">Reset Password</div>
                <div className="text-xs text-gray-500">
                  A password reset email will be sent to <strong>{form.email || 'this user'}</strong>. Are you sure?
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPwReset(false)} className="px-4 py-2 text-xs border border-gray-300 rounded text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowPwReset(false); toast('success', 'Password reset email dispatched.') }} className="px-4 py-2 text-xs bg-orange-600 text-white rounded hover:bg-orange-700">Send Reset Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
