/**
 * app.js — Roteador SPA, autenticação e inicialização
 * Calamar Flats — Painel Operacional
 */

// ─── Usuários do sistema (MVP sem backend) ────────────────────────────────────
const USUARIOS = [
  { id: 'usr-1', nome: 'Gerente',  perfil: 'gerente',  senha: 'gerente123',  avatar: 'G' },
  { id: 'usr-2', nome: 'Recepção', perfil: 'recepcao', senha: 'recepcao123', avatar: 'R' },
  { id: 'usr-3', nome: 'Limpeza',  perfil: 'limpeza',  senha: 'limpeza123',  avatar: 'L' },
];

// ─── Rotas disponíveis ────────────────────────────────────────────────────────
const ROTAS = {
  dashboard:   { label: 'Painel',       permissao: 'dashboard',  icone: '🏠', render: () => Dashboard.render()   },
  reservas:    { label: 'Reservas',     permissao: 'reservas',   icone: '📋', render: () => Reservas.render()    },
  limpeza:     { label: 'Limpeza',      permissao: 'limpeza',    icone: '🧹', render: () => Limpeza.render()     },
  manutencao:  { label: 'Manutenção',   permissao: 'manutencao', icone: '🔧', render: () => Manutencao.render()  },
  tarefas:     { label: 'Tarefas',      permissao: 'tarefas',    icone: '✅', render: () => Tarefas.render()     },
  financeiro:  { label: 'Financeiro',   permissao: 'financeiro', icone: '💵', render: () => Financeiro.render()  },
  tarifas:     { label: 'Tarifas',      permissao: 'gerente',    icone: '📈', render: () => Tarifas.render()     },
  marketing:   { label: 'Marketing',    permissao: 'marketing',  icone: '📱', render: () => Marketing.render()   },
  mensagens:   { label: 'Mensagens',    permissao: 'mensagens',  icone: '💬', render: () => Mensagens.render()   },
  relatorio:   { label: 'Relatório',    permissao: 'relatorio',  icone: '📊', render: () => Relatorio.render()   },
  historico:   { label: 'Histórico',    permissao: 'tudo',       icone: '📜', render: () => renderHistorico()    },
};

// Rota atual
let rotaAtual = 'dashboard';

// ─── Utilitários globais ──────────────────────────────────────────────────────

/** Mostra uma notificação toast */
function toast(msg, tipo = 'info', duracao = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, duracao);
}

