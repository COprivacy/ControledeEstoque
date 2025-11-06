import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function seedDatabase() {
  try {
    console.log('🌱 Verificando e populando banco de dados...\n');

    // Verificar usuários existentes
    const existingUsers = await db.select().from(users);
    console.log(`📊 Usuários existentes no banco: ${existingUsers.length}`);

    // Criar usuário Admin Master se não existir
    const adminExists = await db.select().from(users)
      .where(eq(users.email, 'pavisoft.suporte@gmail.com'))
      .limit(1);

    if (adminExists.length === 0) {
      await db.insert(users).values({
        id: randomUUID(),
        email: 'pavisoft.suporte@gmail.com',
        senha: 'Pavisoft@140319',
        nome: 'Admin Master',
        plano: 'premium',
        is_admin: 'true',
        status: 'ativo',
        max_funcionarios: 999,
        data_criacao: new Date().toISOString(),
      });
      console.log('✅ Usuário Admin Master criado');
    } else {
      console.log('⏭️  Admin Master já existe');
    }

    // Criar usuário Demo se não existir
    const demoExists = await db.select().from(users)
      .where(eq(users.email, 'demo@example.com'))
      .limit(1);

    if (demoExists.length === 0) {
      await db.insert(users).values({
        id: randomUUID(),
        email: 'demo@example.com',
        senha: 'demo123',
        nome: 'Loja Demo',
        plano: 'free',
        is_admin: 'false',
        status: 'ativo',
        max_funcionarios: 5,
        data_criacao: new Date().toISOString(),
      });
      console.log('✅ Usuário Demo criado');
    } else {
      console.log('⏭️  Usuário Demo já existe');
    }

    // Mostrar total de usuários
    const finalUsers = await db.select().from(users);
    console.log(`\n📊 Total de usuários no banco: ${finalUsers.length}`);
    console.log('✅ Seed concluído com sucesso!\n');

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao popular banco:', error.message);
    await pool.end();
    process.exit(1);
  }
}

seedDatabase();