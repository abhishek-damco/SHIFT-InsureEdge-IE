// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Claim types — matches backend ClaimDtos.cs exactly

// ─── Enquiry List ─────────────────────────────────────────────────────────────

export interface ClaimEnquiryDto {
  id: number;
  claimNumber: string;
  policyNumber: string;
  policyHolder: string;
  claimantName: string;
  claimStatus: string;
  lob: string;
  subLob: string;
  dateOfLoss: string;
  submissionDate: string;
  claimType: string;
  assignedTo: string;
  aging: number;
  estimateAmount: string;
  claimInitiationChannel: string;
  mainCauseOfLoss: string;
  consequencesOfLoss: string;
  claimReimbursementType: string;
  catastrophicEvent: string;
  inspectionRequired: boolean;
  isThirdPartyDamage: boolean;
  reporterName: string;
  reporterEmail: string;
  lossLocation: string;
  closureDate: string;
  createdByName: string;
  isAssigned: boolean;
  approvedAmount: string;
  adjusterAssigned: string;
  claimReferred: string;
  referredDept: string;
  fraudIndicator: string;
}

export interface ClaimEnquiryResponse {
  items: ClaimEnquiryDto[];
  total: number;
  openCount: number;
  unassignedCount: number;
  pendingCount: number;
  referredCount: number;
}

export interface AssignableUserDto {
  id: number;
  name: string;
  userCode: string;
  paymentApprovalLimit: string;
  reserveApprovalLimit: string;
}

// ─── Policy Search ────────────────────────────────────────────────────────────

export interface PolicySearchDto {
  id: number;
  policyNumber: string;
  insuredName: string;
  address: string;
  effectiveDate: string;
  lob: string;
  status: string;
}

export interface PolicySearchResponse {
  items: PolicySearchDto[];
  total: number;
}

// ─── Policy Claims Modal ──────────────────────────────────────────────────────

export interface InProgressClaimDto {
  id: number;
  claimNumber: string | null;
  dateOfLoss: string;
  insuredName: string;
  lob: string;
  lastStepNumber: number;
}

export interface ExistingClaimDto {
  id: number;
  claimNumber: string;
  dateOfLoss: string;
  insuredName: string;
  claimantName: string;
  lob: string;
  claimStatus: string;
}

export interface PolicyClaimsModalDto {
  inProgress: InProgressClaimDto[];
  existing: ExistingClaimDto[];
}

// ─── Policy Details (Step 2) ──────────────────────────────────────────────────

export interface InsuredDetailsDto {
  customerId: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  telephone: string | null;
  telephoneExt: string | null;
  alternateTelephone: string | null;
  email: string | null;
}

export interface AdditionalInsuredDetailsDto {
  id: number;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  relationship: string | null;
  telephoneNumber: string | null;
  alternateTelephoneNumber: string | null;
  email: string | null;
  insuredType: string | null;
  dbaName: string | null;
}

export interface AdditionalOrganisationDetailsDto {
  id: number;
  organisationName: string | null;
  organisationType: string | null;
  telephoneNumber: string | null;
  extension: number | null;
  alternateTelephoneNumber: string | null;
  email: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
}

export interface RiskLocationDetailsDto {
  id: number | null;
  propertyLocation: string | null;
  latitude: string | null;
  longitude: string | null;
  occupancyType: string | null;
  constructionType: string | null;
  ageOfProperty: string | null;
  lengthOfOccupancy: string | null;
  roofType: string | null;
  fireProtectionClass: string | null;
}

export interface PolicyDetailsDto {
  id: number;
  policyNumber: string;
  lob: string | null;
  subProduct: string | null;
  insuredName: string | null;
  address: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  status: string;
  insuranceType: string | null;
  coverageLevel: string | null;
  deductible: string | null;
  insured: InsuredDetailsDto | null;
  riskLocation: RiskLocationDetailsDto | null;
  additionalInsureds: AdditionalInsuredDetailsDto[];
  additionalOrganisations: AdditionalOrganisationDetailsDto[];
}

// ─── Coverage Row (Step 3) ────────────────────────────────────────────────────

export interface ClaimCoverageDto {
  id: number;
  coverageId: number | null;
  coverageName: string | null;
  causeOfLossId: number | null;
  causeOfLossName: string | null;
  assetType: string | null;
}

export interface ClaimCoverageSaveDto {
  id: number | null;
  coverageId: number | null;
  causeOfLossId: number | null;
  assetType: string | null;
}

export interface CoverageOptionDto {
  id: number;
  name: string;
}

// ─── Claimant (Step 3 conditional) ───────────────────────────────────────────

export interface ClaimantDto {
  id: number;
  partyType: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  relationshipWithInsured: string | null;
  telephone: string | null;
  telephoneCC: string | null;
  alternateTelephone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  listOfDamages: string | null;
}

export interface ClaimantSaveDto {
  id: number | null;
  partyType: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  relationshipWithInsured: string;
  telephone: string;
  telephoneCC: string | null;
  alternateTelephone: string | null;
  email: string;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  listOfDamages: string | null;
}

