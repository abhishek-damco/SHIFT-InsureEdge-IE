import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { passwordResetApi } from '../api/passwordReset';

export default function PasswordResetConfirmPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const username = params.get('username') ?? '';
  const token = params.get('token') ?? '';

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!username || !token) { setTokenValid(false); return; }
    passwordResetApi.validate(username, token)
      .then(r => setTokenValid(r.valid))
      .catch(() => setTokenValid(false));
  }, [username, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await passwordResetApi.confirm(username, token, password);
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setErrors({ submit: e.response?.data?.message ?? 'Failed to reset password. The link may have expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="spinner" /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fb' }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0B5AA0' }}>Hudson Bailey InsureEdge</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Set New Password</div>
        </div>
        <div className="card">
          {!tokenValid ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#374151', marginBottom: 16 }}>This reset link is invalid or has expired. Please request a new one.</p>
              <a href="/password-reset"><button className="btn-primary">Request New Link</button></a>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ color: '#374151', marginBottom: 16 }}>Password updated successfully. You can now sign in.</p>
              <button className="btn-primary" onClick={() => navigate('/login')}>Sign In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {errors.submit && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 6, marginBottom: 16 }}>{errors.submit}</div>}
              <div className="form-group">
                <label>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={errors.password ? 'error' : ''} placeholder="At least 8 characters" />
                {errors.password && <div className="error-msg">{errors.password}</div>}
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={errors.confirm ? 'error' : ''} placeholder="Repeat password" />
                {errors.confirm && <div className="error-msg">{errors.confirm}</div>}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Saving...' : 'Set Password'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
