import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const adicionarToast = useCallback((mensagem, tipo = 'sucesso') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const sucesso = useCallback((msg) => adicionarToast(msg, 'sucesso'), [adicionarToast]);
  const erro = useCallback((msg) => adicionarToast(msg, 'erro'), [adicionarToast]);
  const aviso = useCallback((msg) => adicionarToast(msg, 'aviso'), [adicionarToast]);

  return (
    <ToastContext.Provider value={{ sucesso, erro, aviso }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-[slideIn_0.3s_ease] ${
              t.tipo === 'sucesso' ? 'bg-emerald-600' :
              t.tipo === 'erro' ? 'bg-red-600' :
              'bg-amber-500'
            }`}
          >
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de um ToastProvider');
  return context;
}
