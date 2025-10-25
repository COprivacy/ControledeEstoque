
interface AsaasConfig {
  apiKey: string;
  ambiente: 'sandbox' | 'production';
}

interface AsaasCustomer {
  name: string;
  email: string;
  cpfCnpj?: string;
}

interface AsaasPayment {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  dueDate: string;
  description?: string;
}

export class AsaasService {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.ambiente === 'production' 
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || `Erro na API Asaas: ${response.status}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('/customers?limit=1');
      return { success: true, message: 'Conexão estabelecida com sucesso!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao conectar com a Asaas' };
    }
  }

  async createCustomer(customer: AsaasCustomer) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async getCustomer(customerId: string) {
    return this.request(`/customers/${customerId}`);
  }

  async createPayment(payment: AsaasPayment) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  async getPayment(paymentId: string) {
    return this.request(`/payments/${paymentId}`);
  }

  async getAccountInfo() {
    return this.request('/myAccount');
  }
}
