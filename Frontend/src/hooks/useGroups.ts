import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../api/groups';
import type { CreateGroupRequest, UpdateGroupInfoRequest, ScreenPermissionSaveDto } from '../types/Group';

export function useGroupList(params: {
  search?: string; status?: string; sortBy?: string;
  sortOrder?: string; page?: number; pageSize?: number;
}) {
  return useQuery({
    queryKey: ['groups', params],
    queryFn: () => groupsApi.list(params),
    staleTime: 30_000,
  });
}

export function useGroupDetail(id: number) {
  return useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateGroupRequest) => groupsApi.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups'] }),
  });
}

export function useUpdateGroupInfo(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdateGroupInfoRequest) => groupsApi.updateInfo(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useSyncMembers(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberIds: number[]) => groupsApi.syncMembers(id, memberIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group', id] }),
  });
}

export function useSavePermissions(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissions: ScreenPermissionSaveDto[]) => groupsApi.savePermissions(id, permissions),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group', id] }),
  });
}
