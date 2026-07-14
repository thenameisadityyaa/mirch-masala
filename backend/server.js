const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const dotenv     = require('dotenv');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');
const mongoose   = require('mongoose');
const rateLimit  = require('express-rate-limit');

dotenv.config();

const User  = require('./models/User');
const Order = require('./models/Order');

const app    = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || '*';

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  socket.on('join-order', (orderId) => {
    socket.join(`order:${orderId}`);
  });
  socket.on('disconnect', () => {});
});

// Expose io so routes can emit events
app.set('io', io);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── MONGODB ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log('✅  MongoDB connected'))
    .catch((err) => console.error('❌  MongoDB connection failed:', err.message));
} else {
  console.warn('⚠️   MONGO_URI not set — data will be lost on restart');
}

const JWT_SECRET = process.env.JWT_SECRET || 'mirchmasala_super_secret_change_in_prod';

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
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

// Admin middleware — checks for admin flag in JWT
const adminMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── REGISTER ─────────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim())               return res.status(400).json({ message: 'Name is required' });
    if (!email?.trim())              return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed  = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed });

    const token = jwt.sign({ id: newUser._id, isAdmin: newUser.isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, isAdmin: false } });
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

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin || false } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PLACE ORDER ──────────────────────────────────────────────────────────────
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, note } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: 'Cart is empty' });
    if (!total || isNaN(total))
      return res.status(400).json({ message: 'Invalid total amount' });
    if (!address?.street || !address?.city || !address?.pincode)
      return res.status(400).json({ message: 'Complete delivery address is required' });

    const newOrder = await Order.create({ userId: req.user.id, items, total, address, note: note || '', status: 'Accepted' });
    res.status(201).json({ ...newOrder.toObject(), id: newOrder.orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: 'Could not place order. Please try again.' });
  }
});

// ─── GET USER'S ORDERS ────────────────────────────────────────────────────────
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(orders.map(o => ({ ...o, id: o.orderId })));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET SINGLE ORDER ─────────────────────────────────────────────────────────
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ...order, id: order.orderId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: GET ALL ORDERS ────────────────────────────────────────────────────
app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders.map(o => ({ ...o, id: o.orderId })));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: UPDATE ORDER STATUS (emits Socket.io event) ──────────────────────
app.put('/api/admin/orders/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status value' });

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { status },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Emit real-time update to anyone tracking this order
    req.app.get('io').to(`order:${order.orderId}`).emit('order-updated', {
      orderId: order.orderId,
      status:  order.status,
    });

    res.json({ ...order, id: order.orderId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── ADMIN: STATS ─────────────────────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalOrders, totalUsers, revenueAgg, pendingOrders] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ status: { $ne: 'Delivered' } }),
    ]);
    res.json({
      totalOrders,
      totalUsers,
      totalRevenue: revenueAgg[0]?.total || 0,
      pendingOrders,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── SERVER ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => console.log(`🚀  Server + Socket.io at http://localhost:${PORT}`));
}

module.exports = app;
