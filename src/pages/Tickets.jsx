import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../db/db';
import { Save, Ticket, Trash2, Plus, Minus, CreditCard, Users, Building2, CheckCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

const VALOR_INTEIRA = 100;
const VALOR_MEIA = 50;

const EMPTY_FORM = {
  nome: '',
  comanda: '',
  agente: 'AGÊNCIA CAPITÃO GANCHO',
  incompleto: false,
  passagemPagaNaEntrada: true,
  inteiro: 0,
  meia: 0,
  free: 0,
  cortesia: 0,
  credito: '',
};

function PassengerBox({ label, fieldName, value, onChange, color = 'var(--text-main)', accentColor }) {
  const increment = () => onChange(fieldName, Math.max(0, value + 1));
  const decrement = () => onChange(fieldName, Math.max(0, value - 1));

  return (
    <div style={{
      background: 'var(--panel-bg)', border: `1.5px solid ${value > 0 ? accentColor : 'var(--border)'}`,
      borderRadius: '14px', padding: '1rem', textAlign: 'center',
      boxShadow: value > 0 ? `0 4px 16px ${accentColor}20` : 'var(--shadow-sm)',
      transition: 'all 0.25s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: accentColor }}>
        {label}
      </span>
      <span style={{ fontWeight: 900, fontSize: '2.2rem', color: color, lineHeight: 1 }}>
        {value}
      </span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={decrement} style={{
          width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid var(--border)',
          background: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-light)'; e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-color)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Minus size={12} />
        </button>
        <button onClick={increment} style={{
          width: '30px', height: '30px', borderRadius: '50%', border: `1.5px solid ${accentColor}`,
          background: accentColor + '18', color: accentColor, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = accentColor; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = accentColor + '18'; e.currentTarget.style.color = accentColor; }}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export function Tickets() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState(EMPTY_FORM);

  const totalPassengers =
    parseInt(formData.inteiro || 0) +
    parseInt(formData.meia || 0) +
    parseInt(formData.free || 0) +
    parseInt(formData.cortesia || 0);

  const totalAPagar =
    (parseInt(formData.inteiro || 0) * VALOR_INTEIRA) +
    (parseInt(formData.meia || 0) * VALOR_MEIA);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePassengerChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = useCallback(async () => {
    if (totalPassengers === 0) return addToast('Defina ao menos um passageiro.', 'warning');
    await db.tickets.add({
      ticketNumber: Date.now(),
      agency: formData.agente,
      price: totalAPagar,
      status: formData.passagemPagaNaEntrada ? 'paid' : 'pending',
      date: new Date().toISOString(),
    });
    addToast(`Bilhete emitido! ${totalPassengers} pax · ${totalAPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 'success');
    setFormData(EMPTY_FORM);
  }, [formData, totalPassengers, totalAPagar]);

  const handleClear = useCallback(() => {
    setFormData(EMPTY_FORM);
    addToast('Formulário limpo.', 'info');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F2') { e.preventDefault(); handleSave(); }
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('ticket-comanda')?.focus(); }
      if (e.key === 'F3') { e.preventDefault(); handleClear(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleClear]);

  const fmtCurrency = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn-premium btn-success-gradient" onClick={handleSave}>
          <Save size={18} /> Salvar e Imprimir
          <span style={{ background: 'rgba(0,0,0,0.15)', padding: '0.1rem 0.5rem', borderRadius: '5px', fontSize: '0.75rem', marginLeft: '0.25rem' }}>F2</span>
        </button>
        <button className="btn-premium" onClick={handleClear}
          style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)' }}>
          <Ticket size={18} /> Novo
          <span style={{ color: 'var(--text-light)', fontSize: '0.75rem', marginLeft: '0.25rem' }}>F1</span>
        </button>
        <button className="btn-premium" onClick={handleClear}
          style={{ background: 'var(--danger-light)', border: '1.5px solid rgba(239,68,68,0.25)', color: 'var(--danger)' }}>
          <Trash2 size={18} /> Apagar
          <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: '0.25rem' }}>F3</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', flex: 1 }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Identification */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <h2 style={{ margin: '0 0 1rem', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid var(--border)' }}>
              <Users size={17} style={{ color: 'var(--primary)' }} /> Identificação
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Nº Comanda</label>
                <input
                  id="ticket-comanda"
                  type="text"
                  className="input-premium"
                  name="comanda"
                  value={formData.comanda}
                  onChange={handleChange}
                  placeholder="000"
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Nome Completo</label>
                <input type="text" className="input-premium" name="nome" placeholder="Opcional" value={formData.nome} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Agência
                </label>
                <select className="input-premium" name="agente" value={formData.agente} onChange={handleChange}>
                  <option>AGÊNCIA CAPITÃO GANCHO</option>
                  <option>POUSADA ILHA DO CROCODILO</option>
                  <option>VENDA DIRETA (ESCRITÓRIO)</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                <input type="checkbox" id="incompleto" name="incompleto" checked={formData.incompleto} onChange={handleChange} className="checkbox-premium" />
                <label htmlFor="incompleto" style={{ fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem', userSelect: 'none' }}>
                  Pagamento Incompleto
                </label>
              </div>
            </div>
          </div>

          {/* Passengers */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1.5px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={17} style={{ color: 'var(--primary)' }} /> Passageiros
              </h2>
              <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white', padding: '0.3rem 0.85rem', borderRadius: '99px',
                fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <Users size={13} /> {totalPassengers} pax
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
              <PassengerBox label="Inteira" fieldName="inteiro" value={formData.inteiro} onChange={handlePassengerChange} accentColor="var(--primary)" color="var(--primary)" />
              <PassengerBox label="Meia" fieldName="meia" value={formData.meia} onChange={handlePassengerChange} accentColor="var(--secondary)" color="var(--secondary)" />
              <PassengerBox label="Free" fieldName="free" value={formData.free} onChange={handlePassengerChange} accentColor="var(--success)" color="var(--success)" />
              <PassengerBox label="Cortesia" fieldName="cortesia" value={formData.cortesia} onChange={handlePassengerChange} accentColor="var(--warning)" color="var(--warning)" />
            </div>
            <p style={{ margin: '0.85rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Inteira: {fmtCurrency(VALOR_INTEIRA)} · Meia: {fmtCurrency(VALOR_MEIA)} · Free/Cortesia: Sem cobrança
            </p>
          </div>
        </div>

        {/* Right: Total & Payment */}
        <div style={{
          background: 'var(--panel-bg)', border: '1.5px solid var(--border)',
          borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Total header */}
          <div style={{
            padding: '1.5rem', textAlign: 'center',
            background: 'linear-gradient(135deg, hsl(208, 95%, 54%) 0%, hsl(184, 85%, 45%) 100%)',
            color: 'white',
          }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.8 }}>Total a Receber</p>
            <p style={{ margin: '0.4rem 0 0', fontWeight: 900, fontSize: '2.5rem', letterSpacing: '-1px', lineHeight: 1 }}>
              {fmtCurrency(totalAPagar)}
            </p>
            {totalPassengers > 0 && (
              <p style={{ margin: '0.5rem 0 0', opacity: 0.75, fontSize: '0.82rem' }}>
                {totalPassengers} passageiro{totalPassengers > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Breakdown */}
            {(formData.inteiro > 0 || formData.meia > 0) && (
              <div style={{ background: 'var(--bg-color)', borderRadius: '10px', padding: '0.85rem', fontSize: '0.85rem' }}>
                {formData.inteiro > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{formData.inteiro}× Inteira</span>
                    <span style={{ fontWeight: 700 }}>{fmtCurrency(formData.inteiro * VALOR_INTEIRA)}</span>
                  </div>
                )}
                {formData.meia > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{formData.meia}× Meia</span>
                    <span style={{ fontWeight: 700 }}>{fmtCurrency(formData.meia * VALOR_MEIA)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[{ label: 'A Bordo' }, { label: 'Na Pousada' }].map(opt => (
                <button key={opt.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--bg-color)', border: '1.5px solid var(--border)',
                  borderRadius: '10px', padding: '0.85rem 1rem', cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-color)'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    <CreditCard size={16} style={{ color: 'var(--text-light)' }} /> {opt.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>R$ 0,00</span>
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="passagemPaga" name="passagemPagaNaEntrada" checked={formData.passagemPagaNaEntrada} onChange={handleChange} className="checkbox-premium" />
                <label htmlFor="passagemPaga" style={{ fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.88rem', userSelect: 'none' }}>
                  Passagem paga na entrada
                </label>
              </div>

              <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                <span style={{ background: 'var(--bg-color)', padding: '0.7rem 0.85rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderRight: '1.5px solid var(--border)' }}>
                  Crédito
                </span>
                <input type="text" name="credito" style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  padding: '0.7rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'right',
                  fontFamily: 'inherit', fontSize: '0.9rem',
                }} value={formData.credito} onChange={handleChange} placeholder="R$ 0,00" />
              </div>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', borderTop: '1.5px solid var(--border)', background: 'var(--bg-color)' }}>
            <button className="btn-premium btn-success-gradient" style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }} onClick={handleSave}>
              <CheckCircle size={20} /> Confirmar Emissão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
