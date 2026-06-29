import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api';

const PAGE_SIZE = 15;

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => { api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => {}); }, []);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Navbar />
      <style>{`
        .log-row-res {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 8px;
          background: var(--surface2);
          margin-bottom: 4px;
        }
        .log-left-res, .log-right-res {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pb:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        @media (max-width: 600px) {
          .log-row-res {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .log-right-res {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid var(--border);
            padding-top: 6px;
            margin-top: 2px;
          }
        }
        @media (max-width: 600px) {
          .page-container {
            padding: 16px 12px !important;
          }
        }
      `}</style>

      <div style={s.page} className="page-container">
        <div style={s.header}>
          <div style={s.title}>Admin Panel</div>
          <span style={s.badge}>Admin</span>
        </div>

        <div style={s.card}>
          <div style={s.cardLabel}>Audit Logs</div>
          <div style={s.logList}>
            {logs.length === 0 && <div style={s.empty}>No logs yet</div>}
            {paginatedLogs.map(l => (
              <div key={l.id} className="log-row-res">
                <div className="log-left-res">
                  <span style={s.action}>{l.action}</span>
                  <span style={s.by}>{l.performed_by || 'system'}</span>
                </div>
                <div className="log-right-res" style={{ gap: 12 }}>
                  <span style={s.ip}>{l.ip_address}</span>
                  <span style={s.time}>{new Date(l.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={s.pag}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} of {logs.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="pb" style={s.pb} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className="pb" style={{ ...s.pb, ...(page === p ? s.pbActive : {}) }} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="pb" style={s.pb} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
              </div>
            </div>
          )}
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
  action: { fontSize: 13, fontWeight: 500, color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6 },
  by: { fontSize: 12, color: 'var(--text-secondary)' },
  ip: { fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' },
  time: { fontSize: 11, color: 'var(--text-muted)' },
  empty: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' },
  pag: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0 0 0', borderTop: '1px solid var(--border)', marginTop: 12 },
  pb: { padding: '5px 11px', background: 'var(--surface2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  pbActive: { background: '#6c63ff', color: '#fff', borderColor: '#6c63ff' },
};
