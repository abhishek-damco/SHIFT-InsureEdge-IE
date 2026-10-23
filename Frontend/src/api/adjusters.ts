import api from './client';
import type { TempAdjusterDto, UpsertTempAdjusterRequest } from '../types/Adjuster';

export const adjustersApi = {
  getAll: (): Promise<TempAdjusterDto[]> => api.get('/adjusters').then(r => r.data),
  getById: (id: number): Promise<TempAdjusterDto> => api.get(`/adjusters/${id}`).then(r => r.data),
  create: (req: UpsertTempAdjusterRequest): Promise<TempAdjusterDto> => api.post('/adjusters', req).then(r => r.data),
  update: (id: number, req: UpsertTempAdjusterRequest): Promise<TempAdjusterDto> => api.put(`/adjusters/${id}`, req).then(r => r.data),
};
