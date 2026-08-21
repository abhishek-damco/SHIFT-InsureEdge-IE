import api from './client';

export interface ConfigurationListItem {
  id: number;
  tableName: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
}

export interface ConfigurationValueDetail {
  id: number;
  value: string | null;
  enabled: boolean;
  isDefault: boolean;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface ConfigurationDetail {
  id: number;
  tableName: string;
  lastModifiedDate: string;
  lastModifiedBy: string;
  totalValues: number;
  page: number;
  pageSize: number;
  values: ConfigurationValueDetail[];
}

export const configurationsApi = {
  getList: (search?: string) =>
    api.get<ConfigurationListItem[]>('/configurations', { params: { search } }).then(r => r.data),

  getDetail: (id: number, search?: string, page = 1, pageSize = 10) =>
    api.get<ConfigurationDetail>(`/configurations/${id}`, { params: { search, page, pageSize } }).then(r => r.data),

  exportXlsx: (id: number): string =>
    `/api/configurations/${id}/export`,

  save: (id: number, values: Array<{
    id: number | null;
    value: string;
    enabled: boolean | null;
    isDefault: boolean | null;
    effectiveFrom: string | null;
    effectiveTo: string | null;
  }>) =>
    api.put(`/configurations/${id}`, { values }),
};
