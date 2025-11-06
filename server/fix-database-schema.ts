
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function fixDatabaseSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

  try {
    console.log('🔧 Iniciando correção do schema do banco de dados...\n');

    // 1. Adicionar campo meta_mensal na tabela users (se não existir)
    console.log('1️⃣ Verificando campo meta_mensal...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS meta_mensal REAL DEFAULT 15000;
    `);
    console.log('✅ Campo meta_mensal verificado\n');

    // 2. Adicionar campos caixa e historico_caixas nas permissões
    console.log('2️⃣ Verificando campos de permissões de caixa...');
    await pool.query(`
      ALTER TABLE permissoes_funcionarios 
      ADD COLUMN IF NOT EXISTS caixa TEXT DEFAULT 'false';
    `);
    await pool.query(`
      ALTER TABLE permissoes_funcionarios 
      ADD COLUMN IF NOT EXISTS historico_caixas TEXT DEFAULT 'false';
    `);
    console.log('✅ Campos de permissões de caixa verificados\n');

    // 3. Atualizar todos os registros existentes para garantir valores padrão
    console.log('3️⃣ Atualizando valores padrão...');
    await pool.query(`
      UPDATE permissoes_funcionarios 
      SET caixa = 'false' 
      WHERE caixa IS NULL;
    `);
    await pool.query(`
      UPDATE permissoes_funcionarios 
      SET historico_caixas = 'false' 
      WHERE historico_caixas IS NULL;
    `);
    await pool.query(`
      UPDATE users 
      SET meta_mensal = 15000 
      WHERE meta_mensal IS NULL;
    `);
    console.log('✅ Valores padrão atualizados\n');

    // 4. Verificar se todas as colunas foram criadas corretamente
    console.log('4️⃣ Verificando integridade do schema...');
    const checkUsers = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'meta_mensal';
    `);
    
    const checkCaixa = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'permissoes_funcionarios' 
      AND column_name = 'caixa';
    `);
    
    const checkHistorico = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'permissoes_funcionarios' 
      AND column_name = 'historico_caixas';
    `);

    if (checkUsers.rows.length === 0) {
      console.error('❌ Campo meta_mensal NÃO foi criado!');
    } else {
      console.log('✅ Campo meta_mensal existe');
    }

    if (checkCaixa.rows.length === 0) {
      console.error('❌ Campo caixa NÃO foi criado!');
    } else {
      console.log('✅ Campo caixa existe');
    }

    if (checkHistorico.rows.length === 0) {
      console.error('❌ Campo historico_caixas NÃO foi criado!');
    } else {
      console.log('✅ Campo historico_caixas existe');
    }

    console.log('\n🎉 Correção do schema concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  fixDatabaseSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { fixDatabaseSchema };
