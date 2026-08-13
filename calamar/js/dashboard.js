/**
 * dashboard.js — Módulo Dashboard
 * Calamar Flats — Painel Operacional
 *
 * Exibe resumo operacional do dia: cards de status, alertas, timeline e ações rápidas.
 */

const Dashboard = (() => {

  // Guarda o id do interval do relógio para limpar ao re-renderizar
  let _clockInterval = null;

  // ─────────────────────────────────────────────
  // Helpers internos
  // ─────────────────────────────────────────────

  /** Retorna o nome do dia da semana e data formatada em pt-BR, ex: "Sexta-feira, 11 de julho de 2026" */
  function _formatarDataPTBR(date) {
    const diasSemana = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return `${diasSemana[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
  }

  /** Retorna hora atual formatada HH:MM:SS */
  function _horaAtual() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  /** Dado um horário "HH:MM", retorna true se estiver dentro das próximas `horas` horas */
  function _chegaEmBreve(horarioStr, horas = 2) {
    if (!horarioStr) return false;
    const [h, m] = horarioStr.split(':').map(Number);
    const now = new Date();
    const chegada = new Date(now);
    chegada.setHours(h, m, 0, 0);
    const diffMs = chegada - now;
    return diffMs >= 0 && diffMs <= horas * 60 * 60 * 1000;
  }

  /** Retorna badge HTML de canal */
  function _badgeCanal(canal) {
    const map = {
      'Booking': 'badge-azul',
      'Airbnb': 'badge-vermelho',
      'Omnibees': 'badge-roxo',
      'Reserva direta': 'badge-verde',
      'Outros': 'badge-cinza'
    };
    return `<span class="badge ${map[canal] || 'badge-cinza'}">${esc(canal)}</span>`;
  }

  // ─────────────────────────────────────────────
  // Geração de HTML
  // ─────────────────────────────────────────────

  /** Gera os 8 cards de resumo */
  function _renderCards(reservas, flats, manutencao, tarefas, solicitacoes) {
    const dHoje = hoje();

    const chegadas      = reservas.filter(r => r.dataEntrada === dHoje).length;
    const saidas        = reservas.filter(r => r.dataSaida === dHoje).length;
    const ocupados      = flats.filter(f => f.status === 'Ocupado').length;
    const disponiveis   = flats.filter(f => f.status === 'Pronto').length;
    const limpezas      = flats.filter(f => f.status === 'Aguardando limpeza' || f.status === 'Em limpeza').length;
    const manutAberta   = manutencao.filter(m => m.status !== 'Resolvido').length;
    const solPendentes  = solicitacoes.filter(s => s.status === 'Pendente').length;
    const tarefasAtras  = tarefas.filter(t => t.status !== 'Concluída' && t.prazo && t.prazo < dHoje).length;

    const cards = [
      { icon: '🛬', valor: chegadas,     label: 'Chegadas hoje',            rota: 'reservas',   destaque: chegadas > 0 },
      { icon: '🛫', valor: saidas,       label: 'Saídas hoje',              rota: 'reservas',   destaque: false },
      { icon: '🏠', valor: ocupados,     label: 'Flats ocupados',           rota: 'flats',      destaque: false },
      { icon: '✅', valor: disponiveis,  label: 'Flats disponíveis',        rota: 'flats',      destaque: disponiveis > 0 },
      { icon: '🧹', valor: limpezas,     label: 'Limpezas pendentes',       rota: 'limpeza',    destaque: limpezas > 0 },
      { icon: '🔧', valor: manutAberta,  label: 'Manutenções abertas',      rota: 'manutencao', destaque: manutAberta > 0 },
      { icon: '💬', valor: solPendentes, label: 'Solicitações pendentes',   rota: 'solicitacoes', destaque: solPendentes > 0 },
      { icon: '⏰', valor: tarefasAtras, label: 'Tarefas atrasadas',        rota: 'tarefas',    destaque: tarefasAtras > 0 },
    ];

    return cards.map(c => `
      <div class="card card-dashboard${c.destaque ? ' card-destaque' : ''}" 
           role="button" tabindex="0" 
           onclick="navegar('${c.rota}')"
           onkeydown="if(event.key==='Enter')navegar('${c.rota}')"
           title="Ir para ${c.label}"
           style="cursor:pointer;text-align:center;padding:1.5rem 1rem;">
        <div style="font-size:2.2rem;margin-bottom:.5rem;">${c.icon}</div>
        <div style="font-size:2.4rem;font-weight:700;line-height:1;margin-bottom:.4rem;color:var(--cor-laranja-site,#FB9A38)">${c.valor}</div>
        <div class="text-sm text-muted">${c.label}</div>
      </div>
    `).join('');
  }

  /** Gera o painel de alertas */
  function _renderAlertas(reservas, flats, manutencao, tarefas, solicitacoes) {
    const dHoje = hoje();
    const alertas = [];

    // 1. Hóspede chegando hoje sem horário informado
    const chegadasSemHorario = reservas.filter(r => r.dataEntrada === dHoje && !r.horarioChegada);
    chegadasSemHorario.forEach(r => {
      alertas.push({
        nivel: 'aviso',
        icone: '⚠️',
        msg: `Hóspede <strong>${esc(r.nomeHospede)}</strong> chega hoje no ${esc(r.flat)} sem horário informado.`
      });
    });

    // 2. Flat não pronto com check-in em menos de 2h
    reservas.filter(r => r.dataEntrada === dHoje && r.horarioChegada).forEach(r => {
      if (_chegaEmBreve(r.horarioChegada, 2)) {
        const flat = flats.find(f => f.numero === r.flat || f.id === r.flat);
        if (flat && flat.status !== 'Pronto') {
          alertas.push({
            nivel: 'perigo',
            icone: '🚨',
            msg: `<strong>${esc(r.flat)}</strong> não está pronto — ${esc(r.nomeHospede)} chega às ${esc(r.horarioChegada)}! (Status atual: ${esc(flat.status)})`
          });
        }
      }
    });

    // 3. Manutenção urgente aberta
    manutencao.filter(m => m.prioridade === 'Urgente' && m.status !== 'Resolvido').forEach(m => {
      alertas.push({
        nivel: 'perigo',
        icone: '🔴',
        msg: `Manutenção urgente em aberto: <strong>${esc(m.titulo)}</strong>${m.flat ? ` — ${esc(m.flat)}` : ''}.`
      });
    });

    // 4. Mensagem de check-in não enviada para chegada hoje
    reservas.filter(r => r.dataEntrada === dHoje && r.statusMensagem === 'Não enviada').forEach(r => {
      alertas.push({
        nivel: 'aviso',
        icone: '📵',
        msg: `Mensagem de check-in <strong>não enviada</strong> para ${esc(r.nomeHospede)} (${esc(r.flat)}).`
      });
    });

    // 5. Tarefa com prazo vencido
    tarefas.filter(t => t.status !== 'Concluída' && t.prazo && t.prazo < dHoje).forEach(t => {
      alertas.push({
        nivel: 'aviso',
        icone: '⏰',
        msg: `Tarefa com prazo vencido: <strong>${esc(t.titulo)}</strong> (venceu em ${formatarData(t.prazo)}).`
      });
    });

    // 6. Solicitação pendente sem responsável (usa horario como proxy — sem um timestamp real, alertamos todas as pendentes sem responsável)
    solicitacoes.filter(s => s.status === 'Pendente' && !s.responsavel).forEach(s => {
      alertas.push({
        nivel: 'info',
        icone: '💬',
        msg: `Solicitação pendente sem responsável: <strong>${esc(s.tipo)}</strong> — ${esc(s.nomeHospede)} (${esc(s.flat)}).`
      });
    });

    // 7. Flat bloqueado para manutenção com reserva chegando
    const flatsBloqueados = flats.filter(f => f.status === 'Bloqueado para manutenção');
    flatsBloqueados.forEach(flat => {
      const conflito = reservas.find(r => (r.flat === flat.numero || r.flat === flat.id) && r.dataEntrada === dHoje);
      if (conflito) {
        alertas.push({
          nivel: 'perigo',
          icone: '⛔',
          msg: `<strong>${esc(flat.numero || flat.id)}</strong> está bloqueado para manutenção, mas ${esc(conflito.nomeHospede)} tem check-in hoje!`
        });
      }
    });

    if (alertas.length === 0) {
      return `<div class="card" style="padding:1rem 1.25rem;display:flex;align-items:center;gap:.75rem;">
        <span style="font-size:1.5rem;">✅</span>
        <span class="text-sm" style="color:var(--cor-sucesso,#34a853)">Nenhum alerta no momento. Tudo certo!</span>
      </div>`;
    }

    const corNivel = { perigo: '#dc3545', aviso: '#f59e0b', info: '#1a73e8' };
    const bgNivel  = { perigo: '#fff5f5', aviso: '#fffbeb', info: '#f0f6ff' };

    return alertas.map(a => `
      <div style="
        display:flex;align-items:flex-start;gap:.75rem;
        padding:.85rem 1.1rem;border-radius:8px;margin-bottom:.5rem;
        border-left:4px solid ${corNivel[a.nivel]};
        background:${bgNivel[a.nivel]};
        font-size:.9rem;line-height:1.5;
      ">
        <span style="font-size:1.2rem;flex-shrink:0;margin-top:.05rem;">${a.icone}</span>
        <span>${a.msg}</span>
      </div>
    `).join('');
  }

  /** Gera a timeline do dia */
  function _renderTimeline(reservas, manutencao, tarefas) {
    const dHoje = hoje();
    const eventos = [];

    // Evento fixo
    eventos.push({ hora: '08:00', icone: '☕', desc: 'Conferir café da manhã e abastecimento', cor: '#8b5cf6' });

    // Check-ins hoje
    reservas.filter(r => r.dataEntrada === dHoje).forEach(r => {
      eventos.push({
        hora: r.horarioChegada || '—',
        icone: '🛬',
        desc: `Check-in: <strong>${esc(r.nomeHospede)}</strong> — ${esc(r.flat)}${r.horarioChegada ? ` às ${r.horarioChegada}` : ' (horário não informado)'}`,
        cor: '#1a73e8',
        sortKey: r.horarioChegada || '99:99'
      });
    });

    // Check-outs hoje
    reservas.filter(r => r.dataSaida === dHoje).forEach(r => {
      eventos.push({
        hora: '12:00',
        icone: '🛫',
        desc: `Check-out: <strong>${esc(r.nomeHospede)}</strong> — ${esc(r.flat)}`,
        cor: '#f59e0b',
        sortKey: '12:00'
      });
    });

    // Manutenções com data hoje
    manutencao.filter(m => m.data === dHoje && m.status !== 'Resolvido').forEach(m => {
      eventos.push({
        hora: '—',
        icone: '🔧',
        desc: `Manutenção: <strong>${esc(m.titulo)}</strong>${m.flat ? ` — ${esc(m.flat)}` : ''}`,
        cor: '#dc3545',
        sortKey: '10:00'
      });
    });

    // Tarefas com prazo hoje
    tarefas.filter(t => t.prazo === dHoje && t.status !== 'Concluída').forEach(t => {
      eventos.push({
        hora: '—',
        icone: '📋',
        desc: `Tarefa: <strong>${esc(t.titulo)}</strong>`,
        cor: '#34a853',
        sortKey: '09:00'
      });
    });

    // Ordena por hora (eventos sem hora ficam por último)
    eventos.sort((a, b) => {
      const ka = a.sortKey || (a.hora !== '—' ? a.hora : '99:99');
      const kb = b.sortKey || (b.hora !== '—' ? b.hora : '99:99');
      return ka.localeCompare(kb);
    });

    if (eventos.length === 0) {
      return `<p class="text-sm text-muted" style="padding:.5rem 0;">Nenhum evento registrado para hoje.</p>`;
    }

    return `<div class="timeline-lista" style="position:relative;padding-left:1.5rem;border-left:2px solid var(--cor-borda,#e5e7eb);">
      ${eventos.map(e => `
        <div class="timeline-item" style="position:relative;margin-bottom:1.25rem;padding-left:1rem;">
          <div style="
            position:absolute;left:-1.85rem;top:.1rem;
            width:1.2rem;height:1.2rem;border-radius:50%;
            background:${e.cor};border:2px solid #fff;
            box-shadow:0 0 0 2px ${e.cor}44;
            display:flex;align-items:center;justify-content:center;
            font-size:.6rem;
          ">
          </div>
          <div style="display:flex;align-items:baseline;gap:.6rem;flex-wrap:wrap;">
            <span style="font-size:.78rem;font-weight:600;color:${e.cor};min-width:3.5rem;">${e.hora}</span>
            <span style="font-size:.95rem;">${e.icone}</span>
            <span class="text-sm" style="flex:1;">${e.desc}</span>
          </div>
        </div>
      `).join('')}
    </div>`;
  }

  /** Gera as ações rápidas */
  function _renderAcoesRapidas() {
    const acoes = [
      { icone: '➕', label: 'Nova Reserva',      rota: 'reservas',    cor: '#1a73e8' },
      { icone: '🔧', label: 'Registrar Manutenção', rota: 'manutencao', cor: '#dc3545' },
      { icone: '📋', label: 'Nova Tarefa',         rota: 'tarefas',    cor: '#f59e0b' },
      { icone: '💬', label: 'Nova Solicitação',    rota: 'solicitacoes', cor: '#34a853' },
    ];

    return acoes.map(a => `
      <button class="btn btn-secundario"
              onclick="navegar('${a.rota}')"
              style="display:flex;align-items:center;gap:.5rem;padding:.7rem 1.1rem;">
        <span style="font-size:1.1rem;">${a.icone}</span>
        <span>${a.label}</span>
      </button>
    `).join('');
  }

  // ─────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────

  function render() {
    // Limpa interval anterior se existir
    if (_clockInterval !== null) {
      clearInterval(_clockInterval);
      _clockInterval = null;
    }

    // Carrega dados do Store
    const reservas     = Store.get('reservas')     || [];
    const flats        = Store.get('flats')        || [];
    const manutencao   = Store.get('manutencao')   || [];
    const tarefas      = Store.get('tarefas')      || [];
    const solicitacoes = Store.get('solicitacoes') || [];

    const agora = new Date();
    const dataFormatada = _formatarDataPTBR(agora);

    // Cálculo de Ocupação do Mês Atual para Widget
    const mesAtual = agora.toISOString().substring(0, 7);
    const [y, mNum] = mesAtual.split('-').map(Number);
    const diasNoMes = new Date(y, mNum, 0).getDate();
    const roomNightsDisponiveis = 8 * diasNoMes;
    let diariasVendidas = 0;
    reservas.forEach(r => {
      const ent = new Date(r.dataEntrada + 'T00:00:00');
      const sai = new Date(r.dataSaida + 'T00:00:00');
      const inicioMes = new Date(y, mNum - 1, 1);
      const fimMes = new Date(y, mNum, 0);
      const inicioOverlap = ent > inicioMes ? ent : inicioMes;
      const fimOverlap = sai < fimMes ? sai : fimMes;
      if (inicioOverlap < fimOverlap) {
        const diffTime = Math.abs(fimOverlap - inicioOverlap);
        diariasVendidas += Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    });
    const ocupacaoPercent = roomNightsDisponiveis > 0 ? Math.round((diariasVendidas / roomNightsDisponiveis) * 100) : 0;

    // Próximo Post de Marketing
    const posts = Store.get('marketing') || [];
    const proximoPost = posts
      .filter(p => p.data >= hoje() && p.status !== 'Postado')
      .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))[0] || null;

    // Monta HTML completo
    const html = `
      <!-- ═══ CABEÇALHO ═══ -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:.5rem;">
        <div>
          <h1 class="page-title">Painel Operacional</h1>
          <p class="page-subtitle" id="dash-data-formatada">${dataFormatada}</p>
        </div>
        <div style="text-align:right;">
          <div id="dash-relogio" style="font-size:2rem;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.05em;color:var(--cor-laranja-site,#FB9A38);">
            ${_horaAtual()}
          </div>
          <div class="text-sm text-muted">Horário atual</div>
        </div>
      </div>

      <!-- ═══ CARDS DE RESUMO ═══ -->
      <section style="margin-bottom:1.75rem;">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
          📊 Resumo do dia
        </h2>
        <div class="card-grid" style="grid-template-columns:repeat(4,1fr);">
          ${_renderCards(reservas, flats, manutencao, tarefas, solicitacoes)}
        </div>
      </section>

      <!-- ═══ ALERTAS ═══ -->
      <section style="margin-bottom:1.75rem;">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
          🔔 Alertas
        </h2>
        <div id="dash-alertas">
          ${_renderAlertas(reservas, flats, manutencao, tarefas, solicitacoes)}
        </div>
      </section>

      <!-- ═══ LAYOUT INFERIOR: TIMELINE + AÇÕES ═══ -->
      <div style="display:grid;grid-template-columns:1fr 320px;gap:1.25rem;align-items:start;" id="dash-layout-inferior">

        <!-- Timeline -->
        <section>
          <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
            📅 Timeline do dia
          </h2>
          <div class="card" style="padding:1.25rem 1.5rem;">
            ${_renderTimeline(reservas, manutencao, tarefas)}
          </div>
        </section>

        <!-- Ações rápidas -->
        <section>
          <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
            ⚡ Ações rápidas
          </h2>
          <div class="card" style="padding:1.25rem;display:flex;flex-direction:column;gap:.65rem;margin-bottom:1.25rem;">
            ${_renderAcoesRapidas()}
          </div>

          <!-- Metas e Ocupação Rápido -->
          <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
            📈 Ocupação & Marketing
          </h2>
          <div class="card" style="padding:1.25rem;margin-bottom:1.25rem;">
            <div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:4px;">
                <span>Ocupação do Mês (${mesAtual})</span>
                <strong>${ocupacaoPercent}%</strong>
              </div>
              <div class="progresso-barra" style="margin-bottom:0;">
                <div class="progresso-fill" style="width:${ocupacaoPercent}%;"></div>
              </div>
            </div>
            ${proximoPost ? `
              <div style="border-top:1px solid var(--cinza-claro);padding-top:10px;">
                <span class="text-muted text-sm" style="display:block;margin-bottom:4px;">Próxima Postagem:</span>
                <span class="badge badge-azul" style="font-size:0.7rem;margin-bottom:4px;">${proximoPost.canal} · ${proximoPost.tipo}</span>
                <strong style="display:block;font-size:0.85rem;line-height:1.2;">${esc(proximoPost.titulo)}</strong>
                <span class="text-muted text-sm" style="font-size:0.75rem;">Agendado para ${formatarData(proximoPost.data)} às ${proximoPost.horario}</span>
              </div>
            ` : '<p class="text-sm text-muted">Nenhuma postagem programada.</p>'}
          </div>

          <!-- Mini-status dos flats -->
          <h2 style="font-size:1rem;font-weight:600;margin-bottom:.85rem;color:var(--cor-texto-secundario,#6b7280);">
            🏠 Status dos flats
          </h2>
          <div class="card" style="padding:1rem 1.25rem;">
            ${flats.length === 0
              ? `<p class="text-sm text-muted">Nenhum flat cadastrado.</p>`
              : flats.map(f => {
                  // Mapeia status para classe CSS
                  const classeMap = {
                    'Ocupado': 'status-ocupado',
                    'Aguardando checkout': 'status-aguardando-checkout',
                    'Aguardando limpeza': 'status-aguardando-limpeza',
                    'Em limpeza': 'status-em-limpeza',
                    'Aguardando conferência': 'status-aguardando-conferencia',
                    'Pronto': 'status-pronto',
                    'Bloqueado para manutenção': 'status-bloqueado',
                  };
                  const cls = classeMap[f.status] || '';
                  return `
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:.45rem 0;border-bottom:1px solid var(--cor-borda,#e5e7eb);">
                      <span class="text-sm" style="font-weight:600;">${esc(f.numero || f.id)}</span>
                      <span class="badge ${cls}" style="font-size:.72rem;">${esc(f.status)}</span>
                    </div>
                  `;
                }).join('')
            }
          </div>
        </section>

      </div>

      <style>
        /* Responsividade dos cards */
        @media (max-width: 1024px) {
          .card-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .card-grid { grid-template-columns: 1fr !important; }
          .page-header > div:last-child { text-align:left; }
        }
        /* Layout inferior */
        @media (max-width: 900px) {
          #dash-layout-inferior { grid-template-columns: 1fr !important; }
        }
        /* Card destaque (hover) */
        .card-dashboard { transition: transform .15s, box-shadow .15s; }
        .card-dashboard:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,.1); }
        .card-destaque { border-top: 3px solid var(--cor-laranja-site, #FB9A38); }
      </style>
    `;

    document.getElementById('page-container').innerHTML = html;

    // Inicia o relógio — atualiza a cada segundo
    _clockInterval = setInterval(() => {
      const el = document.getElementById('dash-relogio');
      if (el) {
        el.textContent = _horaAtual();
      } else {
        // Elemento sumiu (navegou para outra página): limpa o interval
        clearInterval(_clockInterval);
        _clockInterval = null;
      }
    }, 1000);
  }

  // API pública
  return { render };

})();
