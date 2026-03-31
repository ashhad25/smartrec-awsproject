// db.js
// In-Memory Database — simulates DynamoDB tables for local development.
// In production, replace these reads with AWS DynamoDB SDK calls.
//
// DynamoDB Tables simulated here:
//   products      → Products table (PK: productId)
//   users         → Users table (PK: userId)
//   interactions  → Interactions table (PK: userId, SK: timestamp#id)
//
// The tfidfVectors cache simulates what would be stored in the
// tfidfVector field on each Product item in DynamoDB (or in S3 as
// a batch artifact).

const path = require('path');
const { buildTFIDFVectors } = require('./services/tfidf.service');

// Load seed data from JSON files
const products = require('./data/products.json');
const users = require('./data/users.json');
let interactions = require('./data/interactions.json');

// Pre-compute TF-IDF vectors on startup.
// In production this runs offline on EC2/Fargate and stores vectors
// back to DynamoDB Products table or S3 feature store.
console.log('⚙  Building TF-IDF vectors for', products.length, 'products...');
const tfidfVectors = buildTFIDFVectors(products);
console.log('✓  TF-IDF vectors ready');

module.exports = {
  products,
  users,
  get interactions() { return interactions; },
  set interactions(val) { interactions = val; },
  tfidfVectors,
};
