import React, { useState } from 'react';
import { db } from '../db/db';
import { useToast } from './Toast';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Lock, CheckCircle, AlertCircle, X } from 'lucide-react';

export function CashMovementModal({ isOpen, onClose, currentExpectedCash = 0 }) {
  const { addToast } = useToast();
  const [tab, setTab] = useState('sangria'); // 'sangria' | 'suprimento' | 'opening' | 'conferencing'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [countedCash, setCountedCash] = useState('');

  if (!isOpen) return null;

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}').username || 'Caixa';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (tab !== 'conferencing' && (isNaN(numAmount) || numAmount <= 0)) {
      addToast('Informe um valor válido maior que zero.', 'error');
      return;
    }

    try {
      if (tab === 'sangria') {
        if (numAmount > currentExpectedCash) {
          addToast(`Aviso: Valor da sangria (R$ ${numAmount.toFixed(2)}) é maior que o saldo em dinheiro da gaveta (R$ ${currentExpectedCash.toFixed(2)}).`, 'warning');
        }
        await db.cash_movements.add({
          type: 'sangria',
          amount: numAmount,
          description: description || 'Sangria de gaveta',
          user: currentUser,
          date: new Date().toISOString()
        });
        addToast(`Sangria de R$ ${numAmount.toFixed(2)} registrada com sucesso!`, 'success');
      } else if (tab === 'suprimento') {
        await db.cash_movements.add({
          type: 'suprimento',
          amount: numAmount,
          description: description || 'Reforço de troco',
          user: currentUser,
          date: new Date().toISOString()
        });
        addToast(`Suprimento de R$ ${numAmount.toFixed(2)} registrado!`, 'success');
      } else if (tab === 'opening') {
        await db.cash_movements.add({
          type: 'opening',
          amount: numAmount,
          description: description || 'Abertura / Fundo de Troco',
          user: currentUser,
          date: new Date().toISOString()
        });
        addToast(`Abertura de caixa registrada com R$ ${numAmount.toFixed(2)}!`, 'success');
      } else if (tab === 'conferencing') {
        const numCounted = parseFloat(countedCash);
        if (isNaN(numCounted)) {
          addToast('Informe o valor físico contado na gaveta.', 'error');
          return;
        }
        const diff = numCounted - currentExpectedCash;
        await db.cash_movements.add({
          type: 'fechamento',
          amount: numCounted,
          description: `Conferência Física: Contado R$ ${numCounted.toFixed(2)} | Esperado R$ ${currentExpectedCash.toFixed(2)} | Dif: ${diff >= 0 ? '+' : ''}R$ ${diff.toFixed(2)}`,
          user: currentUser,
          date: new Date().toISOString()
        });
        if (Math.abs(diff) < 0.01) {
          addToast('Caixa conferido! Valores batem perfeitamente.', 'success');
        } else if (diff > 0) {
          addToast(`Conferência salva. Sobra de caixa de R$ ${diff.toFixed(2)}.`, 'info');
        } else {
          addToast(`Conferência salva. Quebra/Falta de caixa de R$ ${Math.abs(diff).toFixed(2)}.`, 'warning');
        }
      }

      setAmount('');
      setDescription('');
      setCountedCash('');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Erro ao salvar movimentação de caixa.', 'error');
    }
  };

  const fmtCurrency = val => (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="glass-panel fade-in-up" style={{
        width: '100%', maxWidth: '480px', margin: 0, padding: '1.5rem',
        borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={22} style={{ color: 'var(--primary)' }} /> Gestão de Gaveta de Caixa
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Saldo estimado na gaveta: <strong style={{ color: 'var(--success)' }}>{fmtCurrency(currentExpectedCash)}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', marginBottom: '1.25rem', background: 'var(--bg-color)', padding: '0.35rem', borderRadius: '12px' }}>
          {[
            { id: 'sangria', label: 'Sangria', icon: <ArrowUpRight size={14} /> },
            { id: 'suprimento', label: 'Suprimento', icon: <ArrowDownLeft size={14} /> },
            { id: 'opening', label: 'Abertura', icon: <Lock size={14} /> },
            { id: 'conferencing', label: 'Conferir', icon: <CheckCircle size={14} /> },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.5rem 0.25rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
                background: tab === t.id ? 'var(--panel-bg)' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: tab === t.id ? 'var(--card-shadow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab !== 'conferencing' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  {tab === 'sangria' && 'Valor da Retirada (Sangria)'}
                  {tab === 'suprimento' && 'Valor do Suprimento (Troco)'}
                  {tab === 'opening' && 'Fundo de Troco Inicial'}
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                      borderRadius: '10px', border: '1.5px solid var(--border)',
                      background: 'var(--bg-color)', color: 'var(--text-main)',
                      fontSize: '1.1rem', fontWeight: 800
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  placeholder={tab === 'sangria' ? 'Ex: Sangria para cofre principal' : 'Ex: Notas de R$ 5 para troco'}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.75rem',
                    borderRadius: '10px', border: '1.5px solid var(--border)',
                    background: 'var(--bg-color)', color: 'var(--text-main)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: 'var(--bg-color)', padding: '0.85rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Saldo Esperado em Dinheiro:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)' }}>{fmtCurrency(currentExpectedCash)}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Valor Físico Contado na Gaveta:
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={countedCash}
                    onChange={e => setCountedCash(e.target.value)}
                    required
                    autoFocus
                    style={{
                      width: '100%', padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                      borderRadius: '10px', border: '1.5px solid var(--border)',
                      background: 'var(--bg-color)', color: 'var(--text-main)',
                      fontSize: '1.1rem', fontWeight: 800
                    }}
                  />
                </div>
              </div>

              {countedCash !== '' && !isNaN(parseFloat(countedCash)) && (
                <div style={{
                  padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: (parseFloat(countedCash) - currentExpectedCash) === 0 ? 'var(--success-light)' : (parseFloat(countedCash) - currentExpectedCash) > 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: (parseFloat(countedCash) - currentExpectedCash) === 0 ? 'var(--success)' : (parseFloat(countedCash) - currentExpectedCash) > 0 ? '#3b82f6' : '#ef4444'
                }}>
                  <AlertCircle size={18} />
                  <span>
                    Divergência: {(parseFloat(countedCash) - currentExpectedCash) >= 0 ? '+' : ''}{fmtCurrency(parseFloat(countedCash) - currentExpectedCash)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
