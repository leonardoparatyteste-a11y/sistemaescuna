import React, { memo } from 'react';
import { Search, X } from 'lucide-react';
import { getCatMeta } from './ProductCard';

const categories = ['todas', 'bebidas', 'porcoes', 'pratos', 'sobremesas'];

export const CategoryFilter = memo(({ activeCategory, setActiveCategory, searchTerm, setSearchTerm, inputRef, onKeyDown }) => {
  return (
    <div className="category-filter-bar">
      <div className="categories-wrapper">
        {categories.map(cat => {
          const meta = getCatMeta(cat);
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`category-btn ${isActive ? 'active' : ''}`}
              style={{
                backgroundColor: isActive ? meta.color : 'var(--panel-bg)',
                color: isActive ? 'white' : 'var(--text-main)',
                border: isActive ? `1.5px solid ${meta.color}` : '1.5px solid var(--border)',
                boxShadow: isActive ? `0 4px 14px ${meta.color}40` : 'none',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>
      
      <div className="search-wrapper" style={{ position: 'relative' }}>
        <Search size={16} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="input-premium search-input"
          placeholder="Buscar por nome ou código (F2)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ paddingRight: searchTerm ? '2.2rem' : '1rem' }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Limpar busca (ESC)"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
