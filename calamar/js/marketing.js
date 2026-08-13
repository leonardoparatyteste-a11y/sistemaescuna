/**
 * marketing.js — Calendário de Conteúdo e Planejamento de Marketing
 * Calamar Flats — Painel Operacional
 */

const Marketing = (function () {
  'use strict';

  // Data de referência padrão: hoje
  let dataReferencia = new Date();

  const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const CANAIS = ['Instagram', 'Facebook', 'WhatsApp Status', 'Google Meu Negócio'];
  const TIPOS_MIDIA = ['Reels', 'Feed', 'Story', 'Carrossel', 'Vídeo', 'Foto'];
  const STATUS_POST = ['Ideia', 'Em Produção', 'Agendado', 'Postado'];

  function obterCanaisBadges(canal) {
    if (canal === 'Instagram') return 'badge-azul';
    if (canal === 'Facebook') return 'badge-info';
    if (canal === 'WhatsApp Status') return 'badge-verde';
    return 'badge-laranja'; // Google Meu Negócio
  }

  function obterStatusBadges(status) {
    if (status === 'Postado') return 'badge-verde';
    if (status === 'Agendado') return 'badge-laranja';
    if (status === 'Em Produção') return 'badge-amarelo';
    return 'badge-cinza'; // Ideia
  }

  function abrirModalPost(dataStr, postId = null) {
    const postExistente = postId ? Store.getById('marketing', postId) : null;
    const dataFormatada = formatarData(dataStr);

    const html = `
      <div class="modal-header">
        <h2 class="modal-titulo">${postExistente ? 'Editar Conteúdo' : 'Programar Conteúdo'} — ${dataFormatada}</h2>
        <button class="modal-fechar" onclick="fecharModal()">×</button>
      </div>
      <div class="modal-corpo">
        <form id="form-marketing">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label obrigatorio" for="post-canal">Canal / Rede</label>
              <select id="post-canal" class="form-select" required>
                ${CANAIS.map(c => `<option value="${c}" ${postExistente && postExistente.canal === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label obrigatorio" for="post-tipo">Tipo de Mídia</label>
              <select id="post-tipo" class="form-select" required>
                ${TIPOS_MIDIA.map(t => `<option value="${t}" ${postExistente && postExistente.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label obrigatorio" for="post-status">Status</label>
              <select id="post-status" class="form-select" required>
                ${STATUS_POST.map(s => `<option value="${s}" ${postExistente && postExistente.status === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label obrigatorio" for="post-horario">Horário previsto</label>
              <input type="time" id="post-horario" class="form-input" value="${postExistente ? postExistente.horario : '10:00'}" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label obrigatorio" for="post-titulo">Título / Ideia do Conteúdo</label>
            <input type="text" id="post-titulo" class="form-input" placeholder="Ex: Vista do pôr do sol no cais" value="${postExistente ? esc(postExistente.titulo) : ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label" for="post-desc">Detalhamento / Legenda do Post</label>
            <textarea id="post-desc" class="form-textarea" placeholder="Rascunho de texto ou observações de produção...">${postExistente ? esc(postExistente.descricao) : ''}</textarea>
          </div>

          <div style="display:flex; justify-content:space-between; gap:10px; margin-top:20px;">
            <div>
              ${postExistente ? `<button type="button" class="btn btn-perigo" id="btn-deletar-post">Excluir Post</button>` : ''}
            </div>
            <div style="display:flex; gap:10px;">
              <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
              <button type="submit" class="btn btn-primario">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    `;
    abrirModal(html, '550px');

    document.getElementById('form-marketing').onsubmit = (e) => {
      e.preventDefault();
      const canal = document.getElementById('post-canal').value;
      const tipo = document.getElementById('post-tipo').value;
      const status = document.getElementById('post-status').value;
      const horario = document.getElementById('post-horario').value;
      const titulo = document.getElementById('post-titulo').value;
      const descricao = document.getElementById('post-desc').value;

      if (postExistente) {
        Store.atualizar('marketing', postExistente.id, { canal, tipo, status, horario, titulo, descricao });
        toast('Post atualizado no cronograma!', 'sucesso');
      } else {
        Store.adicionar('marketing', { data: dataStr, canal, tipo, status, horario, titulo, descricao });
        toast('Post agendado com sucesso!', 'sucesso');
      }
      fecharModal();
      render();
    };

    if (postExistente) {
      document.getElementById('btn-deletar-post').onclick = () => {
        if (confirmarExclusao(`post "${postExistente.titulo}"`)) {
          Store.excluir('marketing', postExistente.id);
          toast('Post removido do calendário.', 'sucesso');
          fecharModal();
          render();
        }
      };
    }
  }

  function renderCalendario(ano, mes) {
    const primeiroDiaIndex = new Date(ano, mes, 1).getDay(); // Dia da semana do dia 1 (0 = Dom, etc.)
    const totalDias = new Date(ano, mes + 1, 0).getDate(); // Dias no mês atual
    const posts = Store.get('marketing') || [];

    let cellsHtml = '';

    // Células em branco para alinhar com o primeiro dia da semana
    for (let i = 0; i < primeiroDiaIndex; i++) {
      cellsHtml += `<div class="cal-dia cal-dia-vazio"></div>`;
    }

    // Dias reais do mês
    for (let dia = 1; dia <= totalDias; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const postsDoDia = posts.filter(p => p.data === dataStr);

      const itemsHtml = postsDoDia.map(p => `
        <div class="cal-post-badge badge ${obterCanaisBadges(p.canal)}" data-id="${p.id}">
          <span style="font-size:10px;">${p.horario}</span> - <strong>${esc(p.titulo)}</strong>
          <span class="badge ${obterStatusBadges(p.status)}" style="padding: 1px 4px; font-size:9px; margin-left: 2px;">${p.status}</span>
        </div>
      `).join('');

      cellsHtml += `
        <div class="cal-dia" data-data="${dataStr}">
          <span class="cal-dia-num">${dia}</span>
          <div class="cal-dia-posts">
            ${itemsHtml}
          </div>
          <button class="cal-add-btn" data-data="${dataStr}">+ Programar</button>
        </div>
      `;
    }

    return cellsHtml;
  }

  function render() {
    const container = document.getElementById('page-container');
    const ano = dataReferencia.getFullYear();
    const mes = dataReferencia.getMonth();

    const posts = Store.get('marketing') || [];
    const postsFuturos = posts
      .filter(p => p.data >= hoje())
      .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendário de Marketing</h1>
          <p class="page-subtitle">Programe fotos, stories, reels e avisos no Centro Histórico de Paraty</p>
        </div>
      </div>

      <!-- Navegação do Calendário -->
      <div class="relatorio-periodo" style="justify-content: space-between; display: flex; align-items: center;">
        <button id="cal-prev" class="btn btn-secundario btn-sm">◀ Anterior</button>
        <h2 style="font-family:'Playfair Display', serif; color:var(--azul-profundo); margin:0;">
          ${MESES[mes]} de ${ano}
        </h2>
        <button id="cal-next" class="btn btn-secundario btn-sm">Próximo ▶</button>
      </div>

      <!-- Calendário Grid -->
      <div class="card" style="padding:10px; overflow-x: auto;">
        <div class="calendario-container">
          <div class="calendario-semana-header">
            <div>Domingo</div>
            <div>Segunda</div>
            <div>Terça</div>
            <div>Quarta</div>
            <div>Quinta</div>
            <div>Sexta</div>
            <div>Sábado</div>
          </div>
          <div class="calendario-dias-grid" id="calendario-grid">
            ${renderCalendario(ano, mes)}
          </div>
        </div>
      </div>

      <!-- CSS Específico do Calendário Injetado Localmente -->
      <style>
        .calendario-container {
          min-width: 750px;
        }
        .calendario-semana-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--texto-suave);
          background: var(--fundo);
          padding: 8px 0;
          border-radius: var(--radius-sm);
        }
        .calendario-dias-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 6px;
        }
        .cal-dia {
          min-height: 110px;
          background: var(--creme);
          border: 1px solid var(--cinza-claro);
          border-radius: var(--radius-sm);
          padding: 6px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: var(--transicao);
        }
        .cal-dia:hover {
          background: var(--branco);
          border-color: var(--azul-claro);
        }
        .cal-dia-vazio {
          background: transparent;
          border: none;
          pointer-events: none;
        }
        .cal-dia-num {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--texto-suave);
          margin-bottom: 4px;
        }
        .cal-dia-posts {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          overflow-y: auto;
          max-height: 80px;
        }
        .cal-post-badge {
          cursor: pointer;
          display: block;
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 0.72rem;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cal-post-badge:hover {
          filter: brightness(0.95);
        }
        .cal-add-btn {
          display: none;
          position: absolute;
          bottom: 4px;
          left: 4px;
          right: 4px;
          background: var(--azul-profundo);
          color: var(--branco);
          border: none;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 3px 0;
          text-align: center;
          border-radius: 4px;
          cursor: pointer;
        }
        .cal-dia:hover .cal-add-btn {
          display: block;
        }
        @media (max-width: 900px) {
          /* No mobile, o calendário encolhe horizontalmente, então o overflow-x cuida do grid, ou podemos mostrar a lista abaixo */
        }
      </style>

      <!-- Lista de Conteúdos Próximos -->
      <div class="card" style="margin-top: 24px;">
        <h2 class="secao-titulo">📱 Próximas Postagens Planejadas</h2>
        ${postsFuturos.length === 0 ? '<p class="vazio">Nenhum post agendado a partir de hoje.</p>' : `
          <div class="table-wrapper">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Rede Social</th>
                  <th>Mídia</th>
                  <th>Título / Ideia</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${postsFuturos.map(p => `
                  <tr>
                    <td><strong>${formatarData(p.data)}</strong></td>
                    <td>${p.horario}</td>
                    <td><span class="badge ${obterCanaisBadges(p.canal)}">${p.canal}</span></td>
                    <td><span class="badge badge-cinza">${p.tipo}</span></td>
                    <td>${esc(p.titulo)}</td>
                    <td><span class="badge ${obterStatusBadges(p.status)}">${p.status}</span></td>
                    <td>
                      <button class="btn btn-secundario btn-sm btn-edit-post" data-id="${p.id}" data-data="${p.data}">Editar</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    // Eventos de navegação
    document.getElementById('cal-prev').onclick = () => {
      dataReferencia.setMonth(dataReferencia.getMonth() - 1);
      render();
    };

    document.getElementById('cal-next').onclick = () => {
      dataReferencia.setMonth(dataReferencia.getMonth() + 1);
      render();
    };

    // Cliques no Calendário e Badges
    const grid = document.getElementById('calendario-grid');

    grid.onclick = (e) => {
      // 1. Clique em Programar (+)
      const btnAdd = e.target.closest('.cal-add-btn');
      if (btnAdd) {
        abrirModalPost(btnAdd.dataset.data);
        return;
      }

      // 2. Clique em Badge do Post existente
      const badge = e.target.closest('.cal-post-badge');
      if (badge) {
        abrirModalPost(badge.parentElement.parentElement.dataset.data, badge.dataset.id);
        return;
      }

      // 3. Clique no dia vazio (abrir agendamento padrão para o dia)
      const diaCell = e.target.closest('.cal-dia');
      if (diaCell && !diaCell.classList.contains('cal-dia-vazio')) {
        abrirModalPost(diaCell.dataset.data);
      }
    };

    // Editar da Tabela
    container.onclick = (e) => {
      const btn = e.target.closest('.btn-edit-post');
      if (btn) {
        abrirModalPost(btn.dataset.data, btn.dataset.id);
      }
    };
  }

  return { render };
})();
