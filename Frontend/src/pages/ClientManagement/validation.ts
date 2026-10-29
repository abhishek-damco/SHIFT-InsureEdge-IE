// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Client Management field rules (QA report §2 / §5). Mirrors Backend ClientValidator.
// Generic rules live in utils/fieldValidation; this file adds the Client-specific ones.
import { CANADA_PROVINCES, US_STATES } from '../DistributionManagement/IntermediaryReferenceData';
import type { SaveClientInfoRequest, SaveCompanyRequest, SaveContactRequest } from '../../types/ClientManagement';
import {
  CANADA, type Errors, checkPhonesDiffer, digitsOnly, formatUsZipInput, invalid, isBlank as blank, isValidEmail, isValidName, isValidPhone,
  isValidZip, normalizeNorthAmericanPhone, required, stateLabel, zipLabel,
} from '../../utils/fieldValidation';

export {
  CANADA, type Errors, apiErrorMessage, digitsOnly, formatPhone, formatUsZipInput, invalid, isValidEmail, isValidName,
  isValidPhone, isValidZip, normalizeNorthAmericanPhone, required, stateLabel, todayMmDdYyyy, zipLabel,
} from '../../utils/fieldValidation';

export const COUNTRIES = ['United States', CANADA] as const;
export const COMPANY_TYPES = ['MGA', 'Insurance Carrier'] as const;
export const OFFICE_TYPES = ['Branch', 'Regional'] as const;
export const BUSINESS_DESCRIPTION_MIN = 5;
export const BUSINESS_DESCRIPTION_MAX = 1000;
export const BUSINESS_DESCRIPTION_LENGTH_ERROR = 'Business Description should be in between 5 to 1000 characters';
export const EST_DWP_OPTIONS = ['Below 1M', '1–99M', '100–250M', '250M+'] as const;
export { US_STATES };

export const regionOptions = (country?: string): readonly string[] =>
  country === CANADA ? CANADA_PROVINCES : US_STATES;

export function formatFederalTaxId(raw: string): string {
  const d = digitsOnly(raw, 9);
  return d.length <= 2 ? d : `${d.slice(0, 2)}-${d.slice(2)}`;
}

export function validateBusinessDescription(value?: string | null): string | undefined {
  const description = value?.trim() ?? '';
  if (!description) return undefined;
  return description.length < BUSINESS_DESCRIPTION_MIN || description.length > BUSINESS_DESCRIPTION_MAX
    ? BUSINESS_DESCRIPTION_LENGTH_ERROR
    : undefined;
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

  const businessDescriptionError = validateBusinessDescription(f.businessDescription);
  if (businessDescriptionError) e.businessDescription = businessDescriptionError;
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
  if (blank(c.telephoneNumber)) e.telephoneNumber = required('Telephone Number');
  else if (!isValidPhone(c.telephoneNumber!)) e.telephoneNumber = invalid('Telephone');
  if (c.extension != null && !/^\d{1,6}$/.test(String(c.extension))) e.extension = invalid('Extension');
  if (!blank(c.altTelephoneNumber) && !isValidPhone(c.altTelephoneNumber!)) e.altTelephoneNumber = invalid('Alternative Telephone');
  checkPhonesDiffer(e, 'telephoneNumber', 'altTelephoneNumber', c.telephoneNumber, c.altTelephoneNumber);
  return e;
}

export function validateCompanyForm(form: SaveCompanyRequest, hasExistingLogo = false): Errors {
  const errors: Errors = {};
  if (!form.logoBase64 && !hasExistingLogo) errors.logo = required('Company Logo');
  if (blank(form.companyName)) errors.companyName = required('Company Name');
  else if (form.companyName.length > 75) errors.companyName = invalid('Company Name');
  if (blank(form.domicileCountry)) errors.domicileCountry = required('Domicile Country');
  if (blank(form.stateOfDomicile)) errors.stateOfDomicile = required(`${form.domicileCountry === CANADA ? 'Province' : 'State'} of Domicile`);
  if (blank(form.naicCode)) errors.naicCode = required('NAIC Code');
  if (blank(form.federalTaxId)) errors.federalTaxId = required('Federal Tax ID');
  else if (!/^\d{2}-\d{7}$/.test(form.federalTaxId!)) errors.federalTaxId = invalid('Federal Tax ID');
  const description = validateBusinessDescription(form.businessDescription);
  if (description) errors.businessDescription = description;
  for (const [key, value] of Object.entries(validateAddress(form.legalAddress ?? {}))) errors[`legal.${key}`] = value;
  if (!form.mailingAddress?.isSameAsLegal) {
    for (const [key, value] of Object.entries(validateAddress(form.mailingAddress ?? {}))) errors[`mailing.${key}`] = value;
  }
  const contacts = [form.primaryContact ?? {}, ...(form.secondaryContacts ?? [])];
  contacts.forEach((contact, index) => {
    const prefix = index === 0 ? 'primary.' : `secondary.${index - 1}.`;
    for (const [key, value] of Object.entries(validateContact(contact))) errors[`${prefix}${key}`] = value;
  });
  return errors;
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
