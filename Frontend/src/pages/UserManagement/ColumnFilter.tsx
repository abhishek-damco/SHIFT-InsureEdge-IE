import { useEffect, useRef, useState } from "react"
import type { UserListItem } from "../../types/User"

type ColKey = "action" | "userName" | "userId" | "groups" | "contact" | "email" | "office" | "address" | "status"

const CONDITIONS = [
  "(not set)", "contains", "not contains", "equals", "not equals",
  "starts with", "ends with", "is empty", "is not empty",
]

export interface ConditionFilter {
  tab: "condition"
  cond1Type: string
  cond1Value: string
  logic: "And" | "Or"
  cond2Type: string
  cond2Value: string
}

export interface ValueFilter {
  tab: "value"
  selected: string[]
}

export type ColumnFilterState = ConditionFilter | ValueFilter

function getRowValue(u: UserListItem, col: ColKey): string {
  switch (col) {
    case "userName": return [u.firstName, u.lastName].filter(Boolean).join(" ")
    case "userId":   return u.userCode ?? ""
    case "groups":   return u.groups.map(g => g.groupName).join(", ")
    case "contact":  return [u.telephoneNumberCc, u.telephoneNumber].filter(Boolean).join(" ")
    case "email":    return u.email ?? ""
    case "office":   return u.officeLocation ?? ""
    case "address":  return [u.addressLine1, u.city].filter(Boolean).join(", ")
    case "status":   return u.status ?? ""
    default:         return ""
  }
}

export function applyFilter(items: UserListItem[], col: ColKey, filter: ColumnFilterState | undefined): UserListItem[] {
  if (!filter) return items
  if (filter.tab === "value") {
    if (!filter.selected.length) return items
    return items.filter(u => filter.selected.includes(getRowValue(u, col)))
  }
  const test = (val: string, type: string, cmp: string): boolean => {
    if (!type || type === "(not set)") return true
    const v = val.toLowerCase(); const c = cmp.toLowerCase()
    switch (type) {
      case "contains":     return v.includes(c)
      case "not contains": return !v.includes(c)
      case "equals":       return v === c
      case "not equals":   return v !== c
      case "starts with":  return v.startsWith(c)
      case "ends with":    return v.endsWith(c)
      case "is empty":     return val.trim() === ""
      case "is not empty": return val.trim() !== ""
      default:             return true
    }
  }
  return items.filter(u => {
    const val = getRowValue(u, col)
    const r1 = test(val, filter.cond1Type, filter.cond1Value)
    const r2 = test(val, filter.cond2Type, filter.cond2Value)
    return filter.logic === "And" ? r1 && r2 : r1 || r2
  })
}

interface Props {
  col: ColKey
  allItems: UserListItem[]
  current: ColumnFilterState | undefined
  anchorRef: React.RefObject<HTMLElement>
  onApply: (filter: ColumnFilterState | undefined) => void
  onClose: () => void
}

export default function ColumnFilterPanel({ col, allItems, current, onApply, onClose }: Props) {
  const [tab, setTab] = useState<"condition" | "value">(current?.tab ?? "condition")
  const [cond1Type, setCond1Type] = useState((current?.tab === "condition" ? current.cond1Type : "") || "(not set)")
  const [cond1Value, setCond1Value] = useState((current?.tab === "condition" ? current.cond1Value : "") || "")
  const [logic, setLogic] = useState<"And" | "Or">((current?.tab === "condition" ? current.logic : "And") || "And")
  const [cond2Type, setCond2Type] = useState((current?.tab === "condition" ? current.cond2Type : "") || "(not set)")
  const [cond2Value, setCond2Value] = useState((current?.tab === "condition" ? current.cond2Value : "") || "")

  const uniqueVals = [...new Set(allItems.map(u => getRowValue(u, col)).filter(Boolean))].sort()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(
    current?.tab === "value" && current.selected.length ? new Set(current.selected) : new Set<string>()
  )
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    setTimeout(() => document.addEventListener("mousedown", handler), 0)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  const filteredVals = uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase()))
  const allSelected = filteredVals.length > 0 && filteredVals.every(v => selected.has(v))

  function toggleVal(v: string) {
    setSelected(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n })
  }
  function toggleAll() {
    if (allSelected) setSelected(prev => { const n = new Set(prev); filteredVals.forEach(v => n.delete(v)); return n })
    else setSelected(prev => { const n = new Set(prev); filteredVals.forEach(v => n.add(v)); return n })
  }

  function handleApply() {
    if (tab === "condition") {
      const active = (cond1Type && cond1Type !== "(not set)") || (cond2Type && cond2Type !== "(not set)")
      onApply(active ? { tab: "condition", cond1Type, cond1Value, logic, cond2Type, cond2Value } : undefined)
    } else {
      onApply(selected.size > 0 ? { tab: "value", selected: [...selected] } : undefined)
    }
    onClose()
  }

  return (
    <div ref={panelRef} className="absolute left-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ width: 340, minWidth: 320 }} onClick={e => e.stopPropagation()}>
      <div className="flex border-b border-gray-200">
        {(["condition", "value"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {t === "condition" ? "Filter by Condition" : "Filter by Value"}
          </button>
        ))}
      </div>

      {tab === "condition" ? (
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-600">Show items where the value</p>
          <select value={cond1Type} onChange={e => setCond1Type(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="text" value={cond1Value} onChange={e => setCond1Value(e.target.value)}
            disabled={cond1Type === "(not set)" || cond1Type === "is empty" || cond1Type === "is not empty"}
            className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:opacity-40" />
          <div className="flex items-center gap-6 py-1">
            {(["And", "Or"] as const).map(l => (
              <label key={l} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                <div onClick={() => setLogic(l)}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer ${logic === l ? "border-blue-600" : "border-gray-400"}`}>
                  {logic === l && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                {l}
              </label>
            ))}
          </div>
          <select value={cond2Type} onChange={e => setCond2Type(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="text" value={cond2Value} onChange={e => setCond2Value(e.target.value)}
            disabled={cond2Type === "(not set)" || cond2Type === "is empty" || cond2Type === "is not empty"}
            className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 disabled:opacity-40" />
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" autoFocus
            className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50" />
          <div className="overflow-y-auto" style={{ maxHeight: 220, borderRight: "3px solid #2563eb", borderRadius: 2 }}>
            <label className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 border-b border-gray-100">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
              <span className="font-medium">Select All</span>
            </label>
            {filteredVals.map(v => (
              <label key={v} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selected.has(v)} onChange={() => toggleVal(v)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                <span className="truncate">{v}</span>
              </label>
            ))}
            {filteredVals.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">No values found</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
        <button onClick={handleApply} className="px-5 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">Apply</button>
        <button onClick={onClose} className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50">Cancel</button>
        <button onClick={() => { if (tab === "condition") { setCond1Type("(not set)"); setCond1Value(""); setCond2Type("(not set)"); setCond2Value("") } else { setSelected(new Set()) } }}
          className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50 ml-auto">Clear</button>
      </div>
    </div>
  )
}