// ─── Document (Step 4) ───────────────────────────────────────────────────────

export interface ClaimDocumentDto {
  id: number;
  fileName: string;
  contentType: string | null;
  fileSize: number | null;
  notifyToName: string | null;
  comment: string | null;
  createdOn: string;
}

// ─── Full Claim Detail ────────────────────────────────────────────────────────

export interface LossExposureDto {
  id: number;
  claimId: number;
  lossParty: string;
  claimantReference: string | null;
  claimantName: string;
  claimantType: string;
  lossExposureTypeId: number | null;
  lossType: string;
  coverageLimit: string | null;
  severity: string;
  causeOfLossId: number | null;
  causeOfLoss: string;
  percentageAllocation: number | null;
  propertyUsable: boolean;
  contractorsInvolved: boolean;
  moldSuspected: boolean;
  additionalLivingExpenseRequired: boolean;
  contentDamage: boolean;
  sprinklerAlarmInstalled: boolean;
  lienholderInvolved: boolean;
  attorneyInvolved: boolean;
  descriptionOfLoss: string | null;
  damageDetails: LossExposureDamage[];
  additionalServicesRequired: boolean;
  lossConsequences: string;
  lossEstimate: number;
  currency: string;
  notes: string | null;
  createdOn: string;
}

export interface CreateLossExposureRequest {
  lossParty: string;
  claimantReference: string | null;
  claimantName: string;
  lossExposureTypeId: number;
  lossType: string;
  coverageLimit: string | null;
  severity: string;
  causeOfLossId: number | null;
  causeOfLoss: string;
  percentageAllocation: number | null;
  propertyUsable: boolean;
  contractorsInvolved: boolean;
  moldSuspected: boolean;
  additionalLivingExpenseRequired: boolean;
  contentDamage: boolean;
  sprinklerAlarmInstalled: boolean;
  lienholderInvolved: boolean;
  attorneyInvolved: boolean;
  descriptionOfLoss: string | null;
  damageDetails: LossExposureDamage[];
  additionalServicesRequired: boolean;
  lossEstimate: number;
  currency: string;
  notes: string | null;
}

export interface LossExposureImage {
  fileName: string;
  contentType: string | null;
  contentBase64: string;
}

export interface LossExposureDamage {
  section: string;
  materialType: string | null;
  percentageOfDamage: number | null;
  images: LossExposureImage[];
}

export interface LossExposureFormData {
  riskDetails: {
    occupancyType: string | null;
    constructionType: string | null;
    ageOfProperty: string | null;
    lengthOfOccupancy: string | null;
    roofType: string | null;
    fireProtectionClass: string | null;
  };
  lossParties: string[];
  claimants: { reference: string; name: string; lossParty: string }[];
  exposureTypes: { id: number; name: string; lossParty: string; limit: string | null }[];
  severities: string[];
  causesOfLoss: CoverageOptionDto[];
  damageSections: { name: string; materials: string[] }[];
}

export interface ClaimDetailDto {
  id: number;
  claimNumber: string | null;
  policyId: number;
  policyNumber: string;
  clientId: number;
  status: string;
  lastStepNumber: number;
  isClaimReportedByInsured: boolean;

  reporterFirstName: string | null;
  reporterLastName: string | null;
  reporterRelationship: string | null;
  reporterTelephone: string | null;
  reporterEmail: string | null;

  dateOfLoss: string | null;
  timeOfLoss: string | null;
  claimInitiationChannel: string | null;
  claimType: string | null;
  mainCauseOfLoss: string | null;
  consequencesOfLoss: string | null;
  inspectionRequired: boolean;
  claimReimbursementType: string | null;
  catastrophicEvent: string | null;
  lossDescription: string | null;
  listOfDamageFirstParty: string | null;
  physicalDamage: boolean | null;
  claimOnlyThirdParty: boolean | null;
  isThirdPartyDamage: boolean;

  lossAddressLine1: string | null;
  lossAddressLine2: string | null;
  lossCountry: string | null;
  lossState: string | null;
  lossCity: string | null;
  lossCounty: string | null;
  lossZipCode: string | null;
  lossLatitude: string | null;
  lossLongitude: string | null;

  claimEstimate: string | null;
  comment: string | null;

  coverages: ClaimCoverageDto[];
  claimants: ClaimantDto[];
  documents: ClaimDocumentDto[];
  policyDetails: PolicyDetailsDto | null;

  assignedToName: string | null;
  createdOn: string;
}

// ─── Create / Update Request ──────────────────────────────────────────────────

export interface CreateOrUpdateClaimRequest {
  id: number | null;
  policyId: number;
  riskLocationId: number | null;
  status: string;
  lastStepNumber: number;
  isClaimReportedByInsured: boolean;

  reporterFirstName: string | null;
  reporterLastName: string | null;
  reporterRelationship: string | null;
  reporterTelephone: string | null;
  reporterTelephoneCC: string | null;
  reporterEmail: string | null;

