import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'

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
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Select...', disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

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
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-left ${
          disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white text-gray-800'
        } ${!selected ? 'text-gray-400' : ''}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className="ml-2 text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                style={{ display: 'block', width: '100%', textAlign: 'left', flexShrink: 0 }}
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
