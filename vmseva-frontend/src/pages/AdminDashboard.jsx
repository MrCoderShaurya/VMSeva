import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api';

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);

  useEffect(() => { api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => {}); }, []);

  return (
    <>
      <Navbar />
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.title}>Admin Panel</div>
          <span style={s.badge}>Admin</span>
        </div>

        <div style={s.card}>
          <div style={s.cardLabel}>Audit Logs</div>
          <div style={s.logList}>
            {logs.length === 0 && <div style={s.empty}>No logs yet</div>}
            {logs.map(l => (
              <div key={l.id} style={s.logRow}>
                <div style={s.logLeft}>
                  <span style={s.action}>{l.action}</span>
                  <span style={s.by}>{l.performed_by || 'system'}</span>
                </div>
                <div style={s.logRight}>
                  <span style={s.ip}>{l.ip_address}</span>
                  <span style={s.time}>{new Date(l.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: '32px 24px', maxWidth: 900, margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 700 },
  badge: { fontSize: 11, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: '3px 10px', borderRadius: 20 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' },
  cardLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 },
  logList: { display: 'flex', flexDirection: 'column', gap: 1 },
  logRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 8, background: 'var(--surface2)', marginBottom: 4 },
  logLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  action: { fontSize: 13, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 },
  by: { fontSize: 12, color: 'var(--text-secondary)' },
  logRight: { display: 'flex', alignItems: 'center', gap: 12 },
  ip: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' },
  time: { fontSize: 11, color: 'var(--text-muted)' },
  empty: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' },
};
