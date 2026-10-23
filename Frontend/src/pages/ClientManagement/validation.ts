// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Client Management field rules (QA report §2 / §5). Mirrors Backend ClientValidator.
// Generic rules live in utils/fieldValidation; this file adds the Client-specific ones.
import { CANADA_PROVINCES, US_STATES } from '../DistributionManagement/IntermediaryReferenceData';
import type { SaveClientInfoRequest, SaveContactRequest } from '../../types/ClientManagement';
import {
  CANADA, type Errors, digitsOnly, invalid, isBlank as blank, isValidEmail, isValidName, isValidPhone,
  isValidZip, required, stateLabel, zipLabel,
} from '../../utils/fieldValidation';

export {
  CANADA, type Errors, apiErrorMessage, digitsOnly, formatPhone, invalid, isValidEmail, isValidName,
  isValidPhone, isValidZip, required, stateLabel, todayMmDdYyyy, zipLabel,
} from '../../utils/fieldValidation';

export const COUNTRIES = ['United States', CANADA] as const;
export const COMPANY_TYPES = ['MGA', 'Insurance Carrier'] as const;
export const OFFICE_TYPES = ['Branch', 'Regional'] as const;
export const EST_DWP_OPTIONS = ['Below 1M', '1–99M', '100–250M', '250M+'] as const;
export { US_STATES };

export const regionOptions = (country?: string): readonly string[] =>
  country === CANADA ? CANADA_PROVINCES : US_STATES;

export function formatFederalTaxId(raw: string): string {
  const d = digitsOnly(raw, 9);
  return d.length <= 2 ? d : `${d.slice(0, 2)}-${d.slice(2)}`;
}

// ── Section validators ─────────────────────────────────────────────────────────
export function validateClientInfo(f: SaveClientInfoRequest, hasLogo: boolean): Errors {
  const e: Errors = {};
  if (!hasLogo) e.logo = required('Client Logo');

  const name = f.companyName?.trim() ?? '';
  if (!name) e.companyName = required('Company Name');
  else if (name.length < 5 || name.length > 75) e.companyName = 'Company Name should be in between 5 to 75 characters';

  if (blank(f.typeOfCompany)) e.typeOfCompany = required('Type of Company');
  if (!blank(f.naicCode) && !/^\d{5}$/.test(f.naicCode!)) e.naicCode = invalid('NAIC Code');
  if (blank(f.domicileCountry)) e.domicileCountry = required('Domicile Country');
  if (blank(f.stateOfDomicile)) e.stateOfDomicile = required(`${stateLabel(f.domicileCountry)} of Domicile`);

  if (blank(f.federalTaxId)) e.federalTaxId = required('Federal Tax ID');
  else if (!/^\d{2}-\d{7}$/.test(f.federalTaxId!)) e.federalTaxId = invalid('Federal Tax ID');

  if (!blank(f.numberOfEmployees) && !/^\d{1,10}$/.test(f.numberOfEmployees!)) e.numberOfEmployees = invalid('No. of Employees');

  if (!blank(f.yearBusinessStarted)) {
    const y = Number(f.yearBusinessStarted);
    if (!/^\d{4}$/.test(f.yearBusinessStarted!) || y < 1600 || y > new Date().getFullYear())
      e.yearBusinessStarted = invalid('Year Business Started');
  }

  if (!blank(f.emailId) && !isValidEmail(f.emailId!)) e.emailId = invalid('Email ID');
  if (!blank(f.telephoneNumber) && !isValidPhone(f.telephoneNumber!)) e.telephoneNumber = invalid('Telephone');
  if (f.extension != null && !/^\d{1,6}$/.test(String(f.extension))) e.extension = invalid('Extension');

  const desc = f.businessDescription?.trim() ?? '';
  if (desc && (desc.length < 5 || desc.length > 1000))
    e.businessDescription = 'Business Description should be in between 5 to 1000 characters';
  return e;
}

export interface AddressLike {
  addressLine1?: string; country?: string; state?: string; city?: string; zipCode?: string;
}

// Keys match AddressFields' field names so errors can be passed straight through.
export function validateAddress(a: AddressLike): Errors {
  const e: Errors = {};
  if (blank(a.addressLine1)) e.addressLine1 = required('Address Line 1');
  if (blank(a.country)) e.country = required('Country');
  if (blank(a.state)) e.state = required(stateLabel(a.country));
  if (blank(a.city)) e.city = required('City');
  const zl = zipLabel(a.country);
  if (blank(a.zipCode)) e.zipCode = required(zl);
  else if (!isValidZip(a.zipCode!, a.country)) e.zipCode = invalid(zl);
  return e;
}

export function validateContact(c: SaveContactRequest): Errors {
  const e: Errors = {};
  if (blank(c.name)) e.name = required('Name');
  else if (!isValidName(c.name!)) e.name = invalid('Name');
  if (!blank(c.suffix) && !/^[A-Za-z]{1,4}$/.test(c.suffix!)) e.suffix = invalid('Suffix');
  if (blank(c.title)) e.title = required('Title');
  if (blank(c.emailId)) e.emailId = required('Email ID');
  else if (!isValidEmail(c.emailId!)) e.emailId = invalid('Email ID');
  if (!blank(c.telephoneNumber) && !isValidPhone(c.telephoneNumber!)) e.telephoneNumber = invalid('Telephone');
  if (c.extension != null && !/^\d{1,6}$/.test(String(c.extension))) e.extension = invalid('Extension');
  if (!blank(c.altTelephoneNumber) && !isValidPhone(c.altTelephoneNumber!)) e.altTelephoneNumber = invalid('Alternative Telephone');
  return e;
}

export function isContactEmpty(c: SaveContactRequest): boolean {
  return [c.name, c.suffix, c.title, c.emailId, c.telephoneNumber, c.extension, c.altTelephoneNumber].every(blank);
}

// Pulls one section's errors out of a combined map (e.g. "secondary.1.name" → "name").
export function pickErrors(prefix: string, errors: Errors): Errors {
  return Object.fromEntries(
    Object.entries(errors).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  );
}
