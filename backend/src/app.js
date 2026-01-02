const express = require('express');
const cors = require('cors');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Futsal Booking API is running'
  });
});

module.exports = app;
