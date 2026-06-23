import { useEffect, useState } from 'react';
import { usersAPI } from '../api';
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

  useEffect(() => {
    usersAPI.getAll().then(r => setUsers(r.data));
    api.get('/admin/roles').then(r => setAllRoles(r.data));
  }, []);

  const flash = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 2500); };

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
          <input style={s.search} placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={s.list}>
          {filtered.map(u => {
            const isMe = u.id === me?.id;
            const expanded = expandedId === u.id;
            const roles = userRoles[u.id] || [];

            return (
              <div key={u.id} style={{ ...s.card, borderColor: expanded ? '#6c63ff44' : 'var(--border)' }}>
                <div style={s.row}>
                  <div style={s.avatar}>{(u.full_name || u.email)[0].toUpperCase()}</div>
                  <div style={s.info}>
                    <div style={s.name}>
                      {u.full_name || '—'}
                      {isMe && <span style={s.youBadge}>You</span>}
                    </div>
                    <div style={s.email}>{u.email}</div>
                    <div style={s.roleRow}>
                      {expanded && roles.length > 0
                        ? roles.map(r => <span key={r.id} style={s.roleBadge}>{r.name}</span>)
                        : expanded && <span style={s.noRole}>No roles assigned</span>
                      }
                    </div>
                  </div>
                  <div style={s.actions}>
                    <span style={{ ...s.statusBadge, background: u.is_active ? '#00cc6618' : '#ff444418', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {!isMe && (
                      <button style={{ ...s.btn, background: 'var(--surface2)' }} onClick={() => toggleStatus(u.id)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {!isMe && (
                      <button style={{ ...s.btn, background: expanded ? '#6c63ff' : 'var(--surface2)', color: '#fff' }}
                        onClick={() => toggleExpand(u.id)}>
                        {expanded ? 'Done' : 'Assign Roles'}
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div style={s.rolePanel}>
                    <div style={s.rolePanelLabel}>Click to assign or remove roles</div>
                    <div style={s.roleGrid}>
                      {allRoles.map(role => {
                        const has = roles.some(r => r.id === role.id);
                        return (
                          <button key={role.id} onClick={() => toggleRole(u.id, role)}
                            style={{ ...s.roleBtn, background: has ? '#6c63ff' : 'var(--surface2)', border: `1px solid ${has ? '#6c63ff' : 'var(--border)'}` }}>
                            <span style={s.roleBtnIcon}>{has ? '✓' : '+'}</span>
                            {role.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={s.empty}>No users found</div>
          )}
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '28px 24px', maxWidth: 960, margin: '0 auto' },
  topBar: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' },
  title: { fontSize: 22, fontWeight: 700 },
  sub: { fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 },
  flash: { fontSize: 12, padding: '5px 14px', borderRadius: 20, fontWeight: 500 },
  search: { marginLeft: 'auto', padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', width: 240 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: 'var(--surface)', border: '1px solid', borderRadius: 12, padding: '16px 20px', transition: 'border-color 0.2s' },
  row: { display: 'flex', alignItems: 'center', gap: 14 },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 },
  youBadge: { fontSize: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '1px 7px', borderRadius: 20 },
  email: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 },
  roleRow: { display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  roleBadge: { fontSize: 11, background: '#6c63ff22', color: '#a09cf7', border: '1px solid #6c63ff33', padding: '2px 8px', borderRadius: 10 },
  noRole: { fontSize: 11, color: 'var(--text-muted)' },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  statusBadge: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  btn: { fontSize: 12, padding: '6px 14px', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer' },
  rolePanel: { marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' },
  rolePanelLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 },
  roleGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  roleBtn: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '7px 16px', color: '#fff', borderRadius: 7, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' },
  roleBtnIcon: { fontSize: 11, fontWeight: 700 },
  empty: { textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 },
};
