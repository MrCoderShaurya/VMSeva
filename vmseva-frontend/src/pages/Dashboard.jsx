import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2>Welcome, {user?.full_name || user?.email}</h2>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>Your Roles</h3>
            {user?.roles?.length ? user.roles.map(r => (
              <span key={r.id} style={styles.badge}>{r.name}</span>
            )) : <p>No roles assigned</p>}
          </div>
          <div style={styles.card}>
            <h3>Account Info</h3>
            <p><b>Email:</b> {user?.email}</p>
            <p><b>Status:</b> {user?.is_active ? '✅ Active' : '❌ Inactive'}</p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { padding:'24px', maxWidth:'900px', margin:'0 auto' },
  grid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginTop:'20px' },
  card: { background:'#fff', padding:'20px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  badge: { display:'inline-block', background:'#e94560', color:'#fff', padding:'4px 10px', borderRadius:'12px', marginRight:'6px', fontSize:'0.8rem' },
};
