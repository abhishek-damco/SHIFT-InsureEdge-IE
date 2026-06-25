export interface AuditEntry {
  id: string
  actor: string
  actorId: string
  targetUser: string
  targetUserId: string
  action: 'USER_CREATED' | 'USER_EDITED' | 'PASSWORD_RESET' | 'PERMISSION_CHANGED' | 'USER_VIEWED'
  tenantId: string
  timestamp: string
  details?: string
}

const actionLabels: Record<AuditEntry['action'], string> = {
  USER_CREATED: 'User Created',
  USER_EDITED: 'User Edited',
  PASSWORD_RESET: 'Password Reset',
  PERMISSION_CHANGED: 'Permission Changed',
  USER_VIEWED: 'User Viewed',
}

export { actionLabels }

export const mockAuditLog: AuditEntry[] = [
  {
    id: 'AUD-001',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'ashka kl',
    targetUserId: 'IE0004',
    action: 'USER_CREATED',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T09:12:44Z',
    details: 'User record created with group: Underwriting',
  },
  {
    id: 'AUD-002',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'Lavan ffffty',
    targetUserId: 'IE0005',
    action: 'USER_CREATED',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T09:35:10Z',
    details: 'User record created with group: Claims',
  },
  {
    id: 'AUD-003',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'Manideep Da Underwriter',
    targetUserId: 'IE0002',
    action: 'PERMISSION_CHANGED',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T10:05:22Z',
    details: 'Module: Quotes & Policies — View granted',
  },
  {
    id: 'AUD-004',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'Mani Da ClaimsAdj',
    targetUserId: 'IE0003',
    action: 'PASSWORD_RESET',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T10:48:59Z',
    details: 'Password reset email dispatched',
  },
  {
    id: 'AUD-005',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'Laviii fff',
    targetUserId: 'IE0006',
    action: 'USER_EDITED',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T11:22:07Z',
    details: 'Address section updated',
  },
  {
    id: 'AUD-006',
    actor: 'Hudson Client Admin',
    actorId: 'IE0001',
    targetUser: 'ashka kl',
    targetUserId: 'IE0004',
    action: 'USER_VIEWED',
    tenantId: 'TENANT-HC',
    timestamp: '2026-06-24T11:58:31Z',
  },
]
