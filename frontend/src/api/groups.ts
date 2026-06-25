import api from './client';
import type {
  GroupListResponse, GroupDetailDto, CreateGroupRequest,
  UpdateGroupInfoRequest, ScreenPermissionSaveDto,
} from '../types/Group';

export interface ScreenListItem {
  screenId: number;
  screenCode: string;
  screenName: string;
  moduleId: number;
  moduleName: string;
}

export const groupsApi = {
  list: (params: {
    search?: string; status?: string; sortBy?: string;
    sortOrder?: string; page?: number; pageSize?: number;
  }) => api.get<GroupListResponse>('/groups', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get<GroupDetailDto>(`/groups/${id}`).then(r => r.data),

  create: (req: CreateGroupRequest) =>
    api.post<{ id: number }>('/groups', req).then(r => r.data),

  updateInfo: (id: number, req: UpdateGroupInfoRequest) =>
    api.patch(`/groups/${id}/info`, req),

  syncMembers: (id: number, memberIds: number[]) =>
    api.put(`/groups/${id}/members`, { memberIds }),

  savePermissions: (id: number, permissions: ScreenPermissionSaveDto[]) =>
    api.put(`/groups/${id}/permissions`, { permissions }),

  export: (params: { format?: string; search?: string; status?: string }) =>
    api.get('/groups/export', { params, responseType: 'blob' }).then(r => r.data as Blob),

  exportSelected: (ids: number[], format: string) =>
    api.post('/groups/export/selected', { ids, format }, { responseType: 'blob' }).then(r => r.data as Blob),

  getScreens: () =>
    api.get<ScreenListItem[]>('/groups/screens').then(r => r.data),
};
