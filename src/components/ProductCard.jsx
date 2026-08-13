import React, { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

const CATEGORY_META = {
  bebidas:    { label: 'Bebidas',    color: '#2563eb', bg: '#eff6ff', emoji: '🍺' },
  porcoes:    { label: 'Porções',    color: '#059669', bg: '#ecfdf5', emoji: '🍟' },
  pratos:     { label: 'Pratos',     color: '#7c3aed', bg: '#f5f3ff', emoji: '🍽️' },
  sobremesas: { label: 'Sobremesas', color: '#db2777', bg: '#fdf2f8', emoji: '🍮' },
  todas:      { label: 'Todos',      color: '#475569', bg: '#f1f5f9', emoji: '📋' },
};

export function getCatMeta(cat) {
  return CATEGORY_META[cat] || { label: cat, color: '#475569', bg: '#f1f5f9', emoji: '🍽️' };
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
        boxShadow: inCart ? `0 4px 16px ${meta.color}30` : 'var(--shadow-sm)',
        '--hover-shadow': `0 8px 20px ${meta.color}30`
      }}
    >
      {inCart && (
        <div className="cart-badge" style={{ backgroundColor: meta.color }}>
          {inCartQty}
        </div>
      )}
      
      <span className="emoji-icon">{meta.emoji}</span>
      
      <span className="category-tag" style={{ background: meta.bg, color: meta.color }}>
        {meta.label}
      </span>
      
      <p className="product-name">{product.name}</p>
      <p className="product-code">Cód: {product.code}</p>
      
      <p className="product-price" style={{ color: meta.color }}>
        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>
      
      <div className={`stock-indicator ${isLow ? 'low' : ''}`}>
        {isLow && <AlertTriangle size={10} />} Estq: {product.stock}
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
