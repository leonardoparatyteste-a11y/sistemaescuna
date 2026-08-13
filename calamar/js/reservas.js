/**
 * reservas.js — Módulo de Reservas
 * Calamar Flats — Painel Operacional
 *
 * Lista, filtra, cria, edita e remove reservas.
 */

const Reservas = (() => {

  // ─────────────────────────────────────────────
  // Estado interno dos filtros (persiste durante a sessão do módulo)
  // ─────────────────────────────────────────────
  let _filtros = {
    dataEntradaDe:  '',
    dataEntradaAte: '',
    canal:          '',
    pagamento:      '',
    busca:          '',
  };

  // ─────────────────────────────────────────────
  // Badges helpers
  // ─────────────────────────────────────────────

  function _badgeCanal(canal) {
    const map = { 'Booking': 'badge-azul', 'Airbnb': 'badge-vermelho', 'Omnibees': 'badge-roxo', 'Reserva direta': 'badge-verde', 'Outros': 'badge-cinza' };
    return `<span class="badge ${map[canal] || 'badge-cinza'}">${esc(canal || '—')}</span>`;
  }

  function _badgePagamento(status) {
    const map = { 'Pago': 'badge-verde', 'Parcialmente pago': 'badge-amarelo', 'Pendente': 'badge-vermelho' };
    return `<span class="badge ${map[status] || 'badge-cinza'}">${esc(status || '—')}</span>`;
  }

  function _badgeMensagem(status) {
    const map = { 'Enviada': 'badge-verde', 'Parcialmente enviada': 'badge-amarelo', 'Não enviada': 'badge-vermelho' };
    return `<span class="badge ${map[status] || 'badge-cinza'}">${esc(status || '—')}</span>`;
  }

  // ─────────────────────────────────────────────
  // Filtragem client-side
  // ─────────────────────────────────────────────

  function _filtrarReservas(reservas) {
    const { dataEntradaDe, dataEntradaAte, canal, pagamento, busca } = _filtros;
    const buscaLower = (busca || '').toLowerCase().trim();

    return reservas.filter(r => {
      if (dataEntradaDe  && r.dataEntrada < dataEntradaDe)  return false;
      if (dataEntradaAte && r.dataEntrada > dataEntradaAte) return false;
      if (canal          && r.canal !== canal)               return false;
      if (pagamento      && r.statusPagamento !== pagamento) return false;
      if (buscaLower && !(r.nomeHospede || '').toLowerCase().includes(buscaLower)) return false;
      return true;
    });
  }

  // ─────────────────────────────────────────────
  // Tabela de reservas
  // ─────────────────────────────────────────────

  function _renderTabela(reservas) {
    const dHoje = hoje();
    const filtradas = _filtrarReservas(reservas);

    if (filtradas.length === 0) {
      return `<div class="vazio">Nenhuma reserva encontrada para os filtros selecionados.</div>`;
    }

    // Ordena por data de entrada (mais recentes primeiro)
    const ordenadas = [...filtradas].sort((a, b) => b.dataEntrada.localeCompare(a.dataEntrada));

    const linhas = ordenadas.map(r => {
      const chegaHoje  = r.dataEntrada === dHoje;
      const saiHoje    = r.dataSaida   === dHoje;

      // Estilo de linha especial para chegadas hoje
      const estiloLinha = chegaHoje
        ? 'border-left:3px solid var(--cor-primaria,#1a73e8);background:rgba(26,115,232,.04);'
        : '';

      const indicadorSaida = saiHoje
        ? `<span title="Saída hoje" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-left:4px;vertical-align:middle;"></span>`
        : '';

      return `
        <tr style="${estiloLinha}" data-id="${esc(r.id)}">
          <td>
            <span style="font-weight:600;">${esc(r.nomeHospede)}</span>
            ${chegaHoje ? `<span class="badge badge-azul" style="margin-left:.4rem;font-size:.68rem;">Hoje</span>` : ''}
          </td>
          <td>${esc(r.flat || '—')}</td>
          <td>${_badgeCanal(r.canal)}</td>
          <td>${formatarData(r.dataEntrada)}</td>
          <td>${formatarData(r.dataSaida)}${indicadorSaida}</td>
          <td style="text-align:center;">${r.quantidadeHospedes || '—'}</td>
          <td>${r.horarioChegada || '<span class="text-muted">—</span>'}</td>
          <td>${_badgePagamento(r.statusPagamento)}</td>
          <td>${_badgeMensagem(r.statusMensagem)}</td>
          <td>
            <div style="display:flex;gap:.35rem;">
              <button class="btn btn-sm btn-secundario btn-editar-reserva"
                      data-id="${esc(r.id)}" title="Editar reserva">✏️</button>
              <button class="btn btn-sm btn-perigo btn-excluir-reserva"
                      data-id="${esc(r.id)}" title="Excluir reserva">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="table-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Hóspede</th>
              <th>Flat</th>
              <th>Canal</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th style="text-align:center;">Hóspedes</th>
              <th>Chegada</th>
              <th>Pagamento</th>
              <th>Mensagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${linhas}
          </tbody>
        </table>
      </div>
      <p class="text-sm text-muted" style="margin-top:.6rem;">
        ${filtradas.length} reserva${filtradas.length !== 1 ? 's' : ''} encontrada${filtradas.length !== 1 ? 's' : ''}.
      </p>
    `;
  }

  // ─────────────────────────────────────────────
  // Modal de formulário Nova / Editar Reserva
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
  // Extrai dados de texto OCR com regex inteligente
  // ─────────────────────────────────────────────

  function _extrairDadosDoTexto(texto) {
    const t = texto;
    const dados = {};

    // ── Nome do hóspede ──────────────────────────
    const nomePatterns = [
      /(?:hóspede|hospede|guest|nome|name|cliente|booker)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+){1,4})/i,
      /(?:reserva\s+(?:de|por)|booked\s+by)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+){1,4})/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Úa-zà-ú]+){1,4})$/m,
    ];
    for (const p of nomePatterns) {
      const m = t.match(p);
      if (m && m[1] && m[1].trim().length > 3) { dados.nome = m[1].trim(); break; }
    }

    // ── Telefone ─────────────────────────────────
    const telM = t.match(/(\+?\d{1,3}[\s-]?)?(?:\(?\d{2}\)?[\s-]?)?(?:9\d{4}[\s-]?\d{4}|\d{4}[\s-]?\d{4})/);
    if (telM) dados.telefone = telM[0].replace(/[^0-9+]/g, '').replace(/^(\.{2})/, '($1)').trim();

    // ── Canal ────────────────────────────────────
    if (/booking\.com|booking/i.test(t))         dados.canal = 'Booking';
    else if (/airbnb/i.test(t))                  dados.canal = 'Airbnb';
    else if (/omnibees/i.test(t))                dados.canal = 'Omnibees';
    else if (/whatsapp|direta|direto|direct/i.test(t)) dados.canal = 'Reserva direta';

    // ── Datas ────────────────────────────────────
    // Formatos suportados: dd/mm/aaaa | dd-mm-aaaa | aaaa-mm-dd | mmm dd, aaaa
    function _toISO(dia, mes, ano) {
      const d = String(dia).padStart(2,'0');
      const m = String(mes).padStart(2,'0');
      const a = String(ano).length === 2 ? '20'+ano : String(ano);
      return `${a}-${m}-${d}`;
    }

    const meses = { jan:1, fev:2, feb:2, mar:3, abr:4, apr:4, mai:5, may:5, jun:6, jul:7, ago:8, aug:8, set:9, sep:9, out:10, oct:10, nov:11, dez:12, dec:12 };

    // Coleta todas as datas encontradas no texto
    const datasEncontradas = [];

    // dd/mm/aaaa ou dd-mm-aaaa
    const reDMY = /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/g;
    let mDMY;
    while ((mDMY = reDMY.exec(t)) !== null) {
      const iso = _toISO(mDMY[1], mDMY[2], mDMY[3]);
      if (!isNaN(Date.parse(iso))) datasEncontradas.push(iso);
    }

    // aaaa-mm-dd (ISO)
    const reISO = /(\d{4})-(\d{2})-(\d{2})/g;
    let mISO;
    while ((mISO = reISO.exec(t)) !== null) {
      const iso = `${mISO[1]}-${mISO[2]}-${mISO[3]}`;
      if (!isNaN(Date.parse(iso))) datasEncontradas.push(iso);
    }

    // "15 de julho de 2026" ou "15 julho 2026"
    const rePT = /(\d{1,2})\s+(?:de\s+)?([a-zç]{3,})\.?\s+(?:de\s+)?(\d{4})/gi;
    let mPT;
    while ((mPT = rePT.exec(t)) !== null) {
      const nomeMes = mPT[2].toLowerCase().substring(0,3);
      const mes = meses[nomeMes];
      if (mes) {
        const iso = _toISO(mPT[1], mes, mPT[3]);
        if (!isNaN(Date.parse(iso))) datasEncontradas.push(iso);
      }
    }

    // Pares de palavras-chave: check-in antes, check-out depois
    const checkinM = t.match(/(?:check.?in|entrada|arrival|chegada)[:\s]+([\d\/\-]+)/i);
    const checkoutM = t.match(/(?:check.?out|saida|saída|departure|partida)[:\s]+([\d\/\-]+)/i);

    if (checkinM) {
      const parts = checkinM[1].split(/[\/-]/);
      if (parts.length === 3) {
        const iso = parts[2].length === 4 ? _toISO(parts[0], parts[1], parts[2]) : _toISO(parts[2], parts[1], parts[0]);
        if (!isNaN(Date.parse(iso))) dados.entrada = iso;
      }
    }
    if (checkoutM) {
      const parts = checkoutM[1].split(/[\/-]/);
      if (parts.length === 3) {
        const iso = parts[2].length === 4 ? _toISO(parts[0], parts[1], parts[2]) : _toISO(parts[2], parts[1], parts[0]);
        if (!isNaN(Date.parse(iso))) dados.saida = iso;
      }
    }

    // Se não achou por palavras-chave, usa as duas primeiras datas distintas e ordenadas
    if (!dados.entrada && !dados.saida && datasEncontradas.length >= 2) {
      const unicas = [...new Set(datasEncontradas)].sort();
      dados.entrada = unicas[0];
      dados.saida   = unicas[1];
    } else if (!dados.entrada && datasEncontradas.length >= 1) {
      dados.entrada = datasEncontradas[0];
    }

    // ── Quantidade de hóspedes ───────────────────
    const qtdM = t.match(/(\d+)\s*(?:hóspedes|hospedes|pessoas|adults?|adultos?|guests?|pax)/i);
    if (qtdM) dados.qtd = parseInt(qtdM[1], 10);

    // ── Flat ─────────────────────────────────────
    const flatM = t.match(/flat\s*(\d{1,2})/i);
    if (flatM) {
      const n = String(parseInt(flatM[1], 10)).padStart(2, '0');
      dados.flat = `Flat ${n}`;
    }

    // ── Horário de chegada ───────────────────────
    const horaM = t.match(/(?:chegada|arrival|check.?in)[^\n]*?(\d{1,2})[h:\s](\d{2})/i);
    if (horaM) dados.horario = `${String(horaM[1]).padStart(2,'0')}:${horaM[2]}`;

    return dados;
  }

  // ─────────────────────────────────────────────
  // Preenche o formulário com os dados extraídos
  // ─────────────────────────────────────────────

  function _preencherFormulario(dados) {
    let preenchidos = 0;

    if (dados.nome) {
      const el = document.getElementById('res-nome');
      if (el && !el.value) { el.value = dados.nome; preenchidos++; }
    }
    if (dados.flat) {
      const el = document.getElementById('res-flat');
      if (el) {
        const opt = [...el.options].find(o => o.value === dados.flat);
        if (opt) { el.value = dados.flat; preenchidos++; }
      }
    }
    if (dados.canal) {
      const el = document.getElementById('res-canal');
      if (el) { el.value = dados.canal; preenchidos++; }
    }
    if (dados.entrada) {
      const el = document.getElementById('res-entrada');
      if (el && !el.value) { el.value = dados.entrada; preenchidos++; }
    }
    if (dados.saida) {
      const el = document.getElementById('res-saida');
      if (el && !el.value) { el.value = dados.saida; preenchidos++; }
    }
    if (dados.qtd) {
      const el = document.getElementById('res-qtd');
      if (el && !el.value) { el.value = dados.qtd; preenchidos++; }
    }
    if (dados.telefone) {
      const el = document.getElementById('res-telefone');
      if (el && !el.value) { el.value = dados.telefone; preenchidos++; }
    }
    if (dados.horario) {
      const el = document.getElementById('res-horario');
      if (el && !el.value) { el.value = dados.horario; preenchidos++; }
    }

    return preenchidos;
  }

  // ─────────────────────────────────────────────
  // Processa a imagem via OCR (Tesseract.js)
  // ─────────────────────────────────────────────

  async function _processarImagemReserva(file) {
    const dropzone = document.getElementById('upload-reserva-dropzone');
    if (!dropzone) return;

    // Mostra progresso
    dropzone.innerHTML = `
      <div class="upload-reserva-progress">
        <div class="upload-reserva-spinner"></div>
        <span class="upload-reserva-status" id="upload-reserva-status-txt">Iniciando leitura...</span>
      </div>`;

    const setStatus = (msg) => {
      const el = document.getElementById('upload-reserva-status-txt');
      if (el) el.textContent = msg;
    };

    try {
      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract.js não foi carregado. Verifique a conexão com a internet.');
      }

      setStatus('Carregando motor OCR...');
      const worker = await Tesseract.createWorker(['por', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setStatus(`Lendo imagem... ${pct}%`);
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setStatus('Analisando informações...');
      await new Promise(r => setTimeout(r, 400));

      const dados = _extrairDadosDoTexto(text);
      const qtd = _preencherFormulario(dados);

      // Restaura a dropzone
      _renderDropzone();

      if (qtd > 0) {
        toast(`✅ ${qtd} campo${qtd > 1 ? 's' : ''} preenchido${qtd > 1 ? 's' : ''} automaticamente!`, 'sucesso', 4000);
      } else {
        toast('Imagem lida, mas não encontrei dados reconhecíveis. Preencha manualmente.', 'aviso', 5000);
      }
    } catch (err) {
      _renderDropzone();
      toast('Erro ao ler a imagem: ' + err.message, 'erro', 5000);
      console.error('[OCR]', err);
    }
  }

  // ─────────────────────────────────────────────
  // Simulação com dados de exemplo
  // ─────────────────────────────────────────────

  function _simularScan() {
    const dropzone = document.getElementById('upload-reserva-dropzone');
    if (!dropzone) return;

    // Anima o progresso simulado
    dropzone.innerHTML = `
      <div class="upload-reserva-progress">
        <div class="upload-reserva-spinner"></div>
        <span class="upload-reserva-status" id="upload-reserva-status-txt">Lendo imagem... 0%</span>
      </div>`;

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 18) + 8;
      if (pct > 100) pct = 100;
      const el = document.getElementById('upload-reserva-status-txt');
      if (el) el.textContent = pct < 100 ? `Lendo imagem... ${pct}%` : 'Analisando informações...';
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          // Dados de exemplo extraídos de um print do Booking.com
          const textoExemplo = `
            Booking.com — Confirmação de Reserva
            Hóspede: Carlos Eduardo Mendes
            Telefone: (24) 98876-5432
            Check-in: 25/07/2026
            Check-out: 28/07/2026
            Flat 03
            2 hóspedes
            Chegada prevista: 14h00
          `;
          const dados = _extrairDadosDoTexto(textoExemplo);
          const qtd = _preencherFormulario(dados);
          _renderDropzone();
          toast(`✅ Simulação: ${qtd} campos preenchidos automaticamente!`, 'sucesso', 4000);
        }, 500);
      }
    }, 120);
  }

  // ─────────────────────────────────────────────
  // Renderiza (ou restaura) a dropzone de upload
  // ─────────────────────────────────────────────

  function _renderDropzone() {
    const dropzone = document.getElementById('upload-reserva-dropzone');
    if (!dropzone) return;
    dropzone.innerHTML = `
      <span style="font-size:1.8rem;">📸</span>
      <span class="upload-reserva-text">Arraste um print ou clique para selecionar</span>
      <span class="upload-reserva-subtext">Booking · Airbnb · WhatsApp · qualquer imagem com texto</span>
      <input type="file" id="upload-reserva-input" accept="image/*"
             style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
    `;
    // Re-bind do input de arquivo
    const input = document.getElementById('upload-reserva-input');
    if (input) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) _processarImagemReserva(file);
      });
    }
  }

  // ─────────────────────────────────────────────
  // Modal de formulário Nova / Editar Reserva
  // ─────────────────────────────────────────────

  function _abrirFormulario(reservaExistente = null) {
    const editando = !!reservaExistente;
    const r = reservaExistente || {};

    const titulo = editando ? 'Editar Reserva' : 'Nova Reserva';

    // Pré-seleciona valores para edição
    const sel = (valor, opcao) => valor === opcao ? 'selected' : '';
    const val = (campo) => esc(r[campo] || '');

    // Bloco de upload inteligente (apenas em novas reservas)
    const blocoUpload = editando ? '' : `
      <div class="upload-reserva-container">
        <div class="upload-reserva-title">
          🤖 Importar dados de imagem
          <span style="font-size:0.7rem;font-weight:400;color:var(--texto-muted);">— preenche automaticamente</span>
        </div>
        <div class="upload-reserva-dropzone" id="upload-reserva-dropzone">
          <span style="font-size:1.8rem;">📸</span>
          <span class="upload-reserva-text">Arraste um print ou clique para selecionar</span>
          <span class="upload-reserva-subtext">Booking · Airbnb · WhatsApp · qualquer imagem com texto</span>
          <input type="file" id="upload-reserva-input" accept="image/*"
                 style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
        </div>
        <div class="upload-reserva-actions">
          <button type="button" class="btn-simular-scan" id="btn-simular-scan">
            ⚡ Simular com exemplo
          </button>
          <span style="font-size:0.68rem;color:var(--texto-muted);align-self:center;">
            Suporta JPG, PNG, PDF, screenshot
          </span>
        </div>
      </div>
    `;

    const html = `
      <div style="padding:1.5rem;">
        <h2 style="margin-bottom:1.25rem;font-size:1.2rem;">${titulo}</h2>

        ${blocoUpload}

        <form id="form-reserva" novalidate>
          <input type="hidden" id="res-id" value="${val('id')}">

          <!-- Nome e Flat -->
          <div class="form-row">
            <div class="form-group" style="flex:2;">
              <label class="form-label" for="res-nome">Nome do hóspede <span style="color:#dc3545">*</span></label>
              <input class="form-input" id="res-nome" type="text"
                     placeholder="Ex: João da Silva" value="${val('nomeHospede')}" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-flat">Flat <span style="color:#dc3545">*</span></label>
              <select class="form-select" id="res-flat" required>
                <option value="">Selecione...</option>
                ${(() => {
                  const flatAtual = r.flat || '';
                  const opts = Array.from({length: 8}, (_, i) => {
                    const n = String(i + 1).padStart(2, '0');
                    const label = `Flat ${n}`;
                    return `<option value="${label}" ${flatAtual === label ? 'selected' : ''}>${label}</option>`;
                  });
                  return opts.join('');
                })()}
              </select>
            </div>
          </div>

          <!-- Canal -->
          <div class="form-group">
            <label class="form-label" for="res-canal">Canal <span style="color:#dc3545">*</span></label>
            <select class="form-select" id="res-canal" required>
              <option value="">Selecione...</option>
              <option value="Booking"        ${sel(r.canal,'Booking')}>Booking</option>
              <option value="Airbnb"         ${sel(r.canal,'Airbnb')}>Airbnb</option>
              <option value="Omnibees"       ${sel(r.canal,'Omnibees')}>Omnibees</option>
              <option value="Reserva direta" ${sel(r.canal,'Reserva direta')}>Reserva direta</option>
              <option value="Outros"         ${sel(r.canal,'Outros')}>Outros</option>
            </select>
          </div>

          <!-- Datas de entrada e saída -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-entrada">Data de entrada <span style="color:#dc3545">*</span></label>
              <input class="form-input" id="res-entrada" type="date" value="${val('dataEntrada')}" required>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-saida">Data de saída <span style="color:#dc3545">*</span></label>
              <input class="form-input" id="res-saida" type="date" value="${val('dataSaida')}" required>
            </div>
          </div>

          <!-- Qtd hóspedes e horário de chegada -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-qtd">Quantidade de hóspedes</label>
              <input class="form-input" id="res-qtd" type="number" min="1" max="10"
                     placeholder="1" value="${val('quantidadeHospedes')}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-horario">Horário previsto de chegada</label>
              <input class="form-input" id="res-horario" type="time" value="${val('horarioChegada')}">
            </div>
          </div>

          <!-- Telefone e Aniversário -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-telefone">Telefone</label>
              <input class="form-input" id="res-telefone" type="tel"
                     placeholder="(24) 99999-9999" value="${val('telefone')}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-aniversario">🎂 Aniversário do cliente</label>
              <input class="form-input" id="res-aniversario" type="date"
                     value="${val('aniversario')}" title="Data de nascimento / aniversário">
            </div>
          </div>

          <!-- Separador financeiro -->
          <div style="border-top:1px solid var(--cinza-claro);margin:4px 0 16px;padding-top:12px;">
            <span style="font-size:0.75rem;font-weight:700;color:var(--texto-muted);text-transform:uppercase;letter-spacing:.05em;">💰 Financeiro</span>
          </div>

          <!-- Valor total e Comissão OTA -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-valor-total">Valor total da reserva (R$)</label>
              <input class="form-input" id="res-valor-total" type="number" min="0" step="0.01"
                     placeholder="0,00" value="${val('valorTotal')}">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-comissao-ota">Comissão da OTA (R$)</label>
              <input class="form-input" id="res-comissao-ota" type="number" min="0" step="0.01"
                     placeholder="0,00" value="${val('comissaoOta')}">
            </div>
          </div>

          <!-- Status pagamento -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-pagamento">Status do pagamento</label>
              <select class="form-select" id="res-pagamento" onchange="_toggleFormaPagamento(this.value)">
                <option value="Pendente"          ${sel(r.statusPagamento,'Pendente')}>Pendente</option>
                <option value="Parcialmente pago" ${sel(r.statusPagamento,'Parcialmente pago')}>Parcialmente pago</option>
                <option value="Pago"              ${sel(r.statusPagamento,'Pago')}>Pago</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;" id="grupo-forma-pagamento"
                 ${(!r.statusPagamento || r.statusPagamento === 'Pendente') ? 'hidden' : ''}>
              <label class="form-label" for="res-forma-pagamento">Forma de pagamento</label>
              <select class="form-select" id="res-forma-pagamento">
                <option value="">Selecione...</option>
                <option value="Pix"              ${sel(r.formaPagamento,'Pix')}>Pix</option>
                <option value="Cartão de crédito" ${sel(r.formaPagamento,'Cartão de crédito')}>Cartão de crédito</option>
                <option value="Cartão de débito"  ${sel(r.formaPagamento,'Cartão de débito')}>Cartão de débito</option>
                <option value="Dinheiro"          ${sel(r.formaPagamento,'Dinheiro')}>Dinheiro</option>
                <option value="Transferência"     ${sel(r.formaPagamento,'Transferência')}>Transferência</option>
                <option value="Boleto"            ${sel(r.formaPagamento,'Boleto')}>Boleto</option>
                <option value="OTA (online)"      ${sel(r.formaPagamento,'OTA (online)')}>OTA (online)</option>
              </select>
            </div>
          </div>

          <!-- Separador veículo -->
          <div style="border-top:1px solid var(--cinza-claro);margin:4px 0 16px;padding-top:12px;">
            <span style="font-size:0.75rem;font-weight:700;color:var(--texto-muted);text-transform:uppercase;letter-spacing:.05em;">🚗 Veículo</span>
          </div>

          <!-- Placa e Modelo do carro -->
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label class="form-label" for="res-placa">Placa do carro</label>
              <input class="form-input" id="res-placa" type="text"
                     placeholder="ABC-1234" value="${val('placaCarro')}"
                     style="text-transform:uppercase;" maxlength="8">
            </div>
            <div class="form-group" style="flex:2;">
              <label class="form-label" for="res-modelo-carro">Modelo do carro</label>
              <input class="form-input" id="res-modelo-carro" type="text"
                     placeholder="Ex: Fiat Pulse prata" value="${val('modeloCarro')}">
            </div>
          </div>

          <!-- Separador comunicação -->
          <div style="border-top:1px solid var(--cinza-claro);margin:4px 0 16px;padding-top:12px;">
            <span style="font-size:0.75rem;font-weight:700;color:var(--texto-muted);text-transform:uppercase;letter-spacing:.05em;">📬 Comunicação</span>
          </div>

          <!-- Status mensagem -->
          <div class="form-group">
            <label class="form-label" for="res-mensagem">Status da mensagem</label>
            <select class="form-select" id="res-mensagem">
              <option value="Não enviada"         ${sel(r.statusMensagem,'Não enviada')}>Não enviada</option>
              <option value="Parcialmente enviada" ${sel(r.statusMensagem,'Parcialmente enviada')}>Parcialmente enviada</option>
              <option value="Enviada"             ${sel(r.statusMensagem,'Enviada')}>Enviada</option>
            </select>
          </div>

          <!-- Observações -->
          <div class="form-group">
            <label class="form-label" for="res-obs">Observações</label>
            <textarea class="form-textarea" id="res-obs" rows="3"
                      placeholder="Observações sobre a reserva...">${esc(r.observacoes || '')}</textarea>
          </div>

          <!-- Botões -->
          <div style="display:flex;justify-content:flex-end;gap:.65rem;margin-top:1.25rem;">
            <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primario" id="btn-salvar-reserva">
              ${editando ? 'Salvar alterações' : 'Criar reserva'}
            </button>
          </div>
        </form>
      </div>
    `;

    abrirModal(html, '620px');

    // Listener do form (dentro do modal)
    const form = document.getElementById('form-reserva');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        _salvarReserva(editando);
      });
    }

    // Binds do upload (apenas nova reserva)
    if (!editando) {
      // Input de arquivo
      const inputFile = document.getElementById('upload-reserva-input');
      if (inputFile) {
        inputFile.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) _processarImagemReserva(file);
        });
      }

      // Drag & Drop
      const dropzone = document.getElementById('upload-reserva-dropzone');
      if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            _processarImagemReserva(file);
          } else {
            toast('Por favor, solte uma imagem (JPG, PNG, etc.).', 'aviso');
          }
        });
      }

      // Botão simular
      document.getElementById('btn-simular-scan')?.addEventListener('click', _simularScan);
    }
  }

  // ─────────────────────────────────────────────
  // Salvar reserva (criar ou atualizar)
  // ─────────────────────────────────────────────

  function _salvarReserva(editando) {
    // Lê campos
    const id           = (document.getElementById('res-id')?.value            || '').trim();
    const nome         = (document.getElementById('res-nome')?.value          || '').trim();
    const flat         = (document.getElementById('res-flat')?.value          || '').trim();
    const canal        = (document.getElementById('res-canal')?.value         || '').trim();
    const entrada      = (document.getElementById('res-entrada')?.value       || '').trim();
    const saida        = (document.getElementById('res-saida')?.value         || '').trim();
    const qtd          = parseInt(document.getElementById('res-qtd')?.value   || '1', 10);
    const horario      = (document.getElementById('res-horario')?.value       || '').trim();
    const telefone     = (document.getElementById('res-telefone')?.value      || '').trim();
    const aniversario  = (document.getElementById('res-aniversario')?.value   || '').trim();
    const pagamento    = (document.getElementById('res-pagamento')?.value     || 'Pendente').trim();
    const formaPag     = (document.getElementById('res-forma-pagamento')?.value || '').trim();
    const mensagem     = (document.getElementById('res-mensagem')?.value      || 'Não enviada').trim();
    const obs          = (document.getElementById('res-obs')?.value           || '').trim();
    const valorTotal   = parseFloat(document.getElementById('res-valor-total')?.value  || '0') || 0;
    const comissaoOta  = parseFloat(document.getElementById('res-comissao-ota')?.value || '0') || 0;
    const placaCarro   = (document.getElementById('res-placa')?.value         || '').trim().toUpperCase();
    const modeloCarro  = (document.getElementById('res-modelo-carro')?.value  || '').trim();

    // Validação de campos obrigatórios
    if (!nome) {
      toast('Informe o nome do hóspede.', 'erro');
      document.getElementById('res-nome')?.focus();
      return;
    }
    if (!flat) {
      toast('Selecione o flat.', 'erro');
      document.getElementById('res-flat')?.focus();
      return;
    }
    if (!canal) {
      toast('Selecione o canal de reserva.', 'erro');
      document.getElementById('res-canal')?.focus();
      return;
    }
    if (!entrada) {
      toast('Informe a data de entrada.', 'erro');
      document.getElementById('res-entrada')?.focus();
      return;
    }
    if (!saida) {
      toast('Informe a data de saída.', 'erro');
      document.getElementById('res-saida')?.focus();
      return;
    }
    if (saida <= entrada) {
      toast('A data de saída deve ser posterior à entrada.', 'erro');
      document.getElementById('res-saida')?.focus();
      return;
    }

    const dados = {
      nomeHospede:        nome,
      flat:               flat,
      canal:              canal,
      dataEntrada:        entrada,
      dataSaida:          saida,
      quantidadeHospedes: isNaN(qtd) ? 1 : Math.max(1, Math.min(10, qtd)),
      horarioChegada:     horario,
      telefone:           telefone,
      aniversario:        aniversario,
      valorTotal:         valorTotal,
      comissaoOta:        comissaoOta,
      statusPagamento:    pagamento,
      formaPagamento:     pagamento !== 'Pendente' ? formaPag : '',
      placaCarro:         placaCarro,
      modeloCarro:        modeloCarro,
      statusMensagem:     mensagem,
      observacoes:        obs,
    };

    if (editando && id) {
      const atualizado = Store.atualizar('reservas', id, dados);
      if (atualizado) {
        toast('Reserva atualizada com sucesso!', 'sucesso');
      } else {
        toast('Erro ao atualizar reserva.', 'erro');
        return;
      }
    } else {
      Store.adicionar('reservas', dados);
      toast('Reserva criada com sucesso!', 'sucesso');
    }

    fecharModal();
    _atualizarTabela();
  }

  // ─────────────────────────────────────────────
  // Exclusão de reserva
  // ─────────────────────────────────────────────

  function _excluirReserva(id) {
    const reserva = Store.getById('reservas', id);
    if (!reserva) return;

    if (!confirmarExclusao(reserva.nomeHospede)) return;

    const ok = Store.excluir('reservas', id);
    if (ok) {
      toast('Reserva removida.', 'sucesso');
      _atualizarTabela();
    } else {
      toast('Erro ao remover reserva.', 'erro');
    }
  }

  // ─────────────────────────────────────────────
  // Atualiza apenas a área da tabela (sem re-renderizar tudo)
  // ─────────────────────────────────────────────

  function _atualizarTabela() {
    const reservas = Store.get('reservas') || [];
    const container = document.getElementById('reservas-tabela-container');
    if (container) {
      container.innerHTML = _renderTabela(reservas);
      _bindTabelaEventos();
    }
  }

  // ─────────────────────────────────────────────
  // Eventos da tabela (delegação)
  // ─────────────────────────────────────────────

  function _bindTabelaEventos() {
    const container = document.getElementById('reservas-tabela-container');
    if (!container) return;

    // Remove listeners anteriores clonando o nó
    const novo = container.cloneNode(true);
    container.parentNode.replaceChild(novo, container);
    // Adiciona ao clone
    const el = document.getElementById('reservas-tabela-container');

    el.addEventListener('click', (e) => {
      const btnEditar  = e.target.closest('.btn-editar-reserva');
      const btnExcluir = e.target.closest('.btn-excluir-reserva');

      if (btnEditar) {
        const id = btnEditar.dataset.id;
        const reserva = Store.getById('reservas', id);
        if (reserva) _abrirFormulario(reserva);
      }

      if (btnExcluir) {
        const id = btnExcluir.dataset.id;
        _excluirReserva(id);
      }
    });
  }

  // ─────────────────────────────────────────────
  // Eventos dos filtros
  // ─────────────────────────────────────────────

  function _bindFiltrosEventos() {
    const aplicar = () => {
      _filtros.dataEntradaDe  = document.getElementById('filtro-entrada-de')?.value  || '';
      _filtros.dataEntradaAte = document.getElementById('filtro-entrada-ate')?.value || '';
      _filtros.canal          = document.getElementById('filtro-canal')?.value        || '';
      _filtros.pagamento      = document.getElementById('filtro-pagamento')?.value    || '';
      _filtros.busca          = document.getElementById('filtro-busca')?.value        || '';
      _atualizarTabela();
    };

    ['filtro-entrada-de','filtro-entrada-ate','filtro-canal','filtro-pagamento'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', aplicar);
    });

    // Busca com debounce leve
    let _debounce;
    document.getElementById('filtro-busca')?.addEventListener('input', () => {
      clearTimeout(_debounce);
      _debounce = setTimeout(aplicar, 250);
    });

    // Botão limpar filtros
    document.getElementById('btn-limpar-filtros')?.addEventListener('click', () => {
      _filtros = { dataEntradaDe:'', dataEntradaAte:'', canal:'', pagamento:'', busca:'' };
      document.getElementById('filtro-entrada-de').value  = '';
      document.getElementById('filtro-entrada-ate').value = '';
      document.getElementById('filtro-canal').value       = '';
      document.getElementById('filtro-pagamento').value   = '';
      document.getElementById('filtro-busca').value       = '';
      _atualizarTabela();
    });
  }

  // ─────────────────────────────────────────────
  // Render principal
  // ─────────────────────────────────────────────

  function render() {
    const reservas = Store.get('reservas') || [];

    const html = `
      <!-- ═══ CABEÇALHO ═══ -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Reservas</h1>
          <p class="page-subtitle">Gerencie as reservas dos flats</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primario" id="btn-nova-reserva">
            ➕ Nova Reserva
          </button>
          <button class="btn btn-secundario"
                  disabled
                  title="Em breve: importação via CSV"
                  style="cursor:not-allowed;opacity:.55;">
            📥 Importar CSV
          </button>
        </div>
      </div>

      <!-- ═══ FILTROS ═══ -->
      <div class="card filtros" style="padding:1rem 1.25rem;margin-bottom:1.25rem;">
        <div style="display:flex;flex-wrap:wrap;gap:.85rem;align-items:flex-end;">

          <div class="form-group" style="flex:1;min-width:130px;margin-bottom:0;">
            <label class="form-label" for="filtro-entrada-de">Entrada de</label>
            <input class="form-input" id="filtro-entrada-de" type="date" value="${_filtros.dataEntradaDe}">
          </div>

          <div class="form-group" style="flex:1;min-width:130px;margin-bottom:0;">
            <label class="form-label" for="filtro-entrada-ate">Entrada até</label>
            <input class="form-input" id="filtro-entrada-ate" type="date" value="${_filtros.dataEntradaAte}">
          </div>

          <div class="form-group" style="flex:1;min-width:150px;margin-bottom:0;">
            <label class="form-label" for="filtro-canal">Canal</label>
            <select class="form-select" id="filtro-canal">
              <option value="">Todos</option>
              <option value="Booking"         ${_filtros.canal==='Booking'         ? 'selected':''}>Booking</option>
              <option value="Airbnb"          ${_filtros.canal==='Airbnb'          ? 'selected':''}>Airbnb</option>
              <option value="Omnibees"        ${_filtros.canal==='Omnibees'        ? 'selected':''}>Omnibees</option>
              <option value="Reserva direta"  ${_filtros.canal==='Reserva direta'  ? 'selected':''}>Reserva direta</option>
              <option value="Outros"          ${_filtros.canal==='Outros'          ? 'selected':''}>Outros</option>
            </select>
          </div>

          <div class="form-group" style="flex:1;min-width:170px;margin-bottom:0;">
            <label class="form-label" for="filtro-pagamento">Pagamento</label>
            <select class="form-select" id="filtro-pagamento">
              <option value="">Todos</option>
              <option value="Pago"              ${_filtros.pagamento==='Pago'              ? 'selected':''}>Pago</option>
              <option value="Parcialmente pago" ${_filtros.pagamento==='Parcialmente pago' ? 'selected':''}>Parcialmente pago</option>
              <option value="Pendente"          ${_filtros.pagamento==='Pendente'          ? 'selected':''}>Pendente</option>
            </select>
          </div>

          <div class="form-group" style="flex:2;min-width:200px;margin-bottom:0;">
            <label class="form-label" for="filtro-busca">Buscar hóspede</label>
            <input class="form-input" id="filtro-busca" type="search"
                   placeholder="Nome do hóspede..." value="${esc(_filtros.busca)}">
          </div>

          <button class="btn btn-secundario btn-sm" id="btn-limpar-filtros"
                  style="margin-bottom:0;white-space:nowrap;">
            ✕ Limpar
          </button>
        </div>
      </div>

      <!-- ═══ TABELA ═══ -->
      <div id="reservas-tabela-container">
        ${_renderTabela(reservas)}
      </div>
    `;

    document.getElementById('page-container').innerHTML = html;

    // Botão nova reserva
    document.getElementById('btn-nova-reserva')?.addEventListener('click', () => {
      _abrirFormulario(null);
    });

    // Filtros
    _bindFiltrosEventos();

    // Eventos da tabela (editar/excluir)
    _bindTabelaEventos();
  }

  // API pública
  return { render };

})();
