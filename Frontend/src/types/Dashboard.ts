export interface DashboardKpis {
  uploaded: number;
  approved: number;
  notApproved: number;
  expired: number;
}

export type DashboardPersona = 'client' | 'producer';

export interface DashboardContext {
  persona: DashboardPersona;
  isHudsonBailey: true;
  currency: 'USD';
}

export interface DashboardProducerKpis {
  activePolicies: number;
  newBusinessQuotes: number;
  renewalQuotes: number;
  endorsementQuotes: number;
}

export interface DashboardPolicyKpis {
  totalPolicies: number;
  activePolicies: number;
  boundPolicies: number;
  cancelledPolicies: number;
}

export interface DashboardCoverageKpis { basic: number; standard: number; preferred: number; }

export interface WrittenPremium {
  year: number;
  amount: number;
}

export interface DashboardQuote {
  policyId: number;
  quoteNumber: string;
  transactionType: string;
  insuredName: string;
  insuredType: string | null;
  lob: string | null;
  transactionEffectiveDate: string | null;
  approvalStatus: string | null;
  creationDate: string;
  lastUpdated: string | null;
  premiumEstimate: number | null;
  status: string | null;
}

export interface DashboardPendingCancellation {
  paymentTransactionId: number;
  policyId: number;
  policyNumber: string;
  insuredName: string;
  daysOverdue: number;
  dueDate: string;
  premiumAmount: number;
  currency: 'USD';
}

export interface DashboardRenewalRadar {
  policyId: number;
  policyNumber: string;
  insuredName: string;
  lineOfBusiness: string | null;
  premiumAmount: number | null;
  riskLevel: string | null;
  expiryDate: string;
  daysUntilExpiry: number;
  currency: 'USD';
}

export interface DashboardFailedPayment {
  paymentTransactionId: number;
  policyId: number;
  policyNumber: string;
  effectiveDate: string | null;
  expiryDate: string | null;
  paymentDate: string;
  amountDue: number;
  reason: string;
  currency: 'USD';
}

export interface DashboardRecentActivity {
  id: number;
  policyId: number;
  recordNumber: string;
  recordType: 'quote' | 'policy';
  description: string;
  createdAt: string;
}

export interface DashboardSummary {
  context: DashboardContext;
  quoteKpis: DashboardKpis;
  producerKpis: null;
  policyKpis: DashboardPolicyKpis | null;
  coverageKpis: DashboardCoverageKpis | null;
  writtenPremium: WrittenPremium[];
  pendingCancellations: DashboardPendingCancellation[];
  renewalRadar: DashboardRenewalRadar[];
  failedPayments: DashboardFailedPayment[];
  recentActivities: DashboardRecentActivity[];
}

export interface DashboardQuoteResponse {
  data: DashboardQuote[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardQuoteQuery {
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  search?: string;
  accountType?: string;
  transactionType?: string;
  insuredName?: string;
  lob?: string;
  effectiveDate?: string;
  approvalStatus?: string;
  creationDate?: string;
  premiumEstimate?: string;
  status?: string;
}

export interface DashboardListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  policyNumber?: string;
  effectiveDate?: string;
  expiryDate?: string;
  paymentDate?: string;
  amountDue?: number;
  reason?: string;
}
export interface DashboardPagedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }
export interface DashboardWidgetPreference { widgetKey: string; displayOrder: number; isVisible: boolean; }
export interface DashboardPreference { widgets: DashboardWidgetPreference[]; }
export interface DashboardRenewalResult { policyId: number; quoteNumber: string; }
