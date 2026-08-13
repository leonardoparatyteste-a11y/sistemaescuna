/**
 * relatorio.js — Relatório de Operações + PDF
 * Calamar Flats — Painel Operacional
 */

const Relatorio = (function () {
  'use strict';

  let dataInicio = '';
  let dataFim = '';
  let periodoSelecionado = 'hoje'; // hoje, semana, mes, personalizado

  function formatarDinheiro(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  function obterFiltroDatas() {
    const hojeObj = new Date();
    const yyyymmdd = (d) => d.toISOString().split('T')[0];

    if (periodoSelecionado === 'hoje') {
      const hojeStr = yyyymmdd(hojeObj);
      return { inicio: hojeStr, fim: hojeStr };
    } else if (periodoSelecionado === 'semana') {
      const primeiro = new Date(hojeObj);
      const diaSemana = hojeObj.getDay(); // 0: Dom, 1: Seg, etc.
      // Vamos pegar da segunda-feira até o domingo
      const diff = hojeObj.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      primeiro.setDate(diff);
      const ultimo = new Date(primeiro);
      ultimo.setDate(primeiro.getDate() + 6);
      return { inicio: yyyymmdd(primeiro), fim: yyyymmdd(ultimo) };
    } else if (periodoSelecionado === 'mes') {
      const primeiro = new Date(hojeObj.getFullYear(), hojeObj.getMonth(), 1);
      const ultimo = new Date(hojeObj.getFullYear(), hojeObj.getMonth() + 1, 0);
      return { inicio: yyyymmdd(primeiro), fim: yyyymmdd(ultimo) };
    } else {
      return { inicio: dataInicio, fim: dataFim };
    }
  }

  function calcularDadosRelatorio() {
    const limites = obterFiltroDatas();
    const ini = limites.inicio;
    const fim = limites.fim;

    const reservas = Store.get('reservas') || [];
    const flats = Store.get('flats') || [];
    const manutencoes = Store.get('manutencao') || [];
    const tarefas = Store.get('tarefas') || [];
    const solicitacoes = Store.get('solicitacoes') || [];
    const historico = Store.get('historico') || [];

    // Filtro por data de check-in / check-out
    const checkins = reservas.filter(r => r.dataEntrada >= ini && r.dataEntrada <= fim);
    const checkouts = reservas.filter(r => r.dataSaida >= ini && r.dataSaida <= fim);

    // Limpezas realizadas (flats que mudaram de status para "Pronto" no histórico dentro do período)
    const limpezasHistorico = historico.filter(h => {
      const dataHist = h.timestamp.split('T')[0];
      return h.modulo === 'flats' && h.campo === 'status' && h.novo === 'Pronto' && dataHist >= ini && dataHist <= fim;
    });

    // Manutenções abertas no período (data de cadastro no período)
    const manAbertas = manutencoes.filter(m => {
      const dataM = m.data || m.criadoEm.split('T')[0];
      return dataM >= ini && dataM <= fim && m.status !== 'Resolvido';
    });

    // Manutenções resolvidas no período (histórico do status mudando para "Resolvido")
    const manResolvidas = historico.filter(h => {
      const dataHist = h.timestamp.split('T')[0];
      return h.modulo === 'manutencao' && h.campo === 'status' && h.novo === 'Resolvido' && dataHist >= ini && dataHist <= fim;
    });

    // Solicitações recebidas no período
    const solRecebidas = solicitacoes.filter(s => {
      const dataS = s.criadoEm.split('T')[0];
      return dataS >= ini && dataS <= fim;
    });

    // Solicitações resolvidas no período
    const solResolvidas = solicitacoes.filter(s => {
      const dataS = s.criadoEm.split('T')[0];
      return dataS >= ini && dataS <= fim && s.status === 'Resolvida';
    });

    // Tarefas concluídas no período
    const tarConcluidas = tarefas.filter(t => {
      if (t.status !== 'Concluída' || !t.concluidaEm) return false;
      const dataT = t.concluidaEm.split('T')[0];
      return dataT >= ini && dataT <= fim;
    });

    // Manutenções gerais do período para a tabela detalhada
    const manDetalhada = manutencoes.filter(m => {
      const dataM = m.data || m.criadoEm.split('T')[0];
      return dataM >= ini && dataM <= fim;
    });

    // Solicitações do período (Elogios, Reclamações, etc.)
    const solDetalhada = solicitacoes.filter(s => {
      const dataS = s.criadoEm.split('T')[0];
      return dataS >= ini && dataS <= fim;
    });

    // Tarefas vencidas atualmente (independentemente do período selecionado, para exibição de alerta)
    const tarVencidas = tarefas.filter(t => t.status !== 'Concluída' && t.prazo < hoje());

    return {
      limites,
      kpis: {
        checkins: checkins.length,
        checkouts: checkouts.length,
        limpezas: limpezasHistorico.length,
        manAbertas: manAbertas.length,
        manResolvidas: manResolvidas.length,
        solRecebidas: solRecebidas.length,
        solResolvidas: solResolvidas.length,
        tarConcluidas: tarConcluidas.length
      },
      flats,
      manDetalhada,
      solDetalhada,
      tarVencidas
    };
  }

  function imprimirRelatorio() {
    // Definir período para o header de impressão
    const limites = obterFiltroDatas();
    const elPeriodo = document.getElementById('print-periodo');
    if (elPeriodo) {
      elPeriodo.textContent = `Período: de ${formatarData(limites.inicio)} até ${formatarData(limites.fim)}`;
    }
    window.print();
  }

  function render() {
    const container = document.getElementById('page-container');
    const dados = calcularDadosRelatorio();
    const { limites, kpis, flats, manDetalhada, solDetalhada, tarVencidas } = dados;

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Resumo da Operação</h1>
          <p class="page-subtitle">Acompanhe as métricas de produtividade e resoluções da hospedagem</p>
        </div>
        <div class="page-actions">
          <button id="btn-imprimir-pdf" class="btn btn-primario">
            🖨️ Gerar PDF / Imprimir
          </button>
        </div>
      </div>

      <!-- Seletor de Período -->
      <div class="relatorio-periodo">
        <button class="periodo-btn ${periodoSelecionado === 'hoje' ? 'ativo' : ''}" data-periodo="hoje">Hoje</button>
        <button class="periodo-btn ${periodoSelecionado === 'semana' ? 'ativo' : ''}" data-periodo="semana">Esta Semana</button>
        <button class="periodo-btn ${periodoSelecionado === 'mes' ? 'ativo' : ''}" data-periodo="mes">Este Mês</button>
        <button class="periodo-btn ${periodoSelecionado === 'personalizado' ? 'ativo' : ''}" data-periodo="personalizado">Personalizado</button>

        <div id="datas-personalizadas" class="filtros hidden" style="margin-bottom: 0; padding: 0; box-shadow: none; border: none; background: transparent; display: inline-flex; align-items: center; gap: 8px;">
          <div class="form-group" style="flex-direction: row; align-items: center; gap: 4px;">
            <label class="form-label text-sm">De:</label>
            <input type="date" id="relatorio-data-inicio" class="form-input text-sm" value="${dataInicio}">
          </div>
          <div class="form-group" style="flex-direction: row; align-items: center; gap: 4px;">
            <label class="form-label text-sm">Até:</label>
            <input type="date" id="relatorio-data-fim" class="form-input text-sm" value="${dataFim}">
          </div>
          <button id="btn-buscar-personalizado" class="btn btn-secundario btn-sm">Buscar</button>
        </div>
      </div>

      <!-- KPIs da Operação -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.checkins}</div>
          <div class="kpi-label">Check-ins</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.checkouts}</div>
          <div class="kpi-label">Check-outs</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.limpezas}</div>
          <div class="kpi-label">Limpezas Concluídas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.tarConcluidas}</div>
          <div class="kpi-label">Tarefas Feitas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.manAbertas}</div>
          <div class="kpi-label">Manutenções Abertas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.manResolvidas}</div>
          <div class="kpi-label">Manutenções Resolvidas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.solRecebidas}</div>
          <div class="kpi-label">Solicitações Recebidas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-numero">${kpis.solResolvidas}</div>
          <div class="kpi-label">Solicitações Resolvidas</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; align-items: start; margin-bottom: 24px;" class="chegadas-saidas-grid">
        <!-- Detalhes de Manutenção no Período -->
        <div class="card">
          <h2 class="secao-titulo">🔧 Manutenções no Período</h2>
          ${manDetalhada.length === 0 ? '<p class="vazio">Nenhuma manutenção registrada neste período.</p>' : `
            <div class="table-wrapper">
              <table class="tabela">
                <thead>
                  <tr>
                    <th>Flat</th>
                    <th>Título</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th style="text-align: right;">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  ${manDetalhada.map(m => `
                    <tr>
                      <td><strong>${esc(m.flat)}</strong></td>
                      <td>${esc(m.titulo)}</td>
                      <td>
                        <span class="badge ${
                          m.prioridade === 'Urgente' ? 'badge-urgente' :
                          m.prioridade === 'Alta' ? 'badge-laranja' :
                          m.prioridade === 'Média' ? 'badge-amarelo' : 'badge-verde'
                        }">${m.prioridade}</span>
                      </td>
                      <td>
                        <span class="badge ${
                          m.status === 'Resolvido' ? 'badge-verde' :
                          m.status === 'Em andamento' ? 'badge-azul' :
                          m.status === 'Aguardando material' ? 'badge-laranja' : 'badge-cinza'
                        }">${m.status}</span>
                      </td>
                      <td style="text-align: right;">${formatarDinheiro(m.custoEstimado)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="text-align: right; margin-top: 12px; font-weight: 700; color: var(--azul-profundo);">
              Total de Custos Estimados: ${formatarDinheiro(manDetalhada.reduce((acc, curr) => acc + (curr.custoEstimado || 0), 0))}
            </div>
          `}
        </div>

        <!-- Situação Atual dos Flats -->
        <div class="card">
          <h2 class="secao-titulo">🧹 Situação Atual dos Flats</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            ${flats.map(f => `
              <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--cinza-claro); display: flex; flex-direction: column; gap: 4px;">
                <span style="font-weight: 700; font-size: 0.9rem;">${f.numero}</span>
                <span class="badge ${
                  f.status === 'Pronto' ? 'status-pronto' :
                  f.status === 'Ocupado' ? 'status-ocupado' :
                  f.status === 'Aguardando limpeza' ? 'status-aguardando-limpeza' :
                  f.status === 'Em limpeza' ? 'status-em-limpeza' :
                  f.status === 'Aguardando conferência' ? 'status-aguardando-conferencia' :
                  f.status === 'Aguardando checkout' ? 'status-aguardando-checkout' : 'status-bloqueado'
                }">${f.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; margin-bottom: 24px;" class="chegadas-saidas-grid">
        <!-- Solicitações e Elogios -->
        <div class="card">
          <h2 class="secao-titulo">💬 Solicitações e Elogios</h2>
          ${solDetalhada.length === 0 ? '<p class="vazio">Nenhuma solicitação registrada neste período.</p>' : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${solDetalhada.map(s => `
                <div class="solicitacao-card ${s.tipo === 'Elogio' ? 'elogio' : s.tipo === 'Reclamação' ? 'reclamacao' : 'pendente'}" style="margin-bottom: 0;">
                  <div class="solicitacao-header">
                    <span class="solicitacao-hospede">${esc(s.nomeHospede)} (${esc(s.flat)})</span>
                    <span class="badge ${s.tipo === 'Elogio' ? 'badge-verde' : s.tipo === 'Reclamação' ? 'badge-vermelho' : 'badge-azul'}">${s.tipo}</span>
                  </div>
                  <div class="solicitacao-desc">${esc(s.descricao)}</div>
                  ${s.solucao ? `<div class="solicitacao-solucao"><strong>Resolução:</strong> ${esc(s.solucao)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Tarefas Atrasadas -->
        <div class="card">
          <h2 class="secao-titulo">⏰ Tarefas Vencidas</h2>
          ${tarVencidas.length === 0 ? '<p class="vazio" style="color: var(--verde);">Tudo em dia! Nenhuma tarefa atrasada.</p>' : `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${tarVencidas.map(t => `
                <div class="tarefa-card urgente" style="margin-bottom: 0;">
                  <div class="tarefa-info">
                    <span class="tarefa-titulo" style="color: var(--vermelho);">${esc(t.titulo)}</span>
                    <div class="tarefa-badges">
                      <span class="badge badge-cinza">${t.categoria}</span>
                      <span class="badge badge-vermelho">Vencida em ${formatarData(t.prazo)}</span>
                    </div>
                    <div class="tarefa-desc">${esc(t.descricao)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>

      <!-- Notas da Gerência para a Direção -->
      <div class="card notas-gerencia">
        <h2 class="secao-titulo">📝 Observações e Comentários da Gerência</h2>
        <p class="text-muted text-sm" style="margin-bottom: 10px;">Adicione observações que serão incluídas na versão impressa ou PDF para a direção.</p>
        <textarea id="observacoes-direcao" placeholder="Escreva observações sobre a operação do período (ex: equipe, ocupação, principais problemas, etc.)..."></textarea>
      </div>
    `;

    // Toggle do painel de datas personalizadas
    const containerPeriodo = container.querySelector('.relatorio-periodo');
    const painelDatas = document.getElementById('datas-personalizadas');

    if (periodoSelecionado === 'personalizado') {
      painelDatas.classList.remove('hidden');
    } else {
      painelDatas.classList.add('hidden');
    }

    containerPeriodo.addEventListener('click', (e) => {
      const btn = e.target.closest('.periodo-btn');
      if (!btn) return;

      periodoSelecionado = btn.dataset.periodo;
      if (periodoSelecionado === 'personalizado') {
        painelDatas.classList.remove('hidden');
      } else {
        painelDatas.classList.add('hidden');
        render(); // recarrega com o filtro predefinido
      }
    });

    // Filtro personalizado
    document.getElementById('btn-buscar-personalizado').onclick = () => {
      dataInicio = document.getElementById('relatorio-data-inicio').value;
      dataFim = document.getElementById('relatorio-data-fim').value;

      if (!dataInicio || !dataFim) {
        toast('Selecione as datas de início e fim.', 'erro');
        return;
      }
      if (dataFim < dataInicio) {
        toast('A data final não pode ser anterior à inicial.', 'erro');
        return;
      }
      render();
    };

    // Imprimir
    document.getElementById('btn-imprimir-pdf').onclick = imprimirRelatorio;
  }

  return { render };
})();
