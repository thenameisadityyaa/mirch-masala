import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import StarRating from './StarRating';
import { API_URL } from '../config';

/**
 * Modal for submitting or editing a review for a single menu item.
 * Props:
 *   item        — { id, name, image, category } from menuItems.js
 *   existing    — existing review object (or null)
 *   onClose     — function to close modal
 *   onSaved     — function called with saved review data
 */
const ReviewModal = ({ item, existing, onClose, onSaved }) => {
  const [rating,  setRating]  = useState(existing?.rating  || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [loading, setLoading] = useState(false);

  // Trap focus / close on Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please login to review'); return; }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/reviews`,
        { itemId: item.id, itemName: item.name, rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(existing ? 'Review updated!' : 'Thanks for your review! 🌶️');
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save review');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(28,25,23,0.5)',
          zIndex: 300,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{   opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%', maxWidth: 440,
          background: '#fff',
          borderRadius: 20,
          zIndex: 301,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        }}
      >
        {/* Item Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-light), var(--gold-light))',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 14,
          borderBottom: '1px solid var(--border)',
        }}>
          <img
            src={item.image}
            alt={item.name}
            style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>{item.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              {item.category}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* Star selector */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-light)', marginBottom: 14, fontSize: '0.9rem' }}>
              {existing ? 'Update your rating' : 'How would you rate this dish?'}
            </p>
            <StarRating value={rating} onChange={setRating} size={32} />
            <div style={{
              marginTop: 8, height: 20,
              fontSize: '0.88rem', fontWeight: 700,
              color: rating > 0 ? 'var(--gold)' : 'transparent',
              transition: 'color 0.2s',
            }}>
              {labels[rating]}
            </div>
          </div>

          {/* Comment */}
          <div className="form-group">
            <label>Your review <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
            <textarea
              className="form-input"
              placeholder="e.g. Absolutely delicious! The spice level was perfect..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {comment.length}/500
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading || rating === 0}
            >
              <Send size={15} />
              {loading ? 'Saving...' : existing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
