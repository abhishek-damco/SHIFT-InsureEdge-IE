import api from './client';

export interface PayeeListItemDto {
  id: number;
  initials: string;
  avatarColor: string;
  payeeName: string;
  payeeType: string;
  claimId: string;
  policyId: string;
  paymentMethod: string;
  complianceCheck: string;
  dateOfLoss: string;
  lossType: string;
  amount: string;
  status: string;
}

export interface PayeeKpiDto {
  totalPayees: number;
  totalPolicies: number;
  totalClaims: number;
  totalAmount: number;
}

export const payeesApi = {
  getList: (): Promise<PayeeListItemDto[]> => api.get('/payees').then(r => r.data),
  getKpi: (): Promise<PayeeKpiDto> => api.get('/payees/kpi').then(r => r.data),
};
