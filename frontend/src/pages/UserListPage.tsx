import { useState, useCallback, useEffect } from 'react'
import { Search, Upload, Plus, ArrowUp, ArrowDown, ArrowUpDown, X, Filter as FilterIcon } from 'lucide-react'
import type { User } from '../data/types'
import { usersApi, type ApiUser } from '../api/users'
import KpiCard from '../components/KpiCard'
import ColumnFilter from '../components/ColumnFilter'
import type { ColumnFilterValue } from '../components/ColumnFilter'
import ColumnPicker, { DEFAULT_VISIBLE } from '../components/ColumnPicker'
import type { ColumnKey } from '../components/ColumnPicker'

function apiUserToUser(u: ApiUser): User {
  return {
    id: String(u.id),
    userId: u.user_code,
    firstName: u.first_name,
    lastName: u.last_name,
    email: u.email,
    contactNumber: u.telephone_number
      ? `${u.telephone_number_cc ?? ''} ${u.telephone_number}`.trim()
      : '',
    groups: u.groups.map(g => g.group_name),
    officeLocation: u.office_location ?? '',
    address: [u.address_line1, u.city, u.state_name, u.zip_code].filter(Boolean).join(', '),
    status: u.status as 'Active' | 'Inactive',
    department: u.department ?? '',
    managerId: u.reports_to ? String(u.reports_to) : undefined,
  }
}

interface UserListPageProps {
  onAddUser: () => void
  onViewUser: (user: User) => void
}

type SortCol = 'name' | ColumnKey

function getCellValue(user: User, col: SortCol): string {
  const managerName = (id?: string) => {
    if (!id) return ''
    return id
  }
  switch (col) {
    case 'name': return `${user.firstName} ${user.lastName}`
    case 'userId': return user.userId
    case 'groups': return user.groups.join(', ')
    case 'contactNumber': return user.contactNumber
    case 'email': return user.email
    case 'officeLocation': return user.officeLocation
    case 'address': return user.address
    case 'status': return user.status
    case 'manager': return managerName(user.managerId)
    default: return ''
  }
}

function evalOp(op: string | undefined, text: string, val: string): boolean {
  const t = text.toLowerCase()
  const v = val.toLowerCase()
  switch (op) {
    case 'equals':        return v === t
    case 'notEquals':     return v !== t
    case 'beginsWith':    return v.startsWith(t)
    case 'notBeginsWith': return !v.startsWith(t)
    case 'endsWith':      return v.endsWith(t)
    case 'notEndsWith':   return !v.endsWith(t)
    case 'contains':      return v.includes(t)
    case 'notContains':   return !v.includes(t)
    case 'isEmpty':       return v === ''
    case 'isNotEmpty':    return v !== ''
    default:              return true
  }
}

function applyFilter(value: string, f: ColumnFilterValue): boolean {
  if (f.mode === 'value') return f.selectedValues?.some(v => value.toLowerCase().includes(v.toLowerCase())) ?? false
  const noText1 = f.op1 === 'isEmpty' || f.op1 === 'isNotEmpty'
  const noText2 = f.op2 === 'isEmpty' || f.op2 === 'isNotEmpty'
  const hasRow1 = f.op1 && f.op1 !== 'notSet' && (noText1 || (f.text1 ?? '') !== '')
  const hasRow2 = f.op2 && f.op2 !== 'notSet' && (noText2 || (f.text2 ?? '') !== '')
  if (!hasRow1 && !hasRow2) return true
  const r1 = hasRow1 ? evalOp(f.op1, f.text1 ?? '', value) : null
  const r2 = hasRow2 ? evalOp(f.op2, f.text2 ?? '', value) : null
  if (r1 !== null && r2 !== null) return f.logic === 'or' ? r1 || r2 : r1 && r2
  return r1 ?? r2 ?? true
}

// Tooltip cell — truncates text and shows full value on hover
function TipCell({ value, className = '' }: { value: string; className?: string }) {
  return (
    <td className={`px-3 py-2.5 border-b border-gray-100 max-w-[160px] ${className}`}>
      <div className="relative group">
        <span className="block truncate text-sm text-gray-700 cursor-default">{value || '—'}</span>
        {value && (
          <div className="absolute left-0 bottom-full mb-1.5 z-50 hidden group-hover:block pointer-events-none">
            <div className="bg-gray-800 text-white text-xs rounded px-2.5 py-1.5 whitespace-nowrap shadow-lg max-w-xs">
              {value}
              <div className="absolute left-3 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800" />
            </div>
          </div>
        )}
      </div>
    </td>
  )
}

