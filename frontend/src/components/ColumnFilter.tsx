import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

type FilterMode = 'condition' | 'value'
type Logic = 'and' | 'or'

type ConditionOp =
  | 'notSet'
  | 'equals'
  | 'notEquals'
  | 'beginsWith'
  | 'notBeginsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'contains'
  | 'notContains'
  | 'isEmpty'
  | 'isNotEmpty'

const CONDITION_OPTIONS: { value: ConditionOp; label: string }[] = [
  { value: 'notSet',        label: '(not set)' },
  { value: 'equals',        label: 'Equals' },
  { value: 'notEquals',     label: 'Does not equal' },
  { value: 'beginsWith',    label: 'Begins with' },
  { value: 'notBeginsWith', label: 'Does not begin with' },
  { value: 'endsWith',      label: 'Ends with' },
  { value: 'notEndsWith',   label: 'Does not end with' },
  { value: 'contains',      label: 'Contains' },
  { value: 'notContains',   label: 'Does not contain' },
  { value: 'isEmpty',       label: 'Is empty' },
  { value: 'isNotEmpty',    label: 'Is not empty' },
]

export interface ColumnFilterValue {
  mode: FilterMode
  op1?: ConditionOp
  text1?: string
  logic?: Logic
  op2?: ConditionOp
  text2?: string
  selectedValues?: string[]
}

// Portal dropdown that positions itself via fixed coords to escape overflow containers
function PortalDropdown({
  anchorRef,
  children,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  children: React.ReactNode
  onClose: () => void
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 2, left: r.left, width: r.width })
    }
  }, [anchorRef])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const el = document.getElementById('portal-dropdown-container')
      if (el && !el.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose, anchorRef])

  return createPortal(
    <div
      id="portal-dropdown-container"
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        width: Math.max(coords.width, 200),
        zIndex: 9999,
        background: '#fff',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        maxHeight: '220px',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>,
    document.body
  )
}

function ConditionSelect({ op, onOpChange }: { op: ConditionOp; onOpChange: (v: ConditionOp) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const label = CONDITION_OPTIONS.find(o => o.value === op)?.label ?? '(not set)'

  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-300 rounded px-3 py-1.5 text-xs bg-white focus:outline-none hover:border-gray-400 transition-colors"
        style={open ? { borderColor: '#0B5AA0' } : {}}
      >
        <span className={op === 'notSet' ? 'text-gray-400' : 'text-gray-700'}>{label}</span>
        {open
          ? <ChevronUp size={13} className="text-gray-500 flex-shrink-0" />
          : <ChevronDown size={13} className="text-gray-500 flex-shrink-0" />}
      </button>

      {open && (
        <PortalDropdown anchorRef={btnRef} onClose={close}>
          {CONDITION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onOpChange(opt.value); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 12px', fontSize: '12px', background: opt.value === op ? '#eff6ff' : 'transparent', color: opt.value === op ? '#0B5AA0' : '#374151', fontWeight: opt.value === op ? 500 : 400, cursor: 'pointer', border: 'none' }}
              onMouseEnter={e => { if (opt.value !== op) (e.target as HTMLButtonElement).style.background = '#f9fafb' }}
              onMouseLeave={e => { if (opt.value !== op) (e.target as HTMLButtonElement).style.background = 'transparent' }}
            >
              {opt.label}
            </button>
          ))}
        </PortalDropdown>
      )}
    </>
  )
}

function ConditionRow({ op, text, onOpChange, onTextChange }: {
  op: ConditionOp; text: string
  onOpChange: (v: ConditionOp) => void
  onTextChange: (v: string) => void
}) {
  const noText = op === 'isEmpty' || op === 'isNotEmpty' || op === 'notSet'
  return (
    <div className="space-y-1.5">
      <ConditionSelect op={op} onOpChange={onOpChange} />
      <input
        type="text"
        value={text}
        onChange={e => onTextChange(e.target.value)}
        disabled={noText}
        placeholder={noText ? '' : 'Enter value...'}
        className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed placeholder:text-gray-300 transition-colors"
        style={{ outlineColor: '#0B5AA0' }}
      />
    </div>
  )
}

// The main filter panel also uses a portal so the table overflow doesn't clip it
interface ColumnFilterProps {
  column: string
  uniqueValues: string[]
  active: boolean
  value: ColumnFilterValue | null
  onChange: (val: ColumnFilterValue | null) => void
}

