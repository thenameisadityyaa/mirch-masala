import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, MapPin, Search, Menu, X, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Navbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount, openCart } = useCart();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="logo" onClick={closeMobile}>
            mirch<span>masala</span>
          </Link>

          {/* Desktop: location + search */}
          <div className="nav-location nav-desktop-only">
            <MapPin size={14} color="#f97316" />
            <span>Gunupur, Odisha</span>
          </div>

          <div className="nav-search nav-desktop-only">
            <Search size={16} color="#a8a29e" />
            <input type="text" placeholder="Search for dishes..." />
          </div>

          {/* Desktop links */}
          <div className="nav-links nav-desktop-only">
            {user ? (
              <>
                {user.isAdmin && (
                  <Link to="/admin" className="btn btn-ghost" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    Admin
                  </Link>
                )}
                <Link to="/dashboard" className="btn btn-ghost">My Orders</Link>
                <button onClick={handleLogout} className="btn btn-secondary">
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn btn-ghost">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}

            {/* Cart Button */}
            <button
              onClick={openCart}
              className="cart-nav-btn"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>
              )}
            </button>
          </div>

          {/* Mobile: cart icon + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={openCart}
              className="cart-nav-btn nav-mobile-cart"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>
              )}
            </button>
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="mobile-nav">
            <div className="mobile-nav-location">
              <MapPin size={14} color="#f97316" />
              <span>Gunupur, Odisha</span>
            </div>
            <div className="mobile-nav-search">
              <Search size={16} color="#a8a29e" />
              <input type="text" placeholder="Search for dishes..." />
            </div>
            <div className="mobile-nav-links">
              <Link to="/"         className="mobile-nav-link" onClick={closeMobile}>Home</Link>
              <Link to="/track"    className="mobile-nav-link" onClick={closeMobile}>Track Order</Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="mobile-nav-link" onClick={closeMobile}>My Orders</Link>
                  <button onClick={handleLogout} className="mobile-nav-link mobile-logout">
                    <LogOut size={15} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login"    className="mobile-nav-link" onClick={closeMobile}>Login</Link>
                  <Link to="/register" className="btn btn-primary" style={{ marginTop: 8 }} onClick={closeMobile}>Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
