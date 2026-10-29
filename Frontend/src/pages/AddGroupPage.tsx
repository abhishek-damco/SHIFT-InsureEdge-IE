// US-002: Add new group — 3-panel form: Group Info + Members + Permission Matrix
// VR-001..VR-004: inline validation before submit
// BR-001: GroupCode previewed on create and authoritatively assigned by backend
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import GroupInformationPanel, { type GroupInfoValues } from '../components/GroupForm/GroupInformationPanel';
import GroupMembersPanel from '../components/GroupForm/GroupMembersPanel';
import { validateGroupInfo } from '../components/GroupForm/groupValidation';
import { InfoTooltip, LeaveConfirmModal, GROUP_RIGHTS_TOOLTIP } from '../components/GroupForm/GroupFormParts';
import PermissionMatrix, { PERMISSION_KEYS } from '../components/PermissionMatrix/PermissionMatrix';
import { useCreateGroup } from '../hooks/useGroups';
import { authApi } from '../api/auth';
import { groupsApi } from '../api/groups';
import type { ScreenPermissionSaveDto, ScreenPermissionDto } from '../types/Group';

export default function AddGroupPage() {
  const navigate = useNavigate();
  const createGroup = useCreateGroup();

  const [info, setInfo] = useState<GroupInfoValues>({
    groupName: '', groupLeader: 0, groupEmailId: '',
    groupDesc: '', status: 'Active',
  });
  const [infoErrors, setInfoErrors] = useState<Partial<Record<keyof GroupInfoValues, string>>>({});
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [permissions, setPermissions] = useState<ScreenPermissionSaveDto[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  const { data: nextCode } = useQuery({
    queryKey: ['groups', 'next-code'],
    queryFn: () => groupsApi.getNextCode(),
  });

  // Fetch all screens and convert to ScreenPermissionDto[] (all permissions default false)
  const { data: allScreens = [] } = useQuery<ScreenPermissionDto[]>({
    queryKey: ['screens'],
    queryFn: async () => {
      const items = await groupsApi.getScreens();
      return items.map(s => ({
        screenId: s.screenId,
        screenCode: s.screenCode,
        screenName: s.screenName,
        moduleId: s.moduleId,
        moduleName: s.moduleName,
        isViewPermission: false,
        isCreatePermission: false,
        isEditPermission: false,
        isDuplicatePermission: false,
        isUploadPermission: false,
        isDownloadPermission: false,
        isViewSensitiveInfo: false,
        isAccessSensitiveDoc: false,
        isApproveReject: false,
      }));
    },
  });

  const validate = (): boolean => {
    const errs = validateGroupInfo(info);
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInfoChange = (field: keyof GroupInfoValues, value: string | number | boolean) => {
    setInfo(prev => ({ ...prev, [field]: value }));
    // Validation is submit-driven. Clear a previous message while the user edits,
    // then validate the current value only when Save is clicked again.
    setInfoErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // QA UGM-18: only warn on Cancel when something has been entered.
  const isDirty = !!(info.groupName.trim() || info.groupLeader || info.groupEmailId.trim() || info.groupDesc.trim()
    || info.status !== 'Active' || memberIds.length
    || permissions.some(p => PERMISSION_KEYS.some(k => p[k])));

  const handleCancel = () => {
    if (isDirty) setConfirmCancel(true);
    else navigate('/groups');
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);
    try {
      const result = await createGroup.mutateAsync({
        groupName: info.groupName.trim(),
        groupLeader: info.groupLeader,
        groupEmailId: info.groupEmailId.trim(),
        groupDesc: info.groupDesc.trim(),
        isDepartment: false,
        isInactive: info.status === 'Inactive',
        memberIds,
        permissions,
      });
      navigate(`/groups/${result.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: string[]; message?: string; title?: string } } };
      const detail = e.response?.data?.errors?.join(', ')
        ?? e.response?.data?.message
        ?? e.response?.data?.title
        ?? 'Failed to create group.';
      setSubmitError(detail);
    }
  };

  return (
    <div className="app-page" style={{ padding: 9 }}>
      <div style={{ marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#252a31' }}>Add User Group</h1>
        <div style={{ marginTop: 7, fontSize: 9, color: '#7b8491' }}>
          User Group Management <span style={{ color: '#252a31' }}>/ Add User Group</span>
        </div>
      </div>

      {submitError && (
        <div style={{ background: '#fee2e2', color: 'var(--color-danger)', padding: '12px 16px',
          borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
          {submitError}
        </div>
      )}

      <div className="app-section-grid add-group-top-grid">
        <GroupInformationPanel
          values={info}
          onChange={handleInfoChange}
          errors={infoErrors}
          users={users}
          groupCode={nextCode?.groupCode}
          showStatus
        />
        <GroupMembersPanel
          selectedIds={memberIds}
          users={users}
          onChange={setMemberIds}
        />
      </div>

      <div className="card" style={{ padding: 13, border: '1px solid #d9dde4', borderRadius: 6, boxShadow: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Group Rights</h3>
          <InfoTooltip text={GROUP_RIGHTS_TOOLTIP} />
        </div>
        <p style={{ margin: '0 0 13px', fontSize: 11, color: '#252a31' }}>
          You can grant access to the system module and their sub-module for the user group
        </p>
        <PermissionMatrix
          permissions={allScreens}
          onChange={setPermissions}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={createGroup.isPending}
        >
          {createGroup.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {confirmCancel && (
        <LeaveConfirmModal
          message="Are you sure you want to navigate out of User Group Creation screen? Your data may not be saved."
          onStay={() => setConfirmCancel(false)}
          onLeave={() => navigate('/groups')}
        />
      )}
    </div>
  );
}



