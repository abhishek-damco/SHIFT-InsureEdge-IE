import api from './client';

export type ClaimLetterListItemDto = {
  id:              number;
  letterCode:      string;
  letterType:      string | null;
  letterDate:      string | null;
  sendDate:        string | null;
  recipientName:   string | null;
  recipientRole:   string | null;
  recipientEmail:  string | null;
  priority:        string | null;
  status:          string;
  createdByName:   string | null;
  createdOn:       string | null;
};

export type ClaimLetterDetailDto = {
  id:               number;
  letterCode:       string;
  letterType:       string | null;
  letterDate:       string | null;
  subject:          string | null;
  letterBody:       string | null;
  recipientRole:    string | null;
  recipientName:    string | null;
  deliveryMethod:   string | null;
  recipientEmail:   string | null;
  recipientAddress: string | null;
  priority:         string | null;
  followUp:         boolean;
  status:           string;
  sendDate:         string | null;
  createdByName:    string | null;
  createdOn:        string | null;
  updatedByName:    string | null;
  updatedOn:        string | null;
};

export type SaveClaimLetterRequest = {
  id:               number | null;
  claimId:          number;
  letterType:       string | null;
  letterDate:       string | null;
  subject:          string | null;
  letterBody:       string | null;
  recipientRole:    string | null;
  recipientName:    string | null;
  deliveryMethod:   string | null;
  recipientEmail:   string | null;
  recipientAddress: string | null;
  priority:         string | null;
  followUp:         boolean;
};

export const claimLetterApi = {
  getList: (claimId: number) =>
    api.get<ClaimLetterListItemDto[]>(`/claims/${claimId}/letters`).then(r => r.data),

  getById: (claimId: number, letterId: number) =>
    api.get<ClaimLetterDetailDto>(`/claims/${claimId}/letters/${letterId}`).then(r => r.data),

  save: (claimId: number, req: SaveClaimLetterRequest) =>
    api.post<{ id: number }>(`/claims/${claimId}/letters`, req).then(r => r.data),

  update: (claimId: number, letterId: number, req: SaveClaimLetterRequest) =>
    api.put<{ id: number }>(`/claims/${claimId}/letters/${letterId}`, req).then(r => r.data),

  send: (claimId: number, letterId: number) =>
    api.post<{ sent: boolean }>(`/claims/${claimId}/letters/${letterId}/send`).then(r => r.data),

  delete: (claimId: number, letterId: number) =>
    api.delete(`/claims/${claimId}/letters/${letterId}`).then(r => r.data),
};
