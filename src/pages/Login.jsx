import React, { useState } from 'react';
import { db } from '../db/db';
import { Lock, User, Eye, EyeOff, Anchor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Hook SVG inline - substitui ícone de âncora pelo gancho temático
function HookIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Cabo do gancho */}
      <path d="M12 2v8" />
      {/* Curva do gancho */}
      <path d="M12 10 Q12 17 6 17 Q2 17 2 13 Q2 10 5 10" />
      {/* Ponta do gancho */}
      <path d="M5 10 L3 8" />
      {/* Guarda-mão decorativo */}
      <path d="M9 5 L15 5" />
    </svg>
  );
}

// Decoração: caveira pirata
function SkullDeco({ style }) {
  return (
    <div style={style}>
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" opacity="0.06">
        <circle cx="50" cy="42" r="30" fill="white"/>
        <ellipse cx="50" cy="68" rx="18" ry="10" fill="white"/>
        <rect x="38" y="66" width="8" height="12" rx="2" fill="currentColor"/>
        <rect x="54" y="66" width="8" height="12" rx="2" fill="currentColor"/>
        <circle cx="40" cy="40" r="7" fill="currentColor"/>
        <circle cx="60" cy="40" r="7" fill="currentColor"/>
        <path d="M46 55 Q50 52 54 55" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    </div>
  );
}

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await db.users.where({ username, password }).first();
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        navigate('/dashboard');
      } else {
        setError('Usuário ou senha inválidos. Tente novamente.');
      }
    } catch (err) {
      setError('Erro ao acessar o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, hsl(225, 55%, 6%) 0%, hsl(225, 48%, 11%) 40%, hsl(350, 35%, 15%) 100%)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Decorações piratas */}
      <SkullDeco style={{ position: 'absolute', top: '8%', left: '7%', color: 'white', pointerEvents: 'none' }} />
      <SkullDeco style={{ position: 'absolute', bottom: '5%', right: '6%', color: 'white', pointerEvents: 'none', transform: 'rotate(180deg)' }} />

      {/* Orb vermelho */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, hsla(350, 72%, 42%, 0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Orb dourado */}
      <div style={{
        position: 'absolute', bottom: '-15%', left: '-8%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, hsla(40, 80%, 48%, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Faixa diagonal pirata no topo */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '4px',
        background: 'repeating-linear-gradient(90deg, hsl(350,72%,42%) 0px, hsl(350,72%,42%) 40px, hsl(40,80%,48%) 40px, hsl(40,80%,48%) 80px)',
        pointerEvents: 'none',
      }} />

      {/* Card principal */}
      <div className="animate-fade-in" style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1.5px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        margin: '1rem',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '72px', height: '72px', borderRadius: '20px',
            background: 'linear-gradient(135deg, hsl(350, 72%, 42%) 0%, hsl(40, 80%, 40%) 100%)',
            boxShadow: '0 8px 28px hsla(350, 72%, 42%, 0.45)',
            marginBottom: '1rem', color: 'white',
          }}>
            <HookIcon size={34} />
          </div>
          <h1 style={{
            margin: 0, fontWeight: 900, fontSize: '1.9rem', color: 'white',
            letterSpacing: '-0.5px', fontFamily: "'Outfit', sans-serif",
          }}>
            Capitão Gancho
          </h1>
          <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>
            Escuna Capitão Gancho — Sistema de Caixa
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '10px', padding: '0.75rem 1rem',
            color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600,
            marginBottom: '1.25rem', display: 'flex', alignItems: 'center',
            gap: '0.5rem', textAlign: 'center', justifyContent: 'center',
          }}>
            <Lock size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Usuário */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Usuário
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }}>
                <User size={18} />
              </span>
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ex: admin" autoComplete="off" autoFocus required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.8rem 0.9rem 0.8rem 2.6rem', borderRadius: '10px',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.07)', color: 'white',
                  fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'hsl(350,72%,55%)'; e.target.style.boxShadow = '0 0 0 4px hsla(350,72%,42%,0.2)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }}>
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••" required
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.8rem 2.6rem 0.8rem 2.6rem', borderRadius: '10px',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.07)', color: 'white',
                  fontSize: '0.95rem', fontFamily: "'Outfit', sans-serif", fontWeight: 500, outline: 'none',
                  letterSpacing: showPassword ? 'normal' : '3px',
                }}
                onFocus={e => { e.target.style.borderColor = 'hsl(350,72%,55%)'; e.target.style.boxShadow = '0 0 0 4px hsla(350,72%,42%,0.2)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{
                position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.35)', display: 'flex', padding: '2px',
              }}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Botão */}
          <button type="submit" disabled={loading}
            style={{
              marginTop: '0.5rem', padding: '0.9rem', borderRadius: '12px', border: 'none',
              background: loading
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, hsl(350,72%,42%) 0%, hsl(40,80%,42%) 100%)',
              color: 'white', fontWeight: 800, fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.3px',
              boxShadow: loading ? 'none' : '0 6px 22px hsla(350,72%,42%,0.4)',
              fontFamily: "'Outfit', sans-serif", transition: 'all 0.25s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? 'Verificando...' : '⚓ Embarcar no Sistema'}
          </button>
        </form>

        {/* Credenciais */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.6rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
            Credenciais de Acesso
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            {[['admin', '123'], ['caixa', '123']].map(([u, p]) => (
              <button key={u} type="button" onClick={() => { setUsername(u); setPassword(p); }}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '0.35rem 0.8rem',
                  color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem',
                  fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
              >
                {u} / {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
