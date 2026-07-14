import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';
import './index.css';

import { CartProvider } from './context/CartContext';
import Navbar    from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Home      from './components/Home';
import Tracker   from './components/Tracker';
import Dashboard from './components/Dashboard';
import Auth      from './components/Auth';
import Checkout  from './components/Checkout';
import NotFound  from './components/NotFound';

function App() {
  const [user, setUser] = useState(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <CartProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
          }}
        />
        <Navbar user={user} setUser={setUser} />
        <CartDrawer />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/"           element={<Home />} />
            <Route path="/track"      element={<Tracker />} />
            <Route path="/track/:id"  element={<Tracker />} />
            <Route path="/checkout"   element={<Checkout />} />
            <Route path="/login"      element={<Auth type="login"    setUser={setUser} />} />
            <Route path="/register"   element={<Auth type="register" setUser={setUser} />} />
            <Route path="/dashboard"  element={<Dashboard user={user} />} />
            <Route path="*"           element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </CartProvider>
  );
}

export default App;
