import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Utensils } from 'lucide-react';

const NotFound = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, var(--bg) 0%, var(--brand-light) 100%)',
    padding: '80px 24px',
    textAlign: 'center',
  }}>
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{
        width: 96, height: 96, borderRadius: 28,
        background: 'var(--brand-light)', color: 'var(--brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px',
      }}>
        <Utensils size={44} />
      </div>
      <h1 style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-4px', color: 'var(--brand)', lineHeight: 1 }}>
        404
      </h1>
      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '12px 0 10px', letterSpacing: '-0.5px' }}>
        Page not found
      </h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto 36px', lineHeight: 1.7 }}>
        Looks like this page went out for delivery and never came back. Let's get you home.
      </p>
      <Link to="/" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
        <Home size={18} /> Back to Menu
      </Link>
    </motion.div>
  </div>
);

export default NotFound;
