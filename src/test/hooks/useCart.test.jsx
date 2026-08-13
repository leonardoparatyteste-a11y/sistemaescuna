import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCart } from '../../hooks/useCart';
import { ToastProvider } from '../../components/Toast';

describe('useCart Hook', () => {
  it('deve adicionar um produto com estoque ao carrinho', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 1, name: 'Cerveja', price: 10, stock: 5 };

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]).toEqual({ ...product, quantity: 1 });
    expect(result.current.cartTotal).toBe(10);
  });

  it('não deve adicionar produto sem estoque', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 2, name: 'Refrigerante', price: 5, stock: 0 };

    act(() => {
      result.current.addToCart(product);
    });

    expect(result.current.cart).toHaveLength(0);
    expect(result.current.cartTotal).toBe(0);
  });

  it('deve atualizar quantidade e total', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 1, name: 'Água', price: 5, stock: 10 };

    act(() => {
      result.current.addToCart(product);
    });

    act(() => {
      result.current.updateQuantity(1, 2); // id 1, +2
    });

    expect(result.current.cart[0].quantity).toBe(3);
    expect(result.current.cartTotal).toBe(15);
  });

  it('deve atualizar as observações (notes) de um item no carrinho', () => {
    const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const product = { id: 1, name: 'Cerveja', price: 10, stock: 5 };

    act(() => {
      result.current.addToCart(product);
    });

    act(() => {
      result.current.updateItemNotes(1, 'Sem gelo');
    });

    expect(result.current.cart[0].notes).toBe('Sem gelo');
  });
});