export default function ColumnFilter({ column, uniqueValues, active, value, onChange }: ColumnFilterProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<FilterMode>(value?.mode ?? 'condition')
  const [op1, setOp1] = useState<ConditionOp>(value?.op1 ?? 'notSet')
  const [text1, setText1] = useState(value?.text1 ?? '')
  const [logic, setLogic] = useState<Logic>(value?.logic ?? 'and')
  const [op2, setOp2] = useState<ConditionOp>(value?.op2 ?? 'notSet')
  const [text2, setText2] = useState(value?.text2 ?? '')
  const [selectedValues, setSelectedValues] = useState<string[]>(value?.selectedValues ?? [])
  const [panelCoords, setPanelCoords] = useState({ top: 0, left: 0 })

  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current && panelRef.current.contains(t)) return
      if (triggerRef.current && triggerRef.current.contains(t)) return
      if (document.getElementById('portal-dropdown-container')?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openPanel = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPanelCoords({ top: r.bottom + 4, left: r.left })
    }
    setOpen(o => !o)
  }

  const apply = () => {
    if (mode === 'condition') {
      const noText1 = op1 === 'isEmpty' || op1 === 'isNotEmpty'
      const noText2 = op2 === 'isEmpty' || op2 === 'isNotEmpty'
      const hasRow1 = op1 !== 'notSet' && (noText1 || text1 !== '')
      const hasRow2 = op2 !== 'notSet' && (noText2 || text2 !== '')
      if (!hasRow1 && !hasRow2) { onChange(null); setOpen(false); return }
      onChange({ mode, op1, text1, logic, op2, text2 })
    } else {
      onChange(selectedValues.length > 0 ? { mode, selectedValues } : null)
    }
    setOpen(false)
  }

  const clearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setOp1('notSet'); setText1('')
    setOp2('notSet'); setText2('')
    setSelectedValues([])
    onChange(null)
    setOpen(false)
  }

  const clearBadge = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearAll()
  }

  const toggleValue = (v: string) =>
    setSelectedValues(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        onClick={openPanel}
        className={`transition-colors p-0.5 ${active ? 'text-[#0B5AA0]' : 'text-gray-400 hover:text-gray-600'}`}
        title={`Filter by ${column}`}
      >
        <Filter size={11} />
      </button>
      {active && (
        <button onClick={clearBadge} className="text-[#0B5AA0] hover:text-blue-800 ml-0.5">
          <X size={10} />
        </button>
      )}

      {open && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top: panelCoords.top,
            left: panelCoords.left,
            width: '260px',
            zIndex: 9998,
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['condition', 'value'] as FilterMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 text-xs py-2.5 px-2 font-medium transition-colors"
                style={{
                  color: mode === m ? '#0B5AA0' : '#6b7280',
                  borderBottom: mode === m ? '2px solid #0B5AA0' : '2px solid transparent',
                }}
              >
                {m === 'condition' ? 'Filter by Condition' : 'Filter by Value'}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-2.5">
            {mode === 'condition' ? (
              <>
                <p className="text-xs text-gray-500">Show items where the value</p>
                <ConditionRow op={op1} text={text1} onOpChange={setOp1} onTextChange={setText1} />

                {/* And / Or */}
                <div className="flex items-center gap-5 py-0.5">
                  {(['and', 'or'] as Logic[]).map(l => (
                    <label key={l} className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setLogic(l)}>
                      <span
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: logic === l ? '#0B5AA0' : '#d1d5db' }}
                      >
                        {logic === l && <span className="w-2 h-2 rounded-full block" style={{ background: '#0B5AA0' }} />}
                      </span>
                      <span className="text-xs text-gray-700 capitalize">{l}</span>
                    </label>
                  ))}
                </div>

                <ConditionRow op={op2} text={text2} onOpChange={setOp2} onTextChange={setText2} />
              </>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto' }} className="space-y-0.5">
                {uniqueValues.length === 0
                  ? <p className="text-xs text-gray-400 text-center py-4">No values available</p>
                  : uniqueValues.map(v => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(v)}
                        onChange={() => toggleValue(v)}
                        className="w-3 h-3 rounded"
                        style={{ accentColor: '#0B5AA0' }}
                      />
                      <span className="text-xs text-gray-700 truncate">{v || '(empty)'}</span>
                    </label>
                  ))
                }
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-3 py-2.5 border-t border-gray-100">
            <button onClick={apply} className="flex-1 text-xs py-1.5 rounded text-white font-medium" style={{ background: '#0B5AA0' }}>
              Apply
            </button>
            <button onClick={() => setOpen(false)} className="flex-1 text-xs py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => clearAll()} className="flex-1 text-xs py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50">
              Clear
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
