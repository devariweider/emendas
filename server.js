import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';
import fs from 'fs';
import { inicializarDB, getPool } from './src/db/mysql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const DIST_DIR = join(__dirname, 'dist');
const BACKUPS_DIR = join(__dirname, 'backups');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(DIST_DIR));

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

let db;

async function registrarLog(usuario, acao, tabela, registroId, detalhes) {
  try {
    await db.query(
      'INSERT INTO audit_log (usuario, acao, tabela, registro_id, detalhes) VALUES (?,?,?,?,?)',
      [usuario || 'sistema', acao, tabela, registroId || 0, detalhes || '']
    );
  } catch (e) {
    console.error('Erro ao registrar log:', e.message);
  }
}

function extrairUsuario(req) {
  const u = req.headers['x-usuario'];
  return u || 'sistema';
}

async function verificarPermissao(req, res) {
  const username = req.headers['x-usuario'];
  if (!username || username === 'sistema') return true;
  try {
    const [rows] = await db.query('SELECT cargo FROM usuarios WHERE username = ?', [username]);
    if (rows.length > 0 && rows[0].cargo === 'Visualizador') {
      res.status(403).json({ erro: 'Acesso negado: visualizadores não podem alterar dados.' });
      return false;
    }
  } catch (e) {
    console.error('Erro ao verificar permissão:', e.message);
  }
  return true;
}

// --- Emendas ---
app.get('/api/emendas', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM emendas ORDER BY id');
  res.json(rows);
}));

app.post('/api/emendas', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Date.now();
  const d = req.body;
  await db.query(
    'INSERT INTO emendas (id, parlamentar, numeroProposta, processoSEI, portaria, valorTotal, dataCriacao) VALUES (?,?,?,?,?,?,?)',
    [id, d.parlamentar || '', d.numeroProposta || '', d.processoSEI || '', d.portaria || '', d.valorTotal || 0, d.dataCriacao || '']
  );
  await registrarLog(extrairUsuario(req), 'CRIAR', 'emendas', id, `${d.parlamentar || ''} — R$ ${d.valorTotal || 0}`);
  const [rows] = await db.query('SELECT * FROM emendas WHERE id=?', [id]);
  res.json(rows[0]);
}));

app.put('/api/emendas/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const d = req.body;
  const campos = [];
  const vals = [];
  for (const [k, v] of Object.entries(d)) {
    if (k === 'id') continue;
    campos.push(`${k} = ?`);
    vals.push(v);
  }
  if (campos.length > 0) {
    vals.push(id);
    await db.query(`UPDATE emendas SET ${campos.join(', ')} WHERE id = ?`, vals);
    await registrarLog(extrairUsuario(req), 'EDITAR', 'emendas', id, campos.map((c) => c.replace(' = ?', '')).join(', '));
  }
  res.json({ ok: true });
}));

app.delete('/api/emendas/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT parlamentar FROM emendas WHERE id=?', [id]);
  await db.query('DELETE FROM gastos WHERE emendaId = ?', [id]);
  await db.query('DELETE FROM emendas WHERE id = ?', [id]);
  await registrarLog(extrairUsuario(req), 'EXCLUIR', 'emendas', id, rows[0]?.parlamentar || '');
  res.json({ ok: true });
}));

// --- Gastos ---
app.get('/api/gastos', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM gastos ORDER BY id');
  res.json(rows);
}));

