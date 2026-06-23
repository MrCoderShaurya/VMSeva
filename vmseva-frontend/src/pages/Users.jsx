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
  const [msg, setMsg] = useState('');
  const { user: me } = useAuth();

  useEffect(() => {
    usersAPI.getAll().then(r => setUsers(r.data));
    api.get('/admin/roles').then(r => setAllRoles(r.data));
  }, []);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!userRoles[id]) {
      const { data } = await usersAPI.getRoles(id);
      setUserRoles(prev => ({ ...prev, [id]: data }));
    }
  };

  const toggleRole = async (userId, role) => {
    const assigned = userRoles[userId] || [];
    const has = assigned.some(r => r.id === role.id);
    try {
      if (has) {
        await usersAPI.removeRole(userId, role.id);
      } else {
        await usersAPI.assignRole(userId, role.id);
      }
      const { data } = await usersAPI.getRoles(userId);
      setUserRoles(prev => ({ ...prev, [userId]: data }));
      setMsg(has ? `Removed "${role.name}"` : `Assigned "${role.name}"`);
      setTimeout(() => setMsg(''), 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
      setTimeout(() => setMsg(''), 2000);
    }
  };

  const toggleStatus = async (id) => {
    const { data } = await usersAPI.toggleStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: data.is_active } : u));
  };

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.header}>
          <h2 style={s.title}>User Management</h2>
          {msg && <span style={s.msg}>{msg}</span>}
        </div>

        <div style={s.list}>
          {users.map(u => {
            const isMe = u.id === me?.id;
            const expanded = expandedId === u.id;
            const roles = userRoles[u.id] || [];

            return (
              <div key={u.id} style={s.card}>
                <div style={s.row}>
                  <div style={s.info}>
                    <div style={s.name}>{u.full_name || '—'}</div>
                    <div style={s.email}>{u.email}</div>
                    <div style={s.roleList}>
                      {expanded
                        ? roles.length ? roles.map(r => <span key={r.id} style={s.badge}>{r.name}</span>) : <span style={s.noRole}>No roles</span>
                        : null
                      }
                    </div>
                  </div>

                  <div style={s.actions}>
                    <span style={{ ...s.status, background: u.is_active ? '#00cc6622' : '#ff444422', color: u.is_active ? '#00cc66' : '#ff4444' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {!isMe && (
                      <button style={s.btn} onClick={() => toggleStatus(u.id)}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {!isMe && (
                      <button style={{ ...s.btn, background: expanded ? '#333' : 'var(--primary, #6c63ff)' }}
                        onClick={() => toggleExpand(u.id)}>
                        {expanded ? 'Hide Roles' : 'Manage Roles'}
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div style={s.roleGrid}>
                    {allRoles.map(role => {
                      const has = roles.some(r => r.id === role.id);
                      return (
                        <button key={role.id}
                          style={{ ...s.roleBtn, background: has ? '#6c63ff' : '#1a1a1a', border: has ? '1px solid #6c63ff' : '1px solid #333' }}
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
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 },
  title: { margin: 0, fontSize: 22 },
  msg: { fontSize: 13, color: '#00cc66', background: '#00cc6611', padding: '4px 12px', borderRadius: 20 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: { background: 'var(--card, #111)', border: '1px solid #222', borderRadius: 10, padding: '16px 20px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  info: { flex: 1 },
  name: { fontWeight: 600, fontSize: 15, marginBottom: 2 },
  email: { fontSize: 13, color: '#888', marginBottom: 6 },
  roleList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: { fontSize: 11, background: '#6c63ff22', color: '#6c63ff', padding: '2px 8px', borderRadius: 10, border: '1px solid #6c63ff44' },
  noRole: { fontSize: 11, color: '#555' },
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  status: { fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 },
  btn: { fontSize: 12, padding: '5px 12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
  roleGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid #222' },
  roleBtn: { fontSize: 12, padding: '6px 14px', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' },
};
