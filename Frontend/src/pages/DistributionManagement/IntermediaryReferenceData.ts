export const INTERMEDIARY_COUNTRIES = ['United States', 'Canada'] as const;

export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
] as const;

export const CANADA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador',
  'Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island',
  'Quebec','Saskatchewan','Yukon',
] as const;

export function jurisdictionOptions(country: string): readonly string[] {
  if (country === 'United States') return US_STATES;
  if (country === 'Canada') return CANADA_PROVINCES;
  return [];
}

export function includeLegacyValue(options: readonly string[], value: string): string[] {
  return value && !options.includes(value) ? [value, ...options] : [...options];
}

export function toSelectOptions(options: readonly string[], value = '') {
  return includeLegacyValue(options, value).map(option => ({ value: option, label: option }));
}
