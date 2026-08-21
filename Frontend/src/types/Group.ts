// US-001/US-003 data shapes matching backend DTOs exactly

export interface GroupListDto {
  id: number;
  groupCode: string;
  groupName: string;
  groupEmailId: string | null;
  groupLeaderName: string | null;
  memberCount: number;        // BR-007: always live count from backend
  createdByName: string;
  createdOn: string;          // ISO 8601; formatted as MM-DD-YYYY in UI
  groupDesc: string | null;
  status: 'Active' | 'Inactive';
}

export interface GroupListResponse {
  items: GroupListDto[];
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export interface MemberDto {
  userId: number;
  fullName: string;
  email: string;
  initials: string;
}

export interface ScreenPermissionDto {
  screenId: number;
  screenCode: string;
  screenName: string;
  moduleId: number;
  moduleName: string;
  isViewPermission: boolean;
  isCreatePermission: boolean;
  isEditPermission: boolean;
  isDuplicatePermission: boolean;
  isUploadPermission: boolean;
  isDownloadPermission: boolean;
  isViewSensitiveInfo: boolean;
  isAccessSensitiveDoc: boolean;
  isApproveReject: boolean;
}

export interface GroupDetailDto {
  id: number;
  groupCode: string;
  groupName: string;
  groupEmailId: string | null;
  groupLeader: number | null;
  groupLeaderName: string | null;
  groupDesc: string | null;
  status: 'Active' | 'Inactive';
  isDepartment: boolean;
  createdOn: string;
  createdByName: string;
  members: MemberDto[];
  permissions: ScreenPermissionDto[];
}

export interface CreateGroupRequest {
  groupName: string;
  groupLeader: number;
  groupEmailId: string;
  groupDesc: string;
  isDepartment: boolean;
  isInactive: boolean;
  memberIds: number[];
  permissions: ScreenPermissionSaveDto[];
}

export interface UpdateGroupInfoRequest {
  groupName: string;
  groupLeader: number;
  groupEmailId: string;
  groupDesc: string;
  status: 'Active' | 'Inactive';
}

export interface ScreenPermissionSaveDto {
  screenId: number;
  isViewPermission: boolean;
  isCreatePermission: boolean;
  isEditPermission: boolean;
  isDuplicatePermission: boolean;
  isUploadPermission: boolean;
  isDownloadPermission: boolean;
  isViewSensitiveInfo: boolean;
  isAccessSensitiveDoc: boolean;
  isApproveReject: boolean;
}