app.post('/api/gastos', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Date.now();
  const d = req.body;
  const [existente] = await db.query(
    `SELECT id FROM gastos WHERE emendaId=? AND nomePrestador=? AND elementoDespesa=? AND numeroEmpenho=? AND numeroNotaFiscal=? AND data=? AND projetoAtividade=? AND valorPago=?`,
    [d.emendaId || 0, d.nomePrestador || '', d.elementoDespesa || '', d.numeroEmpenho || '', d.numeroNotaFiscal || '', d.data || '', d.projetoAtividade || '', d.valorPago || 0]
  );
  if (existente.length > 0) {
    return res.status(409).json({ erro: 'Gasto duplicado: já existe um registro com os mesmos dados nesta emenda.' });
  }
  await db.query(
    `INSERT INTO gastos (id, emendaId, nomePrestador, elementoDespesa, numeroEmpenho, numeroNotaFiscal, data, projetoAtividade, fonteRecurso, numeroMemorando, justificativa, valorPago, numeroConta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, d.emendaId || 0, d.nomePrestador || '', d.elementoDespesa || '', d.numeroEmpenho || '', d.numeroNotaFiscal || '', d.data || '', d.projetoAtividade || '', d.fonteRecurso || '', d.numeroMemorando || '', d.justificativa || '', d.valorPago || 0, d.numeroConta || '']
  );
  await registrarLog(extrairUsuario(req), 'CRIAR', 'gastos', id, `${d.nomePrestador || ''} — ${d.elementoDespesa || ''} — R$ ${d.valorPago || 0}`);
  const [rows] = await db.query('SELECT * FROM gastos WHERE id=?', [id]);
  res.json(rows[0]);
}));

app.put('/api/gastos/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const d = req.body;
  const campos = [];
  const vals = [];
  for (const [k, v] of Object.entries(d)) {
    if (k === 'id') continue;
    campos.push(`${k} = ?`);
    vals.push(v);
  }
  if (campos.length > 0) {
    const [atual] = await db.query('SELECT * FROM gastos WHERE id=?', [id]);
    if (atual.length > 0) {
      const merged = { ...atual[0], ...d };
      const [existente] = await db.query(
        `SELECT id FROM gastos WHERE emendaId=? AND nomePrestador=? AND elementoDespesa=? AND numeroEmpenho=? AND numeroNotaFiscal=? AND data=? AND projetoAtividade=? AND valorPago=? AND id<>?`,
        [merged.emendaId || 0, merged.nomePrestador || '', merged.elementoDespesa || '', merged.numeroEmpenho || '', merged.numeroNotaFiscal || '', merged.data || '', merged.projetoAtividade || '', merged.valorPago || 0, id]
      );
      if (existente.length > 0) {
        return res.status(409).json({ erro: 'Gasto duplicado: já existe um registro com os mesmos dados nesta emenda.' });
      }
    }
    vals.push(id);
    await db.query(`UPDATE gastos SET ${campos.join(', ')} WHERE id = ?`, vals);
    await registrarLog(extrairUsuario(req), 'EDITAR', 'gastos', id, campos.map((c) => c.replace(' = ?', '')).join(', '));
  }
  res.json({ ok: true });
}));

app.delete('/api/gastos/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT nomePrestador, elementoDespesa FROM gastos WHERE id=?', [id]);
  await db.query('DELETE FROM gastos WHERE id = ?', [id]);
  await registrarLog(extrairUsuario(req), 'EXCLUIR', 'gastos', id, rows[0] ? `${rows[0].nomePrestador} — ${rows[0].elementoDespesa}` : '');
  res.json({ ok: true });
}));

// --- Usuários ---
app.get('/api/usuarios', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT id, username, nome, cargo FROM usuarios ORDER BY id');
  res.json(rows);
}));

app.post('/api/usuarios', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Date.now();
  const d = req.body;
  await db.query('INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?,?,?,?,?)',
    [id, d.username || '', d.senha || '', d.nome || '', d.cargo || '']
  );
  await registrarLog(extrairUsuario(req), 'CRIAR', 'usuarios', id, `${d.username || ''} — ${d.nome || ''}`);
  res.json({ id, username: d.username, nome: d.nome, cargo: d.cargo });
}));

app.put('/api/usuarios/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const d = req.body;
  const campos = [];
  const vals = [];
  for (const [k, v] of Object.entries(d)) {
    if (k === 'id') continue;
    campos.push(`${k} = ?`);
    vals.push(v);
  }
  if (campos.length > 0) {
    vals.push(id);
    await db.query(`UPDATE usuarios SET ${campos.join(', ')} WHERE id = ?`, vals);
    await registrarLog(extrairUsuario(req), 'EDITAR', 'usuarios', id, campos.map((c) => c.replace(' = ?', '')).join(', '));
  }
  res.json({ ok: true });
}));

app.delete('/api/usuarios/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT username FROM usuarios WHERE id=?', [id]);
  await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
  await registrarLog(extrairUsuario(req), 'EXCLUIR', 'usuarios', id, rows[0]?.username || '');
  res.json({ ok: true });
}));

// --- Config ---
app.get('/api/config', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT dados FROM config WHERE id = 1');
  if (rows.length > 0 && rows[0].dados) {
    const dados = typeof rows[0].dados === 'string' ? JSON.parse(rows[0].dados) : rows[0].dados;
    res.json(dados);
  } else {
    res.json({});
  }
}));

app.put('/api/config', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  await db.query('INSERT INTO config (id, dados) VALUES (1, ?) ON DUPLICATE KEY UPDATE dados = ?',
    [JSON.stringify(req.body), JSON.stringify(req.body)]
  );
  res.json({ ok: true });
}));

// --- Elementos de Despesa ---
app.get('/api/elementos', asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM elementos_despesa ORDER BY padrao DESC, nome');
  res.json(rows);
}));

app.post('/api/elementos', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ erro: 'Nome obrigatório' });
  try {
    const [result] = await db.query('INSERT INTO elementos_despesa (nome, padrao) VALUES (?, 0)', [nome.trim()]);
    await registrarLog(extrairUsuario(req), 'CRIAR', 'elementos_despesa', result.insertId, nome.trim());
    res.json({ id: result.insertId, nome: nome.trim(), padrao: 0 });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Elemento já existe' });
    throw e;
  }
}));

app.delete('/api/elementos/:id', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const id = Number(req.params.id);
  const [rows] = await db.query('SELECT padrao, nome FROM elementos_despesa WHERE id = ?', [id]);
  if (rows.length > 0 && rows[0].padrao) return res.status(400).json({ erro: 'Não é possível remover elementos padrão' });
  await db.query('DELETE FROM elementos_despesa WHERE id = ?', [id]);
  await registrarLog(extrairUsuario(req), 'EXCLUIR', 'elementos_despesa', id, rows[0]?.nome || '');
  res.json({ ok: true });
}));

// --- Login ---
app.post('/api/login', asyncHandler(async (req, res) => {
  const { username, senha } = req.body;
  const [rows] = await db.query('SELECT id, username, nome, cargo FROM usuarios WHERE username = ? AND senha = ?', [username, senha]);
  if (rows.length > 0) {
    await registrarLog(username, 'LOGIN', 'usuarios', rows[0].id, rows[0].nome);
    res.json(rows[0]);
  } else {
    await registrarLog(username || '?', 'TENTATIVA_LOGIN', 'usuarios', 0, 'Falha');
    res.status(401).json({ erro: 'Usuário ou senha inválidos' });
  }
}));

// --- Histórico ---
app.get('/api/historico', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const offset = Number(req.query.offset) || 0;
  const tabela = req.query.tabela || '';
  const acao = req.query.acao || '';
  let sql = 'SELECT * FROM audit_log';
  const conditions = [];
  const params = [];
  if (tabela) { conditions.push('tabela = ?'); params.push(tabela); }
  if (acao) { conditions.push('acao = ?'); params.push(acao); }
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const [rows] = await db.query(sql, params);
  const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM audit_log' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''), params.slice(0, -2));
  res.json({ dados: rows, total });
}));

// --- Backup ---
function sanitizarNomeArquivo(nome) {
  return nome.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 100);
}

async function montarDadosBackup() {
  const [emendas] = await db.query('SELECT * FROM emendas');
  const [gastos] = await db.query('SELECT * FROM gastos');
  const [usuarios] = await db.query('SELECT * FROM usuarios');
  const [elementos] = await db.query('SELECT * FROM elementos_despesa');
  const [configRows] = await db.query('SELECT dados FROM config WHERE id = 1');
  const config = configRows.length > 0 ? (typeof configRows[0].dados === 'string' ? JSON.parse(configRows[0].dados) : configRows[0].dados) : {};
  return {
    _versao: '2.0',
    _data: new Date().toISOString(),
    emendas,
    gastos,
    usuarios,
    elementosDespesa: elementos,
    configInstituicao: config,
  };
}

// Listar backups salvos no servidor
app.get('/api/backup/listar', asyncHandler(async (req, res) => {
  if (!fs.existsSync(BACKUPS_DIR)) return res.json([]);
  const arquivos = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
  const lista = arquivos.map((f) => {
    const stat = fs.statSync(join(BACKUPS_DIR, f));
    let meta = {};
    try {
      const conteudo = fs.readFileSync(join(BACKUPS_DIR, f), 'utf8');
      const dados = JSON.parse(conteudo);
      meta = {
        qtdEmendas: dados.emendas?.length || 0,
        qtdGastos: dados.gastos?.length || 0,
        qtdUsuarios: dados.usuarios?.length || 0,
        data: dados._data || null,
      };
    } catch {}
    return { arquivo: f, tamanho: stat.size, criado: stat.birthtime, modificado: stat.mtime, ...meta };
  });
  lista.sort((a, b) => new Date(b.modificado) - new Date(a.modificado));
  res.json(lista);
}));

// Criar backup e salvar no servidor
app.post('/api/backup/salvar', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const dados = await montarDadosBackup();
  const nome = `backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  const caminho = join(BACKUPS_DIR, sanitizarNomeArquivo(nome));
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf8');
  await registrarLog(extrairUsuario(req), 'CRIAR', 'backup', 0, nome);
  res.json({ ok: true, arquivo: nome, emendas: dados.emendas.length, gastos: dados.gastos.length });
}));

