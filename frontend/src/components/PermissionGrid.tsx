import { useState, Fragment } from 'react'
import { Search, Plus, Minus } from 'lucide-react'
import type { PermissionModule, PermissionRow, PermissionType } from '../data/types'

const PERMISSION_COLS: { key: PermissionType; label: string }[] = [
  { key: 'view',               label: 'View' },
  { key: 'add',                label: 'Add' },
  { key: 'edit',               label: 'Edit' },
  { key: 'clone',              label: 'Clone' },
  { key: 'upload',             label: 'Upload' },
  { key: 'download',           label: 'Download' },
  { key: 'sensitiveData',      label: 'Sensitive Data' },
  { key: 'sensitiveDocuments', label: 'Sensitive Documents' },
  { key: 'approveReject',      label: 'Approve/Reject' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0"
      style={{ background: checked ? '#0B5AA0' : '#d1d5db' }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </div>
  )
}

interface PermissionGridProps {
  modules: PermissionModule[]
  onChange: (modules: PermissionModule[]) => void
  readOnly?: boolean
}

function setAllRowPermissions(row: PermissionRow, value: boolean): PermissionRow {
  const updated = { ...row, permissions: { ...row.permissions } }
  for (const key of Object.keys(updated.permissions) as PermissionType[]) {
    if (updated.permissions[key] !== null) updated.permissions[key] = value
  }
  return updated
}

export default function PermissionGrid({ modules, onChange, readOnly: gridReadOnly = false }: PermissionGridProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')

  const updateModule = (moduleId: string, updater: (m: PermissionModule) => PermissionModule) => {
    onChange(modules.map(m => (m.id === moduleId ? updater(m) : m)))
  }

  const handleReadOnly = (moduleId: string, val: boolean) => {
    updateModule(moduleId, m => ({
      ...m,
      readOnly: val,
      allAccess: val ? false : m.allAccess,
      rows: m.rows.map(r => ({
        ...r,
        permissions: {
          view: val ? true : false,
          add: val ? false : r.permissions.add,
          edit: val ? false : r.permissions.edit,
          clone: val ? false : r.permissions.clone,
          upload: val ? false : r.permissions.upload,
          download: val ? false : r.permissions.download,
          sensitiveData: val ? false : r.permissions.sensitiveData,
          sensitiveDocuments: val ? false : r.permissions.sensitiveDocuments,
          approveReject: val ? false : r.permissions.approveReject,
        },
      })),
    }))
  }

  const handleAllAccess = (moduleId: string, val: boolean) => {
    updateModule(moduleId, m => ({
      ...m,
      allAccess: val,
      readOnly: val ? false : m.readOnly,
      rows: m.rows.map(r => setAllRowPermissions(r, val)),
    }))
  }

  const handleCell = (moduleId: string, rowId: string, perm: PermissionType, val: boolean) => {
    updateModule(moduleId, m => ({
      ...m,
      rows: m.rows.map(r =>
        r.id === rowId ? { ...r, permissions: { ...r.permissions, [perm]: val } } : r
      ),
    }))
  }

  const filtered = search
    ? modules
        .map(m => ({
          ...m,
          rows: m.rows.filter(r =>
            r.label.toLowerCase().includes(search.toLowerCase()) ||
            (r.group ?? '').toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter(m => m.rows.length > 0 || m.name.toLowerCase().includes(search.toLowerCase()))
    : modules

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-800">User - Rights</h2>
            <span
              className="w-4 h-4 rounded-full border border-gray-400 text-gray-400 flex items-center justify-center text-xs cursor-help leading-none"
              title="Grant access to system modules and sub-modules"
            >i</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">You can grant access to the system module and their sub-module for the user</p>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Enter module or feature name"
            className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg w-64 focus:outline-none"
            style={{ outlineColor: '#0B5AA0' }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(mod => {
          const isOpen = !collapsed[mod.id]

          // Group rows by their group label in order
          const groups: { label: string; rows: PermissionRow[] }[] = []
          for (const r of mod.rows) {
            const g = r.group ?? mod.name
            const existing = groups.find(x => x.label === g)
            if (existing) existing.rows.push(r)
            else groups.push({ label: g, rows: [r] })
          }

          return (
            <div key={mod.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Module header row */}
              <div className="flex items-center justify-between px-4 py-3 bg-white">
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [mod.id]: !c[mod.id] }))}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
                    {isOpen
                      ? <Minus size={11} className="text-gray-500" />
                      : <Plus size={11} className="text-gray-500" />}
                  </span>
                  {mod.name}
                </button>
                {!gridReadOnly && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Read Only</span>
                      <Toggle checked={mod.readOnly} onChange={v => handleReadOnly(mod.id, v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">All Access</span>
                      <Toggle checked={mod.allAccess} onChange={v => handleAllAccess(mod.id, v)} />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded permission table */}
              {isOpen && (
                <div className="border-t border-gray-100 overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: '760px' }}>
                    <tbody>
                      {groups.map((group, gi) => (
                        <Fragment key={`g-${gi}`}>
                          {/* Sub-module header — first column = group name, rest = permission labels */}
                          <tr className="bg-gray-50 border-t border-gray-200">
                            <td className="px-4 py-2 text-xs font-semibold text-gray-700 w-48 border-r border-gray-200">
                              {group.label}
                            </td>
                            {PERMISSION_COLS.map(col => (
                              <td
                                key={col.key}
                                className="px-2 py-2 text-center text-xs font-semibold text-gray-600"
                                style={{ minWidth: '80px' }}
                              >
                                {col.label}
                              </td>
                            ))}
                          </tr>

                          {/* Screen rows */}
                          {group.rows.map(r => (
                            <tr key={r.id} className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors">
                              <td className="px-4 py-2 text-xs text-gray-700 w-48 border-r border-gray-100">
                                {r.label}
                              </td>
                              {PERMISSION_COLS.map(col => {
                                const val = r.permissions[col.key]
                                return (
                                  <td
                                    key={col.key}
                                    className="px-2 py-2 text-center"
                                    style={{ minWidth: '80px' }}
                                  >
                                    {gridReadOnly ? (
                                      val === true ? (
                                        /* green check circle */
                                        <div className="w-6 h-6 mx-auto rounded-full flex items-center justify-center" style={{ background: '#16a34a' }}>
                                          <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                          </svg>
                                        </div>
                                      ) : (
                                        /* grey disabled circle */
                                        <div className="w-6 h-6 mx-auto rounded-full border-2 border-gray-300 flex items-center justify-center bg-white">
                                          <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                                            <circle cx="6" cy="6" r="5" stroke="#9ca3af" strokeWidth="1.5" />
                                            <line x1="3" y1="9" x2="9" y2="3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                                          </svg>
                                        </div>
                                      )
                                    ) : val === null ? (
                                      <div className="w-4 h-4 mx-auto bg-gray-100 rounded border border-gray-200" />
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={val as boolean}
                                        onChange={e => handleCell(mod.id, r.id, col.key, e.target.checked)}
                                        className="w-4 h-4 cursor-pointer rounded"
                                        style={{ accentColor: '#0B5AA0' }}
                                      />
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
