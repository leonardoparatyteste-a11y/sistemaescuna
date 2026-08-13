/**
 * financeiro.js — Controle Financeiro, Metas e Ocupação
 * Calamar Flats — Painel Operacional
 */

const Financeiro = (function () {
  'use strict';

  // Mês selecionado no formato 'YYYY-MM'. Padrão: mês atual
  let mesSelecionado = new Date().toISOString().substring(0, 7);

  function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  function obterDiasNoMes(ano, mes) {
    return new Date(ano, mes, 0).getDate();
  }

  // Calcula noites de overlap no mês YYYY-MM
  function calcularNoitesNoMes(entrada, saida, mesAno) {
    const [y, m] = mesAno.split('-').map(Number);
    const inicioMes = new Date(y, m - 1, 1);
    const fimMes = new Date(y, m, 0); // último dia do mês (mês é 1-indexed para Date(y, m, 0))

    const ent = new Date(entrada + 'T00:00:00');
    const sai = new Date(saida + 'T00:00:00');

    const inicioOverlap = ent > inicioMes ? ent : inicioMes;
    const fimOverlap = sai < fimMes ? sai : fimMes;

    if (inicioOverlap >= fimOverlap) return 0;
    const diffTime = Math.abs(fimOverlap - inicioOverlap);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function calcularMétricas() {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const diasNoMes = obterDiasNoMes(ano, mes);
    const totalFlats = 8;
    const roomNightsDisponiveis = totalFlats * diasNoMes;

    const reservas = Store.get('reservas') || [];
    const transacoes = Store.get('transacoes') || [];
    const metas = Store.get('metas') || [];

    // 1. Calcular diárias vendidas
    let diariasVendidas = 0;
    reservas.forEach(r => {
      diariasVendidas += calcularNoitesNoMes(r.dataEntrada, r.dataSaida, mesSelecionado);
    });

    const ocupacaoPercent = roomNightsDisponiveis > 0 
      ? Math.round((diariasVendidas / roomNightsDisponiveis) * 100) 
      : 0;

    // 2. Faturamento estimado das reservas (R$ 250 por diária padrão, a menos que especificado nas observações)
    let faturamentoReservas = diariasVendidas * 250;

    // 3. Receitas e Despesas extras do Livro Caixa no mês selecionado
    let receitasExtras = 0;
    let despesasTotais = 0;

    const transacoesMes = transacoes.filter(t => t.data.substring(0, 7) === mesSelecionado);
    transacoesMes.forEach(t => {
      if (t.tipo === 'Receita') {
        receitasExtras += Number(t.valor || 0);
      } else {
        despesasTotais += Number(t.valor || 0);
      }
    });

    const receitasTotais = faturamentoReservas + receitasExtras;
    const saldoLiquido = receitasTotais - despesasTotais;

    // 4. Meta para o mês
    const metaMes = metas.find(m => m.mes === mesSelecionado) || { metaFaturamento: 12000, metaOcupacao: 60 };

    return {
      diariasVendidas,
      roomNightsDisponiveis,
      ocupacaoPercent,
      faturamentoReservas,
      receitasExtras,
      receitasTotais,
      despesasTotais,
      saldoLiquido,
      metaMes,
      transacoesMes
    };
  }

  function abrirModalMeta(metaAtual) {
    const html = `
      <div class="modal-header">
        <h2 class="modal-titulo">Definir Metas para ${mesSelecionado}</h2>
        <button class="modal-fechar" onclick="fecharModal()">×</button>
      </div>
      <div class="modal-corpo">
        <form id="form-meta">
          <div class="form-group">
            <label class="form-label obrigatorio" for="meta-faturamento">Meta de Faturamento (R$)</label>
            <input type="number" id="meta-faturamento" class="form-input" value="${metaAtual.metaFaturamento}" required min="0">
          </div>
          <div class="form-group">
            <label class="form-label obrigatorio" for="meta-ocupacao">Meta de Ocupação (%)</label>
            <input type="number" id="meta-ocupacao" class="form-input" value="${metaAtual.metaOcupacao}" required min="0" max="100">
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primario">Salvar Metas</button>
          </div>
        </form>
      </div>
    `;
    abrirModal(html, '400px');

    document.getElementById('form-meta').onsubmit = (e) => {
      e.preventDefault();
      const metaFaturamento = Number(document.getElementById('meta-faturamento').value);
      const metaOcupacao = Number(document.getElementById('meta-ocupacao').value);

      const metas = Store.get('metas') || [];
      const idx = metas.findIndex(m => m.mes === mesSelecionado);

      if (idx !== -1) {
        Store.atualizar('metas', metas[idx].id, { metaFaturamento, metaOcupacao });
      } else {
        Store.adicionar('metas', { mes: mesSelecionado, metaFaturamento, metaOcupacao });
      }

      toast('Metas atualizadas com sucesso!', 'sucesso');
      fecharModal();
      render();
    };
  }

  function abrirModalTransacao() {
    const html = `
      <div class="modal-header">
        <h2 class="modal-titulo">Lançar Movimentação Financeira</h2>
        <button class="modal-fechar" onclick="fecharModal()">×</button>
      </div>
      <div class="modal-corpo">
        <form id="form-transacao">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label obrigatorio" for="trans-tipo">Tipo</label>
              <select id="trans-tipo" class="form-select" required>
                <option value="Despesa">Despesa (Saída)</option>
                <option value="Receita">Receita (Entrada)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label obrigatorio" for="trans-data">Data</label>
              <input type="date" id="trans-data" class="form-input" value="${hoje()}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label obrigatorio" for="trans-valor">Valor (R$)</label>
              <input type="number" id="trans-valor" class="form-input" placeholder="0.00" step="0.01" min="0.01" required>
            </div>
            <div class="form-group">
              <label class="form-label obrigatorio" for="trans-cat">Categoria</label>
              <select id="trans-cat" class="form-select" required>
                <option value="Reserva direta">Reserva Direta (Sinal/Saldo)</option>
                <option value="Reservas">Reservas (Canais)</option>
                <option value="Manutenção">Manutenção / Reparos</option>
                <option value="Limpeza">Limpeza / Produtos</option>
                <option value="Compras">Compras / Amenities</option>
                <option value="Administrativo">Administrativo (Luz/Água/Internet)</option>
                <option value="Marketing">Marketing / Divulgação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label obrigatorio" for="trans-desc">Descrição</label>
            <input type="text" id="trans-desc" class="form-input" placeholder="Ex: Conta de internet jul/26" required>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
            <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primario">Lançar Transação</button>
          </div>
        </form>
      </div>
    `;
    abrirModal(html, '500px');

    document.getElementById('form-transacao').onsubmit = (e) => {
      e.preventDefault();
      const tipo = document.getElementById('trans-tipo').value;
      const data = document.getElementById('trans-data').value;
      const valor = Number(document.getElementById('trans-valor').value);
      const categoria = document.getElementById('trans-cat').value;
      const descricao = document.getElementById('trans-desc').value;

      Store.adicionar('transacoes', { tipo, data, valor, categoria, descricao });
      toast('Transação lançada com sucesso!', 'sucesso');
      fecharModal();
      render();
    };
  }

  function excluirTransacao(id) {
    const t = Store.getById('transacoes', id);
    if (!t) return;
    if (confirmarExclusao(`Lançamento de ${formatarDinheiro(t.valor)} (${t.descricao})`)) {
      Store.excluir('transacoes', id);
      toast('Lançamento financeiro removido.', 'sucesso');
      render();
    }
  }

  function render() {
    const container = document.getElementById('page-container');
    const m = calcularMétricas();

    const faturamentoProgresso = Math.min(100, Math.round((m.receitasTotais / m.metaMes.metaFaturamento) * 100)) || 0;
    const ocupacaoProgresso = Math.min(100, Math.round((m.ocupacaoPercent / m.metaMes.metaOcupacao) * 100)) || 0;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Controle Financeiro</h1>
          <p class="page-subtitle">Acompanhe receitas, taxas de ocupação e metas de faturamento</p>
        </div>
        <div class="page-actions">
          <button id="btn-nova-transacao" class="btn btn-primario">
            💵 Lançar Movimentação
          </button>
          <button id="btn-ajustar-meta" class="btn btn-secundario">
            🎯 Definir Metas
          </button>
        </div>
      </div>

      <!-- Seletor de Mês -->
      <div class="relatorio-periodo">
        <label class="form-label" style="margin-bottom:0; font-weight:700; color:var(--azul-profundo);">Mês de Referência:</label>
        <input type="month" id="financeiro-mes-selecao" class="form-input" style="width:200px;" value="${mesSelecionado}">
      </div>

      <!-- Resumo Financeiro -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 4px solid var(--verde);">
          <div class="kpi-numero" style="color:var(--verde);">${formatarDinheiro(m.receitasTotais)}</div>
          <div class="kpi-label">Faturamento Total</div>
          <div style="font-size:0.75rem; color:var(--texto-muted); margin-top:4px;">
            Reservas (est.): ${formatarDinheiro(m.faturamentoReservas)} | Caixa: ${formatarDinheiro(m.receitasExtras)}
          </div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid var(--vermelho);">
          <div class="kpi-numero" style="color:var(--vermelho);">${formatarDinheiro(m.despesasTotais)}</div>
          <div class="kpi-label">Despesas de Caixa</div>
          <div style="font-size:0.75rem; color:var(--texto-muted); margin-top:4px;">Insumos, energia, reparos</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid var(--azul-ceu);">
          <div class="kpi-numero" style="color:${m.saldoLiquido >= 0 ? 'var(--verde)' : 'var(--vermelho)'};">${formatarDinheiro(m.saldoLiquido)}</div>
          <div class="kpi-label">Saldo Líquido</div>
          <div style="font-size:0.75rem; color:var(--texto-muted); margin-top:4px;">Resultado operacional</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid var(--amarelo);">
          <div class="kpi-numero" style="color:var(--azul-profundo);">${m.ocupacaoPercent}%</div>
          <div class="kpi-label">Ocupação Média</div>
          <div style="font-size:0.75rem; color:var(--texto-muted); margin-top:4px;">
            ${m.diariasVendidas} de ${m.roomNightsDisponiveis} noites vendidas
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 20px; align-items: start; margin-bottom: 24px;" class="chegadas-saidas-grid">
        <!-- Metas Mensais -->
        <div class="card">
          <h2 class="secao-titulo">🎯 Metas do Mês</h2>
          
          <div style="margin-bottom: 20px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
              <span>Faturamento (${faturamentoProgresso}%)</span>
              <strong>${formatarDinheiro(m.receitasTotais)} / ${formatarDinheiro(m.metaMes.metaFaturamento)}</strong>
            </div>
            <div class="progresso-barra">
              <div class="progresso-fill" style="width: ${faturamentoProgresso}%; background: var(--verde);"></div>
            </div>
          </div>

          <div style="margin-bottom: 10px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
              <span>Taxa de Ocupação (${m.ocupacaoPercent}% / ${m.metaMes.metaOcupacao}%)</span>
              <strong>${ocupacaoProgresso}% alcançado</strong>
            </div>
            <div class="progresso-barra">
              <div class="progresso-fill" style="width: ${ocupacaoProgresso}%; background: var(--azul-ceu);"></div>
            </div>
          </div>
        </div>

        <!-- Livro Caixa (Transações Extras) -->
        <div class="card">
          <h2 class="secao-titulo">🧾 Caixa do Mês (Entradas e Saídas)</h2>
          ${m.transacoesMes.length === 0 ? '<p class="vazio">Nenhuma movimentação avulsa lançada neste mês.</p>' : `
            <div class="table-wrapper">
              <table class="tabela">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th style="text-align: right;">Valor</th>
                    <th style="text-align: center;">Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  ${m.transacoesMes.map(t => `
                    <tr>
                      <td>${formatarData(t.data)}</td>
                      <td>
                        <span class="badge ${t.tipo === 'Receita' ? 'badge-verde' : 'badge-vermelho'}">${t.tipo}</span>
                      </td>
                      <td><span class="badge badge-cinza">${esc(t.categoria)}</span></td>
                      <td>${esc(t.descricao)}</td>
                      <td style="text-align: right; font-weight:700; color:${t.tipo === 'Receita' ? 'var(--verde)' : 'var(--vermelho)'}">
                        ${t.tipo === 'Receita' ? '+' : '-'}&nbsp;${formatarDinheiro(t.valor)}
                      </td>
                      <td style="text-align: center;">
                        <button class="btn btn-perigo btn-icon btn-sm btn-delete-trans" data-id="${t.id}">🗑️</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    // Ações da página
    document.getElementById('financeiro-mes-selecao').onchange = (e) => {
      mesSelecionado = e.target.value;
      render();
    };

    document.getElementById('btn-nova-transacao').onclick = abrirModalTransacao;
    document.getElementById('btn-ajustar-meta').onclick = () => abrirModalMeta(m.metaMes);

    // Event delegation para excluir transações
    container.onclick = (e) => {
      const btn = e.target.closest('.btn-delete-trans');
      if (btn) {
        excluirTransacao(btn.dataset.id);
      }
    };
  }

  return { render };
})();
