const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, setupAdmin } = require('../controllers');
const { authMiddleware, adminMiddleware } = require('../middlewares');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);

// admin setup route (only allowed if no admin exists)
router.post('/admin/setup', setupAdmin);

// example protected routes
router.get('/me', authMiddleware, (req, res) => res.json({ id: req.user.id, role: req.user.role }));
router.get('/admin/secret', authMiddleware, adminMiddleware, (req, res) => res.json({ secret: 'admin only' }));

module.exports = router;