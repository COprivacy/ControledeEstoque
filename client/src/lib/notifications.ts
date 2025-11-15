
// Serviço de Notificações Push
export class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Permissão de notificações:', permission);
    return permission;
  }

  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registrado para notificações');
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    }
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission === 'granted') {
      if (this.registration) {
        // Usar Service Worker para notificação persistente
        await this.registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
          ...options,
        });
      } else {
        // Fallback para notificação simples
        new Notification(title, options);
      }
    }
  }

  // Notificações específicas do sistema
  async notifyLowStock(productName: string, quantity: number): Promise<void> {
    await this.sendNotification('⚠️ Estoque Baixo', {
      body: `${productName} está com apenas ${quantity} unidades`,
      tag: 'low-stock',
      requireInteraction: true,
    });
  }

  async notifyNewSale(value: number): Promise<void> {
    await this.sendNotification('🎉 Nova Venda', {
      body: `Venda de R$ ${value.toFixed(2)} registrada`,
      tag: 'new-sale',
    });
  }

  async notifyExpiringProduct(productName: string, days: number): Promise<void> {
    await this.sendNotification('📅 Produto Vencendo', {
      body: `${productName} vence em ${days} dias`,
      tag: 'expiring-product',
      requireInteraction: true,
    });
  }

  async notifyPaymentDue(description: string, value: number): Promise<void> {
    await this.sendNotification('💰 Pagamento Pendente', {
      body: `${description} - R$ ${value.toFixed(2)}`,
      tag: 'payment-due',
      requireInteraction: true,
    });
  }
}

export const notificationService = NotificationService.getInstance();
