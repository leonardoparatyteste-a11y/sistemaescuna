/**
 * manutencao.js — Módulo de Manutenção
 * Calamar Flats — Painel Operacional
 *
 * Gerencia chamados de manutenção: abertura, edição, resolução e exclusão.
 * Cards ordenados por prioridade (Urgente → Alta → Média → Baixa).
 */

const Manutencao = (() => {

  // ─── Constantes ───────────────────────────────────────────────────────────

  /** Ordem de prioridade para ordenação (menor índice = mais urgente) */
  const PRIORIDADE_ORDEM = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };

  /** Badge CSS por prioridade */
  const PRIORIDADE_BADGE = {
    'Urgente': 'badge-urgente',   // pulsa
    'Alta':    'badge-vermelho',
    'Média':   'badge-amarelo',
    'Baixa':   'badge-verde',
  };

  /** Badge CSS por status */
  const STATUS_BADGE = {
    'Aberto':             'badge-cinza',
    'Em análise':         'badge-azul',
    'Em andamento':       'badge-laranja',
    'Aguardando material':'badge-roxo',
    'Resolvido':          'badge-verde',
  };

  // Estado dos filtros (persiste entre re-renders sem reload)
  let filtros = { flat: '', status: '', prioridade: '' };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Formata valor em reais.
   * @param {number} valor
   * @returns {string}
   */
  function formatarReais(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Ordena chamados por prioridade (Urgente → Baixa) e depois por data desc.
   * @param {Array} lista
   * @returns {Array}
   */
  function ordenarPorPrioridade(lista) {
    return [...lista].sort((a, b) => {
      const pa = PRIORIDADE_ORDEM[a.prioridade] ?? 99;
      const pb = PRIORIDADE_ORDEM[b.prioridade] ?? 99;
      if (pa !== pb) return pa - pb;
      return (b.data || '').localeCompare(a.data || '');
    });
  }

  /**
   * Filtra os chamados conforme os filtros ativos.
   * @param {Array} lista
   * @returns {Array}
   */
  function aplicarFiltros(lista) {
    return lista.filter(m => {
      if (filtros.flat      && m.flat      !== filtros.flat)      return false;
      if (filtros.status    && m.status    !== filtros.status)    return false;
      if (filtros.prioridade && m.prioridade !== filtros.prioridade) return false;
      return true;
    });
  }

  // ─── Cards de resumo ──────────────────────────────────────────────────────

  function renderResumo(todos) {
    const abertos     = todos.filter(m => m.status !== 'Resolvido').length;
    const urgentes    = todos.filter(m => m.prioridade === 'Urgente' && m.status !== 'Resolvido').length;
    const emAndamento = todos.filter(m => m.status === 'Em andamento').length;
    const custoTotal  = todos
      .filter(m => m.status !== 'Resolvido')
      .reduce((acc, m) => acc + Number(m.custoEstimado || 0), 0);

    const card = (icone, titulo, valor, cor) => `
      <div class="card" style="flex:1; min-width:150px; text-align:center; padding:16px 12px;">
        <div style="font-size:1.6rem;">${icone}</div>
        <div style="font-size:1.6rem; font-weight:700; color:${cor}; line-height:1.2; margin:4px 0;">${valor}</div>
        <div class="text-sm text-muted">${titulo}</div>
      </div>`;

    return `
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px;">
        ${card('🔧', 'Total em aberto',  abertos,              'var(--texto-primario)')}
        ${card('🚨', 'Urgentes',         urgentes,             'var(--vermelho)')}
        ${card('⚙️',  'Em andamento',    emAndamento,          'var(--laranja)')}
        ${card('💰', 'Custo estimado',   formatarReais(custoTotal), 'var(--texto-primario)')}
      </div>`;
  }

  // ─── Barra de filtros ─────────────────────────────────────────────────────

  function renderFiltros() {
    // Opções de flats (Flat 01..08)
    const optsFlat = ['', 'Flat 01','Flat 02','Flat 03','Flat 04','Flat 05','Flat 06','Flat 07','Flat 08']
      .map(f => `<option value="${esc(f)}" ${filtros.flat === f ? 'selected' : ''}>${f || 'Todos os flats'}</option>`)
      .join('');

    const optsStatus = ['', 'Aberto','Em análise','Em andamento','Aguardando material','Resolvido']
      .map(s => `<option value="${esc(s)}" ${filtros.status === s ? 'selected' : ''}>${s || 'Todos os status'}</option>`)
      .join('');

    const optsPrioridade = ['', 'Urgente','Alta','Média','Baixa']
      .map(p => `<option value="${esc(p)}" ${filtros.prioridade === p ? 'selected' : ''}>${p || 'Todas as prioridades'}</option>`)
      .join('');

    return `
      <div class="filtros" style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; align-items:center;">
        <select class="form-select" id="filtro-flat" style="min-width:160px;">${optsFlat}</select>
        <select class="form-select" id="filtro-status" style="min-width:160px;">${optsStatus}</select>
        <select class="form-select" id="filtro-prioridade" style="min-width:160px;">${optsPrioridade}</select>
        <button class="btn btn-secundario btn-sm" id="btn-limpar-filtros">Limpar filtros</button>
      </div>`;
  }

  // ─── Card individual de manutenção ────────────────────────────────────────

  function renderCard(m) {
    const badgePrioridade = `<span class="badge ${PRIORIDADE_BADGE[m.prioridade] || 'badge-cinza'}">${esc(m.prioridade)}</span>`;
    const badgeStatusEl   = `<span class="badge ${STATUS_BADGE[m.status] || 'badge-cinza'}">${esc(m.status)}</span>`;
    const badgeFlat       = m.flat ? `<span class="badge badge-azul">${esc(m.flat)}</span>` : '';
    const custoHtml       = Number(m.custoEstimado || 0) > 0
      ? `<span class="text-sm text-muted">Custo estimado: <strong>${formatarReais(m.custoEstimado)}</strong></span>`
      : '';
    const responsavelHtml = m.responsavel
      ? `<span class="text-sm text-muted">👤 ${esc(m.responsavel)}</span>`
      : '';
    const dataHtml        = m.data
      ? `<span class="text-sm text-muted">📅 ${formatarData(m.data)}</span>`
      : '';
    const descHtml        = m.descricao
      ? `<p class="text-sm" style="margin:8px 0 0; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; color:var(--texto-secundario);">${esc(m.descricao)}</p>`
      : '';

    // Botão "Resolver" só aparece para chamados não resolvidos
    const btnResolver = m.status !== 'Resolvido'
      ? `<button class="btn btn-secundario btn-sm btn-resolver-chamado" data-id="${esc(m.id)}" title="Marcar como resolvido">✔ Resolver</button>`
      : '';

    return `
      <div class="card" style="display:flex; flex-direction:column; gap:8px; border-left:4px solid ${m.prioridade === 'Urgente' ? 'var(--vermelho)' : m.prioridade === 'Alta' ? 'var(--laranja)' : 'var(--borda)'};">
        <!-- Cabeçalho -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:6px;">
          <h3 style="margin:0; font-size:1rem; font-weight:600; color:var(--texto-primario); flex:1;">${esc(m.titulo)}</h3>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            ${badgeFlat}
            ${badgePrioridade}
            ${badgeStatusEl}
          </div>
        </div>

        <!-- Descrição truncada -->
        ${descHtml}

        <!-- Meta info -->
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-top:4px;">
          ${responsavelHtml}
          ${dataHtml}
          ${custoHtml}
        </div>

        <!-- Ações -->
        <div style="display:flex; gap:8px; margin-top:4px; padding-top:8px; border-top:1px solid var(--borda); flex-wrap:wrap;">
          <button class="btn btn-secundario btn-sm btn-editar-chamado" data-id="${esc(m.id)}">✏️ Editar</button>
          ${btnResolver}
          <button class="btn btn-perigo btn-sm btn-excluir-chamado" data-id="${esc(m.id)}" data-titulo="${esc(m.titulo)}" style="margin-left:auto;">🗑️ Excluir</button>
        </div>
      </div>`;
  }

  // ─── Modal: Novo / Editar chamado ─────────────────────────────────────────

  function abrirModalFormulario(id = null) {
    const isEdicao = !!id;
    let m = {};
    if (isEdicao) {
      m = Store.getById('manutencao', id);
      if (!m) { toast('Chamado não encontrado.', 'erro'); return; }
    }

    // Monta opções de flat
    const FLATS = ['Flat 01','Flat 02','Flat 03','Flat 04','Flat 05','Flat 06','Flat 07','Flat 08'];
    const optsFlat = FLATS.map(f =>
      `<option value="${esc(f)}" ${m.flat === f ? 'selected' : ''}>${esc(f)}</option>`
    ).join('');

    const optsStatus = ['Aberto','Em análise','Em andamento','Aguardando material','Resolvido'].map(s =>
      `<option value="${esc(s)}" ${m.status === s ? 'selected' : ''}>${esc(s)}</option>`
    ).join('');

    const optsPrioridade = ['Baixa','Média','Alta','Urgente'].map(p =>
      `<option value="${esc(p)}" ${m.prioridade === p ? 'selected' : ''}>${esc(p)}</option>`
    ).join('');

    const html = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <h3 style="margin:0; font-size:1.1rem;">${isEdicao ? '✏️ Editar Chamado' : '🔧 Novo Chamado de Manutenção'}</h3>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Flat <span style="color:var(--vermelho)">*</span></label>
            <select class="form-select" id="m-flat" required>
              <option value="">Selecione...</option>
              ${optsFlat}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Prioridade <span style="color:var(--vermelho)">*</span></label>
            <select class="form-select" id="m-prioridade" required>
              ${optsPrioridade}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Título <span style="color:var(--vermelho)">*</span></label>
          <input type="text" class="form-input" id="m-titulo" value="${esc(m.titulo || '')}" placeholder="Ex: Chuveiro com vazamento" required>
        </div>

        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea class="form-textarea" id="m-descricao" rows="3" placeholder="Detalhes do problema...">${esc(m.descricao || '')}</textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data <span style="color:var(--vermelho)">*</span></label>
            <input type="date" class="form-input" id="m-data" value="${esc(m.data || hoje())}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Responsável</label>
            <input type="text" class="form-input" id="m-responsavel" value="${esc(m.responsavel || '')}" placeholder="Nome do responsável">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="m-status">
              ${optsStatus}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Custo estimado (R$)</label>
            <input type="number" class="form-input" id="m-custo" value="${esc(m.custoEstimado || '')}" min="0" step="0.01" placeholder="0,00">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea class="form-textarea" id="m-obs" rows="2" placeholder="Informações adicionais...">${esc(m.observacoes || '')}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button class="btn btn-primario" id="btn-salvar-manutencao" data-id="${isEdicao ? esc(id) : ''}">
            ${isEdicao ? 'Salvar alterações' : 'Abrir chamado'}
          </button>
        </div>
      </div>`;

    abrirModal(html, '600px');

    document.getElementById('btn-salvar-manutencao').addEventListener('click', () => {
      const flatVal       = document.getElementById('m-flat').value.trim();
      const tituloVal     = document.getElementById('m-titulo').value.trim();
      const prioridadeVal = document.getElementById('m-prioridade').value;
      const dataVal       = document.getElementById('m-data').value;

      // Validação dos campos obrigatórios
      if (!flatVal)   { toast('Selecione um flat.', 'aviso'); document.getElementById('m-flat').focus(); return; }
      if (!tituloVal) { toast('Informe o título do chamado.', 'aviso'); document.getElementById('m-titulo').focus(); return; }
      if (!dataVal)   { toast('Informe a data.', 'aviso'); document.getElementById('m-data').focus(); return; }

      const dados = {
        flat:          flatVal,
        titulo:        tituloVal,
        descricao:     document.getElementById('m-descricao').value.trim(),
        prioridade:    prioridadeVal,
        data:          dataVal,
        responsavel:   document.getElementById('m-responsavel').value.trim(),
        status:        document.getElementById('m-status').value,
        custoEstimado: parseFloat(document.getElementById('m-custo').value) || 0,
        observacoes:   document.getElementById('m-obs').value.trim(),
      };

      if (isEdicao) {
        Store.atualizar('manutencao', id, dados);
        toast('Chamado atualizado com sucesso!', 'sucesso');
      } else {
        Store.adicionar('manutencao', dados);
        toast('Chamado aberto com sucesso!', 'sucesso');
      }

      fecharModal();
      Manutencao.render();
    });
  }

  // ─── Modal: Resolver chamado (quick action) ───────────────────────────────

  function abrirModalResolver(id) {
    const m = Store.getById('manutencao', id);
    if (!m) { toast('Chamado não encontrado.', 'erro'); return; }

    const html = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <h3 style="margin:0; font-size:1.1rem;">✔ Resolver Chamado</h3>
        <p class="text-sm" style="margin:0;">
          <strong>${esc(m.titulo)}</strong><br>
          <span class="text-muted">${m.flat ? esc(m.flat) : ''}</span>
        </p>

        <div class="form-group">
          <label class="form-label">Nota de resolução</label>
          <textarea class="form-textarea" id="nota-resolucao" rows="4" placeholder="Descreva como o problema foi resolvido..."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button class="btn btn-primario" id="btn-confirmar-resolver" data-id="${esc(id)}">Confirmar resolução</button>
        </div>
      </div>`;

    abrirModal(html, '440px');

    document.getElementById('btn-confirmar-resolver').addEventListener('click', () => {
      const nota = document.getElementById('nota-resolucao').value.trim();
      Store.atualizar('manutencao', id, {
        status: 'Resolvido',
        observacoes: nota ? (m.observacoes ? m.observacoes + '\n[Resolução] ' + nota : '[Resolução] ' + nota) : m.observacoes,
      });
      toast(`"${m.titulo}" marcado como Resolvido.`, 'sucesso');
      fecharModal();
      Manutencao.render();
    });
  }

  // ─── Render principal ─────────────────────────────────────────────────────

  function render() {
    const todos    = Store.get('manutencao');
    const filtrado = aplicarFiltros(todos);
    const ordenado = ordenarPorPrioridade(filtrado);

    const cardsHtml = ordenado.length > 0
      ? ordenado.map(renderCard).join('')
      : `<div class="vazio" style="grid-column:1/-1;">
           <p>Nenhum chamado encontrado${Object.values(filtros).some(Boolean) ? ' para os filtros aplicados' : ''}.</p>
         </div>`;

    const html = `
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <h1 class="page-title">🔧 Manutenção</h1>
          <p class="page-subtitle">Controle de chamados de manutenção dos flats</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primario" id="btn-novo-chamado">+ Novo Chamado</button>
        </div>
      </div>

      <!-- Cards de resumo -->
      ${renderResumo(todos)}

      <!-- Barra de filtros -->
      ${renderFiltros()}

      <!-- Lista de chamados -->
      <div style="display:flex; flex-direction:column; gap:12px;" id="lista-manutencao">
        ${cardsHtml}
      </div>`;

    document.getElementById('page-container').innerHTML = html;

    // ── Delegação de eventos ──────────────────────────────────────────────

    // Novo chamado
    document.getElementById('btn-novo-chamado').addEventListener('click', () => {
      abrirModalFormulario(null);
    });

    // Filtros
    ['filtro-flat', 'filtro-status', 'filtro-prioridade'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        filtros.flat       = document.getElementById('filtro-flat').value;
        filtros.status     = document.getElementById('filtro-status').value;
        filtros.prioridade = document.getElementById('filtro-prioridade').value;
        Manutencao.render();
      });
    });

    // Limpar filtros
    document.getElementById('btn-limpar-filtros').addEventListener('click', () => {
      filtros = { flat: '', status: '', prioridade: '' };
      Manutencao.render();
    });

    // Ações nos cards (editar / resolver / excluir)
    document.getElementById('lista-manutencao').addEventListener('click', e => {
      const btnEditar  = e.target.closest('.btn-editar-chamado');
      const btnResolver = e.target.closest('.btn-resolver-chamado');
      const btnExcluir = e.target.closest('.btn-excluir-chamado');

      if (btnEditar) {
        abrirModalFormulario(btnEditar.dataset.id);
      } else if (btnResolver) {
        abrirModalResolver(btnResolver.dataset.id);
      } else if (btnExcluir) {
        const titulo = btnExcluir.dataset.titulo || 'este chamado';
        if (confirmarExclusao(titulo)) {
          Store.excluir('manutencao', btnExcluir.dataset.id);
          toast('Chamado excluído.', 'sucesso');
          Manutencao.render();
        }
      }
    });
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  return { render };

})();
