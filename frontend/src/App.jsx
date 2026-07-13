import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import './index.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import Tracker from './components/Tracker';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

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
    <Router>
      <Navbar user={user} setUser={setUser} />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"                element={<Home />} />
          <Route path="/track"           element={<Tracker />} />
          <Route path="/track/:id"       element={<Tracker />} />
          <Route path="/login"           element={<Auth type="login"    setUser={setUser} />} />
          <Route path="/register"        element={<Auth type="register" setUser={setUser} />} />
          <Route path="/dashboard"       element={<Dashboard user={user} />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
