/**
 * limpeza.js — Módulo de Limpeza e Status dos Flats
 * Calamar Flats — Painel Operacional
 *
 * Responsável pelo controle visual dos 8 flats, alteração de status
 * e checklist de limpeza com 11 itens por flat.
 */

const Limpeza = (() => {

  // ─── Constantes ───────────────────────────────────────────────────────────

  /** Mapeamento de status → classe CSS e label legível */
  const STATUS_MAP = {
    'Ocupado':                  { cls: 'status-ocupado',               label: 'Ocupado' },
    'Aguardando checkout':      { cls: 'status-aguardando-checkout',   label: 'Aguardando checkout' },
    'Aguardando limpeza':       { cls: 'status-aguardando-limpeza',    label: 'Aguardando limpeza' },
    'Em limpeza':               { cls: 'status-em-limpeza',            label: 'Em limpeza' },
    'Aguardando conferência':   { cls: 'status-aguardando-conferencia',label: 'Aguardando conferência' },
    'Pronto':                   { cls: 'status-pronto',                label: 'Pronto' },
    'Bloqueado para manutenção':{ cls: 'status-bloqueado',             label: 'Bloqueado para manutenção' },
  };

  /** Itens do checklist de limpeza e suas chaves */
  const CHECKLIST_ITEMS = [
    { key: 'roupaCama',        label: 'Roupa de cama trocada' },
    { key: 'toalhas',          label: 'Toalhas' },
    { key: 'banheiro',         label: 'Banheiro' },
    { key: 'cozinha',          label: 'Cozinha' },
    { key: 'frigobar',         label: 'Frigobar' },
    { key: 'televisao',        label: 'Televisão' },
    { key: 'arCondicionado',   label: 'Ar-condicionado' },
    { key: 'wifi',             label: 'Wi-Fi verificado' },
    { key: 'amenities',        label: 'Amenities repostos' },
    { key: 'lixoRetirado',     label: 'Lixo retirado' },
    { key: 'conferenciaFinal', label: 'Conferência final' },
  ];

  const TOTAL_CHECKLIST = CHECKLIST_ITEMS.length; // 11

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Retorna quantos itens do checklist estão marcados como true.
   * @param {Object} checklist
   * @returns {number}
   */
  function contarChecklist(checklist = {}) {
    return CHECKLIST_ITEMS.filter(item => checklist[item.key] === true).length;
  }

  /**
   * Verifica se há reserva com entrada OU saída hoje para um determinado flat.
   * @param {string} flatNumero  ex: "Flat 01"
   * @param {Array}  reservas
   * @returns {{ tipo: 'entrada'|'saida'|null }}
   */
  function reservaHoje(flatNumero, reservas) {
    const dataHoje = hoje();
    for (const r of reservas) {
      if (r.flat !== flatNumero) continue;
      if (r.dataEntrada === dataHoje) return { tipo: 'entrada' };
      if (r.dataSaida   === dataHoje) return { tipo: 'saida' };
    }
    return { tipo: null };
  }

  /**
   * Gera a badge de status com a classe CSS correta.
   * @param {string} status
   * @returns {string} HTML
   */
  function badgeStatus(status) {
    const info = STATUS_MAP[status] || { cls: 'status-pronto', label: status };
    return `<span class="badge ${info.cls}">${esc(info.label)}</span>`;
  }

  /**
   * Gera a barra de progresso do checklist.
   * @param {number} feitos
   * @param {number} total
   * @returns {string} HTML
   */
  function barraProgresso(feitos, total) {
    const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
    const cor = pct === 100 ? 'var(--verde)' : pct >= 50 ? 'var(--amarelo)' : 'var(--laranja)';
    return `
      <div style="margin: 8px 0 4px;">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--texto-secundario); margin-bottom:4px;">
          <span>Checklist</span>
          <span>${feitos}/${total}</span>
        </div>
        <div style="background:var(--borda); border-radius:4px; height:6px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${cor}; border-radius:4px; transition:width .3s;"></div>
        </div>
      </div>`;
  }

  // ─── Renderização dos cards ────────────────────────────────────────────────

  /**
   * Gera o HTML de um card de flat.
   */
  function renderCard(flat, reservas) {
    const feitos   = contarChecklist(flat.checklist);
    const eventoHj = reservaHoje(flat.numero, reservas);
    const obs      = flat.observacoes ? flat.observacoes.trim() : '';

    // Indicador de movimento hoje
    let indicadorHoje = '';
    if (eventoHj.tipo === 'entrada') {
      indicadorHoje = `<span class="badge badge-azul" title="Check-in hoje" style="font-size:0.7rem;">↓ Check-in hoje</span>`;
    } else if (eventoHj.tipo === 'saida') {
      indicadorHoje = `<span class="badge badge-laranja" title="Checkout hoje" style="font-size:0.7rem;">↑ Checkout hoje</span>`;
    }

    return `
      <div class="card" style="display:flex; flex-direction:column; gap:8px;">
        <!-- Cabeçalho: número + indicador -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px;">
          <span style="font-size:1.3rem; font-weight:700; color:var(--texto-primario);">${esc(flat.numero)}</span>
          ${indicadorHoje}
        </div>

        <!-- Badge de status -->
        <div>${badgeStatus(flat.status)}</div>

        <!-- Barra de progresso do checklist -->
        ${barraProgresso(feitos, TOTAL_CHECKLIST)}

        <!-- Observações truncadas -->
        ${obs ? `<p class="text-sm text-muted" style="margin:0; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${esc(obs)}</p>` : ''}

        <!-- Ações -->
        <div style="display:flex; gap:8px; margin-top:auto; padding-top:8px; border-top:1px solid var(--borda); flex-wrap:wrap;">
          <button class="btn btn-secundario btn-sm btn-alterar-status" data-id="${esc(flat.id)}" style="flex:1;">
            Alterar Status
          </button>
          <button class="btn btn-primario btn-sm btn-checklist" data-id="${esc(flat.id)}" style="flex:1;">
            Checklist
          </button>
        </div>
      </div>`;
  }

  // ─── Estatísticas rápidas ──────────────────────────────────────────────────

  function renderStats(flats) {
    const contagem = {};
    for (const s of Object.keys(STATUS_MAP)) contagem[s] = 0;
    for (const f of flats) {
      if (contagem[f.status] !== undefined) contagem[f.status]++;
      else contagem[f.status] = 1;
    }

    return Object.entries(STATUS_MAP).map(([status, info]) => {
      const n = contagem[status] || 0;
      if (n === 0) return '';
      return `
        <span class="badge ${info.cls}" style="font-size:0.8rem; padding:4px 10px; gap:6px;">
          ${esc(info.label)}: <strong>${n}</strong>
        </span>`;
    }).join('');
  }

  // ─── Legenda ──────────────────────────────────────────────────────────────

  function renderLegenda() {
    return Object.entries(STATUS_MAP).map(([, info]) =>
      `<span class="badge ${info.cls}" style="font-size:0.72rem;">${esc(info.label)}</span>`
    ).join('');
  }

  // ─── Modal: Alterar Status ─────────────────────────────────────────────────

  function abrirModalStatus(flatId) {
    const flat = Store.getById('flats', flatId);
    if (!flat) { toast('Flat não encontrado.', 'erro'); return; }

    const opcoesStatus = Object.keys(STATUS_MAP).map(s => `
      <label style="display:flex; align-items:center; gap:10px; padding:8px; border-radius:6px; cursor:pointer; border:1px solid var(--borda); background:var(--superficie);">
        <input type="radio" name="novoStatus" value="${esc(s)}" ${flat.status === s ? 'checked' : ''}>
        <span class="badge ${STATUS_MAP[s].cls}" style="font-size:0.8rem;">${esc(STATUS_MAP[s].label)}</span>
      </label>`
    ).join('');

    const html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.1rem;">${esc(flat.numero)}</h3>
          <div style="margin-bottom:4px;">Status atual: ${badgeStatus(flat.status)}</div>
        </div>

        <div>
          <div class="form-label">Novo status</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${opcoesStatus}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="obs-status" class="form-textarea" rows="3" placeholder="Observações adicionais...">${esc(flat.observacoes || '')}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button class="btn btn-primario" id="btn-salvar-status" data-id="${esc(flat.id)}">Salvar</button>
        </div>
      </div>`;

    abrirModal(html, '480px');

    // Listener do botão salvar
    document.getElementById('btn-salvar-status').addEventListener('click', () => {
      const radioSelecionado = document.querySelector('input[name="novoStatus"]:checked');
      if (!radioSelecionado) { toast('Selecione um status.', 'aviso'); return; }

      const novoStatus = radioSelecionado.value;
      const novasObs   = document.getElementById('obs-status').value.trim();

      Store.atualizar('flats', flat.id, { status: novoStatus, observacoes: novasObs });
      toast(`${flat.numero} → ${novoStatus}`, 'sucesso');
      fecharModal();
      Limpeza.render();
    });
  }

  // ─── Modal: Checklist ─────────────────────────────────────────────────────

  function abrirModalChecklist(flatId) {
    const flat = Store.getById('flats', flatId);
    if (!flat) { toast('Flat não encontrado.', 'erro'); return; }

    const checklist = flat.checklist || {};

    const itensHtml = CHECKLIST_ITEMS.map(item => `
      <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:6px; cursor:pointer; border:1px solid var(--borda); background:var(--superficie);">
        <input type="checkbox" class="chk-item" data-key="${esc(item.key)}" ${checklist[item.key] ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
        <span class="text-sm" style="flex:1;">${esc(item.label)}</span>
      </label>`
    ).join('');

    // Calcula marcados iniciais
    const feitosInicial = contarChecklist(checklist);

    const html = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div>
          <h3 style="margin:0 0 4px; font-size:1.1rem;">${esc(flat.numero)} — Checklist de Limpeza</h3>
          <div>${badgeStatus(flat.status)}</div>
        </div>

        <!-- Barra de progresso dinâmica -->
        <div id="modal-progresso">
          ${barraProgresso(feitosInicial, TOTAL_CHECKLIST)}
        </div>

        <!-- Itens -->
        <div style="display:flex; flex-direction:column; gap:6px;" id="lista-checklist">
          ${itensHtml}
        </div>

        <!-- Observações -->
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="obs-checklist" class="form-textarea" rows="3" placeholder="Ex: frigobar com problema, aguardar técnico...">${esc(flat.observacoes || '')}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
          <button class="btn btn-primario" id="btn-salvar-checklist" data-id="${esc(flat.id)}">Salvar Checklist</button>
        </div>
      </div>`;

    abrirModal(html, '520px');

    // Atualiza barra de progresso dinamicamente ao marcar/desmarcar
    document.getElementById('lista-checklist').addEventListener('change', () => {
      const marcados = document.querySelectorAll('.chk-item:checked').length;
      document.getElementById('modal-progresso').innerHTML = barraProgresso(marcados, TOTAL_CHECKLIST);
    });

    // Salvar checklist
    document.getElementById('btn-salvar-checklist').addEventListener('click', () => {
      const novoChecklist = {};
      document.querySelectorAll('.chk-item').forEach(chk => {
        novoChecklist[chk.dataset.key] = chk.checked;
      });
      const novasObs = document.getElementById('obs-checklist').value.trim();

      Store.atualizar('flats', flat.id, { checklist: novoChecklist, observacoes: novasObs });

      const feitos = contarChecklist(novoChecklist);
      toast(`Checklist de ${flat.numero} salvo (${feitos}/${TOTAL_CHECKLIST})`, 'sucesso');
      fecharModal();
      Limpeza.render();
    });
  }

  // ─── Render principal ─────────────────────────────────────────────────────

  function render() {
    const flats    = Store.get('flats');
    const reservas = Store.get('reservas');

    const cardsHtml = flats.map(f => renderCard(f, reservas)).join('');

    const html = `
      <div class="page-header">
        <div>
          <h1 class="page-title">🧹 Limpeza &amp; Status dos Flats</h1>
          <p class="page-subtitle">Gerencie o status de limpeza e o checklist de cada flat</p>
        </div>
      </div>

      <!-- Legenda de cores -->
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:16px; align-items:center;">
        <span class="text-sm text-muted" style="margin-right:4px;">Legenda:</span>
        ${renderLegenda()}
      </div>

      <!-- Contagens rápidas -->
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px; align-items:center;">
        ${renderStats(flats)}
      </div>

      <!-- Grid de flats -->
      <div style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
      " id="grid-flats">
        ${cardsHtml}
      </div>

      <style>
        /* Responsividade do grid */
        @media (max-width: 1100px) {
          #grid-flats { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          #grid-flats { grid-template-columns: 1fr !important; }
        }
      </style>`;

    document.getElementById('page-container').innerHTML = html;

    // ── Delegação de eventos ──────────────────────────────────────────────
    document.getElementById('grid-flats').addEventListener('click', e => {
      const btnStatus    = e.target.closest('.btn-alterar-status');
      const btnChecklist = e.target.closest('.btn-checklist');

      if (btnStatus) {
        abrirModalStatus(btnStatus.dataset.id);
      } else if (btnChecklist) {
        abrirModalChecklist(btnChecklist.dataset.id);
      }
    });
  }

  // ─── API pública ──────────────────────────────────────────────────────────
  return { render };

})();
