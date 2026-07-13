import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: "Rahul S.", role: "Foodie",          rating: 5, color: 'orange',
    review: "Hands down the best food in Gunupur. The Mirch Masala Special Soup is extraordinary — rich, spicy, and deeply comforting. Always delivered on time and piping hot."
  },
  {
    name: "Priya M.", role: "Regular Customer", rating: 5, color: 'sky',
    review: "I ordered the Chicken Thali twice this week and it keeps getting better. Generous portions, authentic taste, and the online ordering experience is seamless."
  },
  {
    name: "Amit K.", role: "Local Resident",   rating: 4, color: 'green',
    review: "Their Paneer Pakoda is perfectly crispy and spiced. The live order tracking feature gives me real peace of mind. Highly recommend to everyone in Gunupur."
  }
];

const Testimonials = () => (
  <section className="section" style={{ background: '#faf7f2', borderTop: '1px solid #e7e5e4', borderBottom: '1px solid #e7e5e4' }}>
    <div className="container">
      <div className="section-header" style={{ marginBottom: 36 }}>
        <h2 className="section-title">What Our Customers Say</h2>
      </div>
      <div className="testimonials-grid">
        {REVIEWS.map((r, i) => (
          <motion.div
            key={i}
            initial={{ y: 16, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="testimonial-card"
          >
            <div className="stars">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} size={14} fill={j < r.rating ? '#f59e0b' : 'none'} color={j < r.rating ? '#f59e0b' : '#d1d5db'} style={{ display: 'inline' }} />
              ))}
            </div>
            <p className="testimonial-text">"{r.review}"</p>
            <div className="t-author">
              <div className={`t-avatar ${r.color}`}>{r.name[0]}</div>
              <div>
                <div className="t-name">{r.name}</div>
                <div className="t-role">{r.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;
