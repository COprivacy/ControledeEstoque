
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function verifyAndFixDatabase() {
  console.log('🔍 Verificando schema do banco de dados...');

  try {
    // Verificar se as colunas existem na tabela users
    const result = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);

    const existingColumns = new Set(result.rows.map((row: any) => row.column_name));
    console.log('✅ Colunas existentes na tabela users:', Array.from(existingColumns));

    // Colunas que devem existir
    const requiredColumns = [
      { name: 'cpf_cnpj', type: 'TEXT', default: null },
      { name: 'telefone', type: 'TEXT', default: null },
      { name: 'endereco', type: 'TEXT', default: null },
      { name: 'asaas_customer_id', type: 'TEXT', default: null },
      { name: 'permissoes', type: 'TEXT', default: null },
      { name: 'ultimo_acesso', type: 'TEXT', default: null },
      { name: 'max_funcionarios', type: 'INTEGER', default: 1 },
      { name: 'meta_mensal', type: 'REAL', default: 15000 },
    ];

    // Adicionar colunas faltantes
    for (const col of requiredColumns) {
      if (!existingColumns.has(col.name)) {
        console.log(`➕ Adicionando coluna ${col.name}...`);
        
        let alterQuery = `ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`;
        if (col.default !== null) {
          alterQuery += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
        }
        
        await db.execute(sql.raw(alterQuery));
        console.log(`✅ Coluna ${col.name} adicionada com sucesso!`);
      }
    }

    console.log('✅ Schema do banco de dados verificado e corrigido!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar/corrigir banco de dados:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

verifyAndFixDatabase()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no processo:', error);
    process.exit(1);
  });
