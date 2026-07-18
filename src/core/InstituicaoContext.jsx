import { createContext, useContext, useState, useEffect } from 'react';
import { api, verificarServidor } from '../utils/api';

const InstituicaoContext = createContext(null);

const VALORES_PADRAO = {
  nomeInstituicao: 'Secretaria Municipal de Saúde de Brasília',
  nomeSistema: 'Controle de Emendas Parlamentares',
  logoUrl: '',
};

export function InstituicaoProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const salva = localStorage.getItem('emendas_config_instituicao');
    return salva ? { ...VALORES_PADRAO, ...JSON.parse(salva) } : VALORES_PADRAO;
  });

  useEffect(() => {
    (async () => {
      const temAPI = await verificarServidor();
      if (temAPI) {
        try {
          const remota = await api.config.obter();
          if (remota && Object.keys(remota).length > 0) {
            setConfig((prev) => ({ ...prev, ...remota }));
          } else {
            const local = JSON.parse(localStorage.getItem('emendas_config_instituicao') || 'null');
            if (local) await api.config.salvar(local);
          }
        } catch { /* fallback local */ }
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('emendas_config_instituicao', JSON.stringify(config));
    api.config.salvar(config).catch(() => {});
  }, [config]);

  function atualizarConfig(novosDados) {
    setConfig((prev) => ({ ...prev, ...novosDados }));
  }

  function definirLogo(dataUrl) {
    setConfig((prev) => ({ ...prev, logoUrl: dataUrl }));
  }

  function limparLogo() {
    setConfig((prev) => ({ ...prev, logoUrl: '' }));
  }

  return (
    <InstituicaoContext.Provider value={{ config, atualizarConfig, definirLogo, limparLogo }}>
      {children}
    </InstituicaoContext.Provider>
  );
}

export function useInstituicao() {
  const ctx = useContext(InstituicaoContext);
  if (!ctx) throw new Error('useInstituicao deve ser usado dentro de um InstituicaoProvider');
  return ctx;
}
