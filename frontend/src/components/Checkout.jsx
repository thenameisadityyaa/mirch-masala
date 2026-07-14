import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, FileText, CreditCard, Wallet, ArrowLeft, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

const PAYMENT_METHODS = [
  { id: 'cod',   label: 'Cash on Delivery', icon: <Wallet size={18} /> },
  { id: 'upi',   label: 'UPI / QR Code',    icon: <CreditCard size={18} /> },
  { id: 'card',  label: 'Debit / Credit Card', icon: <CreditCard size={18} /> },
];

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [address, setAddress] = useState({ street: '', city: '', pincode: '' });
  const [note, setNote] = useState('');

  const handleChange = (e) =>
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) { toast.error('Your cart is empty!'); return; }

    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    if (!address.street.trim() || !address.city.trim() || !address.pincode.trim()) {
      toast.error('Please fill in your complete delivery address');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/orders`,
        { items, total, address, note, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      clearCart();
      toast.success('🎉 Order placed successfully!');
      navigate(`/track/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-state" style={{ paddingTop: 120 }}>
            <div className="empty-icon"><ShoppingBag size={36} /></div>
            <h3>Your cart is empty</h3>
            <p>Add some items before coming here.</p>
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost"
            style={{ marginBottom: 24, padding: '8px 0', fontSize: '0.9rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>Checkout</h2>
          <p className="text-muted" style={{ marginBottom: 40 }}>Complete your order details below.</p>

          <form onSubmit={handleSubmit} className="checkout-grid">
            {/* Left — Delivery + Payment */}
            <div>
              {/* Delivery Address */}
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <MapPin size={18} color="var(--brand)" />
                  Delivery Address
                </div>
                <div className="form-group">
                  <label>Street / House No.</label>
                  <input
                    type="text"
                    name="street"
                    className="form-input"
                    placeholder="e.g. 12B, MG Road"
                    value={address.street}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      className="form-input"
                      placeholder="Gunupur"
                      value={address.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      className="form-input"
                      placeholder="765022"
                      value={address.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <FileText size={18} color="var(--brand)" />
                  Order Note (optional)
                </div>
                <textarea
                  className="form-input"
                  placeholder="e.g. Less spicy, extra napkins..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Payment */}
              <div className="checkout-section">
                <div className="checkout-section-title">
                  <CreditCard size={18} color="var(--brand)" />
                  Payment Method
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PAYMENT_METHODS.map(pm => (
                    <label
                      key={pm.id}
                      className={`payment-option ${paymentMethod === pm.id ? 'active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        style={{ display: 'none' }}
                      />
                      <span className="payment-icon">{pm.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pm.label}</span>
                      {paymentMethod === pm.id && (
                        <span style={{ marginLeft: 'auto', color: 'var(--brand)', fontSize: '0.8rem', fontWeight: 700 }}>
                          Selected
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Order Summary */}
            <div>
              <div className="checkout-section checkout-summary">
                <div className="checkout-section-title" style={{ marginBottom: 20 }}>
                  <ShoppingBag size={18} color="var(--brand)" />
                  Order Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  {items.map(item => {
                    const price = parseInt(item.price.replace('₹', '')) || 0;
                    return (
                      <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>× {item.qty}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', flexShrink: 0 }}>₹{price * item.qty}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <span>Subtotal</span><span>₹{total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    <span>Delivery</span><span style={{ color: 'var(--green)', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', marginTop: 12 }}>
                    <span>Total</span><span>₹{total}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  style={{ marginTop: 24, padding: '15px', fontSize: '1rem', borderRadius: 12 }}
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : `Place Order — ₹${total}`}
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  Estimated delivery: 25–35 minutes
                </p>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
