// services/popularity.service.js
// Popularity-Based Ranking — Cold Start Handler
// Implements the popularityScore field on the DynamoDB Products table.
// This score is recalculated weekly via a scheduled Lambda job.

/**
 * Compute popularity score for a product.
 *
 * Formula: rating * log(stock + 1)
 * - Rating (0-5): captures product quality / satisfaction
 * - log(stock + 1): normalises for inventory availability, prevents
 *   high-stock-only bias. log() dampens the effect of large stock values.
 *
 * This score is written to the popularityScore field on DynamoDB
 * Products table during the weekly offline batch training job.
 */
function computePopularityScore(product) {
  return product.rating * Math.log(product.stock + 1);
}

/**
 * Get popularity-based recommendations.
 * Used as the cold-start fallback when a user has no interaction history.
 *
 * Optionally filter by category for more relevant cold-start results.
 */
function getPopularityRecommendations(products, options = {}) {
  const { category, limit = 12, excludeIds = [] } = options;

  let candidates = products.filter(p =>
    p.availabilityStatus !== 'Out of Stock' &&
    p.stock > 0 &&
    !excludeIds.includes(p.id)
  );

  if (category) {
    candidates = candidates.filter(p => p.category === category);
  }

  return candidates
    .map(p => ({
      ...p,
      popularityScore: parseFloat(computePopularityScore(p).toFixed(4)),
      recommendationScore: parseFloat(computePopularityScore(p).toFixed(4)),
      algorithm: 'popularity'
    }))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

/**
 * Get top products per category.
 * Used for category-level browse recommendations.
 */
function getTopPerCategory(products, topN = 3) {
  const byCategory = {};
  products.forEach(p => {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  });

  const result = {};
  Object.entries(byCategory).forEach(([cat, prods]) => {
    result[cat] = prods
      .filter(p => p.stock > 0)
      .sort((a, b) => computePopularityScore(b) - computePopularityScore(a))
      .slice(0, topN)
      .map(p => ({ ...p, popularityScore: parseFloat(computePopularityScore(p).toFixed(4)) }));
  });

  return result;
}

module.exports = { getPopularityRecommendations, getTopPerCategory, computePopularityScore };
