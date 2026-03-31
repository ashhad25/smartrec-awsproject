// AdminPage.jsx
// Product administration panel — full CRUD for the product catalog.
// Corresponds to the Admin API layer in the design doc:
//   POST   /api/products    — create
//   PUT    /api/products/:id — update
//   DELETE /api/products/:id — delete
// All writes require a valid JWT token (Bearer auth).

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { productsAPI } from '../services/api.js';
import { Stars, Spinner, ErrorBanner, EmptyState } from '../components/ui.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'beauty','fragrances','furniture','groceries','home-decoration',
  'kitchen-accessories','laptops','mens-shirts','mens-shoes','mens-watches',
  'mobile-accessories','motorcycle','skin-care','smartphones','sports-accessories',
  'sunglasses','tablets','tops','vehicle','womens-bags',
  'womens-dresses','womens-jewellery','womens-shoes','womens-watches',
];

const EMPTY_FORM = {
  title: '', description: '', category: CATEGORIES[0],
  price: '', originalPrice: '', brand: '', stock: '',
  rating: '4.0', tags: '',
};

function FormInput({ label, name, value, onChange, type = 'text', required, as, children, hint }) {
  const commonStyle = {
    width: '100%', padding: '8px 10px', fontSize: 14,
    background: '#2a2a2a',
    border: '1px solid #555',
    borderRadius: 6, color: '#ffffff',
    boxSizing: 'border-box',
    outline: 'none',
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: '#aaaaaa' }}>
        {label}{required && <span style={{ color: 'var(--color-text-danger)', marginLeft: 2 }}>*</span>}
      </label>
      {as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} required={required}
          rows={3} style={{ ...commonStyle, resize: 'vertical' }} />
      ) : as === 'select' ? (
        <select name={name} value={value} onChange={onChange} required={required} style={commonStyle}>
          {children}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={onChange} required={required} style={commonStyle} />
      )}
      {hint && <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '3px 0 0' }}>{hint}</p>}
    </div>
  );
}

// ─── Product Form Modal ────────────────────────────────────────────────────────

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    title: product.title || '',
    description: product.description || '',
    category: product.category || CATEGORIES[0],
    price: product.price || '',
    originalPrice: product.originalPrice || '',
    brand: product.brand || '',
    stock: product.stock || '',
    rating: product.rating || '4.0',
    tags: (product.tags || []).join(', '),
  } : { ...EMPTY_FORM });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        stock: parseInt(form.stock),
        rating: parseFloat(form.rating),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (product) {
        await productsAPI.update(product.productId, payload);
      } else {
        await productsAPI.create(payload);
      }
      onSave();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
          background: '#111111',
          borderRadius: 12, padding: 28, width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          border: '1px solid #444',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
            {product ? 'Edit product' : 'Add new product'}
          </h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: 20, padding: '0 4px',
          }}>×</button>
        </div>

        {error && <ErrorBanner message={error} style={{ marginBottom: 16 }} />}

        <form onSubmit={handleSubmit}>
          <FormInput label="Product title" name="title" value={form.title} onChange={handleChange} required />
          <FormInput label="Description" name="description" value={form.description} onChange={handleChange} as="textarea" required />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Category" name="category" value={form.category} onChange={handleChange} as="select" required>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </FormInput>
            <FormInput label="Brand" name="brand" value={form.brand} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Price ($)" name="price" value={form.price} onChange={handleChange} type="number" required hint="e.g. 49.99" />
            <FormInput label="Original price ($)" name="originalPrice" value={form.originalPrice} onChange={handleChange} type="number" hint="Leave blank if not on sale" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormInput label="Stock quantity" name="stock" value={form.stock} onChange={handleChange} type="number" required />
            <FormInput label="Rating (0–5)" name="rating" value={form.rating} onChange={handleChange} type="number" />
          </div>

          <FormInput label="Tags" name="tags" value={form.tags} onChange={handleChange} hint="Comma-separated: wireless, gaming, portable" />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 6, border: '1px solid var(--color-border-secondary)',
              background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14,
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 20px', borderRadius: 6, border: 'none',
              background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
              cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500,
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ──────────────────────────────────────────────────────

