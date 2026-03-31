// pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { interactionsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingGrid, ErrorBanner, EmptyState, Stars } from '../components/ui.jsx';

const TYPE_STYLES = {
  purchase: { bg: '#1e3b2d', color: '#34d399', label: 'Purchase' },
  cart:     { bg: '#3b2d1e', color: '#fb923c', label: 'Cart' },
  view:     { bg: '#1e293b', color: '#64748b', label: 'View' },
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    interactionsAPI.history(user.userId)
      .then(res => setHistory(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleDelete(interactionId) {
    try {
      await interactionsAPI.delete(interactionId);
      setHistory(h => h.filter(i => i.interactionId !== interactionId));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEraseAll() {
    if (!confirm('Delete all your interaction data? (PIPEDA right to erasure)')) return;
    try {
      await interactionsAPI.eraseAll(user.userId);
      setHistory([]);
    } catch (err) {
      alert(err.message);
    }
  }

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <EmptyState message="Sign in to view your history" />
    </div>
  );

  const stats = {
    total:    history.length,
    purchases: history.filter(i => i.interactionType === 'purchase').length,
    carts:    history.filter(i => i.interactionType === 'cart').length,
    views:    history.filter(i => i.interactionType === 'view').length,
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Total Events', stats.total, '#6b7280'],
          ['Purchases', stats.purchases, '#34d399'],
          ['Cart Adds', stats.carts, '#fb923c'],
          ['Views', stats.views, '#64748b'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Interaction History
        </div>
        {history.length > 0 && (
          <button onClick={handleEraseAll} style={{
            background: '#1a0a0a', border: '1px solid #450a0a', borderRadius: 6,
            padding: '5px 12px', color: '#ef4444', fontSize: 11, cursor: 'pointer'
          }}>
            Erase All (PIPEDA)
          </button>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 72, background: 'var(--bg-elevated)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState message="No interactions yet" sub="Browse products and click on them — every view, cart add, and purchase is recorded here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {history.map(item => {
            const style = TYPE_STYLES[item.interactionType] || TYPE_STYLES.view;
            return (
              <div key={item.interactionId} style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14
              }}>
                {/* Product thumbnail */}
                {item.product?.thumbnail && (
                  <img src={item.product.thumbnail} alt=""
                    style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, background: '#1f2937', borderRadius: 6 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {item.product?.title ?? `Product #${item.productId}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(item.timestamp).toLocaleString()} · weight: {item.weight}
                  </div>
                </div>

                {/* Type badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5,
                  background: style.bg, color: style.color, flexShrink: 0
                }}>
                  {style.label}
                </span>

                {/* Delete */}
                <button onClick={() => handleDelete(item.interactionId)} title="Delete this interaction" style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 16, cursor: 'pointer', padding: '0 4px', flexShrink: 0
                }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
