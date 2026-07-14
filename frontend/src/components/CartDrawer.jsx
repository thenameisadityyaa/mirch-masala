import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartDrawer = () => {
  const { items, isOpen, closeCart, addItem, decItem, removeItem, total, itemCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(28,25,23,0.45)',
              zIndex: 200,
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: 420,
              background: '#fff',
              zIndex: 201,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={22} color="var(--brand)" />
                <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                  Your Cart
                  {itemCount > 0 && (
                    <span style={{
                      marginLeft: 8, background: 'var(--brand)',
                      color: '#fff', borderRadius: '100px',
                      padding: '2px 9px', fontSize: '0.78rem', fontWeight: 700,
                    }}>
                      {itemCount}
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={closeCart}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--text-light)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} strokeWidth={1.2} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                  <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-light)' }}>Your cart is empty</p>
                  <p style={{ fontSize: '0.88rem', marginTop: 6 }}>Add some delicious items from the menu!</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map(item => {
                    const price = parseInt(item.price.replace('₹', '')) || 0;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                          display: 'flex', gap: 12, alignItems: 'center',
                          paddingBottom: 16, marginBottom: 16,
                          borderBottom: '1px solid var(--border-light)',
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 8 }}>
                            {item.category}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => decItem(item.id)} className="cart-qty-btn"><Minus size={13} /></button>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                            <button onClick={() => addItem(item)} className="cart-qty-btn"><Plus size={13} /></button>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
                            ₹{price * item.qty}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#dc2626', marginTop: 6, padding: 0, display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', background: '#fafaf9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>₹{total}</span>
                </div>
                <button
                  className="btn btn-primary w-full"
                  style={{ fontSize: '1rem', padding: '14px', borderRadius: 12 }}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout <ArrowRight size={17} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
