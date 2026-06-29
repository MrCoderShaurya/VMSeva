import { useEffect, useState } from 'react';
import { usersAPI, modulesAPI } from '../api';
import api from '../api';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [userRoles, setUserRoles] = useState({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ text: '', ok: true });
  const { user: me } = useAuth();
  const [modules, setModules] = useState([]);
  const [page, setPage] = useState(1);
  const [activeUserDropdown, setActiveUserDropdown] = useState(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    Promise.all([
      usersAPI.getAll(),
      api.get('/admin/roles'),
      modulesAPI.getAll().catch(() => ({ data: [] })),
    ]).then(async ([usersRes, rolesRes, modulesRes]) => {
      setUsers(usersRes.data);
      setAllRoles(rolesRes.data);
      setModules(modulesRes.data);
      const map = {};
      await Promise.all(usersRes.data.map(async u => {
        try {
          const { data } = await usersAPI.getRoles(u.id);
          map[u.id] = data;
        } catch {
          map[u.id] = [];
        }
      }));
      setUserRoles(map);
    });
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => setActiveUserDropdown(null);
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 2500); };

  const loadRoles = async (id) => {
    const { data } = await usersAPI.getRoles(id);
    setUserRoles(prev => ({ ...prev, [id]: data }));
    return data;
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); setActiveUserDropdown(null); return; }
    setExpandedId(id);
    setActiveUserDropdown(null);
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

  const handleAssignModule = async (userId, moduleName) => {
    const prevUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, module: moduleName || null } : u));
    try {
      await usersAPI.assignModule(userId, moduleName || null);
      flash(moduleName ? `Assigned to "${moduleName}"` : 'Module unassigned');
    } catch {
      setUsers(prevUsers);
      flash('Failed to assign module', false);
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

  return (
    <>
      <Navbar />
      <style>{`
        :root { --sheet-border: #2a2a2a; --sheet-head: #161616; --row-hover: rgba(255,255,255,0.025); }
        .sr { transition: background 0.1s; }
        .sr:hover { background: var(--row-hover) !important; }
        .rc { transition: background 0.1s, color 0.1s, border-color 0.1s, transform 0.08s; cursor:pointer; user-select:none; }
        .rc:hover { transform: scale(1.05); }
        .rc:active { transform: scale(0.97); }
        .ab { transition: background 0.1s, color 0.1s, border-color 0.1s; cursor:pointer; }
        .ab:hover { border-color: #555 !important; color: #fff !important; }
        .pb:disabled { opacity: 0.3; cursor: not-allowed; }
        .er { animation: slideDown 0.12s ease; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .di { transition: background 0.1s, color 0.1s; }
        .di:hover { background: #1a1a1a !important; color: #fff !important; }

        .sheet-res {
          display: block;
          width: 100%;
          overflow-x: auto !important;
        }

        .sheet-inner {
          min-width: 950px;
        }

        @media (max-width: 768px) {
          .search-bar-users {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 10px;
          }
          .mod-assign-container {
            margin-left: 0 !important;
            margin-top: 8px;
            width: 100%;
          }
        }
        @media (max-width: 600px) {
          .page-container {
            padding: 16px 12px !important;
          }
        }
      `}</style>
      <div style={s.page} className="page-container">
        <div style={s.topBar}>
          <div>
            <div style={s.title}>User Management</div>
            <div style={s.sub}>{users.length} users in the system</div>
          </div>
          {msg.text && (
            <span style={{ ...s.flash, background: msg.ok ? '#00cc6618' : '#ff444418', color: msg.ok ? '#00cc66' : '#ff4444', border: `1px solid ${msg.ok ? '#00cc6633' : '#ff444433'}` }}>
              {msg.text}
            </span>
          )}
          <input style={s.search} className="search-bar-users" placeholder="Search by name or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <div style={s.sheet} className="sheet-res">
          <div className="sheet-inner">
            {/* Column headers */}
            <div style={s.colHead}>
              <div style={{ ...s.col, ...s.cNum }}>#</div>
              <div style={{ ...s.col, ...s.cName }}>Name</div>
              <div style={{ ...s.col, ...s.cEmail }}>Email</div>
              <div style={{ ...s.col, ...s.cModule }}>Module</div>
              <div style={{ ...s.col, ...s.cRoles }}>Roles</div>
              <div style={{ ...s.col, ...s.cStatus }}>Status</div>
              <div style={{ ...s.col, ...s.cAct }}>Actions</div>
            </div>

            {paginated.map((u, idx) => {
              const isMe = u.id === me?.id;
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
                        {isMe && <span style={s.you}>You</span>}
                      </span>
                    </div>
                    <div style={{ ...s.cell, ...s.cEmail, fontSize: 12, color: '#666' }}>{u.email}</div>
                    <div style={{ ...s.cell, ...s.cModule }}>
                      {u.module ? <span style={s.moduleTag}>{u.module}</span> : <span style={{ fontSize: 11, color: '#444' }}>—</span>}
                    </div>
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
                            onClick={() => toggleExpand(u.id)}>
                            Manage
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role & Module assignment row */}
                  {exp && (
                    <div className="er" style={s.roleRow}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Assign roles:</span>
                          <div style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className="ab"
                              style={{ ...s.select, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveUserDropdown(activeUserDropdown === u.id ? null : u.id);
                              }}
                            >
                              <span>
                                {roles.length > 0 
                                  ? roles.map(r => r.name).join(', ') 
                                  : 'Select Roles'}
                              </span>
                              <span style={{ fontSize: 10 }}>▼</span>
                            </button>
                            
                            {activeUserDropdown === u.id && (
                              <div style={s.dropdownMenu}>
                                {allRoles.map(role => {
                                  const has = roles.some(r => r.id === role.id);
                                  return (
                                    <div
                                      key={role.id}
                                      className="di"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '6px 12px',
                                        fontSize: 12,
                                        color: has ? '#fff' : '#aaa',
                                        cursor: 'pointer',
                                        background: has ? '#6c63ff20' : 'transparent',
                                        userSelect: 'none',
                                        whiteSpace: 'nowrap'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRole(u.id, role);
                                      }}
                                    >
                                      <span style={{ color: has ? '#6c63ff' : '#555', fontWeight: 'bold', width: 14 }}>
                                        {has ? '✓' : '+'}
                                      </span>
                                      <span>{role.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }} className="mod-assign-container">
                          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Module:</span>
                          <select
                            value={u.module || ''}
                            onChange={(e) => handleAssignModule(u.id, e.target.value)}
                            style={s.select}
                          >
                            <option value="">No Module</option>
                            {modules.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
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
                  <button className="pb ab" style={s.pb} disabled={page === 1} onClick={() => { setPage(p => p - 1); window.scrollTo(0,0); }}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} className="pb ab" style={{ ...s.pb, ...(page === p ? s.pbActive : {}) }} onClick={() => { setPage(p); window.scrollTo(0,0); }}>{p}</button>
                  ))}
                  <button className="pb ab" style={s.pb} disabled={page === totalPages} onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }}>→</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '28px 24px', maxWidth: 1000, margin: '0 auto' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  sub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  flash: { fontSize: 12, padding: '5px 14px', borderRadius: 20, fontWeight: 500 },
  search: { marginLeft: 'auto', padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', width: 240 },
  // Sheet
  sheet: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px', overflow: 'hidden' },
  colHead: { display: 'flex', alignItems: 'center', background: '#0d0d0d', borderBottom: '2px solid #2a2a2a', padding: '0' },
  col: { padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', borderRight: '1px solid #1a1a1a' },
  row: { display: 'flex', alignItems: 'center' },
  cell: { padding: '10px 12px', display: 'flex', alignItems: 'center', borderRight: '1px solid #1a1a1a', minHeight: 44 },
  // Column widths
  cNum: { width: 44, flexShrink: 0, justifyContent: 'center' },
  cName: { width: 160, flexShrink: 0, gap: 8 },
  cEmail: { width: 200, flexShrink: 0, borderRight: '1px solid #1a1a1a' },
  cModule: { width: 120, flexShrink: 0, borderRight: '1px solid #1a1a1a' },
  cRoles: { width: 210, flexShrink: 0, borderRight: '1px solid #1a1a1a' },
  cStatus: { width: 90, flexShrink: 0, borderRight: '1px solid #1a1a1a', justifyContent: 'center' },
  cAct: { width: 126, flexShrink: 0, display: 'flex', borderRight: 'none', justifyContent: 'center' },
  uAvatar: { width: 26, height: 26, borderRadius: '50%', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  you: { fontSize: 10, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#555', padding: '0 5px', borderRadius: 20, marginLeft: 5 },
  roleTag: { fontSize: 11, background: '#6c63ff15', color: '#8b85ff', border: '1px solid #6c63ff25', padding: '1px 7px', borderRadius: 10 },
  moduleTag: { fontSize: 11, background: '#00cc6615', color: '#00cc66', border: '1px solid #00cc6625', padding: '1px 7px', borderRadius: 10 },
  ab: { fontSize: 11, padding: '4px 9px', background: 'transparent', color: '#888', borderWidth: 1, borderStyle: 'solid', borderColor: '#2a2a2a', borderRadius: 5 },
  roleRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '10px 12px 10px 56px', background: '#0d0d0d', borderTop: '1px solid #1a1a1a' },
  rc: { fontSize: 11, padding: '4px 10px', borderRadius: 5 },
  select: { padding: '4px 8px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 5, color: '#fff', fontSize: 11, outline: 'none' },
  dropdownMenu: { position: 'absolute', top: '100%', left: 0, zIndex: 100, background: '#111', border: '1px solid #2a2a2a', borderRadius: 6, padding: '4px 0', minWidth: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', marginTop: 4 },
  pag: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #1a1a1a' },
  pb: { padding: '4px 9px', background: 'transparent', color: '#666', border: '1px solid #2a2a2a', borderRadius: 5, fontSize: 12 },
  pbActive: { background: '#6c63ff', color: '#fff', borderColor: '#6c63ff' },
};