function ConfirmModal({ product, onClose, onConfirm, deleting }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-background-primary)', borderRadius: 12,
        padding: 28, width: '100%', maxWidth: 400,
        border: '1px solid var(--color-border-secondary)',
      }}>
        <h3 style={{ margin: '0 0 12px', fontWeight: 500 }}>Delete product?</h3>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 20px', fontSize: 14 }}>
          This will permanently remove <strong>{product.title}</strong> from the catalog.
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 6, border: '1px solid var(--color-border-secondary)',
            background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 14,
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={deleting} style={{
            padding: '8px 18px', borderRadius: 6, border: 'none',
            background: '#E24B4A', color: '#fff',
            cursor: deleting ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500,
            opacity: deleting ? 0.7 : 1,
          }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main AdminPage Component ─────────────────────────────────────────────────

export default function AdminPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      params.limit = 200;
      const data = await productsAPI.list(params);
      setProducts(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSave = async () => {
    setShowCreate(false);
    setEditProduct(null);
    showToast(editProduct ? 'Product updated' : 'Product created');
    await loadProducts();
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await productsAPI.delete(deleteProduct.productId);
      setDeleteProduct(null);
      showToast('Product deleted');
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const stockColor = (stock) => {
    if (stock <= 0) return '#E24B4A';
    if (stock < 10) return '#BA7517';
    return '#3B6D11';
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--color-background-tertiary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Product Admin</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Manage the product catalog — create, edit, or remove products.
              Changes persist for this session (simulating DynamoDB writes).
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            background: 'var(--color-text-primary)', color: 'var(--color-background-primary)',
            cursor: 'pointer', fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
          }}>
            + Add product
          </button>
        </div>

        {/* Filters */}
        <div style={{
          background: 'var(--color-background-primary)',
          borderRadius: 10, padding: 16, marginBottom: 20,
          border: '1px solid var(--color-border-tertiary)',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            type="text" placeholder="Search products…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: '1 1 200px', padding: '8px 12px', borderRadius: 6, fontSize: 14,
              border: '1px solid var(--color-border-secondary)',
              background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)',
            }}
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 6, fontSize: 14,
              border: '1px solid var(--color-border-secondary)',
              background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)',
            }}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
            {products.length} products
          </span>
        </div>

        {error && <ErrorBanner message={error} style={{ marginBottom: 16 }} />}

        {/* Product Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={28} />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            subtitle="Try adjusting your search or category filter"
          />
        ) : (
          <div style={{
            background: 'var(--color-background-primary)',
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--color-border-tertiary)',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 80px 80px 80px 110px',
              gap: 0, padding: '10px 16px',
              background: 'var(--color-background-secondary)',
              borderBottom: '1px solid var(--color-border-tertiary)',
              fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)',
            }}>
              <span>Product</span>
              <span>Category</span>
              <span style={{ textAlign: 'right' }}>Price</span>
              <span style={{ textAlign: 'right' }}>Stock</span>
              <span style={{ textAlign: 'right' }}>Rating</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {/* Table Rows */}
            {products.map((p, idx) => (
              <div key={p.productId} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 80px 80px 80px 110px',
                gap: 0, padding: '12px 16px', alignItems: 'center',
                borderBottom: idx < products.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Product name + brand */}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 500, fontSize: 14, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{p.title}</div>
                  {p.brand && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{p.brand}</div>
                  )}
                </div>

                {/* Category badge */}
                <div>
                  <span style={{
                    display: 'inline-block', fontSize: 11, padding: '2px 8px',
                    borderRadius: 10, background: 'var(--color-background-secondary)',
                    border: '1px solid var(--color-border-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}>{p.category}</span>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 500 }}>
                  ${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}
                </div>

                {/* Stock */}
                <div style={{
                  textAlign: 'right', fontSize: 13, fontWeight: 500,
                  color: stockColor(p.stock),
                }}>
                  {p.stock}
                </div>

                {/* Rating */}
                <div style={{ textAlign: 'right' }}>
                  <Stars rating={p.rating} size={12} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditProduct(p)} style={{
                    padding: '5px 12px', borderRadius: 5, fontSize: 12,
                    border: '1px solid var(--color-border-secondary)',
                    background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)',
                  }}>Edit</button>
                  <button onClick={() => setDeleteProduct(p)} style={{
                    padding: '5px 12px', borderRadius: 5, fontSize: 12,
                    border: '1px solid #F09595',
                    background: 'none', cursor: 'pointer', color: '#A32D2D',
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats footer */}
        <div style={{
          marginTop: 20, padding: 16,
          background: 'var(--color-background-primary)',
          borderRadius: 10, border: '1px solid var(--color-border-tertiary)',
          display: 'flex', gap: 32, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Total products', value: products.length },
            { label: 'Out of stock', value: products.filter(p => p.stock <= 0).length },
            { label: 'Low stock (< 10)', value: products.filter(p => p.stock > 0 && p.stock < 10).length },
            { label: 'Categories', value: [...new Set(products.map(p => p.category))].length },
            { label: 'Avg. rating', value: products.length ? (products.reduce((s, p) => s + (p.rating || 0), 0) / products.length).toFixed(1) : '—' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {(showCreate || editProduct) && (
        <ProductModal
          product={editProduct}
          onClose={() => { setShowCreate(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}
      {deleteProduct && (
        <ConfirmModal
          product={deleteProduct}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          background: toast.type === 'error' ? '#A32D2D' : '#3B6D11',
          color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
