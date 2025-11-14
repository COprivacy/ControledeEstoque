
import { storage } from './storage';
import { logger } from './logger';

interface CleanupConfig {
  devolucoes_dias: number | null;
  orcamentos_dias: number | null;
  logs_dias: number | null;
  caixas_dias: number | null;
  contas_pagar_dias: number | null;
  contas_receber_dias: number | null;
  relatorios_dias: number | null;
}

const DEFAULT_CONFIG: CleanupConfig = {
  devolucoes_dias: 90,
  orcamentos_dias: 180,
  logs_dias: 90,
  caixas_dias: 365,
  contas_pagar_dias: 365,
  contas_receber_dias: 365,
  relatorios_dias: 365,
};

export class AutoCleanupService {
  private config: CleanupConfig;
  private isRunning: boolean = false;

  constructor(config?: Partial<CleanupConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Carregar configurações salvas
  async loadConfig(): Promise<void> {
    try {
      // Aqui você pode implementar um método no storage para buscar configurações
      // Por enquanto, usa as configurações padrão
      logger.info('Configurações de limpeza carregadas', 'AUTO_CLEANUP', this.config);
    } catch (error: any) {
      logger.warn('Usando configurações padrão de limpeza', 'AUTO_CLEANUP', { error: error.message });
    }
  }

  // Atualizar configurações
  updateConfig(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configurações de limpeza atualizadas', 'AUTO_CLEANUP', this.config);
  }

  // Obter configurações atuais
  getConfig(): CleanupConfig {
    return { ...this.config };
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
        caixas: 0,
        contas_pagar: 0,
        contas_receber: 0,
        relatorios: 0,
      };

      // Limpar devoluções antigas (se configurado)
      if (this.config.devolucoes_dias !== null && this.config.devolucoes_dias > 0) {
        results.devolucoes = await this.cleanupDevolucoes(this.config.devolucoes_dias);
      }

      // Limpar orçamentos antigos (se configurado)
      if (this.config.orcamentos_dias !== null && this.config.orcamentos_dias > 0) {
        results.orcamentos = await this.cleanupOrcamentos(this.config.orcamentos_dias);
      }

      // Limpar logs antigos (se configurado)
      if (this.config.logs_dias !== null && this.config.logs_dias > 0) {
        results.logs = await this.cleanupLogs(this.config.logs_dias);
      }

      // Limpar caixas antigos (se configurado)
      if (this.config.caixas_dias !== null && this.config.caixas_dias > 0) {
        results.caixas = await this.cleanupCaixas(this.config.caixas_dias);
      }

      // Limpar contas a pagar antigas (se configurado)
      if (this.config.contas_pagar_dias !== null && this.config.contas_pagar_dias > 0) {
        results.contas_pagar = await this.cleanupContasPagar(this.config.contas_pagar_dias);
      }

      // Limpar contas a receber antigas (se configurado)
      if (this.config.contas_receber_dias !== null && this.config.contas_receber_dias > 0) {
        results.contas_receber = await this.cleanupContasReceber(this.config.contas_receber_dias);
      }

      // Limpar relatórios antigos (se configurado)
      if (this.config.relatorios_dias !== null && this.config.relatorios_dias > 0) {
        results.relatorios = await this.cleanupRelatorios(this.config.relatorios_dias);
      }

      logger.info('Arquivamento automático concluído', 'AUTO_CLEANUP', {
        devolucoesArquivadas: results.devolucoes,
        orcamentosArquivados: results.orcamentos,
        logsArquivados: results.logs,
        caixasArquivados: results.caixas,
        contasPagarArquivadas: results.contas_pagar,
        contasReceberArquivadas: results.contas_receber,
        relatoriosArquivados: results.relatorios,
        nota: 'Dados arquivados permanecem disponíveis para relatórios'
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

      let archivedCount = 0;
      for (const dev of devolucoesAntigas) {
        // ARQUIVAR ao invés de deletar - mantém para relatórios
        await storage.updateDevolucao(dev.id, { 
          status: 'arquivada' as any // Marca como arquivada
        });
        archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      logger.error('Erro ao arquivar devoluções', 'AUTO_CLEANUP', { error });
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

      let archivedCount = 0;
      for (const orc of orcamentosAntigos) {
        // ARQUIVAR ao invés de deletar - mantém para relatórios
        await storage.updateOrcamento(orc.id, {
          status: 'arquivado' as any // Marca como arquivado
        });
        archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      logger.error('Erro ao arquivar orçamentos', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupLogs(diasAntigos: number): Promise<number> {
    // Implementar quando tivermos uma função de limpeza de logs
    // Por enquanto, retornar 0
    return 0;
  }

  private async cleanupCaixas(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const todosCaixas = await storage.getCaixas();
      const caixasAntigos = todosCaixas.filter(c => 
        new Date(c.data_fechamento || c.data_abertura) < dataLimite &&
        c.status === "fechado"
      );

      let archivedCount = 0;
      for (const caixa of caixasAntigos) {
        // ARQUIVAR ao invés de deletar - mantém para relatórios
        await storage.updateCaixa(caixa.id, { 
          status: 'arquivado' as any // Marca como arquivado
        });
        archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      logger.error('Erro ao arquivar caixas', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupContasPagar(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const todasContas = await storage.getContasPagar();
      const contasAntigas = todasContas.filter(c => 
        new Date(c.data_pagamento || c.data_vencimento) < dataLimite &&
        c.status === "pago"
      );

      let archivedCount = 0;
      for (const conta of contasAntigas) {
        // ARQUIVAR ao invés de deletar - mantém para relatórios
        await storage.updateContaPagar(conta.id, { 
          status: 'arquivado' as any // Marca como arquivado
        });
        archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      logger.error('Erro ao arquivar contas a pagar', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupContasReceber(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const todasContas = await storage.getContasReceber();
      const contasAntigas = todasContas.filter(c => 
        new Date(c.data_recebimento || c.data_vencimento) < dataLimite &&
        c.status === "recebido"
      );

      let archivedCount = 0;
      for (const conta of contasAntigas) {
        // ARQUIVAR ao invés de deletar - mantém para relatórios
        await storage.updateContasReceber(conta.id, { 
          status: 'arquivado' as any // Marca como arquivado
        });
        archivedCount++;
      }

      return archivedCount;
    } catch (error) {
      logger.error('Erro ao arquivar contas a receber', 'AUTO_CLEANUP', { error });
      return 0;
    }
  }

  private async cleanupRelatorios(diasAntigos: number): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      // Buscar relatórios gerados (se houver uma tabela de relatórios salvos)
      // Por enquanto, retornar 0 até que a funcionalidade de salvar relatórios seja implementada
      logger.info('Limpeza de relatórios antigos ainda não implementada', 'AUTO_CLEANUP', {
        nota: 'Aguardando implementação de salvamento de relatórios'
      });
      
      return 0;
    } catch (error) {
      logger.error('Erro ao arquivar relatórios', 'AUTO_CLEANUP', { error });
      return 0;
    }
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
