import React from 'react';

interface Props { total: number; activeCount: number; inactiveCount: number; }

const colors = {
  total: '#0B5AA0',
  active: '#009765',
  inactive: '#d82929',
};

export default function StatCards({ total, activeCount, inactiveCount }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 26 }}>
      <Card label="Total" value={total} tone={colors.total} icon={<TotalIcon color={colors.total} />} />
      <Card label="Active" value={activeCount} tone={colors.active} icon={<ActiveIcon color={colors.active} />} />
      <Card label="Inactive" value={inactiveCount} tone={colors.inactive} icon={<InactiveIcon color={colors.inactive} />} />
    </div>
  );
}

function Card({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div style={{
      minHeight: 80,
      background: 'linear-gradient(90deg, #fff8ff 0%, #f2ffff 100%)',
      borderRadius: 6,
      padding: '14px 12px',
      border: '1px solid #e4eaf0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#111827', marginBottom: 4, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: tone, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
    </div>
  );
}

function TotalIcon({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="19" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M8 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 29c4.8.4 8 4.4 8 10" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M35 9v8M31 13h8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ActiveIcon({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="18" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <path d="M7 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M28 34l5 5 9-11" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InactiveIcon({ color }: { color: string }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="18" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M7 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M29 32l10 10M39 32 29 42" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
