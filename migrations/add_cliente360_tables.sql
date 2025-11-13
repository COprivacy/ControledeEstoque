
-- Migration: Adicionar tabelas do sistema Cliente 360°
-- Data: 2025-11-13

-- Tabela de Notas sobre Clientes
CREATE TABLE IF NOT EXISTS client_notes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS client_notes_user_id_created_at_idx ON client_notes(user_id, created_at DESC);

-- Tabela de Documentos/Anexos do Cliente
CREATE TABLE IF NOT EXISTS client_documents (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS client_documents_user_id_uploaded_at_idx ON client_documents(user_id, uploaded_at DESC);

-- Tabela de Timeline de Interações com Cliente
CREATE TABLE IF NOT EXISTS client_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS client_interactions_user_id_created_at_idx ON client_interactions(user_id, created_at DESC);

-- Tabela de Histórico de Mudanças de Plano
CREATE TABLE IF NOT EXISTS plan_changes_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_plan TEXT,
  to_plan TEXT NOT NULL,
  changed_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS plan_changes_history_user_id_changed_at_idx ON plan_changes_history(user_id, changed_at DESC);

-- Tabela de Comunicações Enviadas ao Cliente
CREATE TABLE IF NOT EXISTS client_communications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS client_communications_user_id_sent_at_idx ON client_communications(user_id, sent_at DESC);

-- Comentários sobre as tabelas
COMMENT ON TABLE client_notes IS 'Armazena notas internas sobre clientes feitas pelos administradores';
COMMENT ON TABLE client_documents IS 'Armazena documentos e anexos relacionados aos clientes';
COMMENT ON TABLE client_interactions IS 'Registra todas as interações com os clientes (chamadas, emails, etc)';
COMMENT ON TABLE plan_changes_history IS 'Histórico completo de mudanças de planos dos clientes';
COMMENT ON TABLE client_communications IS 'Registro de todas as comunicações enviadas aos clientes';
