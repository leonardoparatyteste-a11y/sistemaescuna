/**
 * tarifas.js — Módulo Tarifas e Revenue Management
 * Calamar Flats — Painel Operacional
 */

const Tarifas = (() => {

  // Carrega dados da store
  function _carregarTarifas() {
    return Store.get('tarifas') || { base: [], regras: [] };
  }

  function _salvarTarifas(t) {
    Store.set('tarifas', t);
    toast('Configurações de Tarifas atualizadas com sucesso!', 'sucesso');
    render();
  }

  // Formulário de Tarifas Base
  function _renderFormBase(base) {
    return `
      <form id="form-tarifas-base" onsubmit="Tarifas.salvarBase(event)">
        <div class="table-wrapper">
          <table class="tabela">
            <thead>
              <tr>
                <th>Categoria / Flats</th>
                <th>Tarifa Base (R$)</th>
              </tr>
            </thead>
            <tbody>
              ${base.map((b, i) => `
                <tr>
                  <td>
                    <strong>${esc(b.categoria)}</strong>
                    <div class="text-sm text-muted">${esc(b.flats.join(', '))}</div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span>R$</span>
                      <input type="number" step="0.01" min="0" class="form-input" 
                             style="width:120px;" required
                             value="${b.valor}" name="base_valor_${i}">
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px;text-align:right;">
          <button type="submit" class="btn btn-primario">Salvar Tarifas Base</button>
        </div>
      </form>
    `;
  }

  // Formulário de Regras de Revenue
  function _renderFormRegras(regras) {
    return `
      <form id="form-tarifas-regras" onsubmit="Tarifas.salvarRegras(event)">
        <p class="text-sm text-muted" style="margin-bottom:16px;">
          Configure as regras de aumento progressivo com base na ocupação diária.
        </p>
        <div class="table-wrapper">
          <table class="tabela">
            <thead>
              <tr>
                <th>Ocupação até (%)</th>
                <th>Aumento na Tarifa (%)</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody id="tbody-regras">
              ${regras.map((r, i) => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <input type="number" min="0" max="100" class="form-input" 
                             style="width:80px;" required
                             value="${r.maxOcupacao}" name="regra_max_${i}">
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                      <input type="number" min="0" class="form-input" 
                             style="width:80px;" required
                             value="${r.aumentoPercentual}" name="regra_aumento_${i}">
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <button type="button" class="btn btn-perigo btn-sm" onclick="Tarifas.removerRegra(${i})">Remover</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;">
          <button type="button" class="btn btn-secundario" onclick="Tarifas.adicionarRegra()">+ Adicionar Regra</button>
          <button type="submit" class="btn btn-primario">Salvar Regras</button>
        </div>
      </form>
    `;
  }

  // Simulador de Tarifas
  function _renderSimulador(tarifasData) {
    return `
      <div style="display:flex;gap:16px;align-items:flex-end;margin-bottom:20px;">
        <div class="form-group" style="margin:0;flex:1;max-width:200px;">
          <label class="form-label">Data para simulação</label>
          <input type="date" id="simulador-data" class="form-input" value="${hoje()}" onchange="Tarifas.simular()">
        </div>
        <button class="btn btn-primario" onclick="Tarifas.simular()">Simular</button>
      </div>

      <div id="simulador-resultado" style="padding:16px;background:var(--creme);border-radius:var(--radius-sm);border:1px solid var(--cinza-claro);">
        <p class="text-sm text-muted">Selecione uma data para ver a tarifa aplicada.</p>
      </div>
    `;
  }

  function render() {
    const data = _carregarTarifas();

    const html = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Tarifas e Revenue Management</h1>
          <p class="page-subtitle">Gestão de preços base e precificação dinâmica (Revenue)</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0, 1fr) minmax(0, 1fr);gap:24px;">
        <div style="display:flex;flex-direction:column;gap:24px;">
          <div class="card">
            <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;color:var(--texto);">Tarifas Base</h2>
            ${_renderFormBase(data.base)}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px;">
          <div class="card">
            <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;color:var(--texto);">Regras de Revenue (Dinâmica)</h2>
            ${_renderFormRegras(data.regras)}
          </div>

          <div class="card" style="border-top:3px solid var(--cor-laranja-site,#FB9A38);">
            <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:16px;color:var(--texto);">Simulador de Tarifas Diárias</h2>
            ${_renderSimulador(data)}
          </div>
        </div>
      </div>
    `;

    document.getElementById('page-container').innerHTML = html;
    
    // Auto run simulação na primeira vez
    setTimeout(() => simular(), 50);
  }

  // --- Funções Auxiliares Exportadas ---

  function salvarBase(e) {
    e.preventDefault();
    const data = _carregarTarifas();
    const formData = new FormData(e.target);
    
    data.base.forEach((b, i) => {
      const val = parseFloat(formData.get(`base_valor_${i}`));
      if (!isNaN(val)) b.valor = val;
    });

    _salvarTarifas(data);
  }

  function salvarRegras(e) {
    e.preventDefault();
    const data = _carregarTarifas();
    const formData = new FormData(e.target);
    
    // Ler as regras existentes pelo form
    const novasRegras = [];
    for (let i = 0; i < data.regras.length; i++) {
      const maxOc = parseFloat(formData.get(`regra_max_${i}`));
      const aumento = parseFloat(formData.get(`regra_aumento_${i}`));
      if (!isNaN(maxOc) && !isNaN(aumento)) {
        novasRegras.push({ maxOcupacao: maxOc, aumentoPercentual: aumento });
      }
    }
    
    // Ordenar regras
    novasRegras.sort((a, b) => a.maxOcupacao - b.maxOcupacao);
    data.regras = novasRegras;
    _salvarTarifas(data);
  }

  function adicionarRegra() {
    const data = _carregarTarifas();
    data.regras.push({ maxOcupacao: 100, aumentoPercentual: 0 });
    Store.set('tarifas', data);
    render();
  }

  function removerRegra(index) {
    const data = _carregarTarifas();
    data.regras.splice(index, 1);
    Store.set('tarifas', data);
    render();
  }

  function simular() {
    const inputData = document.getElementById('simulador-data');
    const container = document.getElementById('simulador-resultado');
    if (!inputData || !container) return;

    const dtSelecionada = inputData.value;
    if (!dtSelecionada) {
      container.innerHTML = '<p class="text-sm text-muted">Selecione uma data válida.</p>';
      return;
    }

    // Calcula ocupação
    const reservas = Store.get('reservas') || [];
    const flats = Store.get('flats') || [];
    const totalFlats = flats.length || 8;
    
    let ocupados = 0;
    reservas.forEach(r => {
      // Regra simplificada: reserva entra na dataEntrada e sai na dataSaida
      // Diária cobrada se dtSelecionada >= dataEntrada && dtSelecionada < dataSaida
      if (dtSelecionada >= r.dataEntrada && dtSelecionada < r.dataSaida) {
        ocupados++;
      }
    });

    const ocupacaoPercent = Math.round((ocupados / totalFlats) * 100);

    // Encontra a regra aplicada
    const data = _carregarTarifas();
    let aumento = 0;
    for (let r of data.regras) {
      if (ocupacaoPercent <= r.maxOcupacao) {
        aumento = r.aumentoPercentual;
        break; // Pega a primeira regra atingida (já devem estar ordenadas)
      }
    }
    // Caso não tenha batido em nenhuma regra (ex: ocupação maior que a máx regra)
    if (data.regras.length > 0 && ocupacaoPercent > data.regras[data.regras.length-1].maxOcupacao) {
      aumento = data.regras[data.regras.length-1].aumentoPercentual;
    }

    // Monta output
    let resultHtml = `
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
        <div>
          <div class="text-sm text-muted">Ocupação no dia</div>
          <div style="font-size:1.2rem;font-weight:700;color:var(--azul-profundo);">${ocupacaoPercent}% (${ocupados}/${totalFlats} flats)</div>
        </div>
        <div>
          <div class="text-sm text-muted">Aumento Revenue</div>
          <div style="font-size:1.2rem;font-weight:700;color:${aumento > 0 ? 'var(--cor-coral)' : 'var(--verde)'};">+${aumento}%</div>
        </div>
      </div>
      
      <table class="tabela">
        <thead>
          <tr>
            <th>Categoria</th>
            <th style="text-align:right;">Tarifa Dinâmica</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.base.forEach(b => {
      const tarifaFinal = b.valor * (1 + (aumento / 100));
      resultHtml += `
        <tr>
          <td>
            <strong>${esc(b.categoria)}</strong>
            <div class="text-sm text-muted">Base: R$ ${b.valor.toFixed(2).replace('.',',')}</div>
          </td>
          <td style="text-align:right;">
            <strong style="color:var(--cor-laranja-site,#FB9A38);font-size:1.1rem;">R$ ${tarifaFinal.toFixed(2).replace('.',',')}</strong>
          </td>
        </tr>
      `;
    });

    resultHtml += `
        </tbody>
      </table>
    `;

    container.innerHTML = resultHtml;
  }

  return {
    render,
    salvarBase,
    salvarRegras,
    adicionarRegra,
    removerRegra,
    simular
  };

})();
