/**
 * mensagens.js — Módulo de Geração de Mensagens para Hóspedes
 * Calamar Flats — Painel Operacional
 *
 * Responsabilidades:
 *  - Selecionar templates de mensagem prontos
 *  - Preencher campos dinâmicos (nome, flat, datas, etc.)
 *  - Carregar dados de uma reserva existente
 *  - Pré-visualizar a mensagem formatada e copiar para clipboard
 */

const Mensagens = (() => {

  // ─── Templates de mensagem ───────────────────────────────────────────────────
  // Placeholders: {{nome}}, {{flat}}, {{entrada}}, {{saida}}, {{horario}}, {{endereco}}, {{wifi}}

  const TEMPLATES = [
    {
      id: 'confirmacao',
      nome: 'Confirmação de reserva',
      texto: `Olá, {{nome}}! 🌊

Sua reserva no *Calamar Flats* está confirmada! ✅

🏠 *Flat:* {{flat}}
📅 *Check-in:* {{entrada}}
📅 *Check-out:* {{saida}}

Ficamos muito felizes em recebê-lo(a) em Paraty! Em breve entraremos em contato com as instruções de acesso.

Qualquer dúvida, estamos à disposição. 😊

_Calamar Flats_ 🦑`,
    },
    {
      id: 'horario-chegada',
      nome: 'Pedido de horário de chegada',
      texto: `Olá, {{nome}}! 😊

Tudo bem? Estamos na expectativa de recebê-lo(a) no *Calamar Flats*!

Seu check-in está marcado para *{{entrada}}*. Você poderia nos informar o horário aproximado de chegada? Assim conseguimos garantir que tudo esteja pronto para você. 🏠✨

Aguardamos seu retorno!

_Calamar Flats_ 🦑`,
    },
    {
      id: 'checkin',
      nome: 'Instruções de check-in',
      texto: `Olá, {{nome}}! 🎉

Seu check-in no *Calamar Flats* é dia *{{entrada}}* a partir das *{{horario}}*.

📍 *Endereço:* {{endereco}}

🔑 *Acesso ao flat:*
Ao chegar, dirija-se à recepção para retirar as chaves do *{{flat}}*. Nossa equipe estará aguardando você!

📶 *Wi-Fi:* calamarflats | *Senha:* {{wifi}}

Bem-vindo(a) a Paraty! Qualquer dúvida, é só chamar. 🌴

_Calamar Flats_ 🦑`,
    },
    {
      id: 'como-chegar',
      nome: 'Como chegar / Localização',
      texto: `Olá, {{nome}}! 🗺️

Segue como chegar ao *Calamar Flats*:

📍 *Endereço:* {{endereco}}

🚗 *De carro:* Entre no Centro Histórico pela entrada principal. Estamos a 2 minutos da Praça da Matriz. Há estacionamento conveniado próximo.

🚌 *De ônibus:* Desça no terminal rodoviário de Paraty e pegue um mototáxi ou táxi até o endereço acima (aprox. 10 minutos).

Caso tenha dificuldades para nos encontrar, ligue ou mande mensagem e vamos orientá-lo(a)! 😊

_Calamar Flats_ 🦑`,
    },
    {
      id: 'quarto-pronto',
      nome: 'Aviso de quarto pronto',
      texto: `Olá, {{nome}}! ✨

Boa notícia! O *{{flat}}* está arrumado e pronto para recebê-lo(a). 🏠

Pode chegar quando quiser! Nossa equipe estará à sua disposição.

_Calamar Flats_ 🦑`,
    },
    {
      id: 'boas-vindas',
      nome: 'Boas-vindas',
      texto: `Olá, {{nome}}! 🥳

Seja muito bem-vindo(a) ao *Calamar Flats*! É uma alegria recebê-lo(a) em Paraty. 🌊🌴

Você está no *{{flat}}*. Esperamos que sua estadia seja incrível!

Precisando de qualquer coisa — dicas de restaurantes, passeios de barco, informações sobre o Centro Histórico — é só chamar. Estamos aqui para tornar sua visita inesquecível. 😊

Boa hospedagem!

_Calamar Flats_ 🦑`,
    },
    {
      id: 'acompanhamento',
      nome: 'Acompanhamento durante a hospedagem',
      texto: `Olá, {{nome}}! 😊

Espero que esteja aproveitando muito Paraty e que o *{{flat}}* esteja do seu agrado!

Gostaríamos de saber se está tudo bem com a sua acomodação e se há algo que possamos fazer para tornar sua estadia ainda melhor.

Não hesite em nos chamar! 🌊

_Calamar Flats_ 🦑`,
    },
    {
      id: 'lembrete-checkout',
      nome: 'Lembrete de checkout',
      texto: `Olá, {{nome}}! 👋

Passando para lembrar que o seu checkout no *Calamar Flats* está marcado para amanhã, *{{saida}}*, até as *{{horario}}*.

Por favor, devolva as chaves na recepção antes do horário. Caso precise de mais tempo, entre em contato o quanto antes e verificaremos a disponibilidade. 😊

Foi um prazer enorme recebê-lo(a)!

_Calamar Flats_ 🦑`,
    },
    {
      id: 'agradecimento',
      nome: 'Agradecimento',
      texto: `Olá, {{nome}}! 🌊

Esperamos que sua estadia no *Calamar Flats* tenha sido incrível e que Paraty tenha te encantado!

Foi uma honra recebê-lo(a). Já sentimos sua falta! 😊

Volte sempre — as portas do *Calamar Flats* estarão sempre abertas para você. Até a próxima aventura! 🌴

_Calamar Flats_ 🦑`,
    },
    {
      id: 'avaliacao',
      nome: 'Pedido de avaliação',
      texto: `Olá, {{nome}}! ⭐

Esperamos que sua passagem pelo *Calamar Flats* tenha sido maravilhosa!

Se tiver um minutinho, sua avaliação é muito importante para nós e ajuda outros viajantes a descobrir Paraty. Você pode nos avaliar diretamente na plataforma onde fez sua reserva.

Muito obrigado pela confiança e até a próxima! 🙏🌊

_Calamar Flats_ 🦑`,
    },
    {
      id: 'reclamacao',
      nome: 'Resposta a reclamação',
      texto: `Olá, {{nome}},

Agradecemos muito por nos contatar e por compartilhar sua experiência conosco. Pedimos sinceras desculpas pelo inconveniente que ocorreu durante a sua estadia no *{{flat}}*.

Sua satisfação é nossa prioridade e estamos tomando as providências necessárias para que isso não se repita.

Gostaríamos de conversar mais sobre o ocorrido para encontrar a melhor solução. Poderia nos ligar ou mandar uma mensagem?

Mais uma vez, pedimos desculpas e esperamos ter a oportunidade de reconquistar sua confiança.

_Calamar Flats_ 🦑`,
    },
  ];

  // ─── Estado local ─────────────────────────────────────────────────────────────
  let _templateAtual = TEMPLATES[0].id;

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Lê os valores dos campos e substitui os placeholders no template selecionado.
   * @returns {string} Mensagem pronta para copiar
   */
  function _gerarMensagem() {
    const template = TEMPLATES.find(t => t.id === _templateAtual);
    if (!template) return '';

    const campos = _lerCampos();

    // Formata datas para leitura humana se preenchidas
    const entradaFmt = campos.entrada ? formatarData(campos.entrada) : '___';
    const saidaFmt   = campos.saida   ? formatarData(campos.saida)   : '___';

    return template.texto
      .replace(/\{\{nome\}\}/g,     campos.nome     || '___')
      .replace(/\{\{flat\}\}/g,     campos.flat     || '___')
      .replace(/\{\{entrada\}\}/g,  entradaFmt)
      .replace(/\{\{saida\}\}/g,    saidaFmt)
      .replace(/\{\{horario\}\}/g,  campos.horario  || '___')
      .replace(/\{\{endereco\}\}/g, campos.endereco || '___')
      .replace(/\{\{wifi\}\}/g,     campos.wifi     || '___');
  }

  /**
   * Lê todos os campos do formulário e retorna um objeto.
   */
  function _lerCampos() {
    const g = id => {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    return {
      nome    : g('msg-nome'),
      flat    : g('msg-flat'),
      entrada : g('msg-entrada'),
      saida   : g('msg-saida'),
      horario : g('msg-horario'),
      endereco: g('msg-endereco'),
      wifi    : g('msg-wifi'),
    };
  }

  /**
   * Atualiza o painel de pré-visualização com a mensagem gerada.
   */
  function _atualizarPreview() {
    const msg     = _gerarMensagem();
    const preview = document.getElementById('msg-preview');
    const count   = document.getElementById('msg-count');
    if (!preview) return;

    // Formata texto do WhatsApp: *negrito*, _itálico_, quebras de linha
    const htmlFormatado = esc(msg)
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g,   '<em>$1</em>')
      .replace(/\n/g,         '<br>');

    preview.innerHTML = htmlFormatado;
    if (count) count.textContent = `${msg.length} caracteres`;
  }

  // ─── HTML dos campos de formulário ───────────────────────────────────────────

  function _htmlCampos() {
    // Lista de flats para o select
    const optsFlat = `<option value="">Selecione o flat…</option>${opcoesFlats()}`;

    return `
      <div class="form-group">
        <label class="form-label">Nome do hóspede</label>
        <input class="form-input" id="msg-nome" type="text" placeholder="Ex: João Silva" autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">Flat</label>
        <select class="form-select" id="msg-flat">
          ${optsFlat}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Data de entrada</label>
          <input class="form-input" id="msg-entrada" type="date">
        </div>
        <div class="form-group">
          <label class="form-label">Data de saída</label>
          <input class="form-input" id="msg-saida" type="date">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Horário</label>
        <input class="form-input" id="msg-horario" type="time" value="14:00">
      </div>
      <div class="form-group">
        <label class="form-label">Endereço</label>
        <input class="form-input" id="msg-endereco" type="text" value="Rua do Comércio, 123, Centro Histórico, Paraty - RJ">
      </div>
      <div class="form-group">
        <label class="form-label">Senha do Wi-Fi</label>
        <input class="form-input" id="msg-wifi" type="text" value="calamar2024">
      </div>`;
  }

  // ─── HTML principal ───────────────────────────────────────────────────────────

  function _htmlPrincipal() {
    // Options para o select de templates
    const optsTemplates = TEMPLATES.map(t =>
      `<option value="${esc(t.id)}" ${_templateAtual === t.id ? 'selected' : ''}>${esc(t.nome)}</option>`
    ).join('');

    // Options para carregar da reserva
    const reservas = Store.get('reservas');
    const optsReservas = [
      '<option value="">↕ Carregar dados de uma reserva…</option>',
      ...reservas.map(r =>
        `<option value="${esc(r.id)}">${esc(r.nomeHospede)} — ${esc(r.flat)} (${formatarData(r.dataEntrada)})</option>`
      ),
    ].join('');

    return `
      <!-- Cabeçalho -->
      <div class="page-header">
        <div>
          <h1 class="page-title">💬 Mensagens</h1>
          <p class="page-subtitle">Gerador de mensagens para hóspedes via WhatsApp</p>
        </div>
      </div>

      <!-- Dois painéis lado a lado -->
      <div class="mensagens-layout">

        <!-- ── Painel esquerdo: campos ─────────────────── -->
        <div class="mensagens-painel-campos card">
          <h3 style="margin-bottom:1rem;">⚙️ Configuração</h3>

          <!-- Carregar de reserva -->
          <div class="form-group">
            <label class="form-label">Carregar de uma reserva</label>
            <select class="form-select" id="msg-reserva-select">
              ${optsReservas}
            </select>
          </div>

          <hr style="border:none;border-top:1px solid var(--borda);margin:1rem 0;">

          <!-- Template -->
          <div class="form-group">
            <label class="form-label">Modelo de mensagem</label>
            <select class="form-select" id="msg-template-select">
              ${optsTemplates}
            </select>
          </div>

          <hr style="border:none;border-top:1px solid var(--borda);margin:1rem 0;">

          <!-- Campos dinâmicos -->
          <div id="msg-campos">
            ${_htmlCampos()}
          </div>
        </div>

        <!-- ── Painel direito: preview ──────────────────── -->
        <div class="mensagens-painel-preview">
          <div class="card" style="height:100%;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
              <h3>📱 Pré-visualização</h3>
              <span class="text-sm text-muted" id="msg-count">0 caracteres</span>
            </div>

            <!-- Bolha estilo WhatsApp -->
            <div class="msg-bubble-wrapper">
              <div class="msg-bubble" id="msg-preview">
                <em class="text-muted">A mensagem aparecerá aqui…</em>
              </div>
            </div>

            <!-- Botão copiar -->
            <button class="btn btn-primario" id="btn-copiar-msg" style="width:100%;margin-top:1rem;font-size:1rem;padding:.85rem;">
              📋 Copiar mensagem
            </button>
          </div>
        </div>

      </div>`;
  }

  // ─── Preenchimento a partir de reserva ───────────────────────────────────────

  function _carregarReserva(id) {
    if (!id) return;
    const r = Store.getById('reservas', id);
    if (!r) return;

    const set = (elId, val) => {
      const el = document.getElementById(elId);
      if (el) el.value = val || '';
    };

    set('msg-nome',    r.nomeHospede);
    set('msg-flat',    r.flat);
    set('msg-entrada', r.dataEntrada);
    set('msg-saida',   r.dataSaida);
    set('msg-horario', r.horarioChegada || '14:00');

    _atualizarPreview();
    toast(`Dados de ${r.nomeHospede} carregados!`, 'sucesso');
  }

  // ─── Copiar para clipboard ────────────────────────────────────────────────────

  async function _copiarMensagem() {
    const msg = _gerarMensagem();
    if (!msg) { toast('Nenhuma mensagem para copiar.', 'aviso'); return; }

    try {
      await navigator.clipboard.writeText(msg);
      toast('Mensagem copiada para a área de transferência! 📋', 'sucesso');
    } catch {
      // Fallback para ambientes sem permissão de clipboard
      const ta = document.createElement('textarea');
      ta.value = msg;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast('Mensagem copiada! 📋', 'sucesso');
    }
  }

  // ─── Bind de eventos ─────────────────────────────────────────────────────────

  function _bindEventos() {
    const container = document.getElementById('page-container');
    if (!container) return;

    // Atualiza preview em tempo real conforme digitação
    container.addEventListener('input', e => {
      const ids = ['msg-nome','msg-flat','msg-entrada','msg-saida','msg-horario','msg-endereco','msg-wifi'];
      if (ids.includes(e.target.id)) {
        _atualizarPreview();
      }
    });

    container.addEventListener('change', e => {
      // Troca de template
      if (e.target.id === 'msg-template-select') {
        _templateAtual = e.target.value;
        _atualizarPreview();
        return;
      }

      // Flat select (atualiza preview também)
      if (e.target.id === 'msg-flat') {
        _atualizarPreview();
        return;
      }

      // Carregar reserva
      if (e.target.id === 'msg-reserva-select') {
        _carregarReserva(e.target.value);
        return;
      }
    });

    container.addEventListener('click', e => {
      if (e.target.id === 'btn-copiar-msg') {
        _copiarMensagem();
      }
    });
  }

  // ─── render() público ─────────────────────────────────────────────────────────

  function render() {
    if (!Store.temPermissao('mensagens')) {
      document.getElementById('page-container').innerHTML =
        '<div class="vazio">⛔ Você não tem permissão para acessar este módulo.</div>';
      return;
    }

    // Injeta estilos específicos (idempotente)
    if (!document.getElementById('mensagens-styles')) {
      const style = document.createElement('style');
      style.id = 'mensagens-styles';
      style.textContent = `
        .mensagens-layout {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .mensagens-layout {
            grid-template-columns: 1fr;
          }
        }
        .mensagens-painel-campos { padding: 1.5rem; }
        .mensagens-painel-preview { position: sticky; top: 1rem; }
        .msg-bubble-wrapper {
          background: #e5ddd5;
          border-radius: 12px;
          padding: 1rem;
          min-height: 260px;
          max-height: 420px;
          overflow-y: auto;
        }
        .msg-bubble {
          background: #dcf8c6;
          border-radius: 8px 8px 2px 8px;
          padding: 1rem 1.2rem;
          line-height: 1.6;
          font-size: .95rem;
          white-space: pre-wrap;
          box-shadow: 0 1px 3px rgba(0,0,0,.15);
          word-break: break-word;
        }
        #btn-copiar-msg { letter-spacing: .03em; }
      `;
      document.head.appendChild(style);
    }

    document.getElementById('page-container').innerHTML = _htmlPrincipal();
    _atualizarPreview(); // popula preview com defaults
    _bindEventos();
  }

  // ─── API pública ──────────────────────────────────────────────────────────────
  return { render };
})();
