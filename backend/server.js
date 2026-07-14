const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');

dotenv.config();

const User  = require('./models/User');
const Order = require('./models/Order');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── RATE LIMITING ───────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── MONGODB CONNECTION ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅  MongoDB connected'))
    .catch((err) => console.error('❌  MongoDB connection failed:', err.message));
} else {
  console.warn('⚠️   MONGO_URI not set — running without database (all data will be lost on restart)');
}

const JWT_SECRET = process.env.JWT_SECRET || 'mirchmasala_super_secret_change_in_prod';

// ─── AUTH MIDDLEWARE ─────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid or expired' });
  }
};

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── REGISTER ────────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name?.trim())                         return res.status(400).json({ message: 'Name is required' });
    if (!email?.trim())                        return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6)      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed  = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed });

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET PROFILE ─────────────────────────────────────────────────────────────
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PLACE ORDER ─────────────────────────────────────────────────────────────
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, note } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });
    if (!total || isNaN(total))
      return res.status(400).json({ message: 'Invalid total amount' });
    if (!address?.street || !address?.city || !address?.pincode)
      return res.status(400).json({ message: 'Complete delivery address is required' });

    const newOrder = await Order.create({
      userId:  req.user.id,
      items,
      total,
      address,
      note:    note || '',
      status:  'Accepted',
    });

    res.status(201).json({ ...newOrder.toObject(), id: newOrder.orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: 'Could not place order. Please try again.' });
  }
});

// ─── GET USER'S ORDERS ───────────────────────────────────────────────────────
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Normalise id field for frontend compatibility
    res.json(orders.map(o => ({ ...o, id: o.orderId })));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET SINGLE ORDER (public — by orderId string) ───────────────────────────
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ...order, id: order.orderId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SERVER ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀  Server running at http://localhost:${PORT}`));
}

module.exports = app;
