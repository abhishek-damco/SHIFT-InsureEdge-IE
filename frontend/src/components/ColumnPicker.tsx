import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'

export type ColumnKey = 'userId' | 'groups' | 'contactNumber' | 'email' | 'officeLocation' | 'address' | 'status' | 'manager'

// Locked = always visible, cannot be toggled off
export const LOCKED_COLS = ['action', 'name'] as const

export const ALL_OPTIONAL_COLS: { key: ColumnKey; label: string; locked?: boolean }[] = [
  { key: 'userId', label: 'User ID' },
  { key: 'groups', label: 'Group(s)' },
  { key: 'contactNumber', label: 'Contact Number' },
  { key: 'email', label: 'Email Id' },
  { key: 'officeLocation', label: 'Office Location' },
  { key: 'address', label: 'Address' },
  { key: 'status', label: 'Status' },
  { key: 'manager', label: 'Manager' },
]

export const DEFAULT_VISIBLE: ColumnKey[] = ['userId', 'groups', 'contactNumber', 'email', 'officeLocation', 'address', 'status']

interface ColumnPickerProps {
  visible: ColumnKey[]
  onChange: (cols: ColumnKey[]) => void
}

export default function ColumnPicker({ visible, onChange }: ColumnPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (key: ColumnKey) => {
    if (visible.includes(key)) {
      if (visible.length === 1) return
      onChange(visible.filter(k => k !== key))
    } else {
      const order = ALL_OPTIONAL_COLS.map(c => c.key)
      onChange(order.filter(k => visible.includes(k) || k === key))
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Triggered by ≡ icon in table header — rendered externally, this component just owns the panel */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Modify columns display"
        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="4" x2="14" y2="4"/>
          <line x1="2" y1="8" x2="14" y2="8"/>
          <line x1="2" y1="12" x2="14" y2="12"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-8 z-40 bg-white border border-gray-200 rounded-lg shadow-xl w-56 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <span className="text-xs font-semibold text-gray-700">Modify Columns Display</span>
          </div>

          {/* Always-locked rows */}
          {[{ label: 'Action' }, { label: 'User Name' }].map(({ label }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-2 bg-white">
              <div className="w-4 h-4 rounded border border-gray-200 bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}

          {/* Toggleable columns */}
          {ALL_OPTIONAL_COLS.map(col => {
            const on = visible.includes(col.key)
            return (
              <button
                key={col.key}
                onClick={() => toggle(col.key)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${on ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${on ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                  {on && <Check size={10} className="text-white" />}
                </div>
                <span className={`text-xs font-medium ${on ? 'text-blue-700' : 'text-gray-500'}`}>{col.label}</span>
              </button>
            )
          })}

          <div className="border-t border-gray-100 px-4 py-2 flex justify-between">
            <button onClick={() => onChange(ALL_OPTIONAL_COLS.map(c => c.key))} className="text-xs text-blue-600 hover:underline">Show all</button>
            <button onClick={() => onChange(DEFAULT_VISIBLE)} className="text-xs text-gray-400 hover:underline">Reset</button>
          </div>
        </div>
      )}
    </div>
  )
}
