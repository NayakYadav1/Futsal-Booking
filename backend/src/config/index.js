require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/futsal-booking',
  jwtExpiresIn: '1h'
};