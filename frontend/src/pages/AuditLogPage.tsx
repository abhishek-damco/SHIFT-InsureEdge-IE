import { useState } from 'react'
import { ChevronRight, Search, Shield } from 'lucide-react'
import { mockAuditLog, actionLabels } from '../data/mockAudit'
import type { AuditEntry } from '../data/mockAudit'
import { useAuth } from '../context/AuthContext'

const ACTION_COLORS: Record<AuditEntry['action'], string> = {
  USER_CREATED: 'bg-green-100 text-green-700',
  USER_EDITED: 'bg-blue-100 text-blue-700',
  PASSWORD_RESET: 'bg-orange-100 text-orange-700',
  PERMISSION_CHANGED: 'bg-purple-100 text-purple-700',
  USER_VIEWED: 'bg-gray-100 text-gray-600',
}

interface AuditLogPageProps {
  onBack: () => void
}

export default function AuditLogPage({ onBack }: AuditLogPageProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<AuditEntry['action'] | ''>('')

  // Tenant-scoped: only show entries for the current tenant (Epic 4)
  const tenantEntries = mockAuditLog.filter(e => e.tenantId === user?.tenantId)

  const filtered = tenantEntries.filter(e => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      e.actor.toLowerCase().includes(q) ||
      e.targetUser.toLowerCase().includes(q) ||
      e.targetUserId.toLowerCase().includes(q) ||
      actionLabels[e.action].toLowerCase().includes(q)
    const matchAction = !filterAction || e.action === filterAction
    return matchSearch && matchAction
  })

  const formatTs = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <button onClick={onBack} className="text-blue-600 hover:underline">User Management</button>
        <ChevronRight size={12} />
        <span>Audit Log</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">Audit Log</h1>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded px-2 py-0.5 text-xs">
            <Shield size={12} />
            Tenant: {user?.tenantName}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Immutable â€” entries cannot be edited or deleted
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actor, user, action..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded w-64 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value as AuditEntry['action'] | '')}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">All Actions</option>
          {Object.entries(actionLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-gray-500 flex items-center">
          {filtered.length} entries
        </div>
      </div>

      {/* Audit table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Audit ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Timestamp</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Actor</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Target User</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Action</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No audit entries match your filter.
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-xs font-mono text-gray-500">{entry.id}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{formatTs(entry.timestamp)}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800">{entry.actor}</div>
                    <div className="text-xs text-gray-400">{entry.actorId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-blue-600">{entry.targetUser}</div>
                    <div className="text-xs text-gray-400">{entry.targetUserId}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[entry.action]}`}>
                      {actionLabels[entry.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px]">{entry.details ?? 'â€”'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Compliance note */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-400">
        <Shield size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          All entries are tenant-scoped to <strong>{user?.tenantName}</strong> ({user?.tenantId}).
          Entries from other tenants are never exposed. Audit entries are immutable â€” no application-level
          actor can edit or delete them (SEC-REQ-07).
        </span>
      </div>
    </div>
  )
}

