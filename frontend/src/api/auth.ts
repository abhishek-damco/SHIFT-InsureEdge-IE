import api from './client';
import type { ScreenPermissionsDto } from '../types/Permission';
import type { UserSelectDto } from '../types/User';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ id: number; fullName: string; email: string }>('/auth/login', { email, password }).then(r => r.data),

  logout: () => api.post('/auth/logout'),

  getMyPermissions: () =>
    api.get<ScreenPermissionsDto[]>('/auth/me/permissions').then(r => r.data),

  getUsers: () =>
    api.get<UserSelectDto[]>('/auth/users').then(r => r.data),
};
