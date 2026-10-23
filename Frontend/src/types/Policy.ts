// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Quotes & Policies types — matches backend PolicyQuoteDtos.cs / SubmissionDtos.cs / RatingDtos.cs exactly.

// ─── NB Quotes ──────────────────────────────────────────────────────────────

export interface NbQuotesKpiDto {
  uploaded: number;
  approved: number;
  notApproved: number;
  expired: number;
}

export interface NbQuoteListItemDto {
  id: string;                 // p.quote_number
  insuredName: string;
  lob: string | null;
  subProduct: string | null;
  effectiveDate: string | null;     // MM-dd-yyyy
  premiumEstimate: number | null;
  createdAt: string | null;         // MM-dd-yyyy
  approvalStatus: string | null;
  lastUpdated: string | null;       // MM-dd-yyyy
  status: string | null;
  state: string | null;
  insuredType: string | null;
}

export interface NbQuoteListResponse {
  data: NbQuoteListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Endorsements ───────────────────────────────────────────────────────────

export interface EndorsementsKpiDto {
  total: number;
  draft: number;
  submitted: number;
  approved: number;
  notApproved: number;
  bound: number;
}

export interface EndorsementListItemDto {
  id: string;                 // p.quote_number
  policyNumber: string | null;
  insuredName: string;
  lob: string | null;
  policyEffectiveDate: string | null;
  transactionEffectiveDate: string | null;
  premiumImpact: number;
  createdAt: string | null;
  status: string | null;
  insuredType: string | null;
}

// ─── Renewals ───────────────────────────────────────────────────────────────

export interface RenewalsKpiDto {
  total: number;
  draft: number;
  pending: number;
  declined: number;
  expired: number;
}

export interface RenewalListItemDto {
  id: string;                 // p.quote_number
  originalPolicyNumber: string | null;
  insuredName: string;
  lob: string | null;
  subProduct: string | null;
  intermediaryType: string | null;
  intermediary: string | null;
  producerName: string | null;
  effectiveDate: string | null;
  createdAt: string | null;
  expirationDate: string | null;
  renewalOfferDate: string | null;
  premiumEstimate: number | null;
  status: string | null;
  insuredType: string | null;
}

// ─── Policies ───────────────────────────────────────────────────────────────

export interface PoliciesKpiDto {
  total: number;
  active: number;
  lapsed: number;
  expired: number;
  cancelled: number;
}

export interface PolicyListItemDto {
  id: string;                 // p.policy_number
  insuredName: string;
  lob: string | null;
  subProduct: string | null;
  effectiveDate: string | null;
  status: string | null;
  expirationDate: string | null;
  premiumAmount: number | null;
  lastUpdated: string | null;
  state: string | null;
  insuredType: string | null;
}

// ─── Policy Summary (Policy Information / Producer / Financials / Billing / Claims / Contacts) ─

export interface PolicyProducerDto {
  producer: string;
  agency: string | null;
  commissionPercentage: number | null;
  coveragePremium: number | null;
  totalCommission: number | null;
  commissionPaid: number;
  earnedCommission: number;
}

export interface PolicyFinancialsDto {
  coveragePremium: number | null;
  taxes: number | null;
  fees: number | null;
  totalPremium: number | null;
}

export interface PolicyBillingDto {
  paymentFrequency: string | null;
  responsibleParty: string | null;
  writtenPremium: number;
  totalBilled: number;
  amountPaid: number;
  amountDue: number;
  unbilledPremium: number;
}

export interface PolicyClaimSummaryDto {
  claimNumber: string;
  status: string | null;
}

export interface PolicyContactDto {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PolicySummaryDto {
  policyNumber: string;
  status: string | null;
  lob: string | null;
  subProduct: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  availableForRenewal: string;
  producers: PolicyProducerDto[];
  financials: PolicyFinancialsDto | null;
  billing: PolicyBillingDto | null;
  claims: PolicyClaimSummaryDto[];
  contacts: PolicyContactDto[];
}

export interface PolicyPaymentScheduleRowDto {
  installmentDueDate: string | null;
  installmentFee: number;
  installmentPremiumAmount: number;
  amountDue: number;
  status: string;
}

export interface PolicyPremiumBreakdownRowDto {
  label: string;
  written: number;
  earned: number;
  unearned: number;
}

export interface PolicyBillingDetailDto {
  paymentFrequency: string | null;
  responsibleParty: string | null;
  modeOfPayment: string | null;
  numberOfInstallments: number;
  installmentFee: number;
  isFullyPaid: string;
  paymentSchedule: PolicyPaymentScheduleRowDto[];
  totalPendingAmount: number;
  cancellationEffectiveDate: string | null;
  premiumBreakdown: PolicyPremiumBreakdownRowDto[];
  commissions: PolicyProducerDto[];
}

export interface PolicyClaimRowDto {
  claimNumber: string;
  claimantName: string;
  dateOfLoss: string | null;
  causeOfLoss: string | null;
  incurredAmount: number;
  paidAmount: number;
  status: string | null;
}

export interface PolicyTimelineEntryDto {
  activityDescription: string;
  createdByName: string | null;
  createdDate: string;
  createdTime: string;
}

export interface PolicyPendingTransactionDto {
  policyId: number;
  policyNumber: string;
  transactionType: string | null;
  quoteNumber: string | null;
  transactionEffectiveDate: string | null;
  assignedUser: string;
  status: string | null;
  screenCode: string | null;
}

// ─── Policy Transactions (Policy History / Timeline) ───────────────────────────

export interface PolicyTransactionDto {
  id: number;
  policyNumber: string;
  effectiveDate: string | null;
  expirationDate: string | null;
  transactionType: string | null;
  transactionTypeLabel: string | null;
  transactionEffectiveDate: string | null;
  status: string | null;
  redirectionPolicyNumber: string | null;
}

// ─── Endorse Policy ───────────────────────────────────────────────────────────

export interface EndorsePolicyRequest {
  transactionEffectiveDate: string | null; // yyyy-MM-dd
  summaryOfChanges: string | null;
}

export interface EndorsePolicyResult {
  newPolicyId: number;
  policyNumber: string;
  quoteNumber: string;
}

// Quote Review "Review/Compare Updated Information" — one row per field that differs
// between the open endorsement draft and the prior policy it was drafted against.
export interface EndorsementFieldChange {
  panel: string;
  field: string;
  priorValue: string | null;
  updatedValue: string | null;
}

// ─── Cancel Policy ────────────────────────────────────────────────────────────

export interface RequestedByOption {
  code: string;
  label: string;
}

export interface CancellationPremiumBreakdownRow {
  label: string;
  paidAmount: number;
  refundAmount: number;
}

export interface CancellationCommissionEffectRow {
  intermediary: string;
  lastCommissionPaid: number;
  changeInCommission: number;
}

export interface PolicyCancellationPreview {
  premiumBreakdown: CancellationPremiumBreakdownRow[];
  totalPaidAmount: number;
  totalRefundAmount: number;
  commissionEffect: CancellationCommissionEffectRow[];
  isPolicyPaid: boolean;
}

export interface CancelPolicyRequest {
  cancellationEffectiveDate: string; // yyyy-MM-dd
  prorationBasis: string;
  requestedBy: string;
  reasonOfCancellation: string;
  otherReason: string | null;
  adjustCommissions: boolean;
  comments: string | null;
}

export interface CancelPolicyResult {
  policyNumber: string;
  policyStatus: string;
}

// ─── Cancel / Rewrite Policy ──────────────────────────────────────────────────

export interface CancelRewritePreview {
  premiumBreakdown: CancellationPremiumBreakdownRow[];
  totalPaidAmount: number;
  totalRefundAmount: number;
  isPolicyPaid: boolean;
}

export interface CancelRewriteRequest {
  cancellationEffectiveDate: string; // yyyy-MM-dd
  rewriteEffectiveDate: string; // yyyy-MM-dd
  prorationBasis: string;
  reasonForRewritingPolicy: string;
  otherReason: string | null;
  adjustCommissions: boolean;
  comments: string | null;
}

export interface CancelRewriteResult {
  originalPolicyNumber: string;
  newPolicyId: number;
  newPolicyNumber: string;
  newQuoteNumber: string;
}

// ─── Do Not Renew ─────────────────────────────────────────────────────────────

export interface NoticeOfNonRenewalInfo {
  namedInsured: string;
  brokerage: string;
  namedInsuredAddressLine: string;
  brokerAddressLine: string;
  namedInsuredAddressCity: string;
  brokerAddressCity: string;
  namedInsuredAddressState: string;
  brokerAddressState: string;
  namedInsuredZip: string;
  brokerAddressZip: string;
  primaryContactName: string;
  brokerAddressPhone: string;
  primaryContactEmail: string;
  brokerId: string;
  primaryContactPhone: string;
  policyNo: string;
  polEffDt: string;
  systemDt: string;
  polExpDt: string;
  nonRenewEffDt: string;
}

export interface DoNotRenewRequest {
  checkBoxYourNonRenewal: boolean;
  attributes: boolean[]; // 65 items
}

export interface DoNotRenewResult {
  policyNumber: string;
  policyStatus: string;
}

// ─── Query params (shared) ───────────────────────────────────────────────────

export interface PolicyRegisterListQueryParams {
  search?: string;
  approvalStatus?: string;
  lob?: string;
  status?: string;
  sortCol?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}

// ─── Submission (quote wizard draft) CRUD ────────────────────────────────────

export interface SubmissionDto {
  id: string;
  status: string;
  createdAt: string;
  dataJson: string; // raw JSON payload (wizard "form"/additionalInsureds/additionalOrgs/etc.)
}

export interface CreateSubmissionRequest {
  dataJson: string;
}

export interface UpdateSubmissionRequest {
  status?: string | null;
  dataJson: string;
}

export interface SubmissionCommissionDto {
  commissionPercentage: number | null;
  installmentCommission: number | null;
  annualCommission: number | null;
  totalCoveragePremium: number | null;
  paymentFrequency: string | null;
  numberOfInstallments: number | null;
  brokerage: string | null;
  producerName: string | null;
}

// ─── HBIS rating engine — plan comparison ────────────────────────────────────

export interface HbisPlanComparisonForm {
  screenCode?: string | null;
  policyType?: string | null;
  deductible?: string | null;
  coverageLevel?: string | null;
  selectedPlan?: string | null;
  liabilityAmount?: string | null;
  excessBlanketLiabilities?: string | null;
  sinkhole?: string | null;
  earthquake?: string | null;
  flood?: string | null;
  windHail?: string | null;
  wildfire?: string | null;
  resWorkerMedical?: string | null;
  farmingEndorsement?: string | null;
  landlordEndorsement?: string | null;
  homeOfficeEndorsement?: string | null;
  policyFee?: string | null;
  priorPolicyPremium?: string | null;
  rateModification?: string | null;
  dwellingLimit?: string | null;
  appurtenantLimit?: string | null;
  personalAssetsLimit?: string | null;
  occupancyDisruptionLimit?: string | null;
  totalInsuredValues?: string | null;
  isHBProducer?: boolean | null;
  lockSubmission?: boolean | null;
  isQuickQuote?: boolean | null;
}

export interface HbisRatingInputsDto {
  dwellingAssetLimit: number;
  appurtenantStructureAssetsLimit: number;
  personalAssetsOtherThanFixedAssetsLimit: number;
  dwellingOccupancyDisruptionLimit: number;
  totalInsuredValues: number;
  physicalDamageDeductible: string;
  coverageLevel: string;
  amountOfLiabilityCoverage: string;
  excessScheduledBlanketCoveredPersonalLiabilities: string;
  sinkholeAndCatastrophicGroundCollapse: string;
  earhquake: string;
  flood: string;
  windHail: string;
  wildfire: string;
  residentialWorkerNoFault: string;
  smallScaleFarmingEndorsement: string;
  landloardEndorsement: string;
  homeOfficeEndorsement: string;
  priorPolicyPeriodPremium: number;
  rateModification: number;
  policyFeesNew: number;
  isHBISProducer: boolean;
  isLockSubmission: boolean;
  isQuickQuote: boolean;
}

export interface HbisRatingOutputDto {
  basePremium: number;
  wildfirePremium: number;
  windPremium: number;
  sinkholePremium: number;
  excessScheduleBlanketCoveredPL: number;
  earthquakePremium: number;
  floodPremium: number;
  residentWorkerNFPremium: number;
  smallScaleFarmingEndorsementPremium: number;
  landEndorsementPremium: number;
  homeOfficeEndorsementPremium: number;
  policyFee: number;
  subtotalPremium: number;
  totalPremiumWithoutTaxes: number;
  totalPremiumWithFee: number;
}

export interface HbisPlanDto {
  id: string;
  name: string;
  basePremium: number;
  wildfire: number;
  windHail: number;
  sinkhole: number;
  excessLiability: number;
  earthquake: number;
  flood: number;
  resWorker: number;
  farming: number;
  landlord: number;
  homeOffice: number;
  policyFee: number;
  total: number;
  raterInputs: HbisRatingInputsDto;
  ratingOutput: HbisRatingOutputDto;
}

export interface HbisPlanComparisonResultDto {
  source: string;
  selectedPlan: string;
  coverageLevel: string;
  totalInsuredValues: number;
  validationMessages: string[];
  dataFetchCompleted: boolean;
  plans: HbisPlanDto[];
}

// ─── State tax lookup ─────────────────────────────────────────────────────────

export interface HbTaxRowDto {
  tax: string;
  percentage: number;
  premiumBase: number;
  installmentTax: number;
}

export interface HbTaxDetailsDto {
  state: string;
  taxRows: HbTaxRowDto[];
  totalTax: number;
  stampingFee: number;
  flatStamp: boolean;
  surplusLinesTax: number;
  firePremiumTax: number;
}

// ─── Renewal Quote ───────────────────────────────────────────────────────────

export interface CreateRenewalQuoteRequest {
  priorPolicyNumber: string;
  renewalOfferDate?: string | null; // yyyy-MM-dd
}

export interface CreateRenewalQuoteResponse {
  policyId: number;
  quoteNumber: string;
  policyNumber: string;
  status: string;
  effectiveDate: string | null;
  expiryDate: string | null;
  success: boolean;
  message: string;
}

export interface BindRenewalQuoteResponse {
  success: boolean;
  message: string;
  newPolicyNumber: string;
  previousPolicyStatus: string;
}

export interface ProcessRenewalPaymentRequest {
  paymentMethod?: string | null;
  transactionId?: string | null;
  amountPaid?: number | null;
}

export interface ProcessRenewalPaymentResponse {
  success: boolean;
  message: string;
  paymentTransactionId?: number | null;
  status: string;
}

export interface RenewalPaymentTransactionDto {
  id: number;
  amountDue: number;
  invoiceDate: string;
  dueDate: string;
  transactionPaymentDate: string | null;
  isPaid: boolean | null;
  transactionStatus: string | null;
  paymentMethod: string | null;
}

export interface RenewalQuoteDetailDto {
  policyId: number;
  quoteNumber: string;
  policyNumber: string;
  priorPolicyNumber: string | null;
  insuredName: string;
  lineOfBusiness: string | null;
  subProduct: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  renewalOfferDate: string | null;
  premiumEstimate: number | null;
  totalPremium: number | null;
  policyStage: string | null;
  policyType: string | null;
  policyStatus: string | null;
  approvalStatus: string | null;
  intermediaryType: string | null;
  intermediaryName: string | null;
  producerName: string | null;
  paymentTransactions: RenewalPaymentTransactionDto[];
}

// ─── Notes ─────────────────────────────────────────────────────────────────

export interface NoteFileDto {
  id: number;
  fileName: string;
  fileType: string | null;
}

export interface NoteDto {
  id: number;
  notesText: string;
  accessType: 'Diary' | 'Internal' | 'External' | string;
  module: string;
  createdByName: string | null;
  createdOn: string;
  files: NoteFileDto[];
}
