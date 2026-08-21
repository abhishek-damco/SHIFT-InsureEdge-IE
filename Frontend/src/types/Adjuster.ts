export interface TempAdjusterLicenseDto {
  id?: number | null;
  licensedState?: string | null;
  licenseNumber?: string | null;
  licenseStartDate?: string | null;
  licenseExpirationDate?: string | null;
}

export interface TempAdjusterDto {
  id: number;
  userCode: string;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  ssn?: string | null;
  taxId?: string | null;
  role?: string | null;
  adjusterType?: string | null;
  status?: string | null;
  claimTypesHandled?: string | null;
  territoryType?: string | null;
  territoriesAssigned?: string | null;
  preferredCommunication?: string | null;
  telephoneNumber?: string | null;
  extension?: string | null;
  alternativeTelephoneNumber?: string | null;
  emailId?: string | null;
  registeredAddressLine1?: string | null;
  registeredAddressLine2?: string | null;
  registeredCountry?: string | null;
  registeredState?: string | null;
  registeredCity?: string | null;
  registeredCounty?: string | null;
  registeredZipCode?: string | null;
  registeredLatitude?: string | null;
  registeredLongitude?: string | null;
  mailingAddressLine1?: string | null;
  mailingAddressLine2?: string | null;
  mailingCountry?: string | null;
  mailingState?: string | null;
  mailingCity?: string | null;
  mailingCounty?: string | null;
  mailingZipCode?: string | null;
  mailingLatitude?: string | null;
  mailingLongitude?: string | null;
  paymentMethod?: string | null;
  ratePerHour?: string | null;
  complianceFlag?: string | null;
  accessJson?: string | null;
  licenses: TempAdjusterLicenseDto[];
  createdOn: string;
}

export type UpsertTempAdjusterRequest = Omit<TempAdjusterDto, 'id' | 'userCode' | 'createdOn'>;
