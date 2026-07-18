import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportarCSV(dados, nomeArquivo, colunas) {
  const headers = colunas.map((c) => c.titulo);
  const rows = dados.map((item) =>
    colunas.map((c) => {
      const val = item[c.chave];
      if (c.formatar) return c.formatar(val);
      return val ?? '';
    })
  );
  const csvContent = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportarXLSX(dados, nomeArquivo, colunas) {
  const headers = colunas.map((c) => c.titulo);
  const rows = dados.map((item) =>
    colunas.map((c) => {
      const val = item[c.chave];
      if (c.formatar) return c.formatar(val);
      return val ?? '';
    })
  );
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const colWidths = colunas.map((c, i) => {
    const maxLen = Math.max(c.titulo.length, ...rows.map((r) => String(r[i] || '').length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportarPDF(dados, titulo, colunas, nomeArquivo) {
  const doc = new jsPDF({ orientation: colunas.length > 5 ? 'landscape' : 'portrait' });
  doc.setFontSize(14);
  doc.text(titulo, 14, 20);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  const headers = colunas.map((c) => c.titulo);
  const rows = dados.map((item) =>
    colunas.map((c) => {
      const val = item[c.chave];
      if (c.formatar) return c.formatar(val);
      return String(val ?? '');
    })
  );

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 34,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportarResumoPDF(dados, titulo, totalGasto, totalSaldo) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Relatórios consolidados das emendas', 14, 20);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  doc.autoTable({
    head: [['Parlamentar', 'Valor Total', 'Total Gasto', 'Saldo']],
    body: dados.map((d) => [
      d.parlamentar,
      d.valorTotalFmt,
      d.totalGastoFmt,
      d.saldoFmt,
    ]),
    startY: 36,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    foot: [['TOTAL', '', totalGasto, totalSaldo]],
    footStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`resumo_emendas_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportarGastosPDF(dados, titulo, totalGeral) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(16);
  doc.text('Relatórios consolidados das emendas', 14, 20);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);

  doc.autoTable({
    head: [['Parlamentar', 'Prestador', 'Elemento', 'Nº Empenho', 'Nº NF', 'Data', 'Projeto/Atividade', 'Fonte', 'Nº Memorando', 'Justificativa', 'Valor Pago', 'Nº Conta']],
    body: dados.map((d) => [
      d.parlamentar,
      d.nomePrestador,
      d.elemento,
      d.numeroEmpenho,
      d.numeroNotaFiscal,
      d.data,
      d.projetoAtividade,
      d.fonteRecurso,
      d.numeroMemorando,
      d.justificativa,
      d.valorFmt,
      d.numeroConta,
    ]),
    startY: 34,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
    foot: [['TOTAL GERAL', '', '', '', '', '', '', '', '', '', totalGeral, '']],
    footStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  doc.save(`gastos_${new Date().toISOString().slice(0, 10)}.pdf`);
}
