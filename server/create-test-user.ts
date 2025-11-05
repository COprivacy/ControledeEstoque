
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { randomUUID } from 'crypto';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');

    // Criar usuário carol@gmail.com
    await db.insert(users).values({
      id: randomUUID(),
      email: 'carol@gmail.com',
      senha: '123456',
      nome: 'Carol',
      plano: 'free',
      is_admin: 'false',
      status: 'ativo',
      max_funcionarios: 5,
      data_criacao: new Date().toISOString(),
    }).onConflictDoNothing();

    console.log('✅ Usuário criado com sucesso!');
    console.log('Email: carol@gmail.com');
    console.log('Senha: 123456');

    // Verificar
    const allUsers = await db.select().from(users);
    console.log('\n📋 Usuários no banco:');
    allUsers.forEach(u => {
      console.log(`- ${u.email} (${u.nome})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createTestUser();
