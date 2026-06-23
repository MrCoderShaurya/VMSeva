import { useState } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(''); setError(''); setLoading(true);
    try {
      await authAPI.changePassword(form);
      setMsg('Password changed successfully');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  const EyeIcon = ({ show }) => show
    ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7a9.97 9.97 0 016.293 2.207M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" /></svg>
    : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.avatarRow}>
            <div style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</div>
            <div>
              <div style={s.name}>{user?.full_name || '—'}</div>
              <div style={s.email}>{user?.email}</div>
            </div>
          </div>

          <div style={s.infoGrid}>
            <div style={s.infoItem}>
              <div style={s.infoLabel}>Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...s.dot, background: user?.is_active ? '#00cc66' : '#ff4444' }} />
                <span style={s.infoValue}>{user?.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div style={s.infoItem}>
              <div style={s.infoLabel}>Roles</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {user?.roles?.length
                  ? user.roles.map(r => <span key={r.id} style={s.badge}>{r.name}</span>)
                  : <span style={s.muted}>None</span>}
              </div>
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.section}>Change Password</div>
          {error && <div className="msg-error">{error}</div>}
          {msg && <div className="msg-success">{msg}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Current Password</label>
              <div className="field-row">
                <input type={showOld ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                  value={form.old_password} onChange={e => setForm({ ...form, old_password: e.target.value })} required />
                <button type="button" className="field-eye" onClick={() => setShowOld(p => !p)}>
                  <EyeIcon show={showOld} />
                </button>
              </div>
            </div>
            <div className="field">
              <label>New Password</label>
              <div className="field-row">
                <input type={showNew ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                  value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} required />
                <button type="button" className="field-eye" onClick={() => setShowNew(p => !p)}>
                  <EyeIcon show={showNew} />
                </button>
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '32px 24px', maxWidth: 520, margin: '0 auto' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px' },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 17, fontWeight: 600 },
  email: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 },
  infoItem: { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' },
  infoLabel: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 },
  infoValue: { fontSize: 13 },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  badge: { fontSize: 11, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '3px 8px', borderRadius: 20 },
  muted: { fontSize: 13, color: 'var(--text-muted)' },
  divider: { height: 1, background: 'var(--border)', margin: '0 0 24px' },
  section: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 },
};
