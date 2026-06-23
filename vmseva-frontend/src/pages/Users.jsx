import { useEffect, useState } from 'react';
import { usersAPI } from '../api';
import { Navbar } from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);

  useEffect(() => { usersAPI.getAll().then(r => setUsers(r.data)); }, []);

  const toggle = async (id) => {
    const { data } = await usersAPI.toggleStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? {...u, is_active: data.is_active} : u));
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2>User Management</h2>
        <table style={styles.table}>
          <thead>
            <tr>{['ID','Name','Email','Status','Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.full_name || '-'}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}><span style={{color: u.is_active ? 'green' : 'red'}}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td style={styles.td}>
                  <button style={styles.btn} onClick={() => toggle(u.id)}>
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link to={`/users/${u.id}/roles`} style={styles.link}>Roles</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const styles = {
  container: { padding:'24px', maxWidth:'1000px', margin:'0 auto' },
  table: { width:'100%', borderCollapse:'collapse', background:'#fff', borderRadius:'8px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  th: { background:'#1a1a2e', color:'#fff', padding:'12px', textAlign:'left' },
  td: { padding:'12px', borderBottom:'1px solid #eee' },
  btn: { marginRight:'8px', padding:'4px 10px', background:'#e94560', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' },
  link: { padding:'4px 10px', background:'#1a1a2e', color:'#fff', borderRadius:'4px', textDecoration:'none', fontSize:'0.85rem' },
};
