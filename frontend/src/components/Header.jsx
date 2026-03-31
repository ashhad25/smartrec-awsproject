// components/Header.jsx
import { useState } from 'react';
import { Avatar } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const ADMIN_EMAILS = ['alex@example.com', 'ashhad.ahmed72@unb.ca'];

const TABS = [
  { id: 'browse',    label: 'Browse' },
  { id: 'foryou',   label: 'For You' },
  { id: 'history',  label: 'History' },
  { id: 'algorithm',label: 'Algorithms' },
  { id: 'system',   label: 'System' },
];

export default function Header({ activeTab, setActiveTab, onToggleSidebar }) {
  const { user, allUsers, switchUser, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header style={{
      background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
      padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12,
      height: 52, position: 'sticky', top: 0, zIndex: 100, flexShrink: 0
    }}>
      {/* Hamburger — only shown on BrowsePage via prop */}
      {onToggleSidebar && (
        <button onClick={onToggleSidebar} style={{
          width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
          background: 'transparent', cursor: 'pointer', flexShrink: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4, padding: 6,
        }}>
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 2, display: 'block' }} />
          <span style={{ width: 16, height: 2, background: 'var(--text-muted)', borderRadius: 2, display: 'block' }} />
        </button>
      )}
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="4" cy="4" r="2" fill="white" opacity="0.9"/>
            <circle cx="10" cy="4" r="2" fill="white" opacity="0.9"/>
            <circle cx="4" cy="10" r="2" fill="white" opacity="0.9"/>
            <circle cx="10" cy="10" r="2" fill="white" opacity="0.9"/>
            <line x1="4" y1="6" x2="4" y2="8" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="10" y1="6" x2="10" y2="8" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="6" y1="4" x2="8" y2="4" stroke="white" strokeWidth="1" opacity="0.5"/>
            <line x1="6" y1="10" x2="8" y2="10" stroke="white" strokeWidth="1" opacity="0.5"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>SmartRec</div>
        </div>
      </div>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
        {[...TABS, ...(ADMIN_EMAILS.includes(user?.email) ? [{ id: 'admin', label: 'Admin' }] : [])].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: activeTab === t.id ? '#1d4ed8' : 'transparent',
            color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, transition: 'all 0.15s'
          }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* User switcher */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button onClick={() => setShowMenu(!showMenu)} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '5px 10px', cursor: 'pointer'
        }}>
          {user ? (
            <>
              <Avatar user={user} size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{user.segmentId}</div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 9 }}>▾</span>
            </>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign in</span>
          )}
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, width: 220, zIndex: 200, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            <div style={{ padding: '8px 12px 6px', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Demo users — password: "password"
            </div>
            {allUsers.map(u => (
              <button key={u.userId} onClick={() => { switchUser(u.email); setShowMenu(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', background: u.userId === user?.userId ? '#1e3a5f' : 'transparent',
                  border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)'
                }}>
                <Avatar user={u} size={28} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{u.segmentId}</div>
                </div>
                {u.userId === user?.userId && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: '#60a5fa' }}>active</span>
                )}
              </button>
            ))}
            <button onClick={() => { logout(); setShowMenu(false); }} style={{
              width: '100%', padding: '9px 12px', background: 'transparent',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: 12, color: '#ef4444'
            }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
