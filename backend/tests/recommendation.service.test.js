// tests/recommendation.service.test.js
// Unit tests for collaborative filtering and popularity-based services (CS6905 Group 01)
// Run: npm test

const {
  getCollaborativeRecommendations,
  getUserSimilarities,
} = require('../services/collaborative.service');

const {
  getPopularityRecommendations,
  computePopularityScore,
} = require('../services/popularity.service');

// ─── Mock data ─────────────────────────────────────────────────────────────

const mockProducts = [
  { productId: 'p1', title: 'Laptop',        category: 'Electronics', price: 999, rating: 4.5, stock: 20 },
  { productId: 'p2', title: 'Headphones',    category: 'Electronics', price: 149, rating: 4.3, stock: 50 },
  { productId: 'p3', title: 'Running Shoes', category: 'Sports',      price: 89,  rating: 4.7, stock: 100 },
  { productId: 'p4', title: 'Yoga Mat',      category: 'Sports',      price: 29,  rating: 4.6, stock: 75 },
  { productId: 'p5', title: 'Smartwatch',    category: 'Electronics', price: 299, rating: 4.4, stock: 30 },
  { productId: 'p6', title: 'Tent',          category: 'Outdoor',     price: 199, rating: 4.2, stock: 15 },
];

// Alice (u1) and Bob (u2) both bought p1 and p2 — high similarity
// Carol (u3) only bought sports items — low similarity with Alice
const mockInteractions = [
  { userId: 'u1', productId: 'p1', interactionType: 'purchase', weight: 3 },
  { userId: 'u1', productId: 'p2', interactionType: 'cart',     weight: 2 },
  { userId: 'u1', productId: 'p5', interactionType: 'view',     weight: 1 },
  { userId: 'u2', productId: 'p1', interactionType: 'purchase', weight: 3 },
  { userId: 'u2', productId: 'p2', interactionType: 'purchase', weight: 3 },
  { userId: 'u2', productId: 'p6', interactionType: 'cart',     weight: 2 },
  { userId: 'u3', productId: 'p3', interactionType: 'purchase', weight: 3 },
  { userId: 'u3', productId: 'p4', interactionType: 'purchase', weight: 3 },
];

// ─── getUserSimilarities Tests ─────────────────────────────────────────────

describe('getUserSimilarities', () => {
  test('returns an array of user similarity objects', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    expect(Array.isArray(sims)).toBe(true);
    expect(sims.length).toBeGreaterThan(0);
  });

  test('does not include the source user in results', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    const ids = sims.map(s => s.userId);
    expect(ids).not.toContain('u1');
  });

  test('each result has userId and similarity properties', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    sims.forEach(s => {
      expect(s).toHaveProperty('userId');
      expect(s).toHaveProperty('similarity');
      expect(typeof s.similarity).toBe('number');
    });
  });

  test('similarity scores are between 0 and 1 (Jaccard)', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    sims.forEach(s => {
      expect(s.similarity).toBeGreaterThanOrEqual(0);
      expect(s.similarity).toBeLessThanOrEqual(1);
    });
  });

  test('Alice and Bob are more similar than Alice and Carol (both bought p1, p2)', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    const bobSim   = sims.find(s => s.userId === 'u2')?.similarity || 0;
    const carolSim = sims.find(s => s.userId === 'u3')?.similarity || 0;
    expect(bobSim).toBeGreaterThan(carolSim);
  });

  test('results are sorted by similarity descending', () => {
    const sims = getUserSimilarities('u1', mockInteractions);
    for (let i = 1; i < sims.length; i++) {
      expect(sims[i - 1].similarity).toBeGreaterThanOrEqual(sims[i].similarity);
    }
  });

  test('returns empty or zero-similarity results for user with no interactions', () => {
    const sims = getUserSimilarities('u_new', mockInteractions);
    // Either empty or all zeros (Jaccard of {} with any set = 0)
    sims.forEach(s => expect(s.similarity).toBe(0));
  });
});

// ─── getCollaborativeRecommendations Tests ────────────────────────────────

