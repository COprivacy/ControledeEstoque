
import { Pool } from '@neondatabase/serverless';

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  try {
    console.log('🔄 Criando tabela de códigos de recuperação de senha...');

    // SQL direto sem usar __dirname
    const migrationSQL = `
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
    `;

    await pool.query(migrationSQL);

    console.log('✅ Tabela password_reset_codes criada com sucesso!');
    console.log('');
    console.log('📋 Estrutura criada:');
    console.log('  - Tabela: password_reset_codes');
    console.log('  - Índice: idx_password_reset_email');
    console.log('  - Índice: idx_password_reset_used');

    // Verificar se a tabela foi criada
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'password_reset_codes'
    `);

    if (result.rows.length > 0) {
      console.log('\n✅ Verificação: Tabela encontrada no banco de dados');
    } else {
      console.log('\n⚠️ Aviso: Tabela não encontrada na verificação');
    }

  } catch (error: any) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
