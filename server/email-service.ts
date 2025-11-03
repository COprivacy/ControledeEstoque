
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailConfig {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private logoBase64: string;

  constructor() {
    // Carregar logo em base64
    const logoPath = path.join(process.cwd(), 'attached_assets', 'generated_images', 'Pavisoft_Sistemas_email_header_logo_bee66462.png');
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      this.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('⚠️ Logo não encontrado, usando banner padrão');
      this.logoBase64 = '';
    }
    
    // Configurar com variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'pavisoft.planos@gmail.com',
        pass: process.env.SMTP_PASS || 'bwks idip qyen kbnd',
      },
    });
    
    // Verificar conexão SMTP ao inicializar
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Erro ao conectar com servidor SMTP:', error);
      } else {
        console.log('✅ Servidor SMTP pronto para enviar emails');
      }
    });
  }

  async sendVerificationCode(config: {
    to: string;
    userName: string;
    code: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
          .email-wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .banner { width: 100%; height: 180px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .banner img { width: 100%; height: 100%; object-fit: cover; }
          .banner-content { text-align: center; color: white; }
          .logo-text { font-size: 36px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
          .logo-subtitle { font-size: 14px; opacity: 0.95; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
          .message { color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
          .code-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px dashed #3b82f6; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; }
          .code { font-size: 48px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .code-label { color: #1e40af; font-size: 14px; margin-bottom: 15px; font-weight: 600; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .warning p { color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: flex-start; }
          .warning p::before { content: "⚠️"; margin-right: 10px; font-size: 18px; flex-shrink: 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-logo { font-size: 20px; font-weight: bold; color: #3b82f6; margin-bottom: 8px; }
          .footer-text { color: #6b7280; font-size: 13px; line-height: 1.8; }
          .footer-divider { width: 50px; height: 2px; background: #3b82f6; margin: 15px auto; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .logo-text { font-size: 28px; }
            .code { font-size: 36px; letter-spacing: 4px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <div class="banner">
              ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="Pavisoft Sistemas" />` : `
              <div class="banner-content">
                <div class="logo-text">PAVISOFT</div>
                <div class="logo-subtitle">Sistemas de Gestão</div>
              </div>
              `}
            </div>

            <div class="content">
              <div class="greeting">Olá, <strong>${config.userName}</strong>! 👋</div>
              
              <p class="message">
                Você solicitou a redefinição de senha da sua conta. 
                Use o código abaixo para confirmar que é realmente você:
              </p>

              <div class="code-box">
                <div class="code-label">SEU CÓDIGO DE VERIFICAÇÃO</div>
                <div class="code">${config.code}</div>
              </div>

              <div class="warning">
                <p>
                  <strong>Este código expira em 10 minutos.</strong> 
                  Se você não solicitou esta alteração, ignore este email e sua senha permanecerá a mesma.
                </p>
              </div>

              <p class="message">
                Por segurança, nunca compartilhe este código com ninguém, nem mesmo com a equipe do Pavisoft.
              </p>
            </div>

            <div class="footer">
              <div class="footer-logo">PAVISOFT SISTEMAS</div>
              <div class="footer-divider"></div>
              <p class="footer-text">
                Sistema Completo de Gestão Empresarial<br>
                PDV | Estoque | Financeiro | NFCe<br><br>
                <em>Este é um email automático de segurança. Por favor, não responda.</em>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pavisoft.com',
      to: config.to,
      subject: '🔐 Código de Verificação - Pavisoft Sistemas',
      html,
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
          .email-wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .banner { width: 100%; height: 180px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .banner img { width: 100%; height: 100%; object-fit: cover; }
          .banner-content { text-align: center; color: white; }
          .logo-text { font-size: 36px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
          .logo-subtitle { font-size: 14px; opacity: 0.95; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
          .message { color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
          .highlight-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .highlight-box h3 { color: #1e40af; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; }
          .highlight-box h3::before { content: "📦"; margin-right: 10px; font-size: 20px; }
          .detail-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-item:last-child { border-bottom: none; }
          .detail-label { color: #6b7280; font-size: 14px; }
          .detail-value { color: #111827; font-weight: 600; font-size: 14px; }
          .cta-button { display: block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white !important; text-decoration: none; padding: 16px 32px; text-align: center; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 30px 0; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: all 0.3s; }
          .cta-button:hover { box-shadow: 0 6px 12px rgba(37, 99, 235, 0.4); transform: translateY(-2px); }
          .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .info-box p { color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: flex-start; }
          .info-box p::before { content: "⏰"; margin-right: 10px; font-size: 18px; flex-shrink: 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-logo { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 8px; }
          .footer-text { color: #6b7280; font-size: 13px; line-height: 1.8; }
          .footer-divider { width: 50px; height: 2px; background: #2563eb; margin: 15px auto; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .logo-text { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <!-- Banner com Logo -->
            <div class="banner">
              ${this.logoBase64 ? `<img src="${this.logoBase64}" alt="Pavisoft Sistemas" />` : `
              <div class="banner-content">
                <div class="logo-text">PAVISOFT</div>
                <div class="logo-subtitle">Sistemas de Gestão</div>
              </div>
              `}
            </div>

            <!-- Conteúdo -->
            <div class="content">
              <div class="greeting">Olá, <strong>${config.userName}</strong>! 👋</div>
              
              <p class="message">
                Ficamos felizes em informar que você selecionou o <strong>${config.packageName}</strong> 
                para expandir sua equipe no Pavisoft Sistemas!
              </p>

              <!-- Detalhes da Compra -->
              <div class="highlight-box">
                <h3>Resumo do Pedido</h3>
                <div class="detail-item">
                  <span class="detail-label">Pacote Selecionado</span>
                  <span class="detail-value">${config.packageName}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Funcionários Adicionais</span>
                  <span class="detail-value">+${config.quantity} colaboradores</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Valor Total</span>
                  <span class="detail-value" style="color: #2563eb; font-size: 18px;">R$ ${config.price.toFixed(2)}</span>
                </div>
              </div>

              <p class="message">
                Para completar sua compra e ativar os novos funcionários, 
                clique no botão abaixo para realizar o pagamento:
              </p>

              <a href="${config.paymentUrl}" class="cta-button">
                🔒 Realizar Pagamento Seguro
              </a>

              <!-- Aviso Importante -->
              <div class="info-box">
                <p>
                  <strong>Seu limite de funcionários será aumentado automaticamente</strong> 
                  assim que o pagamento for confirmado pelo sistema Asaas. 
                  Você receberá um email de confirmação quando isso acontecer.
                </p>
              </div>

              <p class="message" style="margin-top: 30px;">
                Se tiver alguma dúvida, nossa equipe está à disposição para ajudar!
              </p>
            </div>

            <!-- Rodapé -->
            <div class="footer">
              <div class="footer-logo">PAVISOFT SISTEMAS</div>
              <div class="footer-divider"></div>
              <p class="footer-text">
                Sistema Completo de Gestão Empresarial<br>
                PDV | Estoque | Financeiro | NFCe<br><br>
                <em>Este é um email automático. Por favor, não responda.</em>
              </p>
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

  async sendPasswordResetConfirmation(config: {
    to: string;
    userName: string;
    resetByAdmin: string;
    resetDate: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
          .email-wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .banner { width: 100%; height: 180px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
          .banner img { width: 100%; height: 100%; object-fit: cover; }
          .banner-content { text-align: center; color: white; }
          .logo-text { font-size: 36px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
          .logo-subtitle { font-size: 14px; opacity: 0.95; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
          .message { color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
          .alert-box { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .alert-box-icon { font-size: 48px; text-align: center; margin-bottom: 10px; }
          .alert-box-text { color: #991b1b; font-size: 16px; text-align: center; font-weight: 600; }
          .info-grid { background: #f9fafb; border: 2px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .info-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .info-item:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-size: 14px; }
          .info-value { color: #111827; font-weight: 600; font-size: 14px; }
          .security-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .security-note p { color: #92400e; font-size: 14px; margin: 0; display: flex; align-items: flex-start; }
          .security-note p::before { content: "🔒"; margin-right: 10px; font-size: 18px; flex-shrink: 0; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-logo { font-size: 20px; font-weight: bold; color: #ef4444; margin-bottom: 8px; }
          .footer-text { color: #6b7280; font-size: 13px; line-height: 1.8; }
          .footer-divider { width: 50px; height: 2px; background: #ef4444; margin: 15px auto; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .logo-text { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <!-- Banner com Logo -->
            <div class="banner">
              <div class="banner-content">
                <div class="logo-text">PAVISOFT</div>
                <div class="logo-subtitle">Sistemas de Gestão</div>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="content">
              <div class="greeting">Olá, <strong>${config.userName}</strong>! 👋</div>

              <!-- Alerta de Segurança -->
              <div class="alert-box">
                <div class="alert-box-icon">🔐</div>
                <div class="alert-box-text">Sua senha foi redefinida</div>
              </div>
              
              <p class="message">
                Informamos que sua senha de acesso ao sistema Pavisoft foi redefinida pelo administrador da conta.
              </p>

              <!-- Detalhes da Alteração -->
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Redefinido por</span>
                  <span class="info-value">${config.resetByAdmin}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Data e Hora</span>
                  <span class="info-value">${config.resetDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email da conta</span>
                  <span class="info-value">${config.to}</span>
                </div>
              </div>

              <!-- Nota de Segurança -->
              <div class="security-note">
                <p>
                  <strong>Por segurança, recomendamos que você altere sua senha no primeiro acesso.</strong> 
                  Vá em Configurações → Alterar Senha após fazer login.
                </p>
              </div>

              <p class="message" style="margin-top: 30px;">
                Se você não solicitou esta alteração ou não reconhece esta atividade, 
                entre em contato com o administrador da sua conta imediatamente.
              </p>
            </div>

            <!-- Rodapé -->
            <div class="footer">
              <div class="footer-logo">PAVISOFT SISTEMAS</div>
              <div class="footer-divider"></div>
              <p class="footer-text">
                Sistema Completo de Gestão Empresarial<br>
                PDV | Estoque | Financeiro | NFCe<br><br>
                Dúvidas? Entre em contato: pavisoft.planos@gmail.com<br>
                <em>Este é um email automático de segurança. Por favor, não responda.</em>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@pavisoft.com',
      to: config.to,
      subject: '🔐 Senha Redefinida - Pavisoft Sistemas',
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
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f3f4f6; }
          .email-wrapper { width: 100%; background-color: #f3f4f6; padding: 40px 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .banner { width: 100%; height: 180px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); position: relative; display: flex; align-items: center; justify-content: center; }
          .banner-content { text-align: center; color: white; }
          .logo-text { font-size: 36px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
          .logo-subtitle { font-size: 14px; opacity: 0.95; letter-spacing: 2px; text-transform: uppercase; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
          .message { color: #4b5563; font-size: 15px; line-height: 1.8; margin-bottom: 20px; }
          .success-banner { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
          .success-banner-icon { font-size: 48px; margin-bottom: 10px; }
          .success-banner-text { color: #065f46; font-size: 18px; font-weight: 600; }
          .receipt-box { background: #f9fafb; border: 2px solid #e5e7eb; padding: 25px; border-radius: 8px; margin: 25px 0; }
          .receipt-title { color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 20px; display: flex; align-items: center; }
          .receipt-title::before { content: "📋"; margin-right: 10px; font-size: 20px; }
          .receipt-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .receipt-item:last-child { border-bottom: none; padding-bottom: 0; }
          .receipt-label { color: #6b7280; font-size: 14px; }
          .receipt-value { color: #111827; font-weight: 600; font-size: 14px; }
          .highlight-value { color: #10b981; font-size: 18px; font-weight: bold; }
          .action-box { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 20px; border-radius: 8px; margin: 25px 0; }
          .action-box p { color: #1e40af; font-size: 15px; margin: 0; display: flex; align-items: center; }
          .action-box p::before { content: "🚀"; margin-right: 10px; font-size: 20px; }
          .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-logo { font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 8px; }
          .footer-text { color: #6b7280; font-size: 13px; line-height: 1.8; }
          .footer-divider { width: 50px; height: 2px; background: #10b981; margin: 15px auto; }
          .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 20px 0; }
          .note p { color: #92400e; font-size: 13px; margin: 0; display: flex; align-items: flex-start; }
          .note p::before { content: "📌"; margin-right: 10px; font-size: 16px; flex-shrink: 0; }
          @media only screen and (max-width: 600px) {
            .email-wrapper { padding: 20px 10px; }
            .content { padding: 30px 20px; }
            .logo-text { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="container">
            <!-- Banner com Logo -->
            <div class="banner">
              <div class="banner-content">
                <div class="logo-text">PAVISOFT</div>
                <div class="logo-subtitle">Sistemas de Gestão</div>
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="content">
              <div class="greeting">Olá, <strong>${config.userName}</strong>! 👋</div>

              <!-- Banner de Sucesso -->
              <div class="success-banner">
                <div class="success-banner-icon">✅</div>
                <div class="success-banner-text">Pagamento Confirmado com Sucesso!</div>
              </div>
              
              <p class="message">
                Temos o prazer de informar que seu pagamento foi processado e confirmado. 
                <strong>Seu limite de funcionários foi aumentado imediatamente!</strong>
              </p>

              <!-- Recibo da Transação -->
              <div class="receipt-box">
                <div class="receipt-title">Recibo da Transação</div>
                <div class="receipt-item">
                  <span class="receipt-label">Pacote Adquirido</span>
                  <span class="receipt-value">${config.packageName}</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Funcionários Adicionados</span>
                  <span class="receipt-value">+${config.quantity} colaboradores</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Novo Limite Total</span>
                  <span class="highlight-value">${config.newLimit} funcionários</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Valor Pago</span>
                  <span class="receipt-value">R$ ${config.price.toFixed(2)}</span>
                </div>
                <div class="receipt-item">
                  <span class="receipt-label">Data da Ativação</span>
                  <span class="receipt-value">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <!-- Call to Action -->
              <div class="action-box">
                <p>
                  <strong>Você já pode cadastrar novos funcionários no sistema! Acesse o painel administrativo e comece agora mesmo.</strong>
                </p>
              </div>

              <!-- Nota -->
              <div class="note">
                <p>
                  Guarde este email como comprovante da sua transação. 
                  Ele contém todas as informações importantes sobre sua compra.
                </p>
              </div>

              <p class="message" style="margin-top: 30px;">
                Obrigado por escolher o Pavisoft Sistemas! Estamos aqui para ajudar sua empresa a crescer.
              </p>
            </div>

            <!-- Rodapé -->
            <div class="footer">
              <div class="footer-logo">PAVISOFT SISTEMAS</div>
              <div class="footer-divider"></div>
              <p class="footer-text">
                Sistema Completo de Gestão Empresarial<br>
                PDV | Estoque | Financeiro | NFCe<br><br>
                Dúvidas? Entre em contato: pavisoft.planos@gmail.com<br>
                <em>Este é um email automático. Por favor, não responda.</em>
              </p>
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
