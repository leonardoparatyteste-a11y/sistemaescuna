import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function Receipt({
  order,
  items,
  subtotal,
  // backward-compat: accept old 'total' prop too
  total: totalLegacy,
  hasTax = true,
  hasCouvert = false,
  couvertValue = 12.00,
  cashier = 'caixa',
  type = 'CONFERÊNCIA',
  date,
}) {
  if (!order) return null;

  const sub         = subtotal ?? totalLegacy ?? 0;
  const taxAmount   = hasTax    ? sub * 0.10 : 0;
  const couvertAmt  = hasCouvert ? couvertValue : 0;
  const finalTotal  = sub + taxAmount + couvertAmt;

  // The 80mm width is roughly 300px
  return (
    <div className="print-only text-sm w-[300px] font-mono text-black leading-tight bg-white p-2">
      <div className="text-center mb-4">
        <h1 className="font-bold text-lg mb-1">ESCUNA CAPITÃO GANCHO</h1>
        <p>Terminal: 01 - {cashier}</p>
        <p>{date ? new Date(date).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</p>
        <div className="border-b border-black border-dashed my-2"></div>
        <p className="font-bold uppercase tracking-wider text-base">{type}</p>
        <p className="font-bold text-lg mt-1">COMANDA: {order.orderNumber}</p>
        <p style={{ fontSize: '0.75rem' }}>Mesa {order.tableNumber}</p>
        <div className="border-b border-black border-dashed my-2"></div>
      </div>

      <table className="w-full text-left mb-4">
        <thead>
          <tr className="border-b border-black border-dashed">
            <th className="py-1">Qtd</th>
            <th className="py-1">Item</th>
            <th className="py-1 text-right">R$</th>
          </tr>
        </thead>
        <tbody>
          {items && items.map((item, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td className="py-1 align-top">{item.quantity}x</td>
                <td className="py-1">{item.name || 'Produto'}</td>
                <td className="py-1 text-right align-top">
                  {((item.price || 0) * item.quantity).toFixed(2).replace('.', ',')}
                </td>
              </tr>
              {item.notes && (
                <tr>
                  <td></td>
                  <td colSpan="2" className="text-xs italic text-gray-600 pb-1" style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                    * {item.notes}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="border-t border-black border-dashed pt-2 space-y-1 text-right mb-4">
        <p>CONSUMO: R$ {sub.toFixed(2).replace('.', ',')}</p>
        {hasTax && (
          <p>TAXA SERVIÇO (10%): + R$ {taxAmount.toFixed(2).replace('.', ',')}</p>
        )}
        {hasCouvert && (
          <p>COUVERT MUSICAL: + R$ {couvertAmt.toFixed(2).replace('.', ',')}</p>
        )}
        <p className="font-bold text-lg">TOTAL: R$ {finalTotal.toFixed(2).replace('.', ',')}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 mb-4">
        {type === 'CONFERÊNCIA' && (
           <>
              <p className="text-xs font-bold mb-1 uppercase">Avalie nosso Passeio</p>
              <QRCodeSVG value={`https://avaliare.app/escuna/${order.orderNumber}`} size={100} />
           </>
        )}
        {type.includes('COZINHA') || type.includes('BAR') ? (
           <p className="font-bold mt-2 pb-8">--- PREPARO IMEDIATO ---</p>
        ) : (
           <p className="font-bold text-xs mt-2 pb-8">OBRIGADO! BOA VIAGEM, MARUJO! 🏴‍☠️</p>
        )}
      </div>
    </div>
  );
}
