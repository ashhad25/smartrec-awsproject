// components/ProductCard.jsx
import { Stars, AlgoBadge, CAT_COLORS } from './ui.jsx';
import { interactionsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductCard({ product, onSelect, selected = false, compact = false }) {
  const { user } = useAuth();
  const catColor = CAT_COLORS[product.category] || '#6b7280';
  const discPrice = product.discountedPrice ??
    parseFloat((product.price * (1 - product.discountPercentage / 100)).toFixed(2));

  async function handleClick() {
    if (user) {
      // Record view interaction in background — don't await, non-blocking
      interactionsAPI.record(product.id, 'view').catch(() => {});
    }
    onSelect && onSelect(product);
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background: selected ? '#1e2a3a' : 'var(--bg-elevated)',
        border: `1px solid ${selected ? '#3b82f6' : 'var(--border)'}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: compact ? 100 : 140, background: '#1f2937', flexShrink: 0 }}>
        <img
          src={product.thumbnail} alt={product.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        {product.algorithm && (
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <AlgoBadge type={product.algorithm} />
          </div>
        )}
        {product.discountPercentage > 10 && (
          <div style={{
            position: 'absolute', top: 6, left: 6, fontSize: 10, fontWeight: 700,
            background: '#422006', color: '#fb923c', padding: '2px 6px', borderRadius: 4
          }}>
            -{Math.round(product.discountPercentage)}%
          </div>
        )}
        {product.availabilityStatus === 'Out of Stock' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em'
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: compact ? '8px 10px' : '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 9, color: catColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {product.category.replace(/-/g, ' ')}
        </div>
        <div style={{
          fontSize: compact ? 12 : 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {product.title}
        </div>
        {!compact && <Stars rating={product.rating} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
          <span style={{ fontSize: compact ? 12 : 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            ${discPrice.toFixed(2)}
          </span>
          {product.discountPercentage > 2 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
