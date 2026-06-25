export interface Group {
  id: string
  name: string
  memberCount: number
  description: string
  tenantId: string
}

export const mockGroups: Group[] = [
  { id: 'GRP-001', name: 'Underwriting', memberCount: 3, description: 'Underwriting department users', tenantId: 'TENANT-HC' },
  { id: 'GRP-002', name: 'Claims Department', memberCount: 4, description: 'Claims processing department', tenantId: 'TENANT-HC' },
  { id: 'GRP-003', name: 'All Access', memberCount: 1, description: 'Full platform access group', tenantId: 'TENANT-HC' },
]
