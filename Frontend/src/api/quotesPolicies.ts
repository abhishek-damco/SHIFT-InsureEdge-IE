// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
import api from './client';
import type {
  NbQuotesKpiDto,
  NbQuoteListResponse,
  EndorsementsKpiDto,
  EndorsementListItemDto,
  RenewalsKpiDto,
  RenewalListItemDto,
  PoliciesKpiDto,
  PolicyListItemDto,
  PolicyTransactionDto,
  PolicySummaryDto,
  PolicyPendingTransactionDto,
  PolicyBillingDetailDto,
  PolicyClaimRowDto,
  PolicyTimelineEntryDto,
  EndorsePolicyRequest,
  EndorsePolicyResult,
  EndorsementFieldChange,
  RequestedByOption,
  PolicyCancellationPreview,
  CancelPolicyRequest,
  CancelPolicyResult,
  CancelRewritePreview,
  CancelRewriteRequest,
  CancelRewriteResult,
  NoticeOfNonRenewalInfo,
  DoNotRenewRequest,
  DoNotRenewResult,
  PolicyRegisterListQueryParams,
  SubmissionDto,
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  SubmissionCommissionDto,
  HbisPlanComparisonForm,
  HbisPlanComparisonResultDto,
  HbTaxDetailsDto,
  CreateRenewalQuoteRequest,
  CreateRenewalQuoteResponse,
  BindRenewalQuoteResponse,
  ProcessRenewalPaymentRequest,
  ProcessRenewalPaymentResponse,
  RenewalQuoteDetailDto,
  NoteDto,
} from '../types/Policy';

