-- =====================================================
-- Migração MySQL -> Supabase (PostgreSQL)
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- Tabela: emendas
CREATE TABLE IF NOT EXISTS emendas (
  id BIGINT PRIMARY KEY,
  parlamentar TEXT NOT NULL DEFAULT '',
  "numeroProposta" TEXT DEFAULT '',
  "processoSEI" TEXT DEFAULT '',
  portaria TEXT DEFAULT '',
  "valorTotal" NUMERIC(15,2) DEFAULT 0,
  "dataCriacao" TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_emendas_parlamentar ON emendas (parlamentar);

-- Tabela: gastos
CREATE TABLE IF NOT EXISTS gastos (
  id BIGINT PRIMARY KEY,
  "emendaId" BIGINT NOT NULL REFERENCES emendas(id) ON DELETE CASCADE,
  "nomePrestador" TEXT DEFAULT '',
  "elementoDespesa" TEXT DEFAULT '',
  "numeroEmpenho" TEXT DEFAULT '',
  "numeroNotaFiscal" TEXT DEFAULT '',
  data TEXT DEFAULT '',
  "projetoAtividade" TEXT DEFAULT '',
  "fonteRecurso" TEXT DEFAULT '',
  "numeroMemorando" TEXT DEFAULT '',
  justificativa TEXT DEFAULT '',
  "valorPago" NUMERIC(15,2) DEFAULT 0,
  "numeroConta" TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_gastos_emenda ON gastos ("emendaId");

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  nome TEXT DEFAULT '',
  cargo TEXT DEFAULT ''
);

-- Tabela: config
CREATE TABLE IF NOT EXISTS config (
  id INT PRIMARY KEY DEFAULT 1,
  dados JSONB,
  CHECK (id = 1)
);

-- Tabela: elementos_despesa
CREATE TABLE IF NOT EXISTS elementos_despesa (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  padrao BOOLEAN DEFAULT FALSE
);

-- Tabela: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_hora TIMESTAMPTZ DEFAULT NOW(),
  usuario TEXT DEFAULT '',
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  "registroId" BIGINT DEFAULT 0,
  detalhes TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_audit_data ON audit_log (data_hora);
CREATE INDEX IF NOT EXISTS idx_audit_tabela ON audit_log (tabela);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log (usuario);

-- Dados iniciais: elementos de despesa padrão
INSERT INTO elementos_despesa (nome, padrao) VALUES
  ('31.90.11.00 - VENC E VANTAGENS FIXAS - PESSOAL CIVIL', TRUE),
  ('31.90.13.00 - OBRIGAÇÕES PATRONAIS', TRUE),
  ('33.90.30.00 - MATERIAL DE CONSUMO', TRUE),
  ('33.90.32.00 - MATERIAL BEM OU SERVIÇOS PARA DISTRIBUIÇÃO GRATUITA', TRUE),
  ('33.90.36.00 - OUTROS SERVIÇOS PESSOA FÍSICA', TRUE),
  ('33.90.39.00 - OUTROS SERVIÇOS DE TERCEIROS - PESSOA JURÍDICA', TRUE),
  ('33.90.48.00 - OUTROS AUXILIOS FINANCEIROS A PESSOA JURÍDICA', TRUE),
  ('44.90.52.00 - EQUIPAMENTO E MATERIAL PERMANENTE', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- Dados iniciais: usuários padrão
INSERT INTO usuarios (id, username, senha, nome, cargo) VALUES
  (1, 'admin', 'admin123', 'Administrador', 'Administrador'),
  (2, 'financeiro', 'fin2024', 'Coordenador Financeiro', 'Coordenador'),
  (3, 'viewer', 'vis123', 'Visualizador', 'Visualizador')
ON CONFLICT (username) DO NOTHING;
