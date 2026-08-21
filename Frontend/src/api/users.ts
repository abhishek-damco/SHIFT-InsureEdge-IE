import api from './client';
import type {
  UserListResponse, UserDetail, CreateUserRequest,
  CountryRow, StateRow, GroupRow, ModuleRow, ManagerRow, OptionRow,
} from '../types/User';

export interface UserListParams {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
}

export const usersApi = {
  list: (params: UserListParams = {}) =>
    api.get<UserListResponse>('/users', { params }).then(r => r.data),

  get: (id: number) =>
    api.get<UserDetail>(`/users/${id}`).then(r => r.data),

  create: (data: CreateUserRequest) =>
    api.post<{ id: number; userCode: string }>('/users', data).then(r => r.data),

  update: (id: number, data: CreateUserRequest) =>
    api.put<{ success: boolean }>(`/users/${id}`, data).then(r => r.data),

  updateStatus: (id: number, status: 'Active' | 'Inactive') =>
    api.patch<{ success: boolean }>(`/users/${id}/status`, { status }).then(r => r.data),
};

export const referenceApi = {
  countries: () =>
    api.get<CountryRow[]>('/reference/countries').then(r => r.data),

  states: (countryCode: string) =>
    api.get<StateRow[]>('/reference/states', { params: { country_code: countryCode } }).then(r => r.data),

  groups: () =>
    api.get<GroupRow[]>('/reference/groups').then(r => r.data),

  modules: () =>
    api.get<ModuleRow[]>('/reference/modules').then(r => r.data),

  managers: () =>
    api.get<ManagerRow[]>('/reference/managers').then(r => r.data),

  officeLocations: () =>
    api.get<OptionRow[]>('/reference/office-locations').then(r => r.data),

  officeAddress: (location: string) =>
    api.get<{
      addressLine1: string; addressLine2: string;
      countryCode: string; stateCode: string; city: string;
      county: string; zipCode: string;
      latitude: number | null; longitude: number | null;
    } | null>('/reference/office-locations/address', { params: { location } }).then(r => r.data),

  groupPermissions: (groupId: number) =>
    api.get<Array<{
      screenId: number;
      isViewPermission: boolean; isCreatePermission: boolean; isEditPermission: boolean;
      isDuplicatePermission: boolean; isUploadPermission: boolean; isDownloadPermission: boolean;
      isViewSensitiveInfo: boolean; isAccessSensitiveDoc: boolean; isApproveReject: boolean;
    }>>(`/reference/groups/${groupId}/permissions`).then(r => r.data),
};
