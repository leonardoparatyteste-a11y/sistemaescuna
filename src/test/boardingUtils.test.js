import { describe, it, expect } from 'vitest';
import { validateTicketForBoarding } from '../utils/boardingUtils';

describe('boardingUtils - validateTicketForBoarding', () => {
  it('deve autorizar bilhete pago e pendente de embarque', () => {
    const ticket = { id: 1, status: 'paid', boardingStatus: 'pending' };
    const res = validateTicketForBoarding(ticket);
    expect(res.valid).toBe(true);
    expect(res.code).toBe('AUTHORIZED');
  });

  it('deve rejeitar bilhete já utilizado', () => {
    const ticket = { id: 2, status: 'paid', boardingStatus: 'boarded', boardedAt: new Date().toISOString() };
    const res = validateTicketForBoarding(ticket);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('ALREADY_BOARDED');
  });

  it('deve rejeitar bilhete não pago', () => {
    const ticket = { id: 3, status: 'pending', boardingStatus: 'pending' };
    const res = validateTicketForBoarding(ticket);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('UNPAID');
  });

  it('deve tratar bilhete inexistente', () => {
    const res = validateTicketForBoarding(null);
    expect(res.valid).toBe(false);
    expect(res.code).toBe('NOT_FOUND');
  });
});
