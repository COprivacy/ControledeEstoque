
import nodemailer from 'nodemailer';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar com variáveis de ambiente ou usar serviço de email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmployeePackagePurchased(config: {
    to: string;
    userName: string;
    packageName: string;
    quantity: number;
    price: number;
    paymentUrl: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Pacote de Funcionários Selecionado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${config.userName}</strong>,</p>
            
            <p>Você selecionou o pacote <strong>${config.packageName}</strong> para expandir sua equipe no Pavisoft!</p>
            
            <div class="details">
              <h3>📋 Detalhes da Compra:</h3>
              <ul>
                <li><strong>Pacote:</strong> ${config.packageName}</li>
                <li><strong>Funcionários adicionais:</strong> ${config.quantity}</li>
                <li><strong>Valor:</strong> R$ ${config.price.toFixed(2)}</li>
              </ul>
            </div>

            <p>Para completar sua compra, clique no botão abaixo:</p>
            
            <a href="${config.paymentUrl}" class="button">Realizar Pagamento</a>

            <p><strong>⏰ Importante:</strong> Seu limite de funcionários será aumentado automaticamente assim que o pagamento for confirmado.</p>

            <p>Você receberá outro email quando o pagamento for confirmado pela Asaas.</p>

            <div class="footer">
              <p>Pavisoft - Sistema de Gestão Empresarial</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pavisoft.com',
      to: config.to,
      subject: `${config.packageName} - Aguardando Pagamento`,
      html,
    });
  }

  async sendEmployeePackageActivated(config: {
    to: string;
    userName: string;
    packageName: string;
    quantity: number;
    newLimit: number;
    price: number;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 6px; }
          .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${config.userName}</strong>,</p>
            
            <div class="success-box">
              <p><strong>🎉 Seu limite de funcionários foi aumentado com sucesso!</strong></p>
            </div>

            <div class="details">
              <h3>📋 Recibo da Transação:</h3>
              <ul>
                <li><strong>Pacote:</strong> ${config.packageName}</li>
                <li><strong>Funcionários adicionados:</strong> +${config.quantity}</li>
                <li><strong>Novo limite total:</strong> ${config.newLimit} funcionários</li>
                <li><strong>Valor pago:</strong> R$ ${config.price.toFixed(2)}</li>
                <li><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>

            <p>Você já pode cadastrar novos funcionários no sistema! 🚀</p>

            <p><em>Guarde este email como comprovante da sua transação.</em></p>

            <div class="footer">
              <p>Pavisoft - Sistema de Gestão Empresarial</p>
              <p>Este é um email automático, não responda.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pavisoft.com',
      to: config.to,
      subject: `✅ ${config.packageName} Ativado - Recibo`,
      html,
    });
  }
}
