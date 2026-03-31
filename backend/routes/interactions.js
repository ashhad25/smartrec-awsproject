// routes/interactions.js
// User Interactions CRUD — simulates the DynamoDB Interactions table
// PK: userId, SK: timestamp#interactionId
//
// POST /api/interactions        — record a new interaction (view/cart/purchase)
// GET  /api/interactions/:userId — get a user's interaction history
// DELETE /api/interactions/:id  — remove an interaction

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

const INTERACTION_WEIGHTS = { view: 1, cart: 2, purchase: 3 };
const VALID_TYPES = Object.keys(INTERACTION_WEIGHTS);

/**
 * POST /api/interactions
 * Body: { productId, interactionType }
 * Records a user interaction and triggers recommendation cache invalidation.
 * In production, DynamoDB Streams would trigger a Lambda to update scores.
 */
router.post('/', protect, (req, res) => {
  try {
    const { productId, interactionType } = req.body;

    if (!productId || !interactionType) {
      return res.status(400).json({ success: false, error: 'productId and interactionType are required' });
    }
    if (!VALID_TYPES.includes(interactionType)) {
      return res.status(400).json({ success: false, error: `interactionType must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const product = db.products.find(p => p.id === parseInt(productId));
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const now = new Date().toISOString();
    const interaction = {
      interactionId: uuidv4(),
      userId: req.user.userId,
      productId: parseInt(productId),
      interactionType,
      weight: INTERACTION_WEIGHTS[interactionType],
      timestamp: now,
      // ttl: 90 days in seconds (DynamoDB TTL field)
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)
    };

    db.interactions.push(interaction);

    // Update user's lastActive
    const userIdx = db.users.findIndex(u => u.userId === req.user.userId);
    if (userIdx !== -1) db.users[userIdx].lastActive = now;

    res.status(201).json({
      success: true,
      data: interaction,
      message: `Recorded ${interactionType} on "${product.title}"`,
      note: 'In production, DynamoDB Streams would trigger Lambda to update recommendation scores'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/interactions/:userId
 * Returns a user's full interaction history with product details.
 */
router.get('/:userId', protect, (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const userInteractions = db.interactions
      .filter(i => i.userId === req.params.userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const enriched = userInteractions.map(interaction => {
      const product = db.products.find(p => p.id === interaction.productId);
      return {
        ...interaction,
        product: product ? {
          id: product.id,
          title: product.title,
          category: product.category,
          thumbnail: product.thumbnail,
          price: product.price
        } : null
      };
    });

    res.json({
      success: true,
      data: enriched,
      count: enriched.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/interactions/:interactionId
 * Remove an interaction (PIPEDA: user right to deletion).
 */
router.delete('/:interactionId', protect, (req, res) => {
  const idx = db.interactions.findIndex(
    i => i.interactionId === req.params.interactionId && i.userId === req.user.userId
  );
  if (idx === -1) {
    return res.status(404).json({ success: false, error: 'Interaction not found' });
  }
  db.interactions.splice(idx, 1);
  res.json({ success: true, message: 'Interaction deleted' });
});

/**
 * DELETE /api/interactions/user/:userId/all
 * Delete all interactions for a user (PIPEDA right to erasure).
 */
router.delete('/user/:userId/all', protect, (req, res) => {
  if (req.user.userId !== req.params.userId) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  const before = db.interactions.length;
  db.interactions = db.interactions.filter(i => i.userId !== req.params.userId);
  const deleted = before - db.interactions.length;
  res.json({ success: true, message: `Deleted ${deleted} interactions (PIPEDA erasure)` });
});

module.exports = router;
