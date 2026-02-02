const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  futsal: { type: mongoose.Schema.Types.ObjectId, ref: 'Futsal', required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['available','reserved','pending','confirmed'], default: 'available' },
  reservedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reservedUntil: { type: Date },
  pendingBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure one slot per futsal & start time
SlotSchema.index({ futsal: 1, start: 1 }, { unique: true });

module.exports = mongoose.model('Slot', SlotSchema);
