import { useState, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useInstituicao } from '../core/InstituicaoContext';
import { useEmendas } from '../emendas/EmendasContext';
import Modal from '../core/Modal';

const CAMPOS_USUARIO = { username: '', nome: '', senha: '', cargo: '' };

export default function ConfiguracoesPage() {
  const { usuario, logout, usuarios, adicionarUsuario, editarUsuario, excluirUsuario } = useAuth();
  const isViewer = usuario?.cargo === 'Visualizador';
  const { config, atualizarConfig, definirLogo, limparLogo } = useInstituicao();
  const { emendas, gastos, resetar } = useEmendas();
  const logoInputRef = useRef(null);
  const importJsonRef = useRef(null);

  const [nomeInst, setNomeInst] = useState(config.nomeInstituicao);
  const [nomeSist, setNomeSist] = useState(config.nomeSistema);
  const [modalUsuario, setModalUsuario] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState(null);
  const [formUsuario, setFormUsuario] = useState({ ...CAMPOS_USUARIO });
  const [erroUsuario, setErroUsuario] = useState('');
  const [modalExcluirUsuario, setModalExcluirUsuario] = useState(null);

  function handleLogoChange(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    if (arquivo.size > 512000) { alert('Logo muito grande. Máximo 500KB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => definirLogo(ev.target.result);
    reader.readAsDataURL(arquivo);
  }

  function salvarNomeInstituicao() {
    atualizarConfig({ nomeInstituicao: nomeInst, nomeSistema: nomeSist });
  }

  function limparDados() {
    if (window.confirm('Tem certeza? Isso vai limpar todos os dados salvos no navegador.')) {
      localStorage.clear();
      window.location.reload();
    }
  }

  function handleExportarDados() {
    const dados = {
      _versao: '1.0',
      _data: new Date().toISOString(),
      emendas,
      gastos,
      usuarios,
      configInstituicao: config,
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_emendas_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportarDados(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dados = JSON.parse(ev.target.result);
        if (!dados.emendas || !dados.gastos) {
          alert('Arquivo inválido: não contém dados de emendas e gastos.');
          return;
        }
        if (!window.confirm(`Importar ${dados.emendas.length} emenda(s) e ${dados.gastos.length} gasto(s)?\n\nOs dados atuais serão SUBSTITUÍDOS.`)) return;
        localStorage.setItem('emendas_lista', JSON.stringify(dados.emendas));
        localStorage.setItem('emendas_gastos', JSON.stringify(dados.gastos));
        if (dados.usuarios) localStorage.setItem('emendas_usuarios', JSON.stringify(dados.usuarios));
        if (dados.configInstituicao) localStorage.setItem('emendas_instituicao', JSON.stringify(dados.configInstituicao));
        window.location.reload();
      } catch {
        alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
      }
    };
    reader.readAsText(arquivo, 'UTF-8');
    e.target.value = '';
  }

  function abrirModalUsuario(usuarioExistente) {
    if (usuarioExistente) {
      setEditandoUsuario(usuarioExistente);
      setFormUsuario({ username: usuarioExistente.username, nome: usuarioExistente.nome, senha: '', cargo: usuarioExistente.cargo });
    } else {
      setEditandoUsuario(null);
      setFormUsuario({ ...CAMPOS_USUARIO });
    }
    setErroUsuario('');
    setModalUsuario(true);
  }

  function handleSalvarUsuario(e) {
    e.preventDefault();
    setErroUsuario('');
    const dados = { ...formUsuario };
    if (!dados.username || !dados.nome || !dados.cargo) { setErroUsuario('Preencha todos os campos.'); return; }
    if (!editandoUsuario && !dados.senha) { setErroUsuario('Senha obrigatória para novos usuários.'); return; }
    if (editandoUsuario) {
      const atualizados = { username: dados.username, nome: dados.nome, cargo: dados.cargo };
      if (dados.senha) atualizados.senha = dados.senha;
      const res = editarUsuario(editandoUsuario.id, atualizados);
      if (!res.ok) { setErroUsuario(res.erro); return; }
    } else {
      const res = adicionarUsuario(dados);
      if (!res.ok) { setErroUsuario(res.erro); return; }
    }
    setModalUsuario(false);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-sm text-slate-500 mt-1">Gerencie preferências do sistema</p>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Perfil do Usuário</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-700">{usuario?.nome?.charAt(0) || 'U'}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{usuario?.nome}</p>
            <p className="text-sm text-slate-500">{usuario?.cargo}</p>
            <p className="text-xs text-slate-400 font-mono mt-1">@{usuario?.username}</p>
          </div>
        </div>
        <button onClick={logout} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
          Sair do Sistema
        </button>
      </div>

      {/* Instituição */}
      {!isViewer && (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Instituição</h3>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => logoInputRef.current?.click()}
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-slate-400 mt-1 block">Clique para enviar</span>
                </div>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            {config.logoUrl && (
              <button onClick={limparLogo} className="text-xs text-red-500 hover:text-red-700">Remover logo</button>
            )}
          </div>
          <div className="flex-1 min-w-[240px] space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Instituição</label>
              <input type="text" value={nomeInst} onChange={(e) => setNomeInst(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Sistema</label>
              <input type="text" value={nomeSist} onChange={(e) => setNomeSist(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" />
            </div>
            <button onClick={salvarNomeInstituicao} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Usuários */}
      {!isViewer && (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-700">Usuários Cadastrados</h3>
          <button onClick={() => abrirModalUsuario(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Usuário
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Usuário</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Nome</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Cargo</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono text-xs">{u.username}</td>
                  <td className="px-3 py-2.5 text-sm">{u.nome}</td>
                  <td className="px-3 py-2.5"><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{u.cargo}</span></td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => abrirModalUsuario(u)} title="Editar" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setModalExcluirUsuario(u)} title="Excluir" disabled={u.id === 1} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Info do Sistema */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Informações do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Versão</p>
            <p className="text-sm font-semibold text-slate-700">1.0.0</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Emendas Cadastradas</p>
            <p className="text-sm font-semibold text-slate-700">{emendas.length}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Exercício</p>
            <p className="text-sm font-semibold text-slate-700">2026</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Armazenamento</p>
            <p className="text-sm font-semibold text-slate-700">localStorage</p>
          </div>
        </div>
      </div>

      {/* Dados */}
      {!isViewer && (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Gerenciamento de Dados</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-700">Backup do Servidor</p>
              <p className="text-xs text-blue-500">Gerencie backups salvos no servidor (recomendado)</p>
            </div>
            <a href="/backup" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Acessar</a>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Exportar Dados (JSON)</p>
              <p className="text-xs text-slate-500">Salva backup local no navegador</p>
            </div>
            <button onClick={handleExportarDados} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Exportar</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Importar Dados (JSON)</p>
              <p className="text-xs text-slate-500">Restaura backup local — substitui dados do navegador</p>
            </div>
            <button onClick={() => importJsonRef.current?.click()} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Importar</button>
            <input ref={importJsonRef} type="file" accept=".json" onChange={handleImportarDados} className="hidden" />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">Resetar Dados</p>
              <p className="text-xs text-slate-500">Volta aos dados originais</p>
            </div>
            <button onClick={resetar} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Resetar</button>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-red-700">Limpar Todos os Dados</p>
              <p className="text-xs text-red-500">Remove tudo do navegador</p>
            </div>
            <button onClick={limparDados} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Limpar</button>
          </div>
        </div>
      </div>
      )}

      {/* Modal Usuário */}
      <Modal aberto={modalUsuario} onFechar={() => setModalUsuario(false)} titulo={editandoUsuario ? 'Editar Usuário' : 'Novo Usuário'} largura="max-w-md">
        <form onSubmit={handleSalvarUsuario} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome de Usuário *</label>
            <input type="text" value={formUsuario.username} onChange={(e) => setFormUsuario({ ...formUsuario, username: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome Completo *</label>
            <input type="text" value={formUsuario.nome} onChange={(e) => setFormUsuario({ ...formUsuario, nome: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Senha {!editandoUsuario && '*'}{editandoUsuario && <span className="text-slate-400 font-normal"> (deixe vazio para manter)</span>}</label>
            <input type="password" value={formUsuario.senha} onChange={(e) => setFormUsuario({ ...formUsuario, senha: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" {...(!editandoUsuario ? { required: true } : {})} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cargo *</label>
            <select value={formUsuario.cargo} onChange={(e) => setFormUsuario({ ...formUsuario, cargo: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm" required>
              <option value="">Selecione</option>
              <option value="Administrador">Administrador</option>
              <option value="Coordenador">Coordenador</option>
              <option value="Analista">Analista</option>
              <option value="Visualizador">Visualizador</option>
            </select>
          </div>
          {erroUsuario && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{erroUsuario}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalUsuario(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">{editandoUsuario ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Excluir Usuário */}
      <Modal aberto={!!modalExcluirUsuario} onFechar={() => setModalExcluirUsuario(null)} titulo="Excluir Usuário" largura="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Tem certeza que deseja excluir <strong>{modalExcluirUsuario?.nome}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setModalExcluirUsuario(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50">Cancelar</button>
            <button onClick={() => { excluirUsuario(modalExcluirUsuario?.id); setModalExcluirUsuario(null); }} className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">Excluir</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
