import SearchableSelect from '../ui/SearchableSelect';
import { GoogleAddressAutocomplete } from '../../pages/QuotesPolicies/NewSubmission';

export type AddressFieldsValue = {
  googleSearch: string;
  enterManually: boolean;
  addressLine1: string;
  addressLine2: string;
  country: string;
  state: string;
  city: string;
  county: string;
  zipCode: string;
  latitude: string;
  longitude: string;
};

export type AddressFieldName = keyof AddressFieldsValue;
export type AddressOption = { value: string; label: string };

function ClearSelect({ value, onChange, options, placeholder, disabled }: {
  value: string; onChange: (value: string) => void; options: AddressOption[]; placeholder?: string; disabled?: boolean;
}) {
  return <div className="cs-wrap">
    <select className="cs-select" value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>
      <option value="">{placeholder ?? 'Select...'}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    {value && !disabled && <button className="cs-clear" type="button" onClick={() => onChange('')}>×</button>}
    <span className="cs-arrow">▼</span>
  </div>;
}

function ErrorText({ message }: { message?: string }) {
  return message ? <span className="ferr"><span className="ferr__ico">⊘</span>{message}</span> : null;
}

/**
 * Presentation-only address editor. Consumers own address persistence, "same as"
 * business rules, option sources, and any field-name mapping.
 */
export function AddressFields({
  value,
  errors = {},
  onChange,
  countryOptions,
  stateOptions,
  disabled = false,
  showCounty = true,
  coordinatesReadOnly = true,
}: {
  value: AddressFieldsValue;
  errors?: Partial<Record<AddressFieldName, string>>;
  onChange: (field: AddressFieldName, nextValue: string | boolean) => void;
  countryOptions: AddressOption[];
  stateOptions: AddressOption[];
  disabled?: boolean;
  showCounty?: boolean;
  coordinatesReadOnly?: boolean;
}) {
  const entryDisabled = disabled || !value.enterManually;
  const changeCountry = (country: string) => {
    onChange('country', country);
    if (!stateOptions.some(option => option.value === value.state)) onChange('state', '');
  };

  return <>
    <div className="fc fg-mb">
      <label className="fl-plain">Google Address Search</label>
      <GoogleAddressAutocomplete
        disabled={disabled || value.enterManually}
        placeholder="Start typing an address"
        onSelect={place => {
          onChange('googleSearch', [place.addressLine1, place.city, place.state, place.country].filter(Boolean).join(', '));
          onChange('addressLine1', place.addressLine1);
          onChange('addressLine2', place.addressLine2 ?? '');
          onChange('country', place.country);
          onChange('state', place.state);
          onChange('city', place.city);
          onChange('county', place.county);
          onChange('zipCode', place.zip);
          onChange('latitude', place.latitude);
          onChange('longitude', place.longitude);
        }}
      />
    </div>
    <label className="manual-chk">
      <input type="checkbox" checked={value.enterManually} disabled={disabled} onChange={event => onChange('enterManually', event.target.checked)} />
      Enter Address Manually
    </label>
    <div className="fg2 fg-mb">
      <div className="fc"><label className="fl"><span className="req">*</span> Address Line 1</label>
        <input className={`fi${errors.addressLine1 ? ' fi--err' : ''}${entryDisabled ? ' fi--disabled' : ''}`} value={value.addressLine1} onChange={event => onChange('addressLine1', event.target.value)} disabled={entryDisabled} />
        <ErrorText message={errors.addressLine1} /></div>
      <div className="fc"><label className="fl">Address Line 2 <span className="fi-info">ⓘ</span></label>
        <input className={`fi${entryDisabled ? ' fi--disabled' : ''}`} value={value.addressLine2} onChange={event => onChange('addressLine2', event.target.value)} disabled={entryDisabled} /></div>
    </div>
    <div className="fg3 fg-mb">
      <div className="fc"><label className="fl"><span className="req">*</span> Country</label><SearchableSelect value={value.country} onChange={changeCountry} options={countryOptions} placeholder="Search..." clearable disabled={disabled} /><ErrorText message={errors.country} /></div>
      <div className="fc"><label className="fl"><span className="req">*</span> State</label><ClearSelect value={value.state} onChange={next => onChange('state', next)} options={stateOptions} placeholder="Select..." disabled={disabled} /><ErrorText message={errors.state} /></div>
      <div className="fc"><label className="fl"><span className="req">*</span> City</label><input className={`fi${errors.city ? ' fi--err' : ''}${entryDisabled ? ' fi--disabled' : ''}`} value={value.city} onChange={event => onChange('city', event.target.value)} disabled={entryDisabled} /><ErrorText message={errors.city} /></div>
    </div>
    <div className={showCounty ? 'fg2 fg-mb' : 'fg1 fg-mb'}>
      {showCounty && <div className="fc"><label className="fl"><span className="req">*</span> County</label><input className={`fi${errors.county ? ' fi--err' : ''}${entryDisabled ? ' fi--disabled' : ''}`} value={value.county} onChange={event => onChange('county', event.target.value)} disabled={entryDisabled} /><ErrorText message={errors.county} /></div>}
      <div className="fc"><label className="fl"><span className="req">*</span> Zip Code</label><input className={`fi${errors.zipCode ? ' fi--err' : ''}${entryDisabled ? ' fi--disabled' : ''}`} value={value.zipCode} onChange={event => onChange('zipCode', event.target.value)} disabled={entryDisabled} /><ErrorText message={errors.zipCode} /></div>
    </div>
    <div className="fg2 fg-mb">
      <div className="fc"><label className="fl-plain">Latitude</label><input className={`fi${coordinatesReadOnly ? ' fi--ro' : ''}${disabled ? ' fi--disabled' : ''}`} value={value.latitude} onChange={event => onChange('latitude', event.target.value)} readOnly={coordinatesReadOnly} disabled={disabled} /></div>
      <div className="fc"><label className="fl-plain">Longitude</label><input className={`fi${coordinatesReadOnly ? ' fi--ro' : ''}${disabled ? ' fi--disabled' : ''}`} value={value.longitude} onChange={event => onChange('longitude', event.target.value)} readOnly={coordinatesReadOnly} disabled={disabled} /></div>
    </div>
  </>;
}
