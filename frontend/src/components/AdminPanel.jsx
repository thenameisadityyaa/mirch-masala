import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Users, TrendingUp, Clock,
  ChevronDown, RefreshCw, Package, CheckCircle,
  ChefHat, Truck, AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const STATUS_FLOW = ['Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];

const STATUS_COLORS = {
  'Accepted':        { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  'Preparing':       { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
  'Out for Delivery':{ bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  'Delivered':       { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
};

const STATUS_ICONS = {
  'Accepted':        <CheckCircle size={14} />,
  'Preparing':       <ChefHat size={14} />,
  'Out for Delivery':<Truck size={14} />,
  'Delivered':       <Package size={14} />,
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: '#fff', border: '1px solid var(--border)',
    borderRadius: 16, padding: 24,
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: color + '20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>
        {label}
      </div>
    </div>
  </div>
);

const AdminPanel = ({ user }) => {
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('All');
  const [updating, setUpdating] = useState(null);

  const token = localStorage.getItem('token');

  const fetchAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/orders`,  { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/admin/stats`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      } else {
        toast.error('Failed to load admin data');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchAll();
  }, [user, fetchAll, navigate]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(
        `${API_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(prev => prev.map(o =>
        o.id === orderId || o.orderId === orderId ? { ...o, status: newStatus } : o
      ));
      setStats(prev => prev ? {
        ...prev,
        pendingOrders: newStatus === 'Delivered'
          ? Math.max(0, prev.pendingOrders - 1)
          : prev.pendingOrders,
      } : prev);
      toast.success(`Status updated to "${newStatus}"`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600 }}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-surface)', padding: '100px 24px 80px' }}>
      <div className="container">
        <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Admin Panel</h2>
              <p className="text-muted" style={{ marginTop: 4 }}>Manage orders and track restaurant performance</p>
            </div>
            <button className="btn btn-secondary" onClick={fetchAll} style={{ gap: 8 }}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
              <StatCard icon={<ShoppingBag size={22} />} label="Total Orders"    value={stats.totalOrders}   color="#f97316" />
              <StatCard icon={<Users size={22} />}       label="Total Users"     value={stats.totalUsers}    color="#0ea5e9" />
              <StatCard icon={<TrendingUp size={22} />}  label="Total Revenue"   value={`₹${stats.totalRevenue}`} color="#22c55e" />
              <StatCard icon={<Clock size={22} />}       label="Pending Orders"  value={stats.pendingOrders} color="#f59e0b" />
            </div>
          )}

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', width: 'fit-content' }}>
            {['All', ...STATUS_FLOW].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '10px 18px',
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem',
                  border: 'none', cursor: 'pointer',
                  background: filter === s ? 'var(--brand)' : 'transparent',
                  color:      filter === s ? '#fff'         : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {s}
                {s !== 'All' && (
                  <span style={{ marginLeft: 6, opacity: 0.7, fontSize: '0.75rem' }}>
                    ({orders.filter(o => o.status === s).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={40} strokeWidth={1.2} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600 }}>No orders {filter !== 'All' ? `with status "${filter}"` : 'yet'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                      {['Order ID', 'Customer', 'Items', 'Total', 'Address', 'Time', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, i) => {
                      const sColors = STATUS_COLORS[order.status] || {};
                      const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
                      return (
                        <motion.tr
                          key={order.id || order._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          style={{ borderBottom: '1px solid var(--border-light)' }}
                        >
                          <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand)', whiteSpace: 'nowrap' }}>
                            {order.id || order.orderId}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.88rem' }}>
                            <div style={{ fontWeight: 600 }}>{order.userId?.name || 'Unknown'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{order.userId?.email}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-light)', maxWidth: 200 }}>
                            {order.items?.map(it => `${it.name} ×${it.qty || 1}`).join(', ')}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ₹{order.total}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 180 }}>
                            {order.address ? `${order.address.street}, ${order.address.city}` : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            <div>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 100,
                              fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
                              background: sColors.bg, color: sColors.color, border: `1px solid ${sColors.border}`,
                            }}>
                              {STATUS_ICONS[order.status]}
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {nextStatus ? (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                                disabled={updating === (order.id || order.orderId)}
                                onClick={() => updateStatus(order.id || order.orderId, nextStatus)}
                              >
                                <ChevronDown size={13} />
                                {updating === (order.id || order.orderId) ? '...' : `Mark ${nextStatus}`}
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <CheckCircle size={14} /> Done
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
