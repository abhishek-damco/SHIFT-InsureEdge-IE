import { Link } from 'react-router-dom'
import { Users, LayoutDashboard, FileText, Shield, BarChart2, Settings, BookOpen, GitBranch } from 'lucide-react'

type Page = string

interface SidebarProps {
  activePage: Page
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard', to: '/' },
  { icon: FileText, label: 'Quotes & Policies', key: 'quotes', to: '/' },
  { icon: Shield, label: 'Claims', key: 'claims', to: '/' },
  { icon: Users, label: 'User Management', key: 'users', to: '/users' },
  { icon: GitBranch, label: 'User Groups', key: 'groups', to: '/groups' },
  { icon: BookOpen, label: 'Distribution', key: 'distribution', to: '/' },
  { icon: BarChart2, label: 'Reports', key: 'reports', to: '/' },
  { icon: Settings, label: 'Settings', key: 'settings', to: '/' },
]

export default function Sidebar({ activePage }: SidebarProps) {
  return (
    <aside className="w-14 bg-[#1a2744] flex flex-col items-center py-3 gap-1 flex-shrink-0">
      {navItems.map(({ icon: Icon, label, key, to }) => (
        <Link
          key={key}
          to={to}
          title={label}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
            activePage === key
              ? 'bg-[#0B5AA0] text-white'
              : 'text-gray-400 hover:bg-[#243158] hover:text-white'
          }`}
        >
          <Icon size={18} />
        </Link>
      ))}
    </aside>
  )
}
