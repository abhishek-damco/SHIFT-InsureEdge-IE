interface Props {
  total: number
  active: number
  inactive: number
}

export default function KpiCards({ total, active, inactive }: Props) {
  return (
    <div className="flex w-full mb-5 gap-4">
      <KpiCard label="Total" value={total} valueColor="text-gray-900" icon={<TotalIcon />} />
      <KpiCard label="Active" value={active} valueColor="text-gray-900" icon={<ActiveIcon />} />
      <KpiCard label="Inactive" value={inactive} valueColor="text-red-500" icon={<InactiveIcon />} />
    </div>
  )
}

function KpiCard({ label, value, valueColor, icon }: {
  label: string; value: number; valueColor: string; icon: React.ReactNode
}) {
  return (
    <div
      className="flex-1 flex items-center justify-between px-6 py-4 rounded-lg"
      style={{
        background: 'linear-gradient(94.07deg, rgba(227,58,196,0.06) 0%, rgba(7,220,216,0.06) 100%)',
        border: '1px solid #fff',
        boxShadow: '0px 0px 2px 0px #0A0D1214, 0px 0px 2px 0px #00000014',
      }}
    >
      <div>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={`text-3xl font-bold leading-none ${valueColor}`}>{value}</div>
      </div>
      {icon}
    </div>
  )
}

function TotalIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="18" cy="16" r="7" fill="#93c5fd" opacity="0.7" />
      <path d="M4 38c0-7.7 6.3-14 14-14" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M18 24c7.7 0 14 6.3 14 14" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="34" cy="18" r="5.5" fill="#bfdbfe" opacity="0.8" />
      <path d="M23 36c0-6 4.9-11 11-11" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M41 10l-4 7h3.5l-4 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function ActiveIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="16" r="8" fill="#86efac" opacity="0.7" />
      <path d="M8 42c0-9.9 8.1-18 18-18s18 8.1 18 18" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="12" r="7" fill="#dcfce7" />
      <path d="M37 12l2 2 4-4" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InactiveIcon() {
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="16" r="8" fill="#fca5a5" opacity="0.7" />
      <path d="M8 42c0-9.9 8.1-18 18-18s18 8.1 18 18" stroke="#f87171" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="12" r="7" fill="#fee2e2" />
      <path d="M37 9l6 6M43 9l-6 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
