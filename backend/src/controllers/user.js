const { User } = require('../models');
const { hashPassword, comparePassword, signToken } = require('../utils');
const { sendOtpEmail } = require('../utils/email');

function genOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }

async function register(req, res) {
  try {
    const { fullname, email, phone, password, username } = req.body || {};
    if (!email || !phone || !password) return res.status(400).json({ error: 'email, phone and password required' });

    if (await User.findOne({ email })) return res.status(409).json({ error: 'email already exists' });

    const hashed = await hashPassword(password);
    const otp = genOtp();
    const otpHash = await hashPassword(otp);
    const otpExpires = Date.now() + 15 * 60 * 1000;

    await User.create({ username, fullname, email, phone, password: hashed, otpHash, otpExpires, isVerified: false });

    await sendOtpEmail(email, otp);
    return res.status(201).json({ message: 'Registered - OTP sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    if (!user.otpHash || !user.otpExpires || Date.now() > user.otpExpires) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const ok = await comparePassword(otp, user.otpHash);
    if (!ok) return res.status(400).json({ error: 'Invalid OTP' });

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: 'Verified' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if ((!username && !email) || !password) return res.status(400).json({ error: 'provide username or email and password' });

    const query = username ? { username } : { email };
    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await comparePassword(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.role === 'user' && !user.isVerified) return res.status(403).json({ error: 'Email not verified' });

    const token = signToken({ id: user._id, role: user.role });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { register, verifyEmail, login };