// Download de backup
app.get('/api/backup/download/:arquivo', asyncHandler(async (req, res) => {
  const arquivo = sanitizarNomeArquivo(req.params.arquivo);
  const caminho = join(BACKUPS_DIR, arquivo);
  if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Backup não encontrado' });
  res.setHeader('Content-Disposition', `attachment; filename="${arquivo}"`);
  res.setHeader('Content-Type', 'application/json');
  fs.createReadStream(caminho).pipe(res);
}));

// Restaurar backup do servidor
app.post('/api/backup/restaurar/:arquivo', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const arquivo = sanitizarNomeArquivo(req.params.arquivo);
  const caminho = join(BACKUPS_DIR, arquivo);
  if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Backup não encontrado' });
  const conteudo = fs.readFileSync(caminho, 'utf8');
  const dados = JSON.parse(conteudo);
  if (!dados.emendas || !dados.gastos) return res.status(400).json({ erro: 'Backup inválido: dados incompletos' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM gastos');
    await conn.query('DELETE FROM emendas');
    await conn.query('DELETE FROM usuarios');
    await conn.query('DELETE FROM config');
    await conn.query('DELETE FROM elementos_despesa');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    for (const e of dados.emendas) {
      await conn.query('INSERT INTO emendas (id, parlamentar, numeroProposta, processoSEI, portaria, valorTotal, dataCriacao) VALUES (?,?,?,?,?,?,?)',
        [e.id, e.parlamentar || '', e.numeroProposta || '', e.processoSEI || '', e.portaria || '', e.valorTotal || 0, e.dataCriacao || '']
      );
    }
    for (const g of dados.gastos) {
      await conn.query(
        `INSERT INTO gastos (id, emendaId, nomePrestador, elementoDespesa, numeroEmpenho, numeroNotaFiscal, data, projetoAtividade, fonteRecurso, numeroMemorando, justificativa, valorPago, numeroConta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [g.id, g.emendaId || 0, g.nomePrestador || '', g.elementoDespesa || '', g.numeroEmpenho || '', g.numeroNotaFiscal || '', g.data || '', g.projetoAtividade || '', g.fonteRecurso || '', g.numeroMemorando || '', g.justificativa || '', g.valorPago || 0, g.numeroConta || '']
      );
    }
    for (const u of (dados.usuarios || [])) {
      await conn.query('INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?,?,?,?,?)',
        [u.id, u.username || '', u.senha || '', u.nome || '', u.cargo || '']
      );
    }
    for (const el of (dados.elementosDespesa || [])) {
      await conn.query('INSERT INTO elementos_despesa (id, nome, padrao) VALUES (?,?,?)',
        [el.id, el.nome || '', el.padrao || 0]
      );
    }
    if (dados.configInstituicao && Object.keys(dados.configInstituicao).length > 0) {
      await conn.query('INSERT INTO config (id, dados) VALUES (1, ?)', [JSON.stringify(dados.configInstituicao)]);
    }
    await conn.commit();
    await registrarLog(extrairUsuario(req), 'RESTAURAR', 'backup', 0, `${arquivo} — ${dados.emendas.length} emendas, ${dados.gastos.length} gastos`);
    res.json({ ok: true, emendas: dados.emendas.length, gastos: dados.gastos.length });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Deletar backup
app.delete('/api/backup/deletar/:arquivo', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const arquivo = sanitizarNomeArquivo(req.params.arquivo);
  const caminho = join(BACKUPS_DIR, arquivo);
  if (!fs.existsSync(caminho)) return res.status(404).json({ erro: 'Backup não encontrado' });
  fs.unlinkSync(caminho);
  await registrarLog(extrairUsuario(req), 'EXCLUIR', 'backup', 0, arquivo);
  res.json({ ok: true });
}));

// Backup para download (legado)
app.get('/api/backup', asyncHandler(async (req, res) => {
  const dados = await montarDadosBackup();
  res.setHeader('Content-Disposition', `attachment; filename=backup_emendas_${new Date().toISOString().slice(0, 10)}.json`);
  res.json(dados);
}));

// Restaurar de upload (legado)
app.post('/api/restore', asyncHandler(async (req, res) => {
  if (!(await verificarPermissao(req, res))) return;
  const dados = req.body;
  if (!dados.emendas || !dados.gastos) return res.status(400).json({ erro: 'Dados inválidos' });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM gastos');
    await conn.query('DELETE FROM emendas');
    await conn.query('DELETE FROM usuarios');
    await conn.query('DELETE FROM config');
    await conn.query('DELETE FROM elementos_despesa');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    for (const e of dados.emendas) {
      await conn.query('INSERT INTO emendas (id, parlamentar, numeroProposta, processoSEI, portaria, valorTotal, dataCriacao) VALUES (?,?,?,?,?,?,?)',
        [e.id, e.parlamentar || '', e.numeroProposta || '', e.processoSEI || '', e.portaria || '', e.valorTotal || 0, e.dataCriacao || '']
      );
    }
    for (const g of dados.gastos) {
      await conn.query(
        `INSERT INTO gastos (id, emendaId, nomePrestador, elementoDespesa, numeroEmpenho, numeroNotaFiscal, data, projetoAtividade, fonteRecurso, numeroMemorando, justificativa, valorPago, numeroConta) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [g.id, g.emendaId || 0, g.nomePrestador || '', g.elementoDespesa || '', g.numeroEmpenho || '', g.numeroNotaFiscal || '', g.data || '', g.projetoAtividade || '', g.fonteRecurso || '', g.numeroMemorando || '', g.justificativa || '', g.valorPago || 0, g.numeroConta || '']
      );
    }
    for (const u of (dados.usuarios || [])) {
      await conn.query('INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?,?,?,?,?)',
        [u.id, u.username || '', u.senha || '', u.nome || '', u.cargo || '']
      );
    }
    for (const el of (dados.elementosDespesa || [])) {
      await conn.query('INSERT INTO elementos_despesa (id, nome, padrao) VALUES (?,?,?)',
        [el.id, el.nome || '', el.padrao || 0]
      );
    }
    if (dados.configInstituicao && Object.keys(dados.configInstituicao).length > 0) {
      await conn.query('INSERT INTO config (id, dados) VALUES (1, ?)', [JSON.stringify(dados.configInstituicao)]);
    }
    await conn.commit();
    await registrarLog(extrairUsuario(req), 'RESTAURAR', 'backup', 0, `upload — ${dados.emendas.length} emendas, ${dados.gastos.length} gastos`);
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// SPA fallback — only GET requests that don't start with /api
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(join(DIST_DIR, 'index.html'));
  } else {
    next();
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  res.status(500).json({ erro: err.message });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled:', err?.message || err);
});

async function iniciar() {
  console.log('\n  Iniciando servidor...');
  if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  await inicializarDB();
  db = await getPool();
  app.listen(PORT, '0.0.0.0', () => {
    const nets = Object.values(networkInterfaces()).flat().filter((n) => n.family === 'IPv4' && !n.internal);
    const ip = nets.length > 0 ? nets[0].address : 'localhost';
    console.log(`\n  Servidor rodando em:`);
    console.log(`    Local:   http://localhost:${PORT}`);
    console.log(`    Rede:    http://${ip}:${PORT}\n`);
    console.log(`  Acesse de qualquer computador na rede usando o IP acima.\n`);
  });
}

iniciar().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
