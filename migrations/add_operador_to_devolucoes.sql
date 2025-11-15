
-- Adicionar colunas de operador na tabela devolucoes
ALTER TABLE devolucoes 
ADD COLUMN IF NOT EXISTS operador_nome TEXT,
ADD COLUMN IF NOT EXISTS operador_id TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_devolucoes_operador_id ON devolucoes(operador_id);

-- Comentários para documentação
COMMENT ON COLUMN devolucoes.operador_nome IS 'Nome do usuário ou funcionário que registrou a devolução';
COMMENT ON COLUMN devolucoes.operador_id IS 'ID do usuário ou funcionário que registrou a devolução';
