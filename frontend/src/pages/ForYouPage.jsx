// pages/ForYouPage.jsx
import { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import DetailPanel from '../components/DetailPanel.jsx';
import { LoadingGrid, ErrorBanner, EmptyState, Avatar, Spinner } from '../components/ui.jsx';
import { recsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ALGO_INFO = {
  'collaborative': {
    label: 'Collaborative Filtering',
    color: '#60a5fa',
    bg: '#1e3a5f',
    desc: 'Based on users with similar purchase and browsing patterns'
  },
  'content-based': {
    label: 'Content-Based (TF-IDF)',
    color: '#c084fc',
    bg: '#3b1e5f',
    desc: 'Based on products similar to items you\'ve interacted with'
  },
  'popularity': {
    label: 'Popularity Ranking',
    color: '#34d399',
    bg: '#1e3b2d',
    desc: 'Top-rated products — browsing history builds your personal feed'
  },
};

export default function ForYouPage() {
  const { user } = useAuth();
  const [recs, setRecs]       = useState([]);
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    recsAPI.forYou(user.userId, 16)
      .then(res => { setRecs(res.data); setMeta(res.meta); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <EmptyState message="Sign in to see personalised recommendations" sub="Use the user switcher in the top-right corner" />
    </div>
  );

  const algoInfo = meta ? ALGO_INFO[meta.algorithm] : null;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      {/* User banner */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 16, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
      }}>
        <Avatar user={user} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
            {meta?.interactionCount > 0 ? `Personalised for ${user.name}` : `Welcome, ${user.name}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {meta?.reason ?? 'Loading your recommendations…'}
          </div>
        </div>

        {/* Algorithm badge */}
        {algoInfo && (
          <div style={{ background: algoInfo.bg, borderRadius: 8, padding: '8px 14px', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: algoInfo.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
              Active Algorithm
            </div>
            <div style={{ fontSize: 13, color: algoInfo.color, fontWeight: 600 }}>{algoInfo.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, maxWidth: 220 }}>{algoInfo.desc}</div>
          </div>
        )}

        {/* Interaction count */}
        {meta && (
          <div style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Interactions</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{meta.interactionCount}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>recorded events</div>
          </div>
        )}
      </div>

      {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} onRetry={() => { setLoading(true); recsAPI.forYou(user.userId, 16).then(r => { setRecs(r.data); setMeta(r.meta); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }} /></div>}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {loading ? <LoadingGrid count={12} /> : recs.length === 0 ? (
            <EmptyState message="No recommendations yet" sub="Browse or interact with some products first" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
              {recs.map(p => (
                <ProductCard key={p.id} product={p} onSelect={setSelected} selected={selected?.id === p.id} />
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>
            <DetailPanel product={selected} onClose={() => setSelected(null)} onSelect={setSelected} />
          </div>
        )}
      </div>
    </div>
  );
}
