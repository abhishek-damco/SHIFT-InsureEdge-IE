import { Eye, Filter, ArrowUp } from 'lucide-react'
import type { User } from '../data/types'

interface UserTableProps {
  users: User[]
  onView: (user: User) => void
}

export default function UserTable({ users, onView }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 w-10">#</th>
            <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 border-b border-gray-200 w-16">Action</th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-blue-600">User Name</span>
                <ArrowUp size={12} className="text-blue-600" />
                <Filter size={11} className="text-gray-400 ml-1" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">User ID</span>
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Group(s)</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Contact Number</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Email Id</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Office Location</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Address</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
            <th className="px-3 py-2.5 text-left border-b border-gray-200">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-gray-600">Status</span>
                <Filter size={11} className="text-gray-400" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-3 py-2.5 text-sm text-gray-500 border-b border-gray-100">{idx + 1}</td>
              <td className="px-3 py-2.5 border-b border-gray-100">
                <button
                  onClick={() => onView(user)}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  title="View user"
                >
                  <Eye size={16} />
                </button>
              </td>
              <td className="px-3 py-2.5 border-b border-gray-100">
                <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => onView(user)}>
                  {user.firstName} {user.lastName}
                </span>
              </td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">{user.userId}</td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">
                {user.groups.join(', ')}
              </td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100">{user.contactNumber}</td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100 max-w-[160px] truncate">{user.email}</td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100 max-w-[160px] truncate">{user.officeLocation}</td>
              <td className="px-3 py-2.5 text-sm text-gray-700 border-b border-gray-100 max-w-[160px] truncate">{user.address}</td>
              <td className="px-3 py-2.5 border-b border-gray-100">
                <span className={user.status === 'Active' ? 'status-active' : 'status-inactive'}>
                  â€¢ {user.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

