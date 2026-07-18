import { useMemo, useState, useEffect } from 'react';
import { api, verificarServidor } from '../utils/api';
import { useToast } from '../core/ToastContext';

const TABELAS = { emendas: 'Emendas', gastos: 'Gastos', usuarios: 'Usuários', elementos_despesa: 'Elementos de Despesa' };
const ACOES = { CRIAR: 'Criar', EDITAR: 'Editar', EXCLUIR: 'Excluir', LOGIN: 'Login', TENTATIVA_LOGIN: 'Tentativa de Login' };
const CORES_ACAO = { CRIAR: 'bg-emerald-100 text-emerald-700', EDITAR: 'bg-blue-100 text-blue-700', EXCLUIR: 'bg-red-100 text-red-700', LOGIN: 'bg-slate-100 text-slate-700', TENTATIVA_LOGIN: 'bg-amber-100 text-amber-700' };

export default function HistoricoPage() {
  const toast = useToast();
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [filtroTabela, setFiltroTabela] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const porPagina = 50;

  useEffect(() => {
    carregar();
  }, [pagina, filtroTabela, filtroAcao]);

  async function carregar() {
    setCarregando(true);
    try {
      const temAPI = await verificarServidor();
      if (temAPI) {
        const params = { limit: porPagina, offset: (pagina - 1) * porPagina };
        if (filtroTabela) params.tabela = filtroTabela;
        if (filtroAcao) params.acao = filtroAcao;
        const res = await api.historico.listar(params);
        setDados(res.dados);
        setTotal(res.total);
      }
    } catch (e) {
      toast.erro('Erro ao carregar histórico.');
    }
    setCarregando(false);
  }

  function formatarDataHora(dt) {
    if (!dt) return '-';
    const d = new Date(dt);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Histórico de Atividades</h2>
        <p className="text-sm text-slate-500 mt-1">Registro de todas as ações realizadas no sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Tabela</label>
          <select value={filtroTabela} onChange={(e) => { setFiltroTabela(e.target.value); setPagina(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            <option value="">Todas</option>
            {Object.entries(TABELAS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ação</label>
          <select value={filtroAcao} onChange={(e) => { setFiltroAcao(e.target.value); setPagina(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
            <option value="">Todas</option>
            {Object.entries(ACOES).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
        </div>
        <div className="text-sm text-slate-500 pb-2">{total} registro(s)</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tabela</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : dados.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Nenhum registro encontrado</td></tr>
              ) : dados.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatarDataHora(d.data_hora)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.usuario}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CORES_ACAO[d.acao] || 'bg-slate-100 text-slate-600'}`}>
                      {ACOES[d.acao] || d.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{TABELAS[d.tabela] || d.tabela}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[300px] truncate" title={d.detalhes}>{d.detalhes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-40">
            Anterior
          </button>
          <span className="text-sm text-slate-600">Página {pagina} de {totalPaginas}</span>
          <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 disabled:opacity-40">
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
