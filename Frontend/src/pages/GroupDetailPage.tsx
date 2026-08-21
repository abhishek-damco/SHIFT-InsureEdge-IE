// US-003/US-004/US-005/US-006/US-007/US-011/US-012: Group detail — view + inline edit
// All three sections (Info, Members, Rights) are inline-editable; no popups.
// Group Rights always shows ALL screens merged with saved permissions.
import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  useGroupDetail, useUpdateGroupInfo, useSyncMembers, useSavePermissions,
} from '../hooks/useGroups';
import { authApi } from '../api/auth';
import { groupsApi } from '../api/groups';
import { usePermissions } from '../contexts/PermissionContext';
import type { ScreenPermissionSaveDto, ScreenPermissionDto, UpdateGroupInfoRequest } from '../types/Group';
import type { UserSelectDto } from '../types/User';

type AnyMutation<TVar> = { mutateAsync: (vars: TVar) => Promise<unknown>; isPending: boolean };

// ─── Icons ────────────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function InfoLabel({ label }: { label: string }) {
  return <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 3, fontWeight: 500 }}>{label}</div>;
}

function Initials({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, borderRadius: '50%',
      background: '#dbeafe', color: '#1d4ed8',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    }}>{ini}</span>
  );
}

function SectionActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
      <button className="btn-secondary" onClick={onCancel} disabled={saving} style={{ fontSize: 13 }}>Cancel</button>
      <button className="btn-primary" onClick={onSave} disabled={saving} style={{ fontSize: 13 }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

// ─── User Group Information panel ─────────────────────────────────────────────
function InfoPanel({
  group, users, canEdit,
  onSaved,
  updateInfo,
}: {
  group: { groupCode: string; groupName: string; groupEmailId: string | null; groupLeader: number | null; groupLeaderName: string | null; groupDesc: string | null; status: string; isDepartment: boolean };
  users: UserSelectDto[];
  canEdit: boolean;
  onSaved: (msg: string) => void;
  updateInfo: AnyMutation<UpdateGroupInfoRequest>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.groupName);
  const [leader, setLeader] = useState<number>(group.groupLeader ?? 0);
  const [email, setEmail] = useState(group.groupEmailId ?? '');
  const [desc, setDesc] = useState(group.groupDesc ?? '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(group.status as 'Active' | 'Inactive');
  const [errs, setErrs] = useState<Record<string, string>>({});

  const startEdit = () => {
    setName(group.groupName); setLeader(group.groupLeader ?? 0);
    setEmail(group.groupEmailId ?? ''); setDesc(group.groupDesc ?? '');
    setStatus(group.status as 'Active' | 'Inactive'); setErrs({});
    setEditing(true);
  };
  const cancel = () => setEditing(false);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Required.';
    if (!leader) e.leader = 'Required.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email.';
    setErrs(e);
    if (Object.keys(e).length) return;
    try {
      await updateInfo.mutateAsync({ groupName: name.trim(), groupLeader: leader, groupEmailId: email.trim(), groupDesc: desc.trim(), status });
      setEditing(false);
      onSaved('Group information updated.');
    } catch { onSaved('Save failed.'); }
  };

  const leaderUser = users.find(u => u.id === group.groupLeader);

  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: `1px solid ${editing ? '#bfdbfe' : '#e5e7eb'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>User Group Information</span>
        {canEdit && !editing && (
          <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <PencilIcon />
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <div style={{ marginBottom: 18 }}>
              <InfoLabel label="Group ID" />
              <div style={{ fontSize: 14, color: '#111827' }}>{group.groupCode}</div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <InfoLabel label="Status" />
              <span className={`badge badge-${group.status.toLowerCase()}`}>• {group.status}</span>
            </div>
            <div style={{ marginBottom: 18, gridColumn: '1 / -1' }}>
              <InfoLabel label="Group Name" />
              <div style={{ fontSize: 14, color: '#111827' }}>{group.groupName}</div>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <InfoLabel label="Group Email ID" />
            <div style={{ fontSize: 14, color: '#111827' }}>{group.groupEmailId || '–'}</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <InfoLabel label="Group Leader" />
            {leaderUser || group.groupLeaderName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Initials name={leaderUser?.fullName ?? group.groupLeaderName ?? ''} size={26} />
                <span style={{ fontSize: 14, color: '#111827' }}>{leaderUser?.fullName ?? group.groupLeaderName}</span>
              </div>
            ) : <div style={{ fontSize: 14, color: '#9ca3af' }}>–</div>}
          </div>
          <div>
            <InfoLabel label="Group Description" />
            <div style={{ fontSize: 14, color: '#111827' }}>{group.groupDesc || '–'}</div>
          </div>
        </>
      ) : (
        <>
          <div className="form-group">
            <label>Group Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} maxLength={200} className={errs.name ? 'error' : ''} />
            {errs.name && <div className="error-msg">{errs.name}</div>}
          </div>
          <div className="form-group">
            <label>Group Leader <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={leader || ''} onChange={e => setLeader(Number(e.target.value))} className={errs.leader ? 'error' : ''}>
              <option value="">— Select Leader —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
            {errs.leader && <div className="error-msg">{errs.leader}</div>}
          </div>
          <div className="form-group">
            <label>Group Email ID</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="group@example.com" className={errs.email ? 'error' : ''} />
            {errs.email && <div className="error-msg">{errs.email}</div>}
          </div>
          <div className="form-group">
            <label>Group Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} maxLength={500} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <SectionActions onCancel={cancel} onSave={save} saving={updateInfo.isPending} />
        </>
      )}
    </div>
  );
}

// ─── Group Members panel ──────────────────────────────────────────────────────
function MembersPanel({
  memberIds, memberDetails, users, canEdit, onSaved, syncMembers,
}: {
  memberIds: number[];
  memberDetails: { userId: number; fullName: string; email: string }[];
  users: UserSelectDto[];
  canEdit: boolean;
  onSaved: (msg: string) => void;
  syncMembers: AnyMutation<number[]>;
}) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>(memberIds);
  const [search, setSearch] = useState('');

  const startEdit = () => { setSelected(memberIds); setSearch(''); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = async () => {
    try {
      await syncMembers.mutateAsync(selected);
      setEditing(false);
      onSaved('Members updated.');
    } catch { onSaved('Save failed.'); }
  };

  const toggle = (id: number) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: `1px solid ${editing ? '#bfdbfe' : '#e5e7eb'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
          {editing ? 'Edit Group Members' : `${memberIds.length} Group Member${memberIds.length !== 1 ? 's' : ''}`}
        </span>
        {canEdit && !editing && (
          <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <PencilIcon />
          </button>
        )}
      </div>

      {/* Search box — always visible */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>⌕</span>
        <input
          placeholder={editing ? 'Search users to add…' : 'Enter member name you are looking for'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 28, fontSize: 13, width: '100%' }}
        />
      </div>

      {!editing ? (
        /* View mode — member list */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {memberDetails.length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>No members in this group.</div>
          )}
          {memberDetails
            .filter(m => !search || m.fullName.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
            .map(m => (
              <div key={m.userId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8, background: '#f9fafb', border: '1px solid #f3f4f6',
              }}>
                <Initials name={m.fullName} size={36} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{m.fullName}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{m.email}</div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        /* Edit mode — checkable user list */
        <>
          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
            {filteredUsers.map(u => {
              const checked = selected.includes(u.id);
              return (
                <div key={u.id} onClick={() => toggle(u.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', cursor: 'pointer',
                  background: checked ? '#eff6ff' : '#fff',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  <input type="checkbox" checked={checked} readOnly style={{ width: 15, height: 15, accentColor: '#0B5AA0' }} />
                  <Initials name={u.fullName} size={28} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{u.fullName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <SectionActions onCancel={cancel} onSave={save} saving={syncMembers.isPending} />
        </>
      )}
    </div>
  );
}

// ─── Group Rights panel ───────────────────────────────────────────────────────
const PERM_COLS: { key: keyof ScreenPermissionSaveDto; label: string }[] = [
  { key: 'isViewPermission',      label: 'View' },
  { key: 'isCreatePermission',    label: 'Add' },
  { key: 'isEditPermission',      label: 'Edit' },
  { key: 'isDuplicatePermission', label: 'Clone' },
  { key: 'isUploadPermission',    label: 'Upload' },
  { key: 'isDownloadPermission',  label: 'Download' },
  { key: 'isViewSensitiveInfo',   label: 'Sensitive Data' },
  { key: 'isAccessSensitiveDoc',  label: 'Sensitive Docs' },
  { key: 'isApproveReject',       label: 'Approve/Reject' },
];

function makeReadOnly(id: number): ScreenPermissionSaveDto {
  return { screenId: id, isViewPermission: true, isCreatePermission: false, isEditPermission: false, isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false, isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false };
}
function makeAllAccess(id: number): ScreenPermissionSaveDto {
  return { screenId: id, isViewPermission: true, isCreatePermission: true, isEditPermission: true, isDuplicatePermission: true, isUploadPermission: true, isDownloadPermission: true, isViewSensitiveInfo: true, isAccessSensitiveDoc: true, isApproveReject: true };
}

function GroupRightsPanel({
  allScreens, savedPermissions, editing, canEdit,
  onStartEdit, onSave, onCancel, saving,
}: {
  allScreens: ScreenPermissionDto[];           // full list from /api/groups/screens
  savedPermissions: ScreenPermissionDto[];     // what's saved for this group
  editing: boolean;
  canEdit: boolean;
  onStartEdit: () => void;
  onSave: (p: ScreenPermissionSaveDto[]) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [openMods, setOpenMods] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  // Merge: start from allScreens, overlay saved permissions
  const mergedPermissions = useMemo<ScreenPermissionDto[]>(() => {
    const savedMap = new Map(savedPermissions.map(p => [p.screenId, p]));
    return allScreens.map(s => savedMap.get(s.screenId) ?? { ...s, isViewPermission: false, isCreatePermission: false, isEditPermission: false, isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false, isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false });
  }, [allScreens, savedPermissions]);

  const [draft, setDraft] = useState<Record<number, ScreenPermissionSaveDto>>(() => {
    const m: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of mergedPermissions) m[p.screenId] = { ...p };
    return m;
  });

  // Sync draft when base data changes
  const mergedKey = mergedPermissions.map(p => `${p.screenId}:${p.isViewPermission}`).join(',');
  const [lastKey, setLastKey] = useState(mergedKey);
  if (mergedKey !== lastKey && !editing) {
    const m: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of mergedPermissions) m[p.screenId] = { ...p };
    setDraft(m);
    setLastKey(mergedKey);
  }

  const startEdit = () => {
    // Reset draft to current merged state
    const m: Record<number, ScreenPermissionSaveDto> = {};
    for (const p of mergedPermissions) m[p.screenId] = { ...p };
    setDraft(m);
    onStartEdit();
  };

  const hasAnyPerm = (p: ScreenPermissionDto) =>
    p.isViewPermission || p.isCreatePermission || p.isEditPermission ||
    p.isDuplicatePermission || p.isUploadPermission || p.isDownloadPermission ||
    p.isViewSensitiveInfo || p.isAccessSensitiveDoc || p.isApproveReject;

  const filtered = useMemo(() => {
    // In view mode only show screens where at least one permission is granted
    const base = editing ? mergedPermissions : mergedPermissions.filter(hasAnyPerm);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter(p => p.screenName.toLowerCase().includes(q) || p.moduleName.toLowerCase().includes(q));
  }, [mergedPermissions, search, editing]);

  const modules = useMemo(() => {
    const m = new Map<string, ScreenPermissionDto[]>();
    for (const p of filtered) {
      if (!m.has(p.moduleName)) m.set(p.moduleName, []);
      m.get(p.moduleName)!.push(p);
    }
    return m;
  }, [filtered]);

  const update = (screenId: number, key: keyof ScreenPermissionSaveDto, val: boolean) =>
    setDraft(d => ({ ...d, [screenId]: { ...d[screenId], [key]: val } }));

  const applyToModule = (screenIds: number[], builder: (id: number) => ScreenPermissionSaveDto) =>
    setDraft(d => { const n = { ...d }; for (const id of screenIds) n[id] = builder(id); return n; });

  return (
    <div style={{
      background: '#fff', borderRadius: 8, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      border: `1px solid ${editing ? '#bfdbfe' : '#e5e7eb'}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Group Rights</span>
            <span title="Grant access to system modules and sub-modules" style={{ cursor: 'help', color: '#9ca3af', fontSize: 14 }}>ⓘ</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            You can grant access to the system module and their sub-module for the user group
          </div>
        </div>
        {canEdit && !editing && (
          <button onClick={startEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}>
            <PencilIcon />
          </button>
        )}
      </div>

      {/* Search + save/cancel in edit mode */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Enter module or feature name"
            style={{ paddingLeft: 28, fontSize: 13, width: '100%' }} />
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={onCancel} disabled={saving} style={{ fontSize: 13 }}>Cancel</button>
            <button className="btn-primary" onClick={() => onSave(Object.values(draft))} disabled={saving} style={{ fontSize: 13 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Module accordions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from(modules.entries()).map(([modName, screens]) => {
          const open = openMods.has(modName);
          return (
            <div key={modName} style={{ border: `1px solid ${editing ? '#bfdbfe' : '#e5e7eb'}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Module header */}
              <div style={{ display: 'flex', alignItems: 'center', background: open ? '#eff6ff' : '#fff', userSelect: 'none' }}>
                <div
                  onClick={() => setOpenMods(prev => { const n = new Set(prev); n.has(modName) ? n.delete(modName) : n.add(modName); return n; })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', flex: 1, cursor: 'pointer' }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2px solid #93c5fd', color: '#1d4ed8', fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>{open ? '−' : '+'}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1d4ed8' }}>{modName}</span>
                </div>
                {editing && (
                  <div style={{ display: 'flex', gap: 6, padding: '0 14px' }}>
                    <button type="button"
                      onClick={() => applyToModule(screens.map(s => s.screenId), makeReadOnly)}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                      Read Only
                    </button>
                    <button type="button"
                      onClick={() => applyToModule(screens.map(s => s.screenId), makeAllAccess)}
                      style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, border: '1px solid #0B5AA0', background: '#0B5AA0', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                      All Access
                    </button>
                  </div>
                )}
              </div>

              {/* Screen rows */}
              {open && (
                <div style={{ overflowX: 'auto', borderTop: '1px solid #e5e7eb' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '7px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#6b7280', minWidth: 180, paddingLeft: 28 }}>Screen</th>
                        {PERM_COLS.map(c => (
                          <th key={c.key} style={{ padding: '7px 6px', textAlign: 'center', fontWeight: 600, fontSize: 11, color: '#6b7280', minWidth: 65, whiteSpace: 'nowrap' }}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {screens.map(s => (
                        <tr key={s.screenId} style={{ borderTop: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '7px 12px 7px 28px', color: '#374151' }}>{s.screenName}</td>
                          {PERM_COLS.map(col => {
                            const val = editing
                              ? (draft[s.screenId]?.[col.key] as boolean ?? false)
                              : (s[col.key as keyof ScreenPermissionDto] as boolean);
                            return (
                              <td key={col.key} style={{ textAlign: 'center', padding: '7px 4px' }}>
                                {editing ? (
                                  <input type="checkbox" checked={val}
                                    onChange={e => update(s.screenId, col.key, e.target.checked)}
                                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0B5AA0' }} />
                                ) : (
                                  <span style={{ fontSize: 15, color: val ? '#16a34a' : '#d1d5db' }}>{val ? '✓' : '–'}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {modules.size === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
            {allScreens.length === 0
              ? 'Loading screens…'
              : !editing && !search
              ? 'No permissions assigned to this group.'
              : 'No screens match your search.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const navigate = useNavigate();
  const perms = usePermissions('USERGROUPPAGE');

  const { data: group, isLoading, isError } = useGroupDetail(groupId);
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => authApi.getUsers() });
  const { data: rawScreens = [] } = useQuery({ queryKey: ['screens'], queryFn: () => groupsApi.getScreens() });

  const updateInfo = useUpdateGroupInfo(groupId);
  const syncMembers = useSyncMembers(groupId);
  const savePerms = useSavePermissions(groupId);

  const [editingPerms, setEditingPerms] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // Convert raw screen list to ScreenPermissionDto shape (all false by default)
  const allScreens = useMemo<ScreenPermissionDto[]>(() =>
    rawScreens.map(s => ({
      screenId: s.screenId, screenCode: s.screenCode, screenName: s.screenName,
      moduleId: s.moduleId, moduleName: s.moduleName,
      isViewPermission: false, isCreatePermission: false, isEditPermission: false,
      isDuplicatePermission: false, isUploadPermission: false, isDownloadPermission: false,
      isViewSensitiveInfo: false, isAccessSensitiveDoc: false, isApproveReject: false,
    })), [rawScreens]);

  const handleSavePerms = async (p: ScreenPermissionSaveDto[]) => {
    try {
      // Only save rows where at least one permission is true (skip all-false rows)
      const nonEmpty = p.filter(r => Object.entries(r).some(([k, v]) => k !== 'screenId' && v === true));
      await savePerms.mutateAsync(nonEmpty);
      setEditingPerms(false);
      showToast('Permissions updated.');
    } catch { showToast('Save failed.', false); }
  };

  if (isLoading) return <div style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 12 }}><span className="spinner" /> Loading…</div>;
  if (isError || !group) return <div style={{ padding: 32, color: '#dc2626' }}>Group not found.</div>;

  return (
    <div className="app-page">
      {/* Breadcrumb + title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
          <span style={{ cursor: 'pointer', color: '#0B5AA0' }} onClick={() => navigate('/groups')}>User Group Management</span>
          {' / '}View Group
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{group.groupName}</h1>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '7px 16px' }} onClick={() => navigate('/groups')}>Back</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#dcfce7' : '#fee2e2',
          color: toast.ok ? '#16a34a' : '#dc2626',
          padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', fontSize: 14, fontWeight: 500,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Top row */}
      <div className="app-section-grid">
        <InfoPanel
          group={group}
          users={users}
          canEdit={perms.edit}
          onSaved={showToast}
          updateInfo={updateInfo}
        />
        <MembersPanel
          memberIds={group.members.map(m => m.userId)}
          memberDetails={group.members}
          users={users}
          canEdit={perms.edit}
          onSaved={showToast}
          syncMembers={syncMembers}
        />
      </div>

      {/* Group Rights */}
      <GroupRightsPanel
        allScreens={allScreens}
        savedPermissions={group.permissions}
        editing={editingPerms}
        canEdit={perms.edit}
        onStartEdit={() => setEditingPerms(true)}
        onSave={handleSavePerms}
        onCancel={() => setEditingPerms(false)}
        saving={savePerms.isPending}
      />
    </div>
  );
}



