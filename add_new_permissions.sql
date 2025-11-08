-- Adicionar novas colunas de permissões
ALTER TABLE permissoes_funcionarios 
ADD COLUMN IF NOT EXISTS devolucoes text NOT NULL DEFAULT 'false',
ADD COLUMN IF NOT EXISTS contas_pagar text NOT NULL DEFAULT 'false',
ADD COLUMN IF NOT EXISTS contas_receber text NOT NULL DEFAULT 'false';
