import React, { useState, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart3, Calendar, Download, Printer, DollarSign,
  Ticket, Coffee, ShoppingBag, ShieldCheck, Users, TrendingUp,
  FileSpreadsheet, Award, Percent, ArrowUpRight, ArrowDownLeft, Lock, CheckCircle
} from 'lucide-react';
import { exportToCSV, getPeriodRange } from '../utils/exportUtils';
import { calculateCashDrawerBalance } from '../utils/cashMovementUtils';

export function Reports() {
  const [period, setPeriod] = useState('today'); // 'today' | '7days' | 'month' | 'custom'
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [endDateStr, setEndDateStr] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState('cashier'); // 'cashier' | 'products' | 'agencies' | 'movements'

  // Carrega dados do IndexedDB em tempo real
  const orders = useLiveQuery(() => db.orders.toArray(), []) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray(), []) || [];
  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const cashMovements = useLiveQuery(() => db.cash_movements.toArray(), []) || [];

  // Intervalo de datas calculado
  const { start: startDate, end: endDate } = useMemo(() => {
    return getPeriodRange(period, startDateStr, endDateStr);
  }, [period, startDateStr, endDateStr]);

  // Filtra comandas e bilhetes pelo período
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o.date) return false;
      const d = new Date(o.date);
      return d >= startDate && d <= endDate;
    });
  }, [orders, startDate, endDate]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    });
  }, [tickets, startDate, endDate]);

  const closedOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'closed');
  }, [filteredOrders]);

  const paidTickets = useMemo(() => {
    return filteredTickets.filter(t => t.status === 'paid');
  }, [filteredTickets]);

  // Métricas do Fechamento de Caixa
  const barRevenue = closedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const ticketRevenue = paidTickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const totalRevenue = barRevenue + ticketRevenue;

  // Cálculo de Taxa de Serviço e Couvert Artístico arrecadados
  const totalServiceTax = closedOrders.reduce((sum, o) => {
    if (!o.hasTax) return sum;
    // Subtotal = total antes dos 10%
    const subtotal = (o.total || 0) / 1.10;
    return sum + ((o.total || 0) - subtotal);
  }, 0);

  const totalCouvert = closedOrders.reduce((sum, o) => {
    if (!o.hasCouvert) return sum;
    return sum + (o.couvertValue || 12.00);
  }, 0);

  // Formas de Pagamento (Estimado/Agrupado)
  const paymentBreakdown = useMemo(() => {
    const acc = {
      'PIX': 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0,
      'Dinheiro': 0,
      'Cortesia': 0
    };

    // Soma das comandas fechadas
    closedOrders.forEach(o => {
      const method = o.paymentMethod || 'Cartão de Crédito';
      acc[method] = (acc[method] || 0) + (o.total || 0);
    });

    // Soma dos bilhetes pagos
    paidTickets.forEach(t => {
      const method = t.paymentMethod || (t.passengerType === 'cortesia' ? 'Cortesia' : 'PIX');
      acc[method] = (acc[method] || 0) + (t.price || 0);
    });

    return acc;
  }, [closedOrders, paidTickets]);

  // Vendas por Produto e Categoria
  const productStats = useMemo(() => {
    const map = {};

    const closedOrderIds = new Set(closedOrders.map(o => o.id));
    const itemsInPeriod = orderItems.filter(item => closedOrderIds.has(item.orderId));

    itemsInPeriod.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      const name = p ? p.name : `Produto #${item.productId}`;
      const category = p ? p.category : 'Outros';

      if (!map[item.productId]) {
        map[item.productId] = {
          id: item.productId,
          name,
          category,
          quantity: 0,
          revenue: 0
        };
      }
      map[item.productId].quantity += item.quantity || 0;
      map[item.productId].revenue += (item.price || 0) * (item.quantity || 0);
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [closedOrders, orderItems, products]);

  const categoryStats = useMemo(() => {
    const map = {};
    productStats.forEach(p => {
      if (!map[p.category]) {
        map[p.category] = { category: p.category, quantity: 0, revenue: 0 };
      }
      map[p.category].quantity += p.quantity;
      map[p.category].revenue += p.revenue;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [productStats]);

  // Relatório por Agência de Passeio
  const agencyStats = useMemo(() => {
    const map = {};
    filteredTickets.forEach(t => {
      const agencyName = t.agency || 'Venda Balcão / Direta';
      if (!map[agencyName]) {
        map[agencyName] = {
          agency: agencyName,
          totalTickets: 0,
          paidCount: 0,
          revenue: 0,
          inteira: 0,
          meia: 0,
          cortesia: 0
        };
      }
      map[agencyName].totalTickets += 1;
      if (t.status === 'paid') {
        map[agencyName].paidCount += 1;
        map[agencyName].revenue += t.price || 0;
      }
      if (t.passengerType === 'inteiro' || t.inteiro > 0) map[agencyName].inteira += 1;
      else if (t.passengerType === 'meia' || t.meia > 0) map[agencyName].meia += 1;
      else map[agencyName].cortesia += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredTickets]);

  const fmtCurrency = val => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Ações de Exportação
  const handleExportCashierCSV = () => {
    const data = [
      { Métrica: 'Receita Total do Caixa', Valor: fmtCurrency(totalRevenue) },
      { Métrica: 'Faturamento Bilheteria (Passagens)', Valor: fmtCurrency(ticketRevenue) },
      { Métrica: 'Faturamento Bar & Restaurante (Comandas)', Valor: fmtCurrency(barRevenue) },
      { Métrica: 'Taxa de Serviço Arrecadada (10%)', Valor: fmtCurrency(totalServiceTax) },
      { Métrica: 'Couvert Artístico Arrecadado', Valor: fmtCurrency(totalCouvert) },
      { Métrica: 'Total de Comandas Fechadas', Valor: closedOrders.length },
      { Métrica: 'Total de Bilhetes Emitidos/Pagos', Valor: paidTickets.length },
      ...Object.entries(paymentBreakdown).map(([method, val]) => ({
        Métrica: `Pagamento via ${method}`,
        Valor: fmtCurrency(val)
      }))
    ];
    exportToCSV(data, `fechamento_caixa_${period}.csv`);
  };

  const handleExportProductsCSV = () => {
    const data = productStats.map(p => ({
      Produto: p.name,
      Categoria: p.category.toUpperCase(),
      QtdVendida: p.quantity,
      FaturamentoTotal: fmtCurrency(p.revenue)
    }));
    exportToCSV(data, `vendas_produtos_${period}.csv`);
  };

  const handleExportAgenciesCSV = () => {
    const data = agencyStats.map(a => ({
      Agencia: a.agency,
      TotalBilhetes: a.totalTickets,
      BilhetesPagos: a.paidCount,
      Inteiras: a.inteira,
      Meias: a.meia,
      Cortesia: a.cortesia,
      ReceitaTotal: fmtCurrency(a.revenue)
    }));
    exportToCSV(data, `relatorio_agencies_${period}.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Visualização de Impressão Térmica / Cupom de Fechamento Z */}
      <div className="print-only print-cashier-ticket" style={{ display: 'none' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'serif' }}>CAPITÃO GANCHO ESCUNAS</h2>
          <p style={{ margin: '2px 0', fontSize: '0.85rem' }}>FECHAMENTO DE CAIXA (RELATÓRIO Z)</p>
          <p style={{ margin: 0, fontSize: '0.75rem' }}>
            Período: {startDate.toLocaleDateString('pt-BR')} até {endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>RECEITA TOTAL:</span>
            <span>{fmtCurrency(totalRevenue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bilheteria / Passeios:</span>
            <span>{fmtCurrency(ticketRevenue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bar / Comandas:</span>
            <span>{fmtCurrency(barRevenue)}</span>
          </div>
          <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Taxa Serviço (10%):</span>
            <span>{fmtCurrency(totalServiceTax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Couvert Artístico:</span>
            <span>{fmtCurrency(totalCouvert)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000', marginTop: '10px', paddingTop: '6px', fontSize: '0.8rem' }}>
          <p style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>Formas de Pagamento:</p>
          {Object.entries(paymentBreakdown).map(([method, val]) => (
            <div key={method} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{method}:</span>
              <span>{fmtCurrency(val)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '8px', textAlign: 'center', fontSize: '0.75rem' }}>
          <p style={{ margin: 0 }}>Operador: {JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'Caixa'}</p>
          <p style={{ margin: '2px 0 0' }}>Impresso em: {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Header e Filtros (no-print) */}
      <div className="no-print glass-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={24} style={{ color: 'var(--primary)' }} /> Relatórios & Fechamento de Caixa
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Acompanhe o faturamento, fechamento de caixa Z/X, vendas por produto e comissões de agências.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button onClick={handleExportCashierCSV} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={16} /> Exportar Caixa (CSV)
            </button>
          </div>
        </div>

        {/* Filtro de Período */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={16} /> Período:
            </span>
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: 'Últimos 7 dias' },
              { id: 'month', label: 'Este Mês' },
              { id: 'custom', label: 'Personalizado' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                  border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                  background: period === p.id ? 'var(--primary)' : 'var(--panel-bg)',
                  borderColor: period === p.id ? 'var(--primary)' : 'var(--border)',
                  color: period === p.id ? 'white' : 'var(--text-main)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="date"
                value={startDateStr}
                onChange={e => setStartDateStr(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>até</span>
              <input
                type="date"
                value={endDateStr}
                onChange={e => setEndDateStr(e.target.value)}
                style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text-main)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navegação entre Abas (no-print) */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border)', flexWrap: 'wrap' }}>
        {[
          { id: 'cashier', label: 'Fechamento de Caixa (Z/X)', icon: <DollarSign size={18} /> },
          { id: 'movements', label: 'Sangrias & Movimentações', icon: <ArrowUpRight size={18} /> },
          { id: 'products', label: 'Vendas por Produto / Categoria', icon: <ShoppingBag size={18} /> },
          { id: 'agencies', label: 'Bilheteria & Agências', icon: <Ticket size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              marginBottom: '-2px', transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DA ABA 1: FECHAMENTO DE CAIXA (Z/X) */}
      {activeTab === 'cashier' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Cards de Métricas Principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Faturamento Total</span>
                <DollarSign size={20} style={{ color: 'var(--success)' }} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-main)' }}>{fmtCurrency(totalRevenue)}</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Caixa Bruto do Período</span>
            </div>

            <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid hsl(208, 95%, 54%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bilheteria / Passagens</span>
                <Ticket size={20} style={{ color: 'hsl(208, 95%, 54%)' }} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-main)' }}>{fmtCurrency(ticketRevenue)}</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{paidTickets.length} bilhetes pagos</span>
            </div>

            <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid hsl(36, 100%, 48%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bar & Comandas</span>
                <Coffee size={20} style={{ color: 'hsl(36, 100%, 48%)' }} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-main)' }}>{fmtCurrency(barRevenue)}</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{closedOrders.length} comandas fechadas</span>
            </div>

            <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid hsl(258, 80%, 60%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taxa 10% + Couvert</span>
                <Percent size={20} style={{ color: 'hsl(258, 80%, 60%)' }} />
              </div>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: 'var(--text-main)' }}>{fmtCurrency(totalServiceTax + totalCouvert)}</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmtCurrency(totalServiceTax)} Taxa | {fmtCurrency(totalCouvert)} Couvert</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            
            {/* Detalhamento de Forma de Pagamento */}
            <div className="glass-panel" style={{ margin: 0 }}>
              <h2 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} /> Formas de Pagamento Recebidas
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(paymentBreakdown).map(([method, amount]) => {
                  const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                  return (
                    <div key={method} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{method}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{fmtCurrency(amount)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--primary)', borderRadius: '99px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumo de Fechamento de Caixa */}
            <div className="glass-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet size={18} style={{ color: 'var(--primary)' }} /> Resumo do Caixa Z / X
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Data da Emissão:</span>
                    <span style={{ fontWeight: 700 }}>{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status das Comandas:</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{closedOrders.length} fechadas / {filteredOrders.filter(o => o.status === 'open').length} abertas</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ticket Médio por Comanda:</span>
                    <span style={{ fontWeight: 700 }}>{fmtCurrency(closedOrders.length > 0 ? barRevenue / closedOrders.length : 0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Ticket Médio por Passeio:</span>
                    <span style={{ fontWeight: 700 }}>{fmtCurrency(paidTickets.length > 0 ? ticketRevenue / paidTickets.length : 0)}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Printer size={18} /> Imprimir Comprovante Z
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA MOVIMENTAÇÕES DE GAVETA & SANGRIA */}
      {activeTab === 'movements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Histórico de Sangrias, Suprimentos e Aberturas
            </h2>
            <button
              onClick={() => {
                const data = cashMovements.map(m => ({
                  DataHora: new Date(m.date).toLocaleString('pt-BR'),
                  Tipo: m.type === 'sangria' ? 'Sangria (Retirada)' : m.type === 'suprimento' ? 'Suprimento (Troco)' : m.type === 'opening' ? 'Abertura' : 'Conferência',
                  Valor: fmtCurrency(m.amount),
                  Operador: m.user,
                  Descricao: m.description
                }));
                exportToCSV(data, 'movimentacoes_caixa.csv');
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={16} /> Exportar Lançamentos (CSV)
            </button>
          </div>

          <div className="glass-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>DATA / HORA</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>TIPO</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>MOTIVO / DESCRIÇÃO</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>OPERADOR</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {cashMovements.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma movimentação de caixa registrada ainda.
                    </td>
                  </tr>
                ) : (
                  [...cashMovements].reverse().map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        {new Date(m.date).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800,
                          background: m.type === 'sangria' ? 'rgba(239, 68, 68, 0.15)' : m.type === 'suprimento' ? 'var(--success-light)' : m.type === 'opening' ? 'rgba(59, 130, 246, 0.15)' : 'var(--border)',
                          color: m.type === 'sangria' ? '#ef4444' : m.type === 'suprimento' ? 'var(--success)' : m.type === 'opening' ? '#3b82f6' : 'var(--text-muted)',
                        }}>
                          {m.type === 'sangria' ? 'SANGRIA' : m.type === 'suprimento' ? 'SUPRIMENTO' : m.type === 'opening' ? 'ABERTURA' : 'CONFERÊNCIA'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>
                        {m.description}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize' }}>
                        {m.user}
                      </td>
                      <td style={{
                        padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 900,
                        color: m.type === 'sangria' ? '#ef4444' : 'var(--text-main)'
                      }}>
                        {m.type === 'sangria' ? '-' : '+'}{fmtCurrency(m.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: PRODUTOS E CATEGORIAS */}
      {activeTab === 'products' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Ranking de Vendas por Produto
            </h2>
            <button onClick={handleExportProductsCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={16} /> Exportar Produtos (CSV)
            </button>
          </div>

          {/* Vendas por Categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {categoryStats.map(cat => (
              <div key={cat.category} className="glass-panel" style={{ margin: 0, padding: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {cat.category}
                </span>
                <p style={{ margin: '0.4rem 0 0.2rem 0', fontWeight: 900, fontSize: '1.3rem', color: 'var(--text-main)' }}>
                  {fmtCurrency(cat.revenue)}
                </p>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {cat.quantity} unidades vendidas
                </span>
              </div>
            ))}
          </div>

          {/* Tabela de Produtos */}
          <div className="glass-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>PRODUTO</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>CATEGORIA</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>QTD VENDIDA</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>FATURAMENTO TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {productStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma venda registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  productStats.map((p, idx) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {idx < 3 && <Award size={16} style={{ color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309' }} />}
                        {p.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                        {p.category}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                        {p.quantity}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                        {fmtCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: AGÊNCIAS E BILHETERIA */}
      {activeTab === 'agencies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
              Relatório de Agências e Venda de Passagens
            </h2>
            <button onClick={handleExportAgenciesCSV} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Download size={16} /> Exportar Agências (CSV)
            </button>
          </div>

          <div className="glass-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>AGÊNCIA / PARCEIRO</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>TOTAL BILHETES</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>INTEIRAS</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>MEIAS</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>CORTESIA</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>RECEITA ARRECADADA</th>
                </tr>
              </thead>
              <tbody>
                {agencyStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum bilhete registrado no período selecionado.
                    </td>
                  </tr>
                ) : (
                  agencyStats.map(a => (
                    <tr key={a.agency} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {a.agency}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800 }}>
                        {a.totalTickets}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{a.inteira}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{a.meia}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>{a.cortesia}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                        {fmtCurrency(a.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
