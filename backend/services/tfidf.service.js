// services/tfidf.service.js
// Content-Based Filtering using TF-IDF + Cosine Similarity
// Implements the tfidfVector field on the Products DynamoDB table

const STOPWORDS = new Set([
  'the','a','an','and','or','for','with','its','it','in','of','to','is','are',
  'that','this','on','by','at','as','be','from','have','has','can','which',
  'their','your','you','our','was','were','will','also','they','them','both',
  'all','any','not','but','more','most','each','when','how','what','one','two',
  'does','do','did','into','over','about','after','through','such','been',
  'would','could','should','may','might','very','just','so','if','then','than',
  'up','out','off','use','used','make','makes','making','way','time','long',
  'high','low','new','other','per','get','give','come','go','take','see',
  'know','need','want','add','good','great','best','top','well','ideal',
  'perfect','suitable','various','provide','provides','designed','features'
]);

/**
 * Tokenize a product into a bag-of-words.
 * Combines title, description, category, tags, and brand.
 */
function tokenize(product) {
  const text = [
    product.title,
    product.description,
    product.category.replace(/-/g, ' '),
    (product.tags || []).join(' '),
    product.brand || ''
  ].join(' ');

  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

/**
 * Build TF-IDF vectors for all products.
 * Returns an array of { productId, vector } objects.
 * This is what gets stored in the tfidfVector field on DynamoDB Products table.
 */
function buildTFIDFVectors(products) {
  // Step 1: Tokenize all documents
  const tokenizedDocs = products.map(p => tokenize(p));

  // Step 2: Calculate Document Frequency for each term
  const df = {};
  tokenizedDocs.forEach(tokens => {
    new Set(tokens).forEach(term => {
      df[term] = (df[term] || 0) + 1;
    });
  });

  const N = products.length;

  // Step 3: Build TF-IDF vector per product
  return tokenizedDocs.map((tokens, i) => {
    // Term Frequency
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const totalTerms = tokens.length || 1;

    // TF-IDF: tf(t,d) * log((N+1) / (df(t)+1))
    const vector = {};
    Object.entries(tf).forEach(([term, count]) => {
      const termFreq = count / totalTerms;
      const inverseDocFreq = Math.log((N + 1) / ((df[term] || 0) + 1));
      vector[term] = termFreq * inverseDocFreq;
    });

    return {
      productId: products[i].id,
      vector
    };
  });
}

/**
 * Cosine similarity between two TF-IDF vectors.
 * Returns a score between 0 (no similarity) and 1 (identical).
 */
function cosineSimilarity(v1, v2) {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  allKeys.forEach(k => {
    const a = v1[k] || 0;
    const b = v2[k] || 0;
    dotProduct += a * b;
    magnitude1 += a * a;
    magnitude2 += b * b;
  });

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Get content-based recommendations for a product.
 * Finds the N most similar products by cosine similarity of TF-IDF vectors.
 */
function getContentBasedRecommendations(productId, tfidfVectors, products, limit = 10) {
  const sourceIdx = tfidfVectors.findIndex(v => v.productId === productId);
  if (sourceIdx === -1) return [];

  const sourceVector = tfidfVectors[sourceIdx].vector;

  const scored = tfidfVectors
    .filter((_, i) => i !== sourceIdx)
    .map(({ productId: pid, vector }) => ({
      productId: pid,
      score: cosineSimilarity(sourceVector, vector)
    }))
    .filter(x => x.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ productId: pid, score }) => {
    const product = products.find(p => p.id === pid);
    return { ...product, recommendationScore: parseFloat(score.toFixed(4)), algorithm: 'content-based' };
  }).filter(Boolean);
}

module.exports = { buildTFIDFVectors, getContentBasedRecommendations, cosineSimilarity };
