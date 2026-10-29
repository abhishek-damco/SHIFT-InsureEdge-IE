import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  appearance?: 'default' | 'user-reference'
}

export default function SearchableSelect({
  options, value, onChange, placeholder = 'Select...', disabled, clearable = false, appearance = 'default',
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const userReference = appearance === 'user-reference'

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative" style={userReference ? { position: 'relative', width: '100%' } : undefined}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-left ${
          disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white text-gray-800'
        } ${!selected ? 'text-gray-400' : ''}`}
        style={userReference ? {
          width: '100%', height: 36, padding: '0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          border: '1px solid #aeb7c2', borderRadius: 3,
          background: disabled ? '#e5e7eb' : '#f7f8fc',
          color: disabled ? '#9ca3af' : selected ? '#111827' : '#374151',
          fontSize: 13, fontWeight: 400, lineHeight: 1, textAlign: 'left',
          boxShadow: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        } : undefined}
      >
        <span className="truncate" style={userReference ? { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}>{selected ? selected.label : placeholder}</span>
        <span className="ml-2 flex shrink-0 items-center gap-1" style={userReference ? { marginLeft: 10, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 } : undefined}>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={e => { e.stopPropagation(); onChange(''); setSearch('') }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange('');
                  setSearch('');
                }
              }}
              className="rounded p-0.5 text-gray-500 hover:bg-gray-100"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={userReference ? 16 : 14} className="text-gray-400" color={userReference ? '#1f2937' : undefined} strokeWidth={userReference ? 1.8 : 2} />
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg" style={userReference ? {
          position: 'absolute', zIndex: 50, top: '100%', left: 0, width: '100%', marginTop: 4,
          background: '#fff', border: '1px solid #aeb7c2', borderRadius: 3,
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.14)', overflow: 'hidden',
        } : undefined}>
          <div className="p-2 border-b border-gray-100" style={userReference ? { padding: 8, borderBottom: '1px solid #e5e7eb' } : undefined}>
            <div className="relative" style={userReference ? { position: 'relative' } : undefined}>
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" style={userReference ? { position: 'absolute', left: 8, top: 9, color: '#9ca3af', pointerEvents: 'none' } : undefined} />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={userReference ? { width: '100%', height: 30, padding: '4px 8px 4px 26px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 3 } : undefined}
              />
            </div>
          </div>
          <div
            className="max-h-48 overflow-y-auto"
            style={{ display: 'flex', flexDirection: 'column', maxHeight: 192, overflowY: 'auto' }}
          >
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No options found</p>
            )}
            {filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  o.value === value ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', flexShrink: 0,
                  ...(userReference ? {
                    padding: '8px 12px', border: 0, borderRadius: 0, background: o.value === value ? '#eff6ff' : '#fff',
                    color: o.value === value ? '#0B5AA0' : '#374151', fontSize: 13, fontWeight: o.value === value ? 600 : 400,
                  } : {}),
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
