/**
 * Store.js — Gerenciamento de estado e persistência (localStorage)
 * Calamar Flats — Painel Operacional
 */

const Store = (function () {
  'use strict';

  // ─── Estado interno ─────────────────────────────────────────────────────────
  const state = {
    usuario: null,
    reservas: [],
    flats: [],
    manutencao: [],
    tarefas: [],
    solicitacoes: [],
    historico: [],
    transacoes: [],
    metas: [],
    marketing: [],
    estoque: [],
  };

  // ─── Chaves do localStorage ──────────────────────────────────────────────────
  const KEYS = {
    usuario:      'calamar_usuario',
    reservas:     'calamar_reservas',
    flats:        'calamar_flats',
    manutencao:   'calamar_manutencao',
    tarefas:      'calamar_tarefas',
    solicitacoes: 'calamar_solicitacoes',
    historico:    'calamar_historico',
    transacoes:   'calamar_transacoes',
    metas:        'calamar_metas',
    marketing:    'calamar_marketing',
    estoque:      'calamar_estoque',
  };

  // ─── Utilitários internos ────────────────────────────────────────────────────

  /** Gera um ID único baseado em timestamp + random */
  function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /** Persiste um array de estado no localStorage */
  function salvar(key) {
    try {
      localStorage.setItem(KEYS[key], JSON.stringify(state[key]));
    } catch (e) {
      console.error('[Store] Erro ao salvar "' + key + '":', e);
    }
  }

  /** Registra uma entrada no histórico de alterações */
  function registrarHistorico(modulo, item, campo, anterior, novo) {
    const entrada = {
      id:        gerarId(),
      timestamp: new Date().toISOString(),
      usuario:   state.usuario ? state.usuario.nome : 'Sistema',
      modulo,
      item:      String(item || ''),
      campo:     String(campo || ''),
      anterior:  anterior !== undefined && anterior !== null ? String(anterior) : '—',
      novo:      novo      !== undefined && novo      !== null ? String(novo)      : '—',
    };
    state.historico.unshift(entrada);
    // Mantém no máximo 600 entradas para não encher o storage
    if (state.historico.length > 600) state.historico.length = 600;
    salvar('historico');
  }

  // ─── API Pública ─────────────────────────────────────────────────────────────
  return {

    // ── Carregamento ───────────────────────────────────────────────────────────

    /** Carrega todos os dados do localStorage para o estado em memória */
    carregar() {
      // Usuário logado
      const uStr = localStorage.getItem(KEYS.usuario);
      if (uStr) {
        try { state.usuario = JSON.parse(uStr); } catch (_) {}
      }
      // Arrays de dados
      ['reservas', 'flats', 'manutencao', 'tarefas', 'solicitacoes', 'historico', 'transacoes', 'metas', 'marketing', 'estoque'].forEach(key => {
        const raw = localStorage.getItem(KEYS[key]);
        if (raw) {
          try { state[key] = JSON.parse(raw); } catch (_) {}
        }
      });
    },

    // ── Autenticação ───────────────────────────────────────────────────────────

    login(usuario) {
      state.usuario = usuario;
      try { localStorage.setItem(KEYS.usuario, JSON.stringify(usuario)); } catch (_) {}
    },

    logout() {
      state.usuario = null;
      localStorage.removeItem(KEYS.usuario);
    },

    getUsuario() {
      return state.usuario;
    },

    // ── Leitura ────────────────────────────────────────────────────────────────

    /** Retorna uma cópia do array para evitar mutação direta */
    get(key) {
      return Array.isArray(state[key]) ? [...state[key]] : state[key];
    },

    /** Busca um item por ID */
    getById(key, id) {
      return Array.isArray(state[key]) ? state[key].find(i => i.id === id) || null : null;
    },

    // ── CRUD ───────────────────────────────────────────────────────────────────

    /**
     * Adiciona um novo item ao array.
     * @param {string} key  — chave do estado (ex: 'reservas')
     * @param {object} dados — dados do novo item (sem id, sem meta)
     * @param {boolean} log — se deve registrar no histórico
     * @returns {object} item criado (com id e metadados)
     */
    adicionar(key, dados, log = true) {
      const item = {
        ...dados,
        id:        gerarId(),
        criadoEm:  new Date().toISOString(),
        criadoPor: state.usuario ? state.usuario.nome : 'Sistema',
      };
      state[key].push(item);
      salvar(key);
      if (log) {
        const label = dados.titulo || dados.nomeHospede || dados.nome || 'Novo item';
        registrarHistorico(key, label, 'criação', null, 'criado');
      }
      return item;
    },

    /**
     * Atualiza campos de um item existente.
     * @returns {object|null} item atualizado ou null se não encontrado
     */
    atualizar(key, id, alteracoes, log = true) {
      const idx = state[key].findIndex(i => i.id === id);
      if (idx === -1) return null;
      const anterior = { ...state[key][idx] };
      state[key][idx] = {
        ...anterior,
        ...alteracoes,
        atualizadoEm:  new Date().toISOString(),
        atualizadoPor: state.usuario ? state.usuario.nome : 'Sistema',
      };
      salvar(key);
      if (log) {
        const label = anterior.titulo || anterior.nomeHospede || anterior.nome || id;
        Object.keys(alteracoes).forEach(campo => {
          if (anterior[campo] !== alteracoes[campo]) {
            registrarHistorico(key, label, campo, anterior[campo], alteracoes[campo]);
          }
        });
      }
      return state[key][idx];
    },

    /**
     * Remove um item do array.
     * @returns {boolean} true se removido
     */
    excluir(key, id, log = true) {
      const idx = state[key].findIndex(i => i.id === id);
      if (idx === -1) return false;
      const item = state[key][idx];
      state[key].splice(idx, 1);
      salvar(key);
      if (log) {
        const label = item.titulo || item.nomeHospede || item.nome || id;
        registrarHistorico(key, label, 'exclusão', 'existia', 'excluído');
      }
      return true;
    },

    /**
     * Define diretamente o estado de uma chave (usado para inicializar demos).
     * NÃO registra histórico para não poluir o log.
     */
    definir(key, dados) {
      state[key] = dados;
      salvar(key);
    },

    // ── Backup / Restore ───────────────────────────────────────────────────────

    /** Exporta todos os dados como objeto JSON */
    exportarBackup() {
      const backup = {
        versao:      '1.0',
        exportadoEm: new Date().toISOString(),
        dados:       {},
      };
      Object.keys(KEYS).forEach(key => { backup.dados[key] = state[key]; });
      return backup;
    },

    /** Importa dados de um objeto de backup */
    importarBackup(backup) {
      if (!backup || !backup.versao || !backup.dados) {
        throw new Error('Formato de backup inválido. Verifique o arquivo.');
      }
      Object.keys(backup.dados).forEach(key => {
        if (KEYS[key] !== undefined) {
          state[key] = backup.dados[key];
          salvar(key);
        }
      });
    },

    // ── Utilitários ────────────────────────────────────────────────────────────

    /** Verifica se o usuário tem permissão para uma ação */
    temPermissao(permissao) {
      if (!state.usuario) return false;
      const perfil = state.usuario.perfil;
      const permissoes = {
        gerente:   ['tudo'],
        recepcao:  ['reservas', 'solicitacoes', 'tarefas', 'mensagens', 'dashboard', 'relatorio', 'financeiro', 'marketing'],
        limpeza:   ['limpeza', 'dashboard'],
      };
      const lista = permissoes[perfil] || [];
      return lista.includes('tudo') || lista.includes(permissao);
    },

    /** Verifica se já existem dados cadastrados */
    estaVazio() {
      return state.reservas.length === 0 && state.flats.length === 0;
    },

    /** Gerador de ID exposto para uso nos módulos */
    gerarId,

    /** Retorna o estado completo (somente leitura — para debug) */
    _debug() { return { ...state }; },
  };
})();
