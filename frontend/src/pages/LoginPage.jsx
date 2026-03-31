import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';

function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function LoginPage({ onDone }) {
  const { login, register } = useAuth();
  const [mode, setMode]       = useState('login');
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
      onDone && onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', padding: 20
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 36, width: '100%', maxWidth: 380
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <circle cx="4" cy="4" r="2" fill="white"/><circle cx="10" cy="4" r="2" fill="white"/>
              <circle cx="4" cy="10" r="2" fill="white"/><circle cx="10" cy="10" r="2" fill="white"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>SmartRec</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CS6905 · Smart Product Recommendation System</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, marginBottom: 20 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setShowPassword(false); }} style={{
              flex: 1, padding: '7px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: mode === m ? '#1d4ed8' : 'transparent',
              color: mode === m ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 500
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input type="text" placeholder="Your name" value={form.name}
              onChange={e => set('name', e.target.value)} style={inputStyle} />
          )}
          <input type="email" placeholder="Email address" value={form.email}
            onChange={e => set('email', e.target.value)} required style={inputStyle} />

          {/* Password field with show/hide toggle */}
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {error && (
            <div style={{
              background: '#1a0a0a', border: '1px solid #450a0a',
              borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#ef4444'
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '10px', borderRadius: 8, border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#1e3a5f' : '#1d4ed8', color: '#fff',
            fontSize: 13, fontWeight: 600, marginTop: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {loading
              ? <><Spinner size={14} color="#fff" /> Working…</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo hint */}
        <div style={{ marginTop: 20, background: 'var(--bg-elevated)', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Demo accounts (password: "password")
          </div>
          {[
            ['alex@example.com',    'Alex Chen — Tech Enthusiast'],
            ['sarah@example.com',   'Sarah Miller — Fashion & Beauty'],
            ['james@example.com',   'James Thompson — Sports'],
            ['emma@example.com',    'Emma Davis — Home & Kitchen'],
            ['newuser@example.com', 'New User — Cold Start Demo'],
          ].map(([email, label]) => (
            <button key={email}
              onClick={() => { setForm({ name: '', email, password: 'password' }); setMode('login'); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: form.email === email ? '#93c5fd' : 'var(--text-muted)',
                fontSize: 11, borderRadius: 4, marginBottom: 2
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-primary)',
  outline: 'none', boxSizing: 'border-box',
};