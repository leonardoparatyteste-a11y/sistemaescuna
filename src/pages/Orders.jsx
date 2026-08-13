import React, { useState, useMemo } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Search, CreditCard, Printer, FileSpreadsheet,
  X, CheckCircle, Clock, ChevronLeft, Users, Utensils, AlertTriangle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { Receipt } from '../components/Receipt';
import { KitchenTicketPrint } from '../components/KitchenTicketPrint';
import { groupItemsBySector, markItemsAsPrinted } from '../utils/printUtils';

/* ─── helpers ─────────────────────────────────────────────── */
const fmtCurrency  = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtTime      = d => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const elapsedMinutes = d => Math.floor((Date.now() - new Date(d).getTime()) / 60000);
const fmtElapsed   = d => {
  const m = elapsedMinutes(d);
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60), rm = m % 60;
  return `${h}h${rm > 0 ? `${rm}min` : ''}`;
};
const isUrgent = d => elapsedMinutes(d) >= 90;
/* ─── Calcula total final de uma comanda ───────────────────── */
function calcTotal(subtotal, order) {
  const hasTax     = order.hasTax !== false;
  const hasCouvert = order.hasCouvert === true;
  const cv         = order.couvertValue ?? 12.00;
  return subtotal + (hasTax ? subtotal * 0.1 : 0) + (hasCouvert ? cv : 0);
}

/* ─── Confirm Modal ────────────────────────────────────────── */
function ConfirmModal({ order, items, onClose, onConfirm }) {
  const subtotal     = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const hasTax       = order.hasTax !== false;
  const hasCouvert   = order.hasCouvert === true;
  const couvertAmt   = order.couvertValue ?? 12.00;
  const taxAmount    = hasTax    ? subtotal * 0.10 : 0;
  const couvertAmount = hasCouvert ? couvertAmt  : 0;
  const finalTotal   = subtotal + taxAmount + couvertAmount;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} style={{ color: 'var(--success)' }} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 800 }}>
              Fechar Mesa {order?.tableNumber} — Comanda #{order?.orderNumber}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ background: 'var(--bg-color)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.quantity}× {item.name}</span>
                <span style={{ fontWeight: 700 }}>{fmtCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1.5px dashed var(--border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Consumo</span>
                <span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
              </div>
              {hasTax && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Taxa de Serviço (10%)</span>
                  <span style={{ fontWeight: 600 }}>+ {fmtCurrency(taxAmount)}</span>
                </div>
              )}
              {hasCouvert && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Couvert Musical</span>
                  <span style={{ fontWeight: 600 }}>+ {fmtCurrency(couvertAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '2px solid var(--border)' }}>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Total a Pagar</span>
                <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--primary)', letterSpacing: '-0.5px' }}>{fmtCurrency(finalTotal)}</span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Esta ação irá fechar definitivamente a comanda. Deseja prosseguir?
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-premium" onClick={onClose}
            style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)' }}>
            Cancelar
          </button>
          <button className="btn-premium" onClick={() => onConfirm('print')}
            style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
            <Printer size={16} /> Só Imprimir
          </button>
          <button className="btn-premium btn-success-gradient" onClick={() => onConfirm('close')}>
            <CheckCircle size={16} /> Fechar e Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Table Card ───────────────────────────────────────────── */
