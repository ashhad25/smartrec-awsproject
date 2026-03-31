// pages/AlgorithmPage.jsx
import { useState, useEffect } from 'react';
import { recsAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBanner, EmptyState, Spinner } from '../components/ui.jsx';

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
      <span style={{ color: '#60a5fa', fontWeight: 600 }}>{label}: </span>
      <span style={{ color: '#94a3b8', fontFamily: mono ? 'var(--font-mono)' : undefined, fontSize: mono ? 12 : 13 }}>{value}</span>
    </div>
  );
}

export default function AlgorithmPage() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('tfidf');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    recsAPI.algorithmInfo(user.userId)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <EmptyState message="Sign in to see algorithm data" />
    </div>
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 20 }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 16, marginBottom: 20
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
          CS6905 — Algorithm Transparency Layer
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Live demonstration of all three recommendation pipelines. Offline batch training writes scores to simulated DynamoDB; online serving performs sub-10ms key lookup.
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          ['tfidf', 'Content-Based (TF-IDF)'],
          ['collab', 'Collaborative Filtering'],
          ['popularity', 'Popularity (Cold Start)'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: '9px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: activeTab === id ? '#1d4ed8' : 'var(--bg-elevated)',
            color: activeTab === id ? '#fff' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 500, transition: 'all 0.15s'
          }}>
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : data && (
        <>
          {/* ── TF-IDF tab ─────────────────────────────────── */}
          {activeTab === 'tfidf' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 12 }}>How TF-IDF Works in this System</div>
                {data.algorithms.tfidf.howItWorks.map((step, i) => (
                  <InfoRow key={i} label={`Step ${i + 1}`} value={step} />
                ))}
              </div>

              {/* Sample product */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                  TF-IDF vector computed for: <span style={{ color: '#93c5fd', fontWeight: 600 }}>{data.algorithms.tfidf.sampleProduct.title}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Top 15 terms by TF-IDF weight
                </div>
                {data.algorithms.tfidf.topTerms.map(({ term, score }) => (
                  <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#e2e8f0', minWidth: 120 }}>{term}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--bg-overlay)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', background: '#3b82f6', borderRadius: 3,
                        width: `${(score / (data.algorithms.tfidf.topTerms[0]?.score || 1)) * 100}%`
                      }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60a5fa', minWidth: 50, textAlign: 'right' }}>{score.toFixed(4)}</span>
                  </div>
                ))}
              </div>

              {/* Similar products */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Top cosine-similar products
                </div>
                {data.algorithms.tfidf.similarProducts.map((p, i) => (
                  <div key={p.id} style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-faint)', minWidth: 24 }}>#{i + 1}</span>
                    <img src={p.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.category.replace(/-/g, ' ')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6' }}>{(p.score * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>cosine sim</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Collaborative tab ──────────────────────────── */}
          {activeTab === 'collab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 12 }}>User-User Collaborative Filtering</div>
                {data.algorithms.collaborative.howItWorks.map((step, i) => (
                  <InfoRow key={i} label={`Step ${i + 1}`} value={step} />
                ))}
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Jaccard similarity with other users
                </div>
                {data.algorithms.collaborative.userSimilarities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 6 }}>Cold Start: No interaction history</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {user.name} has no recorded interactions. Collaborative filtering is unavailable — system falls back to Popularity Ranking.
                    </div>
                  </div>
                ) : data.algorithms.collaborative.userSimilarities.map(({ userId, similarity, commonItems, totalUnion, user: u }) => (
                  <div key={userId} style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {u?.name?.split(' ').map(w => w[0]).join('') || '??'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{u?.name ?? userId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {u?.segmentId} · {commonItems} common / {totalUnion} total items
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#60a5fa' }}>{(similarity * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Jaccard sim</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Popularity tab ─────────────────────────────── */}
          {activeTab === 'popularity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd', marginBottom: 12 }}>Popularity-Based Ranking (Cold Start)</div>
                {data.algorithms.popularity.howItWorks.map((step, i) => (
                  <InfoRow key={i} label={`Step ${i + 1}`} value={step} />
                ))}
              </div>

              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Top products by popularity score (rating × log(stock + 1))
                </div>
                {data.algorithms.popularity.topProducts.map((p, i) => (
                  <div key={p.id} style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 12
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-faint)', minWidth: 24 }}>#{i + 1}</span>
                    <img src={p.thumbnail} alt="" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        ★ {p.rating} · stock: {p.stock}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>{p.popularityScore.toFixed(3)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>pop. score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
