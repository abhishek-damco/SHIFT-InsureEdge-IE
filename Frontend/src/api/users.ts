import api from './client';
import type {
  UserListResponse, UserDetail, CreateUserRequest,
  CountryRow, StateRow, GroupRow, ModuleRow, ManagerRow, OptionRow, PermissionInput,
} from '../types/User';

type WireRecord = Record<string, unknown>;

const permissionKeys = [
  'isViewPermission', 'isCreatePermission', 'isEditPermission',
  'isDuplicatePermission', 'isUploadPermission', 'isDownloadPermission',
  'isViewSensitiveInfo', 'isAccessSensitiveDoc', 'isApproveReject',
] as const;

function numericId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function wireValue(row: WireRecord, camelKey: string, snakeKey: string): unknown {
  return row[camelKey] ?? row[snakeKey];
}

function normalizeModules(data: unknown): ModuleRow[] {
  if (!Array.isArray(data)) return [];

  const seenScreenIds = new Set<number>();
  return data.flatMap(rawModule => {
    if (!rawModule || typeof rawModule !== 'object') return [];
    const module = rawModule as WireRecord;
    const id = numericId(module.id);
    if (id === null || typeof module.moduleName !== 'string') return [];

    const rawScreens = Array.isArray(module.screens) ? module.screens : [];
    const screens = rawScreens.flatMap(rawScreen => {
      if (!rawScreen || typeof rawScreen !== 'object') return [];
      const screen = rawScreen as WireRecord;
      const screenId = numericId(screen.id);
      if (screenId === null || seenScreenIds.has(screenId) ||
          typeof screen.screenCode !== 'string' || typeof screen.screenName !== 'string') return [];

      seenScreenIds.add(screenId);
      return [{
        id: screenId,
        screenCode: screen.screenCode,
        screenName: screen.screenName,
        moduleId: numericId(screen.moduleId) ?? id,
      }];
    });

    return [{ id, moduleName: module.moduleName, screens }];
  });
}

function normalizeGroupPermissions(data: unknown): PermissionInput[] {
  if (!Array.isArray(data)) return [];

  return data.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const row = raw as WireRecord;
    const screenId = numericId(wireValue(row, 'screenId', 'screen_id'));
    if (screenId === null) return [];

    const permission = {
      screenId,
      isViewPermission: Boolean(wireValue(row, 'isViewPermission', 'is_view_permission')),
      isCreatePermission: Boolean(wireValue(row, 'isCreatePermission', 'is_create_permission')),
      isEditPermission: Boolean(wireValue(row, 'isEditPermission', 'is_edit_permission')),
      isDuplicatePermission: Boolean(wireValue(row, 'isDuplicatePermission', 'is_duplicate_permission')),
      isUploadPermission: Boolean(wireValue(row, 'isUploadPermission', 'is_upload_permission')),
      isDownloadPermission: Boolean(wireValue(row, 'isDownloadPermission', 'is_download_permission')),
      isViewSensitiveInfo: Boolean(wireValue(row, 'isViewSensitiveInfo', 'is_view_sensitive_info')),
      isAccessSensitiveDoc: Boolean(wireValue(row, 'isAccessSensitiveDoc', 'is_access_sensitive_doc')),
      isApproveReject: Boolean(wireValue(row, 'isApproveReject', 'is_approve_reject')),
      allAccess: false,
    };
    permission.allAccess = permissionKeys.every(key => permission[key]);
    return [permission];
  });
}

export function sanitizePermissions(
  permissions: PermissionInput[], validScreenIds?: ReadonlySet<number>,
): PermissionInput[] {
  const byScreenId = new Map<number, PermissionInput>();
  let invalidCount = 0;

  for (const permission of permissions) {
    const screenId = numericId(permission?.screenId);
    if (screenId === null || (validScreenIds && !validScreenIds.has(screenId))) {
      invalidCount += 1;
      continue;
    }

    const existing = byScreenId.get(screenId);
    const merged = { ...permission, screenId };
    if (existing) {
      for (const key of permissionKeys) merged[key] = Boolean(existing[key] || permission[key]);
    }
    merged.allAccess = permissionKeys.every(key => merged[key]);
    byScreenId.set(screenId, merged);
  }

  if (invalidCount > 0) {
    console.warn(`Ignored ${invalidCount} permission entr${invalidCount === 1 ? 'y' : 'ies'} with an invalid or unavailable screenId.`);
  }
  return Array.from(byScreenId.values());
}

async function prepareUserRequest(data: CreateUserRequest): Promise<CreateUserRequest> {
  // Re-read the authoritative screen list at save time. This prevents a page opened
  // before a production screen change from posting stale foreign-key values.
  const modules = normalizeModules((await api.get<unknown>('/reference/modules', {
    params: { validationTimestamp: Date.now() },
    headers: { 'Cache-Control': 'no-cache' },
  })).data);
  const validScreenIds = new Set(modules.flatMap(module => module.screens.map(screen => screen.id)));
  if (validScreenIds.size === 0) throw new Error('Unable to validate user permissions against the current screen list.');
  return { ...data, permissions: sanitizePermissions(data.permissions, validScreenIds) };
}

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

  create: async (data: CreateUserRequest) =>
    api.post<{ id: number; userCode: string }>('/users', await prepareUserRequest(data)).then(r => r.data),

  update: async (id: number, data: CreateUserRequest) =>
    api.put<{ success: boolean }>(`/users/${id}`, await prepareUserRequest(data)).then(r => r.data),

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
    api.get<unknown>('/reference/modules').then(r => normalizeModules(r.data)),

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
    api.get<unknown>(`/reference/groups/${groupId}/permissions`).then(r => normalizeGroupPermissions(r.data)),
};
