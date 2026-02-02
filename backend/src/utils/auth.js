const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

async function hashPassword(p) { return bcrypt.hash(p, 10); }
async function comparePassword(p, h) { return bcrypt.compare(p, h); }
function signToken(payload) { return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn }); }

module.exports = { hashPassword, comparePassword, signToken };