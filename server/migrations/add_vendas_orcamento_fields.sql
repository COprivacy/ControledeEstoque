
-- Adicionar campos para rastrear origem de orçamento e vendedor
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS orcamento_id INTEGER;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS vendedor TEXT;

-- Criar índice para melhor performance nas buscas
CREATE INDEX IF NOT EXISTS idx_vendas_orcamento_id ON vendas(orcamento_id);
