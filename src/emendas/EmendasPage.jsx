import { useState, useRef } from 'react';
import { useEmendas } from './EmendasContext';
import { useAuth } from '../auth/AuthContext';
import FormEmenda from './FormEmenda';
import FormGasto from './FormGasto';
import Modal from '../core/Modal';
import { useToast } from '../core/ToastContext';
import { formatarMoeda, formatarData } from '../utils/formatacao';
import { exportarCSV } from '../utils/exportacao';
import { parseCSVEmendas, parseCSVGastos } from '../utils/importacao';

export default function EmendasPage() {
  const { emendas, emendasComResumo, adicionarEmenda, editarEmenda, excluirEmenda, adicionarGasto, editarGasto, excluirGasto, gastos, importarEmendas, importarGastos } = useEmendas();
  const { usuario } = useAuth();
  const isViewer = usuario?.cargo === 'Visualizador';
  const toast = useToast();
  const importInputRef = useRef(null);
  const [busca, setBusca] = useState('');
  const [filtroElemento, setFiltroElemento] = useState('');
  const [modalEmenda, setModalEmenda] = useState(false);
  const [editandoEmenda, setEditandoEmenda] = useState(null);
  const [emendaDetalhe, setEmendaDetalhe] = useState(null);
  const [modalGasto, setModalGasto] = useState(false);
  const [editandoGasto, setEditandoGasto] = useState(null);
  const [modalExcluirEmenda, setModalExcluirEmenda] = useState(null);
  const [modalExcluirGasto, setModalExcluirGasto] = useState(null);
  const [modalImportar, setModalImportar] = useState(false);
  const [importarDados, setImportarDados] = useState(null);

  const emendasFiltradas = emendasComResumo.filter((e) =>
    e.parlamentar.toLowerCase().includes(busca.toLowerCase()) ||
    e.processoSEI.includes(busca) ||
    e.portaria.includes(busca)
  );

  let gastosEmendaDetalhe = emendaDetalhe
    ? gastos.filter((g) => g.emendaId === emendaDetalhe.id)
    : [];

  if (filtroElemento) gastosEmendaDetalhe = gastosEmendaDetalhe.filter((g) => g.elementoDespesa === filtroElemento);

  const elementosUnicos = [...new Set(gastos.filter((g) => emendaDetalhe && g.emendaId === emendaDetalhe.id).map((g) => g.elementoDespesa))];

  function handleImportarCSV(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = ev.target.result;
      const resultado = parseCSVEmendas(texto);
      if (resultado.emendas.length > 0) {
        setImportarDados(resultado);
        setModalImportar(true);
      } else {
        toast.erro('Nenhuma emenda encontrada no arquivo CSV.');
      }
    };
    reader.readAsText(arquivo, 'UTF-8');
    e.target.value = '';
  }

  function confirmarImportacao() {
    if (!importarDados) return;
    let total = 0;
    if (importarDados.emendas.length > 0) total += importarEmendas(importarDados.emendas);
    if (importarDados.gastos.length > 0) total += importarGastos(importarDados.gastos);
    toast.sucesso(`${total} registro(s) importado(s) com sucesso!`);
    setModalImportar(false);
    setImportarDados(null);
  }

  function handleSalvarEmenda(dados) {
    if (editandoEmenda) {
      editarEmenda(editandoEmenda.id, dados);
      toast.sucesso('Emenda atualizada!');
    } else {
      adicionarEmenda(dados);
      toast.sucesso('Emenda criada!');
    }
    setModalEmenda(false);
    setEditandoEmenda(null);
  }

  function handleExcluirEmenda(id) {
    excluirEmenda(id);
    setModalExcluirEmenda(null);
    if (emendaDetalhe?.id === id) setEmendaDetalhe(null);
    toast.sucesso('Emenda excluída!');
  }

  async function handleSalvarGasto(dados) {
    try {
      if (editandoGasto) {
        await editarGasto(editandoGasto.id, dados);
        toast.sucesso('Gasto atualizado!');
      } else {
        await adicionarGasto({ ...dados, emendaId: emendaDetalhe.id });
        toast.sucesso('Gasto registrado!');
      }
      setModalGasto(false);
      setEditandoGasto(null);
    } catch (e) {
      toast.erro(e.message || 'Erro ao salvar gasto.');
    }
  }

  function handleExcluirGasto(id) {
    excluirGasto(id);
    setModalExcluirGasto(null);
    toast.sucesso('Gasto excluído!');
  }

  function handleExportarCSV() {
    exportarCSV(emendasFiltradas, 'emendas', [
      { chave: 'parlamentar', titulo: 'Parlamentar' },
      { chave: 'numeroProposta', titulo: 'Nº Proposta' },
      { chave: 'processoSEI', titulo: 'Processo SEI' },
      { chave: 'portaria', titulo: 'Portaria' },
      { chave: 'valorTotal', titulo: 'Valor Total', formatar: (v) => formatarMoeda(v) },
      { chave: 'totalGasto', titulo: 'Total Gasto', formatar: (v) => formatarMoeda(v) },
      { chave: 'saldo', titulo: 'Saldo', formatar: (v) => formatarMoeda(v) },
    ]);
  }

  if (emendaDetalhe) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <button onClick={() => { setEmendaDetalhe(null); setFiltroElemento(''); }} className="text-sm text-blue-600 hover:text-blue-800 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Voltar
            </button>
            <h2 className="text-2xl font-bold text-slate-800">Emenda: {emendaDetalhe.parlamentar}</h2>
            <p className="text-sm text-slate-500 mt-1">Portaria {emendaDetalhe.portaria} | {emendaDetalhe.processoSEI}</p>
          </div>
          {!isViewer && (
            <button onClick={() => { setEditandoGasto(null); setModalGasto(true); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Gasto
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-600 font-medium">Valor Total</p>
            <p className="text-xl font-bold text-blue-800">{formatarMoeda(emendaDetalhe.valorTotal)}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-600 font-medium">Total Gasto</p>
            <p className="text-xl font-bold text-amber-800">{formatarMoeda(emendaDetalhe.totalGasto)}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-xs text-emerald-600 font-medium">Saldo</p>
            <p className="text-xl font-bold text-emerald-800">{formatarMoeda(emendaDetalhe.saldo)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Elemento</label>
            <select value={filtroElemento} onChange={(e) => setFiltroElemento(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
              <option value="">Todos</option>
              {elementosUnicos.map((el) => (<option key={el} value={el}>{el}</option>))}
            </select>
          </div>
          {filtroElemento && (
            <button onClick={() => setFiltroElemento('')} className="text-xs text-red-500 hover:text-red-700 pb-2">Limpar filtro</button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700">Gastos desta Emenda ({gastosEmendaDetalhe.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Nome Prestador</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Elemento</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Nº Empenho</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Nº Nota Fiscal</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Data</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Projeto/Atividade</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Fonte Recurso</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Nº Memorando</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Justificativa</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500">Valor Pago</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">Nº Conta</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {gastosEmendaDetalhe.map((g) => (
                  <tr key={g.id} className={`border-b border-slate-100 hover:bg-slate-50 ${isViewer ? '' : 'cursor-pointer'}`} onDoubleClick={isViewer ? undefined : () => { setEditandoGasto(g); setModalGasto(true); }}>
                    <td className="px-3 py-3 text-slate-800 font-medium">{g.nomePrestador}</td>
                    <td className="px-3 py-3"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{g.elementoDespesa}</span></td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{g.numeroEmpenho}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{g.numeroNotaFiscal}</td>
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatarData(g.data)}</td>
                    <td className="px-3 py-3 text-slate-600">{g.projetoAtividade}</td>
                    <td className="px-3 py-3 text-slate-600">{g.fonteRecurso}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{g.numeroMemorando}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={g.justificativa}>{g.justificativa}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-800">{formatarMoeda(g.valorPago)}</td>
                    <td className="px-3 py-3 text-slate-600 font-mono text-xs">{g.numeroConta}</td>
                    <td className="px-3 py-3 text-right">
                      {!isViewer && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => { setEditandoGasto(g); setModalGasto(true); }} title="Editar" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => setModalExcluirGasto(g)} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {gastosEmendaDetalhe.length === 0 && (
                  <tr><td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                    {filtroElemento ? 'Nenhum gasto com esse filtro' : 'Nenhum gasto registrado'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal aberto={modalGasto} onFechar={() => { setModalGasto(false); setEditandoGasto(null); }} titulo={editandoGasto ? 'Editar Gasto' : 'Novo Gasto'}>
          <FormGasto dados={editandoGasto} onSalvar={handleSalvarGasto} onCancelar={() => { setModalGasto(false); setEditandoGasto(null); }} />
        </Modal>
        <Modal aberto={!!modalExcluirGasto} onFechar={() => setModalExcluirGasto(null)} titulo="Excluir Gasto" largura="max-w-md">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Tem certeza que deseja excluir este gasto?</p>
            {modalExcluirGasto && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                <p><strong>{modalExcluirGasto.nomePrestador}</strong></p>
                <p>{modalExcluirGasto.projetoAtividade} — {formatarMoeda(modalExcluirGasto.valorPago)}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalExcluirGasto(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Cancelar</button>
              <button onClick={() => handleExcluirGasto(modalExcluirGasto?.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Emendas Parlamentares</h2>
          <p className="text-sm text-slate-500 mt-1">Gerencie emendas e seus respectivos gastos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportarCSV} className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">CSV</button>
          {!isViewer && (
            <>
              <button onClick={() => importInputRef.current?.click()} className="px-4 py-2.5 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Importar CSV
              </button>
              <input ref={importInputRef} type="file" accept=".csv" onChange={handleImportarCSV} className="hidden" />
              <button onClick={() => { setEditandoEmenda(null); setModalEmenda(true); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Nova Emenda
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por parlamentar, processo SEI, portaria..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {emendasFiltradas.map((e) => (
          <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{e.parlamentar}</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Portaria {e.portaria}</p>
                <p className="text-xs text-slate-400 font-mono">SEI: {e.processoSEI}</p>
              </div>
              {!isViewer && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditandoEmenda(e); setModalEmenda(true); }} title="Editar" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setModalExcluirEmenda(e)} title="Excluir" className="p-1.5 rounded-lg hover:bg-red-100 text-red-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-[11px] text-slate-500 uppercase">Valor Total</p>
                <p className="text-sm font-bold text-blue-700">{formatarMoeda(e.valorTotal)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase">Gasto</p>
                <p className="text-sm font-bold text-amber-600">{formatarMoeda(e.totalGasto)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase">Saldo</p>
                <p className="text-sm font-bold text-emerald-600">{formatarMoeda(e.saldo)}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
              <div className={`h-2 rounded-full transition-all ${e.percentualGasto > 80 ? 'bg-red-500' : e.percentualGasto > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(e.percentualGasto, 100)}%` }} />
            </div>
            <button onClick={() => setEmendaDetalhe(e)} className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              Ver Gastos ({e.qtdGastos})
            </button>
          </div>
        ))}
      </div>

      <Modal aberto={modalEmenda} onFechar={() => { setModalEmenda(false); setEditandoEmenda(null); }} titulo={editandoEmenda ? 'Editar Emenda' : 'Nova Emenda'}>
        <FormEmenda dados={editandoEmenda} onSalvar={handleSalvarEmenda} onCancelar={() => { setModalEmenda(false); setEditandoEmenda(null); }} />
      </Modal>

      <Modal aberto={!!modalExcluirEmenda} onFechar={() => setModalExcluirEmenda(null)} titulo="Excluir Emenda" largura="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir a emenda de <strong>{modalExcluirEmenda?.parlamentar}</strong>?</p>
          <p className="text-xs text-red-600">Todos os gastos vinculados também serão excluídos.</p>
          <div className="flex gap-3">
            <button onClick={() => setModalExcluirEmenda(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Cancelar</button>
            <button onClick={() => handleExcluirEmenda(modalExcluirEmenda?.id)} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Excluir</button>
          </div>
        </div>
      </Modal>

      <Modal aberto={modalImportar} onFechar={() => { setModalImportar(false); setImportarDados(null); }} titulo="Confirmar Importação" largura="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Foram encontrados no arquivo CSV:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{importarDados?.emendas?.length || 0}</p>
              <p className="text-xs text-blue-600">Emenda(s)</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{importarDados?.gastos?.length || 0}</p>
              <p className="text-xs text-amber-600">Gasto(s)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setModalImportar(false); setImportarDados(null); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Cancelar</button>
            <button onClick={confirmarImportacao} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Importar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
