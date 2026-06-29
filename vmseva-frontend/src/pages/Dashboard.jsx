import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { usersAPI, modulesAPI } from '../api';
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
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [modules, setModules] = useState([]);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [newModuleActive, setNewModuleActive] = useState(true);
  const [activeUserDropdown, setActiveUserDropdown] = useState(null);
  const [moduleRoleFilters, setModuleRoleFilters] = useState({});
  const [activeModuleDropdown, setActiveModuleDropdown] = useState(null);

  const isAdmin = user?.roles?.some(r => r.name === 'Admin');

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveUserDropdown(null);
      setActiveModuleDropdown(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([
      usersAPI.getAll(),
      api.get('/admin/roles'),
      api.get('/admin/audit-logs').catch(() => ({ data: [] })),
      modulesAPI.getAll().catch(() => ({ data: [] })),
    ]).then(async ([usersRes, rolesRes, logsRes, modulesRes]) => {
      setUsers(usersRes.data);
      setAllRoles(rolesRes.data);
      setLogs(logsRes.data);
      setModules(modulesRes.data);
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

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!newModuleName.trim()) return;
    try {
      const { data } = await modulesAPI.create({
        name: newModuleName.trim(),
        description: newModuleDesc.trim() || null,
        active: newModuleActive
      });
      setModules(prev => [...prev, data]);
      setNewModuleName('');
      setNewModuleDesc('');
      setNewModuleActive(true);
      flash('Module created successfully');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create module', false);
    }
  };

  const handleToggleModuleStatus = async (id) => {
    try {
      const { data } = await modulesAPI.toggleStatus(id);
      setModules(prev => prev.map(m => m.id === id ? { ...m, active: data.active } : m));
      flash(data.active ? 'Module activated' : 'Module deactivated');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      flash('Failed to toggle status', false);
    }
  };

  const handleDeleteModule = async (id) => {
    try {
      await modulesAPI.delete(id);
      setModules(prev => prev.filter(m => m.id !== id));
      flash('Module deleted');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      flash('Failed to delete module', false);
    }
  };

  const handleAssignModule = async (userId, moduleName) => {
    const prevUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, module: moduleName || null } : u));
    try {
      await usersAPI.assignModule(userId, moduleName || null);
      flash(moduleName ? `Assigned to ${moduleName}` : 'Module unassigned');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      setUsers(prevUsers);
      flash('Failed to assign module', false);
    }
  };

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

        .stats-grid-res {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .sheet-res {
          overflow-x: auto !important;
          display: block;
        }

        .sheet-inner {
          min-width: 950px;
        }

        .sheet-inner-logs {
          min-width: 700px;
        }

        .tabs-res {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 0px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .stats-grid-res {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .search-bar-res {
            width: 100% !important;
            margin-left: 0 !important;
            margin-top: 8px;
          }
          .mod-assign-container {
            margin-left: 0 !important;
            margin-top: 8px;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .stats-grid-res {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .page-container {
            padding: 16px 12px !important;
          }
        }
      `}</style>

      <Navbar />
      <div style={s.page} className="page-container">

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
            <div className="stats-grid-res">
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
            <div style={s.tabs} className="tabs-res">
              {[{ k: 'users', l: 'Users' }, { k: 'modules', l: 'Modules' }, { k: 'logs', l: 'Audit Logs' }].map(({ k, l }) => (
                <button key={k} className="tb"
                  style={{ ...s.tab, ...(tab === k ? s.tabActive : {}) }}
                  onClick={() => {
                    setTab(k);
                    setActiveUserDropdown(null);
                    setActiveModuleDropdown(null);
                  }}>{l}
                </button>
              ))}
              {tab === 'users' && (
                <input style={s.search} className="search-bar-res" placeholder="Search..."
                  value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              )}
            </div>

            {/* ── SHEET ── */}
            {tab === 'users' && (
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
                                  onClick={() => setExpandedId(exp ? null : u.id)}>
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Assign roles:</span>
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
                        <button className="pb ab" style={s.pb} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button key={p} className="pb ab" style={{ ...s.pb, ...(page === p ? s.pbActive : {}) }} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button className="pb ab" style={s.pb} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modules tab */}
            {tab === 'modules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Create Module Form */}
                <div style={s.card}>
                  <div style={s.cardLabel}>Create New Module</div>
                  <form onSubmit={handleCreateModule} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        style={{ ...s.search, marginLeft: 0, width: '100%', maxWidth: 280 }}
                        placeholder="Enter module name..."
                        value={newModuleName}
                        onChange={e => setNewModuleName(e.target.value)}
                      />
                      <input
                        style={{ ...s.search, marginLeft: 0, width: '100%', maxWidth: 400 }}
                        placeholder="Enter description (optional)..."
                        value={newModuleDesc}
                        onChange={e => setNewModuleDesc(e.target.value)}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: '#ccc' }}>
                        <input
                          type="checkbox"
                          checked={newModuleActive}
                          onChange={e => setNewModuleActive(e.target.checked)}
                          style={{ accentColor: '#6c63ff' }}
                        />
                        Active
                      </label>
                    </div>
                    <button type="submit" className="ab" style={{ ...s.ab, background: '#6c63ff', color: '#fff', borderColor: '#6c63ff', padding: '6px 16px', alignSelf: 'flex-start' }}>
                      Create Module
                    </button>
                  </form>
                </div>

                {/* Modules List */}
                <div style={s.sheet} className="sheet-res">
                  <div className="sheet-inner" style={{ minWidth: 1010 }}>
                    <div style={s.colHead}>
                      <div style={{ ...s.col, width: 50, justifyContent: 'center', display: 'flex', flexShrink: 0 }}>#</div>
                      <div style={{ ...s.col, width: 150, flexShrink: 0 }}>Module Name</div>
                      <div style={{ ...s.col, width: 250, flexShrink: 0 }}>Description</div>
                      <div style={{ ...s.col, width: 130, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>Users & Roles</div>
                      <div style={{ ...s.col, width: 90, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>Status</div>
                      <div style={{ ...s.col, width: 160, flexShrink: 0 }}>Created At</div>
                      <div style={{ ...s.col, width: 180, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>Actions</div>
                    </div>
                    {modules.map((m, idx) => {
                      const assignedUsers = users.filter(u => u.module === m.name);
                      const selectedRole = moduleRoleFilters[m.id] || 'all';
                      const roleFilteredUsers = assignedUsers.filter(u => {
                        if (selectedRole === 'all') return true;
                        const roles = userRoles[u.id] || [];
                        return roles.some(r => r.name === selectedRole);
                      });
                      const isExpanded = expandedModuleId === m.id;
                      return (
                        <div key={m.id} style={{ borderBottom: '1px solid var(--sheet-border)' }}>
                          <div className="sr" style={{ ...s.row, background: isExpanded ? '#6c63ff08' : 'transparent' }}>
                            <div style={{ ...s.cell, width: 50, justifyContent: 'center', color: '#444', fontSize: 11, flexShrink: 0 }}>{idx + 1}</div>
                            <div style={{ ...s.cell, width: 150, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>{m.name}</div>
                            <div style={{ ...s.cell, width: 250, flexShrink: 0, fontSize: 12, color: '#aaa', whiteSpace: 'normal', wordBreak: 'break-word' }}>{m.description || '—'}</div>
                            <div style={{ ...s.cell, width: 130, justifyContent: 'center', borderRight: '1px solid #1a1a1a', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  className="ab"
                                  style={{ ...s.select, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '3px 8px', fontSize: 10 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveModuleDropdown(activeModuleDropdown === m.id ? null : m.id);
                                  }}
                                >
                                  <span>{selectedRole === 'all' ? 'All Roles' : selectedRole}</span>
                                  <span style={{ fontSize: 9 }}>▼</span>
                                </button>
                                
                                {activeModuleDropdown === m.id && (
                                  <div style={{ ...s.dropdownMenu, minWidth: 120, position: 'absolute', background: '#1a1a1a', border: '1px solid #2a2a2a', zIndex: 10 }}>
                                    <div
                                      className="di"
                                      style={{
                                        padding: '4px 10px',
                                        fontSize: 11,
                                        cursor: 'pointer',
                                        color: selectedRole === 'all' ? '#fff' : '#aaa',
                                        background: selectedRole === 'all' ? '#6c63ff20' : 'transparent',
                                        whiteSpace: 'nowrap'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setModuleRoleFilters(prev => ({ ...prev, [m.id]: 'all' }));
                                        setActiveModuleDropdown(null);
                                      }}
                                    >
                                      All Roles
                                    </div>
                                    {allRoles.map(role => {
                                      const isSelected = selectedRole === role.name;
                                      return (
                                        <div
                                          key={role.id}
                                          className="di"
                                          style={{
                                            padding: '4px 10px',
                                            fontSize: 11,
                                            cursor: 'pointer',
                                            color: isSelected ? '#fff' : '#aaa',
                                            background: isSelected ? '#6c63ff20' : 'transparent',
                                            whiteSpace: 'nowrap'
                                          }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setModuleRoleFilters(prev => ({ ...prev, [m.id]: role.name }));
                                            setActiveModuleDropdown(null);
                                          }}
                                        >
                                          {role.name}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#8b85ff', fontWeight: 600, textAlign: 'center' }}>
                                {roleFilteredUsers.length} {selectedRole === 'all' ? 'Users' : selectedRole}
                              </div>
                            </div>
                            <div style={{ ...s.cell, width: 90, justifyContent: 'center', flexShrink: 0 }}>
                              <button
                                type="button"
                                className="ab"
                                onClick={() => handleToggleModuleStatus(m.id)}
                                style={{
                                  fontSize: 10,
                                  padding: '2px 8px',
                                  borderRadius: 20,
                                  fontWeight: 600,
                                  background: m.active ? '#00cc6615' : '#ff444415',
                                  color: m.active ? '#00cc66' : '#ff4444',
                                  border: `1px solid ${m.active ? '#00cc6625' : '#ff444425'}`,
                                  cursor: 'pointer'
                                }}
                              >
                                {m.active ? 'Active' : 'Inactive'}
                              </button>
                            </div>
                            <div style={{ ...s.cell, width: 160, fontSize: 11, color: '#555', flexShrink: 0 }}>{new Date(m.created_at).toLocaleString()}</div>
                            <div style={{ ...s.cell, width: 180, justifyContent: 'center', gap: 6, flexShrink: 0 }}>
                              <button
                                className="ab"
                                style={{ ...s.ab, background: isExpanded ? '#6c63ff' : 'transparent', color: isExpanded ? '#fff' : '#888', borderColor: isExpanded ? '#6c63ff' : '#333' }}
                                onClick={() => setExpandedModuleId(isExpanded ? null : m.id)}
                              >
                                Manage
                              </button>
                              <button className="ab" style={{ ...s.ab, color: '#ff4444', borderColor: '#ff444425' }} onClick={() => handleDeleteModule(m.id)}>
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Collapsible panel to toggle user assignments */}
                          {isExpanded && (
                            <div className="er" style={{ ...s.roleRow, padding: '12px 24px', background: '#0d0d0d' }}>
                              <div style={{ width: '100%' }}>
                                <div style={{ fontSize: 11, color: '#555', fontWeight: 600, marginBottom: 8 }}>
                                  Manage Module User Assignment {selectedRole !== 'all' ? `(${selectedRole}s only)` : ''} (Tap to toggle):
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {users.filter(u => {
                                    if (selectedRole === 'all') return true;
                                    const roles = userRoles[u.id] || [];
                                    return roles.some(r => r.name === selectedRole);
                                  }).map(u => {
                                    const isAssigned = u.module === m.name;
                                    const otherMod = u.module && u.module !== m.name;
                                    return (
                                      <button
                                        key={u.id}
                                        className="rc"
                                        style={{
                                          fontSize: 11,
                                          padding: '4px 10px',
                                          borderRadius: 20,
                                          background: isAssigned ? 'rgba(0, 204, 102, 0.15)' : 'transparent',
                                          border: `1px solid ${isAssigned ? '#00cc66' : otherMod ? '#ffaa0044' : '#2a2a2a'}`,
                                          color: isAssigned ? '#00cc66' : otherMod ? '#ffaa00' : '#888',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 4
                                        }}
                                        onClick={() => handleAssignModule(u.id, isAssigned ? null : m.name)}
                                      >
                                        <span>{isAssigned ? '✓' : '+'}</span>
                                        {u.full_name || u.email}
                                        {otherMod && <span style={{ fontSize: 9, opacity: 0.7 }}>({u.module})</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {modules.length === 0 && (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: 13 }}>No modules created yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audit Logs sheet */}
            {tab === 'logs' && (
              <div style={s.sheet} className="sheet-res">
                <div className="sheet-inner sheet-inner-logs">
                  <div style={s.colHead}>
                    <div style={{ ...s.col, ...s.cNum }}>#</div>
                    <div style={{ ...s.col, width: 140, flexShrink: 0 }}>Action</div>
                    <div style={{ ...s.col, width: 200, flexShrink: 0 }}>Performed By</div>
                    <div style={{ ...s.col, width: 130, flexShrink: 0 }}>IP Address</div>
                    <div style={{ ...s.col, width: 186, flexShrink: 0 }}>Time</div>
                  </div>
                  {paginatedLogs.map((l, i) => (
                    <div key={l.id} className="sr" style={{ ...s.row, borderBottom: '1px solid var(--sheet-border)' }}>
                      <div style={{ ...s.cell, ...s.cNum, color: '#444', fontSize: 11 }}>{(logPage - 1) * PAGE_SIZE + i + 1}</div>
                      <div style={{ ...s.cell, width: 140, flexShrink: 0 }}><span style={s.logTag}>{l.action}</span></div>
                      <div style={{ ...s.cell, width: 200, flexShrink: 0, fontSize: 12, color: '#888' }}>{l.performed_by || 'system'}</div>
                      <div style={{ ...s.cell, width: 130, flexShrink: 0, fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{l.ip_address}</div>
                      <div style={{ ...s.cell, width: 186, flexShrink: 0, fontSize: 11, color: '#555' }}>{new Date(l.created_at).toLocaleString()}</div>
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
  tab: { padding: '7px 16px', background: 'transparent', borderWidth: 1, borderStyle: 'solid', borderColor: 'transparent', borderRadius: '6px 6px 0 0', color: '#555', fontSize: 13 },
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
  logTag: { fontSize: 11, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', padding: '2px 8px', borderRadius: 5 },
  pag: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid #1a1a1a' },
  pb: { padding: '4px 9px', background: 'transparent', color: '#666', border: '1px solid #2a2a2a', borderRadius: 5, fontSize: 12 },
  pbActive: { background: '#6c63ff', color: '#fff', borderColor: '#6c63ff' },
};
