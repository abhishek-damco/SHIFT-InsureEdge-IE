import React from 'react';

interface Props {
  total: number;
  activeCount: number;
  inactiveCount: number;
  variant?: 'default' | 'user-groups';
}

const colors = {
  total: '#0B5AA0',
  active: '#009765',
  inactive: '#d82929',
};

export default function StatCards({ total, activeCount, inactiveCount, variant = 'default' }: Props) {
  const userGroups = variant === 'user-groups';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: userGroups ? 12 : 14, marginBottom: userGroups ? 14 : 26 }}>
      <Card label="Total" value={total} tone={colors.total} icon={<TotalIcon color={colors.total} compact={userGroups} />} compact={userGroups} />
      <Card label="Active" value={activeCount} tone={colors.active} icon={<ActiveIcon color={colors.active} compact={userGroups} />} compact={userGroups} />
      <Card label="Inactive" value={inactiveCount} tone={colors.inactive} icon={<InactiveIcon color={colors.inactive} compact={userGroups} />} compact={userGroups} />
    </div>
  );
}

function Card({ label, value, icon, tone, compact }: { label: string; value: number; icon: React.ReactNode; tone: string; compact: boolean }) {
  return (
    <div style={{
      minHeight: compact ? 64 : 80,
      height: compact ? 64 : undefined,
      boxSizing: 'border-box',
      background: 'linear-gradient(90deg, #fff8ff 0%, #f2ffff 100%)',
      borderRadius: 6,
      padding: compact ? '8px 12px' : '14px 12px',
      border: '1px solid #e4eaf0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: compact ? 11 : 13, color: '#111827', marginBottom: compact ? 3 : 4, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: compact ? 24 : 30, fontWeight: 800, color: tone, lineHeight: 1 }}>{value}</div>
      </div>
      <div style={{ color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
    </div>
  );
}

function TotalIcon({ color, compact }: { color: string; compact: boolean }) {
  if (compact) return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="18" cy="10" r="3.7" stroke={color} strokeWidth="1.8" />
      <circle cx="9.2" cy="12.5" r="3" stroke={color} strokeWidth="1.8" />
      <circle cx="26.8" cy="12.5" r="3" stroke={color} strokeWidth="1.8" />
      <path d="M11.5 27c0-5.5 2.7-9 6.5-9s6.5 3.5 6.5 9M2.8 27c0-4.8 2.5-8 6-8 1.2 0 2.3.4 3.2 1.1M33.2 27c0-4.8-2.5-8-6-8-1.2 0-2.3.4-3.2 1.1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="19" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M8 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 29c4.8.4 8 4.4 8 10" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M35 9v8M31 13h8" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function ActiveIcon({ color, compact }: { color: string; compact: boolean }) {
  if (compact) return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="14" cy="10.5" r="4" stroke={color} strokeWidth="1.8" />
      <circle cx="24.5" cy="12.5" r="3" stroke={color} strokeWidth="1.8" />
      <path d="M6 27c0-5.7 3.3-9.5 8-9.5 3.6 0 6.4 2.2 7.5 5.8M22.2 19.2c.7-.2 1.4-.3 2.2-.3 2.2 0 4.1 1 5.3 2.8M22.5 27l3 3 6-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="18" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <path d="M7 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M28 34l5 5 9-11" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InactiveIcon({ color, compact }: { color: string; compact: boolean }) {
  if (compact) return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <circle cx="15" cy="9.8" r="3.8" stroke={color} strokeWidth="1.8" />
      <circle cx="24.8" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <path d="M6.5 26.5c0-5.4 3.2-9 8.2-9 3.4 0 6 1.7 7.3 4.6M23 18.7c.6-.2 1.3-.3 2-.3 2.4 0 4.4 1.2 5.5 3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="27.5" cy="27.5" r="5.5" stroke={color} strokeWidth="1.8" />
      <path d="M23.7 23.7l7.6 7.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="18" cy="17" r="6" stroke={color} strokeWidth="2.4" />
      <circle cx="32" cy="18" r="4.5" stroke={color} strokeWidth="2.4" />
      <path d="M7 40c0-7 5-12 11-12s11 5 11 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M29 32l10 10M39 32 29 42" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
