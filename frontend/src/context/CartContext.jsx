import React, { createContext, useContext, useReducer, useCallback } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find(i => i.id === action.item.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] };
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'DEC': {
      const existing = state.items.find(i => i.id === action.id);
      if (!existing || existing.qty <= 1) {
        return { ...state, items: state.items.filter(i => i.id !== action.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, qty: i.qty - 1 } : i
        ),
      };
    }
    case 'CLEAR':
      return { ...state, items: [] };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    default:
      return state;
  }
};

const initialState = { items: [], isOpen: false };

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem   = useCallback((item) => dispatch({ type: 'ADD',    item }),  []);
  const removeItem= useCallback((id)   => dispatch({ type: 'REMOVE', id }),    []);
  const decItem   = useCallback((id)   => dispatch({ type: 'DEC',    id }),    []);
  const clearCart = useCallback(()     => dispatch({ type: 'CLEAR' }),         []);
  const openCart  = useCallback(()     => dispatch({ type: 'OPEN' }),          []);
  const closeCart = useCallback(()     => dispatch({ type: 'CLOSE' }),         []);

  const itemCount = state.items.reduce((sum, i) => sum + i.qty, 0);
  const total     = state.items.reduce((sum, i) => {
    const price = parseInt(i.price.replace('₹', '')) || 0;
    return sum + price * i.qty;
  }, 0);

  return (
    <CartContext.Provider value={{ ...state, itemCount, total, addItem, removeItem, decItem, clearCart, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
