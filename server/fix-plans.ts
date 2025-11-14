
import { storage } from './storage';

async function normalizePlans() {
  try {
    console.log('🔧 Iniciando normalização de planos...');
    
    const users = await storage.getUsers();
    let fixedCount = 0;
    
    const planMap: Record<string, string> = {
      'free': 'free',
      'trial': 'trial',
      'mensal': 'premium_mensal',
      'anual': 'premium_anual',
      'premium': 'premium_mensal',
      'premium_mensal': 'premium_mensal',
      'premium_anual': 'premium_anual'
    };
    
    for (const user of users) {
      if (!user.plano || user.plano === '') {
        // Usuários sem plano viram free
        await storage.updateUser(user.id, { plano: 'free' });
        fixedCount++;
        console.log(`✅ Usuário ${user.email} atualizado: (vazio) → free`);
      } else if (planMap[user.plano.toLowerCase()] && planMap[user.plano.toLowerCase()] !== user.plano) {
        // Normalizar planos antigos
        const newPlan = planMap[user.plano.toLowerCase()];
        await storage.updateUser(user.id, { plano: newPlan });
        fixedCount++;
        console.log(`✅ Usuário ${user.email} atualizado: ${user.plano} → ${newPlan}`);
      }
    }
    
    console.log(`\n✅ Normalização concluída! ${fixedCount} usuários corrigidos de ${users.length} no total.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao normalizar planos:', error);
    process.exit(1);
  }
}

normalizePlans();
