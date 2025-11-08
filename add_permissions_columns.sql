-- Adicionar novas colunas de permissões
ALTER TABLE permissoes_funcionarios 
ADD COLUMN IF NOT EXISTS devolucoes TEXT NOT NULL DEFAULT 'false',
ADD COLUMN IF NOT EXISTS contas_pagar TEXT NOT NULL DEFAULT 'false',
ADD COLUMN IF NOT EXISTS contas_receber TEXT NOT NULL DEFAULT 'false';
