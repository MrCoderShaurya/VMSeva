import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      await authAPI.forgotPassword({ email });
      setMsg('If that email exists, a reset link was sent.');
    } catch {
      setMsg('Something went wrong. Try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot Password</h2>
        {msg ? <p style={styles.success}>{msg}</p> : (
          <form onSubmit={submit}>
            <input style={styles.input} type="email" placeholder="Enter your email"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button style={styles.btn} type="submit">Send Reset Link</button>
          </form>
        )}
        <p style={styles.back}><Link to="/login">← Back to Login</Link></p>
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
  success: { color:'green', textAlign:'center' },
  back: { textAlign:'center', marginTop:'16px' },
};
