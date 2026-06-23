import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.resetPassword({ token, new_password: password });
      setMsg('Password reset! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Invalid or expired link.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        {msg && <p style={styles.msg}>{msg}</p>}
        <form onSubmit={submit}>
          <input style={styles.input} type="password" placeholder="New password"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          <button style={styles.btn} type="submit">Reset Password</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f2f5' },
  card: { background:'#fff', padding:'40px', borderRadius:'8px', width:'360px', boxShadow:'0 2px 12px rgba(0,0,0,0.1)' },
  title: { textAlign:'center', marginBottom:'24px', color:'#1a1a2e' },
  input: { width:'100%', padding:'10px', marginBottom:'12px', border:'1px solid #ddd', borderRadius:'4px', boxSizing:'border-box' },
  btn: { width:'100%', padding:'10px', background:'#e94560', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold' },
  msg: { textAlign:'center', marginBottom:'12px', color:'green' },
};
