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

const User   = require('./models/User');
const Order  = require('./models/Order');
const Review = require('./models/Review');

const app    = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || '*';

// ─── SOCKET.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: allowedOrigin, methods: ['GET', 'POST'] },
});
io.on('connection', (socket) => {
  socket.on('join-order', (orderId) => socket.join(`order:${orderId}`));
});
app.set('io', io);

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true, legacyHeaders: false,
});

// ─── MONGODB ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅  MongoDB connected'))
    .catch(err => console.error('❌  MongoDB error:', err.message));
} else {
  console.warn('⚠️   MONGO_URI not set — data will be lost on restart');
}

const JWT_SECRET = process.env.JWT_SECRET || 'mirchmasala_super_secret_change_in_prod';

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Token is not valid or expired' }); }
};

const adminMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    req.user = decoded; next();
  } catch { res.status(401).json({ message: 'Token is not valid' }); }
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── REGISTER ─────────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim())            return res.status(400).json({ message: 'Name is required' });
    if (!email?.trim())           return res.status(400).json({ message: 'Email is required' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    if (await User.findOne({ email: email.toLowerCase() }))
      return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed  = await bcrypt.hash(password, 12);
    const newUser = await User.create({ name: name.trim(), email: email.toLowerCase(), password: hashed });
    const token   = jwt.sign({ id: newUser._id, isAdmin: false }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, isAdmin: false, loyaltyPoints: 0 } });
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
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin || false }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin || false, loyaltyPoints: user.loyaltyPoints || 0 } });
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
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── PLACE ORDER ──────────────────────────────────────────────────────────────
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { items, total, address, note } = req.body;
    if (!items?.length)                        return res.status(400).json({ message: 'Cart is empty' });
    if (!total || isNaN(total))                return res.status(400).json({ message: 'Invalid total amount' });
    if (!address?.street || !address?.city || !address?.pincode)
      return res.status(400).json({ message: 'Complete delivery address is required' });

    const newOrder = await Order.create({ userId: req.user.id, items, total, address, note: note || '', status: 'Accepted' });
    res.status(201).json({ ...newOrder.toObject(), id: newOrder.orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ message: 'Could not place order. Please try again.' });
  }
});

// ─── USER'S ORDERS ────────────────────────────────────────────────────────────
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(orders.map(o => ({ ...o, id: o.orderId })));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── SINGLE ORDER (public) ────────────────────────────────────────────────────
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ ...order, id: order.orderId });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

// POST /api/reviews — create or update a review
app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { itemId, itemName, rating, comment } = req.body;
    if (!itemId)                         return res.status(400).json({ message: 'itemId is required' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const review = await Review.findOneAndUpdate(
      { userId: req.user.id, itemId },
      { itemName, rating, comment: comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(review);
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ message: 'Could not save review' });
  }
});

// GET /api/reviews/summary — { itemId: { avgRating, count } } for all items
app.get('/api/reviews/summary', async (_req, res) => {
  try {
    const agg = await Review.aggregate([
      {
        $group: {
          _id:       '$itemId',
          avgRating: { $avg: '$rating' },
          count:     { $sum: 1 },
        },
      },
    ]);
    const summary = {};
    agg.forEach(r => {
      summary[r._id] = { avgRating: Math.round(r.avgRating * 10) / 10, count: r.count };
    });
    res.json(summary);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/reviews/item/:itemId — all reviews for a single item
app.get('/api/reviews/item/:itemId', async (req, res) => {
  try {
    const reviews = await Review.find({ itemId: Number(req.params.itemId) })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json(reviews);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// GET /api/reviews/my — current user's reviews (map: itemId → review)
app.get('/api/reviews/my', authMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user.id }).lean();
    const map = {};
    reviews.forEach(r => { map[r.itemId] = r; });
    res.json(map);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── ADMIN: ALL ORDERS ────────────────────────────────────────────────────────
app.get('/api/admin/orders', adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'name email').sort({ createdAt: -1 }).lean();
    res.json(orders.map(o => ({ ...o, id: o.orderId })));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── ADMIN: UPDATE STATUS (emits socket + awards loyalty points on Delivered) ─
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

    // Award loyalty points when delivered (1 point per ₹10)
    if (status === 'Delivered') {
      const pts = Math.floor(order.total / 10);
      if (pts > 0) {
        await User.findByIdAndUpdate(order.userId, { $inc: { loyaltyPoints: pts } });
      }
    }

    req.app.get('io').to(`order:${order.orderId}`).emit('order-updated', {
      orderId: order.orderId,
      status:  order.status,
    });

    res.json({ ...order, id: order.orderId });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── ADMIN: STATS ─────────────────────────────────────────────────────────────
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [totalOrders, totalUsers, revenueAgg, pendingOrders, totalReviews] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.countDocuments({ status: { $ne: 'Delivered' } }),
      Review.countDocuments(),
    ]);
    res.json({
      totalOrders,
      totalUsers,
      totalRevenue:  revenueAgg[0]?.total || 0,
      pendingOrders,
      totalReviews,
    });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ─── SERVER ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => console.log(`🚀  Server + Socket.io at http://localhost:${PORT}`));
}
module.exports = app;
