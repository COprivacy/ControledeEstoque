
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { systemConfig } from '@shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function resetPasswords() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  try {
    console.log('🔄 Deletando senhas antigas do banco de dados...');

    // Deletar hashes antigos
    await db.delete(systemConfig).where(eq(systemConfig.chave, 'master_password'));
    await db.delete(systemConfig).where(eq(systemConfig.chave, 'public_admin_password'));

    console.log('✅ Senhas antigas deletadas!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Reinicie o servidor (clique em "Stop" e depois "Run")');
    console.log('2. O sistema criará novos hashes com as senhas dos Secrets');
    console.log('');
    console.log('🔐 Senhas que serão usadas:');
    console.log(`   - MASTER_ADMIN_PASSWORD: ${process.env.MASTER_ADMIN_PASSWORD ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   - PUBLIC_ADMIN_PASSWORD: ${process.env.PUBLIC_ADMIN_PASSWORD ? '✅ Configurada' : '❌ Não configurada'}`);
    console.log(`   - MASTER_USER_PASSWORD: ${process.env.MASTER_USER_PASSWORD ? '✅ Configurada' : '❌ Não configurada'}`);

  } catch (error: any) {
    console.error('❌ Erro ao resetar senhas:', error.message);
  } finally {
    await pool.end();
  }
}

resetPasswords();
