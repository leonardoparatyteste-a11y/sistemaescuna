/**
 * Utilitários para apuração de Caixa em Dinheiro, Sangrias e Suprimentos
 */

/**
 * Calcula o saldo esperado de dinheiro em espécie na gaveta do caixa.
 * Saldo = (Abertura + Suprimentos + Vendas em Dinheiro) - Sangrias
 * 
 * @param {Array<Object>} cashMovements - Lista de movimentações da tabela cash_movements
 * @param {Array<Object>} orders - Lista de comandas fechadas
 * @param {Array<Object>} tickets - Lista de bilhetes pagos
 * @returns {{ opening: number, suprimentos: number, sangrias: number, cashSales: number, expectedCash: number }}
 */
export function calculateCashDrawerBalance(cashMovements = [], orders = [], tickets = []) {
  let opening = 0;
  let suprimentos = 0;
  let sangrias = 0;

  cashMovements.forEach(m => {
    const val = Number(m.amount) || 0;
    if (m.type === 'opening') opening += val;
    else if (m.type === 'suprimento') suprimentos += val;
    else if (m.type === 'sangria') sangrias += val;
  });

  // Somar vendas em dinheiro nas comandas fechadas
  const orderCashSales = orders
    .filter(o => o.status === 'closed' && (o.paymentMethod === 'Dinheiro' || o.paymentMethod === 'dinheiro'))
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  // Somar vendas em dinheiro nos bilhetes pagos
  const ticketCashSales = tickets
    .filter(t => t.status === 'paid' && (t.paymentMethod === 'Dinheiro' || t.paymentMethod === 'dinheiro'))
    .reduce((acc, t) => acc + (Number(t.price) || 0), 0);

  const cashSales = orderCashSales + ticketCashSales;
  const expectedCash = (opening + suprimentos + cashSales) - sangrias;

  return {
    opening,
    suprimentos,
    sangrias,
    cashSales,
    expectedCash: Math.max(0, expectedCash)
  };
}
