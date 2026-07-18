export function formatarMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR');
}

export function formatarData(dataStr) {
  if (!dataStr) return '-';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function calcularPercentual(valor, total) {
  if (!total) return 0;
  return (Number(valor) / Number(total)) * 100;
}

export function agruparPor(lista, chave) {
  return lista.reduce((acc, item) => {
    const chaveVal = item[chave];
    if (!acc[chaveVal]) acc[chaveVal] = [];
    acc[chaveVal].push(item);
    return acc;
  }, {});
}

export function somarValores(lista, chaveValor = 'valor') {
  return lista.reduce((acc, item) => acc + (Number(item[chaveValor]) || 0), 0);
}

export function parseMoedaBR(str) {
  if (!str || str === '-') return 0;
  return Number(str.replace(/[R$\s.]/g, '').replace(',', '.'));
}
