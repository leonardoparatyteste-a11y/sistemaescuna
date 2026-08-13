/**
 * tarefas.js — Módulo de Gerenciamento de Tarefas
 * Calamar Flats — Painel Operacional
 *
 * Responsabilidades:
 *  - Listar tarefas agrupadas por status temporal (Vencidas, Hoje, Próximas, Concluídas)
 *  - Filtrar por status e categoria
 *  - Criar, editar, excluir e concluir tarefas
 */

const Tarefas = (() => {

  // ─── Estado local do módulo ──────────────────────────────────────────────────
  let _filtroStatus   = 'Todos';
  let _filtroCategoria = 'Todas';

  // ─── Dados auxiliares ────────────────────────────────────────────────────────
  const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Urgente'];
  const CATEGORIAS  = ['Recepção', 'Limpeza', 'Manutenção', 'Compras', 'Administrativo', 'Atendimento ao hóspede'];
  const STATUS_LIST = ['Pendente', 'Em andamento', 'Concluída'];

  // Mapeamento de prioridade → classe de badge
  const BADGE_PRIORIDADE = {
    'Baixa'   : 'badge-verde',
    'Média'   : 'badge-amarelo',
    'Alta'    : 'badge-laranja',
    'Urgente' : 'badge-vermelho badge-urgente',
  };

  // Mapeamento de categoria → classe de badge
  const BADGE_CATEGORIA = {
    'Recepção'              : 'badge-azul',
    'Limpeza'               : 'badge-verde',
    'Manutenção'            : 'badge-laranja',
    'Compras'               : 'badge-amarelo',
    'Administrativo'        : 'badge-roxo',
    'Atendimento ao hóspede': 'badge-cinza',
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Verifica se uma tarefa está vencida (prazo passou e não está concluída).
   * @param {object} t - Tarefa
   * @returns {boolean}
   */
  function _estaVencidaTarefa(t) {
    return t.status !== 'Concluída' && t.prazo && estaVencida(t.prazo);
  }

  /**
   * Agrupa um array de tarefas nas quatro seções da UI.
   * @param {object[]} tarefas
   * @returns {{ vencidas, hoje, proximas, concluidas }}
   */
  function _agrupar(tarefas) {
    const dHoje = hoje();
    return {
      vencidas  : tarefas.filter(t => _estaVencidaTarefa(t)),
      hoje      : tarefas.filter(t => t.prazo === dHoje && t.status !== 'Concluída'),
      proximas  : tarefas.filter(t => t.prazo > dHoje && t.status !== 'Concluída'),
      concluidas: tarefas.filter(t => t.status === 'Concluída'),
    };
  }

  /**
   * Aplica os filtros de status e categoria sobre a lista completa.
   * @returns {object[]}
   */
  function _tarefasFiltradas() {
    return Store.get('tarefas').filter(t => {
      const okStatus    = _filtroStatus    === 'Todos'  || t.status    === _filtroStatus;
      const okCategoria = _filtroCategoria === 'Todas'  || t.categoria === _filtroCategoria;
      return okStatus && okCategoria;
    });
  }

  // ─── Render de seções de tarefas ─────────────────────────────────────────────

  /**
   * Gera o HTML de um único card de tarefa.
   */
  function _htmlCard(t) {
    const concluida  = t.status === 'Concluída';
    const vencida    = _estaVencidaTarefa(t);
    const dHoje      = hoje();

    // Rótulo de prazo
    let labelPrazo = t.prazo ? formatarData(t.prazo) : '—';
    if (vencida)        labelPrazo += ' <span class="badge badge-vermelho">VENCIDA</span>';
    else if (t.prazo === dHoje) labelPrazo += ' <span class="badge badge-amarelo">HOJE</span>';

    const cardClass    = concluida ? 'card tarefa-card tarefa-concluida' :
                         vencida   ? 'card tarefa-card tarefa-vencida'   : 'card tarefa-card';
    const tituloStyle  = concluida ? 'style="text-decoration:line-through;opacity:.6"' : '';
    const descTruncada = t.descricao
      ? (t.descricao.length > 120 ? esc(t.descricao.slice(0, 120)) + '…' : esc(t.descricao))
      : '<span class="text-muted">Sem descrição</span>';

    return `
      <div class="${cardClass}" data-id="${esc(t.id)}">
        <div class="tarefa-header">
          <span class="tarefa-titulo" ${tituloStyle}>${esc(t.titulo)}</span>
          <div class="tarefa-badges">
            <span class="badge ${BADGE_CATEGORIA[t.categoria] || 'badge-cinza'}">${esc(t.categoria)}</span>
            <span class="badge ${BADGE_PRIORIDADE[t.prioridade] || 'badge-cinza'}">${esc(t.prioridade)}</span>
          </div>
        </div>
        <p class="tarefa-desc text-sm text-muted">${descTruncada}</p>
        <div class="tarefa-meta text-sm">
          <span>👤 ${esc(t.responsavel || '—')}</span>
          <span>📅 ${labelPrazo}</span>
          ${concluida && t.concluidaEm ? `<span class="text-muted">Concluída em ${formatarDataHora(t.concluidaEm)}</span>` : ''}
        </div>
        <div class="tarefa-acoes">
          ${!concluida
            ? `<button class="btn btn-sm btn-primario btn-concluir" data-id="${esc(t.id)}" title="Marcar como concluída">✓ Concluir</button>`
            : ''}
          <button class="btn btn-sm btn-secundario btn-editar-tarefa" data-id="${esc(t.id)}" title="Editar tarefa">✏️ Editar</button>
          <button class="btn btn-sm btn-perigo btn-excluir-tarefa" data-id="${esc(t.id)}" title="Excluir tarefa">🗑️</button>
        </div>
      </div>`;
  }

  /**
   * Gera o HTML de uma seção (ex: "VENCIDAS").
   */
  function _htmlSecao(titulo, icone, tarefas, extra = '') {
    if (tarefas.length === 0) return '';
    return `
      <div class="tarefa-secao ${extra}">
        <h3 class="tarefa-secao-titulo">${icone} ${titulo} <span class="badge badge-cinza">${tarefas.length}</span></h3>
        <div class="tarefa-lista">
          ${tarefas.map(_htmlCard).join('')}
        </div>
      </div>`;
  }

  // ─── HTML principal ───────────────────────────────────────────────────────────

  function _htmlPrincipal() {
    const filtradas = _tarefasFiltradas();
    const grupos    = _agrupar(filtradas);
    const total     = Store.get('tarefas').length;

    const semResultados = Object.values(grupos).every(g => g.length === 0);

    // Tabs de status
    const abas = ['Todos', 'Pendente', 'Em andamento', 'Concluída'];
    const htmlAbas = abas.map(a =>
      `<button class="btn btn-sm ${_filtroStatus === a ? 'btn-primario' : 'btn-secundario'} btn-filtro-status" data-status="${esc(a)}">${a}</button>`
    ).join('');

    // Select de categoria
    const htmlCats = ['Todas', ...CATEGORIAS].map(c =>
      `<option value="${esc(c)}" ${_filtroCategoria === c ? 'selected' : ''}>${esc(c)}</option>`
    ).join('');

    return `
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <h1 class="page-title">📋 Tarefas</h1>
          <p class="page-subtitle">${total} tarefa${total !== 1 ? 's' : ''} cadastrada${total !== 1 ? 's' : ''}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primario" id="btn-nova-tarefa">+ Nova Tarefa</button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filtros" style="gap:.5rem;flex-wrap:wrap;align-items:center;">
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;">${htmlAbas}</div>
        <select class="form-select" id="filtro-categoria" style="width:auto;min-width:180px;">
          ${htmlCats}
        </select>
      </div>

      <!-- Conteúdo agrupado -->
      <div id="tarefas-conteudo" style="margin-top:1rem;">
        ${semResultados
          ? '<div class="vazio">Nenhuma tarefa encontrada para os filtros selecionados.</div>'
          : `
            ${_htmlSecao('VENCIDAS', '⚠️', grupos.vencidas, 'secao-vencidas')}
            ${_htmlSecao('HOJE', '📅', grupos.hoje, 'secao-hoje')}
            ${_htmlSecao('PRÓXIMAS', '📋', grupos.proximas)}
            ${grupos.concluidas.length > 0 ? `
              <details class="tarefa-secao secao-concluidas">
                <summary class="tarefa-secao-titulo" style="cursor:pointer;">
                  ✅ CONCLUÍDAS <span class="badge badge-cinza">${grupos.concluidas.length}</span>
                </summary>
                <div class="tarefa-lista" style="margin-top:.75rem;">
                  ${grupos.concluidas.map(_htmlCard).join('')}
                </div>
              </details>` : ''}
          `}
      </div>`;
  }

  // ─── Modal de Nova/Editar Tarefa ──────────────────────────────────────────────

  function _abrirModalTarefa(id = null) {
    const tarefa = id ? Store.getById('tarefas', id) : null;
    const titulo = tarefa ? 'Editar Tarefa' : 'Nova Tarefa';

    const v = tarefa || {
      titulo: '', descricao: '', prazo: '', prioridade: 'Média',
      responsavel: '', categoria: 'Recepção', status: 'Pendente',
    };

    const optsP = PRIORIDADES.map(p =>
      `<option value="${esc(p)}" ${v.prioridade === p ? 'selected' : ''}>${esc(p)}</option>`
    ).join('');
    const optsC = CATEGORIAS.map(c =>
      `<option value="${esc(c)}" ${v.categoria === c ? 'selected' : ''}>${esc(c)}</option>`
    ).join('');
    const optsS = STATUS_LIST.map(s =>
      `<option value="${esc(s)}" ${v.status === s ? 'selected' : ''}>${esc(s)}</option>`
    ).join('');

    const html = `
      <h2 style="margin-bottom:1.25rem;">${titulo}</h2>
      <form id="form-tarefa" autocomplete="off">
        <input type="hidden" id="tarefa-id" value="${id || ''}">

        <div class="form-group">
          <label class="form-label">Título <span style="color:var(--perigo)">*</span></label>
          <input class="form-input" id="t-titulo" type="text" value="${esc(v.titulo)}" placeholder="Ex: Comprar produtos de limpeza" maxlength="120">
        </div>

        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea class="form-textarea" id="t-descricao" rows="3" placeholder="Detalhes adicionais…">${esc(v.descricao)}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Prazo <span style="color:var(--perigo)">*</span></label>
            <input class="form-input" id="t-prazo" type="date" value="${esc(v.prazo)}">
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade</label>
            <select class="form-select" id="t-prioridade">${optsP}</select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Responsável</label>
            <input class="form-input" id="t-responsavel" type="text" value="${esc(v.responsavel)}" placeholder="Nome do responsável">
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-select" id="t-categoria">${optsC}</select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="t-status">${optsS}</select>
        </div>

        <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem;">
          <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button type="submit" class="btn btn-primario">💾 Salvar</button>
        </div>
      </form>`;

    abrirModal(html, '560px');

    // Listener de submit dentro do modal
    document.getElementById('form-tarefa').addEventListener('submit', e => {
      e.preventDefault();
      _salvarTarefa();
    });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  function _salvarTarefa() {
    const id        = document.getElementById('tarefa-id').value.trim();
    const titulo    = document.getElementById('t-titulo').value.trim();
    const descricao = document.getElementById('t-descricao').value.trim();
    const prazo     = document.getElementById('t-prazo').value;
    const prioridade= document.getElementById('t-prioridade').value;
    const responsavel=document.getElementById('t-responsavel').value.trim();
    const categoria = document.getElementById('t-categoria').value;
    const status    = document.getElementById('t-status').value;

    // Validação
    if (!titulo) { toast('Informe o título da tarefa.', 'aviso'); return; }
    if (!prazo)  { toast('Informe o prazo da tarefa.',  'aviso'); return; }

    const dados = { titulo, descricao, prazo, prioridade, responsavel, categoria, status };

    if (id) {
      // Se status mudou para Concluída e ainda não tem timestamp
      if (status === 'Concluída') {
        const atual = Store.getById('tarefas', id);
        if (atual && atual.status !== 'Concluída') dados.concluidaEm = new Date().toISOString();
      }
      Store.atualizar('tarefas', id, dados);
      toast('Tarefa atualizada com sucesso!', 'sucesso');
    } else {
      Store.adicionar('tarefas', dados);
      toast('Tarefa criada com sucesso!', 'sucesso');
    }

    fecharModal();
    _renderConteudo(); // re-render sem desmontar toda a página
  }

  function _concluirTarefa(id) {
    const t = Store.getById('tarefas', id);
    if (!t) return;
    Store.atualizar('tarefas', id, { status: 'Concluída', concluidaEm: new Date().toISOString() });
    toast(`Tarefa "${t.titulo}" marcada como concluída! ✅`, 'sucesso');
    _renderConteudo();
  }

  function _excluirTarefa(id) {
    const t = Store.getById('tarefas', id);
    if (!t) return;
    if (!confirmarExclusao(t.titulo)) return;
    Store.excluir('tarefas', id);
    toast('Tarefa excluída.', 'info');
    _renderConteudo();
  }

  // ─── Re-render parcial (só o conteúdo, sem recriar a página inteira) ──────────

  function _renderConteudo() {
    const container = document.getElementById('page-container');
    if (!container) return;

    // Atualiza apenas o bloco de conteúdo
    const contDiv = document.getElementById('tarefas-conteudo');
    if (contDiv) {
      const filtradas = _tarefasFiltradas();
      const grupos    = _agrupar(filtradas);
      const semResultados = Object.values(grupos).every(g => g.length === 0);

      contDiv.innerHTML = semResultados
        ? '<div class="vazio">Nenhuma tarefa encontrada para os filtros selecionados.</div>'
        : `
          ${_htmlSecao('VENCIDAS', '⚠️', grupos.vencidas, 'secao-vencidas')}
          ${_htmlSecao('HOJE', '📅', grupos.hoje, 'secao-hoje')}
          ${_htmlSecao('PRÓXIMAS', '📋', grupos.proximas)}
          ${grupos.concluidas.length > 0 ? `
            <details class="tarefa-secao secao-concluidas">
              <summary class="tarefa-secao-titulo" style="cursor:pointer;">
                ✅ CONCLUÍDAS <span class="badge badge-cinza">${grupos.concluidas.length}</span>
              </summary>
              <div class="tarefa-lista" style="margin-top:.75rem;">
                ${grupos.concluidas.map(_htmlCard).join('')}
              </div>
            </details>` : ''}`;

      // Atualiza subtitle
      const total = Store.get('tarefas').length;
      const sub = container.querySelector('.page-subtitle');
      if (sub) sub.textContent = `${total} tarefa${total !== 1 ? 's' : ''} cadastrada${total !== 1 ? 's' : ''}`;
    }
  }

  // ─── Event delegation ─────────────────────────────────────────────────────────

  function _bindEventos() {
    const container = document.getElementById('page-container');
    if (!container) return;

    container.addEventListener('click', e => {
      // Nova tarefa
      if (e.target.id === 'btn-nova-tarefa') {
        _abrirModalTarefa();
        return;
      }

      // Filtro por status (tabs)
      const btnStatus = e.target.closest('.btn-filtro-status');
      if (btnStatus) {
        _filtroStatus = btnStatus.dataset.status;
        container.innerHTML = _htmlPrincipal();
        _bindEventos();
        return;
      }

      // Concluir
      const btnConcluir = e.target.closest('.btn-concluir');
      if (btnConcluir) {
        _concluirTarefa(btnConcluir.dataset.id);
        return;
      }

      // Editar
      const btnEditar = e.target.closest('.btn-editar-tarefa');
      if (btnEditar) {
        _abrirModalTarefa(btnEditar.dataset.id);
        return;
      }

      // Excluir
      const btnExcluir = e.target.closest('.btn-excluir-tarefa');
      if (btnExcluir) {
        _excluirTarefa(btnExcluir.dataset.id);
        return;
      }
    });

    // Filtro de categoria (change)
    container.addEventListener('change', e => {
      if (e.target.id === 'filtro-categoria') {
        _filtroCategoria = e.target.value;
        _renderConteudo();
      }
    });
  }

  // ─── render() público ─────────────────────────────────────────────────────────

  function render() {
    // Verifica permissão
    if (!Store.temPermissao('tarefas')) {
      document.getElementById('page-container').innerHTML =
        '<div class="vazio">⛔ Você não tem permissão para acessar este módulo.</div>';
      return;
    }

    // Injeta estilos específicos do módulo (idempotente)
    if (!document.getElementById('tarefas-styles')) {
      const style = document.createElement('style');
      style.id = 'tarefas-styles';
      style.textContent = `
        .tarefa-card {
          padding: 1rem 1.25rem;
          margin-bottom: .75rem;
          transition: box-shadow .2s;
        }
        .tarefa-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
        .tarefa-vencida { border-left: 4px solid var(--perigo); background: #fff5f5; }
        .tarefa-concluida { opacity: .7; background: #f9f9f9; }
        .tarefa-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: .5rem;
          flex-wrap: wrap;
        }
        .tarefa-titulo { font-weight: 600; font-size: 1rem; flex: 1; }
        .tarefa-badges { display: flex; gap: .35rem; flex-wrap: wrap; }
        .tarefa-desc { margin: .5rem 0; }
        .tarefa-meta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          color: var(--texto-secundario);
          margin: .4rem 0;
        }
        .tarefa-acoes { display: flex; gap: .5rem; margin-top: .75rem; flex-wrap: wrap; }
        .tarefa-secao { margin-bottom: 2rem; }
        .tarefa-secao-titulo {
          font-size: .85rem;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--texto-secundario);
          margin-bottom: .75rem;
          display: flex;
          align-items: center;
          gap: .5rem;
        }
        .secao-vencidas .tarefa-secao-titulo { color: var(--perigo); }
        .secao-hoje .tarefa-secao-titulo { color: var(--aviso); }
        details.tarefa-secao > summary { list-style: none; }
        details.tarefa-secao > summary::-webkit-details-marker { display: none; }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('page-container').innerHTML = _htmlPrincipal();
    _bindEventos();
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return { render };
})();
