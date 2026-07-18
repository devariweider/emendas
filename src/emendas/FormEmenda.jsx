import { useState, useEffect } from 'react';

export default function FormEmenda({ dados, onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    parlamentar: '',
    numeroProposta: '',
    processoSEI: '',
    portaria: '',
    valorTotal: '',
  });

  useEffect(() => {
    if (dados) {
      setForm({
        parlamentar: dados.parlamentar || '',
        numeroProposta: dados.numeroProposta || '',
        processoSEI: dados.processoSEI || '',
        portaria: dados.portaria || '',
        valorTotal: dados.valorTotal ? String(dados.valorTotal) : '',
      });
    }
  }, [dados]);

  function handleSubmit(e) {
    e.preventDefault();
    onSalvar({
      ...form,
      valorTotal: parseFloat(form.valorTotal) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Parlamentar / Deputado *</label>
        <input
          type="text"
          value={form.parlamentar}
          onChange={(e) => setForm({ ...form, parlamentar: e.target.value })}
          placeholder="Nome do parlamentar"
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nº da Proposta</label>
          <input
            type="text"
            value={form.numeroProposta}
            onChange={(e) => setForm({ ...form, numeroProposta: e.target.value })}
            placeholder="Ex: 36000795503202600"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Processo SEI</label>
          <input
            type="text"
            value={form.processoSEI}
            onChange={(e) => setForm({ ...form, processoSEI: e.target.value })}
            placeholder="Ex: 25000.091805/2026-22"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Portaria</label>
          <input
            type="text"
            value={form.portaria}
            onChange={(e) => setForm({ ...form, portaria: e.target.value })}
            placeholder="Ex: 11048"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Valor Total da Emenda (R$) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valorTotal}
            onChange={(e) => setForm({ ...form, valorTotal: e.target.value })}
            placeholder="0,00"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-200">
        <button type="button" onClick={onCancelar} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
        <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
          {dados ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  );
}
