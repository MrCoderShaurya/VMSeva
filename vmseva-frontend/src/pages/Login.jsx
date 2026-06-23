import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password, rememberDevice, rememberDevice);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">VMSeva</div>
        <div className="auth-subtitle">Sign in to your account</div>

        {error && <div className="msg-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" autoComplete="email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="field-row">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="field-eye" onClick={() => setShowPw(p => !p)}>
                {showPw
                  ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.293 2.207M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                  : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                }
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text-secondary)' }}>
              <input type="checkbox" checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)}
                style={{ accentColor:'#fff', width:14, height:14, cursor:'pointer' }} />
              Remember this device
            </label>
            <Link to="/forgot-password" style={{ fontSize:13, color:'var(--text-secondary)', textDecoration:'none' }}>
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="auth-divider" style={{ marginTop:20 }}><span>or</span></div>
        <div className="auth-links" style={{ marginTop:0 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
