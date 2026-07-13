import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, Clock, CheckCircle, ChefHat } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const STEPS = [
  { key: 'Accepted', label: 'Order Accepted', icon: <CheckCircle size={22} /> },
  { key: 'Preparing', label: 'Preparing', icon: <ChefHat size={22} /> },
  { key: 'Out for Delivery', label: 'On the Way', icon: <MapPin size={22} /> },
  { key: 'Delivered', label: 'Delivered', icon: <Clock size={22} /> },
];

const Tracker = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const parts = location.pathname.split('/');
    if (parts.length === 3 && parts[1] === 'track' && parts[2]) {
      setOrderId(parts[2]);
      fetchOrder(parts[2]);
    }
  }, [location]);

  const fetchOrder = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/orders/${id}`);
      setOrder(res.data);
      setError('');
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
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>Track Your Order</h2>
        <p className="text-muted" style={{ marginBottom: 32 }}>Enter your Order ID to see real-time status updates.</p>

        <div className="tracker-input-row">
          <input
            type="text"
            className="form-input"
            placeholder="e.g. ORD-1234"
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchOrder(orderId)}
          />
          <button className="btn btn-primary" style={{ borderRadius: 10, padding: '0 28px' }} onClick={() => fetchOrder(orderId)}>
            <Search size={18} /> Track
          </button>
        </div>

        {error && <p className="error-text" style={{ marginBottom: 24 }}>{error}</p>}

        {order && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ marginBottom: 32, padding: 20, background: '#f8f8f8', borderRadius: 12, border: '1px solid #e9e9eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Order {order.id}</div>
                  <div className="text-muted" style={{ fontSize: '0.88rem' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <span className={`status-badge ${order.status === 'Delivered' ? 'delivered' : ''}`}>{order.status}</span>
              </div>
            </div>

            <div className="status-rail">
              {STEPS.map((step, i) => (
                <div key={step.key} className={`status-step ${i < currentStep ? 'done' : ''}`}>
                  <div className="step-dot">{step.icon}</div>
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
