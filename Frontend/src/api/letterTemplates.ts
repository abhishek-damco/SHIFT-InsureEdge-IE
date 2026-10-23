import api from './client';

export interface LetterTemplateListItem {
  id: number;
  templateCode: string;
  templateName: string;
  templateCategory: string;
  lineOfBusiness: string;
  versionNo: string;
  effectiveDateFrom: string;
  effectiveDateTo: string;
}

export interface CreateDocumentPayload {
  documentName: string;
  documentFile: string;
  documentContent: string | null;
  version: string;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
}

export interface CreateTemplatePayload {
  templateName: string;
  active: boolean;
  templateCategory: string;
  subjectLine: string;
  description: string;
  lineOfBusiness: string;
  insuranceType: string;
  states: string[];
  documents: CreateDocumentPayload[];
}

export interface LetterTemplateDocumentDetail {
  id: number;
  documentName: string | null;
  documentContent: string | null;
  version: string | null;
  effectiveStartDate: string | null;
  effectiveEndDate: string | null;
}

export interface LetterTemplateDetail {
  id: number;
  templateCode: string;
  active: boolean;
  currentVersion: string;
  templateName: string;
  templateCategory: string | null;
  lineOfBusiness: string | null;
  insuranceType: string | null;
  subjectLine: string | null;
  description: string | null;
  states: string[];
  documents: LetterTemplateDocumentDetail[];
}

export interface UpdateTemplatePayload {
  templateName: string;
  active: boolean;
  templateCategory: string;
  subjectLine: string;
  description: string;
  states: string[];
  keepDocumentIds: number[];
  newDocuments: CreateDocumentPayload[];
}

export const letterTemplatesApi = {
  getList: (search?: string) =>
    api.get<LetterTemplateListItem[]>('/letter-templates', { params: { search } }).then(r => r.data),

  getNextCode: () =>
    api.get<{ code: string }>('/letter-templates/next-code').then(r => r.data),

  create: (payload: CreateTemplatePayload) =>
    api.post<{ id: number }>('/letter-templates', payload).then(r => r.data),

  getById: (id: number) =>
    api.get<LetterTemplateDetail>(`/letter-templates/${id}`).then(r => r.data),

  update: (id: number, payload: UpdateTemplatePayload) =>
    api.put(`/letter-templates/${id}`, payload).then(r => r.data),
};
