// All calls go through Vite proxy → http://localhost:4000

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number
  user_code: string
  status: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  email: string
  date_of_birth: string | null
  gender: string | null
  is_remote_working: boolean
  is_manager: boolean
  office_location: string | null
  department: string | null
  address_line1: string | null
  address_line2: string | null
  country_code: string | null
  state_code: string | null
  city: string | null
  county: string | null
  zip_code: string | null
  latitude: string | null
  longitude: string | null
  telephone_number: string | null
  telephone_number_cc: string | null
  alt_telephone_number: string | null
  alt_telephone_number_cc: string | null
  extension: string | null
  bio: string | null
  reports_to: number | null
  manager_name: string | null
  country_name: string | null
  state_name: string | null
  created_on: string
  updated_on: string | null
  groups: { id: number; group_name: string }[]
  permissions: {
    screen_id: number
    screen_code: string
    screen_name: string
    module_name: string
    is_view_permission: boolean
    is_create_permission: boolean
    is_edit_permission: boolean
    is_duplicate_permission: boolean
    is_upload_permission: boolean
    is_download_permission: boolean
    is_view_sensitive_info: boolean
    is_access_sensitive_doc: boolean
    is_approve_reject: boolean
    all_access: boolean
  }[]
}

export interface UserListResponse {
  items: ApiUser[]
  total: number
  page: number
  pageSize: number
  active: string
  inactive: string
}

export interface Country {
  code: string
  name: string
  country_dial_code: string
}

export interface StateOption {
  code: string
  name: string
  abbreviation: string
}

export interface GroupOption {
  id: number
  group_code: string
  group_name: string
}

export interface ModuleOption {
  id: number
  module_name: string
  screens: { id: number; screen_code: string; screen_name: string }[]
}

// ── Users ──────────────────────────────────────────────────────────────────

export const usersApi = {
  list(params: Record<string, string | number> = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString()
    return request<UserListResponse>(`/api/users${qs ? '?' + qs : ''}`)
  },

  get(id: number) {
    return request<ApiUser>(`/api/users/${id}`)
  },

  create(body: Record<string, unknown>) {
    return request<{ id: number; user_code: string }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: number, body: Record<string, unknown>) {
    return request<{ success: boolean }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  setStatus(id: number, status: 'Active' | 'Inactive') {
    return request<{ success: boolean }>(`/api/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}

// ── Reference ──────────────────────────────────────────────────────────────

export const referenceApi = {
  countries: () => request<Country[]>('/api/reference/countries'),
  states: (country_code: string) =>
    request<StateOption[]>(`/api/reference/states?country_code=${country_code}`),
  groups: () => request<GroupOption[]>('/api/reference/groups'),
  modules: () => request<ModuleOption[]>('/api/reference/modules'),
  managers: () => request<ApiUser[]>('/api/reference/managers'),
}
