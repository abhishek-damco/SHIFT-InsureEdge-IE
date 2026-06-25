export interface User {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  groups: string[]
  officeLocation: string
  address: string
  status: 'Active' | 'Inactive'
  // extended fields
  middleName?: string
  suffix?: string
  dob?: string
  gender?: string
  worksRemotely?: boolean
  department?: string
  isManager?: boolean
  profileImage?: string
  managerId?: string
  // address breakdown
  addressLine1?: string
  addressLine2?: string
  country?: string
  state?: string
  city?: string
  county?: string
  zip?: string
  latitude?: string
  longitude?: string
  // contact extras
  extension?: string
  altPhone?: string
}

export type PermissionType = 'view' | 'add' | 'edit' | 'clone' | 'upload' | 'download' | 'sensitiveData' | 'sensitiveDocuments' | 'approveReject'

export interface PermissionRow {
  id: string
  label: string
  group?: string  // sub-module grouping label shown as column header
  permissions: Record<PermissionType, boolean | null> // null = N/A
}

export interface PermissionModule {
  id: string
  name: string
  rows: PermissionRow[]
  readOnly: boolean
  allAccess: boolean
}
