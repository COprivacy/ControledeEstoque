
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { systemConfig } from '@shared/schema';
import bcrypt from 'bcryptjs';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function updateMasterPassword() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  try {
    console.log('🔄 Atualizando senha do Admin Master...');

    const newPassword = process.env.MASTER_ADMIN_PASSWORD;
    
    if (!newPassword) {
      console.error('❌ MASTER_ADMIN_PASSWORD não encontrada nas variáveis de ambiente');
      console.log('');
      console.log('📋 Configure a senha nos Secrets do Replit:');
      console.log('   1. Vá em Tools → Secrets');
      console.log('   2. Edite MASTER_ADMIN_PASSWORD');
      console.log('   3. Defina o valor: Pavisoft2027?Seguro#');
      return;
    }

    console.log(`✅ Nova senha encontrada: ${newPassword}`);

    // Deletar senha antiga
    await db.delete(systemConfig).where(eq(systemConfig.chave, 'master_password'));
    console.log('🗑️  Senha antiga deletada do banco');

    // Criar novo hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Inserir nova senha hasheada
    await db.insert(systemConfig).values({
      chave: 'master_password',
      valor: hashedPassword,
      updated_at: new Date().toISOString(),
    });

    console.log('✅ Nova senha do Admin Master salva no banco!');
    console.log('');
    console.log('🔐 Senha atualizada com sucesso!');
    console.log(`   Nova senha: ${newPassword}`);
    console.log('');
    console.log('⚠️  Não esqueça de usar a nova senha ao acessar /admin-master');

  } catch (error: any) {
    console.error('❌ Erro ao atualizar senha:', error.message);
  } finally {
    await pool.end();
  }
}

updateMasterPassword();
