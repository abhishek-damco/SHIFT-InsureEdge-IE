import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import type { MyProfile } from '../../types/CurrentUser';

interface Props { children: React.ReactNode; }

const claimActions = [
  { label: 'Claims Dashboard', to: '/claims' },
  { label: 'Claims Inquiry', to: '/claims/enquiry' },
  { label: 'FNOL Registration', to: '/claims/fnol' },
  { label: 'Bulk Claim Upload', to: '/claims/bulk-upload' },
  { label: 'Claims Authority', to: '/claims/authority' },
  { label: 'Adjuster Management', to: '/claims/adjusters' },
  { label: 'Payee List', to: '/claims/payees' },
  { label: 'Catastrophic Events', to: '/claims/catastrophic-events' },
  { label: 'Claim Letter Template', to: '/claims/letter-template' },
  { label: 'Claims Master Configuration', to: '/claims/master-configuration' },
];

const railIcons = ['grid', 'doc', 'money', 'user', 'group', 'flow', 'list', 'chart', 'building'];

const moduleNav = [
  { label: 'Dashboard', icon: 'grid', to: '/dashboard' },
  { label: 'Client Management', icon: 'building', to: '/client-management' },
  { label: 'Quotes & Policies', icon: 'doc', to: '/quotes-policies/individual/nb-quotes' },
  { label: 'Claims', icon: 'money', to: '/claims' },
  { label: 'User Management', icon: 'user', to: '/users' },
  { label: 'User Groups Management', icon: 'group', to: '/groups' },
  { label: 'Distribution Management', icon: 'flow', to: '/distribution' },
  { label: 'Billing Management', icon: 'list', to: '/billing' },
  { label: 'Report Management', icon: 'chart', to: '/reports' },
];

function MenuIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
}

function RailIcon({ type }: { type: string }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 };
  if (type === 'money') return <svg {...common}><path d="M3 6h18v12H3z"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/></svg>;
  if (type === 'doc') return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4"/><path d="M8 12h8M8 16h6"/></svg>;
  if (type === 'user') return <svg {...common}><path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4"/><circle cx="12" cy="8" r="3"/><path d="M19 8v6M16 11h6"/></svg>;
  if (type === 'group') return <svg {...common}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2"/><path d="M3 19c0-2.8 2.4-5 6-5s6 2.2 6 5"/><path d="M15 15c2.5.2 4 1.8 4 4"/></svg>;
  if (type === 'flow') return <svg {...common}><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12H5v5M12 12h7v5"/></svg>;
  if (type === 'list') return <svg {...common}><path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>;
  if (type === 'chart') return <svg {...common}><path d="M4 19V5M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/></svg>;
  if (type === 'building') return <svg {...common}><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 9h1m5 0h1M9 13h1m5 0h1M9 17h1m5 0h1"/></svg>;
  return <svg {...common}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>;
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
}

function CollapseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h11M4 12h11M4 18h11"/><path d="m20 8-4 4 4 4"/></svg>;
}

