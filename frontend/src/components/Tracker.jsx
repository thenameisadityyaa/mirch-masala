import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, Clock, CheckCircle, ChefHat, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL } from '../config';

const STEPS = [
  { key: 'Accepted',        label: 'Order Accepted', icon: <CheckCircle size={22} /> },
  { key: 'Preparing',       label: 'Preparing',      icon: <ChefHat size={22} /> },
  { key: 'Out for Delivery',label: 'On the Way',     icon: <MapPin size={22} /> },
  { key: 'Delivered',       label: 'Delivered',      icon: <Clock size={22} /> },
];

// Derive socket base URL from API_URL (strip /api suffix)
const SOCKET_URL = API_URL.replace('/api', '');

const Tracker = () => {
  const [orderId, setOrderId] = useState('');
  const [order,   setOrder]   = useState(null);
  const [error,   setError]   = useState('');
  const [live,    setLive]    = useState(false);
  const socketRef = useRef(null);
  const location  = useLocation();

  // Connect socket once on mount
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setLive(true));
    socket.on('disconnect', () => setLive(false));

    socket.on('order-updated', ({ orderId: oid, status }) => {
      setOrder(prev => prev && prev.orderId === oid ? { ...prev, status } : prev);
    });

    return () => socket.disconnect();
  }, []);

  // Auto-track from URL /track/:id
  useEffect(() => {
    const parts = location.pathname.split('/');
    if (parts.length === 3 && parts[1] === 'track' && parts[2]) {
      const id = parts[2];
      setOrderId(id);
      fetchOrder(id);
    }
  }, [location]);

  const fetchOrder = async (id) => {
    if (!id?.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/orders/${id.trim()}`);
      setOrder(res.data);
      setError('');
      // Join the socket room for this order
      socketRef.current?.emit('join-order', res.data.orderId || id.trim());
    } catch {
      setError('Order not found. Please check your Order ID.');
      setOrder(null);
    }
  };

  const currentStep = order
    ? Math.max(STEPS.findIndex(s => s.key === order.status), 0) + 1
    : 0;

  return (
    <div className="tracker-page">
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tracker-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Track Your Order</h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', fontWeight: 600,
            color: live ? 'var(--green)' : 'var(--text-muted)',
          }}>
            {live ? <Wifi size={14} /> : <WifiOff size={14} />}
            {live ? 'Live' : 'Offline'}
          </div>
        </div>
        <p className="text-muted" style={{ marginBottom: 32 }}>
          Enter your Order ID to see real-time status updates.
        </p>

        <div className="tracker-input-row">
          <input
            type="text"
            className="form-input"
            placeholder="e.g. ORD-1234"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchOrder(orderId)}
          />
          <button
            className="btn btn-primary"
            style={{ borderRadius: 10, padding: '0 28px' }}
            onClick={() => fetchOrder(orderId)}
          >
            <Search size={18} /> Track
          </button>
        </div>

        {error && <p className="error-text" style={{ marginBottom: 24 }}>{error}</p>}

        {order && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ marginBottom: 32, padding: 20, background: '#f8f8f8', borderRadius: 12, border: '1px solid #e9e9eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                    Order {order.id || order.orderId}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.88rem' }}>
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </div>
                  {order.address?.street && (
                    <div className="text-muted" style={{ fontSize: '0.82rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} /> {order.address.street}, {order.address.city} — {order.address.pincode}
                    </div>
                  )}
                </div>
                <span className={`status-badge ${order.status === 'Delivered' ? 'delivered' : ''}`}>
                  {order.status}
                </span>
              </div>

              {/* Items summary */}
              {order.items?.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e9e9eb', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {order.items.map((item, i) => (
                    <span key={i} style={{
                      background: 'var(--brand-light)', color: 'var(--brand)',
                      borderRadius: 100, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600,
                    }}>
                      {item.name} × {item.qty || 1}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="status-rail">
              {STEPS.map((step, i) => (
                <div key={step.key} className={`status-step ${i < currentStep ? 'done' : ''}`}>
                  <motion.div
                    className="step-dot"
                    animate={i === currentStep - 1 ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {step.icon}
                  </motion.div>
                  <div className="step-label">{step.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Tracker;
