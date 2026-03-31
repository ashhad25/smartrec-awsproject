// server.js
// SmartRec API Server — CS6905 Group 01
// Express.js REST API serving all recommendation endpoints.
//
// Architecture: Application Layer (Node.js/Express)
// Corresponds to API Gateway + Lambda pattern in the AWS design.
// In production, this runs on EC2/Fargate behind Amazon API Gateway.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import database (loads + pre-computes TF-IDF on startup)
const db = require('./db');

// Import routes
const authRoutes          = require('./routes/auth');
const productRoutes       = require('./routes/products');
const recommendationRoutes = require('./routes/recommendations');
const interactionRoutes   = require('./routes/interactions');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (simulates CloudWatch access logs)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
  });
  next();
});

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/products',        productRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/interactions',    interactionRoutes);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'SmartRec API',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    products: db.products.length,
    users: db.users.length,
    interactions: db.interactions.length,
    tfidfVectors: db.tfidfVectors.length,
    timestamp: new Date().toISOString()
  });
});

// ─── API Documentation ────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'Smart Product Recommendation System API',
    version: '1.0.0',
    group: 'CS6905 Group 01',
    endpoints: {
      auth: {
        'POST /api/auth/login':    'Login — returns JWT token (password: "password" for all demo users)',
        'POST /api/auth/register': 'Register new user',
        'GET  /api/auth/me':       'Get current user (requires Bearer token)',
        'GET  /api/auth/users':    'List all demo users'
      },
      products: {
        'GET  /api/products':           'List/search products (?category=&search=&sort=&page=&limit=)',
        'GET  /api/products/categories':'List all categories with counts',
        'GET  /api/products/:id':       'Get single product',
        'POST /api/products':           'Create product (auth required)',
        'PUT  /api/products/:id':       'Update product (auth required)',
        'DELETE /api/products/:id':     'Delete product (auth required)'
      },
      recommendations: {
        'GET /api/recommendations/for-you/:userId':        'Personalised feed (collab or cold-start)',
        'GET /api/recommendations/similar/:productId':     'Similar products (TF-IDF cosine similarity)',
        'GET /api/recommendations/popular':                'Popularity-based (?category=&limit=)',
        'GET /api/recommendations/algorithm-info/:userId': 'Algorithm transparency data'
      },
      interactions: {
        'POST   /api/interactions':              'Record interaction (view/cart/purchase) — auth required',
        'GET    /api/interactions/:userId':      'Get user history — auth required',
        'DELETE /api/interactions/:id':          'Delete interaction — auth required',
        'DELETE /api/interactions/user/:id/all': 'PIPEDA erasure — auth required'
      }
    }
  });
});

// ─── 404 handler ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Error handler ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   SmartRec API — CS6905 Group 01             ║');
  console.log(`║   Server running on http://localhost:${PORT}   ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║   Products:     ${String(db.products.length).padEnd(5)}                        ║`);
  console.log(`║   Users:        ${String(db.users.length).padEnd(5)}                        ║`);
  console.log(`║   Interactions: ${String(db.interactions.length).padEnd(5)}                        ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║   API Docs:  http://localhost:${PORT}/api        ║');
  console.log('║   Health:    http://localhost:${PORT}/health     ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
