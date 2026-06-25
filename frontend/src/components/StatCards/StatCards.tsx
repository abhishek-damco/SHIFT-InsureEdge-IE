import React from 'react';

interface Props { total: number; activeCount: number; inactiveCount: number; }

export default function StatCards({ total, activeCount, inactiveCount }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
      <Card label="Total" value={total} icon={<TotalIcon />} iconBg="#e0edfa" />
      <Card label="Active" value={activeCount} icon={<ActiveIcon />} iconBg="#dcfce7" />
      <Card label="Inactive" value={inactiveCount} icon={<InactiveIcon />} iconBg="#fee2e2" />
    </div>
  );
}

function Card({ label, value, icon, iconBg }: { label: string; value: number; icon: React.ReactNode; iconBg: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '18px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
    </div>
  );
}

function TotalIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="#0B5AA0" strokeWidth="1.8"/>
      <circle cx="16" cy="8" r="2.5" stroke="#0B5AA0" strokeWidth="1.8"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#0B5AA0" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 14c2.21 0 4 1.79 4 4" stroke="#0B5AA0" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function ActiveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="#16a34a" strokeWidth="1.8"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 11l2 2 4-4" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function InactiveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="3" stroke="#dc2626" strokeWidth="1.8"/>
      <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M17 11l4 4m0-4l-4 4" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
