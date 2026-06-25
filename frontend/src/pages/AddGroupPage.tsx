import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import GroupInformationPanel, { type GroupInfoValues } from '../components/GroupForm/GroupInformationPanel';
import GroupMembersPanel from '../components/GroupForm/GroupMembersPanel';
import PermissionMatrix from '../components/PermissionMatrix/PermissionMatrix';
import { useCreateGroup } from '../hooks/useGroups';
import { authApi } from '../api/auth';
import { groupsApi } from '../api/groups';
import type { ScreenPermissionSaveDto, ScreenPermissionDto } from '../types/Group';

export default function AddGroupPage() {
  const navigate = useNavigate();
  const createGroup = useCreateGroup();

  const [info, setInfo] = useState<GroupInfoValues>({
    groupName: '', groupLeader: 0, groupEmailId: '',
    groupDesc: '', isDepartment: false, status: 'Active',
  });
  const [infoErrors, setInfoErrors] = useState<Partial<Record<keyof GroupInfoValues, string>>>({});
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [permissions, setPermissions] = useState<ScreenPermissionSaveDto[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

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
    const errs: typeof infoErrors = {};
    if (!info.groupName.trim()) errs.groupName = 'Group Name is required.';
    else if (info.groupName.length > 200) errs.groupName = 'Max 200 characters.';
    if (!info.groupLeader) errs.groupLeader = 'Group Leader is required.';
    if (info.groupEmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.groupEmailId))
      errs.groupEmailId = 'Enter a valid email address.';
    if (info.groupDesc.length > 500) errs.groupDesc = 'Max 500 characters.';
    setInfoErrors(errs);
    return Object.keys(errs).length === 0;
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
        isDepartment: info.isDepartment,
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
    <div>
      <div className="page-header">
        <h1 className="page-title">New Group</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate('/groups')}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={createGroup.isPending}>
            {createGroup.isPending ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>

      {submitError && (
        <div style={{ background: '#fee2e2', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
          {submitError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <GroupInformationPanel
          values={info}
          onChange={(field, value) => setInfo(prev => ({ ...prev, [field]: value }))}
          errors={infoErrors}
          users={users}
        />
        <GroupMembersPanel
          selectedIds={memberIds}
          users={users}
          onChange={setMemberIds}
        />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Permissions</h3>
        <PermissionMatrix
          permissions={allScreens}
          onChange={setPermissions}
        />
      </div>
    </div>
  );
}
