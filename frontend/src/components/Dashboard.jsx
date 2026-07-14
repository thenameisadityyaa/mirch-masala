import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Package, Gift, Star, MapPin } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import { API_URL } from '../config';

const POINTS_TO_RUPEES = 100; // 100 pts = ₹10
const POINTS_PER_RUPEE = 10;  // 1 pt per ₹10

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [profile,    setProfile]    = useState(null);
  const [reviewItem, setReviewItem] = useState(null); // { id, name, image, category }
  const [myReviews,  setMyReviews]  = useState({});

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const token = localStorage.getItem('token');

    // Fetch orders + profile + my reviews in parallel
    Promise.all([
      axios.get(`${API_URL}/orders`,     { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/auth/me`,    { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/reviews/my`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([ordersRes, profileRes, reviewsRes]) => {
      setOrders(ordersRes.data);
      setProfile(profileRes.data);
      setMyReviews(reviewsRes.data);
    }).catch(() => {
      toast.error('Could not load dashboard data');
    });
  }, [user, navigate]);

  const points    = profile?.loyaltyPoints || 0;
  const nextReward = POINTS_TO_RUPEES - (points % POINTS_TO_RUPEES);
  const progress  = ((points % POINTS_TO_RUPEES) / POINTS_TO_RUPEES) * 100;

  // Collect all items from delivered orders for rating
  const rateableItems = (() => {
    const seen = new Set();
    const items = [];
    orders
      .filter(o => o.status === 'Delivered')
      .forEach(order => {
        (order.items || []).forEach(item => {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            items.push(item);
          }
        });
      });
    return items;
  })();

  return (
    <div className="dashboard-page">
      <div className="container">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

          {/* Header */}
          <div className="dashboard-header">
            <h2>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</h2>
            <p className="text-muted">Here is your order history with The New Mirch Masala.</p>
          </div>

          {/* Loyalty Points Card */}
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="loyalty-card"
            >
              <div className="loyalty-card-left">
                <div className="loyalty-icon">
                  <Gift size={22} />
                </div>
                <div>
                  <div className="loyalty-title">Loyalty Points</div>
                  <div className="loyalty-pts">{points} <span>pts</span></div>
                  <div className="loyalty-sub">
                    {nextReward} more points for your next ₹10 reward
                  </div>
                </div>
              </div>
              <div className="loyalty-card-right">
                <div className="loyalty-progress-label">
                  <span>Progress to next reward</span>
                  <span style={{ fontWeight: 700 }}>₹{Math.floor(points / POINTS_TO_RUPEES) * 10} earned</span>
                </div>
                <div className="loyalty-bar-bg">
                  <motion.div
                    className="loyalty-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <div className="loyalty-info">
                  Earn 1 pt per ₹10 spent · 100 pts = ₹10 off
                </div>
              </div>
            </motion.div>
          )}

          {/* Rate Your Orders */}
          {rateableItems.length > 0 && (
            <div className="rate-section">
              <div className="rate-section-title">
                <Star size={16} color="var(--gold)" fill="var(--gold)" />
                Rate what you've eaten
              </div>
              <div className="rate-items-row">
                {rateableItems.map(item => {
                  const reviewed = !!myReviews[item.id];
                  return (
                    <button
                      key={item.id}
                      className={`rate-item-pill ${reviewed ? 'rated' : ''}`}
                      onClick={() => setReviewItem(item)}
                    >
                      <img src={item.image} alt={item.name} />
                      <span>{item.name}</span>
                      {reviewed
                        ? <span className="pill-badge reviewed">✓ Rated</span>
                        : <span className="pill-badge">Rate</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders List */}
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 16 }}>Order History</h3>

            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Package size={40} /></div>
                <h3>No orders yet</h3>
                <p>You have not placed any orders. Browse our menu and enjoy your first meal!</p>
                <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
                  Browse Menu <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="order-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div className="order-icon-wrap">
                      <ShoppingBag size={20} color="#f97316" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="order-id">{order.id}</div>
                      <div className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        <span style={{ fontWeight: 600 }}>₹{order.total}</span>
                      </div>
                      {order.address?.street && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={11} /> {order.address.street}, {order.address.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className={`status-badge ${order.status === 'Delivered' ? 'delivered' : ''}`}>
                      {order.status}
                    </span>
                    <Link
                      to={`/track/${order.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '7px 18px', fontSize: '0.85rem' }}
                    >
                      Track
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>

        </motion.div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <ReviewModal
          item={reviewItem}
          existing={myReviews[reviewItem.id] || null}
          onClose={() => setReviewItem(null)}
          onSaved={(saved) => setMyReviews(prev => ({ ...prev, [saved.itemId]: saved }))}
        />
      )}
    </div>
  );
};

export default Dashboard;
