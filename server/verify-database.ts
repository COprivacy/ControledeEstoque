
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function verifyDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrado nas variáveis de ambiente!');
    console.log('💡 Adicione DATABASE_URL nos Secrets do Replit');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  try {
    console.log('🔍 Verificando conexão com o banco de dados...\n');

    // Testar conexão
    const testResult = await db.select().from(users).limit(1);
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // Listar todos os usuários
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco de dados.');
      console.log('💡 Execute: npm run seed para popular o banco com dados iniciais\n');
    } else {
      console.log(`📊 Total de usuários no banco: ${allUsers.length}\n`);
      console.log('👤 Usuários cadastrados:');
      console.log('─'.repeat(80));
      
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nome}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   📦 Plano: ${user.plano}`);
        console.log(`   👔 Admin: ${user.is_admin === 'true' ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado em: ${new Date(user.data_criacao).toLocaleString('pt-BR')}`);
        console.log(`   📊 Status: ${user.status}`);
        console.log('─'.repeat(80));
      });
    }

    console.log('\n✅ Verificação concluída!\n');
    
    await pool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erro ao verificar banco de dados:');
    console.error(error.message);
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 As tabelas do banco não existem.');
      console.log('   Execute: npm run db:push para criar as tabelas\n');
    }
    
    await pool.end();
    process.exit(1);
  }
}

verifyDatabase();
