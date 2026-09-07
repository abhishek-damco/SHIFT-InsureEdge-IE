// US-002/US-004: Group Information panel — Name, Code (read-only), Email, Leader, Desc, Status
import type { UserSelectDto } from '../../types/User';

export interface GroupInfoValues {
  groupName: string;
  groupLeader: number;
  groupEmailId: string;
  groupDesc: string;
  status: 'Active' | 'Inactive';
}

interface Props {
  values: GroupInfoValues;
  onChange: (field: keyof GroupInfoValues, value: string | number | boolean) => void;
  errors: Partial<Record<keyof GroupInfoValues, string>>;
  users: UserSelectDto[];
  groupCode?: string;
  showStatus?: boolean;
  readOnly?: boolean;
}

export default function GroupInformationPanel({
  values, onChange, errors, users, groupCode, showStatus = false, readOnly
}: Props) {
  return (
    <div className="card" style={{ padding: 13, border: '1px solid #d9dde4', borderRadius: 6, boxShadow: 'none' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>User Group Information</h3>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 33, padding: '0 9px', marginBottom: 13,
        background: '#e4faf2', borderRadius: 2,
        boxSizing: 'border-box', gap: 16,
      }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#006b3c' }}>
          Group ID - {groupCode ?? '----'}
        </span>
        <span style={{ fontSize: 8, color: '#111827', whiteSpace: 'nowrap' }}>Auto Generated</span>
      </div>

      {showStatus && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#252a31' }}>Status:</span>
          <button
            type="button"
            role="switch"
            aria-label="Group status"
            aria-checked={values.status === 'Active'}
            onClick={() => onChange('status', values.status === 'Active' ? 'Inactive' : 'Active')}
            disabled={readOnly}
            style={{
              position: 'relative', display: 'inline-flex', width: 36, height: 19,
              borderRadius: 999, border: 'none', cursor: readOnly ? 'not-allowed' : 'pointer',
              background: values.status === 'Active' ? '#1769aa' : '#d1d5db',
              transition: 'background 0.2s', padding: 0, flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: values.status === 'Active' ? 19 : 2,
              width: 15, height: 15, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
            }} />
          </button>
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11 }}><span style={{ color: '#dc2626' }}>*</span> Group Name</label>
        <input
          value={values.groupName}
          onChange={e => onChange('groupName', e.target.value)}
          className={errors.groupName ? 'error' : ''}
          maxLength={200}
          disabled={readOnly}
          style={{ height: 27, padding: '5px 9px', borderRadius: 2, fontSize: 11, background: '#f8f9fc' }}
        />
        {errors.groupName && <div className="error-msg">{errors.groupName}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 13 }}>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11 }}>Group Email ID</label>
          <input
            type="email"
            value={values.groupEmailId}
            onChange={e => onChange('groupEmailId', e.target.value)}
            className={errors.groupEmailId ? 'error' : ''}
            disabled={readOnly}
            style={{ height: 27, padding: '5px 9px', borderRadius: 2, fontSize: 11, background: '#f8f9fc' }}
          />
          {errors.groupEmailId && <div className="error-msg">{errors.groupEmailId}</div>}
        </div>

        <div className="form-group" style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11 }}><span style={{ color: '#dc2626' }}>*</span> Group Leader</label>
          <select
            value={values.groupLeader || ''}
            onChange={e => onChange('groupLeader', Number(e.target.value))}
            className={errors.groupLeader ? 'error' : ''}
            disabled={readOnly}
            style={{ height: 27, padding: '4px 9px', borderRadius: 2, fontSize: 11, background: '#f8f9fc' }}
          >
            <option value="">— Select Leader —</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
            ))}
          </select>
          {errors.groupLeader && <div className="error-msg">{errors.groupLeader}</div>}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11 }}>Group Description</label>
        <textarea
          value={values.groupDesc}
          onChange={e => onChange('groupDesc', e.target.value)}
          className={errors.groupDesc ? 'error' : ''}
          maxLength={500}
          disabled={readOnly}
          style={{ height: 53, padding: '6px 9px', borderRadius: 2, fontSize: 11, background: '#f8f9fc', resize: 'vertical' }}
        />
        {errors.groupDesc && <div className="error-msg">{errors.groupDesc}</div>}
      </div>

    </div>
  );
}
