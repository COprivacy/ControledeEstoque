
import { PostgresStorage } from './postgres-storage';
import bcrypt from 'bcryptjs';

const storage = new PostgresStorage();

async function seedDatabase() {
  console.log('🌱 Verificando banco de dados...');

  try {
    // Verificar se já existem usuários
    const users = await storage.getUsers();
    
    if (users.length === 0) {
      console.log('📝 Banco vazio. Criando usuários de exemplo...');
      
      // Criar usuário pavisoft.suporte@gmail.com
      const hashedPassword1 = await bcrypt.hash('Pavisoft@140319', 10);
      await storage.createUser({
        email: 'pavisoft.suporte@gmail.com',
        password: hashedPassword1,
        nome: 'Suporte Pavisoft',
        tipo_conta: 'admin_master',
        status_assinatura: 'ativa',
        data_fim_trial: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      console.log('✅ Usuário pavisoft.suporte@gmail.com criado');

      // Criar usuário carol@gmail.com
      const hashedPassword2 = await bcrypt.hash('123456', 10);
      await storage.createUser({
        email: 'carol@gmail.com',
        password: hashedPassword2,
        nome: 'Carol',
        tipo_conta: 'admin',
        status_assinatura: 'trial',
        data_fim_trial: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      console.log('✅ Usuário carol@gmail.com criado');

      console.log('✅ Banco populado com sucesso!');
    } else {
      console.log(`ℹ️  Banco já contém ${users.length} usuário(s)`);
      console.log('Usuários encontrados:');
      users.forEach(u => console.log(`  - ${u.email} (${u.tipo_conta})`));
    }

  } catch (error) {
    console.error('❌ Erro ao verificar/popular banco:', error);
    process.exit(1);
  }
}

seedDatabase();
