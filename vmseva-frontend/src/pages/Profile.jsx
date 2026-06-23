import { useState } from 'react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.changePassword(form);
      setMsg('Password changed successfully');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Profile</h2>
          <p><b>Email:</b> {user?.email}</p>
          <p><b>Name:</b> {user?.full_name || '-'}</p>
          <p><b>Roles:</b> {user?.roles?.map(r => r.name).join(', ') || 'None'}</p>
          <hr style={{margin:'20px 0'}} />
          <h3>Change Password</h3>
          {msg && <p style={{color:'green'}}>{msg}</p>}
          <form onSubmit={submit}>
            <input style={styles.input} placeholder="Old Password" type="password"
              value={form.old_password} onChange={e => setForm({...form, old_password: e.target.value})} required />
            <input style={styles.input} placeholder="New Password" type="password"
              value={form.new_password} onChange={e => setForm({...form, new_password: e.target.value})} required />
            <button style={styles.btn} type="submit">Update Password</button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { padding:'24px', maxWidth:'500px', margin:'0 auto' },
  card: { background:'#fff', padding:'30px', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  input: { width:'100%', padding:'10px', marginBottom:'12px', border:'1px solid #ddd', borderRadius:'4px', boxSizing:'border-box' },
  btn: { width:'100%', padding:'10px', background:'#e94560', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold' },
};
