import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, DollarSign, ArrowUpRight } from 'lucide-react';
import { useToast } from '../components/Toast';
import { useCart } from '../hooks/useCart';
import { ProductCard } from '../components/ProductCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { CartSidebar } from '../components/CartSidebar';
import { useLocation } from 'react-router-dom';
import { CashMovementModal } from '../components/CashMovementModal';
import { calculateCashDrawerBalance } from '../utils/cashMovementUtils';

export function PDV() {
  const { addToast } = useToast();
  const [tableNumber, setTableNumber] = useState('');
  const [comandaNumber, setComandaNumber] = useState('');
  const [activeCategory, setActiveCategory] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  const cashMovements = useLiveQuery(() => db.cash_movements.toArray(), []) || [];
  const allOrders = useLiveQuery(() => db.orders.toArray(), []) || [];
  const allTickets = useLiveQuery(() => db.tickets.toArray(), []) || [];

  const { expectedCash } = useMemo(() => {
    return calculateCashDrawerBalance(cashMovements, allOrders, allTickets);
  }, [cashMovements, allOrders, allTickets]);

  const { cart, addToCart, updateQuantity, clearCart, cartTotal, updateItemNotes } = useCart();
  const [hasTax, setHasTax] = useState(true);
  const [hasCouvert, setHasCouvert] = useState(false);
  const [couvertValue, setCouvertValue] = useState(12.00);

  const rawProducts = useLiveQuery(() => db.products.toArray(), []) || null;
  const products = useMemo(() => rawProducts || [], [rawProducts]);

  const rawOpenOrders = useLiveQuery(() => db.orders.where({ status: 'open' }).toArray(), []) || null;
  const openOrders = useMemo(() => rawOpenOrders || [], [rawOpenOrders]);

  const rawExistingItems = useLiveQuery(
    () => activeOrderId ? db.orderItems.where({ orderId: activeOrderId }).toArray() : [],
    [activeOrderId]
  ) || null;
  const existingItems = useMemo(() => rawExistingItems || [], [rawExistingItems]);

  const location = useLocation();

  // Load comanda if passed in the navigation state (e.g. from Comandas page)
  useEffect(() => {
    if (location.state?.activeOrderId) {
      const orderId = location.state.activeOrderId;
      setTimeout(() => {
        setActiveOrderId(orderId);
        db.orders.get(orderId).then(order => {
          if (order) {
            setTableNumber(order.tableNumber);
            setComandaNumber(order.orderNumber);
            addToast(`Comanda #${order.orderNumber} (Mesa ${order.tableNumber}) carregada para lançamento de itens.`, 'info');
          }
        });
      }, 0);
      // Clear route state so reloading doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  // Auto-detection of open comanda when user types a comanda number
  useEffect(() => {
    if (!activeOrderId && comandaNumber.trim()) {
      const matched = openOrders.find(o => o.orderNumber === comandaNumber.trim());
      if (matched) {
        setTimeout(() => {
          setActiveOrderId(matched.id);
          setTableNumber(matched.tableNumber);
          addToast(`Comanda aberta #${matched.orderNumber} (Mesa ${matched.tableNumber}) carregada!`, 'info');
        }, 0);
      }
    }
  }, [comandaNumber, openOrders, activeOrderId, addToast]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = activeCategory === 'todas' || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchTerm]);

  const handleSelectOpenOrder = useCallback(async (orderId) => {
    if (!orderId) {
      setActiveOrderId(null);
      setTableNumber('');
      setComandaNumber('');
      return;
    }
    const order = await db.orders.get(Number(orderId));
    if (order) {
      setActiveOrderId(order.id);
      setTableNumber(order.tableNumber);
      setComandaNumber(order.orderNumber);
      setHasTax(order.hasTax !== false);
      setHasCouvert(order.hasCouvert === true);
      setCouvertValue(order.couvertValue ?? 12.00);
      addToast(`Comanda #${order.orderNumber} (Mesa ${order.tableNumber}) selecionada!`, 'info');
    }
  }, [addToast]);

  const handleCancelEdit = useCallback(() => {
    setActiveOrderId(null);
    setTableNumber('');
    setComandaNumber('');
    setHasTax(true);
    setHasCouvert(false);
    setCouvertValue(12.00);
    clearCart();
    addToast('Edição de comanda cancelada.', 'info');
  }, [clearCart, addToast]);

  const handleCheckout = useCallback(async () => {
    if (!tableNumber.trim()) return addToast('Digite o número da mesa!', 'warning');
    if (!comandaNumber.trim()) return addToast('Digite o número da comanda!', 'warning');
    // Allow saving with empty cart (comanda sem consumo ainda)
    
    try {
      await db.transaction('rw', db.orders, db.orderItems, db.products, async () => {
        if (activeOrderId) {
          const order = await db.orders.get(activeOrderId);
          if (!order) throw new Error('Comanda não encontrada.');

          for (const item of cart) {
            await db.orderItems.add({
              orderId: activeOrderId,
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              printed: false,
              notes: item.notes || ''
            });
            const p = await db.products.get(item.id);
            if (p) await db.products.update(item.id, { stock: p.stock - item.quantity });
          }

          const newTotal = (order.total || 0) + cartTotal;
          await db.orders.update(activeOrderId, { total: newTotal, hasTax, hasCouvert, couvertValue });
          addToast(`Itens adicionados à Comanda #${comandaNumber} — Mesa ${tableNumber}!`, 'success');
        } else {
          const orderId = await db.orders.add({
            orderNumber: comandaNumber.trim(),
            tableNumber: tableNumber.trim(),
            status: 'open',
            date: new Date().toISOString(),
            total: cartTotal,
            hasTax,
            hasCouvert,
            couvertValue,
          });

          for (const item of cart) {
            await db.orderItems.add({
              orderId,
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
              printed: false,
              notes: item.notes || ''
            });
            const p = await db.products.get(item.id);
            if (p) await db.products.update(item.id, { stock: p.stock - item.quantity });
          }
          addToast(`Comanda #${comandaNumber} — Mesa ${tableNumber} aberta!`, 'success');
        }
      });
      
      clearCart();
      setComandaNumber('');
      setTableNumber('');
      setActiveOrderId(null);
      setHasTax(true);
      setHasCouvert(false);
      setCouvertValue(12.00);
    } catch (err) {
      addToast('Erro ao salvar comanda: ' + err.message, 'error');
    }
  }, [activeOrderId, tableNumber, comandaNumber, cart, cartTotal, addToast, clearCart]);

  // Memoize addToCart handler to pass down to ProductCard
  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, [addToCart]);

  return (
    <div className="fade-in-up pdv-layout">
      {/* Product Grid Area */}
      <div className="pdv-main-area">
        {/* Barra Superior de Ações de Caixa */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem', background: 'var(--panel-bg)', borderRadius: '14px',
          border: '1.5px solid var(--border)', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'var(--success-light)', color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>
                Gaveta (Espécie)
              </span>
              <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {expectedCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>
          </div>

          <button
            onClick={() => setIsCashModalOpen(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
          >
            <ArrowUpRight size={16} /> Sangria / Suprimento
          </button>
        </div>

        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <div className="products-grid">
          {filteredProducts.map(p => {
            const inCartItem = cart.find(i => i.id === p.id);
            const inCartQty = inCartItem ? inCartItem.quantity : 0;
            
            return (
              <ProductCard
                key={p.id}
                product={p}
                inCartQty={inCartQty}
                onAddToCart={handleAddToCart}
              />
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="empty-products-state">
              <Search size={36} className="empty-search-icon" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        cart={cart}
        tableNumber={tableNumber}
        setTableNumber={setTableNumber}
        comandaNumber={comandaNumber}
        setComandaNumber={setComandaNumber}
        updateQuantity={updateQuantity}
        cartTotal={cartTotal}
        handleCheckout={handleCheckout}
        openOrders={openOrders}
        activeOrderId={activeOrderId}
        handleSelectOpenOrder={handleSelectOpenOrder}
        handleCancelEdit={handleCancelEdit}
        existingItems={existingItems}
        products={products}
        updateItemNotes={updateItemNotes}
        hasTax={hasTax}
        setHasTax={setHasTax}
        hasCouvert={hasCouvert}
        setHasCouvert={setHasCouvert}
        couvertValue={couvertValue}
        setCouvertValue={setCouvertValue}
      />

      <CashMovementModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        currentExpectedCash={expectedCash}
      />
    </div>
  );
}

