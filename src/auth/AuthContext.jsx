import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, verificarServidor } from '../utils/api';

const AuthContext = createContext(null);

const USUARIOS_PADRAO = [
  { id: 1, username: 'admin', senha: 'admin123', nome: 'Administrador', cargo: 'Administrador' },
  { id: 2, username: 'financeiro', senha: 'fin2024', nome: 'Coordenador Financeiro', cargo: 'Coordenador' },
  { id: 3, username: 'viewer', senha: 'vis123', nome: 'Visualizador', cargo: 'Visualizador' },
];

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState(() => {
    const salvos = localStorage.getItem('emendas_usuarios');
    return salvos ? JSON.parse(salvos) : [...USUARIOS_PADRAO];
  });

  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('emendas_usuario_logado');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      const temAPI = await verificarServidor();
      if (temAPI) {
        try {
          const lista = await api.usuarios.listar();
          if (lista.length > 0) {
            setUsuarios(lista);
          } else {
            const local = JSON.parse(localStorage.getItem('emendas_usuarios') || 'null');
            const fins = local || [...USUARIOS_PADRAO];
            for (const u of fins) await api.usuarios.criar(u);
            setUsuarios(fins);
          }
        } catch { /* fallback local */ }
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('emendas_usuarios', JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem('emendas_usuario_logado', JSON.stringify(usuario));
    } else {
      localStorage.removeItem('emendas_usuario_logado');
    }
  }, [usuario]);

  async function login(username, senha) {
    setErro('');
    const temAPI = await verificarServidor();
    if (temAPI) {
      try {
        const user = await api.login(username, senha);
        setUsuario(user);
        return true;
      } catch {
        setErro('Usuário ou senha inválidos');
        return false;
      }
    }
    const encontrado = usuarios.find((u) => u.username === username && u.senha === senha);
    if (encontrado) {
      setUsuario(encontrado);
      return true;
    }
    setErro('Usuário ou senha inválidos');
    return false;
  }

  function logout() {
    setUsuario(null);
  }

  const adicionarUsuario = useCallback((novo) => {
    const existe = usuarios.find((u) => u.username === novo.username);
    if (existe) return { ok: false, erro: 'Nome de usuário já existe' };
    const comId = { ...novo, id: Date.now() };
    api.usuarios.criar(comId).catch(() => {});
    setUsuarios((prev) => [...prev, comId]);
    return { ok: true };
  }, [usuarios]);

  const editarUsuario = useCallback((id, dados) => {
    if (dados.username) {
      const existe = usuarios.find((u) => u.username === dados.username && u.id !== id);
      if (existe) return { ok: false, erro: 'Nome de usuário já existe' };
    }
    api.usuarios.editar(id, dados).catch(() => {});
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...dados } : u)));
    return { ok: true };
  }, [usuarios]);

  const excluirUsuario = useCallback((id) => {
    if (id === 1) return { ok: false, erro: 'Não é possível excluir o administrador padrão' };
    api.usuarios.excluir(id).catch(() => {});
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    return { ok: true };
  }, []);

  return (
    <AuthContext.Provider value={{
      usuario, usuarios, login, logout, erro, setErro,
      adicionarUsuario, editarUsuario, excluirUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}
