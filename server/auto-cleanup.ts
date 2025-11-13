
import { storage } from './storage';
import { logger } from './logger';

interface CleanupConfig {
  devolucoes_dias: number;
  orcamentos_dias: number;
  logs_dias: number;
  caixas_dias: number;
}

const DEFAULT_CONFIG: CleanupConfig = {
  devolucoes_dias: 90,
  orcamentos_dias: 180,
  logs_dias: 90,
  caixas_dias: 365,
};

export class AutoCleanupService {
  private config: CleanupConfig;
  private isRunning: boolean = false;

  constructor(config?: Partial<CleanupConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async executeCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Limpeza automática já está em execução', 'AUTO_CLEANUP');
      return;
    }

    this.isRunning = true;
    logger.info('Iniciando limpeza automática de dados...', 'AUTO_CLEANUP');

    try {
      const results = {
        devolucoes: 0,
        orcamentos: 0,
        logs: 0,
      };

      // Limpar devoluções antigas
      if (this.config.devolucoes_dias > 0) {
        results.devolucoes = await this.cleanupDevolucoes(this.config.devolucoes_dias);
      }

      // Limpar orçamentos antigos
      if (this.config.orcamentos_dias > 0) {
        results.orcamentos = await this.cleanupOrcamentos(this.config.orcamentos_dias);
      }

      // Limpar logs antigos
      if (this.config.logs_dias > 0) {
        results.logs = await this.cleanupLogs(this.config.logs_dias);
      }

      logger.info('Limpeza automática concluída', 'AUTO_CLEANUP', {
        devolucoesRemovidas: results.devolucoes,
        orcamentosRemovidos: results.orcamentos,
        logsRemovidos: results.logs,
      });
    } catch (error: any) {
      logger.error('Erro durante limpeza automática', 'AUTO_CLEANUP', {
        error: error.message,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private async cleanupDevolucoes(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const todasDevolucoes = await storage.getDevolucoes();
      const devolucoesAntigas = todasDevolucoes.filter(d => 
        new Date(d.data_devolucao) < dataLimite &&
        d.status !== "pendente"
      );

      let deletedCount = 0;
      for (const dev of devolucoesAntigas) {
        const deleted = await storage.deleteDevolucao(dev.id);
        if (deleted) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      logger.error('Erro ao limpar devoluções', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupOrcamentos(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const todosOrcamentos = await storage.getOrcamentos();
      const orcamentosAntigos = todosOrcamentos.filter(o => 
        new Date(o.data_criacao) < dataLimite &&
        (o.status === "convertido" || o.status === "rejeitado")
      );

      let deletedCount = 0;
      for (const orc of orcamentosAntigos) {
        await storage.deleteOrcamento(orc.id);
        deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      logger.error('Erro ao limpar orçamentos', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupLogs(diasAntigos: number): Promise<number> {
    // Implementar quando tivermos uma função de limpeza de logs
    // Por enquanto, retornar 0
    return 0;
  }

  startScheduledCleanup(): void {
    // Executar limpeza diariamente às 3h da manhã
    const CLEANUP_HOUR = 3;
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

    const scheduleNextCleanup = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(CLEANUP_HOUR, 0, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      const timeUntilNext = next.getTime() - now.getTime();

      setTimeout(() => {
        this.executeCleanup();
        setInterval(() => this.executeCleanup(), CLEANUP_INTERVAL);
      }, timeUntilNext);

      logger.info('Limpeza automática agendada', 'AUTO_CLEANUP', {
        proximaExecucao: next.toISOString(),
      });
    };

    scheduleNextCleanup();
  }
}

// Singleton
export const autoCleanupService = new AutoCleanupService();
