import React, { useState, useRef, useEffect, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  QrCode, Camera, CheckCircle, AlertTriangle, XCircle, Search,
  Users, Anchor, RefreshCw, ArrowRight, ShieldCheck, UserCheck, Check
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { validateTicketForBoarding, playBoardingSound } from '../utils/boardingUtils';

export function BoardingCheckin() {
  const { addToast } = useToast();
  const [ticketInput, setTicketInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState(null); // { valid, code, message, ticket }
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'boarded'
  const [searchQuery, setSearchQuery] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Carrega todos os bilhetes do dia
  const tickets = useLiveQuery(() => db.tickets.toArray(), []) || [];

  // Estatísticas de Embarque
  const stats = useMemo(() => {
    const total = tickets.length;
    const boarded = tickets.filter(t => t.boardingStatus === 'boarded').length;
    const pending = total - boarded;
    const percentage = total > 0 ? Math.round((boarded / total) * 100) : 0;
    return { total, boarded, pending, percentage };
  }, [tickets]);

  // Lista filtrada
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const isBoarded = t.boardingStatus === 'boarded';
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'boarded' && isBoarded) ||
        (filterStatus === 'pending' && !isBoarded);

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.ticketNumber && t.ticketNumber.toString().includes(q)) ||
        (t.agency && t.agency.toLowerCase().includes(q)) ||
        (t.comanda && t.comanda.toString().includes(q));

      return matchStatus && matchSearch;
    });
  }, [tickets, filterStatus, searchQuery]);

  // Processa o código lido ou digitado
  const handleProcessTicketCode = async (codeStr) => {
    if (!codeStr) return;
    const cleanCode = codeStr.trim();

    // Tenta encontrar o bilhete por ticketNumber ou id
    let ticket = tickets.find(t => t.ticketNumber?.toString() === cleanCode || t.id?.toString() === cleanCode);

    if (!ticket && cleanCode.startsWith('#')) {
      const numOnly = cleanCode.replace('#', '');
      ticket = tickets.find(t => t.ticketNumber?.toString() === numOnly);
    }

    const validation = validateTicketForBoarding(ticket);

    if (validation.valid && ticket) {
      // Atualiza o ticket no Dexie DB
      const nowIso = new Date().toISOString();
      await db.tickets.update(ticket.id, {
        boardingStatus: 'boarded',
        boardedAt: nowIso
      });
      playBoardingSound('success');
      addToast(`Embarque confirmado! Bilhete #${ticket.ticketNumber || ticket.id}`, 'success');
      setLastScanResult({
        ...validation,
        ticket: { ...ticket, boardingStatus: 'boarded', boardedAt: nowIso }
      });
    } else {
      playBoardingSound(validation.code === 'ALREADY_BOARDED' ? 'warning' : 'error');
      setLastScanResult({
        ...validation,
        ticket
      });
    }

    setTicketInput('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleProcessTicketCode(ticketInput);
  };

  // Alternar Embarque Manual na Tabela
  const handleToggleBoarding = async (ticket) => {
    const isBoarded = ticket.boardingStatus === 'boarded';
    if (isBoarded) {
      await db.tickets.update(ticket.id, {
        boardingStatus: 'pending',
        boardedAt: null
      });
      addToast(`Embarque do bilhete #${ticket.ticketNumber || ticket.id} desfeito.`, 'info');
    } else {
      const validation = validateTicketForBoarding(ticket);
      if (!validation.valid && validation.code !== 'AUTHORIZED') {
        playBoardingSound(validation.code === 'ALREADY_BOARDED' ? 'warning' : 'error');
        setLastScanResult({ ...validation, ticket });
        return;
      }
      const nowIso = new Date().toISOString();
      await db.tickets.update(ticket.id, {
        boardingStatus: 'boarded',
        boardedAt: nowIso
      });
      playBoardingSound('success');
      addToast(`Embarque confirmado! Bilhete #${ticket.ticketNumber || ticket.id}`, 'success');
    }
  };

  // Câmera ao vivo
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Erro ao acessar a câmera:', err);
      addToast('Não foi possível acessar a câmera do dispositivo.', 'warning');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header & Progresso de Lotação */}
      <div className="glass-panel" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Anchor size={26} style={{ color: 'var(--primary)' }} /> Controle de Embarque & Validação QR Code
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Escaneie o bilhete do passageiro para validar e autorizar o embarque na escuna.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status de Lotação</span>
              <p style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)' }}>
                {stats.boarded} / {stats.total} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>({stats.percentage}%)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Progresso de Embarque */}
        <div style={{ width: '100%', height: '12px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${stats.percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>
        
        {/* Lado Esquerdo: Lista de Chamada e Filtros */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Barra de Filtros */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {[
                { id: 'all', label: `Todos (${stats.total})` },
                { id: 'pending', label: `Pendentes (${stats.pending})` },
                { id: 'boarded', label: `Embarcados (${stats.boarded})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                    border: '1.5px solid', cursor: 'pointer', transition: 'all 0.2s',
                    background: filterStatus === f.id ? 'var(--primary)' : 'var(--panel-bg)',
                    borderColor: filterStatus === f.id ? 'var(--primary)' : 'var(--border)',
                    color: filterStatus === f.id ? 'white' : 'var(--text-main)'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Buscar por nº, agência..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '0.38rem 0.6rem 0.38rem 2.1rem', borderRadius: '8px',
                  border: '1.5px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-main)', fontSize: '0.82rem'
                }}
              />
            </div>
          </div>

          {/* Tabela de Ingressos */}
          <div className="glass-panel" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1.5px solid var(--border)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>Nº BILHETE</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)' }}>AGÊNCIA / ORIGEM</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>PAGAMENTO</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>STATUS EMBARQUE</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhum bilhete encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map(t => {
                    const isBoarded = t.boardingStatus === 'boarded';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: isBoarded ? 'rgba(34, 197, 94, 0.04)' : 'transparent' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          #{t.ticketNumber || t.id}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>
                          {t.agency || 'Balcão / Direta'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800,
                            background: t.status === 'paid' ? 'var(--success-light)' : 'rgba(239, 68, 68, 0.15)',
                            color: t.status === 'paid' ? 'var(--success)' : '#ef4444',
                          }}>
                            {t.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800,
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            background: isBoarded ? 'var(--success-light)' : 'var(--border)',
                            color: isBoarded ? 'var(--success)' : 'var(--text-muted)',
                          }}>
                            {isBoarded ? <Check size={13} /> : null}
                            {isBoarded ? 'EMBARCADO' : 'AGUARDANDO'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleBoarding(t)}
                            className={isBoarded ? 'btn btn-secondary' : 'btn btn-primary'}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: 800 }}
                          >
                            {isBoarded ? 'Desfazer' : 'Embarcar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado Direito: Scanner & Resultado Instantâneo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card de Entrada Manual / Scanner */}
          <div className="glass-panel" style={{ margin: 0 }}>
            <h2 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={20} style={{ color: 'var(--primary)' }} /> Leitor de QR Code / Código
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Digite ou Escaneie o Nº do Bilhete:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Ex: 17354912... ou #12"
                    value={ticketInput}
                    onChange={e => setTicketInput(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1, padding: '0.65rem 0.75rem', borderRadius: '10px',
                      border: '1.5px solid var(--border)', background: 'var(--bg-color)',
                      color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800
                    }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem' }}>
                    Validar
                  </button>
                </div>
              </div>

              {/* Botão de Câmera */}
              <button
                type="button"
                onClick={isCameraActive ? stopCamera : startCamera}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', marginTop: '0.25rem' }}
              >
                <Camera size={18} /> {isCameraActive ? 'Fechar Câmera' : 'Ativar Scanner de Câmera'}
              </button>

              {/* Viewfinder da Câmera */}
              {isCameraActive && (
                <div style={{
                  position: 'relative', width: '100%', height: '200px', borderRadius: '12px',
                  overflow: 'hidden', background: '#000', border: '2px solid var(--primary)', marginTop: '0.5rem'
                }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: '20px', border: '2px dashed var(--primary)',
                    borderRadius: '12px', pointerEvents: 'none', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
                  }} />
                </div>
              )}
            </form>
          </div>

          {/* Card de Resultado da Leitura Instantânea */}
          {lastScanResult && (
            <div className="glass-panel fade-in-up" style={{
              margin: 0, borderLeft: `6px solid ${lastScanResult.code === 'AUTHORIZED' ? 'var(--success)' : lastScanResult.code === 'ALREADY_BOARDED' ? '#f59e0b' : '#ef4444'}`,
              background: lastScanResult.code === 'AUTHORIZED' ? 'rgba(34, 197, 94, 0.08)' : lastScanResult.code === 'ALREADY_BOARDED' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {lastScanResult.code === 'AUTHORIZED' && <CheckCircle size={28} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                {lastScanResult.code === 'ALREADY_BOARDED' && <AlertTriangle size={28} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                {(lastScanResult.code === 'UNPAID' || lastScanResult.code === 'NOT_FOUND') && <XCircle size={28} style={{ color: '#ef4444', flexShrink: 0 }} />}

                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {lastScanResult.code === 'AUTHORIZED' ? 'EMBARQUE AUTORIZADO' : lastScanResult.code === 'ALREADY_BOARDED' ? 'BILHETE JÁ UTILIZADO' : 'EMBARQUE NEGADO'}
                  </h3>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {lastScanResult.message}
                  </p>

                  {lastScanResult.ticket && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span><strong>Bilhete:</strong> #{lastScanResult.ticket.ticketNumber || lastScanResult.ticket.id}</span>
                      <span><strong>Agência:</strong> {lastScanResult.ticket.agency || 'Balcão'}</span>
                      <span><strong>Valor:</strong> {(lastScanResult.ticket.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
