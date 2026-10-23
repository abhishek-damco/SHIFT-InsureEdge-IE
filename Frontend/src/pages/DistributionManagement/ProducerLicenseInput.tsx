import { invalid } from '../../utils/fieldValidation';

// QA D1-29/30: licenses are optional and alphanumeric (letters and digits, max 10).
// Mirrors Backend ProducerLicenseValidator.
export const LICENSE_MAX_LENGTH = 10;
export const LICENSE_PATTERN = /^[A-Za-z0-9]{1,10}$/;
export const PRODUCER_LICENSE_ERROR = invalid('License Number');

export const toLicense = (raw: string) => raw.replace(/[^A-Za-z0-9]/g, '').slice(0, LICENSE_MAX_LENGTH);

interface ProducerLicenseInputProps {
  value: string;
  onChange: (value: string) => void;
  className: string;
}

// '' when valid (including empty — the field is optional).
export function validateProducerLicense(value: string): string {
  return !value || LICENSE_PATTERN.test(value) ? '' : PRODUCER_LICENSE_ERROR;
}

export default function ProducerLicenseInput({ value, onChange, className }: ProducerLicenseInputProps) {
  return (
    <input
      className={className}
      type="text"
      autoComplete="off"
      maxLength={LICENSE_MAX_LENGTH}
      value={value}
      onChange={event => onChange(toLicense(event.target.value))}
    />
  );
}
