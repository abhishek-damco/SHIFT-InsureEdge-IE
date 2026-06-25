import { useState } from 'react'
import { ChevronRight, Plus, Users, Search } from 'lucide-react'
import { mockGroups } from '../data/mockGroups'
import { mockUsers } from '../data/mockUsers'
import { useAuth } from '../context/AuthContext'

interface GroupsPageProps {
  onBack: () => void
}

export default function GroupsPage({ onBack }: GroupsPageProps) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const tenantGroups = mockGroups.filter(g => g.tenantId === user?.tenantId)
  const filtered = tenantGroups.filter(g =>
    !search || g.name.toLowerCase().includes(search.toLowerCase())
  )

  const groupMembers = selectedGroup
    ? mockUsers.filter(u => u.groups.some(g => g === selectedGroup))
    : []

  return (
    <div className="p-6">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <button onClick={onBack} className="text-blue-600 hover:underline">User Management</button>
        <ChevronRight size={12} />
        <span>User Groups</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-gray-800">User Groups Management</h1>
        <button className="btn-primary">
          <Plus size={14} />
          Add Group
        </button>
      </div>

      <div className="flex gap-5">
        {/* Groups list */}
        <div className="w-72 flex-shrink-0">
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="space-y-2">
            {filtered.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(selectedGroup === g.name ? null : g.name)}
                className={`w-full text-left p-3 border rounded transition-colors ${
                  selectedGroup === g.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {g.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.memberCount} member{g.memberCount !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1.5">{g.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Group detail / members */}
        <div className="flex-1 bg-white border border-gray-200 rounded">
          {!selectedGroup ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Users size={32} className="mb-2 opacity-40" />
              <div className="text-sm">Select a group to view members</div>
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-800">{selectedGroup}</div>
                <div className="text-xs text-gray-500 mt-0.5">{groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}</div>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">User</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">User ID</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Email</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No members in this group.</td>
                    </tr>
                  ) : (
                    groupMembers.map(u => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                              {u.firstName[0]}{u.lastName[0]}
                            </div>
                            <span className="text-sm text-gray-800">{u.firstName} {u.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-500">{u.userId}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-500 max-w-[180px] truncate">{u.email}</td>
                        <td className="px-4 py-2.5">
                          <span className={u.status === 'Active' ? 'status-active' : 'status-inactive'}>
                            • {u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
