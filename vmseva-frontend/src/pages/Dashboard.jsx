import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { usersAPI } from '../api';
import api from '../api';

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [logs, setLogs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);

  const isAdmin = user?.roles?.some(r => r.name === 'Admin');

  useEffect(() => {
    if (!isAdmin) return;
    // Load everything in parallel, pre-load all user roles to avoid per-click lag
    Promise.all([
      usersAPI.getAll(),
      api.get('/admin/roles'),
      api.get('/admin/audit-logs').catch(() => ({ data: [] })),
    ]).then(async ([usersRes, rolesRes, logsRes]) => {
      setUsers(usersRes.data);
      setAllRoles(rolesRes.data);
      setLogs(logsRes.data);
      // Pre-fetch roles for all users at once
      const roleMap = {};
      await Promise.all(usersRes.data.map(async u => {
        const { data } = await usersAPI.getRoles(u.id);
        roleMap[u.id] = data;
      }));
      setUserRoles(roleMap);
    });
  }, [isAdmin]);

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 2500);
  }, []);

  const toggleRole = async (userId, role) => {
    const has = (userRoles[userId] || []).some(r => r.id === role.id);
    try {
      if (has) await usersAPI.removeRole(userId, role.id);
      else await usersAPI.assignRole(userId, role.id);
      const { data } = await usersAPI.getRoles(userId);
      setUserRoles(prev => ({ ...prev, [userId]: data }));
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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalLogPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE);

  return (
    <>
      <style>{`
        .row-hover:hover { background: rgba(255,255,255,0.03) !important; }
        .role-chip { transition: background 0.15s, border-color 0.15s, transform 0.1s; }
        .role-chip:hover { transform: scale(1.04); }
        .action-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .action-btn:hover { border-color: #555 !important; color: #fff !important; }
        .expand-row { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .tab-btn { transition: background 0.15s, color 0.15s; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <Navbar />
      <div style={s.page}>

        {/* Welcome */}
        <div style={s.welcome}>
          <div style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={s.name}>Welcome, {user?.full_name || user?.email}</div>
            <div style={s.sub}>{user?.roles?.map(r => r.name).join(', ') || 'No roles assigned'}</div>
          </div>
          {msg.text && (
            <span style={{ ...s.flash, background: msg.ok ? '#00cc6618' : '#ff444418', color: msg.ok ? '#00cc66' : '#ff4444', border: `1px solid ${msg.ok ? '#00cc6633' : '#ff444433'}` }}>
              {msg.text}
            </span>
          )}
        </div>

        {/* Non-admin */}
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

        {/* Admin */}
        {isAdmin && (
          <>
            {/* Stats */}
            <div style={s.stats}>
              {[
                { num: users.length, label: 'Total Users' },
                { num: users.filter(u => u.is_active).length, label: 'Active' },
                { num: users.filter(u => !u.is_active).length, label: 'Inactive' },
                { num: logs.length, label: 'Audit Logs' },
              ].map(({ num, label }) => (
                <div key={label} style={s.stat}>
                  <div style={s.statNum}>{num}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              {['users', 'logs'].map(t => (
                <button key={t} className="tab-btn"
                  style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }}
                  onClick={() => setTab(t)}>
                  {t === 'users' ? 'Users' : 'Audit Logs'}
                </button>
              ))}
            </div>

            {/* Users Sheet */}
            {tab === 'users' && (
              <div style={s.card}>
                <div style={s.cardHeader}>
                  <div style={s.cardLabel}>All Users ({filtered.length})</div>
                  <input style={s.search} placeholder="Search name or email..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>

                {/* Table */}
                <div style={s.table}>
                  {/* Header */}
                  <div style={s.thead}>
                    <div style={{ ...s.th, width: 40 }}>#</div>
                    <div style={{ ...s.th, flex: 1.2 }}>Name</div>
                    <div style={{ ...s.th, flex: 2 }}>Email</div>
                    <div style={{ ...s.th, flex: 2 }}>Roles</div>
                    <div style={{ ...s.th, width: 80 }}>Status</div>
                    <div style={{ ...s.th, width: 160, textAlign: 'right' }}>Actions</div>
                  </div>

                  {/* Rows */}
                  {paginated.map((u, idx) => {
                    const isMe = u.id === user?.id;
                    const expanded = expandedId === u.id;
                    const roles = userRoles[u.id] || [];
                    return (
                      <div key={u.id}>
                        <div className="row-hover" style={{ ...s.trow, background: expanded ? 'rgba(108,99,255,0.06)' : 'transparent' }}>
                          <div style={{ ...s.td, width: 40, color: 'var(--text-muted)', fontSize: 11 }}>
                            {(page - 1) * PAGE_SIZE + idx + 1}
                          </div>
                          <div style={{ ...s.td, flex: 1.2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={s.uAvatar}>{(u.full_name || u.email)[0].toUpperCase()}</div>
                              <span style={{ fontSize: 13, fontWeight: 500 }}>
                                {u.full_name || '—'}
                                {isMe && <span style={s.youBadge}>You</span>}
                              </span>
                            </div>
                          </div>
                          <div style={{ ...s.td, flex: 2, fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                          <div style={{ ...s.td, flex: 2 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {roles.length
                                ? roles.map(r => <span key={r.id} style={s.roleBadge}>{r.name}</span>)
                                : <span style={s.muted}>—</span>}
                            </div>
                          </div>
                          <div style={{ ...s.td, width: 80 }}>
                            <span style={{ ...s.statusPill, background: u.is_active ? '#00cc6618' : '#ff444418', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ ...s.td, width: 160, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {!isMe && (
                              <>
                                <button className="action-btn" style={s.actionBtn} onClick={() => toggleStatus(u.id)}>
                                  {u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button className="action-btn"
                                  style={{ ...s.actionBtn, background: expanded ? '#6c63ff' : 'transparent', color: expanded ? '#fff' : 'var(--text-secondary)', borderColor: expanded ? '#6c63ff' : 'var(--border)' }}
                                  onClick={() => setExpandedId(expanded ? null : u.id)}>
                                  Roles
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expanded role row */}
                        {expanded && (
                          <div className="expand-row" style={s.expandRow}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 10 }}>Assign / remove:</span>
                            {allRoles.map(role => {
                              const has = roles.some(r => r.id === role.id);
                              return (
                                <button key={role.id} className="role-chip"
                                  style={{ ...s.roleChip, background: has ? '#6c63ff' : 'var(--surface2)', border: `1px solid ${has ? '#6c63ff' : 'var(--border)'}`, color: has ? '#fff' : 'var(--text-secondary)' }}
                                  onClick={() => toggleRole(u.id, role)}>
                                  {has ? '✓ ' : '+ '}{role.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {paginated.length === 0 && (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No users found
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={s.pagination}>
                    <button className="page-btn" style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className="page-btn" style={{ ...s.pageBtn, ...(page === p ? s.pageBtnActive : {}) }} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" style={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs */}
            {tab === 'logs' && (
              <div style={s.card}>
                <div style={s.cardLabel}>Audit Logs</div>
                <div style={s.table}>
                  <div style={s.thead}>
                    <div style={{ ...s.th, flex: 1.5 }}>Action</div>
                    <div style={{ ...s.th, flex: 2 }}>Performed By</div>
                    <div style={{ ...s.th, flex: 1.5 }}>IP Address</div>
                    <div style={{ ...s.th, flex: 2 }}>Time</div>
                  </div>
                  {paginatedLogs.map(l => (
                    <div key={l.id} className="row-hover" style={s.trow}>
                      <div style={{ ...s.td, flex: 1.5 }}><span style={s.logAction}>{l.action}</span></div>
                      <div style={{ ...s.td, flex: 2, fontSize: 12, color: 'var(--text-secondary)' }}>{l.performed_by || 'system'}</div>
                      <div style={{ ...s.td, flex: 1.5, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.ip_address}</div>
                      <div style={{ ...s.td, flex: 2, fontSize: 11, color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  {paginatedLogs.length === 0 && (
                    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No logs yet</div>
                  )}
                </div>
                {totalLogPages > 1 && (
                  <div style={s.pagination}>
                    <button className="page-btn" style={s.pageBtn} disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>← Prev</button>
                    {Array.from({ length: totalLogPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className="page-btn" style={{ ...s.pageBtn, ...(logPage === p ? s.pageBtnActive : {}) }} onClick={() => setLogPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" style={s.pageBtn} disabled={logPage === totalLogPages} onClick={() => setLogPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const s = {
  page: { padding: '28px 24px', maxWidth: 1100, margin: '0 auto' },
  welcome: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' },
  avatar: { width: 44, height: 44, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 18, fontWeight: 600 },
  sub: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
  flash: { fontSize: 12, padding: '5px 14px', borderRadius: 20, fontWeight: 500 },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  badge: { fontSize: 12, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 10px', borderRadius: 20 },
  muted: { fontSize: 11, color: 'var(--text-muted)' },
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
  search: { padding: '7px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none', width: 220 },
  table: { width: '100%' },
  thead: { display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 },
  th: { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  trow: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, transition: 'background 0.15s' },
  td: { fontSize: 13, paddingRight: 12 },
  uAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  youBadge: { fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '1px 6px', borderRadius: 20, marginLeft: 6 },
  roleBadge: { fontSize: 11, background: '#6c63ff18', color: '#a09cf7', border: '1px solid #6c63ff33', padding: '2px 7px', borderRadius: 10 },
  statusPill: { fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  actionBtn: { fontSize: 11, padding: '4px 10px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' },
  expandRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '10px 12px 12px 90px', borderBottom: '1px solid var(--border)', marginBottom: 2 },
  roleChip: { fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' },
  logAction: { fontSize: 11, fontWeight: 500, background: 'var(--surface2)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 5 },
  pagination: { display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' },
  pageBtn: { padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' },
  pageBtnActive: { background: '#6c63ff', color: '#fff', borderColor: '#6c63ff' },
};
