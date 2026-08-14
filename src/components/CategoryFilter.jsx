import React, { memo } from 'react';
import { Search } from 'lucide-react';
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
                backgroundColor: isActive ? meta.color : meta.bg,
                color: isActive ? 'white' : meta.color,
                boxShadow: isActive ? `0 4px 12px ${meta.color}30` : 'none',
              }}
            >
              {meta.emoji} {meta.label}
            </button>
          );
        })}
      </div>
      
      <div className="search-wrapper">
        <Search size={15} className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="input-premium search-input"
          placeholder="Buscar produto (F2)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
});

CategoryFilter.displayName = 'CategoryFilter';
