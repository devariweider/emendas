import { useAuth } from '../auth/AuthContext';
import { useInstituicao } from './InstituicaoContext';
import { useEmendas } from '../emendas/EmendasContext';

export default function Header({ onToggleSidebar }) {
  const { usuario, logout } = useAuth();
  const { config } = useInstituicao();
  const { servidorAtivo } = useEmendas();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <button
        onClick={onToggleSidebar}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden lg:flex items-center gap-3">
        {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded" />}
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{config.nomeSistema}</h1>
          <p className="text-xs text-slate-500">{config.nomeInstituicao}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border" title={servidorAtivo ? 'Dados sincronizados via servidor' : 'Dados apenas neste navegador'}>
          <span className={`w-2 h-2 rounded-full ${servidorAtivo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {servidorAtivo ? 'Servidor' : 'Local'}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-800">{usuario?.nome}</p>
          <p className="text-xs text-slate-500">{usuario?.cargo}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-bold text-blue-700">{usuario?.nome?.charAt(0) || 'U'}</span>
        </div>
        <button
          onClick={logout}
          title="Sair do sistema"
          className="p-2 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
