// US-005/US-010/US-011: Member picker — multi-select from active users
// BR-005: Full-replace semantics; the UI always sends the complete intended list.
// BR-015: Display all members regardless of profile image.
import { useState, useMemo } from 'react';
import type { UserSelectDto } from '../../types/User';

interface Props {
  selectedIds: number[];
  users: UserSelectDto[];
  onChange: (ids: number[]) => void;
  readOnly?: boolean;
}

export default function GroupMembersPanel({ selectedIds, users, onChange, readOnly }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);

  const toggle = (id: number) => {
    if (readOnly) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onChange(next);
  };

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <div className="card" style={{ padding: '12px 13px', border: '1px solid #d9dde4', borderRadius: 6, boxShadow: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          {selectedIds.length} Group Members
        </h3>
      </div>

      {/* Selected members as chips */}
      {selectedUsers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {selectedUsers.map(u => (
            <span key={u.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--color-primary-light)', color: 'var(--color-primary)',
              borderRadius: 99, padding: '4px 10px', fontSize: 13, fontWeight: 500,
            }}>
              <span style={{
                background: 'var(--color-primary)', color: '#fff', borderRadius: '50%',
                width: 20, height: 20, display: 'inline-flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 700,
              }}>
                {u.initials}
              </span>
              {u.fullName}
              {!readOnly && (
                <button
                  onClick={() => toggle(u.id)}
                  style={{ background: 'none', padding: 0, color: 'var(--color-primary)',
                    fontSize: 14, lineHeight: 1, width: 'auto' }}
                  type="button"
                  title={`Remove ${u.fullName}`}
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!readOnly && (
        <>
          <div style={{ position: 'relative', marginBottom: search.trim() ? 8 : 0 }}>
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#687386"
              strokeWidth="1.8"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Enter member name you are looking for"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ height: 27, padding: '5px 9px 5px 31px', borderRadius: 2, fontSize: 11, background: '#f8f9fc' }}
            />
          </div>
          {search.trim() && <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-gray-200)', borderRadius: 2 }}>
            {filtered.length === 0 && (
              <div style={{ padding: 16, color: 'var(--color-gray-500)', textAlign: 'center' }}>
                No users found.
              </div>
            )}
            {filtered.map(u => {
              const selected = selectedIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggle(u.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', cursor: 'pointer',
                    background: selected ? 'var(--color-primary-light)' : '#fff',
                    borderBottom: '1px solid var(--color-gray-100)',
                  }}
                >
                  <input type="checkbox" checked={selected} readOnly style={{ width: 15, height: 15 }} />
                  <div style={{
                    background: selected ? 'var(--color-primary)' : 'var(--color-gray-300)',
                    color: '#fff', borderRadius: '50%', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {u.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>{u.email}</div>
                  </div>
                </div>
              );
            })}
          </div>}
        </>
      )}
    </div>
  );
}
