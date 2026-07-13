import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Package } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Dashboard = ({ user }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    axios
      .get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOrders(r.data))
      .catch(console.error);
  }, [user]);

  return (
    <div className="dashboard-page">
      <div className="container">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="dashboard-header">
            <h2>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
            <p className="text-muted">Here is your order history with The New Mirch Masala.</p>
          </div>

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
            <div>
              {orders.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="order-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div className="order-icon-wrap">
                      <ShoppingBag size={20} color="#f97316" />
                    </div>
                    <div>
                      <div className="order-id">{order.id}</div>
                      <div className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
