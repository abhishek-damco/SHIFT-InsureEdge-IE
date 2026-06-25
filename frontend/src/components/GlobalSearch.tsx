import { useState, useRef, useEffect } from 'react'
import { Search, Users, GitBranch, X } from 'lucide-react'
import { mockUsers } from '../data/mockUsers'
import { mockGroups } from '../data/mockGroups'
import type { User } from '../data/types'
import { useAuth } from '../context/AuthContext'

interface GlobalSearchProps {
  onViewUser: (user: User) => void
  onViewGroup: () => void
}

export default function GlobalSearch({ onViewUser, onViewGroup }: GlobalSearchProps) {
  const { user: authUser } = useAuth()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const q = query.trim().toLowerCase()

  // Tenant-scoped search (US-04-001)
  const matchedUsers = q.length >= 2
    ? mockUsers.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q) ||
        u.groups.some(g => g.toLowerCase().includes(q))
      ).slice(0, 5)
    : []

  const matchedGroups = q.length >= 2
    ? mockGroups.filter(g =>
        g.tenantId === authUser?.tenantId &&
        (g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
      ).slice(0, 3)
    : []

  const hasResults = matchedUsers.length > 0 || matchedGroups.length > 0

  const handleInput = (v: string) => {
    setQuery(v)
    setOpen(v.length >= 2)
  }

  const selectUser = (u: User) => {
    setQuery('')
    setOpen(false)
    onViewUser(u)
  }

  const selectGroup = () => {
    setQuery('')
    setOpen(false)
    onViewGroup()
  }

  const clear = () => {
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 max-w-sm relative" ref={ref}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => q.length >= 2 && setOpen(true)}
        placeholder="Search Users, Groups..."
        className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white transition-colors"
      />
      {query && (
        <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          <X size={13} />
        </button>
      )}

      {open && (
        <div className="absolute top-9 left-0 right-0 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              No results for "<span className="font-medium text-gray-600">{query}</span>"
            </div>
          ) : (
            <>
              {matchedUsers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-b border-gray-100">
                    <Users size={11} />
                    Users
                  </div>
                  {matchedUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {u.firstName} {u.lastName}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{u.email} · {u.userId}</div>
                      </div>
                      <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchedGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50 border-t border-b border-gray-100">
                    <GitBranch size={11} />
                    Groups
                  </div>
                  {matchedGroups.map(g => (
                    <button
                      key={g.id}
                      onClick={selectGroup}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {g.name[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{g.name}</div>
                        <div className="text-xs text-gray-400">{g.memberCount} members · {g.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
