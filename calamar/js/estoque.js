/**
 * estoque.js — Módulo de Estoque
 * Calamar Flats — Painel Operacional
 *
 * Gerencia itens de estoque com contagem, alertas de estoque baixo,
 * movimentações (entrada/saída) e organização por categoria.
 */

const Estoque = (() => {
  'use strict';

  // ─── Categorias disponíveis ──────────────────────────────────────────────────
  const CATEGORIAS = ['Amenities', 'Cama e banho', 'Copa', 'Limpeza', 'Manutenção', 'Outros'];
  const UNIDADES   = ['un', 'pct', 'cx', 'rolo', 'par', 'jogo', 'L', 'kg', 'g'];

  // Ícones por categoria
  const ICONES_CAT = {
    'Amenities':    '🧴',
    'Cama e banho': '🛏️',
    'Copa':         '☕',
    'Limpeza':      '🧹',
    'Manutenção':   '🔧',
    'Outros':       '📦',
  };

  // ─── Utilitários ─────────────────────────────────────────────────────────────

  function _statusItem(item) {
    const pct = item.minimo > 0 ? (item.quantidade / item.minimo) : 999;
    if (item.quantidade === 0)  return { label: 'Zerado',       classe: 'badge-vermelho', nivel: 0 };
    if (pct < 0.5)              return { label: 'Crítico',      classe: 'badge-vermelho', nivel: 1 };
    if (pct < 1)                return { label: 'Estoque baixo',classe: 'badge-amarelo',  nivel: 2 };
    return                             { label: 'OK',           classe: 'badge-verde',    nivel: 3 };
  }

  function _formatarMoeda(v) {
    return v != null ? 'R$ ' + Number(v).toFixed(2).replace('.', ',') : '—';
  }

  // ─── KPIs do cabeçalho ───────────────────────────────────────────────────────

  function _calcKpis(itens) {
    const total   = itens.length;
    const baixo   = itens.filter(i => _statusItem(i).nivel <= 2).length;
    const zerado  = itens.filter(i => i.quantidade === 0).length;
    const valorTotal = itens.reduce((acc, i) => acc + (i.quantidade * (i.custo || 0)), 0);
    return { total, baixo, zerado, valorTotal };
  }

  // ─── Render da tabela ────────────────────────────────────────────────────────

  function _renderTabela(itens, filtro) {
    let lista = [...itens];

    if (filtro.categoria) lista = lista.filter(i => i.categoria === filtro.categoria);
    if (filtro.busca)     lista = lista.filter(i => (i.nome || '').toLowerCase().includes(filtro.busca.toLowerCase()));
    if (filtro.alerta)    lista = lista.filter(i => _statusItem(i).nivel <= 2);

    // Ordena: críticos primeiro, depois por nome
    lista.sort((a, b) => {
      const da = _statusItem(a).nivel;
      const db = _statusItem(b).nivel;
      if (da !== db) return da - db;
      return (a.nome || '').localeCompare(b.nome || '', 'pt-BR');
    });

    if (lista.length === 0) {
      return `<div class="vazio">Nenhum item encontrado para os filtros selecionados.</div>`;
    }

    const linhas = lista.map(item => {
      const st = _statusItem(item);
      const pctBar = item.minimo > 0 ? Math.min(100, Math.round((item.quantidade / item.minimo) * 100)) : 100;
      const corBar = st.nivel === 0 ? '#ef4444' : st.nivel === 1 ? '#ef4444' : st.nivel === 2 ? '#f59e0b' : '#22c55e';
      const icone  = ICONES_CAT[item.categoria] || '📦';

      return `
        <tr data-id="${esc(item.id)}">
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:1.1rem;">${icone}</span>
              <div>
                <div style="font-weight:600;font-size:0.9rem;">${esc(item.nome)}</div>
                <div style="font-size:0.75rem;color:var(--texto-muted);">${esc(item.categoria)}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <strong style="font-size:1.05rem;">${item.quantidade}</strong>
              <span style="color:var(--texto-muted);font-size:0.8rem;">${esc(item.unidade || 'un')}</span>
            </div>
            <div style="margin-top:4px;background:var(--cinza-claro);border-radius:4px;height:5px;width:80px;overflow:hidden;">
              <div style="width:${pctBar}%;height:100%;background:${corBar};border-radius:4px;transition:.3s;"></div>
            </div>
          </td>
          <td style="color:var(--texto-muted);font-size:0.85rem;">${item.minimo} ${esc(item.unidade || 'un')}</td>
          <td><span class="badge ${st.classe}">${st.label}</span></td>
          <td style="font-size:0.85rem;">${_formatarMoeda(item.custo)}<span style="color:var(--texto-muted);font-size:0.75rem;">/${esc(item.unidade || 'un')}</span></td>
          <td style="font-size:0.82rem;color:var(--texto-suave);">${esc(item.fornecedor || '—')}</td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap;">
              <button class="btn btn-sm" style="background:rgba(34,197,94,0.12);color:#16a34a;border:none;cursor:pointer;border-radius:6px;padding:4px 8px;font-size:0.8rem;"
                      onclick="Estoque._movimentar('${esc(item.id)}','entrada')" title="Registrar entrada">
                ＋ Entrada
              </button>
              <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:#dc2626;border:none;cursor:pointer;border-radius:6px;padding:4px 8px;font-size:0.8rem;"
                      onclick="Estoque._movimentar('${esc(item.id)}','saida')" title="Registrar saída">
                − Saída
              </button>
              <button class="btn btn-sm btn-secundario btn-editar-item" data-id="${esc(item.id)}" title="Editar item" style="padding:4px 8px;font-size:0.8rem;">✏️</button>
              <button class="btn btn-sm btn-perigo btn-excluir-item"   data-id="${esc(item.id)}" title="Excluir item" style="padding:4px 8px;font-size:0.8rem;">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantidade</th>
              <th>Mínimo</th>
              <th>Status</th>
              <th>Custo unit.</th>
              <th>Fornecedor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
      <p class="text-sm text-muted" style="margin-top:.6rem;">${lista.length} item${lista.length !== 1 ? 's' : ''} encontrado${lista.length !== 1 ? 's' : ''}.</p>
    `;
  }

  // ─── Modal de movimentação (entrada ou saída) ────────────────────────────────

  function _movimentar(id, tipo) {
    const item = Store.getById('estoque', id);
    if (!item) return;

    const isEntrada = tipo === 'entrada';
    const cor = isEntrada ? '#16a34a' : '#dc2626';
    const emoji = isEntrada ? '📥' : '📤';
    const titulo = isEntrada ? `Entrada de estoque — ${esc(item.nome)}` : `Saída de estoque — ${esc(item.nome)}`;

    abrirModal(`
      <div style="padding:1.5rem;">
        <h2 style="margin-bottom:.5rem;font-size:1.15rem;color:${cor};">${emoji} ${titulo}</h2>
        <p style="margin-bottom:1.25rem;color:var(--texto-muted);font-size:0.88rem;">
          Estoque atual: <strong>${item.quantidade} ${esc(item.unidade || 'un')}</strong>
          &nbsp;·&nbsp; Mínimo: <strong>${item.minimo} ${esc(item.unidade || 'un')}</strong>
        </p>
        <div class="form-group">
          <label class="form-label" for="mov-quantidade">Quantidade a ${isEntrada ? 'adicionar' : 'retirar'}</label>
          <input class="form-input" id="mov-quantidade" type="number" min="1" max="${isEntrada ? 9999 : item.quantidade}"
                 placeholder="Ex: 10" value="1" autofocus>
        </div>
        <div class="form-group">
          <label class="form-label" for="mov-motivo">Motivo (opcional)</label>
          <input class="form-input" id="mov-motivo" type="text"
                 placeholder="${isEntrada ? 'Ex: Compra no Atacadão' : 'Ex: Uso nos flats'}">
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.25rem;">
          <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button type="button" class="btn btn-primario" style="background:${cor};border-color:${cor};"
                  id="btn-confirmar-mov">Confirmar ${isEntrada ? 'entrada' : 'saída'}</button>
        </div>
      </div>
    `, '420px');

    document.getElementById('btn-confirmar-mov')?.addEventListener('click', () => {
      const qtd    = parseInt(document.getElementById('mov-quantidade')?.value || '0', 10);
      const motivo = (document.getElementById('mov-motivo')?.value || '').trim();

      if (!qtd || qtd < 1) {
        toast('Informe uma quantidade válida.', 'erro');
        return;
      }

      let novaQtd = isEntrada ? item.quantidade + qtd : item.quantidade - qtd;
      if (novaQtd < 0) {
        toast(`Estoque insuficiente. Disponível: ${item.quantidade} ${item.unidade || 'un'}.`, 'erro');
        return;
      }

      Store.atualizar('estoque', id, { quantidade: novaQtd }, true);
      fecharModal();

      const tipoPtBr = isEntrada ? 'Entrada' : 'Saída';
      toast(`${tipoPtBr} registrada: ${qtd} ${item.unidade || 'un'} de "${item.nome}".`, 'sucesso', 4000);

      // Alerta pós-saída se ficou baixo
      if (!isEntrada) {
        const st = _statusItem({ ...item, quantidade: novaQtd });
        if (st.nivel <= 2) {
          setTimeout(() => toast(`⚠️ Estoque baixo! "${item.nome}" está com apenas ${novaQtd} ${item.unidade || 'un'}.`, 'aviso', 6000), 500);
        }
      }

      _atualizarTabela();
    });

    // Confirmar com Enter
    document.getElementById('mov-quantidade')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-confirmar-mov')?.click();
    });
  }

  // ─── Modal de formulário novo/editar item ────────────────────────────────────

  function _abrirFormulario(itemExistente = null) {
    const editando = !!itemExistente;
    const r = itemExistente || {};
    const titulo = editando ? 'Editar Item' : 'Novo Item de Estoque';
    const sel = (v, op) => v === op ? 'selected' : '';

    abrirModal(`
      <div style="padding:1.5rem;">
        <h2 style="margin-bottom:1.25rem;font-size:1.2rem;">📦 ${titulo}</h2>
        <form id="form-estoque" novalidate>
          <input type="hidden" id="est-id" value="${esc(r.id || '')}">

          <div class="form-row">
            <div class="form-group" style="flex:3;">
              <label class="form-label" for="est-nome">Nome do item <span style="color:#dc3545">*</span></label>
              <input class="form-input" id="est-nome" type="text"
                     placeholder="Ex: Shampô individual" value="${esc(r.nome || '')}" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="est-unidade">Unidade</label>
              <select class="form-select" id="est-unidade">
                ${UNIDADES.map(u => `<option value="${u}" ${sel(r.unidade, u)}>${u}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="est-categoria">Categoria</label>
            <select class="form-select" id="est-categoria">
              ${CATEGORIAS.map(c => `<option value="${c}" ${sel(r.categoria, c)}>${ICONES_CAT[c] || '📦'} ${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="est-quantidade">Quantidade atual <span style="color:#dc3545">*</span></label>
              <input class="form-input" id="est-quantidade" type="number" min="0"
                     placeholder="0" value="${r.quantidade != null ? r.quantidade : ''}" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="est-minimo">Quantidade mínima (alerta)</label>
              <input class="form-input" id="est-minimo" type="number" min="1"
                     placeholder="Ex: 20" value="${r.minimo != null ? r.minimo : ''}">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="est-custo">Custo unitário (R$)</label>
              <input class="form-input" id="est-custo" type="number" min="0" step="0.01"
                     placeholder="0,00" value="${r.custo != null ? r.custo : ''}">
            </div>
            <div class="form-group" style="flex:2;">
              <label class="form-label" for="est-fornecedor">Fornecedor</label>
              <input class="form-input" id="est-fornecedor" type="text"
                     placeholder="Ex: Atacadão" value="${esc(r.fornecedor || '')}">
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.25rem;">
            <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primario">${editando ? 'Salvar alterações' : 'Adicionar item'}</button>
          </div>
        </form>
      </div>
    `, '560px');

    document.getElementById('form-estoque')?.addEventListener('submit', e => {
      e.preventDefault();
      _salvarItem(editando);
    });
  }

  // ─── Salvar item ─────────────────────────────────────────────────────────────

  function _salvarItem(editando) {
    const id         = (document.getElementById('est-id')?.value       || '').trim();
    const nome       = (document.getElementById('est-nome')?.value      || '').trim();
    const unidade    = (document.getElementById('est-unidade')?.value   || 'un').trim();
    const categoria  = (document.getElementById('est-categoria')?.value || 'Outros').trim();
    const quantidade = parseInt(document.getElementById('est-quantidade')?.value || '0', 10);
    const minimo     = parseInt(document.getElementById('est-minimo')?.value     || '0', 10);
    const custo      = parseFloat(document.getElementById('est-custo')?.value    || '0') || 0;
    const fornecedor = (document.getElementById('est-fornecedor')?.value || '').trim();

    if (!nome) {
      toast('Informe o nome do item.', 'erro');
      document.getElementById('est-nome')?.focus();
      return;
    }
    if (isNaN(quantidade) || quantidade < 0) {
      toast('Informe uma quantidade válida.', 'erro');
      return;
    }

    const dados = { nome, unidade, categoria, quantidade, minimo: isNaN(minimo) ? 0 : minimo, custo, fornecedor };

    if (editando && id) {
      Store.atualizar('estoque', id, dados);
      toast('Item atualizado com sucesso!', 'sucesso');
    } else {
      Store.adicionar('estoque', dados);
      toast('Item adicionado ao estoque!', 'sucesso');
    }

    fecharModal();
    _atualizarTabela();
  }

  // ─── Atualiza tabela ─────────────────────────────────────────────────────────

  let _filtroAtual = { categoria: '', busca: '', alerta: false };

  function _atualizarTabela() {
    const container = document.getElementById('estoque-tabela-container');
    const kpiContainer = document.getElementById('estoque-kpis');
    const itens = Store.get('estoque') || [];

    if (kpiContainer) kpiContainer.innerHTML = _renderKpis(itens);
    if (container)    container.innerHTML    = _renderTabela(itens, _filtroAtual);
    _bindTabelaEventos();
  }

  function _bindTabelaEventos() {
    const container = document.getElementById('estoque-tabela-container');
    if (!container) return;
    const novo = container.cloneNode(true);
    container.parentNode.replaceChild(novo, container);
    const el = document.getElementById('estoque-tabela-container');

    el.addEventListener('click', e => {
      const btnEditar  = e.target.closest('.btn-editar-item');
      const btnExcluir = e.target.closest('.btn-excluir-item');
      if (btnEditar) {
        const item = Store.getById('estoque', btnEditar.dataset.id);
        if (item) _abrirFormulario(item);
      }
      if (btnExcluir) {
        const item = Store.getById('estoque', btnExcluir.dataset.id);
        if (item && confirmarExclusao(item.nome)) {
          Store.excluir('estoque', btnExcluir.dataset.id);
          toast('Item removido do estoque.', 'sucesso');
          _atualizarTabela();
        }
      }
    });
  }

  // ─── KPIs topo ───────────────────────────────────────────────────────────────

  function _renderKpis(itens) {
    const { total, baixo, zerado, valorTotal } = _calcKpis(itens);
    return `
      <div class="mini-cards" style="margin-bottom:1.25rem;">
        <div class="mini-card">
          <div class="mini-card-num" style="color:var(--azul-profundo);">${total}</div>
          <div class="mini-card-label">Itens cadastrados</div>
        </div>
        <div class="mini-card" style="${baixo > 0 ? 'border-top:3px solid #f59e0b;' : ''}">
          <div class="mini-card-num" style="color:${baixo > 0 ? '#d97706' : '#22c55e'};">${baixo}</div>
          <div class="mini-card-label">Abaixo do mínimo</div>
        </div>
        <div class="mini-card" style="${zerado > 0 ? 'border-top:3px solid #ef4444;' : ''}">
          <div class="mini-card-num" style="color:${zerado > 0 ? '#dc2626' : 'var(--texto-muted)'};">${zerado}</div>
          <div class="mini-card-label">Zerados</div>
        </div>
        <div class="mini-card">
          <div class="mini-card-num" style="color:var(--azul-profundo);font-size:1.2rem;">${_formatarMoeda(valorTotal)}</div>
          <div class="mini-card-label">Valor total em estoque</div>
        </div>
      </div>
    `;
  }

  // ─── Render principal da página ───────────────────────────────────────────────

  function render() {
    _filtroAtual = { categoria: '', busca: '', alerta: false };
    const itens  = Store.get('estoque') || [];

    // Banners de alerta para itens críticos
    const criticos = itens.filter(i => _statusItem(i).nivel <= 1);
    const bannerAlerta = criticos.length > 0 ? `
      <div style="background:linear-gradient(135deg,#fef2f2,#fff7ed);border:1px solid #fca5a5;border-radius:var(--radius);padding:12px 16px;margin-bottom:1.25rem;display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.4rem;">🚨</span>
        <div>
          <strong style="color:#dc2626;font-size:0.9rem;">Atenção! ${criticos.length} item${criticos.length > 1 ? 's' : ''} em nível crítico</strong>
          <div style="font-size:0.8rem;color:#6b7280;margin-top:2px;">
            ${criticos.slice(0, 3).map(i => `<strong>${esc(i.nome)}</strong>: ${i.quantidade} ${esc(i.unidade || 'un')} (mín: ${i.minimo})`).join(' &nbsp;·&nbsp; ')}
            ${criticos.length > 3 ? ` e mais ${criticos.length - 3}...` : ''}
          </div>
        </div>
        <button class="btn btn-sm" style="margin-left:auto;white-space:nowrap;background:rgba(220,38,38,0.1);color:#dc2626;border:1px solid #fca5a5;"
                id="btn-filtrar-alertas">Ver apenas críticos</button>
      </div>
    ` : '';

    const html = `
      <!-- ═══ CABEÇALHO ═══ -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Estoque</h1>
          <p class="page-subtitle">Controle de insumos, amenities e materiais do Calamar Flats</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primario" id="btn-novo-item">➕ Novo Item</button>
        </div>
      </div>

      <!-- ═══ ALERTA CRÍTICO ═══ -->
      ${bannerAlerta}

      <!-- ═══ KPIs ═══ -->
      <div id="estoque-kpis">${_renderKpis(itens)}</div>

      <!-- ═══ FILTROS ═══ -->
      <div class="card filtros" style="padding:1rem 1.25rem;margin-bottom:1.25rem;">
        <div style="display:flex;flex-wrap:wrap;gap:.85rem;align-items:flex-end;">

          <div class="form-group" style="flex:1;min-width:160px;margin-bottom:0;">
            <label class="form-label" for="filtro-est-categoria">Categoria</label>
            <select class="form-select" id="filtro-est-categoria">
              <option value="">Todas</option>
              ${CATEGORIAS.map(c => `<option value="${c}">${ICONES_CAT[c] || '📦'} ${c}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="flex:2;min-width:200px;margin-bottom:0;">
            <label class="form-label" for="filtro-est-busca">Buscar item</label>
            <input class="form-input" id="filtro-est-busca" type="search" placeholder="Nome do item...">
          </div>

          <div class="form-group" style="flex:0;margin-bottom:0;display:flex;align-items:flex-end;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.85rem;color:var(--texto-suave);white-space:nowrap;padding:8px 12px;border:1px solid var(--cinza-claro);border-radius:var(--radius-sm);background:var(--creme);">
              <input type="checkbox" id="filtro-est-alertas" style="width:14px;height:14px;">
              ⚠️ Apenas abaixo do mínimo
            </label>
          </div>

          <button class="btn btn-secundario btn-sm" id="btn-limpar-filtros-est" style="margin-bottom:0;">✕ Limpar</button>
        </div>
      </div>

      <!-- ═══ TABELA ═══ -->
      <div id="estoque-tabela-container">
        ${_renderTabela(itens, _filtroAtual)}
      </div>
    `;

    document.getElementById('page-container').innerHTML = html;

    // ── Binds ──────────────────────────────────────────────────────────────────
    document.getElementById('btn-novo-item')?.addEventListener('click', () => _abrirFormulario());

    const aplicarFiltros = () => {
      _filtroAtual.categoria = document.getElementById('filtro-est-categoria')?.value || '';
      _filtroAtual.busca     = document.getElementById('filtro-est-busca')?.value     || '';
      _filtroAtual.alerta    = document.getElementById('filtro-est-alertas')?.checked  || false;
      _atualizarTabela();
    };

    document.getElementById('filtro-est-categoria')?.addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-est-alertas')?.addEventListener('change', aplicarFiltros);

    let _debounce;
    document.getElementById('filtro-est-busca')?.addEventListener('input', () => {
      clearTimeout(_debounce);
      _debounce = setTimeout(aplicarFiltros, 250);
    });

    document.getElementById('btn-limpar-filtros-est')?.addEventListener('click', () => {
      _filtroAtual = { categoria: '', busca: '', alerta: false };
      document.getElementById('filtro-est-categoria').value   = '';
      document.getElementById('filtro-est-busca').value       = '';
      document.getElementById('filtro-est-alertas').checked   = false;
      _atualizarTabela();
    });

    document.getElementById('btn-filtrar-alertas')?.addEventListener('click', () => {
      _filtroAtual.alerta = true;
      document.getElementById('filtro-est-alertas').checked = true;
      _atualizarTabela();
    });

    _bindTabelaEventos();
  }

  // ─── API Pública ─────────────────────────────────────────────────────────────
  return { render, _movimentar };

})();
