const mongoose = require('mongoose');

const FutsalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photos: [{ type: String }],
  contact: { type: String },
  location: { type: String },
  address: { type: String },
  openingHour: { type: Number, default: 7 }, // hour in 24h (7 = 7:00)
  closingHour: { type: Number, default: 22 }, // hour in 24h
  slotDuration: { type: Number, default: 60 } // minutes
}, { timestamps: true });

module.exports = mongoose.model('Futsal', FutsalSchema);
