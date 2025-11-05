import { storage } from './storage';
import { EmailService } from './email-service';
import { logger } from './logger';

interface PaymentReminderConfig {
  daysBeforeExpiration: number[];
  daysAfterExpiration: number[];
}

export class PaymentReminderService {
  private emailService: EmailService;
  private config: PaymentReminderConfig = {
    daysBeforeExpiration: [7, 3, 1], // Avisos antes do vencimento
    daysAfterExpiration: [1, 3, 7, 15], // Avisos após vencimento
  };

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Verifica todos os pagamentos e envia lembretes
   */
  async checkAndSendReminders(): Promise<void> {
    try {
      const subscriptions = await storage.getSubscriptions();
      const users = await storage.getUsers();
      const now = new Date();

      // Verificar assinaturas existentes
      for (const subscription of subscriptions) {
        // Ignorar assinaturas já canceladas ou inativas
        if (subscription.status === 'cancelado' || subscription.status === 'inativo') {
          continue;
        }

        // Verificar assinaturas com pagamento pendente
        if (subscription.status_pagamento === 'PENDING') {
          await this.handlePendingPayment(subscription);
        }

        // Verificar vencimentos de planos
        if (subscription.data_vencimento) {
          const daysUntilExpiration = this.getDaysDifference(now, new Date(subscription.data_vencimento));

          // Avisos antes do vencimento
          if (this.config.daysBeforeExpiration.includes(daysUntilExpiration)) {
            await this.sendExpirationWarning(subscription, daysUntilExpiration);
          }

          // Avisos após vencimento
          const daysAfterExpiration = Math.abs(daysUntilExpiration);
          if (daysUntilExpiration < 0 && this.config.daysAfterExpiration.includes(daysAfterExpiration)) {
            await this.sendOverdueNotice(subscription, daysAfterExpiration);
          }

          // Bloqueio automático após 15 dias de atraso
          if (daysUntilExpiration < -15) {
            await this.blockExpiredSubscription(subscription);
          }
        }
      }

      // Verificar usuários trial expirados (sem assinatura)
      for (const user of users) {
        // Apenas usuários trial ou free
        if (user.plano === 'trial' || user.plano === 'free') {
          const expirationDate = user.data_expiracao_plano || user.data_expiracao_trial;
          
          if (expirationDate) {
            const daysUntilExpiration = this.getDaysDifference(now, new Date(expirationDate));
            
            // Avisos antes do vencimento do trial
            if (this.config.daysBeforeExpiration.includes(daysUntilExpiration)) {
              await this.sendTrialExpirationWarning(user, daysUntilExpiration);
            }
            
            // Trial expirado - converter para free e bloquear
            if (daysUntilExpiration < 0) {
              const daysExpired = Math.abs(daysUntilExpiration);
              
              // Bloquear após 0 dias de expiração (imediato)
              if (daysExpired >= 0 && user.status !== 'bloqueado') {
                await this.blockExpiredTrialUser(user);
              }
            }
          }
        }
      }

      logger.info('Verificação de pagamentos concluída', 'PAYMENT_REMINDER');
    } catch (error) {
      logger.error('Erro ao verificar pagamentos', 'PAYMENT_REMINDER', { error });
    }
  }

  /**
   * Trata pagamentos pendentes
   */
  private async handlePendingPayment(subscription: any): Promise<void> {
    const user = (await storage.getUsers()).find(u => u.id === subscription.user_id);
    if (!user) return;

    const daysSinceCreation = this.getDaysDifference(new Date(subscription.data_criacao), new Date());

    // Enviar lembrete após 2, 5 e 10 dias de pendência
    if ([2, 5, 10].includes(daysSinceCreation)) {
      await this.emailService.sendPaymentPendingReminder({
        to: user.email,
        userName: user.nome,
        planName: subscription.plano,
        daysWaiting: daysSinceCreation,
        amount: subscription.valor,
      });

      logger.info('Lembrete de pagamento pendente enviado', 'PAYMENT_REMINDER', {
        userId: user.id,
        subscriptionId: subscription.id,
        days: daysSinceCreation,
      });
    }

    // Cancelar automaticamente após 15 dias
    if (daysSinceCreation >= 15) {
      await storage.updateSubscription(subscription.id, {
        status: 'cancelado',
        status_pagamento: 'CANCELLED',
      });

      logger.warn('Assinatura cancelada por pendência prolongada', 'PAYMENT_REMINDER', {
        subscriptionId: subscription.id,
      });
    }
  }

  /**
   * Envia aviso de vencimento próximo
   */
  private async sendExpirationWarning(subscription: any, daysRemaining: number): Promise<void> {
    const user = (await storage.getUsers()).find(u => u.id === subscription.user_id);
    if (!user) return;

    await this.emailService.sendExpirationWarning({
      to: user.email,
      userName: user.nome,
      planName: subscription.plano,
      daysRemaining,
      expirationDate: new Date(subscription.data_vencimento!).toLocaleDateString('pt-BR'),
      amount: subscription.valor,
    });

    logger.info('Aviso de vencimento enviado', 'PAYMENT_REMINDER', {
      userId: user.id,
      daysRemaining,
    });
  }

