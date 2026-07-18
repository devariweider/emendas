import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api, verificarServidor } from '../utils/api';

export default function FormGasto({ dados, onSalvar, onCancelar }) {
  const { usuario } = useAuth();
  const isViewer = usuario?.cargo === 'Visualizador';
  const [elementos, setElementos] = useState([]);
  const [novoElemento, setNovoElemento] = useState('');
  const [editandoElementos, setEditandoElementos] = useState(false);
  const [erroElemento, setErroElemento] = useState('');
  const [form, setForm] = useState({
    nomePrestador: '',
    elementoDespesa: '',
    numeroEmpenho: '',
    numeroNotaFiscal: '',
    data: '',
    projetoAtividade: '',
    fonteRecurso: 'Emenda Parlamentar',
    numeroMemorando: '',
    justificativa: '',
    valorPago: '',
    numeroConta: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const temAPI = await verificarServidor();
        if (temAPI) {
          const els = await api.elementos.listar();
          setElementos(els);
          setForm((prev) => ({ ...prev, elementoDespesa: prev.elementoDespesa || (els.length > 0 ? els[0].nome : '') }));
          return;
        }
      } catch {}
      setElementos([
        { id: -1, nome: 'Equipamentos', padrao: 1 },
        { id: -2, nome: 'Obras', padrao: 1 },
        { id: -3, nome: 'Material', padrao: 1 },
        { id: -4, nome: 'Serviços', padrao: 1 },
        { id: -5, nome: 'Medicamentos', padrao: 1 },
        { id: -6, nome: 'Outros', padrao: 1 },
      ]);
    })();
  }, []);

  useEffect(() => {
    if (dados) {
      setForm({
        nomePrestador: dados.nomePrestador || '',
        elementoDespesa: dados.elementoDespesa || (elementos.length > 0 ? elementos[0].nome : ''),
        numeroEmpenho: dados.numeroEmpenho || '',
        numeroNotaFiscal: dados.numeroNotaFiscal || '',
        data: dados.data || '',
        projetoAtividade: dados.projetoAtividade || '',
        fonteRecurso: dados.fonteRecurso || 'Emenda Parlamentar',
        numeroMemorando: dados.numeroMemorando || '',
        justificativa: dados.justificativa || '',
        valorPago: dados.valorPago ? String(dados.valorPago) : '',
        numeroConta: dados.numeroConta || '',
      });
    }
  }, [dados]);

  function handleChange(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function handleAdicionarElemento() {
    const nome = novoElemento.trim();
    if (!nome) return;
    if (elementos.some((el) => el.nome.toLowerCase() === nome.toLowerCase())) return;
    setErroElemento('');
    try {
      const criado = await api.elementos.criar(nome);
      setElementos((prev) => [...prev, criado]);
      setForm((prev) => ({ ...prev, elementoDespesa: nome }));
      setNovoElemento('');
    } catch (e) {
      setErroElemento(e.message);
    }
  }

  async function handleRemoverElemento(el) {
    if (el.padrao) return;
    try {
      await api.elementos.excluir(el.id);
      setElementos((prev) => prev.filter((e) => e.id !== el.id));
      if (form.elementoDespesa === el.nome) {
        const restantes = elementos.filter((e) => e.id !== el.id);
        if (restantes.length > 0) setForm((prev) => ({ ...prev, elementoDespesa: restantes[0].nome }));
      }
    } catch (e) {
      setErroElemento(e.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({
      ...form,
      valorPago: parseFloat(form.valorPago) || 0,
    });
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      {/* Linha 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nome Prestador de Serviço *</label>
          <input type="text" value={form.nomePrestador} onChange={(e) => handleChange('nomePrestador', e.target.value)} placeholder="Razão social do prestador" className={inputCls} required />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-500">Elemento de Despesa *</label>
            {!isViewer && (
              <button type="button" onClick={() => setEditandoElementos(!editandoElementos)} className="text-[11px] text-blue-600 hover:text-blue-800">
                {editandoElementos ? 'Fechar' : 'Gerenciar'}
              </button>
            )}
          </div>
          {!editandoElementos ? (
            <select value={form.elementoDespesa} onChange={(e) => handleChange('elementoDespesa', e.target.value)} className={inputCls} required>
              {elementos.map((el) => (<option key={el.id} value={el.nome}>{el.nome}</option>))}
            </select>
          ) : (
            <div className="border border-blue-300 rounded-lg p-3 bg-blue-50 space-y-2">
              <div className="flex gap-2">
                <input type="text" value={novoElemento} onChange={(e) => setNovoElemento(e.target.value)} placeholder="Novo elemento..." className={`${inputCls} !mb-0`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarElemento(); } }} />
                <button type="button" onClick={handleAdicionarElemento} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 whitespace-nowrap">Adicionar</button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {elementos.map((el) => (
                  <span key={el.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white border border-slate-200">
                    {el.nome}
                    {el.padrao ? (
                      <span className="text-slate-300 ml-0.5" title="Padrão — não removível">&#128274;</span>
                    ) : (
                      <button type="button" onClick={() => handleRemoverElemento(el)} className="text-red-400 hover:text-red-600 ml-0.5" title="Remover">&times;</button>
                    )}
                  </span>
                ))}
              </div>
              {erroElemento && <p className="text-xs text-red-500">{erroElemento}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº do Empenho</label>
          <input type="text" value={form.numeroEmpenho} onChange={(e) => handleChange('numeroEmpenho', e.target.value)} placeholder="Ex: 2026NE0001" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº da Nota Fiscal</label>
          <input type="text" value={form.numeroNotaFiscal} onChange={(e) => handleChange('numeroNotaFiscal', e.target.value)} placeholder="Ex: NF-00125" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data *</label>
          <input type="date" value={form.data} onChange={(e) => handleChange('data', e.target.value)} className={inputCls} required />
        </div>
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Projeto / Atividade *</label>
          <input type="text" value={form.projetoAtividade} onChange={(e) => handleChange('projetoAtividade', e.target.value)} placeholder="Descrição do projeto ou atividade" className={inputCls} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fonte de Recurso</label>
          <input type="text" value={form.fonteRecurso} onChange={(e) => handleChange('fonteRecurso', e.target.value)} placeholder="Ex: Emenda Parlamentar" className={inputCls} />
        </div>
      </div>

      {/* Linha 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº do Memorando</label>
          <input type="text" value={form.numeroMemorando} onChange={(e) => handleChange('numeroMemorando', e.target.value)} placeholder="Ex: MEM-045/2026" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº da Conta</label>
          <input type="text" value={form.numeroConta} onChange={(e) => handleChange('numeroConta', e.target.value)} placeholder="Ex: 1.3.52.52.01" className={inputCls} />
        </div>
      </div>

      {/* Linha 5 - Justificativa */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Justificativa</label>
        <textarea
          value={form.justificativa}
          onChange={(e) => handleChange('justificativa', e.target.value)}
          placeholder="Descreva a justificativa para este gasto..."
          rows={3}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Linha 6 - Valor */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Valor Pago (R$) *</label>
        <input type="number" step="0.01" min="0" value={form.valorPago} onChange={(e) => handleChange('valorPago', e.target.value)} placeholder="0,00" className={`${inputCls} text-lg font-semibold`} required />
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white">
        <button type="button" onClick={onCancelar} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={isViewer} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {dados ? 'Salvar' : 'Registrar'}
        </button>
      </div>
    </form>
  );
}
