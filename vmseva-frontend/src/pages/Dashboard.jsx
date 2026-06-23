import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { usersAPI } from '../api';
import api from '../api';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [logs, setLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');

  const isAdmin = user?.roles?.some(r => r.name === 'Admin');

  useEffect(() => {
    if (!isAdmin) return;
    usersAPI.getAll().then(r => setUsers(r.data));
    api.get('/admin/roles').then(r => setAllRoles(r.data));
    api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => {});
  }, [isAdmin]);

  const flash = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 2500);
  };

  const loadRoles = async (id) => {
    const { data } = await usersAPI.getRoles(id);
    setUserRoles(prev => ({ ...prev, [id]: data }));
    return data;
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!userRoles[id]) await loadRoles(id);
  };

  const toggleRole = async (userId, role) => {
    const assigned = userRoles[userId] || [];
    const has = assigned.some(r => r.id === role.id);
    try {
      if (has) await usersAPI.removeRole(userId, role.id);
      else await usersAPI.assignRole(userId, role.id);
      await loadRoles(userId);
      flash(has ? `Removed "${role.name}"` : `Assigned "${role.name}"`);
    } catch (err) {
      flash(err.response?.data?.message || 'Error', false);
    }
  };

  const toggleStatus = async (id) => {
    const { data } = await usersAPI.toggleStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: data.is_active } : u));
    flash(data.is_active ? 'User activated' : 'User deactivated');
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div style={s.page}>

        {/* Welcome */}
        <div style={s.welcome}>
          <div style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</div>
          <div>
            <div style={s.name}>Welcome, {user?.full_name || user?.email}</div>
            <div style={s.sub}>{user?.roles?.map(r => r.name).join(', ') || 'No roles assigned'}</div>
          </div>
          {msg.text && (
            <span style={{ ...s.flash, background: msg.ok ? '#00cc6618' : '#ff444418', color: msg.ok ? '#00cc66' : '#ff4444', border: `1px solid ${msg.ok ? '#00cc6633' : '#ff444433'}` }}>
              {msg.text}
            </span>
          )}
        </div>

        {/* Non-admin view */}
        {!isAdmin && (
          <div style={s.card}>
            <div style={s.cardLabel}>Your Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ ...s.dot, background: user?.is_active ? '#00cc66' : '#ff4444' }} />
              <span style={{ fontSize: 14 }}>{user?.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {user?.roles?.length
                ? user.roles.map(r => <span key={r.id} style={s.badge}>{r.name}</span>)
                : <span style={s.muted}>No roles assigned</span>}
            </div>
          </div>
        )}

        {/* Admin view */}
        {isAdmin && (
          <>
            {/* Stats */}
            <div style={s.stats}>
              <div style={s.stat}>
                <div style={s.statNum}>{users.length}</div>
                <div style={s.statLabel}>Total Users</div>
              </div>
              <div style={s.stat}>
                <div style={s.statNum}>{users.filter(u => u.is_active).length}</div>
                <div style={s.statLabel}>Active</div>
              </div>
              <div style={s.stat}>
                <div style={s.statNum}>{users.filter(u => !u.is_active).length}</div>
                <div style={s.statLabel}>Inactive</div>
              </div>
              <div style={s.stat}>
                <div style={s.statNum}>{logs.length}</div>
                <div style={s.statLabel}>Audit Logs</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(tab === 'users' ? s.tabActive : {}) }} onClick={() => setTab('users')}>Users</button>
              <button style={{ ...s.tab, ...(tab === 'logs' ? s.tabActive : {}) }} onClick={() => setTab('logs')}>Audit Logs</button>
            </div>

            {/* Users Tab */}
            {tab === 'users' && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardLabel}>All Users ({filtered.length})</div>
                  <input style={s.search} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div style={s.list}>
                  {filtered.map(u => {
                    const isMe = u.id === user?.id;
                    const expanded = expandedId === u.id;
                    const roles = userRoles[u.id] || [];
                    return (
                      <div key={u.id} style={{ ...s.userCard, borderColor: expanded ? '#6c63ff55' : 'var(--border)' }}>
                        <div style={s.userRow}>
                          <div style={s.uAvatar}>{(u.full_name || u.email)[0].toUpperCase()}</div>
                          <div style={s.uInfo}>
                            <div style={s.uName}>
                              {u.full_name || '—'}
                              {isMe && <span style={s.youBadge}>You</span>}
                            </div>
                            <div style={s.uEmail}>{u.email}</div>
                            {expanded && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                                {roles.length
                                  ? roles.map(r => <span key={r.id} style={s.roleBadge}>{r.name}</span>)
                                  : <span style={s.muted}>No roles</span>}
                              </div>
                            )}
                          </div>
                          <div style={s.uActions}>
                            <span style={{ ...s.statusPill, background: u.is_active ? '#00cc6618' : '#ff444418', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {!isMe && <button style={s.actionBtn} onClick={() => toggleStatus(u.id)}>{u.is_active ? 'Deactivate' : 'Activate'}</button>}
                            {!isMe && (
                              <button style={{ ...s.actionBtn, background: expanded ? '#6c63ff' : 'var(--surface2)', color: expanded ? '#fff' : 'var(--text)' }}
                                onClick={() => toggleExpand(u.id)}>
                                {expanded ? 'Done' : 'Roles'}
                              </button>
                            )}
                          </div>
                        </div>
                        {expanded && (
                          <div style={s.rolePanel}>
                            <div style={s.rolePanelLabel}>Assign or remove roles</div>
                            <div style={s.roleGrid}>
                              {allRoles.map(role => {
                                const has = roles.some(r => r.id === role.id);
                                return (
                                  <button key={role.id} onClick={() => toggleRole(u.id, role)}
                                    style={{ ...s.roleBtn, background: has ? '#6c63ff' : 'var(--surface2)', border: `1px solid ${has ? '#6c63ff' : 'var(--border)'}` }}>
                                    {has ? '✓ ' : '+ '}{role.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filtered.length === 0 && <div style={{ ...s.muted, padding: '20px 0', textAlign: 'center' }}>No users found</div>}
                </div>
              </div>
            )}

            {/* Audit Logs Tab */}
            {tab === 'logs' && (
              <div style={s.card}>
                <div style={s.cardLabel}>Audit Logs</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {logs.length === 0 && <div style={{ ...s.muted, padding: '20px 0', textAlign: 'center' }}>No logs yet</div>}
                  {logs.map(l => (
                    <div key={l.id} style={s.logRow}>
                      <span style={s.logAction}>{l.action}</span>
                      <span style={s.logBy}>{l.performed_by || 'system'}</span>
                      <span style={s.logMeta}>{l.ip_address}</span>
                      <span style={s.logTime}>{new Date(l.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const s = {
  page: { padding: '28px 24px', maxWidth: 960, margin: '0 auto' },
  welcome: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 18, fontWeight: 600 },
  sub: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  flash: { marginLeft: 'auto', fontSize: 12, padding: '5px 14px', borderRadius: 20, fontWeight: 500 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  badge: { fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 20 },
  muted: { fontSize: 12, color: 'var(--text-muted)' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 },
  stat: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' },
  statNum: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 16 },
  tab: { padding: '7px 18px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' },
  tabActive: { background: 'var(--surface)', color: 'var(--text)', borderColor: 'var(--border-hover)' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  search: { padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 12, outline: 'none', width: 200 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  userCard: { background: 'var(--surface2)', border: '1px solid', borderRadius: 10, padding: '12px 16px', transition: 'border-color 0.2s' },
  userRow: { display: 'flex', alignItems: 'center', gap: 12 },
  uAvatar: { width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 },
  uInfo: { flex: 1, minWidth: 0 },
  uName: { fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  uEmail: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 },
  youBadge: { fontSize: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 20 },
  uActions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  statusPill: { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 },
  actionBtn: { fontSize: 11, padding: '5px 12px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' },
  roleBadge: { fontSize: 11, background: '#6c63ff22', color: '#a09cf7', border: '1px solid #6c63ff33', padding: '2px 8px', borderRadius: 10 },
  rolePanel: { marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' },
  rolePanelLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 },
  roleGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  roleBtn: { fontSize: 12, padding: '5px 12px', color: '#fff', borderRadius: 6, cursor: 'pointer', transition: 'background 0.15s' },
  logRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 7, background: 'var(--surface2)' },
  logAction: { fontSize: 12, fontWeight: 500, background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 5, flexShrink: 0 },
  logBy: { fontSize: 12, color: 'var(--text-secondary)', flex: 1 },
  logMeta: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' },
  logTime: { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },
};
