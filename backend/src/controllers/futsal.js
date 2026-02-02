const { Futsal, Slot } = require('../models');

function colorForStatus(status){
  switch (status){
    case 'available': return 'green';
    case 'reserved': return 'orange';
    case 'pending': return 'yellow';
    case 'confirmed': return 'red';
    default: return 'gray';
  }
}

exports.listFutsals = async (req, res) => {
  try{
    const futsals = await Futsal.find().select('name photos contact location address');
    res.json({ data: futsals });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

exports.createFutsal = async (req, res) => {
  try{
    const { name, photos, contact, location, address, openingHour, closingHour, slotDuration } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const futsal = await Futsal.create({ name, photos, contact, location, address, openingHour, closingHour, slotDuration });
    res.status(201).json({ futsal });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

exports.getFutsal = async (req, res) => {
  try{
    const id = req.params.id;
    const dateStr = req.query.date; // YYYY-MM-DD
    const futsal = await Futsal.findById(id);
    if (!futsal) return res.status(404).json({ error: 'Futsal not found' });

    // compute day range
    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // release expired reserved slots for this futsal/day
    await Slot.updateMany({ futsal: id, status: 'reserved', reservedUntil: { $lt: new Date() } }, { $set: { status: 'available', reservedBy: null, reservedUntil: null } });

    const slots = await Slot.find({ futsal: id, start: { $gte: startOfDay, $lt: endOfDay } }).sort('start');

    const slotsWithColors = slots.map(s => ({
      _id: s._id,
      start: s.start,
      end: s.end,
      status: s.status,
      color: colorForStatus(s.status),
      reservedBy: s.reservedBy,
      reservedUntil: s.reservedUntil,
      pendingBy: s.pendingBy
    }));

    res.json({ futsal, slots: slotsWithColors });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

exports.getFutsalAdmin = async (req, res) => {
  try{
    const id = req.params.id;
    const dateStr = req.query.date; // YYYY-MM-DD
    const futsal = await Futsal.findById(id);
    if (!futsal) return res.status(404).json({ error: 'Futsal not found' });

    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // release expired reserved slots for this futsal/day
    await Slot.updateMany({ futsal: id, status: 'reserved', reservedUntil: { $lt: new Date() } }, { $set: { status: 'available', reservedBy: null, reservedUntil: null } });

    // populate reservedBy and pendingBy for admin (show contact info)
    const slots = await Slot.find({ futsal: id, start: { $gte: startOfDay, $lt: endOfDay } })
      .sort('start')
      .populate('reservedBy', 'fullname phone email')
      .populate('pendingBy', 'fullname phone email');

    const slotsWithDetails = slots.map(s => ({
      _id: s._id,
      start: s.start,
      end: s.end,
      status: s.status,
      color: colorForStatus(s.status),
      reservedBy: s.reservedBy ? { id: s.reservedBy._id, fullname: s.reservedBy.fullname, phone: s.reservedBy.phone, email: s.reservedBy.email } : null,
      reservedUntil: s.reservedUntil,
      pendingBy: s.pendingBy ? { id: s.pendingBy._id, fullname: s.pendingBy.fullname, phone: s.pendingBy.phone, email: s.pendingBy.email } : null
    }));

    res.json({ futsal, slots: slotsWithDetails });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};

exports.generateDailySlots = async (req, res) => {
  try{
    const id = req.params.id;
    const dateStr = req.query.date; // required YYYY-MM-DD
    if (!dateStr) return res.status(400).json({ error: 'date query param required (YYYY-MM-DD)' });

    const futsal = await Futsal.findById(id);
    if (!futsal) return res.status(404).json({ error: 'Futsal not found' });

    const date = new Date(dateStr + 'T00:00:00');
    const slots = [];
    const slotDuration = futsal.slotDuration || 60;

    for (let hour = futsal.openingHour; hour < futsal.closingHour; hour += (slotDuration / 60)){
      const start = new Date(date);
      start.setHours(Math.floor(hour), (hour - Math.floor(hour)) * 60, 0, 0);
      const end = new Date(start.getTime() + slotDuration * 60000);

      slots.push({ futsal: id, start, end });
    }

    // create slots using upsert to avoid duplicates
    const created = [];
    for (const s of slots){
      try{
        await Slot.findOneAndUpdate({ futsal: s.futsal, start: s.start }, { $setOnInsert: s }, { upsert: true });
        created.push({ start: s.start, end: s.end });
      }catch(e){
        // ignore duplicates / errors for specific slots
      }
    }

    res.json({ message: 'Slots generated (duplicates ignored)', created });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
};
