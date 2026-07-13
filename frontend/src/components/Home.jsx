import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Flame, Zap, MapPin, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Testimonials from './Testimonials';
import FAQ from './FAQ';
import Footer from './Footer';
import { menuItems } from '../data/menuItems';

import { API_URL } from '../config';

const isVeg = (cat) => {
  if (['Soup (Non Veg)', 'Pakoda (Non Veg)'].includes(cat)) return 'nonveg';
  if (cat === 'Meals') return null;
  return 'veg';
};

const WHY_ITEMS = [
  { icon: <Flame size={24} />, colorClass: 'orange', title: 'Fresh Every Order', desc: 'Made to order with authentic, locally sourced spices.' },
  { icon: <Zap size={24} />,   colorClass: 'sky',    title: 'Fast Delivery',    desc: 'Hot food at your door in 30 minutes or less.' },
  { icon: <MapPin size={24} />, colorClass: 'gold',  title: 'Live Order Tracking', desc: 'Know exactly where your food is, every step of the way.' },
  { icon: <ShieldCheck size={24} />, colorClass: 'green', title: 'Safe & Secure', desc: 'Your personal data is encrypted and never shared.' },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = menuItems.filter(item => {
    const catMatch = activeCategory === 'All' || item.category === activeCategory;
    const searchMatch = search === '' || item.name.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const handleOrder = async (dish) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const res = await axios.post(`${API_URL}/orders`, {
        items: [dish],
        total: parseInt(dish.price.replace('₹', '')),
        address: 'Customer Address'
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(`/track/${res.data.id}`);
    } catch {
      alert('Could not place order. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

      {/* ── HERO ── */}
      <section className="hero-wrap">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-text">
              <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.55 }}>
                <h1>Authentic flavours,<br /><span>delivered fast.</span></h1>
                <p>
                  The New Mirch Masala — Gunupur's most loved restaurant.
                  Browse our full menu, place your order in seconds, and track it live.
                </p>
                <div className="hero-search">
                  <input
                    type="text"
                    placeholder="Search for dishes, soups, thalis..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <button onClick={() => setSearch('')}>Search</button>
                </div>
                <div className="hero-stats">
                  <div className="stat-item"><span className="stat-num">42+</span><span className="stat-label">Menu Items</span></div>
                  <div className="stat-item"><span className="stat-num">30 min</span><span className="stat-label">Avg. Delivery</span></div>
                  <div className="stat-item"><span className="stat-num">4.8 / 5</span><span className="stat-label">Avg. Rating</span></div>
                </div>
              </motion.div>
            </div>
            <div className="hero-image">
              <img
                src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80"
                alt="Indian food spread"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY US STRIP ── */}
      <section className="why-strip">
        <div className="container">
          <div className="why-grid">
            {WHY_ITEMS.map((w, i) => (
              <motion.div
                key={i}
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="why-item"
              >
                <div className={`why-icon ${w.colorClass}`}>{w.icon}</div>
                <div className="why-title">{w.title}</div>
                <div className="why-desc">{w.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY STRIP ── */}
      <div className="category-strip">
        <div className="container">
          {categories.map(cat => (
            <button
              key={cat}
              className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── MENU GRID ── */}
      <section id="menu" className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">
              {activeCategory === 'All' ? 'Full Menu' : activeCategory}
              <span style={{ color: '#a8a29e', fontWeight: 400, fontSize: '1rem', marginLeft: 10 }}>
                — {filteredItems.length} items
              </span>
            </h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ShoppingBag size={36} /></div>
              <h3>No dishes found</h3>
              <p>Try a different category or clear the search to browse everything.</p>
            </div>
          ) : (
            <div className="menu-grid">
              {filteredItems.map((dish, i) => {
                const vegType = isVeg(dish.category);
                return (
                  <motion.div
                    key={dish.id}
                    initial={{ y: 16, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 8) * 0.04 }}
                    className="menu-card"
                  >
                    <div className="menu-card-img-wrap">
                      <img src={dish.image} alt={dish.name} className="menu-card-img" loading="lazy" />
                      {vegType && <div className={`veg-badge ${vegType}`} />}
                    </div>
                    <div className="menu-card-body">
                      <div className="menu-card-name">{dish.name}</div>
                      <div className="menu-card-cat">{dish.category}</div>
                      <div className="menu-card-footer">
                        <span className="menu-card-price">{dish.price}</span>
                        <button className="add-btn" onClick={() => handleOrder(dish)}>
                          <ShoppingBag size={13} /> Add
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Testimonials />
      <FAQ />
      <Footer />
    </motion.div>
  );
};

export default Home;
