// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
import api from './client';
import type {
  ClientDetail,
  ClientListItem,
  SaveClientInfoRequest,
  SaveAddressRequest,
  SaveContactRequest,
  SaveOfficeRequest,
  SaveCompanyRequest,
  ProductAccessDto,
  ProductDto,
  SaveProductAccessRequest,
} from '../types/ClientManagement';

export const clientManagementApi = {
  // List (platform admin)
  getList: (search?: string, page = 1, pageSize = 20) =>
    api.get<{ items: ClientListItem[]; total: number; page: number; pageSize: number }>(
      '/clients', { params: { search, page, pageSize } }
    ).then(r => r.data),

  // Current tenant's full profile
  getMyDetail: () =>
    api.get<ClientDetail>('/clients/me').then(r => r.data),

  // Specific client
  getById: (id: number) =>
    api.get<ClientDetail>(`/clients/${id}`).then(r => r.data),

  // Update primary info
  updateInfo: (req: SaveClientInfoRequest) =>
    api.patch('/clients/me/info', req),

  // Address (Legal or Mailing)
  saveAddress: (req: SaveAddressRequest) =>
    api.put('/clients/me/address', req),

  // Primary contact
  saveContact: (req: SaveContactRequest) =>
    api.put('/clients/me/contact', req),

  // Offices
  saveOffice: (req: SaveOfficeRequest) =>
    api.post<{ id: number }>('/clients/me/offices', req).then(r => r.data),

  deleteOffice: (officeId: number) =>
    api.delete(`/clients/me/offices/${officeId}`),

  // Companies
  saveCompany: (req: SaveCompanyRequest) =>
    api.post<{ id: number }>('/clients/me/companies', req).then(r => r.data),

  deleteCompany: (companyId: number) =>
    api.delete(`/clients/me/companies/${companyId}`),

  saveCompanyAddress: (companyId: number, req: SaveAddressRequest) =>
    api.put(`/clients/me/companies/${companyId}/address`, req),

  saveCompanyContact: (companyId: number, req: SaveContactRequest) =>
    api.put(`/clients/me/companies/${companyId}/contact`, req),

  // Products
  getProductAccess: (companyId: number) =>
    api.get<ProductAccessDto[]>(`/clients/me/companies/${companyId}/products`).then(r => r.data),

  saveProductAccess: (companyId: number, req: SaveProductAccessRequest) =>
    api.put(`/clients/me/companies/${companyId}/products`, req),

  getAllProducts: () =>
    api.get<ProductDto[]>('/clients/reference/products').then(r => r.data),
};
