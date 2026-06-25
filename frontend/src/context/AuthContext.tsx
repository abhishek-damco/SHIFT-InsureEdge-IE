import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface TenantUser {
  id: string
  name: string
  role: string
  tenantId: string
  tenantName: string
  initials: string
}

interface AuthContextValue {
  user: TenantUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

const AUTH_KEY = 'ie_auth_user'
const AuthContext = createContext<AuthContextValue | null>(null)

// Mock accounts for the UI login form.
// dotnetEmail/dotnetPassword are the matching credentials in the "user" auth table
// used to establish a .NET session cookie for the groups API.
const MOCK_ACCOUNTS: Record<string, TenantUser & {
  password: string
  dotnetEmail: string
  dotnetPassword: string
}> = {
  'admin@hudsonclient.com': {
    id: 'HC-001',
    name: 'Hudson Client Admin',
    role: 'Client Admin',
    tenantId: 'TENANT-HC',
    tenantName: 'Hudson & Bailey',
    initials: 'HC',
    password: 'Admin@1234',
    dotnetEmail: 'alex.mercer@hudsonbailey.com',
    dotnetPassword: 'DevPass@123!',
  },
  'admin@othertenant.com': {
    id: 'OT-001',
    name: 'Other Tenant Admin',
    role: 'Client Admin',
    tenantId: 'TENANT-OT',
    tenantName: 'Other Corp',
    initials: 'OT',
    password: 'Admin@1234',
    dotnetEmail: 'riley.thompson@hudsonbailey.com',
    dotnetPassword: 'DevPass@123!',
  },
}

function loadUser(): TenantUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as TenantUser) : null
  } catch {
    return null
  }
}

// Authenticate with the .NET backend so the session cookie is set for groups/permissions APIs.
async function dotnetLogin(email: string, password: string) {
  try {
    await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    // .NET backend unavailable — groups page will show empty, not a critical failure
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TenantUser | null>(loadUser)

  const login = async (email: string, password: string): Promise<boolean> => {
    const account = MOCK_ACCOUNTS[email.toLowerCase()]
    if (account && account.password === password) {
      const { password: _, dotnetEmail, dotnetPassword, ...tenantUser } = account
      localStorage.setItem(AUTH_KEY, JSON.stringify(tenantUser))
      setUser(tenantUser)
      // Also establish .NET session so group management APIs work
      await dotnetLogin(dotnetEmail, dotnetPassword)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
    // Clear .NET session too
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
