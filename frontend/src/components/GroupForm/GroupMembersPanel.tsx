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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>
          Members <span style={{ color: 'var(--color-gray-500)', fontWeight: 400 }}>({selectedIds.length})</span>
        </h3>
      </div>

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
          <input
            type="text"
            placeholder="Search users to add..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--color-gray-200)', borderRadius: 6 }}>
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
          </div>
        </>
      )}
    </div>
  );
}
