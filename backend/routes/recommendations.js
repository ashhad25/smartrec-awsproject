// routes/recommendations.js
// Recommendation API endpoints — the core of the system.
// All three algorithms are exposed as separate endpoints.
//
// GET /api/recommendations/for-you/:userId     — personalised (collab or popularity fallback)
// GET /api/recommendations/similar/:productId  — content-based TF-IDF
// GET /api/recommendations/popular             — popularity-based
// GET /api/recommendations/algorithm-info/:userId — transparency data for the dashboard

const express = require('express');
const { optionalAuth, protect } = require('../middleware/auth');
const { getContentBasedRecommendations } = require('../services/tfidf.service');
const { getCollaborativeRecommendations, getUserSimilarities } = require('../services/collaborative.service');
const { getPopularityRecommendations } = require('../services/popularity.service');
const db = require('../db');

const router = express.Router();

/**
 * GET /api/recommendations/for-you/:userId
 *
 * Main "For You" feed — selects the best algorithm:
 * 1. If user has ≥3 interactions → collaborative filtering
 * 2. If 1-2 interactions → blend: popularity + content-based from known items
 * 3. If 0 interactions → cold start: popularity ranking
 *
 * In production this is a DynamoDB key lookup of pre-computed scores.
 * Response time target: < 10ms for cached scores.
 */
