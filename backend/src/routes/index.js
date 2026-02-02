const auth = require('./auth');
const futsals = require('./futsals');
const express = require('express');
const router = express.Router();

router.use('/auth', auth);
router.use('/futsals', futsals);

module.exports = router;