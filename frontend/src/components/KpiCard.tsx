interface KpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accent?: string
}

export default function KpiCard({ label, value, icon, accent = '#0B5AA0' }: KpiCardProps) {
  return (
    <div
      className="flex-1 rounded-lg px-5 py-4 flex items-center justify-between min-w-[220px]"
      style={{
        background: 'linear-gradient(94.07deg, rgba(227, 58, 196, 0.06) 0%, rgba(7, 220, 216, 0.06) 100%)',
        border: '1px solid #fff',
        boxShadow: '0px 0px 2px 0px #0A0D1214, 0px 0px 8px 0px #00000010',
        borderRadius: '8px',
      }}
    >
      <div>
        <div className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wide">{label}</div>
        <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
      </div>
      <div className="opacity-75">{icon}</div>
    </div>
  )
}
