
import { PostgresStorage } from './postgres-storage';
import { logger } from './logger';
import { randomUUID } from 'crypto';

async function seedDatabase() {
  logger.info('[SEED] Iniciando seed do banco de dados PostgreSQL...');
  
  const storage = new PostgresStorage();

  try {
    // Verificar se já existe um usuário admin
    const adminEmail = 'pavisoft.suporte@gmail.com';
    const existingAdmin = await storage.getUserByEmail(adminEmail);

    if (existingAdmin) {
      logger.info('[SEED] Usuário admin já existe, pulando criação...');
      return;
    }

    // Criar usuário admin padrão
    logger.info('[SEED] Criando usuário admin padrão...');
    const adminUser = await storage.createUser({
      email: adminEmail,
      senha: 'Pavisoft@140319', // Senha que você está tentando usar
      nome: 'Pavisoft Admin',
      is_admin: 'true',
      plano: 'premium',
      data_expiracao_trial: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
      data_expiracao_plano: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      permissoes: JSON.stringify({
        produtos: true,
        vendas: true,
        relatorios: true,
        configuracoes: true,
        clientes: true,
        fornecedores: true,
        fiscal: true,
        funcionarios: true,
        caixa: true,
        financeiro: true
      })
    });

    logger.info('[SEED] ✅ Usuário admin criado com sucesso!', {
      id: adminUser.id,
      email: adminUser.email,
      nome: adminUser.nome
    });

    logger.info('[SEED] ✅ Seed concluído com sucesso!');
    
  } catch (error: any) {
    logger.error('[SEED] ❌ Erro ao executar seed:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
