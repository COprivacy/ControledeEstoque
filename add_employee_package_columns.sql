
-- Adicionar colunas para controle de pacotes de funcionários
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_funcionarios_base INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS data_expiracao_pacote_funcionarios TIMESTAMP;

-- Atualizar registros existentes para ter o limite base igual ao limite atual
UPDATE users 
SET max_funcionarios_base = COALESCE(max_funcionarios, 1)
WHERE max_funcionarios_base IS NULL;
