import api from './client';

export type QueryAttachment = {
  fileName:      string;
  contentType:   string;
  contentBase64: string;
};

export type SendQueryRequest = {
  emailCategory: string;
  departmentRole: string;
  fromEmail:     string;
  to:            string[];
  cc:            string[];
  bcc:           string[];
  subject:       string;
  body:          string;
  attachments:   QueryAttachment[];
};

export const claimQueryApi = {
  send: (claimId: number, req: SendQueryRequest) =>
    api.post<{ sent: boolean }>(`/claims/${claimId}/query/send`, req).then(r => r.data),
};
