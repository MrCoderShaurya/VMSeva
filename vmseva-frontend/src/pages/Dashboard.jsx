import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, hasRole } = useAuth();

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.welcome}>
          <div style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</div>
          <div>
            <div style={s.name}>Welcome back, {user?.full_name || user?.email}</div>
            <div style={s.sub}>{user?.email}</div>
          </div>
        </div>

        <div style={s.grid}>
          <div style={s.card}>
            <div style={s.cardLabel}>Your Roles</div>
            <div style={s.badges}>
              {user?.roles?.length
                ? user.roles.map(r => <span key={r.id} style={s.badge}>{r.name}</span>)
                : <span style={s.empty}>No roles assigned</span>}
            </div>
          </div>

          <div style={s.card}>
            <div style={s.cardLabel}>Account Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ ...s.dot, background: user?.is_active ? '#00cc66' : '#ff4444' }} />
              <span style={{ fontSize: 14 }}>{user?.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {hasRole('Admin') && (
            <Link to="/users" style={{ ...s.card, ...s.actionCard, textDecoration: 'none' }}>
              <div style={s.cardLabel}>User Management</div>
              <div style={s.cardDesc}>Manage users, assign roles, activate/deactivate accounts</div>
              <div style={s.arrow}>→</div>
            </Link>
          )}

          {hasRole('Admin') && (
            <Link to="/admin" style={{ ...s.card, ...s.actionCard, textDecoration: 'none' }}>
              <div style={s.cardLabel}>Admin Panel</div>
              <div style={s.cardDesc}>View audit logs and system information</div>
              <div style={s.arrow}>→</div>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  welcome: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 20, fontWeight: 600 },
  sub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' },
  actionCard: { cursor: 'pointer', transition: 'border-color 0.2s', position: 'relative', color: 'var(--text)' },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 },
  cardDesc: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 },
  arrow: { position: 'absolute', top: 20, right: 20, fontSize: 16, color: 'var(--text-muted)' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 20 },
  empty: { fontSize: 13, color: 'var(--text-muted)' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
};
