import api from './client';
import type { DashboardFailedPayment, DashboardListQuery, DashboardPagedResponse, DashboardPendingCancellation, DashboardPreference, DashboardQuoteQuery, DashboardQuoteResponse, DashboardRenewalRadar, DashboardRenewalResult, DashboardSummary } from '../types/Dashboard';

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary').then(response => response.data),
  getQuotes: (query: DashboardQuoteQuery) =>
    api.get<DashboardQuoteResponse>('/dashboard/quotes', { params: query }).then(response => response.data),
  getPendingCancellations: (query: DashboardListQuery) =>
    api.get<DashboardPagedResponse<DashboardPendingCancellation>>('/dashboard/pending-cancellations', { params: query }).then(response => response.data),
  getRenewalRadar: (query: DashboardListQuery) =>
    api.get<DashboardPagedResponse<DashboardRenewalRadar>>('/dashboard/renewal-radar', { params: query }).then(response => response.data),
  getFailedPayments: (query: DashboardListQuery) =>
    api.get<DashboardPagedResponse<DashboardFailedPayment>>('/dashboard/failed-payments', { params: query }).then(response => response.data),
  getPreference: () => api.get<DashboardPreference>('/dashboard/preference').then(response => response.data),
  savePreference: (preference: DashboardPreference) => api.put<DashboardPreference>('/dashboard/preference', preference).then(response => response.data),
  recordView: (policyId: number) => api.post('/dashboard/activity/view', { policyId }),
  initiateRenewal: (policyId: number) => api.post<DashboardRenewalResult>(`/dashboard/policies/${policyId}/renewal`).then(response => response.data),
};