router.get('/for-you/:userId', optionalAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 12;

    const userInteractions = db.interactions.filter(i => i.userId === userId);
    const interactionCount = userInteractions.length;

    let recommendations = [];
    let algorithmUsed = '';
    let reason = '';

    if (interactionCount >= 3) {
      // Full collaborative filtering
      const collabRecs = getCollaborativeRecommendations(userId, db.interactions, db.products, limit);
      if (collabRecs && collabRecs.length > 0) {
        recommendations = collabRecs;
        algorithmUsed = 'collaborative';
        reason = `Personalised based on your ${interactionCount} interactions and users with similar taste`;
      }
    }

    if (recommendations.length === 0 && interactionCount > 0) {
      // Blend: get similar items to what user has interacted with
      const viewedIds = [...new Set(userInteractions.map(i => i.productId))];
      const contentRecs = new Map();
      viewedIds.forEach(pid => {
        const similar = getContentBasedRecommendations(pid, db.tfidfVectors, db.products, 6);
        similar.forEach(p => {
          if (!viewedIds.includes(p.id)) {
            contentRecs.set(p.id, Math.max(contentRecs.get(p.id) || 0, p.recommendationScore));
          }
        });
      });
      recommendations = [...contentRecs.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, score]) => ({
          ...db.products.find(p => p.id === id),
          recommendationScore: score,
          algorithm: 'content-based'
        }))
        .filter(p => p.id);

      algorithmUsed = 'content-based';
      reason = 'Based on items you\'ve browsed';
    }

    if (recommendations.length === 0) {
      // Cold start fallback
      recommendations = getPopularityRecommendations(db.products, { limit });
      algorithmUsed = 'popularity';
      reason = 'Popular products — start browsing to personalise your feed';
    }

    // Enrich with discounted price
    recommendations = recommendations.map(p => ({
      ...p,
      discountedPrice: parseFloat((p.price * (1 - p.discountPercentage / 100)).toFixed(2))
    }));

    res.json({
      success: true,
      data: recommendations,
      meta: {
        userId,
        algorithm: algorithmUsed,
        reason,
        interactionCount,
        count: recommendations.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/recommendations/similar/:productId
 *
 * Content-based recommendations using TF-IDF cosine similarity.
 * Returns products most similar to the given product.
 * Used in the product detail panel ("Customers also viewed").
 *
 * Query params:
 *   limit — number of results (default 8)
 */
router.get('/similar/:productId', (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const limit = parseInt(req.query.limit) || 8;

    const product = db.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const similar = getContentBasedRecommendations(productId, db.tfidfVectors, db.products, limit);
    const enriched = similar.map(p => ({
      ...p,
      discountedPrice: parseFloat((p.price * (1 - p.discountPercentage / 100)).toFixed(2))
    }));

    res.json({
      success: true,
      data: enriched,
      meta: {
        sourceProduct: { id: product.id, title: product.title },
        algorithm: 'content-based',
        metric: 'cosine-similarity',
        count: enriched.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/recommendations/popular
 *
 * Popularity-based rankings. Cold-start handler.
 * Query params:
 *   category — filter by category
 *   limit    — number of results (default 12)
 */
router.get('/popular', (req, res) => {
  try {
    const { category, limit = 12 } = req.query;
    const recs = getPopularityRecommendations(db.products, {
      category,
      limit: parseInt(limit)
    });
    const enriched = recs.map(p => ({
      ...p,
      discountedPrice: parseFloat((p.price * (1 - p.discountPercentage / 100)).toFixed(2))
    }));

    res.json({
      success: true,
      data: enriched,
      meta: {
        algorithm: 'popularity',
        formula: 'rating × log(stock + 1)',
        category: category || 'all',
        count: enriched.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/recommendations/algorithm-info/:userId
 *
 * Algorithm transparency endpoint — returns all the internal data needed
 * to render the Algorithm Transparency dashboard in the frontend.
 * Shows TF-IDF vectors (top terms), user similarities, popularity scores.
 */
router.get('/algorithm-info/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userInteractions = db.interactions.filter(i => i.userId === userId);
    const interactedProductIds = [...new Set(userInteractions.map(i => i.productId))];

    // TF-IDF: top terms for the first interacted product
    const sampleProduct = db.products.find(p => interactedProductIds.includes(p.id)) || db.products[0];
    const sampleVector = db.tfidfVectors.find(v => v.productId === sampleProduct.id);
    const topTerms = sampleVector
      ? Object.entries(sampleVector.vector)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([term, score]) => ({ term, score: parseFloat(score.toFixed(4)) }))
      : [];

    // TF-IDF similar products for sample
    const contentRecs = getContentBasedRecommendations(
      sampleProduct.id, db.tfidfVectors, db.products, 6
    ).map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      thumbnail: p.thumbnail,
      score: p.recommendationScore
    }));

    // Collaborative: user similarities
    const userSims = getUserSimilarities(userId, db.interactions);
    const allUsers = db.users.map(({ password: _, ...u }) => ({
      ...u,
      interactionCount: db.interactions.filter(i => i.userId === u.userId).length
    }));

    // Popularity: top 8 products with scores
    const popularityRecs = getPopularityRecommendations(db.products, { limit: 8 }).map(p => ({
      id: p.id, title: p.title, category: p.category, thumbnail: p.thumbnail,
      rating: p.rating, stock: p.stock, popularityScore: p.popularityScore
    }));

    res.json({
      success: true,
      data: {
        userId,
        interactionCount: userInteractions.length,
        algorithms: {
          tfidf: {
            name: 'Content-Based Filtering (TF-IDF)',
            sampleProduct: { id: sampleProduct.id, title: sampleProduct.title, thumbnail: sampleProduct.thumbnail },
            topTerms,
            similarProducts: contentRecs,
            howItWorks: [
              'Tokenize product text (title + description + category + tags + brand)',
              'Calculate TF: count(t,d) / total_terms(d)',
              'Calculate IDF: log((N+1) / (df(t)+1))',
              'TF-IDF vector = TF × IDF per term',
              'Cosine similarity = (A·B) / (|A| × |B|)',
              'Rank all products by cosine similarity to target product'
            ]
          },
          collaborative: {
            name: 'User-User Collaborative Filtering',
            userSimilarities: userSims.map(s => ({
              ...s,
              user: allUsers.find(u => u.userId === s.userId)
            })),
            howItWorks: [
              'Build interaction matrix: userId → Set<productId>',
              'Jaccard similarity: |A ∩ B| / |A ∪ B| for each user pair',
              'Find products seen by similar users but not by target user',
              'Score = weighted sum of similarities for each candidate product',
              'Rank candidates by aggregated score',
              'Offline batch job writes scores to RecommendationScores DynamoDB table'
            ]
          },
          popularity: {
            name: 'Popularity-Based Ranking (Cold Start)',
            topProducts: popularityRecs,
            howItWorks: [
              'Formula: popularity = rating × log(stock + 1)',
              'rating (0-5): captures product quality / customer satisfaction',
              'log(stock + 1): normalises availability, prevents high-stock-only bias',
              'Recalculated weekly by scheduled Lambda batch job',
              'Stored in popularityScore field on Products DynamoDB table',
              'Used as cold-start fallback when user has no interaction history'
            ]
          }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
