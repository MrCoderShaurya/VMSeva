import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Link } from 'react-router-dom';
import { usersAPI } from '../api';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    if (hasRole('Admin')) {
      usersAPI.getAll().then(r => setRecentUsers(r.data.slice(0, 5)));
    }
  }, [user]);

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
        </div>

        {hasRole('Admin') && (
          <div style={{ ...s.card, marginTop: 20 }}>
            <div style={s.cardHeader}>
              <div style={s.cardLabel}>Recent Users</div>
              <Link to="/users" style={s.viewAll}>View all & manage roles →</Link>
            </div>
            <div style={s.userList}>
              {recentUsers.map(u => (
                <div key={u.id} style={s.userRow}>
                  <div style={s.uAvatar}>{(u.full_name || u.email)[0].toUpperCase()}</div>
                  <div style={s.uInfo}>
                    <div style={s.uName}>{u.full_name || '—'}</div>
                    <div style={s.uEmail}>{u.email}</div>
                  </div>
                  <span style={{ ...s.statusDot, background: u.is_active ? '#00cc6618' : '#ff444418', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <Link to="/users" style={s.manageBtn}>Manage →</Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const s = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  welcome: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 },
  avatar: { width: 48, height: 48, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 20, fontWeight: 600 },
  sub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  viewAll: { fontSize: 12, color: '#6c63ff', textDecoration: 'none' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  badge: { fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 20 },
  empty: { fontSize: 13, color: 'var(--text-muted)' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  userList: { display: 'flex', flexDirection: 'column', gap: 4 },
  userRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)' },
  uAvatar: { width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  uInfo: { flex: 1, minWidth: 0 },
  uName: { fontSize: 13, fontWeight: 500 },
  uEmail: { fontSize: 11, color: 'var(--text-secondary)' },
  statusDot: { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500, flexShrink: 0 },
  manageBtn: { fontSize: 11, color: '#6c63ff', textDecoration: 'none', flexShrink: 0 },
};