export const quotesPoliciesApi = {
  // ─── NB Quotes ────────────────────────────────────────────────────────────
  getNbQuotesKpis: (insuredType: string) =>
    api.get<NbQuotesKpiDto>(`/${insuredType}/nb-quotes/kpis`).then(r => r.data),

  getNbQuotes: (insuredType: string, params: PolicyRegisterListQueryParams = {}) =>
    api.get<NbQuoteListResponse>(`/${insuredType}/nb-quotes`, { params }).then(r => r.data),

  // ─── Endorsements ─────────────────────────────────────────────────────────
  getEndorsementsKpis: (insuredType: string) =>
    api.get<EndorsementsKpiDto>(`/${insuredType}/endorsements/kpis`).then(r => r.data),

  getEndorsements: (insuredType: string, search?: string) =>
    api.get<EndorsementListItemDto[]>(`/${insuredType}/endorsements`, { params: { search } }).then(r => r.data),

  // ─── Renewals ─────────────────────────────────────────────────────────────
  getRenewalsKpis: (insuredType: string) =>
    api.get<RenewalsKpiDto>(`/${insuredType}/renewals/kpis`).then(r => r.data),

  getRenewals: (insuredType: string, search?: string) =>
    api.get<RenewalListItemDto[]>(`/${insuredType}/renewals`, { params: { search } }).then(r => r.data),

  createRenewal: (insuredType: string, req: CreateRenewalQuoteRequest) =>
    api.post<CreateRenewalQuoteResponse>(`/${insuredType}/renewals/create`, req).then(r => r.data),

  getRenewalDetail: (insuredType: string, renewalPolicyId: number) =>
    api.get<RenewalQuoteDetailDto>(`/${insuredType}/renewals/${renewalPolicyId}`).then(r => r.data),

  bindRenewal: (insuredType: string, renewalPolicyId: number) =>
    api.post<BindRenewalQuoteResponse>(`/${insuredType}/renewals/${renewalPolicyId}/bind`).then(r => r.data),

  processRenewalPayment: (insuredType: string, renewalPolicyId: number, req: ProcessRenewalPaymentRequest) =>
    api.post<ProcessRenewalPaymentResponse>(`/${insuredType}/renewals/${renewalPolicyId}/process-payment`, req).then(r => r.data),

  // ─── Policies ─────────────────────────────────────────────────────────────
  getPoliciesKpis: (insuredType: string) =>
    api.get<PoliciesKpiDto>(`/${insuredType}/policies/kpis`).then(r => r.data),

  getPolicies: (insuredType: string, params: { search?: string; status?: string; sortCol?: string; sortDir?: string } = {}) =>
    api.get<PolicyListItemDto[]>(`/${insuredType}/policies`, { params }).then(r => r.data),

  getPolicyHistory: (insuredType: string, policyNumber: string) =>
    api.get<PolicyTransactionDto[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/history`).then(r => r.data),

  getPolicySummary: (insuredType: string, policyNumber: string) =>
    api.get<PolicySummaryDto>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/summary`).then(r => r.data),

  getPendingTransactions: (insuredType: string, policyNumber: string) =>
    api.get<PolicyPendingTransactionDto[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/pending-transactions`).then(r => r.data),

  getBillingDetail: (insuredType: string, policyNumber: string) =>
    api.get<PolicyBillingDetailDto>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/billing`).then(r => r.data),

  getClaims: (insuredType: string, policyNumber: string) =>
    api.get<PolicyClaimRowDto[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/claims`).then(r => r.data),

  getTimeline: (insuredType: string, policyNumber: string) =>
    api.get<PolicyTimelineEntryDto[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/timeline`).then(r => r.data),

  endorsePolicy: (insuredType: string, policyNumber: string, req: EndorsePolicyRequest) =>
    api.post<EndorsePolicyResult>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/endorse`, req).then(r => r.data),

  getEndorsementChanges: (insuredType: string, policyNumber: string) =>
    api.get<EndorsementFieldChange[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/endorsement-changes`).then(r => r.data),

  // Hydrates the wizard's FormState/locations/mortgages/additionalInsureds/additionalOrgs
  // from the endorsement draft's real cloned data — see EndorsementDraftFormDto.
  getEndorsementDraftForm: (insuredType: string, policyNumber: string) =>
    api.get<{
      form: Record<string, any>;
      locations: Record<string, any>[];
      mortgages: Record<string, any>[];
      additionalInsureds: Record<string, any>[];
      additionalOrgs: Record<string, any>[];
    }>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/endorsement-draft-form`).then(r => r.data),

  // Finalize Quote Summary's "Previous Amount" column — prior policy's raw premium inputs
  // (coverage level, state, deductible, endorsement flags, policy fee), for the frontend to
  // run through its own calculatePlanAmounts()/STATE_TAX, same as it does for the current draft.
  getEndorsementPriorPremiumForm: (insuredType: string, policyNumber: string) =>
    api.get<{ form: Record<string, any> }>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/endorsement-prior-premium`).then(r => r.data),

  getRequestedByOptions: (insuredType: string) =>
    api.get<RequestedByOption[]>(`/${insuredType}/policies/cancellation/requested-by-options`).then(r => r.data),

  getReasonOfCancellationOptions: (insuredType: string, requestedBy: string) =>
    api.get<string[]>(`/${insuredType}/policies/cancellation/reason-options`, { params: { requestedBy } }).then(r => r.data),

  getCancellationPreview: (insuredType: string, policyNumber: string, cancellationEffectiveDate: string) =>
    api.get<PolicyCancellationPreview>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/cancellation-preview`, { params: { cancellationEffectiveDate } }).then(r => r.data),

  cancelPolicy: (insuredType: string, policyNumber: string, req: CancelPolicyRequest) =>
    api.post<CancelPolicyResult>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/cancel`, req).then(r => r.data),

  getReasonForRewritingOptions: (insuredType: string) =>
    api.get<string[]>(`/${insuredType}/policies/cancel-rewrite/reason-options`).then(r => r.data),

  getCancelRewritePreview: (insuredType: string, policyNumber: string, cancellationEffectiveDate: string) =>
    api.get<CancelRewritePreview>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/cancel-rewrite-preview`, { params: { cancellationEffectiveDate } }).then(r => r.data),

  cancelRewritePolicy: (insuredType: string, policyNumber: string, req: CancelRewriteRequest) =>
    api.post<CancelRewriteResult>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/cancel-rewrite`, req).then(r => r.data),

  getNoticeOfNonRenewalInfo: (insuredType: string, policyNumber: string) =>
    api.get<NoticeOfNonRenewalInfo>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notice-of-nonrenewal-info`).then(r => r.data),

  submitDoNotRenew: (insuredType: string, policyNumber: string, req: DoNotRenewRequest) =>
    api.post<DoNotRenewResult>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/do-not-renew`, req).then(r => r.data),

  removeDoNotRenew: (insuredType: string, policyNumber: string) =>
    api.post<DoNotRenewResult>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/remove-do-not-renew`).then(r => r.data),

  // ─── Submissions (quote wizard draft CRUD) ───────────────────────────────
  createSubmission: (req: CreateSubmissionRequest) =>
    api.post<SubmissionDto>('/submissions', req).then(r => r.data),

  getSubmission: (id: string) =>
    api.get<SubmissionDto>(`/submissions/${id}`).then(r => r.data),

  // Endorsement/Renewal register rows are keyed by quote_number, not the Submission's own id
  // (those differ for endorsement/renewal drafts) — resolve the real id before navigating.
  getSubmissionIdByQuoteNumber: (quoteNumber: string) =>
    api.get<{ id: string }>(`/submissions/by-quote-number/${encodeURIComponent(quoteNumber)}`).then(r => r.data),

  updateSubmission: (id: string, req: UpdateSubmissionRequest) =>
    api.put<SubmissionDto>(`/submissions/${id}`, req).then(r => r.data),

  deleteSubmission: (id: string) =>
    api.delete(`/submissions/${id}`),

  getCommission: (id: string) =>
    api.get<SubmissionCommissionDto>(`/submissions/${id}/commission`).then(r => r.data),

  // GetHBISLimitsandCoverages — Limits & Coverages screen data source; the backend
  // applies the OutSystems empty-value defaults (Basic / 100000 / No Coverage / No /
  // None / Included, policyFee 195 fallback).
  getLimitsAndCoverages: (id: string) =>
    api.get<Record<string, any>>(`/hbis/limits-and-coverages/${id}`).then(r => r.data),

  // ─── Rating engine ────────────────────────────────────────────────────────
  getPlanComparison: (form: HbisPlanComparisonForm) =>
    api.post<HbisPlanComparisonResultDto>('/hbis/plan-comparison', form).then(r => r.data),

  getTaxDetails: (state: string, premiumValue = 0, policyFee = 0) =>
    api.get<HbTaxDetailsDto>('/hb-tax-details', { params: { state, premiumValue, policyFee } }).then(r => r.data),

  // ─── Notes ────────────────────────────────────────────────────────────────
  getNotes: (insuredType: string, policyNumber: string) =>
    api.get<NoteDto[]>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notes`).then(r => r.data),

  addNote: (insuredType: string, policyNumber: string, accessType: string, notesText: string, files: File[]) => {
    const form = new FormData();
    form.append('accessType', accessType);
    form.append('notesText', notesText);
    files.forEach(f => form.append('files', f));
    return api.post<NoteDto>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notes`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  updateNote: (insuredType: string, policyNumber: string, noteId: number, accessType: string, notesText: string, newFiles: File[], removeFileIds: number[]) => {
    const form = new FormData();
    form.append('accessType', accessType);
    form.append('notesText', notesText);
    newFiles.forEach(f => form.append('files', f));
    removeFileIds.forEach(id => form.append('removeFileIds', String(id)));
    return api.put<NoteDto>(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notes/${noteId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  deleteNote: (insuredType: string, policyNumber: string, noteId: number) =>
    api.delete(`/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notes/${noteId}`),

  noteFileUrl: (insuredType: string, policyNumber: string, fileId: number) =>
    `/api/${insuredType}/policies/${encodeURIComponent(policyNumber)}/notes/files/${fileId}`,
};
