import React from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { DollarSign, Ticket, Users, Coffee, Info, Printer, TrendingUp, AlertTriangle } from 'lucide-react';

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--panel-bg)', border: '1.5px solid var(--border)',
      borderRadius: '16px', padding: '1.25rem 1.5rem',
      boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: '0.75rem',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px -4px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
    >
      {/* Accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
          {label}
        </span>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { size: 18, style: { color } })}
        </div>
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 900, fontSize: '1.9rem', color: 'var(--text-main)', letterSpacing: '-1px', lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];
  const orders = useLiveQuery(() => db.orders.toArray(), []) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  // Real calculations
  const totalPassengers = tickets.reduce((acc, t) => {
    const fields = ['inteiro', 'meia', 'free', 'cortesia'];
    return acc + fields.reduce((s, f) => s + (parseInt(t[f]) || 0), 0);
  }, tickets.length > 0 ? 0 : tickets.length);

  const ticketRevenue = tickets
    .filter(t => t.status === 'paid')
    .reduce((acc, t) => acc + (t.price || 0), 0);

  const closedOrdersRevenue = orders
    .filter(o => o.status === 'closed')
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const totalCaixa = ticketRevenue + closedOrdersRevenue;

  const openOrders = orders.filter(o => o.status === 'open');

  const lowStockItems = products.filter(p => p.stock <= 10);

  const fmtCurrency = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Quick Action Shortcuts Banner */}
      <div className="glass-panel" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: 'var(--text-main)' }}>
            ⚓ Bem-vindo ao Capitão Gancho POS
          </h2>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Acesso rápido às principais operações do sistema
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn-premium btn-primary-gradient" onClick={() => window.location.hash = '#/dashboard/pdv'}>
            <Coffee size={16} /> Abrir PDV / Bar
          </button>
          <button className="btn-premium btn-success-gradient" onClick={() => window.location.hash = '#/dashboard/orders'}>
            <TrendingUp size={16} /> Ver Comandas
          </button>
          <button className="btn-premium" onClick={() => window.location.hash = '#/dashboard/reports'}
            style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)' }}>
            <DollarSign size={16} style={{ color: 'var(--success)' }} /> Fechamento de Caixa
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          icon={<DollarSign />}
          label="Caixa Atual"
          value={fmtCurrency(totalCaixa)}
          color="hsl(150, 84%, 37%)"
          sub={`${tickets.filter(t => t.status === 'paid').length} passagens + ${orders.filter(o => o.status === 'closed').length} comandas fechadas`}
        />
        <StatCard
          icon={<Ticket />}
          label="Bilhetes Emitidos"
          value={tickets.length}
          color="hsl(208, 95%, 54%)"
          sub={`${tickets.filter(t => t.status === 'paid').length} pagos · ${tickets.filter(t => t.status !== 'paid').length} pendentes`}
        />
        <StatCard
          icon={<Users />}
          label="Pax a Bordo"
          value={tickets.length}
          color="hsl(258, 80%, 60%)"
          sub="Total de passageiros embarcados"
        />
        <StatCard
          icon={<Coffee />}
          label="Comandas Ativas"
          value={openOrders.length}
          color="hsl(36, 100%, 48%)"
          sub={`${orders.filter(o => o.status === 'closed').length} fechadas hoje`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Últimas Comandas
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{orders.length} total</span>
          </div>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Nenhuma comanda registrada ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...orders].reverse().slice(0, 6).map(o => (
                <div key={o.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem', borderRadius: '10px',
                  background: 'var(--bg-color)', border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: o.status === 'open' ? 'var(--success)' : 'var(--text-light)',
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{o.orderNumber}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {fmtCurrency(o.total || 0)}
                    </span>
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700,
                      background: o.status === 'open' ? 'var(--success-light)' : 'var(--border)',
                      color: o.status === 'open' ? 'var(--success)' : 'var(--text-muted)',
                    }}>
                      {o.status === 'open' ? 'Aberta' : 'Fechada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Low stock alert */}
          {lowStockItems.length > 0 && (
            <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    Estoque Baixo Detectado
                  </p>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {lowStockItems.length} item(s) com estoque ≤ 10 unidades.
                  </p>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600 }}>
                    {lowStockItems.map(p => p.name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Info size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Sincronização em Nuvem
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Todos os dados estão salvos localmente com segurança.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ margin: 0, borderLeft: '4px solid var(--secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <Printer size={20} style={{ color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Impressora Térmica
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Pressione <kbd style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.78rem' }}>Ctrl+P</kbd> para imprimir. Garanta que o papel térmico está carregado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