export default function UserListPage({ onAddUser, onViewUser }: UserListPageProps) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Partial<Record<SortCol, ColumnFilterValue>>>({})
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(DEFAULT_VISIBLE)
  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('asc')
  const [users, setUsers] = useState<User[]>([])
  const [kpi, setKpi] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    usersApi.list({ pageSize: 200 })
      .then(res => {
        setUsers(res.items.map(apiUserToUser))
        setKpi({
          total: res.total,
          active: parseInt(res.active),
          inactive: parseInt(res.inactive),
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const setFilter = useCallback((col: SortCol) => (val: ColumnFilterValue | null) =>
    setFilters(f => {
      const next = { ...f }
      if (val) next[col] = val
      else delete next[col]
      return next
    }), [])

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortDir(null); setSortCol('name') }
      else setSortDir('asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const unique = (fn: (u: User) => string): string[] =>
    [...new Set(users.map(fn))].filter(Boolean).sort()

  const managerName = (id?: string) => {
    if (!id) return ''
    const m = users.find(u => u.id === id)
    return m ? `${m.firstName} ${m.lastName}` : ''
  }

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase()
      if (q && !`${u.firstName} ${u.lastName}`.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q) && !u.userId.toLowerCase().includes(q)) return false
      for (const [col, fval] of Object.entries(filters) as [SortCol, ColumnFilterValue][]) {
        if (!applyFilter(getCellValue(u, col), fval)) return false
      }
      return true
    })
    .sort((a, b) => {
      if (!sortDir) return 0
      const av = getCellValue(a, sortCol)
      const bv = getCellValue(b, sortCol)
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })

  const activeFilterCount = Object.keys(filters).length

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col || !sortDir) return <ArrowUpDown size={11} className="text-gray-300 flex-shrink-0" />
    return sortDir === 'asc'
      ? <ArrowUp size={11} className="text-blue-600 flex-shrink-0" />
      : <ArrowDown size={11} className="text-blue-600 flex-shrink-0" />
  }

  const ColHead = ({ col, label, values }: { col: SortCol; label: string; values: string[] }) => (
    <th className="px-3 py-2.5 text-left border-b border-gray-200 bg-gray-50 whitespace-nowrap">
      <div className="flex items-center gap-1">
        <button onClick={() => handleSort(col)} className="flex items-center gap-1 group min-w-0">
          <span className={`text-xs font-semibold group-hover:text-blue-500 transition-colors ${sortCol === col && sortDir ? 'text-blue-600' : 'text-gray-600'}`}>
            {label}
          </span>
          <SortIcon col={col} />
        </button>
        <ColumnFilter
          column={label}
          uniqueValues={values}
          active={!!filters[col]}
          value={filters[col] ?? null}
          onChange={setFilter(col)}
        />
      </div>
    </th>
  )

  return (
    <div className="p-5 flex flex-col gap-5 min-h-full">
      <h1 className="text-lg font-semibold text-gray-800">User Management</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total Users"
          value={kpi.total}
          accent="#0B5AA0"
          icon={
            <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
              <circle cx="17" cy="17" r="7" fill="#0B5AA0" opacity="0.5"/>
              <path d="M3 40c0-8 6.3-13 14-13" stroke="#0B5AA0" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="34" cy="17" r="7" fill="#0B5AA0" opacity="0.85"/>
              <path d="M20 40c0-8 6.3-13 14-13s14 5 14 13" stroke="#0B5AA0" strokeWidth="2.5" strokeLinecap="round" opacity="0.85"/>
              <path d="M31 24l-4 7h4l-3.5 7 8-10h-4.5l4-4z" fill="#07DCD8" opacity="0.9"/>
            </svg>
          }
        />
        <KpiCard
          label="Active Users"
          value={kpi.active}
          accent="#0f7c4a"
          icon={
            <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
              <circle cx="26" cy="19" r="9" fill="#16a34a" opacity="0.75"/>
              <path d="M8 44c0-10 8.1-17 18-17s18 7 18 17" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" opacity="0.75"/>
              <circle cx="40" cy="37" r="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="1.5"/>
              <path d="M37 37l2.5 2.5 4.5-4.5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <KpiCard
          label="Inactive Users"
          value={kpi.inactive}
          accent="#c0392b"
          icon={
            <svg viewBox="0 0 52 52" width="52" height="52" fill="none">
              <circle cx="26" cy="19" r="9" fill="#dc2626" opacity="0.6"/>
              <path d="M8 44c0-10 8.1-17 18-17s18 7 18 17" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
              <circle cx="40" cy="37" r="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5"/>
              <path d="M37 34l6 6M43 34l-6 6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by Keyword"
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => setFilters({})}
              className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 bg-blue-50 rounded-md px-2.5 py-2 hover:bg-blue-100 transition-colors"
            >
              <FilterIcon size={12} />
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              <X size={11} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Upload size={14} />
            Import Users
          </button>
          <button onClick={onAddUser} className="btn-primary">
            <Plus size={14} />
            Add Users
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
        {/* Scrollable table wrapper */}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
            <thead className="sticky top-0 z-10">
              <tr>
                {/* ≡ column picker trigger — first header cell */}
                <th className="px-3 py-2.5 border-b border-gray-200 bg-gray-50 w-10">
                  <ColumnPicker visible={visibleCols} onChange={setVisibleCols} />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 bg-gray-50 w-14">
                  Action
                </th>
                <ColHead col="name" label="User Name" values={unique(u => `${u.firstName} ${u.lastName}`)} />
                {visibleCols.includes('userId') && <ColHead col="userId" label="User ID" values={unique(u => u.userId)} />}
                {visibleCols.includes('groups') && <ColHead col="groups" label="Group(s)" values={unique(u => u.groups.join(', '))} />}
                {visibleCols.includes('contactNumber') && <ColHead col="contactNumber" label="Contact Number" values={unique(u => u.contactNumber)} />}
                {visibleCols.includes('email') && <ColHead col="email" label="Email Id" values={unique(u => u.email)} />}
                {visibleCols.includes('officeLocation') && <ColHead col="officeLocation" label="Office Location" values={unique(u => u.officeLocation)} />}
                {visibleCols.includes('address') && <ColHead col="address" label="Address" values={unique(u => u.address)} />}
                {visibleCols.includes('manager') && <ColHead col="manager" label="Manager" values={unique(u => managerName(u.managerId))} />}
                {visibleCols.includes('status') && <ColHead col="status" label="Status" values={['Active', 'Inactive']} />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-sm text-gray-400">
                    No users match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-2.5 text-sm text-gray-400 border-b border-gray-100 text-center">{idx + 1}</td>
                    <td className="px-3 py-2.5 border-b border-gray-100">
                      <button
                        onClick={() => onViewUser(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="View user details"
                      >
                        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <ellipse cx="10" cy="10" rx="9" ry="5.5"/>
                          <circle cx="10" cy="10" r="2.5"/>
                        </svg>
                      </button>
                    </td>

                    {/* User Name — tooltip, NOT clickable */}
                    <TipCell value={`${user.firstName} ${user.lastName}`} className="font-medium" />

                    {visibleCols.includes('userId') && (
                      <td className="px-3 py-2.5 text-sm text-gray-600 border-b border-gray-100">{user.userId}</td>
                    )}
                    {visibleCols.includes('groups') && (
                      <td className="px-3 py-2.5 text-sm text-gray-600 border-b border-gray-100 max-w-[160px] truncate">{user.groups.join(', ')}</td>
                    )}
                    {visibleCols.includes('contactNumber') && (
                      <td className="px-3 py-2.5 text-sm text-gray-600 border-b border-gray-100">{user.contactNumber}</td>
                    )}
                    {visibleCols.includes('email') && (
                      <td className="px-3 py-2.5 text-sm text-gray-600 border-b border-gray-100 max-w-[160px] truncate">{user.email}</td>
                    )}
                    {/* Office Location — tooltip */}
                    {visibleCols.includes('officeLocation') && (
                      <TipCell value={user.officeLocation} />
                    )}
                    {/* Address — tooltip */}
                    {visibleCols.includes('address') && (
                      <TipCell value={user.address} />
                    )}
                    {visibleCols.includes('manager') && (
                      <td className="px-3 py-2.5 text-sm text-gray-600 border-b border-gray-100">
                        {managerName(user.managerId) || <span className="text-gray-300">—</span>}
                      </td>
                    )}
                    {visibleCols.includes('status') && (
                      <td className="px-3 py-2.5 border-b border-gray-100">
                        <span className={user.status === 'Active' ? 'status-active' : 'status-inactive'}>
                          • {user.status}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400 flex-shrink-0">
          <span>Showing <strong className="text-gray-600">{filtered.length}</strong> of <strong className="text-gray-600">{kpi.total}</strong> users</span>
          {sortDir && (
            <span>Sorted by <strong className="text-gray-600">{sortCol}</strong> ({sortDir}ending)</span>
          )}
        </div>
      </div>
    </div>
  )
}
