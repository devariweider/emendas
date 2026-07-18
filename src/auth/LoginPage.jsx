import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useInstituicao } from '../core/InstituicaoContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login, erro } = useAuth();
  const { config } = useInstituicao();

  async function handleSubmit(e) {
    e.preventDefault();
    setCarregando(true);
    await new Promise((r) => setTimeout(r, 400));
    login(username, senha);
    setCarregando(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="w-20 h-20 rounded-full mx-auto mb-4 object-contain bg-white p-2" />
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 mb-4">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          )}
          <h1 className="text-2xl font-bold text-white">{config.nomeSistema}</h1>
          <p className="text-blue-200 mt-1">{config.nomeInstituicao}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Entrar no Sistema</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-800"
                required
              />
            </div>
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{erro}</div>
            )}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 font-medium">Entre em contato com o administrador para obter suas credenciais de acesso.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