function TableCard({ tableNumber, orders, onSelect, itemTotalsMap }) {
  const openOrders = orders.filter(o => o.status === 'open');
  const hasOpen = openOrders.length > 0;
  const latestOpen = openOrders.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const urgent = hasOpen && latestOpen && isUrgent(latestOpen.date);
  // Use real item totals (summed from orderItems) instead of stale o.total
  const subtotal = openOrders.reduce((acc, o) => acc + (itemTotalsMap[o.id] ?? 0), 0);
  // Apply charges for display
  const totalValue = openOrders.reduce((acc, o) => {
    const s = itemTotalsMap[o.id] ?? o.total ?? 0;
    return acc + calcTotal(s, o);
  }, 0);

  const statusClass = !hasOpen ? 'table-card--free' : urgent ? 'table-card--urgent' : 'table-card--busy';

  return (
    <div
      className={`table-card ${statusClass}`}
      onClick={() => hasOpen && onSelect(latestOpen)}
      style={{ cursor: hasOpen ? 'pointer' : 'default' }}
    >
      <div className="table-card__header">
        <span className="table-card__number">Mesa {tableNumber}</span>
        <span className={`table-card__status-dot ${hasOpen ? (urgent ? 'dot--urgent' : 'dot--busy') : 'dot--free'}`} />
      </div>

      {hasOpen ? (
        <>
          <div className="table-card__body">
            <div className="table-card__icon-wrap">
              <Utensils size={22} />
            </div>
            <div className="table-card__total">{fmtCurrency(totalValue)}</div>
            {openOrders.length > 1 && (
              <div className="table-card__multi">{openOrders.length} comandas</div>
            )}
          </div>
          <div className="table-card__footer">
            {urgent && <AlertTriangle size={11} className="table-card__warn-icon" />}
            <Clock size={11} />
            <span>{fmtElapsed(latestOpen.date)}</span>
            {urgent && <span className="table-card__urgent-label">Demorado!</span>}
          </div>
        </>
      ) : (
        <div className="table-card__free-body">
          <div className="table-card__free-icon">🪑</div>
          <span className="table-card__free-label">Livre</span>
        </div>
      )}
    </div>
  );
}

