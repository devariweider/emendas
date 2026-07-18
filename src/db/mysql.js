import mysql from 'mysql2/promise';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'emendas';

let pool;

export async function getPool() {
  if (!pool) {
    const tmp = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS });
    await tmp.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await tmp.end();
    pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASS, database: DB_NAME, waitForConnections: true, connectionLimit: 10 });
  }
  return pool;
}

export async function inicializarDB() {
  const db = await getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS emendas (
      id BIGINT PRIMARY KEY,
      parlamentar VARCHAR(255) NOT NULL,
      numeroProposta VARCHAR(255) DEFAULT '',
      processoSEI VARCHAR(255) DEFAULT '',
      portaria VARCHAR(255) DEFAULT '',
      valorTotal DECIMAL(15,2) DEFAULT 0,
      dataCriacao VARCHAR(20) DEFAULT '',
      INDEX idx_parlamentar (parlamentar)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS gastos (
      id BIGINT PRIMARY KEY,
      emendaId BIGINT NOT NULL,
      nomePrestador VARCHAR(255) DEFAULT '',
      elementoDespesa VARCHAR(255) DEFAULT '',
      numeroEmpenho VARCHAR(255) DEFAULT '',
      numeroNotaFiscal VARCHAR(255) DEFAULT '',
      data VARCHAR(20) DEFAULT '',
      projetoAtividade TEXT,
      fonteRecurso VARCHAR(255) DEFAULT '',
      numeroMemorando VARCHAR(255) DEFAULT '',
      justificativa TEXT,
      valorPago DECIMAL(15,2) DEFAULT 0,
      numeroConta VARCHAR(255) DEFAULT '',
      INDEX idx_emenda (emendaId),
      FOREIGN KEY (emendaId) REFERENCES emendas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGINT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      nome VARCHAR(255) DEFAULT '',
      cargo VARCHAR(255) DEFAULT ''
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS config (
      id INT PRIMARY KEY DEFAULT 1,
      dados JSON,
      CHECK (id = 1)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS elementos_despesa (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL UNIQUE,
      padrao TINYINT(1) DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario VARCHAR(255) DEFAULT '',
      acao VARCHAR(50) NOT NULL,
      tabela VARCHAR(100) NOT NULL,
      registro_id BIGINT DEFAULT 0,
      detalhes TEXT,
      INDEX idx_data (data_hora),
      INDEX idx_tabela (tabela),
      INDEX idx_usuario (usuario)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [elRows] = await db.query('SELECT COUNT(*) AS total FROM elementos_despesa');
  if (elRows[0].total === 0) {
    const defaults = [
      '31.90.11.00 - VENC E VANTAGENS FIXAS - PESSOAL CIVIL',
      '31.90.13.00 - OBRIGAÇÕES PATRONAIS',
      '33.90.30.00 - MATERIAL DE CONSUMO',
      '33.90.32.00 - MATERIAL BEM OU SERVIÇOS PARA DISTRIBUIÇÃO GRATUITA',
      '33.90.36.00 - OUTROS SERVIÇOS PESSOA FÍSICA',
      '33.90.39.00 - OUTROS SERVIÇOS DE TERCEIROS - PESSOA JURÍDICA',
      '33.90.48.00 - OUTROS AUXILIOS FINANCEIROS A PESSOA JURÍDICA',
      '44.90.52.00 - EQUIPAMENTO E MATERIAL PERMANENTE',
    ];
    for (const nome of defaults) {
      await db.query('INSERT INTO elementos_despesa (nome, padrao) VALUES (?, 1)', [nome]);
    }
    console.log('  Elementos de despesa padrão criados.');
  }

  const [rows] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
  if (rows[0].total === 0) {
    const defaults = [
      [1, 'admin', 'admin123', 'Administrador', 'Administrador'],
      [2, 'financeiro', 'fin2024', 'Coordenador Financeiro', 'Coordenador'],
      [3, 'viewer', 'vis123', 'Visualizador', 'Visualizador'],
    ];
    await db.query(
      'INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?, ?, ?, ?, ?)',
      defaults[0]
    );
    await db.query(
      'INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?, ?, ?, ?, ?)',
      defaults[1]
    );
    await db.query(
      'INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES (?, ?, ?, ?, ?)',
      defaults[2]
    );
    console.log('  Usuários padrão criados.');
  }

  console.log('  Banco de dados inicializado.');
}

export { mysql };
