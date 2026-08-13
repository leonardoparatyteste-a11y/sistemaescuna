import React from 'react';

/**
 * Componente para exibição e impressão de vias de produção (Cozinha e Bar)
 */
export function KitchenTicketPrint({ sector = 'COZINHA', order, items = [], printedAt }) {
  if (!items || !items.length) return null;

  return (
    <div className="print-only kitchen-ticket-print" style={{ display: 'none' }}>
      <div style={{
        fontFamily: "'Courier New', Courier, monospace", width: '280px', margin: '0 auto',
        padding: '10px 0', borderBottom: '2px dashed #000', fontSize: '12px'
      }}>
        {/* Banner do Setor */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '8px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>
            *** {sector.toUpperCase()} ***
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: 'bold' }}>VIA DE PRODUÇÃO</p>
        </div>

        {/* Detalhes da Comanda */}
        <div style={{ marginBottom: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>MESA: #{order?.tableNumber || '?'}</span>
            <span>COMANDA: #{order?.orderNumber || '?'}</span>
          </div>
          <div style={{ fontSize: '10px', marginTop: '3px', color: '#333' }}>
            Horário: {printedAt ? new Date(printedAt).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {/* Divisória */}
        <div style={{ borderTop: '1px solid #000', margin: '6px 0' }} />

        {/* Lista de Itens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
                <span>{item.quantity}× {item.productName || item.name}</span>
              </div>
              {item.notes && (
                <div style={{ fontSize: '11px', fontStyle: 'italic', paddingLeft: '12px', marginTop: '2px', color: '#222' }}>
                  Obs: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '6px', textAlign: 'center', fontSize: '10px' }}>
          <span>Capitão Gancho POS — Produção</span>
        </div>
      </div>
    </div>
  );
}
