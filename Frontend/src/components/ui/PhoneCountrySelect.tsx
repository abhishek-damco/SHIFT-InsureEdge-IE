import { useEffect, useRef, useState } from 'react';
import './PhoneCountrySelect.css';

export const PHONE_COUNTRY_US = 'United States +1';
export const PHONE_COUNTRY_CA = 'Canada +1';

const PHONE_COUNTRIES = [
  { value: PHONE_COUNTRY_US, flagClass: 'flag-us' },
  { value: PHONE_COUNTRY_CA, flagClass: 'flag-ca' },
] as const;

export default function PhoneCountrySelect({ value, onChange, disabled }: {
  value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PHONE_COUNTRIES.find(country => country.value === value) ?? PHONE_COUNTRIES[0];

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="phone-country-select" ref={ref}>
      <button type="button" className="phone-country-trigger" onClick={() => setOpen(show => !show)}
        disabled={disabled} aria-label="Phone country" aria-haspopup="listbox" aria-expanded={open}>
        <span className={`flag-icon ${current.flagClass}`} aria-hidden="true" />
        <svg viewBox="0 0 10 6" width="8" height="8" style={{ color: '#6b7280', flexShrink: 0 }} aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="phone-country-dropdown" role="listbox" aria-label="Phone country options">
          {PHONE_COUNTRIES.map(country => (
            <div key={country.value} role="option" aria-selected={value === country.value}
              className={`phone-country-option${value === country.value ? ' active' : ''}`}
              onMouseDown={() => { onChange(country.value); setOpen(false); }}>
              <span className={`flag-icon ${country.flagClass}`} aria-hidden="true" />
              <span>{country.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
