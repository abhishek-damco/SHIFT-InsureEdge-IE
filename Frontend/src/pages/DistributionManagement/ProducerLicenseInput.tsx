export const PRODUCER_LICENSE_ERROR = 'License Number must be exactly 10 digits.';
const TEN_DIGIT_LICENSE = /^\d{10}$/;

interface ProducerLicenseInputProps {
  value: string;
  onChange: (value: string) => void;
  className: string;
}

export function validateProducerLicense(value: string): string {
  return TEN_DIGIT_LICENSE.test(value) ? '' : PRODUCER_LICENSE_ERROR;
}

export default function ProducerLicenseInput({ value, onChange, className }: ProducerLicenseInputProps) {
  return (
    <input
      className={className}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={10}
      pattern="[0-9]{10}"
      value={value}
      onChange={event => onChange(event.target.value.replace(/\D/g, '').slice(0, 10))}
    />
  );
}
