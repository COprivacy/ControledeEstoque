import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

interface MercadoPagoConfigParams {
  accessToken: string;
}

interface MercadoPagoCustomer {
  name: string;
  email: string;
  identification?: {
    type: string;
    number: string;
  };
}

interface MercadoPagoPreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
  description?: string;
}

interface MercadoPagoPreferenceParams {
  items: MercadoPagoPreferenceItem[];
  payer: {
    email: string;
    name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: string;
  external_reference?: string;
  notification_url?: string;
}

export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor(config: MercadoPagoConfigParams) {
    this.client = new MercadoPagoConfig({
      accessToken: config.accessToken,
      options: {
        timeout: 5000,
      }
    });
    
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Testa a conexão fazendo uma busca simples de pagamentos
      // Endpoint mais confiável que aceita credenciais de teste e produção
      const response = await fetch('https://api.mercadopago.com/v1/payments/search?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.client.options.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { 
          success: true, 
          message: 'Conexão estabelecida com sucesso com o Mercado Pago!' 
        };
      } else if (response.status === 401) {
        return {
          success: false,
          message: 'Access Token inválido. Verifique suas credenciais no painel do Mercado Pago.'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'Acesso negado. Verifique as permissões do seu Access Token.'
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          message: errorData.message || `Erro HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      // Erro de rede ou outro erro não relacionado à API
      if (error.message && error.message.includes('fetch')) {
        return { 
          success: false, 
          message: 'Erro de conexão. Verifique sua internet ou se o Mercado Pago está acessível.'
        };
      }
      return { 
        success: false, 
        message: error.message || 'Erro ao conectar com o Mercado Pago' 
      };
    }
  }

  async createPreference(params: MercadoPagoPreferenceParams) {
    try {
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : 'http://localhost:5000';

      const body: any = {
        items: params.items,
        payer: params.payer,
        back_urls: {
          success: `${baseUrl}/planos?status=success`,
          failure: `${baseUrl}/planos?status=failure`,
          pending: `${baseUrl}/planos?status=pending`,
          ...params.back_urls,
        },
        auto_return: params.auto_return || 'approved',
        external_reference: params.external_reference,
      };

      // Usar notification_url fornecido ou gerar padrão
      // O webhook será configurado no painel quando o usuário tiver domínio premium
      if (params.notification_url) {
        body.notification_url = params.notification_url;
      }

      const result = await this.preferenceClient.create({ body });
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao criar preferência de pagamento');
    }
  }

  async getPayment(paymentId: string) {
    try {
      const result = await this.paymentClient.get({ id: paymentId });
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao buscar pagamento');
    }
  }

  async searchPayments(params?: { external_reference?: string; limit?: number }) {
    try {
      const result = await this.paymentClient.search({
        options: {
          external_reference: params?.external_reference,
          limit: params?.limit || 10,
        }
      });
      return result;
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao buscar pagamentos');
    }
  }
}

export type { 
  MercadoPagoConfigParams, 
  MercadoPagoCustomer, 
  MercadoPagoPreferenceItem,
  MercadoPagoPreferenceParams
};
