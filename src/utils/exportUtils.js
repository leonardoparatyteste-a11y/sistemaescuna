/**
 * Converte um array de objetos ou matriz de dados em um Blob CSV e aciona o download no navegador.
 * @param {Array<Object>} data - Array de objetos a serem exportados.
 * @param {string} filename - Nome do arquivo a ser baixado.
 * @param {Array<{key: string, label: string}>} [headers] - Mapeamento de chaves e rótulos do cabeçalho.
 */
export function exportToCSV(data, filename = 'relatorio.csv', headers = null) {
  if (!data || !data.length) {
    alert('Não há dados para exportar no período selecionado.');
    return;
  }

  let csvContent = '\uFEFF'; // BOM para garantir suporte correto a UTF-8 e acentos no Microsoft Excel

  let keys = [];
  let headerRow = [];

  if (headers && headers.length) {
    keys = headers.map(h => h.key);
    headerRow = headers.map(h => `"${(h.label || '').replace(/"/g, '""')}"`);
  } else {
    keys = Object.keys(data[0]);
    headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`);
  }

  csvContent += headerRow.join(';') + '\n';

  data.forEach(item => {
    const row = keys.map(key => {
      let val = item[key];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'number') {
        val = val.toString().replace('.', ','); // Formato numérico em Português
      } else {
        val = `"${val.toString().replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvContent += row.join(';') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calcula o intervalo de datas com base na opção selecionada
 * @param {string} period - 'today' | '7days' | 'month' | 'custom'
 * @param {string} startDateStr - Data inicial no formato YYYY-MM-DD
 * @param {string} endDateStr - Data final no formato YYYY-MM-DD
 * @returns {{ start: Date, end: Date }}
 */
export function getPeriodRange(period, startDateStr = '', endDateStr = '') {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === 'today') {
    // start e end já estão no dia de hoje
  } else if (period === '7days') {
    start.setDate(now.getDate() - 6);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'custom' && startDateStr && endDateStr) {
    const [sY, sM, sD] = startDateStr.split('-').map(Number);
    const [eY, eM, eD] = endDateStr.split('-').map(Number);
    start = new Date(sY, sM - 1, sD, 0, 0, 0, 0);
    end = new Date(eY, eM - 1, eD, 23, 59, 59, 999);
  }

  return { start, end };
}
