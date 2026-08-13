import { describe, it, expect } from 'vitest';
import { calculateCashDrawerBalance } from '../utils/cashMovementUtils';

describe('cashMovementUtils - calculateCashDrawerBalance', () => {
  it('deve calcular corretamente o saldo esperado de dinheiro na gaveta', () => {
    const cashMovements = [
      { type: 'opening', amount: 200 },
      { type: 'suprimento', amount: 50 },
      { type: 'sangria', amount: 100 }
    ];

    const orders = [
      { status: 'closed', total: 120, paymentMethod: 'Dinheiro' },
      { status: 'closed', total: 80, paymentMethod: 'Cartão de Crédito' }
    ];

    const tickets = [
      { status: 'paid', price: 50, paymentMethod: 'Dinheiro' }
    ];

    const result = calculateCashDrawerBalance(cashMovements, orders, tickets);

    expect(result.opening).toBe(200);
    expect(result.suprimentos).toBe(50);
    expect(result.sangrias).toBe(100);
    expect(result.cashSales).toBe(170); // 120 + 50
    expect(result.expectedCash).toBe(320); // (200 + 50 + 170) - 100 = 320
  });

  it('deve retornar zeros para arrays vazios', () => {
    const result = calculateCashDrawerBalance([], [], []);
    expect(result.expectedCash).toBe(0);
    expect(result.cashSales).toBe(0);
  });
});
