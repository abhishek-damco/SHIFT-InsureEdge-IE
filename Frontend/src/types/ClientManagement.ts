// AI_GENERATED | HUMAN_VALIDATION_REQUIRED

export interface AddressDto {
  id?: number;
  addressType: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  isManual: boolean;
}

export interface ContactDto {
  id?: number;
  contactType: string;
  name?: string;
  suffix?: string;
  title?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  altTelephoneNumber?: string;
  altTelephoneNumberCc?: string;
}

export interface OfficeDto {
  id?: number;
  officeName: string;
  officeType?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  contactName?: string;
  contactSuffix?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPhoneCc?: string;
  contactExt?: number;
  contactAltPhone?: string;
  contactAltPhoneCc?: string;
}

export interface CompanyDto {
  id: number;
  companyCode: string;
  companyName: string;
  status: string;
  domicileCountry?: string;
  stateOfDomicile?: string;
  naicCode?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  federalTaxId?: string;
  url?: string;
  businessDescription?: string;
  logoBase64?: string;
  logoContentType?: string;
  legalAddress?: AddressDto;
  mailingAddress?: AddressDto;
  primaryContact?: ContactDto;
  createdOn: string;
  updatedOn?: string;
}

export interface ClientListItem {
  id: number;
  clientCode: string;
  companyName: string;
  status: string;
  typeOfCompany: string;
  naicCode?: string;
  emailId?: string;
  telephoneNumber?: string;
  domicileCountry?: string;
  stateOfDomicile?: string;
  createdOn: string;
}

export interface ClientDetail {
  id: number;
  clientCode: string;
  companyName: string;
  status: string;
  typeOfCompany?: string;
  naicCode?: string;
  registeredTradeMark?: string;
  domicileCountry?: string;
  stateOfDomicile?: string;
  stateAllowedToOperate?: string;
  federalTaxId?: string;
  ownedBy?: string;
  numberOfEmployees?: string;
  estDirectWrittenPremium?: string;
  yearBusinessStarted?: string;
  businessDescription?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  clientUrl?: string;
  clientOnboardingDate?: string;
  clientRegistrationDate?: string;
  logoBase64?: string;
  logoContentType?: string;
  legalAddress?: AddressDto;
  mailingAddress?: AddressDto;
  primaryContact?: ContactDto;
  offices: OfficeDto[];
  companies: CompanyDto[];
  createdOn: string;
  updatedOn?: string;
}

export interface SubProductDto {
  id: number;
  subProductName: string;
  isSelected: boolean;
}

export interface JurisdictionDto {
  stateCode: string;
  stateName: string;
}

export interface ProductAccessDto {
  productId: number;
  productName: string;
  category: string;
  selectedSubProductCount: number;
  jurisdictionCount: number;
  subProducts: SubProductDto[];
  jurisdictions: JurisdictionDto[];
}

export interface ProductDto {
  id: number;
  productName: string;
  category: string;
}

// Request types
export interface SaveClientInfoRequest {
  companyName: string;
  typeOfCompany?: string;
  naicCode?: string;
  registeredTradeMark?: string;
  domicileCountry?: string;
  stateOfDomicile?: string;
  stateAllowedToOperate?: string;
  federalTaxId?: string;
  ownedBy?: string;
  numberOfEmployees?: string;
  estDirectWrittenPremium?: string;
  yearBusinessStarted?: string;
  businessDescription?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  clientUrl?: string;
  clientOnboardingDate?: string;
  status?: string;
  logoBase64?: string;
  logoContentType?: string;
  logoFileName?: string;
}

export interface SaveAddressRequest {
  addressType: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  isManual: boolean;
}

export interface SaveContactRequest {
  name?: string;
  suffix?: string;
  title?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  altTelephoneNumber?: string;
  altTelephoneNumberCc?: string;
}

export interface SaveOfficeRequest {
  id?: number;
  officeName: string;
  officeType?: string;
  addressLine1?: string;
  addressLine2?: string;
  country?: string;
  state?: string;
  city?: string;
  county?: string;
  zipCode?: string;
  latitude?: string;
  longitude?: string;
  contactName?: string;
  contactSuffix?: string;
  contactTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactPhoneCc?: string;
  contactExt?: number;
  contactAltPhone?: string;
  contactAltPhoneCc?: string;
}

export interface SaveCompanyRequest {
  id?: number;
  companyName: string;
  domicileCountry?: string;
  stateOfDomicile?: string;
  naicCode?: string;
  emailId?: string;
  telephoneNumber?: string;
  telephoneNumberCc?: string;
  extension?: number;
  federalTaxId?: string;
  url?: string;
  businessDescription?: string;
  status?: string;
  logoBase64?: string;
  logoContentType?: string;
  logoFileName?: string;
  legalAddress?: SaveAddressRequest;
  mailingAddress?: SaveAddressRequest;
  primaryContact?: SaveContactRequest;
}

export interface SaveProductAccessRequest {
  productId: number;
  subProductIds: number[];
  jurisdictions: JurisdictionDto[];
}
