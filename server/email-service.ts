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

  // Template base para todos os emails
  private getBaseTemplate(content: string, backgroundColor: string = '#f8fafc'): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Pavisoft Sistemas</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${backgroundColor};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${backgroundColor}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">

          <!-- Header com Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 48px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border-radius: 12px; padding: 20px; display: inline-block;">
                      <h1 style="font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1px;">PAVISOFT</h1>
                      <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #60a5fa, #3b82f6); margin: 12px auto; border-radius: 2px;"></div>
                      <p style="font-size: 13px; color: rgba(255, 255, 255, 0.9); margin: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">Sistemas de Gestão</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Conteúdo -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="background: linear-gradient(to bottom, #f8fafc, #f1f5f9); padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <h3 style="font-size: 18px; font-weight: 700; color: #1e3a8a; margin: 0 0 8px 0; letter-spacing: 0.5px;">PAVISOFT SISTEMAS</h3>
                    <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #3b82f6, #60a5fa); margin: 12px auto; border-radius: 2px;"></div>
                    <p style="color: #64748b; font-size: 13px; line-height: 1.8; margin: 16px 0 0 0;">
                      <strong style="color: #475569;">Gestão Empresarial Completa</strong><br>
                      PDV • Estoque • Financeiro • NFCe • Relatórios<br><br>
                      <span style="font-size: 12px; color: #94a3b8;">
                        📧 pavisoft.planos@gmail.com<br>
                        🌐 www.pavisoft.com.br
                      </span>
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 20px 0 0 0; font-style: italic;">
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  async sendPasswordResetCode(config: {
    to: string;
    userName: string;
    code: string;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Use o código de verificação abaixo para confirmar sua identidade e criar uma nova senha.
          </p>

          <!-- Code Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 32px; text-align: center;">
                <p style="color: #1e40af; font-size: 13px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px;">
                  SEU CÓDIGO DE RECUPERAÇÃO
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);">
                  <p style="font-size: 42px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; margin: 0;">
                    ${config.code}
                  </p>
                </div>
                <p style="color: #3b82f6; font-size: 12px; margin: 16px 0 0 0; font-weight: 500;">
                  Válido por 15 minutos
                </p>
              </td>
            </tr>
          </table>

          <!-- Warning Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>⚠️ Importante:</strong> Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá inalterada e sua conta continuará segura.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 24px 0 0 0;">
            <strong style="color: #475569;">Dica de segurança:</strong> Nunca compartilhe este código com ninguém, nem mesmo com a equipe do Pavisoft. Nossos funcionários jamais solicitarão este código.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#eff6ff');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: '🔐 Código de Recuperação de Senha - Pavisoft Sistemas',
      html,
    });
  }

  async sendVerificationCode(config: {
    to: string;
    userName: string;
    code: string;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Use o código de verificação abaixo para confirmar sua identidade e criar uma nova senha.
          </p>

          <!-- Code Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 32px; text-align: center;">
                <p style="color: #1e40af; font-size: 13px; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px;">
                  SEU CÓDIGO DE VERIFICAÇÃO
                </p>
                <div style="background: #ffffff; border-radius: 8px; padding: 20px; margin: 0 auto; display: inline-block; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);">
                  <p style="font-size: 42px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; margin: 0;">
                    ${config.code}
                  </p>
                </div>
                <p style="color: #3b82f6; font-size: 12px; margin: 16px 0 0 0; font-weight: 500;">
                  Válido por 10 minutos
                </p>
              </td>
            </tr>
          </table>

          <!-- Warning Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>⚠️ Importante:</strong> Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá inalterada e sua conta continuará segura.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 24px 0 0 0;">
            <strong style="color: #475569;">Dica de segurança:</strong> Nunca compartilhe este código com ninguém, nem mesmo com a equipe do Pavisoft. Nossos funcionários jamais solicitarão este código.
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#eff6ff');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
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
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>
          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
            Ficamos felizes em informar que você selecionou o <strong style="color: #1e40af;">${config.packageName}</strong> para expandir sua equipe no Pavisoft Sistemas!
          </p>

          <!-- Resumo do Pedido -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #0c4a6e; font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  📦 Resumo do Pedido
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <span style="color: #0369a1; font-size: 14px;">Pacote Selecionado</span>
                    </td>
                    <td align="right" style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <strong style="color: #0c4a6e; font-size: 14px;">${config.packageName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <span style="color: #0369a1; font-size: 14px;">Funcionários Adicionais</span>
                    </td>
                    <td align="right" style="padding: 12px 0; border-bottom: 1px solid #bae6fd;">
                      <strong style="color: #0c4a6e; font-size: 14px;">+${config.quantity} colaboradores</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 0 0;">
                      <span style="color: #0369a1; font-size: 14px;">Valor Total</span>
                    </td>
                    <td align="right" style="padding: 16px 0 0 0;">
                      <strong style="color: #0ea5e9; font-size: 22px; font-weight: 700;">R$ ${config.price.toFixed(2)}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Para completar sua compra e ativar os novos funcionários, clique no botão abaixo para realizar o pagamento de forma segura:
          </p>

          <!-- CTA Button -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
            <tr>
              <td align="center">
                <a href="${config.paymentUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s;">
                  🔒 Realizar Pagamento Seguro
                </a>
              </td>
            </tr>
          </table>

          <!-- Info Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
            <tr>
              <td style="background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
                <p style="color: #065f46; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>✅ Ativação Automática:</strong> Seu limite de funcionários será aumentado automaticamente assim que o pagamento for confirmado. Você receberá um email de confirmação imediatamente.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Dúvidas? Nossa equipe está à disposição para ajudar. Entre em contato conosco através do email <a href="mailto:pavisoft.planos@gmail.com" style="color: #3b82f6; text-decoration: none;">pavisoft.planos@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content);

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: `💼 ${config.packageName} - Aguardando Pagamento`,
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
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>

          <!-- Success Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                <p style="color: #065f46; font-size: 20px; font-weight: 700; margin: 0;">
                  Pagamento Confirmado com Sucesso!
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Temos o prazer de informar que seu pagamento foi processado e confirmado. <strong style="color: #10b981;">Seu limite de funcionários foi aumentado imediatamente!</strong>
          </p>

          <!-- Recibo da Transação -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Recibo da Transação
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Pacote Adquirido</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.packageName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Funcionários Adicionados</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">+${config.quantity} colaboradores</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Novo Limite Total</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #10b981; font-size: 18px;">${config.newLimit} funcionários</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Valor Pago</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">R$ ${config.price.toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #64748b; font-size: 14px;">Data da Ativação</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #1e293b; font-size: 14px;">${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Call to Action -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
                <p style="color: #1e40af; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 500;">
                  <strong>🚀 Próximo Passo:</strong> Você já pode cadastrar novos funcionários no sistema! Acesse o painel administrativo e comece agora mesmo.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Obrigado por escolher o Pavisoft Sistemas! Estamos aqui para ajudar sua empresa a crescer. 🎉
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#f0fdf4');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: `✅ ${config.packageName} Ativado - Recibo de Pagamento`,
      html,
    });
  }

  async sendPasswordResetConfirmation(config: {
    to: string;
    userName: string;
    resetByAdmin: string;
    resetDate: string;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>

          <!-- Alerta de Segurança -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
                <p style="color: #991b1b; font-size: 18px; font-weight: 700; margin: 0;">
                  Sua Senha Foi Redefinida
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Informamos que sua senha de acesso ao sistema Pavisoft foi redefinida pelo administrador da sua conta por motivos de segurança.
          </p>

          <!-- Detalhes da Alteração -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 20px 0;">
                  Detalhes da Alteração
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Redefinido por</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.resetByAdmin}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Data e Hora</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.resetDate}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #64748b; font-size: 14px;">Email da Conta</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.to}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Nota de Segurança -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>🔒 Recomendação de Segurança:</strong> Altere sua senha no primeiro acesso. Vá em <strong>Configurações → Alterar Senha</strong> após fazer login.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Se você não reconhece esta atividade, entre em contato com o administrador da sua conta imediatamente através do email <a href="mailto:pavisoft.planos@gmail.com" style="color: #3b82f6; text-decoration: none;">pavisoft.planos@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#fef2f2');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: '🔐 Senha Redefinida - Pavisoft Sistemas',
      html,
    });
  }

  async sendPaymentPendingReminder(config: {
    to: string;
    userName: string;
    planName: string;
    daysWaiting: number;
    amount: number;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>

          <!-- Warning Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
                <p style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  Pagamento Pendente
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  Aguardando há ${config.daysWaiting} dias
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Identificamos que o pagamento do seu plano <strong style="color: #1e40af;">${config.planName}</strong> ainda está pendente.
          </p>

          <!-- Detalhes do Pagamento -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #92400e; font-size: 14px;">Plano</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #78350f; font-size: 14px;">${config.planName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #92400e; font-size: 14px;">Valor</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #f59e0b; font-size: 22px;">R$ ${config.amount.toFixed(2)}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #92400e; font-size: 14px;">Aguardando há</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #78350f; font-size: 14px;">${config.daysWaiting} dias</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Para continuar aproveitando todos os recursos do sistema sem interrupções, complete o pagamento o quanto antes.
          </p>

          <!-- Info Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
            <tr>
              <td style="background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>ℹ️ Precisa de Ajuda?</strong> Nossa equipe está disponível para auxiliá-lo. Entre em contato através do email pavisoft.planos@gmail.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#fffbeb');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: '⏰ Lembrete: Pagamento Pendente - Pavisoft',
      html,
    });
  }

  async sendExpirationWarning(config: {
    to: string;
    userName: string;
    planName: string;
    daysRemaining: number;
    expirationDate: string;
    amount: number;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>

          <!-- Warning Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔔</div>
                <p style="color: #1e40af; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  Seu Plano Vence em ${config.daysRemaining} Dias
                </p>
                <p style="color: #1e40af; font-size: 14px; margin: 0;">
                  Data de vencimento: ${config.expirationDate}
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Seu plano <strong style="color: #1e40af;">${config.planName}</strong> está próximo do vencimento. Renove agora para manter o acesso ininterrupto a todos os recursos do sistema.
          </p>

          <!-- Detalhes da Renovação -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #0369a1; font-size: 14px;">Plano Atual</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #0c4a6e; font-size: 14px;">${config.planName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #0369a1; font-size: 14px;">Vence em</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #0c4a6e; font-size: 14px;">${config.daysRemaining} dias</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #0369a1; font-size: 14px;">Data de Vencimento</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #0c4a6e; font-size: 14px;">${config.expirationDate}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 0 0;">
                      <span style="color: #0369a1; font-size: 14px;">Valor da Renovação</span>
                    </td>
                    <td align="right" style="padding: 16px 0 0 0;">
                      <strong style="color: #0ea5e9; font-size: 22px;">R$ ${config.amount.toFixed(2)}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Benefícios -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 8px; padding: 20px;">
                <p style="color: #065f46; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                  ✨ Ao renovar, você continua com acesso a:
                </p>
                <ul style="color: #065f46; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>PDV Completo com NFCe</li>
                  <li>Gestão de Estoque em Tempo Real</li>
                  <li>Controle Financeiro Avançado</li>
                  <li>Relatórios Detalhados</li>
                  <li>Suporte Técnico Especializado</li>
                </ul>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Para renovar ou esclarecer dúvidas, entre em contato conosco através do email <a href="mailto:pavisoft.planos@gmail.com" style="color: #3b82f6; text-decoration: none;">pavisoft.planos@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#eff6ff');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: `🔔 Seu plano vence em ${config.daysRemaining} dias - Pavisoft`,
      html,
    });
  }

  async sendOverdueNotice(config: {
    to: string;
    userName: string;
    planName: string;
    daysOverdue: number;
    amount: number;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}! 👋
          </p>

          <!-- Alert Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                <p style="color: #991b1b; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  Pagamento Atrasado
                </p>
                <p style="color: #991b1b; font-size: 14px; margin: 0;">
                  ${config.daysOverdue} dias de atraso
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            <strong style="color: #ef4444;">ATENÇÃO:</strong> O pagamento do seu plano <strong style="color: #1e40af;">${config.planName}</strong> está atrasado há ${config.daysOverdue} dias.
          </p>

          <!-- Detalhes do Pagamento -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #991b1b; font-size: 14px;">Plano</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #7f1d1d; font-size: 14px;">${config.planName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #991b1b; font-size: 14px;">Dias de Atraso</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #7f1d1d; font-size: 14px;">${config.daysOverdue} dias</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 0 0 0;">
                      <span style="color: #991b1b; font-size: 14px;">Valor em Aberto</span>
                    </td>
                    <td align="right" style="padding: 16px 0 0 0;">
                      <strong style="color: #ef4444; font-size: 22px;">R$ ${config.amount.toFixed(2)}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Warning Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>⚠️ Ação Necessária:</strong> Regularize sua situação o quanto antes para evitar o bloqueio temporário da sua conta e perda de dados.
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Caso tenha dúvidas ou precise de suporte para realizar o pagamento, nossa equipe está à disposição.
          </p>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Entre em contato: <a href="mailto:pavisoft.planos@gmail.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">pavisoft.planos@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#fef2f2');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: '⚠️ URGENTE: Pagamento Atrasado - Pavisoft',
      html,
    });
  }

  async sendAccountClosureRequest(config: {
    userEmail: string;
    userName: string;
    userId: string;
    motivo: string;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <!-- Alert Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 28px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
                <p style="color: #92400e; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
                  Solicitação de Encerramento de Conta
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  Ação necessária do administrador
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Um usuário solicitou o encerramento de sua conta no sistema Pavisoft. Veja os detalhes abaixo:
          </p>

          <!-- Detalhes do Usuário -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 20px 0;">
                  Informações do Usuário
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Nome</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.userName}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <span style="color: #64748b; font-size: 14px;">Email</span>
                    </td>
                    <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.userEmail}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0;">
                      <span style="color: #64748b; font-size: 14px;">ID do Usuário</span>
                    </td>
                    <td align="right" style="padding: 10px 0;">
                      <strong style="color: #1e293b; font-size: 14px;">${config.userId}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Motivo do Encerramento -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #92400e; font-size: 15px; font-weight: 700; margin: 0 0 12px 0;">
                  Motivo do Encerramento:
                </p>
                <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">
                  ${config.motivo}
                </p>
              </td>
            </tr>
          </table>

          <!-- Ações Recomendadas -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: #dbeafe; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px;">
                <p style="color: #1e40af; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                  📋 Próximas Ações:
                </p>
                <ul style="color: #1e40af; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Entrar em contato com o usuário para confirmar</li>
                  <li>Oferecer suporte caso haja problemas</li>
                  <li>Processar o encerramento se confirmado</li>
                  <li>Manter dados por 30 dias para recuperação</li>
                </ul>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            <strong>Data da Solicitação:</strong> ${new Date().toLocaleString('pt-BR')}
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#fffbeb');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: 'pavisoft.suporte@gmail.com',
      subject: '⚠️ Solicitação de Encerramento de Conta - Pavisoft',
      html,
      replyTo: config.userEmail,
    });
  }

  async sendAccountBlocked(config: {
    to: string;
    userName: string;
    planName: string;
  }) {
    const content = `
<tr>
  <td style="padding: 48px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <p style="font-size: 18px; color: #1e293b; margin: 0 0 8px 0; font-weight: 600;">
            Olá, ${config.userName}
          </p>

          <!-- Alert Banner -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%); border: 2px solid #7f1d1d; border-radius: 12px; padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
                <p style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">
                  Conta Bloqueada
                </p>
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0;">
                  Acesso temporariamente suspenso
                </p>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 24px 0;">
            Informamos que sua conta foi bloqueada devido à falta de pagamento do plano <strong style="color: #991b1b;">${config.planName}</strong>.
          </p>

          <!-- Info Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 28px; margin: 32px 0;">
            <tr>
              <td>
                <p style="color: #1e293b; font-size: 15px; font-weight: 700; margin: 0 0 16px 0;">
                  O que acontece agora?
                </p>
                <ul style="color: #64748b; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li style="margin-bottom: 8px;">Seu acesso ao sistema foi temporariamente suspenso</li>
                  <li style="margin-bottom: 8px;">Seus dados permanecem seguros em nossos servidores</li>
                  <li style="margin-bottom: 8px;">Após regularização, o acesso será restaurado imediatamente</li>
                  <li>Dados podem ser perdidos após período prolongado de inatividade</li>
                </ul>
              </td>
            </tr>
          </table>

          <!-- CTA Box -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
            <tr>
              <td style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 4px solid #3b82f6; border-radius: 8px; padding: 24px;">
                <p style="color: #1e40af; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                  💡 Como Reativar Sua Conta
                </p>
                <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                  Para reativar sua conta, consulte nossos planos e faça o upgrade. Clique no botão abaixo para ver os detalhes:
                </p>
                <a href="https://www.pavisoft.com.br/plans" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 20px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.3s;">
                  💰 Ver Planos e Fazer Upgrade
                </a>
              </td>
            </tr>
          </table>

          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin: 32px 0 0 0;">
            Nossa equipe está pronta para ajudá-lo a resolver esta situação o mais rápido possível. Aguardamos seu contato.
          </p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.7; margin-top: 8px;">
            Você também pode entrar em contato diretamente pelo email: <a href="mailto:pavisoft.planos@gmail.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">pavisoft.planos@gmail.com</a>
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>
    `;

    const html = this.getBaseTemplate(content, '#fef2f2');

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'Pavisoft Sistemas <noreply@pavisoft.com>',
      to: config.to,
      subject: '🔒 Conta Bloqueada - Ação Necessária - Pavisoft',
      html,
    });
  }
}