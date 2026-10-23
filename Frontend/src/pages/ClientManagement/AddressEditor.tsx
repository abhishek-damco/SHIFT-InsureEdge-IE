// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Client Management wrapper around the shared AddressFields (Google search + Enter Address Manually).
import { useState } from 'react';
import { AddressFields, type AddressFieldName } from '../../components/address/AddressFields';
import type { AddressDto, SaveAddressRequest } from '../../types/ClientManagement';
import { CANADA, COUNTRIES, type Errors, regionOptions, stateLabel, zipLabel } from './validation';

export type AddressForm = Omit<SaveAddressRequest, 'addressType'>;

export const toAddressForm = (a?: Partial<AddressDto> | null): AddressForm => ({
  addressLine1: a?.addressLine1 ?? '',
  addressLine2: a?.addressLine2 ?? '',
  country: a?.country || 'United States',
  state: a?.state ?? '',
  city: a?.city ?? '',
  county: a?.county ?? '',
  zipCode: a?.zipCode ?? '',
  latitude: a?.latitude ?? '',
  longitude: a?.longitude ?? '',
  isManual: a?.isManual ?? false,
  isSameAsLegal: a?.isSameAsLegal ?? false,
});

const MAX_LENGTHS = { addressLine1: 500, addressLine2: 500, city: 50, county: 50, zipCode: 10 };

export function AddressEditor({ value, onChange, errors = {}, disabled }: {
  value: AddressForm;
  // Updater form: a Google selection emits several field changes in a row, and each
  // must apply on top of the previous one rather than on this render's stale value.
  onChange: (update: (prev: AddressForm) => AddressForm) => void;
  errors?: Errors;
  disabled?: boolean;
}) {
  const [googleSearch, setGoogleSearch] = useState('');
  const isCanada = value.country === CANADA;
  const options = regionOptions(value.country).map(o => ({ value: o, label: o }));
  if (value.state && !options.some(o => o.value === value.state)) options.unshift({ value: value.state, label: value.state });

  const handle = (field: AddressFieldName, next: string | boolean) => {
    if (field === 'googleSearch') { setGoogleSearch(String(next)); return; }
    if (field === 'enterManually') { onChange(prev => ({ ...prev, isManual: Boolean(next) })); return; }
    onChange(prev => {
      const patch: Partial<AddressForm> = { [field]: next };
      if (field === 'country' && next !== prev.country) {
        // Google fills state right after country, so this reset never clobbers it.
        patch.state = '';
        if (next === CANADA) patch.county = '';
      }
      if (field === 'zipCode' && prev.country === CANADA) patch.zipCode = String(next).toUpperCase();
      return { ...prev, ...patch };
    });
  };

  return (
    <AddressFields
      value={{
        googleSearch,
        enterManually: value.isManual,
        addressLine1: value.addressLine1 ?? '',
        addressLine2: value.addressLine2 ?? '',
        country: value.country ?? '',
        state: value.state ?? '',
        city: value.city ?? '',
        county: value.county ?? '',
        zipCode: value.zipCode ?? '',
        latitude: value.latitude ?? '',
        longitude: value.longitude ?? '',
      }}
      errors={errors}
      onChange={handle}
      countryOptions={COUNTRIES.map(c => ({ value: c, label: c }))}
      stateOptions={options}
      disabled={disabled}
      showCounty={!isCanada}
      countyRequired={false}
      stateLabel={stateLabel(value.country)}
      zipLabel={zipLabel(value.country)}
      maxLengths={MAX_LENGTHS}
    />
  );
}
