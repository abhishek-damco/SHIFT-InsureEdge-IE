import { AddressFields, type AddressFieldName, type AddressFieldsValue } from '../../components/address/AddressFields';
import { INTERMEDIARY_COUNTRIES, includeLegacyValue, jurisdictionOptions, toSelectOptions } from './IntermediaryReferenceData';

export type IntermediaryAddressValue = {
  googleSearch: string; enterManually: boolean; addrLine1: string; addrLine2: string;
  addrCountry: string; addrState: string; city: string; county: string; zipCode: string;
  latitude: string; longitude: string;
};

const fieldMap: Record<AddressFieldName, keyof IntermediaryAddressValue> = {
  googleSearch: 'googleSearch', enterManually: 'enterManually', addressLine1: 'addrLine1', addressLine2: 'addrLine2',
  country: 'addrCountry', state: 'addrState', city: 'city', county: 'county', zipCode: 'zipCode', latitude: 'latitude', longitude: 'longitude',
};

// Distribution adapter: persistence and field names remain owned by the caller.
export function IntermediaryAddressFields({ value, errors = {}, onChange, disabled = false }: {
  value: IntermediaryAddressValue;
  errors?: Record<string, string>;
  onChange: <K extends keyof IntermediaryAddressValue>(field: K, nextValue: IntermediaryAddressValue[K]) => void;
  disabled?: boolean;
}) {
  const sharedValue: AddressFieldsValue = {
    googleSearch: value.googleSearch, enterManually: value.enterManually,
    addressLine1: value.addrLine1, addressLine2: value.addrLine2, country: value.addrCountry, state: value.addrState,
    city: value.city, county: value.county, zipCode: value.zipCode, latitude: value.latitude, longitude: value.longitude,
  };
  return <AddressFields
    value={sharedValue}
    errors={{ addressLine1: errors.addrLine1, country: errors.addrCountry, state: errors.addrState, city: errors.city, county: errors.county, zipCode: errors.zipCode }}
    countryOptions={toSelectOptions(INTERMEDIARY_COUNTRIES, value.addrCountry)}
    stateOptions={includeLegacyValue(jurisdictionOptions(value.addrCountry), value.addrState).map(option => ({ value: option, label: option }))}
    disabled={disabled}
    onChange={(field, nextValue) => onChange(fieldMap[field], nextValue as never)}
  />;
}
