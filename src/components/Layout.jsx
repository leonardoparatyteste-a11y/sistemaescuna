import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Ticket, Coffee, FileSpreadsheet,
  PackageSearch, LayoutDashboard, LogOut,
  Sun, Moon, Wifi, Anchor, Sword, BarChart3, QrCode
} from 'lucide-react';

// Inline hook icon para o logo da sidebar
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
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
      {time.toLocaleTimeString('pt-BR')} · {time.toLocaleDateString('pt-BR')}
    </span>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-theme'));

  const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
    setIsDark(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard',           icon: <LayoutDashboard size={19} />, label: 'Visão Geral',  end: true },
    { to: '/dashboard/tickets',   icon: <Ticket size={19} />,          label: 'Bilheteria' },
    { to: '/dashboard/checkin',   icon: <QrCode size={19} />,          label: 'Check-in Embarque' },
    { to: '/dashboard/pdv',       icon: <Coffee size={19} />,          label: 'PDV / Bar' },
    { to: '/dashboard/orders',    icon: <FileSpreadsheet size={19} />, label: 'Comandas' },
    { to: '/dashboard/reports',   icon: <BarChart3 size={19} />,       label: 'Relatórios & Caixa' },
    ...(user.role === 'admin'
      ? [{ to: '/dashboard/inventory', icon: <PackageSearch size={19} />, label: 'Estoque' }]
      : []),
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar-neo no-print">
        {/* Logo */}
        <header>
          <div style={{
            background: 'linear-gradient(135deg, hsl(350,72%,38%) 0%, hsl(28,85%,36%) 100%)',
            padding: '0.55rem', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 4px 16px hsla(350,72%,40%,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
            <HookIcon size={22} />
          </div>
          <div>
            <h2 style={{
              margin: 0, fontWeight: 800, fontSize: '0.9rem',
              fontFamily: "'Cinzel', serif",
              color: 'hsl(43,90%,75%)', letterSpacing: '0.8px',
              textShadow: '0 1px 8px rgba(200,130,40,0.4)',
            }}>
              Capitão Gancho
            </h2>
            <p style={{ margin: 0, fontSize: '0.62rem', color: 'hsl(35,20%,55%)', letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8 }}>
              ⚓ Escuna Oficial
            </p>
          </div>
        </header>

        {/* Nav */}
        <nav>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="footer">
          {/* Divider */}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, hsl(35,20%,30%), transparent)', margin: '0.5rem 0' }} />
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
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'hsl(43,90%,75%)', textTransform: 'capitalize' }}>
                {user.username}
              </p>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'hsl(35,15%,55%)', textTransform: 'capitalize' }}>
                {user.role === 'admin' ? '⚓ Capitão' : '🏴‍☠️ Tripulação'}
              </p>
            </div>
          </div>
          <button onClick={handleLogout} title="Sair do sistema"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--sidebar-text)', padding: '0.4rem',
              borderRadius: '6px', display: 'flex', transition: 'all 0.2s',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <LiveClock />
            <button onClick={toggleTheme} className="theme-toggle-btn" title={isDark ? 'Modo Claro' : 'Modo Escuro'}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
