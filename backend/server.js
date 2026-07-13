const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory Database for rapid prototyping
const db = {
    users: [],
    orders: []
};

// Secret for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'mirchmasala_super_secret';

// --- Auth Routes ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now().toString(), name, email, password: hashedPassword };
        db.users.push(newUser);
        
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ token, user: { id: newUser.id, name, email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = db.users.find(u => u.email === email);
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// --- Order Routes ---
app.post('/api/orders', authMiddleware, (req, res) => {
    const { items, total, address } = req.body;
    const newOrder = {
        id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: req.user.id,
        items,
        total,
        address,
        status: 'Preparing',
        createdAt: new Date()
    };
    db.orders.push(newOrder);
    res.status(201).json(newOrder);
});

app.get('/api/orders', authMiddleware, (req, res) => {
    const userOrders = db.orders.filter(o => o.userId === req.user.id);
    // Sort by newest
    userOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userOrders);
});

app.get('/api/orders/:id', (req, res) => {
    const order = db.orders.find(o => o.id === req.params.id);
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: 'Order not found' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
