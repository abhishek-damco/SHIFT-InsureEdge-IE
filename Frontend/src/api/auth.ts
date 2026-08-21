import api from './client';
import type { ScreenPermissionsDto } from '../types/Permission';
import type { UserSelectDto } from '../types/User';
import type { MyProfile, UpdateMyProfileRequest, MyProducerResponse } from '../types/CurrentUser';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ id: number; fullName: string; email: string }>('/auth/login', { email, password }).then(r => r.data),

  logout: () => api.post('/auth/logout'),

  getMyPermissions: () =>
    api.get<ScreenPermissionsDto[]>('/auth/me/permissions').then(r => r.data),

  getMe: () =>
    api.get<{ id: number; email: string; fullName: string }>('/auth/me').then(r => r.data),

  getUsers: () =>
    api.get<UserSelectDto[]>('/auth/users').then(r => r.data),

  getMyProfile: () =>
    api.get<MyProfile>('/auth/me/profile').then(r => r.data),

  updateMyProfile: (req: UpdateMyProfileRequest) =>
    api.put<MyProfile>('/auth/me/profile', req).then(r => r.data),

  getMyProducer: () =>
    api.get<MyProducerResponse>('/auth/me/producer').then(r => r.data),
};
