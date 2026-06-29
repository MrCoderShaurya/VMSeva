import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, hasRole } = useAuth();
  const loc = useLocation();
  const active = (path) => loc.pathname === path;

  return (
    <nav style={s.nav} className="navbar-container">
      <style>{`
        @media (max-width: 768px) {
          .navbar-container {
            display: none !important;
          }
        }
      `}</style>
      <span style={s.brand}>VMSeva</span>
      <div style={s.links} className="nav-links">
        {(hasRole('Admin') || user?.roles?.some(r => {
          const n = r.name.toLowerCase();
          return n.includes('counselor') || n.includes('counsellor') || n.includes('internal manager') || n.includes('im') || n.includes('incharge') || n.includes('in-charge') || n.includes('ic') || n.includes('assistant') || n.includes('mentor') || n.includes('frontliner');
        })) && <Link to="/dashboard" style={{ ...s.link, ...(active('/dashboard') ? s.activeLink : {}) }}>Dashboard</Link>}
        {hasRole('Admin') && <Link to="/users" style={{ ...s.link, ...(active('/users') ? s.activeLink : {}) }}>Users</Link>}
        {(hasRole('Admin') || user?.roles?.some(r => {
          const n = r.name.toLowerCase();
          return n.includes('counselor') || n.includes('counsellor') || n.includes('internal manager') || n.includes('im') || n.includes('incharge') || n.includes('in-charge') || n.includes('ic') || n.includes('assistant') || n.includes('mentor') || n.includes('frontliner');
        })) && <Link to="/preaching" style={{ ...s.link, ...(active('/preaching') ? s.activeLink : {}) }}>Preaching</Link>}
        {hasRole('Admin') && <Link to="/admin" style={{ ...s.link, ...(active('/admin') ? s.activeLink : {}) }}>Admin</Link>}
        <button onClick={logout} style={s.btn}>Logout</button>
      </div>
    </nav>
  );
};

const s = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 },
  brand: { fontWeight: 700, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.5px' },
  links: { display: 'flex', gap: 4, alignItems: 'center' },
  link: { color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, padding: '6px 12px', borderRadius: 6, transition: 'color 0.2s, background 0.2s' },
  activeLink: { color: 'var(--text)', background: 'var(--surface2)' },
  btn: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginLeft: 4, transition: 'border-color 0.2s, color 0.2s' },
};
