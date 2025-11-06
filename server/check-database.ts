
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function checkDatabase() {
  try {
    console.log('🔍 Verificando dados no banco PostgreSQL...\n');

    const allUsers = await db.select().from(users);
    
    console.log(`📊 Total de usuários no banco: ${allUsers.length}\n`);
    
    if (allUsers.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado no banco!');
    } else {
      console.log('📋 Usuários encontrados:');
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. Email: ${user.email}`);
        console.log(`   Nome: ${user.nome}`);
        console.log(`   Plano: ${user.plano}`);
        console.log(`   Admin: ${user.is_admin}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Senha: ${user.senha}`);
        console.log(`   ID: ${user.id}`);
      });
    }

    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao verificar banco:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkDatabase();
