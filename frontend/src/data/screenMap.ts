import type { PermissionModule, PermissionType } from './types'
import { defaultModules } from './mockPermissions'

// Maps frontend row ID → DB screen numeric ID
export const ROW_TO_SCREEN_ID: Record<string, number> = {
  'dash-main': 1,
  'cm-landing': 2,
  'ugm-landing': 3,
  'ugm-add-group': 4,
  'ugm-view-group': 5,
  'um-landing': 6,
  'um-add-user': 7,
  'um-view-user': 8,
  'ipm-landing': 9,
  'acc-ind-landing': 10,
  'acc-ind-summary': 11,
  'acc-bulk-upload': 12,
  'acc-biz-landing': 13,
  'qp-ind-new-biz': 14,
  'qp-ind-endorsement': 15,
  'qp-ind-renewal': 16,
  'qp-ind-policies': 17,
  'qp-biz-new-biz': 18,
  'qp-biz-endorsement': 19,
  'qp-biz-renewal': 20,
  'qp-biz-policies': 21,
  'dm-landing': 22,
  'dm-add-intermediary': 23,
  'dm-view-intermediary': 24,
  'doc-policy-common': 25,
  'doc-claims-common': 26,
  'doc-billing-common': 27,
  'claims-inquiry': 28,
  'claims-fnol': 29,
  'claims-bulk-upload': 30,
  'claims-dashboard': 31,
  'claims-summary': 32,
  'claims-loss-info': 33,
  'claims-review': 34,
  'claims-documents': 35,
  'claims-fin-worksheet': 36,
  'claims-fin-payee': 37,
  'claims-insured-policy': 38,
  'claims-escalation': 39,
  'claims-recovery': 40,
  'claims-referred': 41,
  'claims-litigation': 42,
  'claims-task': 43,
  'claims-timeline': 44,
  'claims-letters': 45,
  'claims-authority': 46,
  'claims-adjuster': 47,
  'claims-catastrophic': 48,
  'claims-master-config': 49,
  'claims-payee-list': 50,
  'claims-letter-template': 51,
  'billing-payments': 52,
  'report-bordereaux-mga': 53,
  'report-claims-mgmt': 54,
  'report-claims-financial': 55,
  'report-loss-exposure': 56,
  'report-compliance': 57,
  'report-reinsurance': 58,
  'report-policy-issuance': 59,
  'report-policy-premium': 60,
  'report-policy-tx-type': 61,
  'report-commissions': 62,
}

// Reverse: DB screen ID → frontend row ID
export const SCREEN_ID_TO_ROW: Record<number, string> = Object.fromEntries(
  Object.entries(ROW_TO_SCREEN_ID).map(([row, id]) => [id, row])
)

// DB column → PermissionType mapping
const DB_COL_TO_PERM: Record<string, PermissionType> = {
  is_view_permission:      'view',
  is_create_permission:    'add',
  is_edit_permission:      'edit',
  is_duplicate_permission: 'clone',
  is_upload_permission:    'upload',
  is_download_permission:  'download',
  is_view_sensitive_info:  'sensitiveData',
  is_access_sensitive_doc: 'sensitiveDocuments',
  is_approve_reject:       'approveReject',
}

// PermissionType → DB column
export const PERM_TO_DB_COL: Record<PermissionType, string> = {
  view:               'is_view_permission',
  add:                'is_create_permission',
  edit:               'is_edit_permission',
  clone:              'is_duplicate_permission',
  upload:             'is_upload_permission',
  download:           'is_download_permission',
  sensitiveData:      'is_view_sensitive_info',
  sensitiveDocuments: 'is_access_sensitive_doc',
  approveReject:      'is_approve_reject',
}

// Convert frontend PermissionModule[] → API permissions array for POST/PUT
export function modulesToApiPermissions(modules: PermissionModule[]) {
  const result: Record<string, unknown>[] = []
  for (const mod of modules) {
    for (const row of mod.rows) {
      const screenId = ROW_TO_SCREEN_ID[row.id]
      if (!screenId) continue
      result.push({
        screen_id:               screenId,
        is_view_permission:      row.permissions.view      === true,
        is_create_permission:    row.permissions.add       === true,
        is_edit_permission:      row.permissions.edit      === true,
        is_duplicate_permission: row.permissions.clone     === true,
        is_upload_permission:    row.permissions.upload    === true,
        is_download_permission:  row.permissions.download  === true,
        is_view_sensitive_info:  row.permissions.sensitiveData      === true,
        is_access_sensitive_doc: row.permissions.sensitiveDocuments === true,
        is_approve_reject:       row.permissions.approveReject      === true,
        all_access:              false,
      })
    }
  }
  return result
}

// DB permission row type (from GET /api/users/:id)
export interface DbPermissionRow {
  screen_id: number
  screen_code: string
  screen_name: string
  module_name: string
  is_view_permission: boolean
  is_create_permission: boolean
  is_edit_permission: boolean
  is_duplicate_permission: boolean
  is_upload_permission: boolean
  is_download_permission: boolean
  is_view_sensitive_info: boolean
  is_access_sensitive_doc: boolean
  is_approve_reject: boolean
  all_access: boolean
}

// Convert API permissions array → frontend PermissionModule[] (for View page)
export function apiPermissionsToModules(dbPerms: DbPermissionRow[]): PermissionModule[] {
  // Build a map of rowId → permissions from DB
  const permMap = new Map<string, Record<PermissionType, boolean | null>>()
  for (const p of dbPerms) {
    const rowId = SCREEN_ID_TO_ROW[Number(p.screen_id)]
    if (!rowId) continue
    permMap.set(rowId, {
      view:               p.is_view_permission,
      add:                p.is_create_permission,
      edit:               p.is_edit_permission,
      clone:              p.is_duplicate_permission,
      upload:             p.is_upload_permission,
      download:           p.is_download_permission,
      sensitiveData:      p.is_view_sensitive_info,
      sensitiveDocuments: p.is_access_sensitive_doc,
      approveReject:      p.is_approve_reject ?? null,
    })
  }

  // Overlay DB permissions onto defaultModules structure
  return defaultModules.map(mod => ({
    ...mod,
    rows: mod.rows.map(row => ({
      ...row,
      permissions: permMap.has(row.id)
        ? permMap.get(row.id)!
        : { view: false, add: false, edit: false, clone: false, upload: false, download: false, sensitiveData: false, sensitiveDocuments: false, approveReject: null },
    })),
  }))
}

// Unused import guard
void DB_COL_TO_PERM
