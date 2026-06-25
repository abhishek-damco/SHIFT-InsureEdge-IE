import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Render-based redirect: as soon as isAuthenticated flips to true (after login()
  // calls setUser), React re-renders this component and we return <Navigate>.
  // This is guaranteed to run after the auth state is already applied — no timing race.
  if (isAuthenticated) {
    return <Navigate to="/users" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    setLoading(false)
    if (!ok) setError('Invalid email or password. Please try again.')
    // No navigate() call — redirect is handled by the isAuthenticated check above
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="font-bold text-[#1a2744] text-2xl tracking-tight">HUDSON</span>
            <span className="text-gray-400">✦</span>
            <span className="font-bold text-[#1a2744] text-2xl tracking-tight">BAILEY</span>
          </div>
          <p className="text-sm text-gray-500">User Management Platform</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Sign in</h1>
          <p className="text-xs text-gray-500 mb-6">Enter your credentials to access the platform</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-xs mb-4">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field"
                autoComplete="email"
              />
              <p className="text-xs text-gray-400 mt-1">Use: admin@hudsonclient.com · Password: Admin@1234</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-save justify-center disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400">
              Authentication managed via Azure AD / Entra ID
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