  dateOfLoss: string | null;
  timeOfLoss: string | null;
  claimInitiationChannel: string | null;
  claimType: string | null;
  mainCauseOfLoss: string | null;
  consequencesOfLoss: string | null;
  inspectionRequired: boolean;
  claimReimbursementType: string | null;
  catastrophicEvent: string | null;
  lossDescription: string | null;
  listOfDamageFirstParty: string | null;
  physicalDamage: boolean | null;
  claimOnlyThirdParty: boolean | null;
  isThirdPartyDamage: boolean;

  lossAddressLine1: string | null;
  lossAddressLine2: string | null;
  lossCountry: string | null;
  lossState: string | null;
  lossCity: string | null;
  lossCounty: string | null;
  lossZipCode: string | null;
  lossLatitude: string | null;
  lossLongitude: string | null;

  claimEstimate: string | null;
  comment: string | null;

  coverages: ClaimCoverageSaveDto[];
  claimants: ClaimantSaveDto[];
}

export interface ClaimSaveResponse {
  id: number;
  claimNumber: string | null;
  status: string;
  lastStepNumber: number;
}

// ─── Reference Data ───────────────────────────────────────────────────────────

export interface ClaimReferenceDataDto {
  initiationChannels: string[];
  causesOfLoss: CoverageOptionDto[];
  consequencesOfLoss: string[];
  coverageTypes: CoverageOptionDto[];               // HO Physical Damage options from master
  personalLiabilityCoverageTypes: CoverageOptionDto[]; // HO Personal Liability options from master
  impactedAssets: string[];
  relationshipTypes: string[];
}


export interface ClaimAssignmentDto {
  assignedTo: number | null;
  assignedToName: string | null;
}

export interface UpdateClaimAssignmentRequest {
  assignedTo: number | null;
  assignedToName: string | null;
}

export interface CreateClaimDocumentRequest {
  fileName: string;
  contentType: string | null;
  fileSize: number | null;
  fileContentBase64: string | null;
  notifyToName: string | null;
  comment: string | null;
}

export interface TempClaimReportDto {
  id: number;
  claimId: number;
  reportType: string | null;
  reportNumber: string | null;
  reportFilingDate: string | null;
  precinctName: string | null;
  caseStatus: string | null;
  numberOfWitness: string | null;
  description: string | null;
  notifyDocumentUpload: boolean;
  notifyToName: string | null;
  comment: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  identityDocument: string | null;
  telephoneNumber: string | null;
  extension: string | null;
  alternateTelephoneNumber: string | null;
  emailId: string | null;
  referenceDocumentName: string | null;
  createdOn: string;
}

export type UpsertTempClaimReportRequest = Omit<TempClaimReportDto, 'id' | 'claimId' | 'createdOn'> & { id: number | null };

export interface TempClaimPersonDto {
  id: number;
  claimId: number;
  partyType?: string | null;
  partyCategory?: string | null;
  businessName?: string | null;
  tinId?: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  socialSecurityNumber: string | null;
  relationshipWithInsured: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  county: string | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  telephoneNumber: string | null;
  extension: string | null;
  alternateTelephoneNumber: string | null;
  emailId: string | null;
  description: string | null;
  profileImageName: string | null;
  idProofName: string | null;
  createdOn: string;
}

export type TempClaimPartyDto = TempClaimPersonDto;
export type TempClaimWitnessDto = TempClaimPersonDto;
export type UpsertTempClaimPartyRequest = Omit<TempClaimPartyDto, 'id' | 'claimId' | 'createdOn'> & { id: number | null };
export type UpsertTempClaimWitnessRequest = Omit<TempClaimWitnessDto, 'id' | 'claimId' | 'createdOn' | 'partyType' | 'partyCategory' | 'businessName' | 'tinId'> & { id: number | null };

// ─── Claims Authority ─────────────────────────────────────────────────────────

export interface ClaimAuthorityUserSelectionDto {
  id: number;
  userCode: string;
  fullName: string;
  initials: string;
  department: string;
  designation: string;
  status: string;
}

export interface ClaimAuthorityDto {
  id: number;
  userId: string;
  userName: string;
  userInitials: string;
  department: string;
  designation: string;
  approvedLob: string;
  currency: string;
  reserveLimit: number;
  indemnityPaymentLimit: number;
  feePaymentLimit: number;
  exGratiaPaymentLimit: number;
  jurisdictionLocation: string;
  authorityStatus: string;
}

export interface ClaimAuthorityDetailDto {
  id: number;
  userId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  userInitials: string;
  department: string;
  designation: string;
  authorityStatus: string;
  insuranceType: string;
  approvedLob: string;
  currency: string;
  reserveLimit: number;
  indemnityPaymentLimit: number;
  feePaymentLimit: number;
  exGratiaPaymentLimit: number;
  paymentMethodRestrictions: string;
  dateOfAuthorityAssignment: string;
  canDenyWorksheet: boolean;
  jurisdictionCountry: string;
  jurisdictionStates: string;
  updatedByName: string;
  updatedByInitials: string;
  approvedByName: string;
  approvedByInitials: string;
  createdByName: string;
  createdByInitials: string;
  updatedDate: string;
  actionPerformed: string;
}

