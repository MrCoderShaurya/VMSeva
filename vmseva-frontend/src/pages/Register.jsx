import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

const rules = [
  { id: 'len',     label: 'At least 8 characters',       test: p => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',         test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',         test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number',                   test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character',        test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(p) {
  const passed = rules.filter(r => r.test(p)).length;
  if (!p) return { score: 0, label: '', color: '' };
  if (passed <= 2) return { score: 20, label: 'Weak', color: '#ff4444' };
  if (passed === 3) return { score: 50, label: 'Fair', color: '#ffaa00' };
  if (passed === 4) return { score: 75, label: 'Good', color: '#44aaff' };
  return { score: 100, label: 'Strong', color: '#00cc66' };
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verifiedToken, setVerifiedToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const navigate = useNavigate();
  const strength = getStrength(password);
  const allRulesPassed = rules.filter(r => r.test(password)).length >= 4;
  const passwordsMatch = password === confirm && confirm.length > 0;

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const sendOTP = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.sendOTP({ email, type: 'register' });
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpKey = (i, e) => {
    const val = e.target.value.replace(/\D/, '');
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const verifyOTP = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: otp.join(''), type: 'register' });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const register = async (e) => {
    e?.preventDefault();
    if (!allRulesPassed) return setError('Password does not meet requirements');
    if (!passwordsMatch) return setError('Passwords do not match');
    setError('');
    setLoading(true);
    try {
      await authAPI.register({ email, password, full_name: fullName });
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">VMSeva</div>
        <div className="auth-subtitle">
          {step === 1 && 'Create your account'}
          {step === 2 && 'Verify your email'}
          {step === 3 && 'Set your password'}
        </div>

        <div className="steps">
          {[1, 2, 3].map(s => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
          ))}
        </div>

        {error && <div className="msg-error">{error}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={sendOTP}>
            <div className="field">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe"
                value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={verifyOTP}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 4 }}>
              We sent a 6-digit code to
            </p>
            <p style={{ fontSize: 14, color: 'var(--text)', textAlign: 'center', fontWeight: 600, marginBottom: 4 }}>
              {email}
            </p>
            <div className="otp-grid">
              {otp.map((v, i) => (
                <input key={i} ref={el => otpRefs.current[i] = el}
                  className="otp-input" type="text" inputMode="numeric"
                  maxLength={1} value={v}
                  onChange={e => handleOtpKey(i, e)}
                  onKeyDown={e => e.key === 'Backspace' && handleOtpKey(i, e)} />
              ))}
            </div>
            <button className="btn-primary" type="submit"
              disabled={loading || otp.join('').length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="resend-row">
              {resendTimer > 0
                ? `Resend in ${resendTimer}s`
                : <><button className="resend-btn" type="button" onClick={sendOTP}>Resend OTP</button></>
              }
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button type="button" className="btn-ghost" style={{ width: 'auto', padding: '6px 16px', fontSize: 12 }}
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}>
                ← Change email
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — Password */}
        {step === 3 && (
          <form onSubmit={register}>
            <div className="field">
              <label>Password</label>
              <div className="field-row">
                <input type={showPw ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
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
                    <span className="dot" />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            <div className="field" style={{ marginTop: 14 }}>
              <label>Confirm Password</label>
              <div className="field-row">
                <input type={showCf ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        <div className="auth-links">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