function ChevronRight() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isClaims = location.pathname.startsWith('/claims');
  const isClaimWorkflow = location.pathname.startsWith('/claims/workflow');
  const isClientMgmt = location.pathname.startsWith('/client-management');
  const isDistribution = location.pathname.startsWith('/distribution');
  const isBilling = location.pathname.startsWith('/billing');
  const isQuotesPolicies = location.pathname.startsWith('/quotes-policies');
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [claimsPanelOpen, setClaimsPanelOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  useEffect(() => {
    authApi.getMyProfile()
      .then(p => {
        console.log('Profile loaded:', p);
        setProfile(p);
      })
      .catch(err => {
        console.error('Failed to load profile:', err);
        // Fallback: create minimal profile from available data
        setProfile({
          id: 0,
          userCode: null,
          status: null,
          firstName: 'User',
          middleName: null,
          lastName: '',
          email: '',
          roleName: 'User',
          dateOfBirth: null,
          gender: null,
          bio: null,
          passwordUpdatedOn: null,
          lastLoginOn: null,
        });
      });
  }, []);

  const handleLogout = () => {
    // Don't wait for logout API - just redirect immediately
    // The backend will clear the cookie, but we don't need to wait for it
    authApi.logout().catch(err => console.error('Logout API error:', err));
    // Immediately redirect to clear frontend state and show login page
    window.location.href = '/login';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', color: '#101828' }}>
      <header style={{ height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid #dde3ea', background: '#f7f8fb', padding: '0 18px', gap: 14 }}>
        <button aria-label="Menu" onClick={() => setModuleMenuOpen(true)} style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, background: 'transparent', color: '#111827' }}><MenuIcon /></button>
        <div style={{ width: 180, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRight: '1px solid #edf0f4' }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>HUDSON</span>
          <span style={{ margin: '0 5px', fontSize: 14 }}>BAILEY</span>
        </div>
        <div style={{ position: 'relative', width: 372 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#5b6472', lineHeight: 1 }}><SearchIcon /></span>
          <input placeholder="Looks for Module, Forms, Users, Group..." style={{ height: 34, paddingLeft: 38, fontSize: 13, borderRadius: 3, borderColor: '#aeb7c2', background: '#fff' }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#d9f2ff', color: '#0B5AA0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
            {profile ? `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase() : 'HC'}
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 700, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Hi, {profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'User'} ...
            </div>
            <div style={{ fontSize: 12, color: '#475569' }}>
              {profile?.roleName || 'User'}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setUserMenuOpen(o => !o)} title="User menu" style={{ padding: '4px 6px', background: 'transparent', color: '#111827', cursor: 'pointer' }}>▾</button>
            {userMenuOpen && (
              <>
                <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
                <div style={{ position: 'absolute', right: 0, top: 32, zIndex: 1000, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 140, padding: '4px 0' }}>
                  <button onClick={() => { setUserMenuOpen(false); navigate('/my-profile'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#374151' }}>My Profile</button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>Sign Out</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {moduleMenuOpen && <ModuleDrawer currentPath={location.pathname} onClose={() => setModuleMenuOpen(false)} />}

      <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <aside style={{ width: 52, background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 10 }}>
          {railIcons.map(type => {
            const target = type === 'money' ? '/claims' : type === 'group' ? '/groups' : type === 'building' ? '/client-management' : type === 'user' ? '/users' : type === 'flow' ? '/distribution' : type === 'list' ? '/billing' : type === 'doc' ? '/quotes-policies/individual/nb-quotes' : undefined;
            const isUsers = location.pathname.startsWith('/users');
            const active = (isClaims && type === 'money') || (location.pathname.startsWith('/groups') && type === 'group') || (isClientMgmt && type === 'building') || (isUsers && type === 'user') || (isDistribution && type === 'flow') || (isBilling && type === 'list') || (isQuotesPolicies && type === 'doc');
            return <button key={type} onClick={() => target && navigate(target)} style={{ width: 34, height: 34, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, background: active ? '#0B5AA0' : 'transparent', color: active ? '#fff' : '#2f3742' }}><RailIcon type={type} /></button>;
          })}
        </aside>

        {isClaims && !isClaimWorkflow && claimsPanelOpen && <ClaimsActionPanel currentPath={location.pathname} onCollapse={() => setClaimsPanelOpen(false)} />}
        {isClaims && !isClaimWorkflow && !claimsPanelOpen && (
          <button
            onClick={() => setClaimsPanelOpen(true)}
            title="Expand actions"
            style={{ width: 28, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', borderLeft: '4px solid #0B5AA0', color: '#111827', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12 }}
          >
            <CollapseIcon />
          </button>
        )}

        <main style={{ flex: 1, overflow: 'auto', background: '#fff', borderLeft: isClaims && !isClaimWorkflow && claimsPanelOpen ? '4px solid #0B5AA0' : 'none' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function ClaimsActionPanel({ currentPath, onCollapse }: { currentPath: string; onCollapse: () => void }) {
  return (
    <aside style={{ width: 236, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', boxShadow: '2px 0 6px rgba(15,23,42,0.06)', padding: '12px 14px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>Actions</h2>
        <button title="Collapse" onClick={onCollapse} style={{ width: 28, height: 28, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: '#1f2937' }}><CollapseIcon /></button>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {claimActions.map(action => {
          const active = currentPath === action.to || (action.to === '/claims' && currentPath === '/claims');
          return <Link key={action.label} to={action.to} style={{ display: 'block', padding: '9px 14px', minHeight: 34, borderRadius: 4, background: active ? '#d5effb' : '#e9eef3', color: active ? '#0065a8' : '#000', fontSize: 13, fontWeight: active ? 700 : 500, textDecoration: 'none' }}>{action.label}</Link>;
        })}
      </nav>
      <div style={{ marginTop: 30 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Recent Activity</h2>
        {[0, 1, 2, 3, 4].map((_, index) => (
          <div key={index} style={{ height: 66, border: '1px solid #d9dee5', borderRadius: 4, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
            <div style={{ lineHeight: 1.55 }}>
              <div style={{ fontSize: 13, color: '#000' }}>{index % 2 === 0 ? 'Created' : 'Task Created'}</div>
              <div style={{ fontSize: 13, color: '#000' }}>Claim Task Created</div>
            </div>
            <ChevronRight />
          </div>
        ))}
      </div>
    </aside>
  );
}

function ModuleDrawer({ currentPath, onClose }: { currentPath: string; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 900 }} />
      <aside style={{ position: 'fixed', top: 0, bottom: 0, left: 0, width: 230, zIndex: 901, background: '#fff', boxShadow: '3px 0 14px rgba(15,23,42,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px' }}>
          <button onClick={onClose} aria-label="Close menu" style={{ width: 30, height: 30, padding: 0, background: 'transparent', color: '#111827', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CollapseIcon /></button>
        </div>
        <nav style={{ padding: '0 10px', display: 'grid', gap: 8 }}>
          {moduleNav.map(item => {
            const active = currentPath.startsWith(item.to) || (item.to === '/reports' && false);
            return <Link key={item.label} to={item.to} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 34, padding: '0 10px', borderRadius: 3, background: active ? '#0B5AA0' : item.label === 'Report Management' ? '#e6f6ff' : 'transparent', color: active ? '#fff' : item.label === 'Report Management' ? '#2c678b' : '#374151', fontSize: 14, fontWeight: active ? 700 : 500, textDecoration: 'none' }}>
              <RailIcon type={item.icon} />
              <span>{item.label}</span>
            </Link>;
          })}
        </nav>
        <div style={{ marginTop: 'auto', padding: '18px 32px 24px', textAlign: 'center', color: '#6b7280', fontSize: 10, borderTop: '1px solid #edf0f4' }}>
          <div>Powered by</div>
          <div style={{ marginTop: 5, fontWeight: 800, color: '#4b5563', fontSize: 12 }}>DAMCO</div>
          <div style={{ fontSize: 8 }}>Solutions for Success Always</div>
        </div>
      </aside>
    </>
  );
}



