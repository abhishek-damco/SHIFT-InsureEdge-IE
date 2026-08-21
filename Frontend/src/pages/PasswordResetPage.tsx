// US-015/US-016: Request and Resend password reset
// Always shows "success" message to prevent user enumeration (VR-005)
import { useState } from 'react';
import { passwordResetApi } from '../api/passwordReset';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError(null);
    try {
      await passwordResetApi.request(email);
      setSent(true);
    } catch {
      setSent(true); // Always show success — prevent enumeration
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true); setError(null); setRateLimited(false);
    try {
      await passwordResetApi.resend(email);
      setSent(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      if (e.response?.status === 400) {
        setRateLimited(true);
        setError(e.response.data?.message ?? 'Rate limit reached. Please wait.');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fb' }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0B5AA0' }}>Hudson Bailey InsureEdge</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Reset Your Password</div>
        </div>

        <div className="card">
          {sent && !rateLimited ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
              <p style={{ marginBottom: 16, color: '#374151' }}>
                If that email is registered, a password reset link has been sent. Check your inbox.
              </p>
              <button className="btn-secondary" onClick={handleResend} disabled={loading} style={{ marginRight: 8 }}>
                {loading ? 'Sending...' : 'Resend Link'}
              </button>
              <a href="/login" style={{ fontSize: 13, color: '#0B5AA0', marginLeft: 8 }}>Back to Sign In</a>
            </div>
          ) : (
            <form onSubmit={handleRequest}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email" type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <a href="/login" style={{ fontSize: 13, color: '#0B5AA0' }}>Back to Sign In</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
