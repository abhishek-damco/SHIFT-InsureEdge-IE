// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
import api from './client';
import type {
  ClaimEnquiryResponse,
  PolicySearchResponse,
  PolicyClaimsModalDto,
  PolicyDetailsDto,
  ClaimDetailDto,
  CreateOrUpdateClaimRequest,
  ClaimSaveResponse,
  ClaimReferenceDataDto,
  UpdateClaimAssignmentRequest,
  CreateClaimDocumentRequest,
  ClaimDocumentDto,
  UpsertTempClaimReportRequest,
  UpsertTempClaimPartyRequest,
  UpsertTempClaimWitnessRequest,
  AssignableUserDto,
  ClaimAuthorityDto,
  ClaimAuthorityDetailDto,
  ClaimAuthorityUserSelectionDto,
  LossExposureDto,
  CreateLossExposureRequest,
  LossExposureFormData,
} from '../types/Claim';

export const claimsApi = {
  // CS-148: enquiry grid (DRAFT excluded server-side)
  getEnquiryList: (search?: string) =>
    api.get<ClaimEnquiryResponse>('/claims', { params: { search } }).then(r => r.data),

  // Step 1: policy search
  searchPolicies: (params: {
    search?: string;
    searchField?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api.get<PolicySearchResponse>('/claims/policies', { params }).then(r => r.data),

  // Step 1 → Modal: in-progress + existing claims
  getPolicyClaims: (policyId: number) =>
    api.get<PolicyClaimsModalDto>(`/claims/policies/${policyId}/claims`).then(r => r.data),

  // Step 2: policy details (insured + risk location)
  getPolicyDetails: (policyId: number) =>
    api.get<PolicyDetailsDto>(`/claims/policies/${policyId}/details`).then(r => r.data),

  // Get full claim (resume FNOL or view)
  getById: (id: number) =>
    api.get<ClaimDetailDto>(`/claims/${id}`).then(r => r.data),

  // Get full claim while creating/resuming FNOL without requiring Claims Inquiry access
  getFnolById: (id: number) =>
    api.get<ClaimDetailDto>(`/claims/fnol/${id}`).then(r => r.data),

  // CS-19: create or update (Step 3 Next)
  createOrUpdate: (req: CreateOrUpdateClaimRequest) =>
    api.post<ClaimSaveResponse>('/claims', req).then(r => r.data),

  // Delete DRAFT (in-progress FNOL modal)
  deleteDraft: (id: number) =>
    api.delete(`/claims/${id}/draft`),

  // Export enquiry list (CSV-backed, matching group list behavior)
  export: (params: { format?: string; search?: string }) =>
    api.get('/claims/export', { params, responseType: 'blob' }).then(r => r.data as Blob),

  exportSelected: (ids: number[], format: string) =>
    api.post('/claims/export/selected', { ids, format }, { responseType: 'blob' }).then(r => r.data as Blob),
  updateAssignment: (claimId: number, req: UpdateClaimAssignmentRequest) =>
    api.put(`/claims/${claimId}/assignment`, req).then(r => r.data),

  getDocuments: (claimId: number) =>
    api.get(`/claims/${claimId}/documents`).then(r => r.data),

  addDocument: (claimId: number, req: CreateClaimDocumentRequest) =>
    api.post(`/claims/${claimId}/documents`, req).then(r => r.data),

  getFnolDocuments: (claimId: number) =>
    api.get<ClaimDocumentDto[]>(`/claims/fnol/${claimId}/documents`).then(r => r.data),

  addFnolDocument: (claimId: number, req: CreateClaimDocumentRequest) =>
    api.post<ClaimDocumentDto>(`/claims/fnol/${claimId}/documents`, req).then(r => r.data),

  deleteDocument: (claimId: number, documentId: number) =>
    api.delete(`/claims/${claimId}/documents/${documentId}`),

  getDocumentFileUrl: (claimId: number, documentId: number) =>
    `/api/claims/${claimId}/documents/${documentId}/file`,

  getTempReports: (claimId: number) =>
    api.get(`/claims/${claimId}/temp-reports`).then(r => r.data),

  saveTempReport: (claimId: number, req: UpsertTempClaimReportRequest) =>
    api.post(`/claims/${claimId}/temp-reports`, req).then(r => r.data),

  deleteTempReport: (claimId: number, rowId: number) =>
    api.delete(`/claims/${claimId}/temp-reports/${rowId}`),

  getTempParties: (claimId: number) =>
    api.get(`/claims/${claimId}/temp-parties`).then(r => r.data),

  saveTempParty: (claimId: number, req: UpsertTempClaimPartyRequest) =>
    api.post(`/claims/${claimId}/temp-parties`, req).then(r => r.data),

  deleteTempParty: (claimId: number, rowId: number) =>
    api.delete(`/claims/${claimId}/temp-parties/${rowId}`),

  getTempWitnesses: (claimId: number) =>
    api.get(`/claims/${claimId}/temp-witnesses`).then(r => r.data),

  saveTempWitness: (claimId: number, req: UpsertTempClaimWitnessRequest) =>
    api.post(`/claims/${claimId}/temp-witnesses`, req).then(r => r.data),

  deleteTempWitness: (claimId: number, rowId: number) =>
    api.delete(`/claims/${claimId}/temp-witnesses/${rowId}`),

  getLossExposures: (claimId: number) =>
    api.get<LossExposureDto[]>(`/claims/${claimId}/loss-exposures`).then(r => r.data),

  getLossExposureFormData: (claimId: number) =>
    api.get<LossExposureFormData>(`/claims/${claimId}/loss-exposures/form-data`).then(r => r.data),

  createLossExposure: (claimId: number, req: CreateLossExposureRequest) =>
    api.post<LossExposureDto>(`/claims/${claimId}/loss-exposures`, req).then(r => r.data),

  deleteLossExposure: (claimId: number, rowId: number) =>
    api.delete(`/claims/${claimId}/loss-exposures/${rowId}`),

  // Reference data for all dropdowns
  getReferenceData: () =>
    api.get<ClaimReferenceDataDto>('/claims/reference-data').then(r => r.data),

  getFnolReferenceData: () =>
    api.get<ClaimReferenceDataDto>('/claims/fnol/reference-data').then(r => r.data),

  // Dynamic impacted assets for a given coverage (from claim_coverage_limit)
  getImpactedAssetsForCoverage: (coverageId: number) =>
    api.get<string[]>(`/claims/coverage/${coverageId}/assets`).then(r => r.data),

  // Worksheet auto-fill: Coverage Limit when coverage is selected
  getCoverageLimit: (coverageId: number) =>
    api.get<{ limit: string | null }>(`/claims/coverage/${coverageId}/coverage-limit`).then(r => r.data),

  // Worksheet auto-fill: Loss Limit when cause of loss is selected
  getColLossLimit: (colId: number) =>
    api.get<{ limit: number | null; code: string | null }>(`/claims/coverage/${colId}/loss-limit`).then(r => r.data),

  // Worksheet auto-fill: Impacted Asset limit + code when asset type is selected
  getAssetDetail: (coverageId: number, assetType: string) =>
    api.get<{ limit: number | null; code: string | null }>(`/claims/coverage/${coverageId}/asset-detail`, { params: { assetType } }).then(r => r.data),

  // ── Financial Worksheet ──────────────────────────────────────────────────
  getWorksheets: (claimId: number) =>
    api.get(`/claims/${claimId}/worksheets`).then(r => r.data),

  getWorksheet: (claimId: number, wsId: number) =>
    api.get(`/claims/${claimId}/worksheets/${wsId}`).then(r => r.data),

  saveWorksheet: (claimId: number, req: object) =>
    api.post(`/claims/${claimId}/worksheets/save`, req).then(r => r.data),

  bookWorksheet: (claimId: number, wsId: number) =>
    api.post(`/claims/${claimId}/worksheets/${wsId}/book`).then(r => r.data),

  approveWorksheet: (claimId: number, wsId: number) =>
    api.post(`/claims/${claimId}/worksheets/${wsId}/approve`).then(r => r.data),

  denyWorksheet: (claimId: number, wsId: number) =>
    api.post(`/claims/${claimId}/worksheets/${wsId}/deny`).then(r => r.data),

  escalateWorksheet: (claimId: number, wsId: number, escalateTo: number) =>
    api.post(`/claims/${claimId}/worksheets/${wsId}/escalate`, { escalateTo }).then(r => r.data),

  // ── Dashboard KPIs & Widgets ─────────────────────────────────────────────
  getDashboardKpis: () =>
    api.get<{ total: number; unassigned: number; open: number; pending: number; referred: number }>(
      '/claims/dashboard/kpis'
    ).then(r => r.data),

  getDashboardRecentFnol: () =>
    api.get<{ id: number; claim_number: string; policy_number: string; claim_type: string; claim_estimate: string }[]>(
      '/claims/dashboard/recent-fnol'
    ).then(r => r.data),

  getDashboardAssigned: () =>
    api.get<{ id: number; claim_number: string; policy_number: string; claim_type: string; claim_incurred: string }[]>(
      '/claims/dashboard/assigned'
    ).then(r => r.data),

  getDashboardNotifications: () =>
    api.get<{ claim_id: number; claim_number: string; policy_number: string; claim_type: string; message: string }[]>(
      '/claims/dashboard/notifications'
    ).then(r => r.data),

  getDashboardNotes: () =>
    api.get<{ claim_id: number; claim_number: string; policy_number: string; claim_type: string; message: string }[]>(
      '/claims/dashboard/notes'
    ).then(r => r.data),

  getDashboardAging: () =>
    api.get<{ index: number; user_name: string; initials: string; lt3: number; lt5: number; lt10: number; lt15: number; lt20: number; lt25: number; lt30: number }[]>(
      '/claims/dashboard/aging'
    ).then(r => r.data),

  // ── Dashboard Analytics ──────────────────────────────────────────────────
  getDashboardFnolByMonth: () =>
    api.get<{ month: string; month_num: number; year: number; count: number }[]>(
      '/claims/dashboard/fnol-by-month'
    ).then(r => r.data),

  getDashboardAvgClaimHandled: () =>
    api.get<{ month: string; month_num: number; year: number; count: number }[]>(
      '/claims/dashboard/avg-claim-handled'
    ).then(r => r.data),

  getDashboardAvgClaimPaid: () =>
    api.get<{ month: string; month_num: number; year: number; amount: number }[]>(
      '/claims/dashboard/avg-claim-paid'
    ).then(r => r.data),

  getDashboardAvgTat: () =>
    api.get<{ month: string; month_num: number; year: number; avg_days: number }[]>(
      '/claims/dashboard/avg-tat'
    ).then(r => r.data),

  getDashboardChartMonths: () =>
    api.get<{ label: string; value: string }[]>(
      '/claims/dashboard/months'
    ).then(r => r.data),

  getDashboardApprovalTrend: (period: string) =>
    api.get<{ status: string; count: number }[]>(
      `/claims/dashboard/approval-trend?period=${period}`
    ).then(r => r.data),

  getDashboardClaimByLob: (period: string) =>
    api.get<{ lob: string; count: number }[]>(
      `/claims/dashboard/claim-by-lob?period=${period}`
    ).then(r => r.data),

  getDashboardTopCauseOfLoss: (period: string) =>
    api.get<{ cause_of_loss: string; count: number }[]>(
      `/claims/dashboard/top-cause-of-loss?period=${period}`
    ).then(r => r.data),

  getAssignableUsers: (search?: string) =>
    api.get<AssignableUserDto[]>('/claims/assignable-users', { params: { search } }).then(r => r.data),

  getAuthorityList: (search?: string) =>
    api.get<ClaimAuthorityDto[]>('/claims/authority', { params: { search } }).then(r => r.data),

  getAuthorityDetail: (id: number) =>
    api.get<ClaimAuthorityDetailDto>(`/claims/authority/${id}`).then(r => r.data),

  createAuthority: (req: {
    userId: number; insuranceType: string; approvedLob: string; currency: string;
    reserveLimit: number; indemnityPaymentLimit: number; feePaymentLimit: number;
    exGratiaPaymentLimit: number; paymentMethodRestrictions: string;
    dateOfAuthorityAssignment: string | null; canDenyWorksheet: boolean;
    jurisdictionCountry: string; jurisdictionStates: string;
  }) => api.post<{ id: number }>('/claims/authority', req).then(r => r.data),

  updateAuthority: (id: number, req: {
    insuranceType: string; approvedLob: string; currency: string;
    reserveLimit: number; indemnityPaymentLimit: number; feePaymentLimit: number;
    exGratiaPaymentLimit: number; paymentMethodRestrictions: string;
    dateOfAuthorityAssignment: string | null; canDenyWorksheet: boolean;
    jurisdictionCountry: string; jurisdictionStates: string;
  }) => api.put(`/claims/authority/${id}`, req).then(r => r.data),

  approveAuthority: (id: number) =>
    api.post(`/claims/authority/${id}/approve`).then(r => r.data),

  revokeAuthority: (id: number) =>
    api.post(`/claims/authority/${id}/revoke`).then(r => r.data),

  getAvailableUsersForAuthority: (searchKeyword?: string, searchParameter?: string) =>
    api.get<ClaimAuthorityUserSelectionDto[]>('/claims/authority/available-users', {
      params: { searchKeyword, searchParameter },
    }).then(r => r.data),
};
