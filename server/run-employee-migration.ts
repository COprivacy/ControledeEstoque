
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  try {
    console.log('🔄 Executando migration de pacotes de funcionários...');

    const migrationSQL = readFileSync(
      join(process.cwd(), 'add_employee_package_columns.sql'),
      'utf-8'
    );

    await pool.query(migrationSQL);

    console.log('✅ Migration executada com sucesso!');
    console.log('');
    console.log('Colunas adicionadas:');
    console.log('- max_funcionarios_base');
    console.log('- data_expiracao_pacote_funcionarios');

  } catch (error: any) {
    console.error('❌ Erro ao executar migration:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
