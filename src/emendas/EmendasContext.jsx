import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { emendasIniciais, gastosIniciais } from '../data/emendas';
import { somarValores } from '../utils/formatacao';
import { api, verificarServidor } from '../utils/api';

const EmendasContext = createContext(null);

export function EmendasProvider({ children }) {
  const [usarAPI, setUsarAPI] = useState(false);
  const [pronto, setPronto] = useState(false);

  const [emendas, setEmendas] = useState(() => {
    const salvas = localStorage.getItem('emendas_lista');
    return salvas ? JSON.parse(salvas) : [...emendasIniciais];
  });

  const [gastos, setGastos] = useState(() => {
    const salvos = localStorage.getItem('emendas_gastos');
    return salvos ? JSON.parse(salvos) : [...gastosIniciais];
  });

  useEffect(() => {
    (async () => {
      const temAPI = await verificarServidor();
      setUsarAPI(temAPI);
      if (temAPI) {
        try {
          const [e, g] = await Promise.all([api.emendas.listar(), api.gastos.listar()]);
          if (e.length > 0 || g.length > 0) {
            setEmendas(e);
            setGastos(g);
          } else {
            const localE = JSON.parse(localStorage.getItem('emendas_lista') || '[]');
            const localG = JSON.parse(localStorage.getItem('emendas_gastos') || '[]');
            const finalsE = localE.length > 0 ? localE : [...emendasIniciais];
            const finalsG = localG.length > 0 ? localG : [...gastosIniciais];
            for (const em of finalsE) await api.emendas.criar(em);
            for (const ga of finalsG) await api.gastos.criar(ga);
            setEmendas(finalsE);
            setGastos(finalsG);
          }
        } catch (err) {
          console.warn('API indisponível, usando localStorage', err);
        }
      }
      setPronto(true);
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem('emendas_lista', JSON.stringify(emendas));
  }, [emendas]);

  useEffect(() => {
    localStorage.setItem('emendas_gastos', JSON.stringify(gastos));
  }, [gastos]);

  const adicionarEmenda = useCallback(async (dados) => {
    const nova = { ...dados, id: Date.now(), dataCriacao: new Date().toISOString().slice(0, 10) };
    if (usarAPI) {
      const criada = await api.emendas.criar(nova);
      setEmendas((prev) => [...prev, criada]);
      return criada;
    }
    setEmendas((prev) => [...prev, nova]);
    return nova;
  }, [usarAPI]);

  const editarEmenda = useCallback(async (id, dados) => {
    if (usarAPI) await api.emendas.editar(id, dados);
    setEmendas((prev) => prev.map((e) => (e.id === id ? { ...e, ...dados } : e)));
  }, [usarAPI]);

  const excluirEmenda = useCallback(async (id) => {
    if (usarAPI) await api.emendas.excluir(id);
    setEmendas((prev) => prev.filter((e) => e.id !== id));
    setGastos((prev) => prev.filter((g) => g.emendaId !== id));
  }, [usarAPI]);

  function ehDuplicado(novo, lista, ignorarId = null) {
    return lista.some((g) => {
      if (ignorarId && g.id === ignorarId) return false;
      return (
        g.emendaId === novo.emendaId &&
        g.nomePrestador === novo.nomePrestador &&
        g.elementoDespesa === novo.elementoDespesa &&
        g.numeroEmpenho === novo.numeroEmpenho &&
        g.numeroNotaFiscal === novo.numeroNotaFiscal &&
        g.data === novo.data &&
        g.projetoAtividade === novo.projetoAtividade &&
        g.valorPago === novo.valorPago
      );
    });
  }

  const adicionarGasto = useCallback(async (dados) => {
    if (ehDuplicado(dados, gastos)) {
      throw new Error('Gasto duplicado: já existe um registro com os mesmos dados nesta emenda.');
    }
    const novo = { ...dados, id: Date.now() };
    if (usarAPI) {
      const criado = await api.gastos.criar(novo);
      setGastos((prev) => [...prev, criado]);
      return criado;
    }
    setGastos((prev) => [...prev, novo]);
    return novo;
  }, [usarAPI, gastos]);

  const editarGasto = useCallback(async (id, dados) => {
    if (ehDuplicado({ ...gastos.find((g) => g.id === id), ...dados }, gastos, id)) {
      throw new Error('Gasto duplicado: já existe um registro com os mesmos dados nesta emenda.');
    }
    if (usarAPI) await api.gastos.editar(id, dados);
    setGastos((prev) => prev.map((g) => (g.id === id ? { ...g, ...dados } : g)));
  }, [usarAPI, gastos]);

  const excluirGasto = useCallback(async (id) => {
    if (usarAPI) await api.gastos.excluir(id);
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }, [usarAPI]);

  const importarEmendas = useCallback((novasEmendas) => {
    const comIds = novasEmendas.map((e, i) => ({
      ...e,
      id: Date.now() + i,
      dataCriacao: e.dataCriacao || new Date().toISOString().slice(0, 10),
    }));
    if (usarAPI) comIds.forEach(async (e) => await api.emendas.criar(e));
    setEmendas((prev) => [...prev, ...comIds]);
    return comIds.length;
  }, [usarAPI]);

  const importarGastos = useCallback((novosGastos) => {
    const comIds = novosGastos.map((g, i) => ({
      ...g,
      id: Date.now() + i + 5000,
    }));
    if (usarAPI) comIds.forEach(async (g) => await api.gastos.criar(g));
    setGastos((prev) => [...prev, ...comIds]);
    return comIds.length;
  }, [usarAPI]);

  const emendasComResumo = useMemo(() => {
    return emendas.map((e) => {
      const gastosEmenda = gastos.filter((g) => g.emendaId === e.id);
      const totalGasto = somarValores(gastosEmenda, 'valorPago');
      const vt = Number(e.valorTotal) || 0;
      return {
        ...e,
        valorTotal: vt,
        totalGasto,
        saldo: vt - totalGasto,
        percentualGasto: vt > 0 ? ((totalGasto / vt) * 100) : 0,
        qtdGastos: gastosEmenda.length,
      };
    });
  }, [emendas, gastos]);

  const totais = useMemo(() => {
    const valorTotal = emendasComResumo.reduce((acc, e) => acc + e.valorTotal, 0);
    const totalGasto = emendasComResumo.reduce((acc, e) => acc + e.totalGasto, 0);
    const alertas = emendasComResumo
      .filter((e) => e.percentualGasto > 80 || e.saldo < e.valorTotal * 0.1)
      .map((e) => ({
        emendaId: e.id,
        parlamentar: e.parlamentar,
        tipo: e.percentualGasto > 90 ? 'critico' : e.percentualGasto > 80 ? 'alerta' : 'aviso',
        mensagem: e.percentualGasto > 90
          ? `${e.parlamentar}: ${e.percentualGasto.toFixed(1)}% executado — saldo crítico!`
          : e.percentualGasto > 80
            ? `${e.parlamentar}: ${e.percentualGasto.toFixed(1)}% executado — atenção ao saldo.`
            : `${e.parlamentar}: saldo abaixo de 10% do total.`,
      }));
    return {
      valorTotal,
      totalGasto,
      saldo: valorTotal - totalGasto,
      qtdEmendas: emendas.length,
      qtdGastos: gastos.length,
      percentualGasto: valorTotal > 0 ? ((totalGasto / valorTotal) * 100) : 0,
      alertas,
    };
  }, [emendas, emendasComResumo, gastos]);

  function resetar() {
    const novasEmendas = [...emendasIniciais];
    const novosGastos = [...gastosIniciais];
    if (usarAPI) {
      novasEmendas.forEach(async (e) => await api.emendas.criar(e));
      novosGastos.forEach(async (g) => await api.gastos.criar(g));
    }
    setEmendas(novasEmendas);
    setGastos(novosGastos);
  }

  if (!pronto) return null;

  return (
    <EmendasContext.Provider value={{
      emendas, gastos, emendasComResumo, totais, servidorAtivo: usarAPI,
      adicionarEmenda, editarEmenda, excluirEmenda,
      adicionarGasto, editarGasto, excluirGasto,
      importarEmendas, importarGastos,
      resetar,
    }}>
      {children}
    </EmendasContext.Provider>
  );
}

export function useEmendas() {
  const context = useContext(EmendasContext);
  if (!context) throw new Error('useEmendas deve ser usado dentro de um EmendasProvider');
  return context;
}
