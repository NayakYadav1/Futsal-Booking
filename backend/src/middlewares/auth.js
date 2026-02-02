const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  next();
}

module.exports = { authMiddleware, adminMiddleware };