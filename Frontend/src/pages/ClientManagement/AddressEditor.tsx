// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Client Management wrapper around the shared AddressFields (Google search + Enter Address Manually).
import { useState } from 'react';
import { AddressFields, type AddressFieldName } from '../../components/address/AddressFields';
import type { AddressDto, SaveAddressRequest } from '../../types/ClientManagement';
import { CANADA, COUNTRIES, type Errors, formatUsZipInput, regionOptions, stateLabel, zipLabel } from './validation';

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
  const [confirmManualOff, setConfirmManualOff] = useState(false);
  const isCanada = value.country === CANADA;
  const options = regionOptions(value.country).map(o => ({ value: o, label: o }));
  if (value.state && !options.some(o => o.value === value.state)) options.unshift({ value: value.state, label: value.state });

  const handle = (field: AddressFieldName, next: string | boolean) => {
    if (field === 'googleSearch') { setGoogleSearch(String(next)); return; }
    if (field === 'enterManually') {
      const manual = Boolean(next);
      const hasEnteredAddress = [value.addressLine1, value.addressLine2, value.state, value.city, value.county,
        value.zipCode, value.latitude, value.longitude].some(part => String(part ?? '').trim());
      if (!manual && value.isManual && hasEnteredAddress) { setConfirmManualOff(true); return; }
      onChange(prev => ({ ...prev, isManual: manual })); return;
    }
    onChange(prev => {
      const patch: Partial<AddressForm> = { [field]: next };
      if (field === 'country' && next !== prev.country) {
        // Google fills state right after country, so this reset never clobbers it.
        patch.state = '';
        if (next === CANADA) patch.county = '';
      }
      if (field === 'zipCode') patch.zipCode = prev.country === CANADA
        ? String(next).toUpperCase()
        : formatUsZipInput(String(next));
      return { ...prev, ...patch };
    });
  };

  const discardManualAddress = () => {
    onChange(prev => ({
      ...prev,
      isManual: false,
      addressLine1: '', addressLine2: '', state: '', city: '', county: '', zipCode: '', latitude: '', longitude: '',
    }));
    setGoogleSearch('');
    setConfirmManualOff(false);
  };

  return (
    <>
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
      trailingColumns={3}
    />
    {confirmManualOff && <div style={{ position: 'fixed', inset: 0, zIndex: 1400, background: 'rgba(0,0,0,.25)', display: 'grid', placeItems: 'center' }}>
      <div role="dialog" aria-modal="true" aria-labelledby="discard-address-title" style={{ width: 250, background: '#fff', borderRadius: 5, boxShadow: '0 5px 16px rgba(0,0,0,.22)', padding: '14px 13px 10px', textAlign: 'center' }}>
        <div aria-hidden="true" style={{ fontSize: 24, lineHeight: 1, marginBottom: 8 }}>⚠</div>
        <div id="discard-address-title" style={{ fontSize: 11, lineHeight: 1.45, color: '#4b5563', marginBottom: 12 }}>Unchecking this option will remove the address<br />you entered. Do you want to continue?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={() => setConfirmManualOff(false)} style={{ height: 28, border: '1px solid #d8dee6', borderRadius: 3, background: '#fff', color: '#0B5AA0', fontSize: 11 }}>Cancel</button>
          <button type="button" onClick={discardManualAddress} style={{ height: 28, border: 0, borderRadius: 3, background: '#0B5AA0', color: '#fff', fontSize: 11, fontWeight: 600 }}>Continue</button>
        </div>
      </div>
    </div>}
    </>
  );
}
