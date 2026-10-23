import api from './client';

export type PayeeListItemDto = {
  id:               number;
  initials:         string;
  avatarColor:      string;
  payeeName:        string;
  payeeType:        string;
  claimId:          string;
  policyId:         string;
  paymentMethod:    string;
  complianceCheck:  string;
  dateOfLoss:       string;
  lossType:         string;
  amount:           string;
  status:           string;
};

export type PayeeStatusKpiDto = {
  total:    number;
  draft:    number;
  pending:  number;
  approved: number;
  rejected: number;
};

export type CreateAddressRequest = {
  googleAddress: string | null;
  isManual:      boolean;
  addressLine1:  string | null;
  addressLine2:  string | null;
  country:       string | null;
  state:         string | null;
  city:          string | null;
  county:        string | null;
  zipCode:       string | null;
  latitude:      string | null;
  longitude:     string | null;
};

export type CreatePayeeRequest = {
  claimId:              number | null;
  claimPayeeType:       string | null;
  firstName:            string | null;
  middleName:           string | null;
  lastName:             string | null;
  businessName:         string | null;
  nationalId:           string | null;
  socialSecurityNumber: string | null;
  tinId:                string | null;
  payeeType:            string | null;
  relationship:         string | null;
  telephoneNumberCC:    string | null;
  telephoneNumber:      string | null;
  email:                string | null;
  bankDetail: {
    paymentMethod:               string | null;
    bankName:                    string | null;
    accountHolderName:           string | null;
    accountNumber:               string | null;
    accountType:                 string | null;
    abaRoutingNumber:            string | null;
    businessName:                string | null;
    federalTaxClassification:    string | null;
    employerIdentificationNumber: string | null;
    type1099:                    string | null;
    w9FormOnFile:                boolean;
  } | null;
  address: CreateAddressRequest | null;
};

export type CreateBankDetailRequest = {
  paymentMethod:               string | null;
  bankName:                    string | null;
  accountHolderName:           string | null;
  accountNumber:               string | null;
  accountType:                 string | null;
  abaRoutingNumber:            string | null;
  businessName:                string | null;
  federalTaxClassification:    string | null;
  employerIdentificationNumber: string | null;
  type1099:                    string | null;
  w9FormOnFile:                boolean;
};

export const payeeApi = {
  getListByClaim: (claimId: number) =>
    api.get<PayeeListItemDto[]>(`/payees/by-claim/${claimId}`).then(r => r.data),

  getKpiByClaim: (claimId: number) =>
    api.get<PayeeStatusKpiDto>(`/payees/kpi/by-claim/${claimId}`).then(r => r.data),

  create: (req: CreatePayeeRequest) =>
    api.post<{ id: number }>('/payees', req).then(r => r.data),

  updateBanking: (id: number, req: CreateBankDetailRequest) =>
    api.put(`/payees/${id}/banking`, req).then(r => r.data),

  sendForApproval: (id: number) =>
    api.post(`/payees/${id}/send-for-approval`).then(r => r.data),
};
