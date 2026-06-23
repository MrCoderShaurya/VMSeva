import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI } from '../api';
import { Navbar } from '../components/Navbar';

const ALL_ROLES = [
  { id: 1, name: 'Admin' }, { id: 2, name: 'Overall Coordinator' },
  { id: 3, name: 'Internal Manager' }, { id: 4, name: 'Counselor' },
  { id: 5, name: 'Incharge' }, { id: 6, name: 'Assistant' }
];

export default function UserRoles() {
  const { id } = useParams();
  const [assigned, setAssigned] = useState([]);
  const [msg, setMsg] = useState('');

  const load = () => usersAPI.getRoles(id).then(r => setAssigned(r.data));
  useEffect(() => { load(); }, [id]);

  const assign = async (role_id) => {
    try {
      await usersAPI.assignRole(id, role_id);
      setMsg('Role assigned'); load();
    } catch { setMsg('Already assigned'); }
  };

  const remove = async (roleId) => {
    await usersAPI.removeRole(id, roleId);
    setMsg('Role removed'); load();
  };

  const assignedIds = assigned.map(r => r.id);

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2>Manage Roles — User #{id}</h2>
        {msg && <p style={styles.msg}>{msg}</p>}
        <div style={styles.grid}>
          {ALL_ROLES.map(role => {
            const has = assignedIds.includes(role.id);
            return (
              <div key={role.id} style={{...styles.card, borderColor: has ? '#e94560' : '#ddd'}}>
                <span>{role.name}</span>
                <button style={{...styles.btn, background: has ? '#e94560' : '#1a1a2e'}}
                  onClick={() => has ? remove(role.id) : assign(role.id)}>
                  {has ? 'Remove' : 'Assign'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { padding:'24px', maxWidth:'700px', margin:'0 auto' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'16px' },
  card: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px', background:'#fff', borderRadius:'8px', border:'2px solid', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' },
  btn: { color:'#fff', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer' },
  msg: { color:'green', marginBottom:'8px' },
};
