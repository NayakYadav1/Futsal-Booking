const { User } = require('../models');
const { hashPassword } = require('../utils');
const { sendEmail } = require('../utils/email');

function adminPasswordFromEmail(email) {
  const local = email.split('@')[0];
  return `${local}@123`;
}

async function setupAdmin(req, res) {
  try {
    if (await User.exists({ role: 'admin' })) return res.status(403).json({ error: 'Admin already set' });
    const { email, username, fullname, phone } = req.body;
    if (!email || !phone) return res.status(400).json({ error: 'email and phone required' });

    const password = adminPasswordFromEmail(email);
    const hashed = await hashPassword(password);

    await User.create({ email, username, fullname, phone, password: hashed, role: 'admin', isVerified: true });
    await sendEmail(email, 'Admin account created', `Your admin password is: ${password}`);

    return res.status(201).json({ message: 'Admin created' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { setupAdmin };