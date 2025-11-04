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
      await this.paymentClient.search({
        options: {
          limit: 1,
        }
      });
      return { success: true, message: 'Conexão estabelecida com sucesso com o Mercado Pago!' };
    } catch (error: any) {
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

      if (params.notification_url) {
        body.notification_url = params.notification_url;
      } else {
        body.notification_url = `${baseUrl}/api/webhook/mercadopago`;
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
