import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { usersAPI } from '../api';
import api from '../api';

const PAGE_SIZE = 15;

export default function Dashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);

  const isAdmin = user?.roles?.some(r => r.name === 'Admin');

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      usersAPI.getAll(),
      api.get('/admin/roles'),
      api.get('/admin/audit-logs').catch(() => ({ data: [] })),
    ]).then(async ([usersRes, rolesRes, logsRes]) => {
      setUsers(usersRes.data);
      setAllRoles(rolesRes.data);
      setLogs(logsRes.data);
      const map = {};
      await Promise.all(usersRes.data.map(async u => {
        const { data } = await usersAPI.getRoles(u.id);
        map[u.id] = data;
      }));
      setUserRoles(map);
    });
  }, [isAdmin]);

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 2000);
  }, []);

  // OPTIMISTIC — update UI instantly, sync in background
  const toggleRole = useCallback(async (userId, role) => {
    const current = userRoles[userId] || [];
    const has = current.some(r => r.id === role.id);
    const optimistic = has
      ? current.filter(r => r.id !== role.id)
      : [...current, role];
    setUserRoles(prev => ({ ...prev, [userId]: optimistic }));
    try {
      if (has) await usersAPI.removeRole(userId, role.id);
      else await usersAPI.assignRole(userId, role.id);
      flash(has ? `− ${role.name}` : `+ ${role.name}`);
    } catch {
      setUserRoles(prev => ({ ...prev, [userId]: current }));
      flash('Failed', false);
    }
  }, [userRoles, flash]);

  const toggleStatus = useCallback(async (id) => {
    const u = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    try {
      await usersAPI.toggleStatus(id);
      flash(u.is_active ? 'Deactivated' : 'Activated');
    } catch {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
    }
  }, [users, flash]);

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
        :root { --sheet-border: #2a2a2a; --sheet-head: #161616; --row-hover: rgba(255,255,255,0.025); }
        .sr { transition: background 0.1s; }
        .sr:hover { background: var(--row-hover) !important; }
        .rc { transition: background 0.1s, color 0.1s, border-color 0.1s, transform 0.08s; cursor:pointer; user-select:none; }
        .rc:hover { transform: scale(1.05); }
        .rc:active { transform: scale(0.97); }
        .ab { transition: background 0.1s, color 0.1s, border-color 0.1s; cursor:pointer; }
        .ab:hover { border-color: #555 !important; color: #fff !important; }
        .tb { transition: background 0.15s, color 0.15s, border-color 0.15s; cursor:pointer; }
        .er { animation: slideDown 0.12s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .flash-in { animation: flashIn 0.2s ease; }
        @keyframes flashIn { from { opacity:0; transform:translateX(8px); } to { opacity:1; transform:translateX(0); } }
        input:focus { border-color: #444 !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        .pb:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <Navbar />
      <div style={s.page}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={s.name}>Welcome, {user?.full_name || user?.email}</div>
            <div style={s.sub}>{user?.roles?.map(r => r.name).join(' · ') || 'No roles'}</div>
          </div>
          {msg.text && (
            <span key={msg.text} className="flash-in" style={{ ...s.flash, background: msg.ok ? '#00cc6615' : '#ff444415', color: msg.ok ? '#00cc66' : '#ff4444', border: `1px solid ${msg.ok ? '#00cc6630' : '#ff444430'}` }}>
              {msg.text}
            </span>
          )}
        </div>

        {!isAdmin && (
          <div style={s.card}>
            <div style={s.cardLabel}>Your Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <span style={{ ...s.dot, background: user?.is_active ? '#00cc66' : '#ff4444' }} />
              <span style={{ fontSize: 13 }}>{user?.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {user?.roles?.length ? user.roles.map(r => <span key={r.id} style={s.badge}>{r.name}</span>) : <span style={s.muted}>No roles</span>}
            </div>
          </div>
        )}

        {isAdmin && (
          <>
            {/* Stats */}
            <div style={s.stats}>
              {[
                { num: users.length, label: 'Total Users', color: '#6c63ff' },
                { num: users.filter(u => u.is_active).length, label: 'Active', color: '#00cc66' },
                { num: users.filter(u => !u.is_active).length, label: 'Inactive', color: '#ff4444' },
                { num: logs.length, label: 'Audit Logs', color: '#ffaa00' },
              ].map(({ num, label, color }) => (
                <div key={label} style={s.stat}>
                  <div style={{ ...s.statNum, color }}>{num}</div>
                  <div style={s.statLabel}>{label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={s.tabs}>
              {[{ k: 'users', l: 'Users' }, { k: 'logs', l: 'Audit Logs' }].map(({ k, l }) => (
                <button key={k} className="tb"
                  style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }}
                  onClick={() => setTab(k)}>{l}
                </button>
              ))}
              {tab === 'users' && (
                <input style={s.search} placeholder="Search..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              )}
            </div>

            {/* ── SHEET ── */}
            {tab === 'users' && (
              <div style={s.sheet}>
                {/* Column headers */}
                <div style={s.colHead}>
                  <div style={{ ...s.col, ...s.cNum }}>#</div>
                  <div style={{ ...s.col, ...s.cName }}>Name</div>
                  <div style={{ ...s.col, ...s.cEmail }}>Email</div>
                  <div style={{ ...s.col, ...s.cRoles }}>Roles</div>
                  <div style={{ ...s.col, ...s.cStatus }}>Status</div>
                  <div style={{ ...s.col, ...s.cAct }}>Actions</div>
                </div>

                {paginated.map((u, idx) => {
                  const isMe = u.id === user?.id;
                  const exp = expandedId === u.id;
                  const roles = userRoles[u.id] || [];
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <div key={u.id} style={{ borderBottom: '1px solid var(--sheet-border)' }}>
                      {/* Main row */}
                      <div className="sr" style={{ ...s.row, background: exp ? '#6c63ff08' : 'transparent' }}>
                        <div style={{ ...s.cell, ...s.cNum, color: '#444', fontSize: 11 }}>{rowNum}</div>
                        <div style={{ ...s.cell, ...s.cName }}>
                          <div style={s.uAvatar}>{(u.full_name || u.email)[0].toUpperCase()}</div>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {u.full_name || '—'}
                            {isMe && <span style={s.you}>me</span>}
                          </span>
                        </div>
                        <div style={{ ...s.cell, ...s.cEmail, fontSize: 12, color: '#666' }}>{u.email}</div>
                        <div style={{ ...s.cell, ...s.cRoles }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {roles.length
                              ? roles.map(r => <span key={r.id} style={s.roleTag}>{r.name}</span>)
                              : <span style={{ fontSize: 11, color: '#444' }}>—</span>}
                          </div>
                        </div>
                        <div style={{ ...s.cell, ...s.cStatus }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: u.is_active ? '#00cc6615' : '#ff444415', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ ...s.cell, ...s.cAct, gap: 5 }}>
                          {!isMe && (
                            <>
                              <button className="ab" style={s.ab} onClick={() => toggleStatus(u.id)}>
                                {u.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button className="ab"
                                style={{ ...s.ab, background: exp ? '#6c63ff' : 'transparent', color: exp ? '#fff' : '#888', borderColor: exp ? '#6c63ff' : '#333' }}
                                onClick={() => setExpandedId(exp ? null : u.id)}>
                                Roles
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Role assignment row */}
                      {exp && (
                        <div className="er" style={s.roleRow}>
                          <span style={{ fontSize: 11, color: '#555', marginRight: 8, flexShrink: 0 }}>Assign roles:</span>
                          {allRoles.map(role => {
                            const has = roles.some(r => r.id === role.id);
                            return (
                              <button key={role.id} className="rc"
                                style={{ ...s.rc, background: has ? '#6c63ff' : '#1a1a1a', border: `1px solid ${has ? '#6c63ff' : '#2a2a2a'}`, color: has ? '#fff' : '#888' }}
                                onClick={() => toggleRole(u.id, role)}>
                                {has ? '✓ ' : ''}{role.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {paginated.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 13 }}>No users found</div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={s.pag}>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="pb ab" style={s.pb} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className="pb ab" style={{ ...s.pb, ...(page === p ? s.pbActive : {}) }} onClick={() => setPage(p)}>{p}</button>
                      ))}
                      <button className="pb ab" style={s.pb} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs sheet */}
            {tab === 'logs' && (
              <div style={s.sheet}>
                <div style={s.colHead}>
                  <div style={{ ...s.col, ...s.cNum }}>#</div>
                  <div style={{ ...s.col, flex: 1.5 }}>Action</div>
                  <div style={{ ...s.col, flex: 2 }}>Performed By</div>
                  <div style={{ ...s.col, flex: 1.5 }}>IP Address</div>
                  <div style={{ ...s.col, flex: 2 }}>Time</div>
                </div>
                {paginatedLogs.map((l, i) => (
                  <div key={l.id} className="sr" style={{ ...s.row, borderBottom: '1px solid var(--sheet-border)' }}>
                    <div style={{ ...s.cell, ...s.cNum, color: '#444', fontSize: 11 }}>{(logPage - 1) * PAGE_SIZE + i + 1}</div>
                    <div style={{ ...s.cell, flex: 1.5 }}><span style={s.logTag}>{l.action}</span></div>
                    <div style={{ ...s.cell, flex: 2, fontSize: 12, color: '#888' }}>{l.performed_by || 'system'}</div>
                    <div style={{ ...s.cell, flex: 1.5, fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{l.ip_address}</div>
                    <div style={{ ...s.cell, flex: 2, fontSize: 11, color: '#555' }}>{new Date(l.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {paginatedLogs.length === 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 13 }}>No logs yet</div>
                )}
                {totalLogPages > 1 && (
                  <div style={s.pag}>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {(logPage - 1) * PAGE_SIZE + 1}–{Math.min(logPage * PAGE_SIZE, logs.length)} of {logs.length}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="pb ab" style={s.pb} disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}>←</button>
                      {Array.from({ length: totalLogPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className="pb ab" style={{ ...s.pb, ...(logPage === p ? s.pbActive : {}) }} onClick={() => setLogPage(p)}>{p}</button>
                      ))}
                      <button className="pb ab" style={s.pb} disabled={logPage === totalLogPages} onClick={() => setLogPage(p => p + 1)}>→</button>
                    </div>
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
  page: { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  name: { fontSize: 17, fontWeight: 600 },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  flash: { fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500 },
  dot: { width: 7, height: 7, borderRadius: '50%' },
  badge: { fontSize: 12, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', padding: '3px 9px', borderRadius: 20 },
  muted: { fontSize: 12, color: '#555' },
  card: { background: '#111', border: '1px solid #222', borderRadius: 10, padding: '20px 24px', marginBottom: 16 },
  cardLabel: { fontSize: 11, fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 },
  stat: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 10, padding: '16px 20px' },
  statNum: { fontSize: 30, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#555', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  tabs: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 },
  tab: { padding: '7px 16px', background: 'transparent', border: '1px solid transparent', borderRadius: '6px 6px 0 0', color: '#555', fontSize: 13 },
  tabActive: { background: '#111', color: '#fff', borderColor: '#2a2a2a', borderBottomColor: '#111' },
  search: { marginLeft: 'auto', padding: '6px 12px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, color: '#fff', fontSize: 12, outline: 'none', width: 200 },
  // Sheet
  sheet: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '0 6px 6px 6px', overflow: 'hidden' },
  colHead: { display: 'flex', alignItems: 'center', background: '#0d0d0d', borderBottom: '2px solid #2a2a2a', padding: '0' },
  col: { padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '1px solid #1a1a1a' },
  row: { display: 'flex', alignItems: 'center' },
  cell: { padding: '10px 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid #1a1a1a', minHeight: 44 },
  // Column widths
  cNum: { width: 44, flexShrink: 0, justifyContent: 'center' },
  cName: { width: 180, flexShrink: 0, gap: 8 },
  cEmail: { flex: 2 },
  cRoles: { flex: 3 },
  cStatus: { width: 100, flexShrink: 0 },
  cAct: { width: 160, flexShrink: 0, display: 'flex', borderRight: 'none' },
  uAvatar: { width: 26, height: 26, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  you: { fontSize: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', padding: '0 5px', borderRadius: 20, marginLeft: 5 },
  roleTag: { fontSize: 11, background: '#6c63ff15', color: '#8b85ff', border: '1px solid #6c63ff25', padding: '1px 7px', borderRadius: 10 },
  ab: { fontSize: 11, padding: '4px 9px', background: 'transparent', color: '#888', border: '1px solid #2a2a2a', borderRadius: 5 },
  roleRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '10px 12px 10px 56px', background: '#0d0d0d', borderTop: '1px solid #1a1a1a' },
  rc: { fontSize: 11, padding: '4px 10px', borderRadius: 5 },
  logTag: { fontSize: 11, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '2px 8px', borderRadius: 5 },
  pag: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #1a1a1a' },
  pb: { padding: '4px 9px', background: 'transparent', color: '#666', border: '1px solid #2a2a2a', borderRadius: 5, fontSize: 12 },
  pbActive: { background: '#6c63ff', color: '#fff', borderColor: '#6c63ff' },
};
