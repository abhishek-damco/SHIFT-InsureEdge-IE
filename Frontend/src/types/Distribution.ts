export interface IntermediaryListItem {
  id: number;
  name: string;
  intermediaryType: string;
  federalTaxId: string;
  status: 'Active' | 'Inactive' | 'Draft';
  primaryContactName: string | null;
  primaryContactTitle: string | null;
  residentState: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntermediaryFilterParams {
  name?: string;
  federalTaxId?: string;
  status?: string;
  intermediaryType?: string;
  state?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface IntermediaryListResult {
  items: IntermediaryListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface IntermediaryRecord extends IntermediaryListItem {
  draftStep?: 1 | 2 | 3 | 4 | 5;
  step1?: unknown;
  step2?: unknown;
  step3?: unknown;
  step4?: unknown;
}
