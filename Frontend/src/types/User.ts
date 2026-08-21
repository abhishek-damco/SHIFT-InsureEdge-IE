// US-010: Member picker dropdown
export interface UserSelectDto {
  id: number;
  fullName: string;
  email: string;
  initials: string;
}

export interface GroupRef {
  id: number;
  groupName: string;
}

export interface PermissionRow {
  screenId: number;
  screenCode: string;
  screenName: string;
  moduleName: string;
  isViewPermission: boolean;
  isCreatePermission: boolean;
  isEditPermission: boolean;
  isDuplicatePermission: boolean;
  isUploadPermission: boolean;
  isDownloadPermission: boolean;
  isViewSensitiveInfo: boolean;
  isAccessSensitiveDoc: boolean;
  isApproveReject: boolean;
  allAccess: boolean;
}

export interface UserListItem {
  id: number;
  userCode: string;
  status: string;
  statusToggle: boolean;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  isRemoteWorking: boolean;
  isManager: boolean;
  officeLocation?: string;
  department?: string;
  addressLine1?: string;
  addressLine2?: string;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  altTelephoneNumber?: string;
  altTelephoneNumberCc?: string;
  extension?: string;
  bio?: string;
  createdOn?: string;
  updatedOn?: string;
  reportsTo?: number;
  managerName?: string;
  countryName?: string;
  stateName?: string;
  groups: GroupRef[];
}

export interface UserDetail extends UserListItem {
  permissions: PermissionRow[];
}

export interface UserListResponse {
  items: UserListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalUsers: number;
  active: number;
  inactive: number;
}

export interface PermissionInput {
  screenId: number;
  isViewPermission: boolean;
  isCreatePermission: boolean;
  isEditPermission: boolean;
  isDuplicatePermission: boolean;
  isUploadPermission: boolean;
  isDownloadPermission: boolean;
  isViewSensitiveInfo: boolean;
  isAccessSensitiveDoc: boolean;
  isApproveReject: boolean;
  allAccess: boolean;
}

export interface CreateUserRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  isRemoteWorking: boolean;
  isManager: boolean;
  officeLocation?: string;
  department?: string;
  reportsTo?: number;
  addressLine1?: string;
  addressLine2?: string;
  countryCode?: string;
  stateCode?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  altTelephoneNumber?: string;
  altTelephoneNumberCc?: string;
  extension?: string;
  bio?: string;
  groupIds: number[];
  permissions: PermissionInput[];
}

export interface CountryRow {
  code: string;
  name: string;
  countryDialCode?: string;
}

export interface StateRow {
  code: string;
  name: string;
  abbreviation?: string;
}

export interface GroupRow {
  id: number;
  groupCode: string;
  groupName: string;
}

export interface ScreenRow {
  id: number;
  screenCode: string;
  screenName: string;
  moduleId: number;
}

export interface ModuleRow {
  id: number;
  moduleName: string;
  screens: ScreenRow[];
}

export interface ManagerRow {
  id: number;
  userCode: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OptionRow {
  value: string;
  label: string;
}
