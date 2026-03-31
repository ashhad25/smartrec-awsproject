// pages/BrowsePage.jsx
import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import DetailPanel from '../components/DetailPanel.jsx';
import { LoadingGrid, ErrorBanner, EmptyState } from '../components/ui.jsx';
import { productsAPI } from '../services/api.js';
import { CAT_COLORS } from '../components/ui.jsx';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'discount',   label: 'Biggest Discount' },
];

export default function BrowsePage({ sidebarOpen = true, setSidebarOpen }) {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selected, setSelected]     = useState(null);

  // Filters
  const [category, setCategory] = useState('');
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('popularity');
  const [page, setPage]         = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsAPI.list({ category, search, sort, page, limit: 24 });
      setProducts(res.data);
      setPagination(res.pagination);
      if (res.categories) setCategories(res.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [category, search, sort]);

  function handleSearch(e) {
    setSearch(e.target.value);
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 190, background: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        padding: 12, overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6
      }}>
        {/* Search */}
        <input
          value={search} onChange={handleSearch} placeholder="Search products…"
          style={{
            width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)',
            outline: 'none', boxSizing: 'border-box', marginBottom: 4
          }}
        />

        {/* Sort */}
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '6px 8px', fontSize: 11, color: 'var(--text-secondary)',
          outline: 'none', marginBottom: 8
        }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Category list */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Categories
        </div>
        <button onClick={() => setCategory('')} style={{
          width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 6, border: 'none',
          cursor: 'pointer', fontSize: 12, background: !category ? '#1e3a5f' : 'transparent',
          color: !category ? '#93c5fd' : 'var(--text-muted)', display: 'flex', justifyContent: 'space-between'
        }}>
          <span>All</span>
          <span style={{ color: 'var(--text-faint)', fontSize: 10 }}>{pagination.total ?? '—'}</span>
        </button>
        {categories.map(cat => {
          const color = CAT_COLORS[cat.name] || '#6b7280';
          return (
            <button key={cat.name} onClick={() => setCategory(cat.name)} style={{
              width: '100%', textAlign: 'left', padding: '5px 8px', borderRadius: 6, border: 'none',
              cursor: 'pointer', fontSize: 11, background: category === cat.name ? '#1e3a5f' : 'transparent',
              color: category === cat.name ? '#93c5fd' : 'var(--text-muted)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                  {cat.name.replace(/-/g, ' ')}
                </span>
              </span>
              <span style={{ color: 'var(--text-faint)', fontSize: 10, flexShrink: 0, marginLeft: 4 }}>{cat.count}</span>
            </button>
          );
        })}
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {error && <div style={{ marginBottom: 16 }}><ErrorBanner message={error} onRetry={fetchProducts} /></div>}

        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Grid */}
          <div style={{ flex: 1 }}>
            {/* Results bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {pagination.total ?? '—'} products
                {category && <span style={{ color: '#60a5fa' }}> in {category.replace(/-/g, ' ')}</span>}
                {search && <span style={{ color: '#60a5fa' }}> matching "{search}"</span>}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                Page {pagination.page ?? 1} of {pagination.totalPages ?? 1}
              </span>
            </div>

            {loading ? (
              <LoadingGrid count={12} />
            ) : products.length === 0 ? (
              <EmptyState message="No products found" sub="Try a different search or category" />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
                  {products.map(p => (
                    <ProductCard key={p.id} product={p} onSelect={setSelected} selected={selected?.id === p.id} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{
                      padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontSize: 12
                    }}>← Prev</button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                      return (
                        <button key={p} onClick={() => setPage(p)} style={{
                          padding: '6px 12px', borderRadius: 6, fontSize: 12,
                          border: '1px solid var(--border)',
                          background: p === page ? '#1d4ed8' : 'var(--bg-elevated)',
                          color: p === page ? '#fff' : 'var(--text-muted)', cursor: 'pointer'
                        }}>{p}</button>
                      );
                    })}
                    <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} style={{
                      padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                      cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      opacity: page >= pagination.totalPages ? 0.4 : 1, fontSize: 12
                    }}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0 }}>
              <DetailPanel product={selected} onClose={() => setSelected(null)} onSelect={setSelected} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
