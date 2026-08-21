// ADR-002: Login page — email + password, sets HttpOnly cookie via /api/auth/login
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required.'); return; }
    setError(null);
    setLoading(true);
    try {
      await authApi.login(email, password);
      navigate('/groups');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid email or password.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f4f7fb',
    }}>
      <div style={{ width: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0B5AA0' }}>Hudson Bailey InsureEdge</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Sign in to your account</div>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
                borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="text" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label htmlFor="password">Password</label>
              <input
                id="password" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <a href="/password-reset" style={{ fontSize: 13, color: '#0B5AA0' }}>
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
