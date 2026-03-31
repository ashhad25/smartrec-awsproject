// routes/auth.js
// Authentication endpoints — POST /api/auth/login, /api/auth/register, /api/auth/me
// In production these integrate with Amazon Cognito User Pools.

const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { signToken, protect } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user }
 *
 * Demo passwords for all seeded users: "password"
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = signToken(user);
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      token,
      user: safeUser,
      message: `Welcome back, ${user.name}!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * Creates a new user with cold-start segment (no interaction history).
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = {
      userId: `user_${uuidv4().split('-')[0]}`,
      name,
      email,
      password: hashed,
      segmentId: 'cold-start',
      preferences: [],
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    const token = signToken(newUser);
    const { password: _, ...safeUser } = newUser;

    res.status(201).json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
router.get('/me', protect, (req, res) => {
  const user = db.users.find(u => u.userId === req.user.userId);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

/**
 * GET /api/auth/users
 * Returns all users (for the demo user-switcher in the frontend).
 * In production this would be admin-only.
 */
router.get('/users', (req, res) => {
  const safeUsers = db.users.map(({ password: _, ...u }) => u);
  res.json({ success: true, users: safeUsers });
});

module.exports = router;
