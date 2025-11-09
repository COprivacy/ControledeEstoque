
-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  numero_orcamento TEXT NOT NULL,
  data_emissao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_validade TIMESTAMP,
  cliente_id INTEGER,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'convertido')),
  itens JSONB NOT NULL,
  subtotal REAL NOT NULL,
  desconto REAL DEFAULT 0,
  total REAL NOT NULL,
  observacoes TEXT,
  criado_por TEXT,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_numero_orcamento_per_user UNIQUE (user_id, numero_orcamento)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_emissao ON orcamentos(data_emissao);

-- Adicionar permissão de orçamentos
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissoes JSONB;
