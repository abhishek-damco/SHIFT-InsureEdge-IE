import { useState } from 'react'
import {
  BrowserRouter, Routes, Route, Navigate, Outlet,
  useNavigate, useLocation,
} from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { PermissionProvider } from './contexts/PermissionContext'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import LoginPage from './pages/LoginPage'
import UserListPage from './pages/UserListPage'
import AddUserPage from './pages/AddUserPage'
import ViewUserPage from './pages/ViewUserPage'
import AuditLogPage from './pages/AuditLogPage'
import GroupListPage from './pages/GroupListPage'
import AddGroupPage from './pages/AddGroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import PasswordResetPage from './pages/PasswordResetPage'
import PasswordResetConfirmPage from './pages/PasswordResetConfirmPage'
import OnboardingSetupPage from './pages/OnboardingSetupPage'
import type { User } from './data/types'

type UserPage = 'list' | 'add' | 'view' | 'edit' | 'audit'

function UserManagementSection() {
  const [page, setPage] = useState<UserPage>('list')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [listKey, setListKey] = useState(0)

  const handleView = (user: User) => { setSelectedUser(user); setPage('view') }
  const handleEdit = (user: User) => { setSelectedUser(user); setPage('edit') }
  const backToList = () => { setListKey(k => k + 1); setPage('list') }

  return (
    <>
      {page === 'list' && (
        <UserListPage key={listKey} onAddUser={() => setPage('add')} onViewUser={handleView} />
      )}
      {page === 'add' && (
        <AddUserPage onCancel={() => setPage('list')} onSave={backToList} />
      )}
      {page === 'view' && selectedUser && (
        <ViewUserPage user={selectedUser} onBack={() => setPage('list')} onEdit={handleEdit} />
      )}
      {page === 'edit' && selectedUser && (
        <AddUserPage onCancel={() => setPage('view')} onSave={backToList} />
      )}
      {page === 'audit' && (
        <AuditLogPage onBack={() => setPage('list')} />
      )}
    </>
  )
}

// Layout route — renders Outlet for child routes instead of nested <Routes>
function ProtectedLayout() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // saveUser() writes localStorage before setUser() queues the React state update,
  // so checking storage here prevents false redirect when flushSync races navigation.
  const hasStoredSession = !!localStorage.getItem('ie_auth_user')

  if (!isAuthenticated && !hasStoredSession) return <Navigate to="/login" replace />

  const sidebarPage = location.pathname.startsWith('/groups') ? 'groups' : 'users'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar
        onAuditLog={() => navigate('/users')}
        onViewGroup={() => navigate('/groups')}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePage={sidebarPage} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PermissionProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/password-reset/confirm" element={<PasswordResetConfirmPage />} />
            <Route path="/onboarding/setup" element={<OnboardingSetupPage />} />

            {/* Protected layout wraps all app routes via Outlet */}
            <Route element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/users" replace />} />
              <Route path="/users/*" element={<UserManagementSection />} />
              <Route path="/groups" element={<GroupListPage />} />
              <Route path="/groups/new" element={<AddGroupPage />} />
              <Route path="/groups/:id" element={<GroupDetailPage />} />
            </Route>
          </Routes>
          </PermissionProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
