import React, { memo } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

const CATEGORY_META = {
  bebidas:    { label: 'Bebidas',    color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', emoji: '🍺' },
  porcoes:    { label: 'Porções',    color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', emoji: '🍟' },
  pratos:     { label: 'Pratos',     color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', emoji: '🍽️' },
  sobremesas: { label: 'Sobremesas', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', emoji: '🍮' },
  todas:      { label: 'Todos',      color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', emoji: '📋' },
};

export function getCatMeta(cat) {
  return CATEGORY_META[cat] || { label: cat, color: '#64748b', bg: 'rgba(100, 116, 139, 0.15)', emoji: '🍽️' };
}

export const ProductCard = memo(({ product, inCartQty, onAddToCart }) => {
  const meta = getCatMeta(product.category);
  const isLow = product.stock <= 10;
  const isOut = product.stock <= 0;
  const inCart = inCartQty > 0;

  return (
    <div
      onClick={() => !isOut && onAddToCart(product)}
      className={`pdv-product-card ${inCart ? 'in-cart' : ''} ${isOut ? 'out-of-stock' : ''}`}
      style={{
        borderColor: inCart ? meta.color : 'var(--border)',
        boxShadow: inCart ? `0 6px 20px ${meta.color}40` : 'var(--shadow-sm)',
        background: 'var(--panel-bg-glass)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {inCart && (
        <div className="cart-badge" style={{ backgroundColor: meta.color }}>
          {inCartQty}
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span className="emoji-icon" style={{ fontSize: '2.2rem' }}>{meta.emoji}</span>
        <span className="category-tag" style={{ background: meta.bg, color: meta.color, fontSize: '0.7rem', fontWeight: 900 }}>
          {meta.label}
        </span>
      </div>
      
      <div style={{ flex: 1, margin: '0.4rem 0' }}>
        <p className="product-name" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
          {product.name}
        </p>
        <p className="product-code" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Cód: {product.code}
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
        <p className="product-price" style={{ color: meta.color, fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>
          {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>

        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: meta.bg, color: meta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900
        }}>
          <Plus size={16} />
        </div>
      </div>
      
      <div className={`stock-indicator ${isLow ? 'low' : ''}`} style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
        {isLow && <AlertTriangle size={12} />} Estq: {product.stock} un
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
