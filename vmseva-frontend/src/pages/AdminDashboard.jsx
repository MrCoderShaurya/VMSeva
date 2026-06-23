import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/admin/test').then(r => setData(r.data)); }, []);

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <h2>Admin Dashboard</h2>
        <div style={styles.card}>
          <p>✅ Admin access confirmed</p>
          {data && <pre style={styles.pre}>{JSON.stringify(data, null, 2)}</pre>}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { padding:'24px', maxWidth:'700px', margin:'0 auto' },
  card: { background:'#fff', padding:'24px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  pre: { background:'#f5f5f5', padding:'12px', borderRadius:'4px', fontSize:'0.85rem' },
};
