import api from './client';

export type InsuredDetailsDto = {
  customerId:         string | null;
  firstName:          string | null;
  lastName:           string | null;
  addressLine1:       string | null;
  addressLine2:       string | null;
  country:            string | null;
  state:              string | null;
  city:               string | null;
  county:             string | null;
  zipCode:            string | null;
  telephone:          string | null;
  telephoneExt:       string | null;
  alternateTelephone: string | null;
  email:              string | null;
};

export type NamedInsuredRowDto = {
  id:                     number;
  name:                   string | null;
  relationship:           string | null;
  telephoneNumber:        string | null;
  alternateTelephoneNumber: string | null;
  emailId:                string | null;
  insuredType:            string | null;
  dbaName:                string | null;
};

export type OrganizationRowDto = {
  id:                     number;
  orgName:                string | null;
  orgType:                string | null;
  telephoneNumber:        string | null;
  extension:              string | null;
  alternateTelephoneNumber: string | null;
  emailId:                string | null;
  contactName:            string | null;
};

export type RiskLocationDetailsDto = {
  id:                  number;
  propertyLocation:    string | null;
  latitude:            string | null;
  longitude:           string | null;
  occupancyType:       string | null;
  constructionType:    string | null;
  ageOfProperty:       string | null;
  lengthOfOccupancy:   string | null;
  roofType:            string | null;
  fireProtectionClass: string | null;
};

export type PolicyDetailsDto = {
  id:            number;
  policyNumber:  string;
  lob:           string | null;
  subProduct:    string | null;
  insuredName:   string | null;
  address:       string | null;
  effectiveDate: string | null;
  status:        string;
  insured:       InsuredDetailsDto | null;
  riskLocation:  RiskLocationDetailsDto | null;
};

export type InsuredPolicyViewDto = {
  insured:       InsuredDetailsDto | null;
  namedInsureds: NamedInsuredRowDto[];
  organizations: OrganizationRowDto[];
  policy:        PolicyDetailsDto | null;
  lossLocation:  string | null;
};

export const insuredPolicyApi = {
  get: (claimId: number) =>
    api.get<InsuredPolicyViewDto>(`/claims/${claimId}/insured-policy`).then(r => r.data),
};
