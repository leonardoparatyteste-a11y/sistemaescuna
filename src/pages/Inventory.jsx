import React, { useState } from 'react';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Package, AlertTriangle, Plus, ShieldAlert, Search, X, CheckCircle, Edit2, Trash2, ArrowDownToLine } from 'lucide-react';
import { useToast } from '../components/Toast';

const CATEGORY_META = {
  bebidas:    { label: 'Bebidas',    color: '#2563eb', bg: '#eff6ff' },
  porcoes:    { label: 'Porções',    color: '#059669', bg: '#ecfdf5' },
  pratos:     { label: 'Pratos',     color: '#7c3aed', bg: '#f5f3ff' },
  sobremesas: { label: 'Sobremesas', color: '#db2777', bg: '#fdf2f8' },
};

const EMPTY_PRODUCT = { code: '', name: '', category: 'bebidas', price: '', stock: '' };

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? { ...product, price: product.price?.toString(), stock: product.stock?.toString() } : { ...EMPTY_PRODUCT });
  const isEdit = !!product;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.price || !form.stock) return;
    const payload = {
      code: form.code.trim(),
      name: form.name.trim().toUpperCase(),
      category: form.category,
      price: parseFloat(form.price),
      stock: parseInt(form.stock),
    };
    if (isEdit) {
      await db.products.update(product.id, payload);
    } else {
      await db.products.add(payload);
    }
    onSave();
  };

  const catMeta = CATEGORY_META[form.category] || CATEGORY_META.bebidas;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 800 }}>{isEdit ? 'Editar Produto' : 'Novo Produto'}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Código</label>
              <input className="input-premium" name="code" value={form.code} onChange={handleChange} placeholder="01" autoFocus />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Nome do Produto</label>
              <input className="input-premium" name="name" value={form.name} onChange={handleChange} placeholder="Ex: CERVEJA LATA" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>Categoria</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <button key={key} type="button" onClick={() => setForm(prev => ({ ...prev, category: key }))}
                  style={{
                    padding: '0.4rem 0.85rem', borderRadius: '99px', fontWeight: 700,
                    fontSize: '0.82rem', cursor: 'pointer', border: 'none',
                    background: form.category === key ? meta.color : meta.bg,
                    color: form.category === key ? 'white' : meta.color,
                    transition: 'all 0.2s',
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Preço de Venda (R$)</label>
              <input className="input-premium" type="number" step="0.50" min="0" name="price" value={form.price} onChange={handleChange} placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Estoque Físico</label>
              <input className="input-premium" type="number" min="0" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-premium" onClick={onClose}
            style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)' }}>
            Cancelar
          </button>
          <button className="btn-premium btn-primary-gradient" onClick={handleSave}
            disabled={!form.code || !form.name || !form.price || !form.stock}>
            <CheckCircle size={16} /> {isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Inventory() {
  const { addToast } = useToast();
  const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | product object

  if (user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '1rem' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={36} style={{ color: 'var(--danger)' }} />
        </div>
        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--text-main)' }}>Acesso Negado</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: '360px' }}>
          Apenas usuários com perfil <strong>Administrador</strong> têm acesso ao controle de estoque.
        </p>
      </div>
    );
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm)
  );

  const handleDelete = async (p) => {
    if (window.confirm(`Remover "${p.name}" do estoque?`)) {
      await db.products.delete(p.id);
      addToast(`${p.name} removido.`, 'success');
    }
  };

  const handleModalSave = () => {
    addToast(modal?.id ? 'Produto atualizado!' : 'Produto cadastrado!', 'success');
    setModal(null);
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>

      {modal !== null && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleModalSave}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.35rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={22} style={{ color: 'var(--primary)' }} /> Inventário de Produtos
        </h1>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn-premium"
            style={{ background: 'var(--panel-bg)', border: '1.5px solid var(--border)', color: 'var(--text-main)', fontSize: '0.88rem' }}>
            <ArrowDownToLine size={16} /> Exportar Excel
          </button>
          <button className="btn-premium btn-primary-gradient" onClick={() => setModal('new')}>
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Stats chips */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Itens', value: products.length, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Estoque Baixo', value: products.filter(p => p.stock <= 10 && p.stock > 0).length, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'Sem Estoque', value: products.filter(p => p.stock <= 0).length, color: 'var(--danger)', bg: 'var(--danger-light)' },
          { label: 'Categorias', value: [...new Set(products.map(p => p.category))].length, color: 'var(--secondary)', bg: 'hsl(184, 85%, 94%)' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.color}25`, borderRadius: '10px', padding: '0.4rem 0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.value}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: s.color, opacity: 0.8 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div style={{
        background: 'var(--panel-bg)', border: '1.5px solid var(--border)',
        borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--card-shadow)',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>
        {/* Search bar */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1.5px solid var(--border)', background: 'var(--bg-color)' }}>
          <div style={{ position: 'relative', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input type="text" className="input-premium" style={{ paddingLeft: '2.2rem', height: '38px', fontSize: '0.88rem' }}
              placeholder="Buscar por nome ou código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table-premium">
            <thead>
              <tr>
                <th>Cód</th>
                <th>Nome do Produto</th>
                <th>Categoria</th>
                <th style={{ textAlign: 'right' }}>Preço</th>
                <th style={{ textAlign: 'center' }}>Estoque</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const meta = CATEGORY_META[p.category] || { label: p.category, color: '#475569', bg: '#f1f5f9' };
                const isLow = p.stock <= 10 && p.stock > 0;
                const isOut = p.stock <= 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>#{p.code}</span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>
                      <span style={{ background: meta.bg, color: meta.color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '0.25rem 0.65rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.82rem',
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: isOut ? 'var(--danger-light)' : isLow ? 'var(--warning-light)' : 'var(--success-light)',
                        color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)',
                      }}>
                        {(isLow || isOut) && <AlertTriangle size={11} />}
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button onClick={() => setModal(p)} style={{
                          background: 'var(--primary-light)', border: 'none', borderRadius: '8px',
                          padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--primary)', display: 'flex',
                          transition: 'all 0.2s',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary)' + ' ' + (e.currentTarget.style.color = 'white') && 'var(--primary)'}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p)} style={{
                          background: 'var(--danger-light)', border: 'none', borderRadius: '8px',
                          padding: '0.35rem 0.6rem', cursor: 'pointer', color: 'var(--danger)', display: 'flex',
                          transition: 'all 0.2s',
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <Package size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nenhum produto encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
