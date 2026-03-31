// components/DetailPanel.jsx
import { useState, useEffect } from 'react';
import { Stars, AlgoBadge, CAT_COLORS, Spinner } from './ui.jsx';
import { recsAPI, interactionsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function DetailPanel({ product, onClose, onSelect }) {
  const { user } = useAuth();
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interacted, setInteracted] = useState(null);

  const catColor = CAT_COLORS[product.category] || '#6b7280';
  const discPrice = product.discountedPrice ??
    parseFloat((product.price * (1 - product.discountPercentage / 100)).toFixed(2));

  useEffect(() => {
    setLoading(true);
    recsAPI.similar(product.id, 6)
      .then(res => setSimilar(res.data))
      .catch(() => setSimilar([]))
      .finally(() => setLoading(false));
  }, [product.id]);

  async function handleInteraction(type) {
    if (!user) return;
    try {
      await interactionsAPI.record(product.id, type);
      setInteracted(type);
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: catColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {product.category.replace(/-/g, ' ')}{product.brand ? ` · ${product.brand}` : ''}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, maxWidth: 260 }}>
            {product.title}
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 20, padding: '0 4px', lineHeight: 1, flexShrink: 0
        }}>×</button>
      </div>

      {/* Image */}
      <img
        src={product.thumbnail} alt={product.title}
        style={{ width: '100%', height: 180, objectFit: 'contain', background: '#1f2937', borderRadius: 8 }}
        onError={e => { e.target.style.display = 'none'; }}
      />

      {/* Price & rating */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>${discPrice.toFixed(2)}</span>
          {product.discountPercentage > 2 && <>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ${product.price.toFixed(2)}
            </span>
            <span style={{ fontSize: 11, background: '#422006', color: '#fb923c', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
              -{Math.round(product.discountPercentage)}% off
            </span>
          </>}
        </div>
        <Stars rating={product.rating} size={12} />
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
        {product.description}
      </p>

      {/* Meta grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {[
          ['SKU', product.sku],
          ['Stock', `${product.stock} units`],
          ['Status', product.availabilityStatus],
          ['Category', product.category.replace(/-/g, ' ')]
        ].map(([k, v]) => (
          <div key={k} style={{ background: '#1f2937', borderRadius: 6, padding: '6px 10px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Interaction buttons (only when logged in) */}
      {user && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[['cart', 'Add to Cart'], ['purchase', 'Buy Now']].map(([type, label]) => (
            <button key={type} onClick={() => handleInteraction(type)} style={{
              flex: 1, padding: '9px 12px', borderRadius: 8, border: 'none',
              background: interacted === type ? '#1e3a5f' : (type === 'purchase' ? '#1d4ed8' : '#1f2937'),
              color: interacted === type ? '#60a5fa' : '#f9fafb',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s'
            }}>
              {interacted === type ? `✓ ${label}` : label}
            </button>
          ))}
        </div>
      )}

      {/* Similar products */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Similar products — TF-IDF cosine similarity
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={18} /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {similar.map(p => (
              <div key={p.id} onClick={() => onSelect(p)} style={{
                background: '#1f2937', borderRadius: 8, padding: 8, cursor: 'pointer',
                border: '1px solid var(--border)', transition: 'border-color 0.15s'
              }}>
                <img src={p.thumbnail} alt={p.title}
                  style={{ width: '100%', height: 60, objectFit: 'contain', marginBottom: 6 }}
                  onError={e => { e.target.style.display = 'none'; }} />
                <div style={{
                  fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3, marginBottom: 4,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>
                  {p.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>
                    ${parseFloat((p.price * (1 - p.discountPercentage / 100)).toFixed(2)).toFixed(2)}
                  </span>
                  <span style={{ fontSize: 9, color: '#60a5fa' }}>
                    {(p.recommendationScore * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
