import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>VMSeva Login</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={submit}>
          <input style={styles.input} placeholder="Email" type="email"
            value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <input style={styles.input} placeholder="Password" type="password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button style={styles.btn} type="submit">Login</button>
        </form>
        <p style={{textAlign:'center', marginTop:12}}>No account? <Link to="/register">Register</Link></p>
        <p style={{textAlign:'center', marginTop:8}}><Link to="/forgot-password">Forgot password?</Link></p>
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
  error: { color:'red', textAlign:'center', marginBottom:'12px' },
};
