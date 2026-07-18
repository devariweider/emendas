export function parseCSVEmendas(texto) {
  const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
  if (linhas.length < 2) return { emendas: [], gastos: [] };

  const cabecalho = linhas[0].split(';').map((h) => h.trim().toLowerCase());

  const emendas = [];
  const gastos = [];

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(';').map((c) => c.trim());

    // Pular linha de total
    if (cols[0]?.toUpperCase().includes('TOTAL')) continue;

    // Detectar formato pela coluna do cabeçalho
    const parlamentar = cols[0];
    if (!parlamentar) continue;

    // Formato emendas: parlamentar;proposta;sei;portaria;valor;gasto;saldo
    if (cabecalho.includes('emenda / parlamentar') || cabecalho.includes('parlamentar')) {
      const valorTotal = parseMoedaCSV(cols[4]);
      if (valorTotal > 0) {
        emendas.push({
          id: Date.now() + i,
          parlamentar,
          numeroProposta: cols[1] || '',
          processoSEI: cols[2] || '',
          portaria: cols[3] || '',
          valorTotal,
          dataCriacao: new Date().toISOString().slice(0, 10),
        });
      }
    }
  }

  return { emendas, gastos };
}

export function parseCSVGastos(texto, emendasExistentes) {
  const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean);
  if (linhas.length < 2) return [];

  const cabecalho = linhas[0].split(';').map((h) => h.trim().toLowerCase());
  const gastos = [];

  // Mapear índices das colunas
  const idx = {
    emenda: cabecalho.findIndex((h) => h.includes('emenda') || h.includes('parlamentar')),
    descricao: cabecalho.findIndex((h) => h.includes('descrição') || h.includes('descricao') || h.includes('histórico')),
    data: cabecalho.findIndex((h) => h.includes('data')),
    valor: cabecalho.findIndex((h) => h.includes('valor') && !h.includes('total')),
    fornecedor: cabecalho.findIndex((h) => h.includes('fornecedor') || h.includes('contratad')),
    elemento: cabecalho.findIndex((h) => h.includes('elemento') || h.includes('categoria')),
    situacao: cabecalho.findIndex((h) => h.includes('situação') || h.includes('situacao') || h.includes('status')),
  };

  for (let i = 1; i < linhas.length; i++) {
    const cols = linhas[i].split(';').map((c) => c.trim());
    if (!cols[0] || cols[0].toUpperCase().includes('TOTAL')) continue;

    const parlamentar = idx.emenda >= 0 ? cols[idx.emenda] : cols[0];
    const emenda = emendasExistentes.find(
      (e) => e.parlamentar.toLowerCase() === parlamentar.toLowerCase()
    );

    gastos.push({
      id: Date.now() + i + 1000,
      emendaId: emenda?.id || null,
      descricao: idx.descricao >= 0 ? cols[idx.descricao] : cols[1] || '',
      data: idx.data >= 0 ? normalizarData(cols[idx.data]) : '',
      valor: idx.valor >= 0 ? parseMoedaCSV(cols[idx.valor]) : 0,
      fornecedor: idx.fornecedor >= 0 ? cols[idx.fornecedor] : '',
      elementoDespesa: idx.elemento >= 0 ? cols[idx.elemento] : 'Outros',
      situacao: idx.situacao >= 0 ? cols[idx.situacao] : 'Pago',
    });
  }

  return gastos.filter((g) => g.valor > 0);
}

function parseMoedaCSV(str) {
  if (!str || str === '-' || str === '') return 0;
  return Number(str.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function normalizarData(str) {
  if (!str) return '';
  // dd/mm/aaaa → aaaa-mm-dd
  if (str.includes('/')) {
    const [d, m, a] = str.split('/');
    return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Já está aaaa-mm-dd
  if (str.includes('-')) return str;
  return '';
}
