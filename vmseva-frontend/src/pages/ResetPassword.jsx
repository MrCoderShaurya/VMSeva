import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

const rules = [
  { id: 'len',     label: 'At least 8 characters',  test: p => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',    test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',    test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number',              test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character',   test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(p) {
  const passed = rules.filter(r => r.test(p)).length;
  if (!p) return { score: 0, label: '', color: '' };
  if (passed <= 2) return { score: 20, label: 'Weak', color: '#ff4444' };
  if (passed === 3) return { score: 50, label: 'Fair', color: '#ffaa00' };
  if (passed === 4) return { score: 75, label: 'Good', color: '#44aaff' };
  return { score: 100, label: 'Strong', color: '#00cc66' };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const strength = getStrength(password);
  const allRulesPassed = rules.filter(r => r.test(password)).length >= 4;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!allRulesPassed) return setError('Password does not meet requirements');
    if (!passwordsMatch) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, new_password: password });
      setMsg('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">VMSeva</div>
        <div className="auth-subtitle">Set a new password</div>

        {error && <div className="msg-error">{error}</div>}
        {msg && <div className="msg-success">{msg}</div>}

        {!msg && (
          <form onSubmit={submit}>
            <div className="field">
              <label>New Password</label>
              <div className="field-row">
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="field-eye" onClick={() => setShowPw(p => !p)}>
                  {showPw
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.293 2.207M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {password && (
                <>
                  <div className="strength-bar">
                    <div className="strength-fill" style={{ width: `${strength.score}%`, background: strength.color }} />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
                </>
              )}
            </div>

            {password && (
              <div className="pw-rules">
                {rules.map(r => (
                  <div key={r.id} className={`pw-rule ${r.test(password) ? 'ok' : ''}`}>
                    <span className="dot" />{r.label}
                  </div>
                ))}
              </div>
            )}

            <div className="field" style={{ marginTop: 14 }}>
              <label>Confirm Password</label>
              <div className="field-row">
                <input type={showCf ? 'text' : 'password'} placeholder="••••••••"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                  style={{ borderColor: confirm && !passwordsMatch ? 'var(--error)' : undefined }} />
                <button type="button" className="field-eye" onClick={() => setShowCf(p => !p)}>
                  {showCf
                    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.293 2.207M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
              {confirm && !passwordsMatch && (
                <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>Passwords do not match</p>
              )}
              {confirm && passwordsMatch && (
                <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ Passwords match</p>
              )}
            </div>

            <button className="btn-primary" type="submit"
              disabled={loading || !allRulesPassed || !passwordsMatch}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link to="/login">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
