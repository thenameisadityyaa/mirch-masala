import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-logo">mirch<span>masala</span></div>
          <p className="footer-desc">
            The New Mirch Masala, Gunupur — crafting authentic Indian flavours since 2013. Order online, track live, eat happy.
          </p>
          <div className="social-row" style={{ marginTop: 24 }}>
            <a href="#" className="social-btn">IG</a>
            <a href="#" className="social-btn">FB</a>
            <a href="#" className="social-btn">X</a>
          </div>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/">Menu</Link>
          <Link to="/track">Track Order</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Sign Up</Link>
          <Link to="/dashboard">My Orders</Link>
        </div>
        <div className="footer-col">
          <h4>Contact</h4>
          <a href="#">Main Road, Gunupur,<br/>Odisha — 765022</a>
          <a href="tel:+919999900000">+91 99999 00000</a>
          <a href="mailto:hello@mirchmasala.com">hello@mirchmasala.com</a>
          <p style={{ color: '#636366', marginTop: 12, fontSize: '0.85rem' }}>
            Open daily 11 AM – 11 PM
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} The New Mirch Masala. All rights reserved.</p>
        <p>Crafted with care in Gunupur, Odisha</p>
      </div>
    </div>
  </footer>
);

export default Footer;
