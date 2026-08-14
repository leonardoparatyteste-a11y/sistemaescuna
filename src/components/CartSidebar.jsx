import React, { memo } from 'react';
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle, Printer, UtensilsCrossed, Music2, Percent } from 'lucide-react';
import { getCatMeta } from './ProductCard';

export const CartSidebar = memo(({
  cart,
  tableNumber,
  setTableNumber,
  comandaNumber,
  setComandaNumber,
  updateQuantity,
  cartTotal,
  handleCheckout,
  openOrders = [],
  activeOrderId = null,
  handleSelectOpenOrder,
  handleCancelEdit,
  existingItems = [],
  products = [],
  updateItemNotes,
  hasTax,
  setHasTax,
  hasCouvert,
  setHasCouvert,
  couvertValue = 12.00,
  setCouvertValue = () => {},
  comandaInputRef,
}) => {
  const taxAmount    = hasTax    ? cartTotal * 0.10 : 0;
  const couvertTotal = hasCouvert ? couvertValue : 0;
  const grandTotal   = cartTotal + taxAmount + couvertTotal;
  return (
    <div className="cart-sidebar">
      {/* Selector for open comandas */}
      <div style={{ padding: '0.75rem 1.25rem 0.5rem', borderBottom: '1.5px solid var(--border)', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label className="comanda-label" style={{ margin: 0, fontSize: '0.7rem' }}>
          Lançar em Comanda Aberta
        </label>
        <select
          value={activeOrderId || ''}
          onChange={e => handleSelectOpenOrder(e.target.value)}
          className="input-premium"
          style={{ height: '36px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          <option value="">-- Nova Comanda --</option>
          {openOrders.map(o => (
            <option key={o.id} value={o.id}>
              Mesa {o.tableNumber} - Comanda #{o.orderNumber} (Sub: {o.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
            </option>
          ))}
        </select>
      </div>

      {/* Mesa + Comanda inputs */}
      <div className="cart-header">
        {activeOrderId && (
          <div style={{
            background: 'var(--primary-light)',
            border: '1.5px solid var(--primary)',
            color: 'var(--primary)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>✏️ Editando Comanda #{comandaNumber}</span>
            <button onClick={handleCancelEdit} style={{
              background: 'var(--danger-light)',
              color: 'var(--danger)',
              border: 'none',
              borderRadius: '4px',
              padding: '0.15rem 0.4rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              Cancelar
            </button>
          </div>
        )}
        <div className="cart-header-inputs">
          <div className="cart-input-group">
            <label className="comanda-label">
              <UtensilsCrossed size={12} className="inline-icon" /> Mesa
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
              className="input-premium cart-table-input"
              placeholder="Nº Mesa"
              disabled={!!activeOrderId}
            />
          </div>
          <div className="cart-input-group" style={{ flex: 1 }}>
            <label className="comanda-label">
              <ShoppingCart size={12} className="inline-icon" /> Comanda
            </label>
            <input
              ref={comandaInputRef}
              type="text"
              value={comandaNumber}
              onChange={e => setComandaNumber(e.target.value)}
              className="input-premium comanda-input"
              placeholder="Nº Comanda (F4)"
              disabled={!!activeOrderId}
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="cart-items-container">
        {/* Existing Items in Comanda (Collapsible) */}
        {activeOrderId && existingItems.length > 0 && (
          <details style={{
            background: 'var(--bg-color)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.6rem',
            marginBottom: '0.75rem'
          }}>
            <summary style={{
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              userSelect: 'none',
              outline: 'none'
            }}>
              📦 Itens já Lançados ({existingItems.reduce((acc, i) => acc + i.quantity, 0)})
            </summary>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {existingItems.map(item => {
                const prod = products.find(p => p.id === item.productId);
                const name = prod ? prod.name : 'Produto';
                const emoji = prod ? getCatMeta(prod.category).emoji : '🍽️';
                return (
                  <div key={item.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: '0.78rem',
                    padding: '0.25rem 0.4rem',
                    background: 'var(--panel-bg)',
                    borderRadius: '6px',
                    gap: '0.15rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        {emoji} {item.quantity}x {name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    {item.notes && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontStyle: 'italic', paddingLeft: '1.25rem' }}>
                        * {item.notes}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <ShoppingCart size={32} className="empty-icon" />
            <span>Carrinho vazio</span>
          </div>
        ) : (
          <div className="cart-items-list">
            {cart.map(item => {
              const meta = getCatMeta(item.category);
              return (
                <div key={item.id} className="cart-item">
                  <span className="item-emoji">{meta.emoji}</span>
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-price" style={{ color: meta.color }}>
                      {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <input
                      type="text"
                      placeholder="Obs: ex: sem gelo"
                      value={item.notes || ''}
                      onChange={e => updateItemNotes(item.id, e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: '0.75rem',
                        marginTop: '0.35rem',
                        padding: '0.2rem 0.4rem',
                        border: '1.5px solid var(--border)',
                        borderRadius: '6px',
                        background: 'var(--panel-bg)',
                        color: 'var(--text-main)',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div className="item-controls">
                    <button onClick={() => updateQuantity(item.id, -1)} className={`control-btn ${item.quantity === 1 ? 'danger' : ''}`}>
                      {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                    </button>
                    <span className="item-quantity">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="control-btn success">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer total + actions */}
      <div className="cart-footer">

        {/* ── Toggles de taxa e couvert ── */}
        <div className="cart-charges-box">
          <button
            className={`charge-toggle ${hasTax ? 'charge-toggle--on' : ''}`}
            onClick={() => setHasTax(prev => !prev)}
            title={hasTax ? 'Remover taxa de serviço' : 'Incluir taxa de serviço'}
          >
            <Percent size={13} />
            <span>Taxa Serviço (10%)</span>
            <span className="charge-toggle__value">
              {hasTax
                ? `+ ${taxAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
                : 'não cobrar'}
            </span>
          </button>

          {/* Couvert toggle + input de valor */}
          <div className={`charge-toggle-group ${hasCouvert ? 'charge-toggle-group--on' : ''}`}>
            <button
              className={`charge-toggle charge-toggle--couvert ${hasCouvert ? 'charge-toggle--on charge-toggle--gold' : ''}`}
              onClick={() => setHasCouvert(prev => !prev)}
              title={hasCouvert ? 'Remover couvert musical' : 'Incluir couvert musical'}
            >
              <Music2 size={13} />
              <span>Couvert Musical</span>
              {!hasCouvert && (
                <span className="charge-toggle__value">não cobrar</span>
              )}
            </button>
            {hasCouvert && (
              <div className="couvert-value-input-wrap">
                <span className="couvert-currency">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={couvertValue}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0) setCouvertValue(v);
                  }}
                  className="couvert-value-input"
                  title="Valor do couvert por pessoa"
                />
                <span className="couvert-pp">/ pessoa</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Breakdown de total ── */}
        <div className="cart-total-breakdown">
          {(hasTax || hasCouvert) && (
            <div className="cart-subtotal-row">
              <span>Consumo</span>
              <span>{cartTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          {hasTax && (
            <div className="cart-subtotal-row">
              <span>Taxa (10%)</span>
              <span>+ {taxAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
          {hasCouvert && (
            <div className="cart-subtotal-row">
              <span>Couvert Musical</span>
              <span>+ {couvertValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )}
        </div>

        <div className="cart-total-row">
          <span className="total-label">{activeOrderId ? 'Novos Itens' : 'Total'}</span>
          <span className="total-value">
            {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <button onClick={handleCheckout} className="btn-premium btn-success-gradient checkout-btn">
          <CheckCircle size={18} /> {activeOrderId ? 'Confirmar Lançamento' : 'Salvar Comanda'}
        </button>

        <div className="print-actions">
          <button className="btn-premium print-btn">
            <Printer size={15} /> Bar
          </button>
          <button className="btn-premium print-btn">
            <Printer size={15} /> Cozinha
          </button>
        </div>
      </div>
    </div>
  );
});

CartSidebar.displayName = 'CartSidebar';

