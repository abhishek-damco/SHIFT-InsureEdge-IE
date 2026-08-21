// US-002/US-004: Group Information panel — Name, Code (read-only), Email, Leader, Desc, IsDept, Status
import type { UserSelectDto } from '../../types/User';

export interface GroupInfoValues {
  groupName: string;
  groupLeader: number;
  groupEmailId: string;
  groupDesc: string;
  isDepartment: boolean;
  status: 'Active' | 'Inactive';
}

interface Props {
  values: GroupInfoValues;
  onChange: (field: keyof GroupInfoValues, value: string | number | boolean) => void;
  errors: Partial<Record<keyof GroupInfoValues, string>>;
  users: UserSelectDto[];
  groupCode?: string;   // shown read-only when editing
  readOnly?: boolean;
}

export default function GroupInformationPanel({
  values, onChange, errors, users, groupCode, readOnly
}: Props) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>Group Information</h3>

      {groupCode && (
        <div className="form-group">
          <label>Group Code</label>
          <input value={groupCode} readOnly disabled style={{ background: 'var(--color-gray-100)' }} />
        </div>
      )}

      <div className="form-group">
        <label>Group Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <input
          value={values.groupName}
          onChange={e => onChange('groupName', e.target.value)}
          className={errors.groupName ? 'error' : ''}
          maxLength={200}
          disabled={readOnly}
          placeholder="Enter group name"
        />
        {errors.groupName && <div className="error-msg">{errors.groupName}</div>}
      </div>

      <div className="form-group">
        <label>Group Leader <span style={{ color: 'var(--color-danger)' }}>*</span></label>
        <select
          value={values.groupLeader || ''}
          onChange={e => onChange('groupLeader', Number(e.target.value))}
          className={errors.groupLeader ? 'error' : ''}
          disabled={readOnly}
        >
          <option value="">— Select Leader —</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
          ))}
        </select>
        {errors.groupLeader && <div className="error-msg">{errors.groupLeader}</div>}
      </div>

      <div className="form-group">
        <label>Group Email</label>
        <input
          type="email"
          value={values.groupEmailId}
          onChange={e => onChange('groupEmailId', e.target.value)}
          className={errors.groupEmailId ? 'error' : ''}
          placeholder="group@example.com"
          disabled={readOnly}
        />
        {errors.groupEmailId && <div className="error-msg">{errors.groupEmailId}</div>}
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={values.groupDesc}
          onChange={e => onChange('groupDesc', e.target.value)}
          className={errors.groupDesc ? 'error' : ''}
          rows={3}
          maxLength={500}
          disabled={readOnly}
          placeholder="Optional group description"
          style={{ resize: 'vertical' }}
        />
        {errors.groupDesc && <div className="error-msg">{errors.groupDesc}</div>}
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={values.isDepartment}
            onChange={e => onChange('isDepartment', e.target.checked)}
            disabled={readOnly}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: 14, fontWeight: 400 }}>Is Department Group</span>
        </label>

        {groupCode && (  /* status toggle only on edit, not create */
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 0 }}>
            <input
              type="checkbox"
              checked={values.status === 'Inactive'}
              onChange={e => onChange('status', e.target.checked ? 'Inactive' : 'Active')}
              disabled={readOnly}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 14, fontWeight: 400 }}>Mark as Inactive</span>
          </label>
        )}
      </div>
    </div>
  );
}