/* ─── Order Detail Panel ───────────────────────────────────── */
function OrderDetailPanel({ order, items, products, onClose, onOpenModal, onPrint, onAddItems }) {
  const { addToast } = useToast();
  const [printSector, setPrintSector] = useState(null); // 'COZINHA' | 'BAR' | null
  const [printItems, setPrintItems] = useState([]);

  const getProductName = id => products.find(p => p.id === id)?.name || 'Produto';
  const enriched = items.map(i => ({ ...i, name: getProductName(i.productId) }));
  const subtotal     = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const hasTax       = order.hasTax !== false;
  const hasCouvert   = order.hasCouvert === true;
  const couvertAmt   = order.couvertValue ?? 12.00;
  const taxAmount    = hasTax    ? subtotal * 0.10 : 0;
  const couvertAmount = hasCouvert ? couvertAmt  : 0;
  const total        = subtotal + taxAmount + couvertAmount;

  const headerBg = order.status === 'open'
    ? 'linear-gradient(135deg, hsl(218,45%,18%) 0%, hsl(230,50%,25%) 100%)'
    : 'linear-gradient(135deg, hsl(150,45%,18%) 0%, hsl(150,50%,25%) 100%)';

  const handlePrintProduction = async (sectorName) => {
    const { kitchen, bar } = groupItemsBySector(items, products);
    const targetItems = sectorName === 'COZINHA' ? kitchen : bar;

    if (!targetItems.length) {
      addToast(`Nenhum item de ${sectorName} para imprimir nesta comanda.`, 'info');
      return;
    }

    setPrintSector(sectorName);
    setPrintItems(targetItems);

    setTimeout(async () => {
      window.print();
      // Marca todos os itens enviados como impressos no banco
      const itemIds = targetItems.map(i => i.id);
      await markItemsAsPrinted(db, itemIds);
      addToast(`Via de ${sectorName} enviada para impressão!`, 'success');
      setPrintSector(null);
    }, 100);
  };

  return (
    <div className="order-detail-panel fade-in-up">
      {/* Header */}
      <div className="order-detail-panel__header" style={{ background: headerBg }}>
        <button className="order-detail-panel__back" onClick={onClose}>
          <ChevronLeft size={18} /> Mesas
        </button>
        <div className="order-detail-panel__title">
          <span className="order-detail-panel__table">Mesa {order.tableNumber}</span>
          <h2 className="order-detail-panel__comanda">Comanda #{order.orderNumber}</h2>
        </div>
        <div className="order-detail-panel__meta">
          <span className={`order-detail-panel__badge ${order.status === 'open' ? 'badge--open' : 'badge--closed'}`}>
            {order.status === 'open' ? <><Clock size={12} /> Em Aberto</> : <><CheckCircle size={12} /> Fechada</>}
          </span>
          <span className="order-detail-panel__time">
            <Clock size={12} /> {fmtTime(order.date)}
            {order.status === 'open' && ` · ${fmtElapsed(order.date)}`}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="order-detail-panel__body">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Sem itens registrados nesta comanda.
          </div>
        ) : (
          <>
            <table className="table-premium">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>Unit.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700 }}>
                      <div>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400, marginTop: '0.15rem' }}>
                          * {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '6px',
                        background: item.printed ? 'var(--border)' : 'var(--warning-light)',
                        color: item.printed ? 'var(--text-muted)' : 'var(--warning)'
                      }}>
                        {item.printed ? 'Impresso' : 'Novo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: 6, fontWeight: 800, fontSize: '0.85rem' }}>
                        {item.quantity}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{fmtCurrency(item.price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="order-totals-box">
              <div className="order-totals-row">
                <span>Consumo</span><span>{fmtCurrency(subtotal)}</span>
              </div>
              {hasTax && (
                <div className="order-totals-row">
                  <span>Taxa Serviço (10%)</span><span>+ {fmtCurrency(taxAmount)}</span>
                </div>
              )}
              {hasCouvert && (
                <div className="order-totals-row">
                  <span>Couvert Musical</span><span>+ {fmtCurrency(couvertAmount)}</span>
                </div>
              )}
              <div className="order-totals-row order-totals-row--total">
                <span>TOTAL</span>
                <span>{fmtCurrency(total)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="order-detail-panel__actions no-print" style={{ flexWrap: 'wrap' }}>
        <button className="btn-premium" onClick={() => handlePrintProduction('COZINHA')}
          style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
          <Utensils size={15} /> Via Cozinha
        </button>
        <button className="btn-premium" onClick={() => handlePrintProduction('BAR')}
          style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
          <Printer size={15} /> Via Bar
        </button>
        <button className="btn-premium" onClick={onPrint}
          style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.82rem' }}>
          <Printer size={15} /> Conta
        </button>
        {order.status === 'open' && (
          <>
            <button className="btn-premium" onClick={onAddItems}
              style={{ background: 'var(--primary-light)', border: '1.5px solid rgba(var(--primary-hue), var(--primary-sat), var(--primary-lightness), 0.25)', color: 'var(--primary)', fontSize: '0.82rem' }}>
              <Plus size={15} /> Lançar Itens
            </button>
            <button className="btn-premium btn-success-gradient" onClick={onOpenModal}
              style={{ flex: 1, padding: '0.75rem', fontSize: '0.88rem' }}>
              <CreditCard size={16} /> Pagar
            </button>
          </>
        )}
        {order.status === 'closed' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 700 }}>
            <CheckCircle size={18} /> Comanda Encerrada
          </div>
        )}
      </div>

      {/* Via de Impressão da Cozinha / Bar */}
      {printSector && (
        <KitchenTicketPrint
          sector={printSector}
          order={order}
          items={printItems}
          printedAt={new Date()}
        />
      )}

      {/* Print area da Conta do Cliente */}
      <div className="print-only" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'white', zIndex: 999 }}>
        <Receipt order={order} items={enriched} subtotal={subtotal} hasTax={hasTax} hasCouvert={hasCouvert} couvertValue={couvertAmt} type={order.status === 'closed' ? 'VIA CLIENTE' : 'CONFERÊNCIA'} />
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */
export function Orders() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('open'); // 'open' | 'closed' | 'all'

  const rawOrdersList = useLiveQuery(() => db.orders.toArray(), []) || null;
  const rawOrders = useMemo(() => rawOrdersList || [], [rawOrdersList]);

  const rawProducts = useLiveQuery(() => db.products.toArray(), []) || null;
  const products = useMemo(() => rawProducts || [], [rawProducts]);

  // Fetch ALL order items to compute real totals per order (fixes stale o.total)
  const allOrderItemsList = useLiveQuery(() => db.orderItems.toArray(), []) || null;
  const allOrderItems = useMemo(() => allOrderItemsList || [], [allOrderItemsList]);

  // Map: orderId -> real subtotal from items
  const itemTotalsMap = useMemo(() => {
    const map = {};
    allOrderItems.forEach(item => {
      map[item.orderId] = (map[item.orderId] || 0) + item.price * item.quantity;
    });
    return map;
  }, [allOrderItems]);

  const rawOrderItemsList = useLiveQuery(
    () => selectedOrderId ? db.orderItems.where({ orderId: selectedOrderId }).toArray() : [],
    [selectedOrderId]
  ) || null;
  const rawOrderItems = useMemo(() => rawOrderItemsList || [], [rawOrderItemsList]);

  /* Group orders by tableNumber */
  const tableMap = useMemo(() => {
    const map = {};
    rawOrders.forEach(o => {
      const t = o.tableNumber || '?';
      if (!map[t]) map[t] = [];
      map[t].push(o);
    });
    return map;
  }, [rawOrders]);

  /* All distinct table numbers, sorted numerically */
  const allTables = useMemo(() => {
    return Object.keys(tableMap).sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    });
  }, [tableMap]);

  /* Filtered tables */
  const filteredTables = useMemo(() => {
    return allTables.filter(t => {
      if (searchTerm && !t.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      const orders = tableMap[t] || [];
      if (statusFilter === 'open')   return orders.some(o => o.status === 'open');
      if (statusFilter === 'closed') return orders.every(o => o.status === 'closed');
      return true;
    });
  }, [allTables, tableMap, searchTerm, statusFilter]);

  const selectedOrder = rawOrders.find(o => o.id === selectedOrderId);

  const openCount   = allTables.filter(t => tableMap[t].some(o => o.status === 'open')).length;
  const urgentCount = allTables.filter(t => tableMap[t].some(o => o.status === 'open' && isUrgent(o.date))).length;

  const handleConfirm = async (action) => {
    setShowModal(false);
    if (action === 'close' || action === 'print') {
      if (action === 'close') {
        await db.orders.update(selectedOrderId, { status: 'closed' });
        addToast('Comanda fechada com sucesso!', 'success');
        setSelectedOrderId(null);
      }
      window.print();
    }
  };

  /* ── When a table card is clicked, show its latest open order */
  const handleTableSelect = (order) => {
    setSelectedOrderId(order.id);
  };

  return (
    <div className="orders-page fade-in-up">
      {/* ── Modal ── */}
      {showModal && selectedOrder && (
        <ConfirmModal
          order={selectedOrder}
          items={rawOrderItems.map(i => ({ ...i, name: products.find(p => p.id === i.productId)?.name || 'Produto' }))}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* ── Detail panel (slide-over) ── */}
      {selectedOrderId && selectedOrder && (
        <div className="orders-detail-overlay">
          <OrderDetailPanel
            order={selectedOrder}
            items={rawOrderItems}
            products={products}
            onClose={() => setSelectedOrderId(null)}
            onOpenModal={() => setShowModal(true)}
            onPrint={() => window.print()}
            onAddItems={() => navigate('/dashboard/pdv', { state: { activeOrderId: selectedOrder.id } })}
          />
        </div>
      )}

      {/* ── Toolbar compacta ── */}
      <div className="orders-stats-bar">
        <div className="orders-stat-card orders-stat-card--primary">
          <Utensils size={14} />
          <span className="orders-stat-value">{openCount}</span>
          <span className="orders-stat-label">abertas</span>
        </div>
        <div className="orders-stats-divider" />
        <div className="orders-stat-card orders-stat-card--free">
          <Users size={14} />
          <span className="orders-stat-value">{allTables.length - openCount}</span>
          <span className="orders-stat-label">livres</span>
        </div>
        {urgentCount > 0 && (
          <>
            <div className="orders-stats-divider" />
            <div className="orders-stat-card orders-stat-card--urgent">
              <AlertTriangle size={14} />
              <span className="orders-stat-value">{urgentCount}</span>
              <span className="orders-stat-label">+90min</span>
            </div>
          </>
        )}

        {/* Search & filter */}
        <div className="orders-filters">
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input
              type="text"
              className="input-premium"
              style={{ paddingLeft: '1.9rem', height: 32, fontSize: '0.82rem', width: 140 }}
              placeholder="Mesa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="orders-filter-tabs">
            {[['open','Abertas'],['all','Todas'],['closed','Fechadas']].map(([val, label]) => (
              <button
                key={val}
                className={`orders-filter-tab ${statusFilter === val ? 'orders-filter-tab--active' : ''}`}
                onClick={() => setStatusFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tables Grid ── */}
      {filteredTables.length > 0 ? (
        <div className="tables-grid">
          {filteredTables.map(tableNumber => (
            <TableCard
              key={tableNumber}
              tableNumber={tableNumber}
              orders={tableMap[tableNumber]}
              onSelect={handleTableSelect}
              itemTotalsMap={itemTotalsMap}
            />
          ))}
        </div>
      ) : (
        <div className="orders-empty-state">
          <FileSpreadsheet size={52} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            Nenhuma mesa encontrada
          </p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Abra comandas pelo PDV para ver as mesas aqui.
          </p>
        </div>
      )}
    </div>
  );
}
