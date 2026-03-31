// middleware/auth.js
// JWT Authentication Middleware
// In production this integrates with Amazon Cognito JWT authorizers
// for user-facing endpoints. Internal service calls use IAM SigV4.

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cs6905-smartrec-secret-key-change-in-production';

/**
 * Protect a route — verifies the Bearer token in the Authorization header.
 * If valid, attaches the decoded user payload to req.user.
 * Mirrors the Cognito JWT authorizer behavior on API Gateway.
 */
function protect(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided. Authorization header must be: Bearer <token>'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, name, segmentId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

/**
 * Optional auth — attaches user if token present but doesn't block anonymous requests.
 * Used for recommendation endpoints that work for both logged-in and guest users.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // ignore invalid tokens for optional auth
    }
  }
  next();
}

/**
 * Sign a JWT for a user. Called by the auth/login endpoint.
 */
function signToken(user) {
  return jwt.sign(
    { userId: user.userId, email: user.email, name: user.name, segmentId: user.segmentId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { protect, optionalAuth, signToken };
