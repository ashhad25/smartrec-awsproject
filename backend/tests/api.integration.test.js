// tests/api.integration.test.js
// Integration tests for all REST API endpoints (CS6905 Group 01)
// Run: npm test
// Uses supertest to make real HTTP requests against the Express app.

const request = require('supertest');
const app = require('../server');

// ─── Auth helpers ──────────────────────────────────────────────────────────

let authToken = '';
let testUserId = '';

const demoEmail = 'alex@example.com';
const demoPassword = 'password';

// ─── Auth Tests ────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  test('returns 200 with token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: demoEmail, password: demoPassword });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    authToken = res.body.token;
    testUserId = res.body.user.userId;
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: demoEmail, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password' });
    expect(res.status).toBe(400);
  });

  test('returns 404 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/auth/me', () => {
  test('returns user data with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(demoEmail);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/users', () => {
  test('returns list of all demo users', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThan(0);
  });
});

// ─── Products Tests ────────────────────────────────────────────────────────

describe('GET /api/products', () => {
  test('returns paginated product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products.length).toBeGreaterThan(0);
  });

  test('supports search query', async () => {
    const res = await request(app).get('/api/products?search=headphone');
    expect(res.status).toBe(200);
    const titles = res.body.products.map(p => p.title.toLowerCase());
    titles.forEach(t => expect(t).toContain('headphone'));
  });

  test('supports category filter', async () => {
    const res = await request(app).get('/api/products?category=Electronics');
    expect(res.status).toBe(200);
    res.body.products.forEach(p => {
      expect(p.category).toBe('Electronics');
    });
  });

  test('respects limit parameter', async () => {
    const res = await request(app).get('/api/products?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(5);
  });

  test('includes categories array with counts', async () => {
    const res = await request(app).get('/api/products');
    expect(res.body.categories).toBeDefined();
    expect(Array.isArray(res.body.categories)).toBe(true);
    res.body.categories.forEach(c => {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('count');
    });
  });

  test('sort=price_asc returns ascending prices', async () => {
    const res = await request(app).get('/api/products?sort=price_asc&limit=10');
    expect(res.status).toBe(200);
    const prices = res.body.products.map(p => p.price);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });
});

describe('GET /api/products/categories', () => {
  test('returns categories with counts', async () => {
    const res = await request(app).get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    res.body.categories.forEach(c => {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('count');
    });
  });
});

describe('GET /api/products/:id', () => {
  test('returns single product by id', async () => {
    const listRes = await request(app).get('/api/products?limit=1');
    const productId = listRes.body.products[0].productId;

    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.productId).toBe(productId);
  });

  test('returns 404 for unknown product id', async () => {
    const res = await request(app).get('/api/products/nonexistent_id_xyz');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/products (create)', () => {
  let createdId;

  test('creates product with valid auth token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Product for Integration Test',
        description: 'This is a test product created by integration tests',
        category: 'Electronics',
        price: 9.99,
        stock: 100,
        rating: 4.0,
        tags: ['test', 'integration'],
      });
    expect(res.status).toBe(201);
    expect(res.body.product).toBeDefined();
    expect(res.body.product.title).toBe('Test Product for Integration Test');
    createdId = res.body.product.productId;
  });

  test('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({ title: 'Unauthorized Product', price: 1, stock: 1, category: 'Electronics', description: 'x' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Missing fields' });
    expect(res.status).toBe(400);
  });

  // Cleanup created product
  afterAll(async () => {
    if (createdId) {
      await request(app)
        .delete(`/api/products/${createdId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});

// ─── Recommendations Tests ─────────────────────────────────────────────────

describe('GET /api/recommendations/popular', () => {
  test('returns popular products', async () => {
    const res = await request(app).get('/api/recommendations/popular');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('supports category filter', async () => {
    const res = await request(app).get('/api/recommendations/popular?category=Electronics');
    expect(res.status).toBe(200);
    res.body.data.forEach(p => {
      expect(p.category).toBe('Electronics');
    });
  });

  test('respects limit param', async () => {
    const res = await request(app).get('/api/recommendations/popular?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
  });
});

describe('GET /api/recommendations/for-you/:userId', () => {
  test('returns personalised recommendations for known user', async () => {
    const res = await request(app).get(`/api/recommendations/for-you/${testUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.algorithm).toBeDefined();
  });

  test('returns popularity fallback for cold-start user (newuser)', async () => {
    // newuser@example.com has zero interactions in seed data
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newuser@example.com', password: 'password' });
    const newUserId = loginRes.body.user.userId;

    const res = await request(app).get(`/api/recommendations/for-you/${newUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.algorithm).toMatch(/popularity|cold/i);
  });
});

describe('GET /api/recommendations/similar/:productId', () => {
  test('returns similar products via TF-IDF', async () => {
    const listRes = await request(app).get('/api/products?limit=1');
    const productId = listRes.body.products[0].productId;

    const res = await request(app).get(`/api/recommendations/similar/${productId}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const ids = res.body.data.map(p => p.productId);
    expect(ids).not.toContain(productId);
  });
});

describe('GET /api/recommendations/algorithm-info/:userId', () => {
  test('returns algorithm transparency data', async () => {
    const res = await request(app).get(`/api/recommendations/algorithm-info/${testUserId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

// ─── Interactions Tests ────────────────────────────────────────────────────

describe('POST /api/interactions', () => {
  let createdInteractionId;

  test('records a view interaction', async () => {
    const listRes = await request(app).get('/api/products?limit=1');
    const productId = listRes.body.products[0].productId;

    const res = await request(app)
      .post('/api/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId, interactionType: 'view' });
    expect(res.status).toBe(201);
    expect(res.body.interaction).toBeDefined();
    createdInteractionId = res.body.interaction.id;
  });

  test('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/interactions')
      .send({ productId: 'p1', interactionType: 'view' });
    expect(res.status).toBe(401);
  });

  test('returns 400 for invalid interaction type', async () => {
    const res = await request(app)
      .post('/api/interactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId: 'p1', interactionType: 'invalid_type' });
    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    if (createdInteractionId) {
      await request(app)
        .delete(`/api/interactions/${createdInteractionId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});

describe('GET /api/interactions/:userId', () => {
  test('returns interaction history for authenticated user', async () => {
    const res = await request(app)
      .get(`/api/interactions/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.interactions)).toBe(true);
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get(`/api/interactions/${testUserId}`);
    expect(res.status).toBe(401);
  });
});

// ─── Health Check ──────────────────────────────────────────────────────────

describe('GET /health', () => {
  test('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.products).toBeGreaterThan(0);
    expect(res.body.users).toBeGreaterThan(0);
  });
});

describe('GET /api', () => {
  test('returns API documentation', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.name).toBeDefined();
    expect(res.body.endpoints).toBeDefined();
  });
});

describe('GET /api/nonexistent', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/totally_unknown_route');
    expect(res.status).toBe(404);
  });
});
