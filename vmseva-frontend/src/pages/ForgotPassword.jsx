import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

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
      await authAPI.sendOTP({ email, type: 'forgot' });
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
      await authAPI.verifyOTP({ email, otp: otp.join(''), type: 'forgot' });
      window.location.href = `/reset-password?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">VMSeva</div>
        <div className="auth-subtitle">
          {step === 1 ? 'Reset your password' : 'Check your email'}
        </div>

        <div className="steps">
          {[1, 2].map(s => (
            <div key={s} className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`} />
          ))}
        </div>

        {error && <div className="msg-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={sendOTP}>
            <div className="field">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

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
                : <button className="resend-btn" type="button" onClick={sendOTP}>Resend OTP</button>
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

        <div className="auth-links">
          <Link to="/login">← Back to Sign in</Link>
        </div>
      </div>
    </div>
  );
}
