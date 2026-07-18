import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../utils/api';
import { useToast } from '../core/ToastContext';

export default function BackupPage() {
  const { usuario } = useAuth();
  const toast = useToast();
  const isViewer = usuario?.cargo === 'Visualizador';
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const importJsonRef = useRef(null);

  async function handleExportar() {
    setExportando(true);
    try {
      const dados = await api.backup.exportar();
      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_emendas_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.sucesso('Backup exportado com sucesso!');
    } catch (e) {
      toast.erro('Erro ao exportar backup: ' + e.message);
    }
    setExportando(false);
  }

  function handleUploadJSON(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setImportando(true);
      try {
        const dados = JSON.parse(ev.target.result);
        if (!dados.emendas || !dados.gastos) {
          toast.erro('Arquivo inválido: não contém dados de emendas e gastos.');
          setImportando(false);
          return;
        }
        if (!window.confirm(`Importar ${dados.emendas.length} emenda(s) e ${dados.gastos.length} gasto(s)?\n\nOs dados atuais serão SUBSTITUÍDOS.`)) {
          setImportando(false);
          return;
        }
        await api.backup.importar(dados);
        toast.sucesso('Backup restaurado com sucesso!');
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.erro('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
      setImportando(false);
    };
    reader.readAsText(arquivo, 'UTF-8');
    e.target.value = '';
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Backup do Sistema</h2>
        <p className="text-sm text-slate-500 mt-1">Exporte e importe backups da base de dados</p>
      </div>

      {/* Exportar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Exportar Backup</h3>
        <p className="text-sm text-slate-500 mb-4">
          Baixa um arquivo JSON completo com todas as emendas, gastos, usuários, elementos de despesa e configurações.
        </p>
        {!isViewer && (
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {exportando ? 'Exportando...' : 'Baixar Backup'}
          </button>
        )}
      </div>

      {/* Importar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Importar Backup</h3>
        <p className="text-sm text-slate-500 mb-4">
          Importe um arquivo JSON de backup. Todos os dados atuais serão substituídos.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-amber-700 font-medium">Atenção:</p>
          <p className="text-xs text-amber-600 mt-1">Todos os dados atuais serão substituídos. Esta ação não pode ser desfeita.</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => importJsonRef.current?.click()}
            disabled={importando}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            {importando ? 'Importando...' : 'Importar JSON'}
          </button>
        )}
        <input ref={importJsonRef} type="file" accept=".json" onChange={handleUploadJSON} className="hidden" />
      </div>
    </div>
  );
}
