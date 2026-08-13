import { describe, it, expect } from 'vitest';
import { getPeriodRange } from '../utils/exportUtils';

describe('exportUtils - getPeriodRange', () => {
  it('deve retornar intervalo para hoje com inicio 00:00 e fim 23:59', () => {
    const { start, end } = getPeriodRange('today');
    const now = new Date();

    expect(start.getDate()).toBe(now.getDate());
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    expect(end.getDate()).toBe(now.getDate());
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it('deve calcular intervalo personalizado corretamente', () => {
    const { start, end } = getPeriodRange('custom', '2026-08-01', '2026-08-10');

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(7); // Agosto (0-indexed)
    expect(start.getDate()).toBe(1);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(7);
    expect(end.getDate()).toBe(10);
    expect(end.getHours()).toBe(23);
  });
});
