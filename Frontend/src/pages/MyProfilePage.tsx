import { useEffect, useState } from 'react'
import { authApi } from '../api/auth'
import { passwordResetApi } from '../api/passwordReset'
import type { MyProfile } from '../types/CurrentUser'

const GENDERS = ['Male', 'Female', 'Non-Binary', 'Prefer not to say']

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 13,
  border: '1px solid #d1d5db', borderRadius: 4,
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#374151', fontWeight: 500, marginBottom: 5 }}>{children}</div>
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: value ? '#111827' : '#d1d5db' }}>{value || '-'}</div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
  boxShadow: '0 1px 3px rgba(15,23,42,0.07)',
}

const row2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }

type Tab = 'personal' | 'security'

interface EditState {
  firstName: string; middleName: string; lastName: string
  dateOfBirth: string; gender: string; bio: string
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('personal')

  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resetError, setResetError] = useState('')

  function loadProfile() {
    setLoading(true)
    authApi.getMyProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(loadProfile, [])

  function startEdit() {
    if (!profile) return
    setEdit({
      firstName: profile.firstName, middleName: profile.middleName ?? '',
      lastName: profile.lastName,
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender: profile.gender ?? '', bio: profile.bio ?? '',
    })
    setEditing(true)
    setSaveError('')
  }

  function cancelEdit() { setEditing(false); setEdit(null); setSaveError('') }

  function setF<K extends keyof EditState>(key: K, value: EditState[K]) {
    setEdit(f => f ? { ...f, [key]: value } : f)
  }

  async function saveProfile() {
    if (!edit) return
    setSaving(true); setSaveError('')
    try {
      await authApi.updateMyProfile({
        firstName: edit.firstName, middleName: edit.middleName || undefined,
        lastName: edit.lastName,
        dateOfBirth: edit.dateOfBirth || undefined,
        gender: edit.gender || undefined,
        bio: edit.bio || undefined,
      })
      cancelEdit()
      loadProfile()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setSaveError(message || 'Failed to save')
    } finally { setSaving(false) }
  }

  async function handleUpdatePassword() {
    if (!profile) return
    setResetState('sending'); setResetError('')
    try {
      await passwordResetApi.request(profile.email)
      setResetState('sent')
    } catch {
      setResetState('error')
      setResetError('Failed to send reset email. Please try again.')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, fontSize: 13, color: '#9ca3af' }}>
      Loading...
    </div>
  )
  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, fontSize: 13, color: '#9ca3af' }}>
      Profile not found
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f5f7fa' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 20px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
          {profile.firstName} {profile.middleName} {profile.lastName} - Profile
        </div>
      </div>

      <div style={{ flex: 1, padding: 16 }}>
        {/* Identity header */}
        <div style={{ ...card, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', background: '#d9f2ff', color: '#0B5AA0',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16,
            }}>
              {(profile.firstName[0] ?? '') + (profile.lastName[0] ?? '')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{profile.firstName} {profile.lastName}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
                  padding: '2px 10px', borderRadius: 999,
                  background: profile.status === 'Active' ? '#d7f7e4' : '#ffe9e9',
                  color: profile.status === 'Active' ? '#008c55' : '#d82929',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: profile.status === 'Active' ? '#008c55' : '#d82929' }} />
                  {profile.status ?? 'Active'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{profile.roleName ?? '-'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
            <div>{profile.email}</div>
            {profile.lastLoginOn && <div style={{ marginTop: 2 }}>Last Login on: {formatDateTime(profile.lastLoginOn)}</div>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
          {(['personal', 'security'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 10px',
                fontSize: 13, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#0B5AA0' : '#6b7280',
                borderBottom: tab === t ? '2px solid #0B5AA0' : '2px solid transparent',
                textTransform: 'capitalize',
              }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'personal' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Personal Information</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Manage your personal details</div>
              </div>
              {editing ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={cancelEdit} className="btn-secondary" style={{ fontSize: 12, padding: '5px 14px' }}>Cancel</button>
                  <button type="button" onClick={saveProfile} disabled={saving} className="btn-primary" style={{ fontSize: 12, padding: '5px 14px' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={startEdit}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, display: 'flex', alignItems: 'center' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#0B5AA0')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                  <PencilIcon />
                </button>
              )}
            </div>

            {saveError && (
              <div style={{ margin: '12px 20px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
                {saveError}
              </div>
            )}

            <div style={{ padding: 20 }}>
              {editing && edit ? (
                <>
                  <div style={row2}>
                    <div><Label>First Name</Label><input value={edit.firstName} onChange={e => setF('firstName', e.target.value)} style={inputStyle} /></div>
                    <div><Label>Middle / Initial Name</Label><input value={edit.middleName} onChange={e => setF('middleName', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={row2}>
                    <div><Label>Last Name</Label><input value={edit.lastName} onChange={e => setF('lastName', e.target.value)} style={inputStyle} /></div>
                    <div><Label>Date Of Birth</Label><input type="date" value={edit.dateOfBirth} onChange={e => setF('dateOfBirth', e.target.value)} style={inputStyle} /></div>
                  </div>
                  <div style={row2}>
                    <div>
                      <Label>Gender</Label>
                      <select value={edit.gender} onChange={e => setF('gender', e.target.value)} style={inputStyle}>
                        <option value="">Select</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label>Personal Bio / About Me</Label>
                    <textarea value={edit.bio} onChange={e => setF('bio', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={row2}>
                    <Field label="First Name" value={profile.firstName} />
                    <Field label="Middle / Initial Name" value={profile.middleName} />
                  </div>
                  <div style={row2}>
                    <Field label="Last Name" value={profile.lastName} />
                    <Field label="Date Of Birth" value={profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : undefined} />
                  </div>
                  <div style={row2}>
                    <Field label="Gender" value={profile.gender} />
                  </div>
                  <Field label="Personal Bio / About Me" value={profile.bio} />
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div style={card}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Password Management</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Update/Change your password</div>
            </div>
            <div style={{ padding: 20, maxWidth: 480 }}>
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>🔒</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Password</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {profile.passwordUpdatedOn ? `Last Updated on ${formatDate(profile.passwordUpdatedOn)}` : 'Never updated'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    For enhanced account security, please update your password every 3 months.
                  </div>
                  <button type="button" onClick={handleUpdatePassword} disabled={resetState === 'sending'}
                    className="btn-secondary" style={{ marginTop: 10, fontSize: 12, padding: '6px 16px' }}>
                    {resetState === 'sending' ? 'Sending...' : 'Update/Change Password'}
                  </button>
                  {resetState === 'sent' && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#15803d' }}>
                      A password reset link has been sent to {profile.email}. Check your inbox to continue.
                    </div>
                  )}
                  {resetState === 'error' && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{resetError}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}
