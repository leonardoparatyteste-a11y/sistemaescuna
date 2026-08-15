import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { calculateCashDrawerBalance } from '../utils/cashMovementUtils';
import {
  Ticket, Coffee, FileSpreadsheet,
  PackageSearch, LayoutDashboard, LogOut,
  Sun, Moon, Wifi, DollarSign, BarChart3, QrCode,
  ChevronLeft, ChevronRight
} from 'lucide-react';

function HookIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8" />
      <path d="M12 10 Q12 17 6 17 Q2 17 2 13 Q2 10 5 10" />
      <path d="M5 10 L3 8" />
      <path d="M9 5 L15 5" />
    </svg>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
      {time.toLocaleTimeString('pt-BR')} · {time.toLocaleDateString('pt-BR')}
    </span>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-theme'));
  const [collapsed, setCollapsed] = useState(false);

  // Live queries para dados globais
  const cashMovements = useLiveQuery(() => db.cash_movements.toArray(), []) || [];
  const allOrders     = useLiveQuery(() => db.orders.toArray(), []) || [];
  const allTickets    = useLiveQuery(() => db.tickets.toArray(), []) || [];

  const openOrdersCount = useMemo(() => allOrders.filter(o => o.status === 'open').length, [allOrders]);
  const { expectedCash } = useMemo(() => calculateCashDrawerBalance(cashMovements, allOrders, allTickets), [cashMovements, allOrders, allTickets]);

  // Fechar sidebar ao navegar em telas pequenas (opcional)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1100px)');
    if (mq.matches) setCollapsed(true);
  }, []);

  // Atalho Ctrl+B para toggle sidebar
  useEffect(() => {
    const handler = (e) => { if (e.ctrlKey && e.key === 'b') { e.preventDefault(); setCollapsed(p => !p); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => { document.body.classList.toggle('dark-theme'); setIsDark(p => !p); };
  const handleLogout = () => { localStorage.removeItem('currentUser'); navigate('/'); };

  const navItems = [
    { to: '/dashboard',              icon: <LayoutDashboard size={20} />, label: 'Visão Geral',  end: true },
    { to: '/dashboard/tickets',      icon: <Ticket size={20} />,          label: 'Bilheteria' },
    { to: '/dashboard/checkin',      icon: <QrCode size={20} />,          label: 'Check-in' },
    { to: '/dashboard/pdv',          icon: <Coffee size={20} />,          label: 'PDV / Bar' },
    { to: '/dashboard/orders',       icon: <FileSpreadsheet size={20} />, label: 'Comandas',  badge: openOrdersCount },
    { to: '/dashboard/reports',      icon: <BarChart3 size={20} />,       label: 'Relatórios & Caixa' },
    ...(user.role === 'admin' ? [{ to: '/dashboard/inventory', icon: <PackageSearch size={20} />, label: 'Estoque' }] : []),
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside
        className="sidebar-neo no-print"
        style={{
          width: collapsed ? '72px' : '260px',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <header style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '1.5rem 0' : '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, hsl(350,72%,38%) 0%, hsl(28,85%,36%) 100%)',
            padding: '0.55rem', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 4px 16px hsla(350,72%,40%,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
            <HookIcon size={22} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{
                margin: 0, fontWeight: 800, fontSize: '0.9rem',
                fontFamily: "'Cinzel', serif",
                color: 'hsl(43,90%,75%)', letterSpacing: '0.8px',
                textShadow: '0 1px 8px rgba(200,130,40,0.4)',
                whiteSpace: 'nowrap',
              }}>
                Capitão Gancho
              </h2>
              <p style={{ margin: 0, fontSize: '0.62rem', color: 'hsl(35,20%,55%)', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8, whiteSpace: 'nowrap' }}>
                ⚓ Escuna Oficial
              </p>
            </div>
          )}
        </header>

        {/* Toggle Button */}
        <div style={{ padding: '0 0.5rem 0.5rem', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
          <button
            onClick={() => setCollapsed(p => !p)}
            title={collapsed ? 'Expandir sidebar (Ctrl+B)' : 'Recolher sidebar (Ctrl+B)'}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '0.3rem 0.45rem', cursor: 'pointer',
              color: 'hsl(35,15%,60%)', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'hsl(43,90%,65%)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'hsl(35,15%,60%)'; }}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Nav */}
        <nav>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.75rem' : '0.75rem 1rem' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
              {!collapsed && Boolean(item.badge) && item.badge > 0 && (
                <span style={{
                  background: 'var(--primary)', color: 'white',
                  borderRadius: '99px', padding: '0.15rem 0.5rem',
                  fontSize: '0.7rem', fontWeight: 900,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  {item.badge}
                </span>
              )}
              {collapsed && Boolean(item.badge) && item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '4px', right: '4px',
                  background: 'var(--primary)', color: 'white',
                  borderRadius: '99px', width: '16px', height: '16px',
                  fontSize: '0.6rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="footer">
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, hsl(35,20%,30%), transparent)', margin: '0.5rem 0' }} />
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(350,72%,38%) 0%, hsl(28,85%,36%) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.9rem', color: 'hsl(43,90%,80%)', flexShrink: 0,
                boxShadow: '0 2px 8px hsla(350,72%,40%,0.4)',
                fontFamily: "'Cinzel', serif",
              }}>
                {user.username?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'hsl(43,90%,75%)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {user.username}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', color: 'hsl(35,15%,55%)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                  {user.role === 'admin' ? '⚓ Capitão' : '🏴‍☠️ Tripulação'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div title={user.username} style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(350,72%,38%) 0%, hsl(28,85%,36%) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.9rem', color: 'hsl(43,90%,80%)',
                fontFamily: "'Cinzel', serif",
              }}>
                {user.username?.charAt(0).toUpperCase() || 'C'}
              </div>
            </div>
          )}
          <button onClick={handleLogout} title="Sair do sistema"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--sidebar-text)', padding: '0.4rem',
              borderRadius: '6px', display: 'flex', transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text)'}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <header className="main-header no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{
              margin: 0, fontWeight: 700, fontSize: '1rem',
              color: 'var(--text-main)',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.8px',
            }}>
              ⚓ CAPITÃO GANCHO
            </h1>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              background: 'var(--success-light)', color: 'var(--success)',
              padding: '0.2rem 0.6rem', borderRadius: '99px',
              fontSize: '0.7rem', fontWeight: 700,
            }}>
              <Wifi size={12} /> Online
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Global Cash Drawer Chip */}
            <div
              onClick={() => navigate('/dashboard/reports')}
              title="Clique para acessar o Fechamento de Caixa"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--panel-bg)', border: '1.5px solid var(--border)',
                padding: '0.3rem 0.75rem', borderRadius: '99px',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <DollarSign size={14} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Gaveta:</span>
              <strong style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {expectedCash.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </strong>
            </div>

            <LiveClock />
            <button onClick={toggleTheme} className="theme-toggle-btn" title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="content-area" key={location.pathname} style={{ animation: 'fadeSlideIn 0.25s ease forwards' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

