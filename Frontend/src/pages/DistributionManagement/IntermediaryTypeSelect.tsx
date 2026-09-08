const INTERMEDIARY_TYPE_OPTIONS = ['Brokerage', 'Other'] as const;

interface IntermediaryTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function IntermediaryTypeSelect({
  value,
  onChange,
  className,
}: IntermediaryTypeSelectProps) {
  const isLegacyValue = value !== '' && !INTERMEDIARY_TYPE_OPTIONS.some(option => option === value);

  return (
    <select className={className} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">Select...</option>
      {isLegacyValue ? <option value={value} hidden>{value}</option> : null}
      {INTERMEDIARY_TYPE_OPTIONS.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}
