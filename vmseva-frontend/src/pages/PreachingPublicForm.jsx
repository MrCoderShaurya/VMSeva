import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PreachingPublicForm() {
  const [eventId, setEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    college: '',
    gender: 'Male',
    address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  // Custom Form Config Styles
  const [config, setConfig] = useState({
    fontSize: '14px',
    fontColor: '#ffffff',
    bgColor: '#0a0a0a',
    titleColor: '#ffffff',
    btnColor: '#6c63ff',
    btnText: 'Register Now',
    formTitle: '',
    logoText: 'VMSeva',
    fontFamily: 'Inter',
    borderRadius: '8px',
    successMsg: 'Registration successful! Thank you.',
    fields: ['name', 'phone', 'email', 'college', 'gender', 'address', 'notes']
  });

  useEffect(() => {
    const font = config.fontFamily || 'Inter';
    const fontId = 'dynamic-google-font';
    let linkEl = document.getElementById(fontId);
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = fontId;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }
    const formattedFont = font.replace(/ /g, '+');
    linkEl.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@400;500;700&display=swap`;
  }, [config.fontFamily]);

  useEffect(() => {
    const evId = new URLSearchParams(window.location.search).get('eventId');
    if (evId) {
      setEventId(evId);
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      axios.get(`${backendUrl}/preaching/public/events/${evId}`)
        .then(res => {
          setEventTitle(res.data.title);
          if (res.data.form_config) {
            const formCfg = res.data.form_config;
            setConfig({
              fontSize: formCfg.fontSize || '14px',
              fontColor: formCfg.fontColor || '#ffffff',
              bgColor: formCfg.bgColor || '#0a0a0a',
              titleColor: formCfg.titleColor || '#ffffff',
              btnColor: formCfg.btnColor || '#6c63ff',
              btnText: formCfg.btnText || 'Register Now',
              formTitle: formCfg.formTitle || '',
              logoText: formCfg.logoText || 'VMSeva',
              fontFamily: formCfg.fontFamily || 'Inter',
              borderRadius: formCfg.borderRadius || '8px',
              successMsg: formCfg.successMsg || 'Registration successful! Thank you.',
              fields: formCfg.fields || ['name', 'phone', 'email', 'college', 'gender', 'address', 'notes']
            });
          }
        })
        .catch(err => {
          console.error('Failed to load event config:', err.message);
        });
    } else {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      axios.get(`${backendUrl}/preaching/public/general-config`)
        .then(res => {
          if (res.data) {
            const formCfg = res.data;
            setConfig({
              fontSize: formCfg.fontSize || '14px',
              fontColor: formCfg.fontColor || '#ffffff',
              bgColor: formCfg.bgColor || '#0a0a0a',
              titleColor: formCfg.titleColor || '#ffffff',
              btnColor: formCfg.btnColor || '#6c63ff',
              btnText: formCfg.btnText || 'Register Now',
              formTitle: formCfg.formTitle || '',
              logoText: formCfg.logoText || 'VMSeva',
              fontFamily: formCfg.fontFamily || 'Inter',
              borderRadius: formCfg.borderRadius || '8px',
              successMsg: formCfg.successMsg || 'Registration successful! Thank you.',
              fields: formCfg.fields || ['name', 'phone', 'email', 'college', 'gender', 'address', 'notes']
            });
          }
        })
        .catch(err => {
          console.error('Failed to load general config:', err.message);
        });
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setLoading(true);
    setMsg({ text: '', ok: true });

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.post(`${backendUrl}/preaching/public/submit-form`, {
        ...form,
        eventId: eventId ? parseInt(eventId) : null
      });
      setMsg({ text: config.successMsg || 'Registration successful! Thank you.', ok: true });
      setForm({
        name: '',
        phone: '',
        email: '',
        college: '',
        gender: 'Male',
        address: '',
        notes: ''
      });
    } catch (err) {
      setMsg({ 
        text: err.response?.data?.message || 'Failed to submit form. Please check details.', 
        ok: false 
      });
    } finally {
      setLoading(false);
    }
  };

  const isFieldVisible = (fieldName) => {
    return config.fields.includes(fieldName);
  };

  return (
    <div className="auth-bg" style={{ fontFamily: `'${config.fontFamily}', sans-serif`, backgroundColor: config.bgColor, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="auth-logo" style={{ color: config.titleColor }}>{config.logoText || 'VMSeva'}</div>
        <div className="auth-subtitle" style={{ color: config.fontColor, opacity: 0.7 }}>
          {config.formTitle ? config.formTitle : (eventTitle ? `Registration for ${eventTitle}` : 'Preaching Module Registration Form')}
        </div>

        {msg.text && (
          <div className={msg.ok ? 'msg-success' : 'msg-error'} style={{
            padding: '10px 14px',
            borderRadius: config.borderRadius,
            marginBottom: 16,
            fontSize: config.fontSize,
            border: `1px solid ${msg.ok ? 'rgba(0,204,102,0.3)' : 'rgba(255,68,68,0.3)'}`,
            background: msg.ok ? 'rgba(0,204,102,0.1)' : 'rgba(255,68,68,0.1)',
            color: msg.ok ? '#00cc66' : '#ff4444'
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={submit}>
          {isFieldVisible('name') && (
            <div className="field">
              <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Full Name *</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                value={form.name} 
                style={{ borderRadius: config.borderRadius, fontSize: config.fontSize, color: config.fontColor, borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {isFieldVisible('phone') && (
              <div className="field">
                <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Phone Number</label>
                <input 
                  type="text" 
                  placeholder="9876543210"
                  value={form.phone} 
                  style={{ borderRadius: config.borderRadius, fontSize: config.fontSize, color: config.fontColor, borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                  onChange={e => setForm({ ...form, phone: e.target.value })} 
                />
              </div>
            )}
            {isFieldVisible('gender') && (
              <div className="field">
                <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Gender</label>
                <select 
                  value={form.gender} 
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: config.borderRadius,
                    color: config.fontColor,
                    fontSize: config.fontSize,
                    outline: 'none'
                  }}
                >
                  <option value="Male" style={{ background: '#222' }}>Male</option>
                  <option value="Female" style={{ background: '#222' }}>Female</option>
                  <option value="Other" style={{ background: '#222' }}>Other</option>
                </select>
              </div>
            )}
          </div>

          {isFieldVisible('email') && (
            <div className="field">
              <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com"
                value={form.email} 
                style={{ borderRadius: config.borderRadius, fontSize: config.fontSize, color: config.fontColor, borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>
          )}

          {isFieldVisible('college') && (
            <div className="field">
              <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>College / Company</label>
              <input 
                type="text" 
                placeholder="Name of college or work place"
                value={form.college} 
                style={{ borderRadius: config.borderRadius, fontSize: config.fontSize, color: config.fontColor, borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                onChange={e => setForm({ ...form, college: e.target.value })} 
              />
            </div>
          )}

          {isFieldVisible('address') && (
            <div className="field">
              <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Residential Address</label>
              <textarea 
                placeholder="Enter current address"
                rows={2}
                value={form.address} 
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: config.borderRadius,
                  color: config.fontColor,
                  fontSize: config.fontSize,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
          )}

          {isFieldVisible('notes') && (
            <div className="field">
              <label style={{ fontSize: `calc(${config.fontSize} - 2px)`, color: config.fontColor }}>Additional Notes</label>
              <textarea 
                placeholder="Any comments, spiritual interests, etc."
                rows={2}
                value={form.notes} 
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: config.borderRadius,
                  color: config.fontColor,
                  fontSize: config.fontSize,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading} style={{
            background: config.btnColor,
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: config.borderRadius,
            cursor: 'pointer',
            fontSize: config.fontSize,
            fontWeight: 'bold',
            width: '100%',
            marginTop: 8
          }}>
            {loading ? 'Submitting...' : config.btnText}
          </button>
        </form>
      </div>
    </div>
  );
}