  /**
   * Envia notificação de pagamento atrasado
   */
  private async sendOverdueNotice(subscription: any, daysOverdue: number): Promise<void> {
    const user = (await storage.getUsers()).find(u => u.id === subscription.user_id);
    if (!user) return;

    await this.emailService.sendOverdueNotice({
      to: user.email,
      userName: user.nome,
      planName: subscription.plano,
      daysOverdue,
      amount: subscription.valor,
    });

    logger.warn('Notificação de atraso enviada', 'PAYMENT_REMINDER', {
      userId: user.id,
      daysOverdue,
    });
  }

  /**
   * Bloqueia assinatura expirada
   */
  private async blockExpiredSubscription(subscription: any): Promise<void> {
    await storage.updateSubscription(subscription.id, {
      status: "bloqueado",
    });

    await storage.updateUser(subscription.user_id, {
      status: "bloqueado",
    });

    const user = (await storage.getUsers()).find(u => u.id === subscription.user_id);
    if (user) {
      // Bloquear também todos os funcionários desta conta
      if (storage.getFuncionarios) {
        const funcionarios = await storage.getFuncionarios();
        const funcionariosDaConta = funcionarios.filter(f => f.conta_id === user.id);

        for (const funcionario of funcionariosDaConta) {
          await storage.updateFuncionario(funcionario.id, {
            status: "bloqueado",
          });

          logger.warn('Funcionário bloqueado devido ao bloqueio da conta principal', 'PAYMENT_REMINDER', {
            funcionarioId: funcionario.id,
            contaId: user.id,
          });
        }

        if (funcionariosDaConta.length > 0) {
          logger.info(`${funcionariosDaConta.length} funcionário(s) bloqueado(s) junto com a conta`, 'PAYMENT_REMINDER', {
            contaId: user.id,
          });
        }
      }

      await this.emailService.sendAccountBlocked({
        to: user.email,
        userName: user.nome,
        planName: subscription.plano,
      });
    }

    logger.error('Conta bloqueada por falta de pagamento', 'PAYMENT_REMINDER', {
      subscriptionId: subscription.id,
      userId: subscription.user_id,
    });
  }

  /**
   * Envia aviso de vencimento de trial
   */
  private async sendTrialExpirationWarning(user: any, daysRemaining: number): Promise<void> {
    await this.emailService.sendExpirationWarning({
      to: user.email,
      userName: user.nome,
      planName: 'Plano Trial (7 dias grátis)',
      daysRemaining,
      expirationDate: new Date(user.data_expiracao_trial || user.data_expiracao_plano!).toLocaleDateString('pt-BR'),
      amount: 0, // Trial é gratuito
    });

    logger.info('Aviso de vencimento de trial enviado', 'PAYMENT_REMINDER', {
      userId: user.id,
      daysRemaining,
    });
  }

  /**
   * Bloqueia usuário trial expirado
   */
  private async blockExpiredTrialUser(user: any): Promise<void> {
    // Atualizar usuário para free e bloqueado
    await storage.updateUser(user.id, {
      plano: 'free',
      status: 'bloqueado',
      data_expiracao_trial: null,
      data_expiracao_plano: null,
    });

    // Bloquear todos os funcionários desta conta
    if (storage.getFuncionarios) {
      const funcionarios = await storage.getFuncionarios();
      const funcionariosDaConta = funcionarios.filter(f => f.conta_id === user.id);

      for (const funcionario of funcionariosDaConta) {
        await storage.updateFuncionario(funcionario.id, {
          status: 'bloqueado',
        });
      }

      if (funcionariosDaConta.length > 0) {
        logger.info(`${funcionariosDaConta.length} funcionário(s) bloqueado(s) devido ao trial expirado`, 'PAYMENT_REMINDER', {
          userId: user.id,
        });
      }
    }

    // Enviar email de conta bloqueada
    await this.emailService.sendAccountBlocked({
      to: user.email,
      userName: user.nome,
      planName: 'Plano Trial',
    });

    logger.warn('Usuário trial expirado bloqueado', 'PAYMENT_REMINDER', {
      userId: user.id,
      userEmail: user.email,
    });
  }

  /**
   * Calcula diferença em dias entre duas datas
   */
  private getDaysDifference(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Inicia verificação automática (executar a cada 6 horas)
   */
  startAutoCheck(): void {
    // Executar imediatamente
    this.checkAndSendReminders();

    // Executar a cada 6 horas
    setInterval(() => {
      this.checkAndSendReminders();
    }, 6 * 60 * 60 * 1000);

    logger.info('Sistema de lembretes de pagamento iniciado', 'PAYMENT_REMINDER');
  }
}

export const paymentReminderService = new PaymentReminderService();