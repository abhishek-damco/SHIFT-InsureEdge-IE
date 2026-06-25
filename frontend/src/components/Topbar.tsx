import { ChevronDown, Menu, LogOut, ShieldCheck, ClipboardList } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import GlobalSearch from './GlobalSearch'
import type { User } from '../data/types'

interface TopbarProps {
  onAuditLog?: () => void
  onViewUser?: (user: User) => void
  onViewGroup?: () => void
}

export default function Topbar({ onAuditLog, onViewUser, onViewGroup }: TopbarProps) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 z-10">
      <button className="text-gray-500 hover:text-gray-700">
        <Menu size={18} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-1.5 mr-2">
        <span className="font-bold text-[#1a2744] text-base tracking-tight">HUDSON</span>
        <span className="text-gray-400 text-xs">✦</span>
        <span className="font-bold text-[#1a2744] text-base tracking-tight">BAILEY</span>
      </div>

      {/* Global search (US-03-002) */}
      <GlobalSearch
        onViewUser={onViewUser ?? (() => {})}
        onViewGroup={onViewGroup ?? (() => {})}
      />

      <div className="flex-1" />

      {/* Tenant badge */}
      {user && (
        <div className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1">
          <ShieldCheck size={12} className="text-green-500" />
          <span className="font-medium text-gray-700">{user.tenantName}</span>
        </div>
      )}

      {/* User avatar + dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 hover:bg-gray-50 rounded px-2 py-1 transition-colors"
        >
          <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#0B5AA0' }}>
            {user?.initials ?? 'HC'}
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-800 leading-tight">Hi, {user?.name ?? 'User'}...</div>
            <div className="text-xs text-gray-500 leading-tight">{user?.role ?? 'Client Admin'}</div>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-10 w-52 bg-white border border-gray-200 rounded shadow-md py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-800">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
              <div className="text-xs text-gray-400 mt-0.5">Tenant: {user?.tenantId}</div>
            </div>
            {onAuditLog && (
              <button
                onClick={() => { setOpen(false); onAuditLog() }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                <ClipboardList size={13} />
                Audit Log
              </button>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
