// services/collaborative.service.js
// User-User Collaborative Filtering using Jaccard Similarity
// Simulates the batch training pipeline that writes to the
// RecommendationScores DynamoDB table (PK: userId, SK: productId)

/**
 * Compute Jaccard similarity between two users' interaction sets.
 * jaccard(A,B) = |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(setA, setB) {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Build a user-product interaction matrix from the Interactions table.
 * Returns Map<userId, Set<productId>> of weighted interactions.
 * Only counts interactions above the weight threshold (view=1, cart=2, purchase=3).
 */
function buildInteractionMatrix(interactions) {
  const matrix = new Map();
  interactions.forEach(({ userId, productId, weight }) => {
    if (!matrix.has(userId)) matrix.set(userId, new Set());
    // Include item if any interaction occurred (weight >= 1)
    if (weight >= 1) {
      matrix.get(userId).add(productId);
    }
  });
  return matrix;
}

/**
 * Run user-user collaborative filtering for a given user.
 *
 * Algorithm:
 * 1. Compute Jaccard similarity with all other users
 * 2. Find items those similar users interacted with that the target hasn't
 * 3. Score each candidate item by weighted sum: sum(similarity * weight)
 * 4. Return top-N items sorted by score
 *
 * In production this runs as an offline batch job on EC2/Fargate and
 * writes scores to DynamoDB RecommendationScores table for <10ms lookup.
 */
function getCollaborativeRecommendations(userId, interactions, products, limit = 12) {
  const matrix = buildInteractionMatrix(interactions);

  const userSet = matrix.get(userId);
  if (!userSet || userSet.size === 0) return null; // cold start — no history

  // Step 1: Compute similarities with all other users
  const similarities = [];
  matrix.forEach((theirSet, otherUserId) => {
    if (otherUserId === userId) return;
    const sim = jaccardSimilarity(userSet, theirSet);
    if (sim > 0) {
      similarities.push({ userId: otherUserId, similarity: sim, interactedWith: theirSet });
    }
  });

  if (similarities.length === 0) return [];

  // Step 2: Aggregate scores for unseen items
  const candidateScores = new Map();
  similarities.forEach(({ similarity, interactedWith }) => {
    interactedWith.forEach(productId => {
      if (!userSet.has(productId)) {
        candidateScores.set(
          productId,
          (candidateScores.get(productId) || 0) + similarity
        );
      }
    });
  });

  // Step 3: Sort and return top-N with product details
  const ranked = [...candidateScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return ranked.map(([productId, score]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return {
      ...product,
      recommendationScore: parseFloat(score.toFixed(4)),
      algorithm: 'collaborative'
    };
  }).filter(Boolean);
}

/**
 * Get user similarity matrix — used in the Algorithm Transparency dashboard.
 */
function getUserSimilarities(userId, interactions) {
  const matrix = buildInteractionMatrix(interactions);
  const userSet = matrix.get(userId) || new Set();
  const result = [];

  matrix.forEach((theirSet, otherUserId) => {
    if (otherUserId === userId) return;
    result.push({
      userId: otherUserId,
      similarity: parseFloat(jaccardSimilarity(userSet, theirSet).toFixed(4)),
      commonItems: [...userSet].filter(x => theirSet.has(x)).length,
      totalUnion: new Set([...userSet, ...theirSet]).size
    });
  });

  return result.sort((a, b) => b.similarity - a.similarity);
}

module.exports = { getCollaborativeRecommendations, getUserSimilarities, buildInteractionMatrix };
