// tests/tfidf.service.test.js
// Unit tests for TF-IDF content-based filtering service (CS6905 Group 01)
// Run: npm test

const {
  buildTFIDFVectors,
  getContentBasedRecommendations,
} = require('../services/tfidf.service');

// ─── Mock product data ─────────────────────────────────────────────────────

const mockProducts = [
  {
    productId: 'p1',
    title: 'Wireless Bluetooth Headphones',
    description: 'Premium over-ear headphones with active noise cancellation',
    category: 'Electronics',
    tags: ['wireless', 'bluetooth', 'audio'],
    price: 149.99,
    rating: 4.5,
    stock: 50,
  },
  {
    productId: 'p2',
    title: 'Wireless Gaming Mouse',
    description: 'High precision wireless mouse for gaming with long battery',
    category: 'Electronics',
    tags: ['wireless', 'gaming', 'mouse'],
    price: 79.99,
    rating: 4.3,
    stock: 30,
  },
  {
    productId: 'p3',
    title: 'Running Shoes for Men',
    description: 'Lightweight comfortable running shoes with good grip',
    category: 'Sports & Outdoors',
    tags: ['running', 'shoes', 'sports'],
    price: 89.99,
    rating: 4.7,
    stock: 100,
  },
  {
    productId: 'p4',
    title: 'Yoga Mat Non-Slip',
    description: 'Premium yoga mat with non-slip surface for exercise',
    category: 'Sports & Outdoors',
    tags: ['yoga', 'exercise', 'mat'],
    price: 29.99,
    rating: 4.6,
    stock: 75,
  },
  {
    productId: 'p5',
    title: 'Bluetooth Speaker Portable',
    description: 'Waterproof portable bluetooth speaker with 12-hour battery',
    category: 'Electronics',
    tags: ['bluetooth', 'speaker', 'portable'],
    price: 59.99,
    rating: 4.4,
    stock: 45,
  },
];

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('buildTFIDFVectors', () => {
  test('returns an array with the same number of entries as products', () => {
    const vectors = buildTFIDFVectors(mockProducts);
    expect(vectors).toHaveLength(mockProducts.length);
  });

  test('each vector entry has productId and vector properties', () => {
    const vectors = buildTFIDFVectors(mockProducts);
    vectors.forEach(v => {
      expect(v).toHaveProperty('productId');
      expect(v).toHaveProperty('vector');
      expect(typeof v.vector).toBe('object');
    });
  });

  test('vector has numeric values for each term', () => {
    const vectors = buildTFIDFVectors(mockProducts);
    const firstVector = vectors[0].vector;
    Object.values(firstVector).forEach(score => {
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  test('common terms have lower IDF weight than rare terms', () => {
    // "wireless" appears in 3/5 docs, specific product terms appear in 1/5
    const vectors = buildTFIDFVectors(mockProducts);
    const p1Vec = vectors.find(v => v.productId === 'p1').vector;
    // The headphones doc has "wireless" (common) and "cancellation" (rare)
    // Both contribute to the vector but cancellation should have higher IDF
    const wirelessScore = p1Vec['wireless'] || 0;
    const cancellationScore = p1Vec['cancellation'] || 0;
    // Just verify both are present and cancellation has higher weight
    expect(cancellationScore).toBeGreaterThan(wirelessScore);
  });

  test('handles empty products array', () => {
    const vectors = buildTFIDFVectors([]);
    expect(vectors).toHaveLength(0);
  });

  test('handles product with empty description and tags', () => {
    const products = [{
      productId: 'px',
      title: 'Test',
      description: '',
      category: 'Electronics',
      tags: [],
      price: 10,
      rating: 4.0,
      stock: 5,
    }];
    const vectors = buildTFIDFVectors(products);
    expect(vectors).toHaveLength(1);
    expect(vectors[0].productId).toBe('px');
  });
});

describe('getContentBasedRecommendations', () => {
  let tfidfVectors;

  beforeAll(() => {
    tfidfVectors = buildTFIDFVectors(mockProducts);
  });

  test('returns an array of recommended products', () => {
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 3);
    expect(Array.isArray(recs)).toBe(true);
  });

  test('does not include the source product in results', () => {
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 4);
    const ids = recs.map(r => r.productId);
    expect(ids).not.toContain('p1');
  });

  test('respects the limit parameter', () => {
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 2);
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  test('ranks electronics closer to other electronics (same category)', () => {
    // p1 is electronics/wireless, p2 and p5 are also electronics/wireless
    // p3 and p4 are sports — they should rank lower
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 4);
    const ids = recs.map(r => r.productId);
    // p2 (wireless gaming mouse) or p5 (bluetooth speaker) should appear in top 2
    const topTwo = ids.slice(0, 2);
    const hasElectronics = topTwo.includes('p2') || topTwo.includes('p5');
    expect(hasElectronics).toBe(true);
  });

  test('returns empty array for unknown product id', () => {
    const recs = getContentBasedRecommendations('unknown_id', mockProducts, tfidfVectors, 3);
    expect(recs).toHaveLength(0);
  });

  test('returns fewer results if fewer products are available', () => {
    const smallList = mockProducts.slice(0, 2);
    const vectors = buildTFIDFVectors(smallList);
    const recs = getContentBasedRecommendations('p1', smallList, vectors, 10);
    expect(recs.length).toBeLessThan(10);
  });

  test('each recommendation includes a similarity score', () => {
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 3);
    recs.forEach(r => {
      expect(r).toHaveProperty('score');
      expect(typeof r.score).toBe('number');
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  test('similarity scores are in descending order', () => {
    const recs = getContentBasedRecommendations('p1', mockProducts, tfidfVectors, 4);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].score).toBeGreaterThanOrEqual(recs[i].score);
    }
  });
});
