import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>VMSeva</span>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        {hasRole('Admin') && <Link to="/users" style={styles.link}>Users</Link>}
        {hasRole('Admin') && <Link to="/admin" style={styles.link}>Admin</Link>}
        <Link to="/profile" style={styles.link}>Profile</Link>
        <button onClick={logout} style={styles.btn}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', background:'#1a1a2e', color:'#fff' },
  brand: { fontWeight:'bold', fontSize:'1.2rem', color:'#e94560' },
  links: { display:'flex', gap:'16px', alignItems:'center' },
  link: { color:'#eee', textDecoration:'none', fontSize:'0.9rem' },
  btn: { background:'#e94560', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'4px', cursor:'pointer' },
};
