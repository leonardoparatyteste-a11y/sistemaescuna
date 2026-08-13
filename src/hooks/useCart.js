import { useState, useCallback } from 'react';
import { useToast } from '../components/Toast';

export function useCart() {
  const [cart, setCart] = useState([]);
  const { addToast } = useToast();

  const addToCart = useCallback((product) => {
    if (product.stock <= 0) {
      addToast('Produto sem estoque!', 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addToast('Estoque insuficiente!', 'error');
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [addToast]);

  const updateQuantity = useCallback((id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const updateItemNotes = useCallback((id, notes) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  }, []);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return {
    cart,
    addToCart,
    updateQuantity,
    clearCart,
    updateItemNotes,
    cartTotal
  };
}
