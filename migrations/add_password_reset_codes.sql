
-- Tabela para armazenar códigos de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Índice para buscar códigos por email
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_codes(email);

-- Índice para buscar códigos não utilizados
CREATE INDEX IF NOT EXISTS idx_password_reset_used ON password_reset_codes(used);
