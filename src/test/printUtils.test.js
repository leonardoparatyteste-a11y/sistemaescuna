import { describe, it, expect } from 'vitest';
import { groupItemsBySector } from '../utils/printUtils';

describe('printUtils - groupItemsBySector', () => {
  it('deve separar corretamente os itens entre Cozinha e Bar', () => {
    const products = [
      { id: 1, name: 'AGUA', category: 'bebidas' },
      { id: 2, name: 'BATATA FRITA', category: 'porcoes' },
      { id: 3, name: 'SALADA', category: 'pratos' },
      { id: 4, name: 'DOCE', category: 'sobremesas' }
    ];

    const items = [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 1 },
      { productId: 4, quantity: 3 }
    ];

    const { kitchen, bar } = groupItemsBySector(items, products);

    expect(bar.length).toBe(1);
    expect(bar[0].productName).toBe('AGUA');

    expect(kitchen.length).toBe(3);
    const names = kitchen.map(i => i.productName);
    expect(names).toContain('BATATA FRITA');
    expect(names).toContain('SALADA');
    expect(names).toContain('DOCE');
  });
});
