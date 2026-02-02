const { Slot } = require('../models');

// Reserve a slot temporarily (5 minutes)
exports.reserveSlot = async (req, res) => {
  try{
    const userId = req.user.id;
    const slotId = req.params.slotId;

    const now = new Date();
    const until = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Atomically set to reserved only if available or previously expired reserved
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, $or: [ { status: 'available' }, { status: 'reserved', reservedUntil: { $lt: now } } ] },
      { $set: { status: 'reserved', reservedBy: userId, reservedUntil: until } },
      { new: true }
    );

    if (!slot) return res.status(409).json({ error: 'Slot already held by someone else or not available' });

    res.json({ message: 'Slot reserved for 5 minutes', slot });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// User confirms reservation - moves to pending state awaiting admin
exports.confirmByUser = async (req, res) => {
  try{
    const userId = req.user.id;
    const slotId = req.params.slotId;
    const now = new Date();

    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'reserved', reservedBy: userId, reservedUntil: { $gt: now } },
      { $set: { status: 'pending', pendingBy: userId }, $unset: { reservedBy: '', reservedUntil: '' } },
      { new: true }
    );

    if (!slot) return res.status(400).json({ error: 'No active reservation by user or reservation expired' });

    res.json({ message: 'Slot moved to pending (awaiting admin confirmation)', slot });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// Admin confirms the pending reservation -> confirmed (booked)
exports.adminConfirm = async (req, res) => {
  try{
    const slotId = req.params.slotId;
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, status: 'pending' },
      { $set: { status: 'confirmed' } },
      { new: true }
    );
    if (!slot) return res.status(400).json({ error: 'Slot is not pending' });
    res.json({ message: 'Slot confirmed by admin', slot });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// Cancel a reservation/pending by user
exports.cancelByUser = async (req, res) => {
  try{
    const userId = req.user.id;
    const slotId = req.params.slotId;

    const slot = await Slot.findOne({ _id: slotId });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    if (slot.status === 'reserved' && slot.reservedBy && slot.reservedBy.toString() === userId){
      slot.status = 'available';
      slot.reservedBy = null;
      slot.reservedUntil = null;
      await slot.save();
      return res.json({ message: 'Reservation cancelled' });
    }

    if (slot.status === 'pending' && slot.pendingBy && slot.pendingBy.toString() === userId){
      slot.status = 'available';
      slot.pendingBy = null;
      await slot.save();
      return res.json({ message: 'Pending reservation cancelled' });
    }

    return res.status(403).json({ error: 'You cannot cancel this slot' });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// Admin: delete/cancel any booking (admin only)
exports.adminDeleteBooking = async (req, res) => {
  try{
    const slotId = req.params.slotId;
    const slot = await Slot.findById(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    // reset slot to available
    slot.status = 'available';
    slot.reservedBy = null;
    slot.reservedUntil = null;
    slot.pendingBy = null;
    await slot.save();

    res.json({ message: 'Booking deleted by admin', slot });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// User: get my bookings (reserved/pending) with futsal details
exports.getUserBookings = async (req, res) => {
  try{
    const userId = req.user.id;
    const slots = await Slot.find({ $or: [ { reservedBy: userId }, { pendingBy: userId } ] })
      .populate('futsal', 'name location')
      .sort('start');

    res.json({ slots });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

// Utility: Run a quick release of expired reserves (admin or scheduled)
exports.releaseExpired = async (req, res) => {
  try{
    const now = new Date();
    const result = await Slot.updateMany({ status: 'reserved', reservedUntil: { $lt: now } }, { $set: { status: 'available', reservedBy: null, reservedUntil: null } });
    res.json({ message: 'Expired reservations released', modifiedCount: result.nModified || result.modifiedCount });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};
