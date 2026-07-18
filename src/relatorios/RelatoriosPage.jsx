import { useMemo, useState } from 'react';
import { useEmendas } from '../emendas/EmendasContext';
import { formatarMoeda, formatarData } from '../utils/formatacao';
import { exportarCSV, exportarXLSX, exportarResumoPDF, exportarGastosPDF } from '../utils/exportacao';

export default function RelatoriosPage() {
  const { emendasComResumo, gastos, totais } = useEmendas();
  const [tipoRelatorio, setTipoRelatorio] = useState('resumo');

  const dadosResumo = useMemo(() =>
    emendasComResumo.map((e) => ({
      parlamentar: e.parlamentar,
      valorTotalFmt: formatarMoeda(e.valorTotal),
      totalGastoFmt: formatarMoeda(e.totalGasto),
      saldoFmt: formatarMoeda(e.saldo),
      percentual: `${e.percentualGasto.toFixed(1)}%`,
    })),
  [emendasComResumo]);

  const dadosGastos = useMemo(() =>
    gastos.map((g) => {
      const emenda = emendasComResumo.find((e) => e.id === g.emendaId);
      return {
        parlamentar: emenda?.parlamentar || '-',
        nomePrestador: g.nomePrestador,
        elemento: g.elementoDespesa,
        numeroEmpenho: g.numeroEmpenho,
        numeroNotaFiscal: g.numeroNotaFiscal,
        data: formatarData(g.data),
        projetoAtividade: g.projetoAtividade,
        fonteRecurso: g.fonteRecurso,
        numeroMemorando: g.numeroMemorando,
        justificativa: g.justificativa,
        valorFmt: formatarMoeda(g.valorPago),
        numeroConta: g.numeroConta,
      };
    }).sort((a, b) => b.data.localeCompare(a.data)),
  [gastos, emendasComResumo]);

  function handleExportarCSV() {
    if (tipoRelatorio === 'resumo') {
      exportarCSV(dadosResumo, 'relatorio_resumo', [
        { chave: 'parlamentar', titulo: 'Parlamentar' },
        { chave: 'valorTotalFmt', titulo: 'Valor Total' },
        { chave: 'totalGastoFmt', titulo: 'Total Gasto' },
        { chave: 'saldoFmt', titulo: 'Saldo' },
        { chave: 'percentual', titulo: '% Gasto' },
      ]);
    } else {
      exportarCSV(dadosGastos, 'relatorio_gastos', [
        { chave: 'parlamentar', titulo: 'Parlamentar' },
        { chave: 'nomePrestador', titulo: 'Prestador' },
        { chave: 'elemento', titulo: 'Elemento' },
        { chave: 'numeroEmpenho', titulo: 'Nº Empenho' },
        { chave: 'numeroNotaFiscal', titulo: 'Nº Nota Fiscal' },
        { chave: 'data', titulo: 'Data' },
        { chave: 'projetoAtividade', titulo: 'Projeto/Atividade' },
        { chave: 'fonteRecurso', titulo: 'Fonte Recurso' },
        { chave: 'numeroMemorando', titulo: 'Nº Memorando' },
        { chave: 'justificativa', titulo: 'Justificativa' },
        { chave: 'valorFmt', titulo: 'Valor Pago' },
        { chave: 'numeroConta', titulo: 'Nº Conta' },
      ]);
    }
  }

  function handleExportarXLSX() {
    if (tipoRelatorio === 'resumo') {
      exportarXLSX(dadosResumo, 'relatorio_resumo', [
        { chave: 'parlamentar', titulo: 'Parlamentar' },
        { chave: 'valorTotalFmt', titulo: 'Valor Total' },
        { chave: 'totalGastoFmt', titulo: 'Total Gasto' },
        { chave: 'saldoFmt', titulo: 'Saldo' },
        { chave: 'percentual', titulo: '% Gasto' },
      ]);
    } else {
      exportarXLSX(dadosGastos, 'relatorio_gastos', [
        { chave: 'parlamentar', titulo: 'Parlamentar' },
        { chave: 'nomePrestador', titulo: 'Prestador' },
        { chave: 'elemento', titulo: 'Elemento' },
        { chave: 'numeroEmpenho', titulo: 'Nº Empenho' },
        { chave: 'numeroNotaFiscal', titulo: 'Nº Nota Fiscal' },
        { chave: 'data', titulo: 'Data' },
        { chave: 'projetoAtividade', titulo: 'Projeto/Atividade' },
        { chave: 'fonteRecurso', titulo: 'Fonte Recurso' },
        { chave: 'numeroMemorando', titulo: 'Nº Memorando' },
        { chave: 'justificativa', titulo: 'Justificativa' },
        { chave: 'valorFmt', titulo: 'Valor Pago' },
        { chave: 'numeroConta', titulo: 'Nº Conta' },
      ]);
    }
  }

  function handleExportarPDF() {
    if (tipoRelatorio === 'resumo') {
      exportarResumoPDF(dadosResumo, 'Resumo das Emendas Parlamentares', formatarMoeda(totais.totalGasto), formatarMoeda(totais.saldo));
    } else {
      exportarGastosPDF(dadosGastos, 'Todos os Gastos', formatarMoeda(totais.totalGasto));
    }
  }

  const dadosAtuais = tipoRelatorio === 'resumo' ? dadosResumo : dadosGastos;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-sm text-slate-500 mt-1">Relatórios consolidados das emendas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportarCSV} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            CSV
          </button>
          <button onClick={handleExportarXLSX} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            XLSX
          </button>
          <button onClick={handleExportarPDF} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            PDF
          </button>
        </div>
      </div>

      {/* Seletor */}
      <div className="flex gap-2">
        <button
          onClick={() => setTipoRelatorio('resumo')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tipoRelatorio === 'resumo' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Resumo por Parlamentar
        </button>
        <button
          onClick={() => setTipoRelatorio('gastos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tipoRelatorio === 'gastos' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Todos os Gastos
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {tipoRelatorio === 'resumo' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600">
                  <th className="px-4 py-3 text-left text-xs font-bold text-white">Parlamentar</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white">Valor Total</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white">Total Gasto</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white">Saldo</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white">% Gasto</th>
                </tr>
              </thead>
              <tbody>
                {dadosResumo.map((d, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{d.parlamentar}</td>
                    <td className="px-4 py-3 text-right">{d.valorTotalFmt}</td>
                    <td className="px-4 py-3 text-right text-amber-600 font-medium">{d.totalGastoFmt}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">{d.saldoFmt}</td>
                    <td className="px-4 py-3 text-center">{d.percentual}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3">TOTAL GERAL</td>
                  <td className="px-4 py-3 text-right">{formatarMoeda(totais.valorTotal)}</td>
                  <td className="px-4 py-3 text-right text-amber-600">{formatarMoeda(totais.totalGasto)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatarMoeda(totais.saldo)}</td>
                  <td className="px-4 py-3 text-center">{totais.percentualGasto.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="bg-blue-600">
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Parlamentar</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Prestador</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Elemento</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Nº Empenho</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Nº NF</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Data</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Projeto/Atividade</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Fonte</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Nº Memorando</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Justificativa</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white">Valor Pago</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">Nº Conta</th>
                </tr>
              </thead>
              <tbody>
                {dadosGastos.map((d, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-800">{d.parlamentar}</td>
                    <td className="px-3 py-3 text-slate-700">{d.nomePrestador}</td>
                    <td className="px-3 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{d.elemento}</span></td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{d.numeroEmpenho}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{d.numeroNotaFiscal}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{d.data}</td>
                    <td className="px-3 py-3 text-slate-600">{d.projetoAtividade}</td>
                    <td className="px-3 py-3 text-slate-600">{d.fonteRecurso}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{d.numeroMemorando}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs max-w-[150px] truncate" title={d.justificativa}>{d.justificativa}</td>
                    <td className="px-3 py-3 text-right font-semibold">{d.valorFmt}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{d.numeroConta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
