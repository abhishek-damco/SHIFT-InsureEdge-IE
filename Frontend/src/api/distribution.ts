import apiClient from './client';

export const distributionApi = {
  intermediaries: {
    list:   ()                         => apiClient.get<any[]>('/distribution/intermediaries').then(r => r.data),
    get:    (id: number)               => apiClient.get<any>(`/distribution/intermediaries/${id}`).then(r => r.data),
    create: (data: any)                => apiClient.post<any>('/distribution/intermediaries', data).then(r => r.data),
    update: (id: number, data: any)    => apiClient.put<any>(`/distribution/intermediaries/${id}`, data).then(r => r.data),
    remove: (id: number)               => apiClient.delete<any>(`/distribution/intermediaries/${id}`).then(r => r.data),
  },

  contacts: {
    list:   (iid: number)              => apiClient.get<any[]>(`/distribution/intermediaries/${iid}/contacts`).then(r => r.data),
    create: (iid: number, data: any)   => apiClient.post<any>(`/distribution/intermediaries/${iid}/contacts`, data).then(r => r.data),
    update: (iid: number, cid: number, data: any) =>
      apiClient.put<any>(`/distribution/intermediaries/${iid}/contacts/${cid}`, data).then(r => r.data),
    remove: (iid: number, cid: number) => apiClient.delete<any>(`/distribution/intermediaries/${iid}/contacts/${cid}`).then(r => r.data),
  },

  address: {
    get:    (iid: number)              => apiClient.get<any>(`/distribution/intermediaries/${iid}/address`).then(r => r.data),
    create: (iid: number, data: any)   => apiClient.post<any>(`/distribution/intermediaries/${iid}/address`, data).then(r => r.data),
    update: (iid: number, aid: number, data: any) =>
      apiClient.put<any>(`/distribution/intermediaries/${iid}/address/${aid}`, data).then(r => r.data),
  },

  nrStates: {
    list:   (iid: number)              => apiClient.get<any[]>(`/distribution/intermediaries/${iid}/nr-states`).then(r => r.data),
    create: (iid: number, data: any)   => apiClient.post<any>(`/distribution/intermediaries/${iid}/nr-states`, data).then(r => r.data),
    update: (iid: number, sid: number, data: any) =>
      apiClient.put<any>(`/distribution/intermediaries/${iid}/nr-states/${sid}`, data).then(r => r.data),
    remove: (iid: number, sid: number) => apiClient.delete<any>(`/distribution/intermediaries/${iid}/nr-states/${sid}`).then(r => r.data),
  },

  commissions: {
    list:   (iid: number)              => apiClient.get<any[]>(`/distribution/intermediaries/${iid}/commissions`).then(r => r.data),
    create: (iid: number, data: any)   => apiClient.post<any>(`/distribution/intermediaries/${iid}/commissions`, data).then(r => r.data),
    update: (iid: number, cid: number, data: any) =>
      apiClient.put<any>(`/distribution/intermediaries/${iid}/commissions/${cid}`, data).then(r => r.data),
    remove: (iid: number, cid: number) => apiClient.delete<any>(`/distribution/intermediaries/${iid}/commissions/${cid}`).then(r => r.data),
  },

  producers: {
    listByIntermediary: (iid: number)  => apiClient.get<any[]>(`/distribution/producers/by-intermediary/${iid}`).then(r => r.data),
    get:    (id: number)               => apiClient.get<any>(`/distribution/producers/${id}`).then(r => r.data),
    create: (data: any)                => apiClient.post<any>('/distribution/producers', data).then(r => r.data),
    update: (id: number, data: any)    => apiClient.put<any>(`/distribution/producers/${id}`, data).then(r => r.data),
    remove: (id: number)               => apiClient.delete<any>(`/distribution/producers/${id}`).then(r => r.data),
  },

  producerNrStates: {
    list:   (pid: number)              => apiClient.get<any[]>(`/distribution/producers/${pid}/nr-states`).then(r => r.data),
    create: (pid: number, data: any)   => apiClient.post<any>(`/distribution/producers/${pid}/nr-states`, data).then(r => r.data),
    update: (pid: number, sid: number, data: any) =>
      apiClient.put<any>(`/distribution/producers/${pid}/nr-states/${sid}`, data).then(r => r.data),
    remove: (pid: number, sid: number) => apiClient.delete<any>(`/distribution/producers/${pid}/nr-states/${sid}`).then(r => r.data),
  },

  producerAddress: {
    get:    (pid: number)              => apiClient.get<any>(`/distribution/producers/${pid}/address`).then(r => r.data),
    create: (pid: number, data: any)   => apiClient.post<any>(`/distribution/producers/${pid}/address`, data).then(r => r.data),
  },

  bulkUpload: {
    upload: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post<any>('/distribution/bulk-upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data);
    },
    history:     ()                    => apiClient.get<any[]>('/distribution/bulk-upload/history').then(r => r.data),
    errorReport: (auditId: number)     =>
      apiClient.get<Blob>(`/distribution/bulk-upload/${auditId}/error-report`, { responseType: 'blob' }).then(r => r.data),
  },

  commonMaster: {
    list: (type: string)               => apiClient.get<any[]>(`/distribution/common-master/${type.toUpperCase()}`).then(r => r.data),
  },

  products: {
    list: (isSubProduct?: boolean)     =>
      apiClient.get<any[]>(`/distribution/products${isSubProduct !== undefined ? `?is_sub_product=${isSubProduct}` : ''}`).then(r => r.data),
    create: (data: any)                => apiClient.post<any>('/distribution/products', data).then(r => r.data),
  },

  screenPermissions: {
    listByIntermediary: (iid: number)  =>
      apiClient.get<any[]>(`/distribution/screen-permissions/by-intermediary/${iid}`).then(r => r.data),
    saveByIntermediary: (iid: number, permissions: any[]) =>
      apiClient.post<any[]>(`/distribution/screen-permissions/by-intermediary/${iid}`, { permissions }).then(r => r.data),
  },

  modules: {
    list: ()                           => apiClient.get<any[]>('/distribution/modules').then(r => r.data),
  },

  screens: {
    listAll: ()                        => apiClient.get<any[]>('/distribution/modules/screens/all').then(r => r.data),
  },

  users: {
    create: (data: { email: string; name?: string | null }) =>
      apiClient.post<any>('/distribution/users', data).then(r => r.data),
  },

  clients: {
    getMe: () => apiClient.get<any>('/clients/me').then(r => r.data),
  },
};

export const billingApi = {
  searchPolicyPayments: (filters: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return apiClient.get<any[]>(`/billing/policy-payments${qs ? `?${qs}` : ''}`).then(r => r.data);
  },
  getRecentActivity: ()                => apiClient.get<any[]>('/billing/recent-activity').then(r => r.data),
  logPolicyView: (policyId: number)    =>
    apiClient.post<any>(`/billing/recent-activity/${policyId}`).then(r => r.data),
  getPaymentDetail: (transactionId: number) =>
    apiClient.get<any>(`/billing/payment-detail/${transactionId}`).then(r => r.data),
  recordPayment: (transactionId: number, data: {
    paymentMethod: string;
    paymentDate: string;
    paymentRefNumber?: string;
    paymentRefAmount?: number;
  }) => apiClient.post<any>(`/billing/policy-payments/${transactionId}/pay`, data).then(r => r.data),
};
