
import { storage } from './storage';
import { logger } from './logger';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  timestamp: string;
  autoFixed?: boolean;
}

interface AutoFixResult {
  success: boolean;
  message: string;
  action: string;
}

class AutoHealingService {
  private healthChecks: HealthCheck[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Iniciar monitoramento automático
  startAutoHealing(intervalMinutes: number = 5) {
    if (this.isRunning) {
      logger.warn('Auto-healing já está em execução', 'AUTO_HEALING');
      return;
    }

    this.isRunning = true;
    logger.info('Sistema de auto-healing iniciado', 'AUTO_HEALING', {
      interval: `${intervalMinutes} minutos`
    });

    // Execução imediata
    this.runHealthChecks();

    // Agendar execuções periódicas
    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMinutes * 60 * 1000);
  }

  // Parar monitoramento
  stopAutoHealing() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.info('Sistema de auto-healing parado', 'AUTO_HEALING');
  }

  // Executar todas as verificações de saúde
  async runHealthChecks() {
    logger.info('Iniciando verificações de saúde', 'AUTO_HEALING');
    this.healthChecks = [];

    // 1. Verificar conexão com banco de dados
    await this.checkDatabaseConnection();

    // 2. Verificar schema do banco
    await this.checkDatabaseSchema();

    // 3. Verificar serviços externos
    await this.checkExternalServices();

    // 4. Verificar uso de recursos
    await this.checkResourceUsage();

    // 5. Verificar integridade de dados
    await this.checkDataIntegrity();

    // 6. Verificar módulos do sistema
    await this.checkSystemModules();

    // Registrar resumo
    const critical = this.healthChecks.filter(h => h.status === 'critical').length;
    const degraded = this.healthChecks.filter(h => h.status === 'degraded').length;
    const autoFixed = this.healthChecks.filter(h => h.autoFixed).length;

    logger.info('Verificações de saúde concluídas', 'AUTO_HEALING', {
      total: this.healthChecks.length,
      critical,
      degraded,
      autoFixed
    });

    return this.healthChecks;
  }

  // 1. Verificar conexão com banco de dados
  private async checkDatabaseConnection(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        this.addHealthCheck('database_connection', 'critical', 'DATABASE_URL não configurada');
        return;
      }

      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle(pool);

      await db.execute(sql`SELECT 1`);
      await pool.end();

      this.addHealthCheck('database_connection', 'healthy', 'Conexão com banco de dados OK');
    } catch (error: any) {
      this.addHealthCheck('database_connection', 'critical', `Erro na conexão: ${error.message}`);

      // Tentar reconectar automaticamente
      const fixResult = await this.autoFixDatabaseConnection();
      if (fixResult.success) {
        this.healthChecks[this.healthChecks.length - 1].autoFixed = true;
        this.healthChecks[this.healthChecks.length - 1].status = 'healthy';
        this.healthChecks[this.healthChecks.length - 1].message = fixResult.message;
      }
    }
  }

  // 2. Verificar schema do banco
  private async checkDatabaseSchema(): Promise<void> {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle(pool);

      // Verificar se tabelas críticas existem
      const criticalTables = [
        'users', 'produtos', 'vendas', 'clientes', 
        'fornecedores', 'caixas', 'subscriptions'
      ];

      const result = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const existingTables = result.rows.map((row: any) => row.table_name);
      const missingTables = criticalTables.filter(t => !existingTables.includes(t));

      await pool.end();

      if (missingTables.length > 0) {
        this.addHealthCheck('database_schema', 'critical', `Tabelas faltando: ${missingTables.join(', ')}`);
        
        // Tentar recriar tabelas automaticamente
        const fixResult = await this.autoFixDatabaseSchema(missingTables);
        if (fixResult.success) {
          this.healthChecks[this.healthChecks.length - 1].autoFixed = true;
          this.healthChecks[this.healthChecks.length - 1].status = 'healthy';
          this.healthChecks[this.healthChecks.length - 1].message = fixResult.message;
        }
      } else {
        this.addHealthCheck('database_schema', 'healthy', 'Schema do banco de dados OK');
      }
    } catch (error: any) {
      this.addHealthCheck('database_schema', 'degraded', `Erro ao verificar schema: ${error.message}`);
    }
  }

  // 3. Verificar serviços externos
  private async checkExternalServices(): Promise<void> {
    // Verificar Mercado Pago
    try {
      const mpConfig = await storage.getConfigMercadoPago();
      if (!mpConfig || !mpConfig.access_token) {
        this.addHealthCheck('mercadopago', 'degraded', 'Mercado Pago não configurado');
      } else {
        this.addHealthCheck('mercadopago', 'healthy', 'Mercado Pago configurado');
      }
    } catch (error: any) {
      this.addHealthCheck('mercadopago', 'degraded', `Erro ao verificar Mercado Pago: ${error.message}`);
    }

    // Verificar serviço de email
    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        this.addHealthCheck('email_service', 'degraded', 'SMTP não configurado');
      } else {
        this.addHealthCheck('email_service', 'healthy', 'Serviço de email configurado');
      }
    } catch (error: any) {
      this.addHealthCheck('email_service', 'degraded', `Erro ao verificar email: ${error.message}`);
    }
  }

  // 4. Verificar uso de recursos
  private async checkResourceUsage(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const memPercent = (memUsedMB / memTotalMB) * 100;

      if (memPercent > 95) {
        this.addHealthCheck('memory_usage', 'critical', `Memória crítica: ${memPercent.toFixed(1)}% (${memUsedMB}MB/${memTotalMB}MB)`);
        
        // Tentar liberar memória
        const fixResult = await this.autoFixMemoryUsage();
        if (fixResult.success) {
          this.healthChecks[this.healthChecks.length - 1].autoFixed = true;
          this.healthChecks[this.healthChecks.length - 1].status = 'healthy';
        }
      } else if (memPercent > 85) {
        this.addHealthCheck('memory_usage', 'degraded', `Memória elevada: ${memPercent.toFixed(1)}% (${memUsedMB}MB/${memTotalMB}MB)`);
      } else {
        this.addHealthCheck('memory_usage', 'healthy', `Memória normal: ${memPercent.toFixed(1)}% (${memUsedMB}MB/${memTotalMB}MB)`);
      }
    } catch (error: any) {
      this.addHealthCheck('memory_usage', 'degraded', `Erro ao verificar memória: ${error.message}`);
    }
  }

  // 5. Verificar integridade de dados
  private async checkDataIntegrity(): Promise<void> {
    try {
      // Verificar usuários sem plano
      const users = await storage.getUsers();
      const usersWithoutPlan = users.filter(u => !u.plano || u.plano === '');

      if (usersWithoutPlan.length > 0) {
        this.addHealthCheck('data_integrity_plans', 'degraded', `${usersWithoutPlan.length} usuários sem plano definido`);
        
        // Corrigir automaticamente
        const fixResult = await this.autoFixUserPlans(usersWithoutPlan);
        if (fixResult.success) {
          this.healthChecks[this.healthChecks.length - 1].autoFixed = true;
          this.healthChecks[this.healthChecks.length - 1].status = 'healthy';
          this.healthChecks[this.healthChecks.length - 1].message = fixResult.message;
        }
      } else {
        this.addHealthCheck('data_integrity_plans', 'healthy', 'Todos os usuários têm plano definido');
      }

      // Verificar produtos com preço zero ou negativo
      const produtos = await storage.getProdutos();
      const produtosInvalidos = produtos.filter(p => p.preco <= 0);

      if (produtosInvalidos.length > 0) {
        this.addHealthCheck('data_integrity_products', 'degraded', `${produtosInvalidos.length} produtos com preço inválido`);
      } else {
        this.addHealthCheck('data_integrity_products', 'healthy', 'Todos os produtos têm preço válido');
      }

    } catch (error: any) {
      this.addHealthCheck('data_integrity', 'degraded', `Erro ao verificar integridade: ${error.message}`);
    }
  }

  // 6. Verificar módulos do sistema
  private async checkSystemModules(): Promise<void> {
    // Módulo de Estoque
    try {
      const produtos = await storage.getProdutos();
      const produtosAtivos = produtos.filter(p => p.quantidade > 0);
      const produtosVencidos = produtos.filter(p => {
        if (!p.vencimento) return false;
        return new Date(p.vencimento) < new Date();
      });

      if (produtosVencidos.length > 10) {
        this.addHealthCheck('module_estoque', 'degraded', `${produtosVencidos.length} produtos vencidos no estoque`);
      } else {
        this.addHealthCheck('module_estoque', 'healthy', `Estoque OK: ${produtosAtivos.length} produtos ativos`);
      }
    } catch (error: any) {
      this.addHealthCheck('module_estoque', 'critical', `Módulo de Estoque com erro: ${error.message}`);
    }

    // Módulo Financeiro
    try {
      const contas = await storage.getContasPagar?.() || [];
      const contasVencidas = contas.filter((c: any) => {
        if (c.status === 'pago') return false;
        return new Date(c.vencimento) < new Date();
      });

      if (contasVencidas.length > 5) {
        this.addHealthCheck('module_financeiro', 'degraded', `${contasVencidas.length} contas a pagar vencidas`);
      } else {
        this.addHealthCheck('module_financeiro', 'healthy', `Financeiro OK: ${contas.length} contas cadastradas`);
      }
    } catch (error: any) {
      this.addHealthCheck('module_financeiro', 'critical', `Módulo Financeiro com erro: ${error.message}`);
    }

    // Módulo PDV/Vendas
    try {
      const vendas = await storage.getVendas();
      const hoje = new Date().toISOString().split('T')[0];
      const vendasHoje = vendas.filter(v => v.data?.startsWith(hoje));

      this.addHealthCheck('module_pdv', 'healthy', `PDV operacional: ${vendasHoje.length} vendas hoje`);
    } catch (error: any) {
      this.addHealthCheck('module_pdv', 'critical', `Módulo PDV com erro: ${error.message}`);
    }

    // Módulo Admin
    try {
      const users = await storage.getUsers();
      const admins = users.filter(u => u.is_admin === 'true');
      const funcionarios = await storage.getFuncionarios?.() || [];

      if (admins.length === 0) {
        this.addHealthCheck('module_admin', 'critical', 'Nenhum administrador cadastrado');
      } else {
        this.addHealthCheck('module_admin', 'healthy', `Admin OK: ${admins.length} admins, ${funcionarios.length} funcionários`);
      }
    } catch (error: any) {
      this.addHealthCheck('module_admin', 'critical', `Módulo Admin com erro: ${error.message}`);
    }

    // Módulo de Caixa
    try {
      if (storage.getCaixas) {
        const caixas = await storage.getCaixas('all');
        const caixasAbertos = caixas.filter((c: any) => c.status === 'aberto');

        if (caixasAbertos.length > 50) {
          this.addHealthCheck('module_caixa', 'degraded', `Muitos caixas abertos: ${caixasAbertos.length}`);
        } else {
          this.addHealthCheck('module_caixa', 'healthy', `Caixa OK: ${caixasAbertos.length} caixas abertos`);
        }
      } else {
        this.addHealthCheck('module_caixa', 'healthy', 'Módulo de Caixa disponível');
      }
    } catch (error: any) {
      this.addHealthCheck('module_caixa', 'critical', `Módulo Caixa com erro: ${error.message}`);
    }
  }

  // AUTO-FIXES (Correções Automáticas)

  private async autoFixDatabaseConnection(): Promise<AutoFixResult> {
    try {
      logger.info('Tentando reconectar ao banco de dados...', 'AUTO_HEALING');
      
      // Aguardar 2 segundos e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle(pool);
      await db.execute(sql`SELECT 1`);
      await pool.end();

      logger.info('✅ Conexão com banco restaurada automaticamente', 'AUTO_HEALING');
      return {
        success: true,
        message: 'Conexão restaurada automaticamente',
        action: 'database_reconnect'
      };
    } catch (error: any) {
      logger.error('❌ Falha ao reconectar ao banco', 'AUTO_HEALING', { error: error.message });
      return {
        success: false,
        message: 'Não foi possível reconectar',
        action: 'database_reconnect_failed'
      };
    }
  }

  private async autoFixDatabaseSchema(missingTables: string[]): Promise<AutoFixResult> {
    try {
      logger.warn('⚠️ Tentando recriar tabelas faltantes...', 'AUTO_HEALING', { tables: missingTables });
      
      // Aqui você poderia executar migrations automaticamente
      // Por segurança, apenas logar o problema para correção manual
      
      return {
        success: false,
        message: 'Schema requer correção manual',
        action: 'schema_fix_required'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao tentar corrigir schema: ${error.message}`,
        action: 'schema_fix_failed'
      };
    }
  }

  private async autoFixMemoryUsage(): Promise<AutoFixResult> {
    try {
      logger.info('Executando garbage collection...', 'AUTO_HEALING');
      
      if (global.gc) {
        global.gc();
        logger.info('✅ Garbage collection executado', 'AUTO_HEALING');
        
        return {
          success: true,
          message: 'Memória liberada automaticamente',
          action: 'memory_gc'
        };
      }
      
      return {
        success: false,
        message: 'GC não disponível (execute com --expose-gc)',
        action: 'memory_gc_unavailable'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao liberar memória: ${error.message}`,
        action: 'memory_gc_failed'
      };
    }
  }

  private async autoFixUserPlans(users: any[]): Promise<AutoFixResult> {
    try {
      logger.info('Corrigindo usuários sem plano...', 'AUTO_HEALING', { count: users.length });
      
      for (const user of users) {
        await storage.updateUser(user.id, { plano: 'free' });
      }
      
      logger.info('✅ Planos corrigidos automaticamente', 'AUTO_HEALING', { count: users.length });
      
      return {
        success: true,
        message: `${users.length} usuários corrigidos para plano free`,
        action: 'fix_user_plans'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao corrigir planos: ${error.message}`,
        action: 'fix_user_plans_failed'
      };
    }
  }

  // Adicionar resultado de verificação
  private addHealthCheck(service: string, status: HealthCheck['status'], message: string) {
    this.healthChecks.push({
      service,
      status,
      message,
      timestamp: new Date().toISOString(),
      autoFixed: false
    });
  }

  // Obter status atual do sistema
  getSystemStatus() {
    const critical = this.healthChecks.filter(h => h.status === 'critical').length;
    const degraded = this.healthChecks.filter(h => h.status === 'degraded').length;
    const healthy = this.healthChecks.filter(h => h.status === 'healthy').length;

    let overallStatus: 'online' | 'degraded' | 'offline' = 'online';
    if (critical > 0) overallStatus = 'offline';
    else if (degraded > 0) overallStatus = 'degraded';

    return {
      status: overallStatus,
      lastCheck: this.healthChecks.length > 0 ? this.healthChecks[0].timestamp : null,
      checks: this.healthChecks,
      summary: {
        total: this.healthChecks.length,
        healthy,
        degraded,
        critical,
        autoFixed: this.healthChecks.filter(h => h.autoFixed).length
      }
    };
  }

  // Obter histórico de correções automáticas
  getAutoFixHistory(limit: number = 50) {
    return this.healthChecks
      .filter(h => h.autoFixed)
      .slice(0, limit);
  }
}

export const autoHealingService = new AutoHealingService();