/** Formata data ISO para pt-BR */
function formatarData(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

/** Formata data e hora ISO para pt-BR */
function formatarDataHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/** Retorna a data de hoje em yyyy-mm-dd */
function hoje() {
  return new Date().toISOString().split('T')[0];
}

/** Verifica se uma data está vencida */
function estaVencida(dataISO) {
  return dataISO && dataISO < hoje();
}

/** Confirmar exclusão */
function confirmarExclusao(nome) {
  return confirm(`Tem certeza que deseja excluir "${nome}"?\nEssa ação não pode ser desfeita.`);
}

/** Abre um modal genérico */
function abrirModal(html, largura = '600px') {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  container.innerHTML = html;
  container.style.maxWidth = largura;
  overlay.classList.remove('hidden');
  container.classList.remove('hidden');
  document.body.classList.add('modal-open');
  // Fecha ao clicar no overlay
  overlay.onclick = fecharModal;
  // Fecha ao pressionar ESC
  document.addEventListener('keydown', handleEsc);
}

function fecharModal() {
  const overlay = document.getElementById('modal-overlay');
  const container = document.getElementById('modal-container');
  overlay.classList.add('hidden');
  container.classList.add('hidden');
  container.innerHTML = '';
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', handleEsc);
}

function handleEsc(e) {
  if (e.key === 'Escape') fecharModal();
}

/** Gera opções para selects de flats */
function opcoesFlats() {
  return DadosDemonstracao.listaFlats().map(f => `<option value="${f}">${f}</option>`).join('');
}

/** Escapa HTML para evitar XSS */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mostra/oculta o campo de forma de pagamento conforme o status */
function _toggleFormaPagamento(status) {
  const grupo = document.getElementById('grupo-forma-pagamento');
  if (!grupo) return;
  if (status === 'Pendente') {
    grupo.hidden = true;
  } else {
    grupo.hidden = false;
  }
}

// ─── Navegação ────────────────────────────────────────────────────────────────

function navegar(rota) {
  if (!ROTAS[rota]) return;

  const usuario = Store.getUsuario();
  if (!usuario) { mostrarLogin(); return; }

  const permissao = ROTAS[rota].permissao;
  if (permissao !== 'dashboard' && !Store.temPermissao(permissao) && permissao !== 'tudo') {
    toast('Você não tem permissão para acessar esta área.', 'erro');
    return;
  }

  rotaAtual = rota;

  // Atualiza links ativos na sidebar e bottom nav
  document.querySelectorAll('[data-rota]').forEach(el => {
    el.classList.toggle('ativo', el.dataset.rota === rota);
  });

  // Renderiza o conteúdo da página
  const container = document.getElementById('page-container');
  container.innerHTML = '<div class="loading-page"><div class="spinner"></div></div>';

  setTimeout(() => {
    try {
      ROTAS[rota].render();
    } catch (e) {
      container.innerHTML = `<div class="erro-pagina">Erro ao carregar a página: ${e.message}</div>`;
      console.error(e);
    }
  }, 80);

  // Fecha sidebar mobile ao navegar
  document.getElementById('sidebar')?.classList.remove('sidebar-aberta');
}

// ─── Histórico de alterações ─────────────────────────────────────────────────

function renderHistorico() {
  const historico = Store.get('historico');
  const nomes = {
    reservas:     'Reservas',
    flats:        'Limpeza',
    manutencao:   'Manutenção',
    tarefas:      'Tarefas',
    solicitacoes: 'Solicitações',
    transacoes:   'Financeiro',
    metas:        'Metas',
    marketing:    'Marketing',
  };

  document.getElementById('page-container').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Histórico de Alterações</h1>
        <p class="page-subtitle">Registro completo de ações realizadas no sistema</p>
      </div>
    </div>

    <div class="card">
      ${historico.length === 0 ? '<p class="vazio">Nenhuma alteração registrada ainda.</p>' : `
      <div class="table-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Usuário</th>
              <th>Módulo</th>
              <th>Item</th>
              <th>Campo</th>
              <th>Anterior</th>
              <th>Novo</th>
            </tr>
          </thead>
          <tbody>
            ${historico.map(h => `
              <tr>
                <td><span class="text-sm">${formatarDataHora(h.timestamp)}</span></td>
                <td><span class="badge badge-info">${esc(h.usuario)}</span></td>
                <td>${esc(nomes[h.modulo] || h.modulo)}</td>
                <td>${esc(h.item)}</td>
                <td>${esc(h.campo)}</td>
                <td><span class="text-muted">${esc(h.anterior)}</span></td>
                <td><strong>${esc(h.novo)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      `}
    </div>
  `;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function mostrarLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function mostrarApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  atualizarInfoUsuario();
}

function atualizarInfoUsuario() {
  const u = Store.getUsuario();
  if (!u) return;
  const el = document.getElementById('usuario-info');
  if (el) {
    el.innerHTML = `
      <div class="usuario-avatar">${u.avatar}</div>
      <div class="usuario-dados">
        <span class="usuario-nome">${u.nome}</span>
        <span class="usuario-perfil">${u.perfil}</span>
      </div>
    `;
  }
  // Oculta links sem permissão
  document.querySelectorAll('[data-permissao]').forEach(el => {
    const p = el.dataset.permissao;
    el.style.display = (p === 'tudo' && u.perfil !== 'gerente') ? 'none' : '';
  });
}

function tentarLogin(e) {
  e.preventDefault();
  const perfil = document.getElementById('login-perfil').value;
  const senha  = document.getElementById('login-senha').value;
  const usuario = USUARIOS.find(u => u.perfil === perfil && u.senha === senha);
  if (!usuario) {
    document.getElementById('login-erro').textContent = 'Usuário ou senha incorretos.';
    document.getElementById('login-senha').classList.add('campo-erro');
    return;
  }
  Store.login(usuario);
  mostrarApp();
  navegar('dashboard');
}

// ─── Backup e Restore ─────────────────────────────────────────────────────────

function exportarBackup() {
  const backup = Store.exportarBackup();
  const json   = JSON.stringify(backup, null, 2);
  const blob   = new Blob([json], { type: 'application/json' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `calamar-backup-${hoje()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup exportado com sucesso!', 'sucesso');
}

function importarBackup(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const dados = JSON.parse(e.target.result);
      Store.importarBackup(dados);
      toast('Backup importado! Recarregando...', 'sucesso');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      toast('Erro ao importar backup: ' + err.message, 'erro');
    }
  };
  reader.readAsText(file);
}

// ─── Toggle sidebar mobile ────────────────────────────────────────────────────

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('sidebar-aberta');
}

// ─── Inicialização ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // 1. Carrega dados do localStorage
  Store.carregar();

  // 2. Inicializa dados de demonstração (se vazio)
  DadosDemonstracao.inicializar();

  // 3. Configura formulário de login
  const formLogin = document.getElementById('form-login');
  if (formLogin) formLogin.addEventListener('submit', tentarLogin);

  // 4. Configura botão de logout
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    Store.logout();
    mostrarLogin();
  });

  // 5. Configura navegação
  document.querySelectorAll('[data-rota]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navegar(el.dataset.rota);
    });
  });

  // 6. Configura toggle de sidebar mobile
  document.getElementById('btn-menu')?.addEventListener('click', toggleSidebar);

  // 7. Verifica se há usuário logado
  const usuario = Store.getUsuario();
  if (usuario) {
    mostrarApp();
    navegar('dashboard');
  } else {
    mostrarLogin();
  }

  // 8. Atualiza dashboard a cada 60 segundos
  setInterval(() => {
    if (rotaAtual === 'dashboard') Dashboard.render();
  }, 60000);
});