describe('getCollaborativeRecommendations', () => {
  test('returns null or array for user with interactions', () => {
    const result = getCollaborativeRecommendations('u1', mockInteractions, mockProducts);
    // Service returns null for cold start, array for warm users
    expect(result === null || Array.isArray(result)).toBe(true);
  });

  test('returns a non-empty array for user with interactions and similar peers', () => {
    const recs = getCollaborativeRecommendations('u1', mockInteractions, mockProducts, 10);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  test('does not recommend products Alice has already interacted with', () => {
    const recs = getCollaborativeRecommendations('u1', mockInteractions, mockProducts, 10);
    if (!recs) return; // cold start case — skip
    const alreadySeen = new Set(['p1', 'p2', 'p5']); // Alice's interactions
    recs.forEach(r => {
      expect(alreadySeen.has(r.productId)).toBe(false);
    });
  });

  test('respects the limit parameter', () => {
    const recs = getCollaborativeRecommendations('u1', mockInteractions, mockProducts, 2);
    if (!recs) return;
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  test('p6 (Bob-only product) should appear for Alice since Bob is similar', () => {
    const recs = getCollaborativeRecommendations('u1', mockInteractions, mockProducts, 10);
    if (!recs) return;
    const ids = recs.map(r => r.productId);
    expect(ids).toContain('p6');
  });

  test('returns null for cold-start user (no interactions)', () => {
    const result = getCollaborativeRecommendations('u_coldstart', mockInteractions, mockProducts, 5);
    expect(result).toBeNull();
  });
});

// ─── computePopularityScore Tests ─────────────────────────────────────────

describe('computePopularityScore', () => {
  test('returns a number', () => {
    const score = computePopularityScore(mockProducts[0]);
    expect(typeof score).toBe('number');
  });

  test('higher-rated product scores higher (same stock)', () => {
    const highRated = { rating: 5.0, stock: 50 };
    const lowRated  = { rating: 3.0, stock: 50 };
    expect(computePopularityScore(highRated)).toBeGreaterThan(computePopularityScore(lowRated));
  });

  test('higher-stock product scores higher (same rating)', () => {
    const highStock = { rating: 4.5, stock: 200 };
    const lowStock  = { rating: 4.5, stock: 5 };
    expect(computePopularityScore(highStock)).toBeGreaterThan(computePopularityScore(lowStock));
  });

  test('zero-stock gives non-negative score (log(1)=0 so score=0)', () => {
    expect(computePopularityScore({ rating: 4.5, stock: 0 })).toBeGreaterThanOrEqual(0);
  });

  test('formula matches rating * log(stock + 1)', () => {
    const product = { rating: 4.0, stock: 99 };
    const expected = 4.0 * Math.log(100);
    expect(computePopularityScore(product)).toBeCloseTo(expected, 4);
  });
});

// ─── getPopularityRecommendations Tests ───────────────────────────────────

describe('getPopularityRecommendations', () => {
  test('returns an array with no options', () => {
    const recs = getPopularityRecommendations(mockProducts);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  test('respects the limit option', () => {
    const recs = getPopularityRecommendations(mockProducts, { limit: 2 });
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  test('results are sorted by popularityScore descending', () => {
    const recs = getPopularityRecommendations(mockProducts, { limit: 6 });
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].popularityScore).toBeGreaterThanOrEqual(recs[i].popularityScore);
    }
  });

  test('category option restricts results to that category', () => {
    const recs = getPopularityRecommendations(mockProducts, { category: 'Electronics' });
    recs.forEach(r => expect(r.category).toBe('Electronics'));
  });

  test('unknown category returns empty array', () => {
    const recs = getPopularityRecommendations(mockProducts, { category: 'FakeCategory' });
    expect(recs).toHaveLength(0);
  });

  test('excludeIds option excludes specified products', () => {
    const recs = getPopularityRecommendations(mockProducts, { excludeIds: ['p1', 'p2'] });
    const ids = recs.map(r => r.productId);
    expect(ids).not.toContain('p1');
    expect(ids).not.toContain('p2');
  });

  test('each result has a popularityScore property', () => {
    const recs = getPopularityRecommendations(mockProducts, { limit: 3 });
    recs.forEach(r => {
      expect(r).toHaveProperty('popularityScore');
      expect(typeof r.popularityScore).toBe('number');
    });
  });
});
