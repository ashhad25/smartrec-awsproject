// components/ui.jsx  — shared design system components

// ── Stars ────────────────────────────────────────────────────────
export function Stars({ rating, size = 10 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} width={size} height={size} viewBox="0 0 10 10">
          <polygon
            points="5,1 6.2,3.8 9.5,4.1 7.2,6.2 7.9,9.4 5,7.8 2.1,9.4 2.8,6.2 0.5,4.1 3.8,3.8"
            fill={s <= Math.round(rating) ? '#f59e0b' : '#374151'}
          />
        </svg>
      ))}
      <span style={{ fontSize: size - 1, color: '#9ca3af', marginLeft: 3 }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ── Badge ────────────────────────────────────────────────────────
const BADGE_STYLES = {
  collaborative: { bg: '#1e3a5f', color: '#60a5fa', label: 'Collab' },
  'content-based': { bg: '#3b1e5f', color: '#c084fc', label: 'Similar' },
  popularity: { bg: '#1e3b2d', color: '#34d399', label: 'Popular' },
};
export function AlgoBadge({ type }) {
  const s = BADGE_STYLES[type];
  if (!s) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
      background: s.bg, color: s.color, letterSpacing: '0.05em', textTransform: 'uppercase'
    }}>
      {s.label}
    </span>
  );
}

// ── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#3b82f6' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid #1f2937`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block'
    }} />
  );
}

// ── Loading state ────────────────────────────────────────────────
export function LoadingGrid({ count = 8 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: '#111827', borderRadius: 10, overflow: 'hidden',
          border: '1px solid #1f2937', animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          <div style={{ height: 140, background: '#1f2937' }} />
          <div style={{ padding: '10px 12px' }}>
            <div style={{ height: 8, background: '#1f2937', borderRadius: 4, marginBottom: 8, width: '60%' }} />
            <div style={{ height: 12, background: '#1f2937', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 12, background: '#1f2937', borderRadius: 4, width: '80%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Error banner ─────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: '#1a0a0a', border: '1px solid #450a0a', borderRadius: 10,
      padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, marginBottom: 2 }}>
          Failed to load
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{message}</div>
        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
          Make sure the backend is running: <code style={{ fontFamily: 'var(--font-mono)', color: '#6b7280' }}>cd backend && npm run dev</code>
        </div>
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
          padding: '6px 14px', color: '#d1d5db', fontSize: 12, flexShrink: 0
        }}>
          Retry
        </button>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────
export function EmptyState({ message = 'Nothing here yet', sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>○</div>
      <div style={{ fontSize: 14, color: '#d1d5db', marginBottom: 6 }}>{message}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b7280' }}>{sub}</div>}
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────────
const USER_COLORS = {
  'tech-enthusiast': '#3b82f6',
  'fashion-beauty':  '#ec4899',
  'sports-outdoor':  '#f97316',
  'home-lifestyle':  '#10b981',
  'cold-start':      '#8b5cf6',
};
export function Avatar({ user, size = 32 }) {
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = USER_COLORS[user.segmentId] || '#6b7280';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.35), fontWeight: 700, color: '#fff', flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

// ── Category color map ────────────────────────────────────────────
export const CAT_COLORS = {
  beauty: '#ec4899', fragrances: '#8b5cf6', furniture: '#f97316',
  groceries: '#10b981', 'home-decoration': '#06b6d4', 'kitchen-accessories': '#f59e0b',
  laptops: '#3b82f6', 'mens-shirts': '#6366f1', 'mens-shoes': '#14b8a6',
  'mens-watches': '#f43f5e', 'mobile-accessories': '#0ea5e9', motorcycle: '#84cc16',
  'skin-care': '#d946ef', smartphones: '#22c55e', 'sports-accessories': '#fb923c',
  sunglasses: '#a78bfa', tablets: '#38bdf8', tops: '#fb7185',
  vehicle: '#4ade80', 'womens-bags': '#c084fc', 'womens-dresses': '#f472b6',
  'womens-jewellery': '#fbbf24', 'womens-shoes': '#34d399', 'womens-watches': '#818cf8'
};

// Inject animations into document once
if (typeof document !== 'undefined' && !document.getElementById('smartrec-anim')) {
  const style = document.createElement('style');
  style.id = 'smartrec-anim';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(style);
}
