import { supabase } from '../lib/supabase';

let servidorAtivo = null;

export async function verificarServidor() {
  if (servidorAtivo !== null) return servidorAtivo;
  try {
    const { error } = await supabase.from('emendas').select('id').limit(1);
    servidorAtivo = !error;
  } catch {
    servidorAtivo = false;
  }
  return servidorAtivo;
}

export function getServidorAtivo() {
  return servidorAtivo;
}

async function registrarLog(usuario, acao, tabela, registroId, detalhes) {
  try {
    await supabase.from('audit_log').insert({
      usuario: usuario || 'sistema',
      acao,
      tabela,
      registroId: registroId || 0,
      detalhes: detalhes || '',
    });
  } catch (e) {
    console.error('Erro ao registrar log:', e.message);
  }
}

function extrairUsuario() {
  const u = JSON.parse(localStorage.getItem('emendas_usuario_logado') || 'null');
  return u?.username || u?.nome || 'sistema';
}

function extrairCargo() {
  const u = JSON.parse(localStorage.getItem('emendas_usuario_logado') || 'null');
  return u?.cargo || '';
}

export const api = {
  emendas: {
    listar: async () => {
      const { data, error } = await supabase.from('emendas').select('*').order('id');
      if (error) throw new Error(error.message);
      return data || [];
    },
    criar: async (dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const row = {
        id: dados.id || Date.now(),
        parlamentar: dados.parlamentar || '',
        numeroProposta: dados.numeroProposta || '',
        processoSEI: dados.processoSEI || '',
        portaria: dados.portaria || '',
        valorTotal: dados.valorTotal || 0,
        dataCriacao: dados.dataCriacao || '',
      };
      const { error } = await supabase.from('emendas').insert(row);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'CRIAR', 'emendas', row.id, `${row.parlamentar} — R$ ${row.valorTotal}`);
      return row;
    },
    editar: async (id, dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const update = {};
      for (const [k, v] of Object.entries(dados)) {
        if (k === 'id') continue;
        update[k] = v;
      }
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('emendas').update(update).eq('id', id);
        if (error) throw new Error(error.message);
        await registrarLog(extrairUsuario(), 'EDITAR', 'emendas', id, Object.keys(update).join(', '));
      }
    },
    excluir: async (id) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const { data: emenda } = await supabase.from('emendas').select('parlamentar').eq('id', id).single();
      await supabase.from('gastos').delete().eq('emendaId', id);
      const { error } = await supabase.from('emendas').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'EXCLUIR', 'emendas', id, emenda?.parlamentar || '');
    },
  },

  gastos: {
    listar: async () => {
      const { data, error } = await supabase.from('gastos').select('*').order('id');
      if (error) throw new Error(error.message);
      return data || [];
    },
    criar: async (dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const row = {
        id: dados.id || Date.now(),
        emendaId: dados.emendaId || 0,
        nomePrestador: dados.nomePrestador || '',
        elementoDespesa: dados.elementoDespesa || '',
        numeroEmpenho: dados.numeroEmpenho || '',
        numeroNotaFiscal: dados.numeroNotaFiscal || '',
        data: dados.data || '',
        projetoAtividade: dados.projetoAtividade || '',
        fonteRecurso: dados.fonteRecurso || '',
        numeroMemorando: dados.numeroMemorando || '',
        justificativa: dados.justificativa || '',
        valorPago: dados.valorPago || 0,
        numeroConta: dados.numeroConta || '',
      };
      const { error } = await supabase.from('gastos').insert(row);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'CRIAR', 'gastos', row.id, `${row.nomePrestador} — ${row.elementoDespesa} — R$ ${row.valorPago}`);
      return row;
    },
    editar: async (id, dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const update = {};
      for (const [k, v] of Object.entries(dados)) {
        if (k === 'id') continue;
        update[k] = v;
      }
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('gastos').update(update).eq('id', id);
        if (error) throw new Error(error.message);
        await registrarLog(extrairUsuario(), 'EDITAR', 'gastos', id, Object.keys(update).join(', '));
      }
    },
    excluir: async (id) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const { data: gasto } = await supabase.from('gastos').select('nomePrestador, elementoDespesa').eq('id', id).single();
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'EXCLUIR', 'gastos', id, gasto ? `${gasto.nomePrestador} — ${gasto.elementoDespesa}` : '');
    },
  },

  usuarios: {
    listar: async () => {
      const { data, error } = await supabase.from('usuarios').select('id, username, nome, cargo').order('id');
      if (error) throw new Error(error.message);
      return data || [];
    },
    criar: async (dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const row = {
        id: dados.id || Date.now(),
        username: dados.username || '',
        senha: dados.senha || '',
        nome: dados.nome || '',
        cargo: dados.cargo || '',
      };
      const { error } = await supabase.from('usuarios').insert(row);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'CRIAR', 'usuarios', row.id, `${row.username} — ${row.nome}`);
      return { id: row.id, username: row.username, nome: row.nome, cargo: row.cargo };
    },
    editar: async (id, dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const update = {};
      for (const [k, v] of Object.entries(dados)) {
        if (k === 'id') continue;
        update[k] = v;
      }
      if (Object.keys(update).length > 0) {
        const { error } = await supabase.from('usuarios').update(update).eq('id', id);
        if (error) throw new Error(error.message);
        await registrarLog(extrairUsuario(), 'EDITAR', 'usuarios', id, Object.keys(update).join(', '));
      }
    },
    excluir: async (id) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const { data: user } = await supabase.from('usuarios').select('username').eq('id', id).single();
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'EXCLUIR', 'usuarios', id, user?.username || '');
    },
  },

  login: async (username, senha) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, nome, cargo')
      .eq('username', username)
      .eq('senha', senha)
      .single();
    if (error || !data) {
      await registrarLog(username || '?', 'TENTATIVA_LOGIN', 'usuarios', 0, 'Falha');
      throw new Error('Usuário ou senha inválidos');
    }
    await registrarLog(username, 'LOGIN', 'usuarios', data.id, data.nome);
    return data;
  },

  config: {
    obter: async () => {
      const { data, error } = await supabase.from('config').select('dados').eq('id', 1).single();
      if (error || !data?.dados) return {};
      return typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    },
    salvar: async (dados) => {
      const { error } = await supabase
        .from('config')
        .upsert({ id: 1, dados }, { onConflict: 'id' });
      if (error) throw new Error(error.message);
    },
  },

  elementos: {
    listar: async () => {
      const { data, error } = await supabase.from('elementos_despesa').select('*').order('padrao', { ascending: false }).order('nome');
      if (error) throw new Error(error.message);
      return (data || []).map((r) => ({ id: r.id, nome: r.nome, padrao: r.padrao ? 1 : 0 }));
    },
    criar: async (nome) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const { data, error } = await supabase.from('elementos_despesa').insert({ nome, padrao: false }).select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Elemento já existe');
        throw new Error(error.message);
      }
      await registrarLog(extrairUsuario(), 'CRIAR', 'elementos_despesa', data.id, nome);
      return { id: data.id, nome: data.nome, padrao: 0 };
    },
    excluir: async (id) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      const { data: el } = await supabase.from('elementos_despesa').select('padrao, nome').eq('id', id).single();
      if (el?.padrao) throw new Error('Não é possível remover elementos padrão');
      const { error } = await supabase.from('elementos_despesa').delete().eq('id', id);
      if (error) throw new Error(error.message);
      await registrarLog(extrairUsuario(), 'EXCLUIR', 'elementos_despesa', id, el?.nome || '');
    },
  },

  backup: {
    exportar: async () => {
      const [emendas, gastos, usuarios, elementos, config] = await Promise.all([
        supabase.from('emendas').select('*'),
        supabase.from('gastos').select('*'),
        supabase.from('usuarios').select('*'),
        supabase.from('elementos_despesa').select('*'),
        supabase.from('config').select('dados').eq('id', 1).single(),
      ]);
      return {
        _versao: '3.0',
        _data: new Date().toISOString(),
        _tipo: 'supabase',
        emendas: emendas.data || [],
        gastos: gastos.data || [],
        usuarios: usuarios.data || [],
        elementosDespesa: (elementos.data || []).map((r) => ({ id: r.id, nome: r.nome, padrao: r.padrao ? 1 : 0 })),
        configInstituicao: config.data?.dados || {},
      };
    },
    importar: async (dados) => {
      if (extrairCargo() === 'Visualizador') throw new Error('Acesso negado');
      if (!dados.emendas || !dados.gastos) throw new Error('Dados inválidos');

      await supabase.from('gastos').delete().neq('id', 0);
      await supabase.from('emendas').delete().neq('id', 0);
      await supabase.from('usuarios').delete().neq('id', 0);
      await supabase.from('elementos_despesa').delete().neq('id', 0);
      await supabase.from('config').delete().eq('id', 1);

      if (dados.emendas.length > 0) {
        const rows = dados.emendas.map((e) => ({
          id: e.id, parlamentar: e.parlamentar || '',
          numeroProposta: e.numeroProposta || '', processoSEI: e.processoSEI || '',
          portaria: e.portaria || '', valorTotal: e.valorTotal || 0, dataCriacao: e.dataCriacao || '',
        }));
        await supabase.from('emendas').insert(rows);
      }
      if (dados.gastos.length > 0) {
        const rows = dados.gastos.map((g) => ({
          id: g.id, emendaId: g.emendaId || 0,
          nomePrestador: g.nomePrestador || '', elementoDespesa: g.elementoDespesa || '',
          numeroEmpenho: g.numeroEmpenho || '', numeroNotaFiscal: g.numeroNotaFiscal || '',
          data: g.data || '', projetoAtividade: g.projetoAtividade || '',
          fonteRecurso: g.fonteRecurso || '', numeroMemorando: g.numeroMemorando || '',
          justificativa: g.justificativa || '', valorPago: g.valorPago || 0,
          numeroConta: g.numeroConta || '',
        }));
        await supabase.from('gastos').insert(rows);
      }
      if (dados.usuarios?.length > 0) {
        await supabase.from('usuarios').insert(dados.usuarios.map((u) => ({
          id: u.id, username: u.username || '', senha: u.senha || '', nome: u.nome || '', cargo: u.cargo || '',
        })));
      }
      if (dados.elementosDespesa?.length > 0) {
        await supabase.from('elementos_despesa').insert(
          dados.elementosDespesa.map((el) => ({ nome: el.nome || '', padrao: !!el.padrao }))
        );
      }
      if (dados.configInstituicao && Object.keys(dados.configInstituicao).length > 0) {
        await supabase.from('config').insert({ id: 1, dados: dados.configInstituicao });
      }
      await registrarLog(extrairUsuario(), 'RESTAURAR', 'backup', 0, `importação — ${dados.emendas.length} emendas, ${dados.gastos.length} gastos`);
    },
  },

  historico: {
    listar: async (params = {}) => {
      const limit = Math.min(Number(params.limit) || 200, 1000);
      const offset = Number(params.offset) || 0;

      let query = supabase.from('audit_log').select('*', { count: 'exact' });
      if (params.tabela) query = query.eq('tabela', params.tabela);
      if (params.acao) query = query.eq('acao', params.acao);

      query = query.order('id', { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw new Error(error.message);
      return { dados: data || [], total: count || 0 };
    },
  },
};
