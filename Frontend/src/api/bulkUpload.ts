// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Bulk Upload (Quotes & Policies) API client — mirrors distributionApi.bulkUpload
// but hits the new /bulk-upload endpoints backed by BulkUploadController, scoped
// to module=QUOTES_POLICIES.
import apiClient from './client';

export const QUOTES_POLICIES_MODULE = 'QUOTES_POLICIES';

export const bulkUploadApi = {
  template: (module: string = QUOTES_POLICIES_MODULE) =>
    apiClient.get<Blob>('/bulk-upload/template', {
      params: { module },
      responseType: 'blob',
    }).then(r => r.data),

  upload: (file: File, module: string = QUOTES_POLICIES_MODULE) => {
    const form = new FormData();
    form.append('file', file);
    form.append('module', module);
    return apiClient.post<any>('/bulk-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  history: (module: string = QUOTES_POLICIES_MODULE) =>
    apiClient.get<any[]>('/bulk-upload/history', { params: { module } }).then(r => r.data),

  errorReport: (auditId: number) =>
    apiClient.get<Blob>(`/bulk-upload/${auditId}/error-report`, { responseType: 'blob' }).then(r => r.data),
};
