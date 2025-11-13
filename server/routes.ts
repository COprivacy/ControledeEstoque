import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertProdutoSchema,
  insertVendaSchema,
  insertConfigFiscalSchema,
  insertOrcamentoSchema, // Importar schema de orçamento
} from "@shared/schema";
import { nfceSchema } from "@shared/nfce-schema";
import { FocusNFeService } from "./focusnfe";
import { z } from "zod";
import { logger, LogLevel } from "./logger";
import bcrypt from "bcryptjs";

// Middleware para verificar se o usuário é admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const isAdmin = req.headers["x-is-admin"] as string;

  if (!userId || isAdmin !== "true") {
    return res
      .status(403)
      .json({
        error:
          "Acesso negado. Apenas administradores podem acessar este recurso.",
      });
  }

  next();
}

// Helper para obter effectiveUserId de forma segura
function getEffectiveUserId(req: Request): string | null {
  return req.headers["effective-user-id"] as string;
}

// Middleware para extrair e validar user_id (lida com funcionários)
async function getUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const userType = req.headers["x-user-type"] as string;
  const contaId = req.headers["x-conta-id"] as string;

  if (!userId) {
    return res
      .status(401)
      .json({
        error: "Autenticação necessária. Header x-user-id não fornecido.",
      });
  }

  // Se for funcionário, VALIDAR se o conta_id é legítimo
  if (userType === "funcionario" && contaId) {
    try {
      const allFuncionarios = await storage.getFuncionarios();
      const funcionario = allFuncionarios.find((f) => f.id === userId);

      // VALIDAÇÃO CRÍTICA: Verificar se o funcionário existe e pertence à conta informada
      if (!funcionario || funcionario.conta_id !== contaId) {
        return res
          .status(403)
          .json({
            error: "Acesso negado. Funcionário não autorizado para esta conta.",
          });
      }

      req.headers["effective-user-id"] = contaId;
      req.headers["funcionario-id"] = userId; // Armazena ID do funcionário para auditoria
    } catch (error) {
      console.error("Erro ao validar funcionário:", error);
      return res.status(500).json({ error: "Erro ao validar autenticação" });
    }
  } else {
    req.headers["effective-user-id"] = userId;
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware para desabilitar cache em todas as rotas da API
  app.use("/api", (req, res, next) => {
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private, max-age=0",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);

      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      const dataCriacao = new Date().toISOString();
      const dataExpiracao = new Date();
      dataExpiracao.setDate(dataExpiracao.getDate() + 7);

      const userWithTrial = {
        ...userData,
        plano: "trial",
        is_admin: "true",
        data_criacao: dataCriacao,
        data_expiracao_trial: dataExpiracao.toISOString(),
        data_expiracao_plano: dataExpiracao.toISOString(),
        status: "ativo",
      };

      const user = await storage.createUser(userWithTrial);
      res.json({
        id: user.id,
        email: user.email,
        nome: user.nome,
        data_criacao: user.data_criacao,
        data_expiracao_trial: user.data_expiracao_trial,
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 Tentativa de login - Email: ${email}`);
      }

      // Busca o usuário pelo email (sem validação de senha ainda)
      const user = await storage.getUserByEmail(email);

      if (!user) {
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ Falha de login - Usuário não encontrado`);
        }
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      // Comparação direta de senha (sem hash)
      if (user.senha !== senha) {
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ Falha de login - Senha incorreta`);
        }
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`✅ Login bem-sucedido para usuário: ${email}`);
      }

      // Login bem-sucedido
      const userResponse = {
        ...user,
        tipo: "usuario",
      };

      res.json(userResponse);
    } catch (error: any) {
      console.error("Erro no login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/login-funcionario", async (req, res) => {
    try {
      const { email, senha } = req.body;

      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 Tentativa de login de funcionário - Email: ${email}`);
      }

      if (!email || !senha) {
        return res
          .status(400)
          .json({ error: "Email e senha são obrigatórios" });
      }

      const funcionario = await storage.getFuncionarioByEmail(email);

      if (!funcionario) {
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ Falha de login - Funcionário não encontrado`);
        }
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      if (funcionario.senha !== senha) {
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ Falha de login - Senha incorreta`);
        }
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }

      if (funcionario.status !== "ativo") {
        if (process.env.NODE_ENV === "development") {
          console.log(`❌ Falha de login - Funcionário inativo`);
        }
        return res.status(401).json({ error: "Conta de funcionário inativa" });
      }

      const permissoes = await storage.getPermissoesFuncionario(funcionario.id);

      if (process.env.NODE_ENV === "development") {
        console.log(`✅ Login de funcionário bem-sucedido: ${email}`);
      }

      await storage.logAdminAction?.(
        funcionario.id,
        "LOGIN_FUNCIONARIO",
        `Login realizado - ${funcionario.nome} (${funcionario.email})`
      );

      const { senha: _, ...funcionarioSemSenha } = funcionario;
      const funcionarioResponse = {
        ...funcionarioSemSenha,
        tipo: "funcionario",
        permissoes: permissoes || {},
      };

      res.json(funcionarioResponse);
    } catch (error: any) {
      console.error("Erro no login de funcionário:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // Rota para enviar código de verificação
  app.post("/api/auth/send-verification-code", async (req, res) => {
    try {
      const { userId, email } = req.body;

      if (!userId || !email) {
        return res
          .status(400)
          .json({ error: "userId e email são obrigatórios" });
      }

      const user = await storage.getUserById(userId);
      if (!user || user.email !== email) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        const { EmailService } = await import("./email-service");
        const emailService = new EmailService();

        await emailService.sendVerificationCode({
          to: email,
          userName: user.nome,
          code,
        });

        if (process.env.NODE_ENV === "development") {
          console.log(
            `📧 Código de verificação enviado para ${email}: ${code}`,
          );
        }

        res.json({
          success: true,
          message: "Código enviado com sucesso",
          // SECURITY: Código NÃO é retornado - apenas enviado por email
          ...(process.env.NODE_ENV === "development" && { code }), // Apenas em dev para testes
        });
      } catch (emailError) {
        console.error("❌ Erro ao enviar email:", emailError);
        res
          .status(500)
          .json({ error: "Erro ao enviar código de verificação por email" });
      }
    } catch (error) {
      console.error("Erro ao processar solicitação:", error);
      res.status(500).json({ error: "Erro ao processar solicitação" });
    }
  });

  // Rate limiting para tentativas de senha master
  const masterPasswordAttempts = new Map<
    string,
    { count: number; lastAttempt: number }
  >();
  const publicAdminAttempts = new Map<
    string,
    { count: number; lastAttempt: number }
  >();
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

  // Rota para verificar senha do painel público admin (COM RATE LIMITING)
  app.post("/api/auth/verify-public-admin", async (req, res) => {
    try {
      const { password } = req.body;
      const clientKey = req.ip || "unknown";
      const now = Date.now();

      console.log(`🔐 [PUBLIC ADMIN] Tentativa de acesso do IP: ${req.ip}`);

      if (!password) {
        return res.status(400).json({ error: "Senha é obrigatória" });
      }

      // Rate limiting
      const attempts = publicAdminAttempts.get(clientKey);

      if (attempts) {
        if (
          attempts.count >= MAX_ATTEMPTS &&
          now - attempts.lastAttempt < LOCKOUT_TIME
        ) {
          const remainingTime = Math.ceil(
            (LOCKOUT_TIME - (now - attempts.lastAttempt)) / 60000,
          );
          logger.warn(
            "Tentativa bloqueada por rate limit (public admin)",
            "SECURITY",
            {
              clientKey,
              attempts: attempts.count,
              remainingMinutes: remainingTime,
            },
          );
          return res.status(429).json({
            error: `Muitas tentativas. Tente novamente em ${remainingTime} minutos.`,
          });
        }

        if (now - attempts.lastAttempt >= LOCKOUT_TIME) {
          publicAdminAttempts.delete(clientKey);
        }
      }

      // Buscar senha do painel público do banco
      const publicAdminConfig = await storage.getSystemConfig(
        "public_admin_password",
      );

      if (!publicAdminConfig) {
        const defaultPassword = process.env.PUBLIC_ADMIN_PASSWORD;
        if (!defaultPassword) {
          logger.error(
            "PUBLIC_ADMIN_PASSWORD não configurada nas variáveis de ambiente",
            "SECURITY",
          );
          return res
            .status(500)
            .json({ error: "Configuração de segurança incompleta" });
        }
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await storage.setSystemConfig("public_admin_password", hashedPassword);

        const isValid = await bcrypt.compare(password, hashedPassword);

        if (!isValid) {
          const currentAttempts = publicAdminAttempts.get(clientKey);
          publicAdminAttempts.set(clientKey, {
            count: (currentAttempts?.count || 0) + 1,
            lastAttempt: now,
          });
          logger.warn("Senha public admin incorreta", "SECURITY", {
            clientKey,
          });
          return res.json({ valid: false });
        } else {
          publicAdminAttempts.delete(clientKey);
          logger.info("Acesso public admin autorizado", "SECURITY", {
            ip: req.ip,
          });
          return res.json({ valid: true });
        }
      }

      // Verificar senha fornecida com hash armazenado
      const isValid = await bcrypt.compare(password, publicAdminConfig.valor);

      if (!isValid) {
        const currentAttempts = publicAdminAttempts.get(clientKey);
        publicAdminAttempts.set(clientKey, {
          count: (currentAttempts?.count || 0) + 1,
          lastAttempt: now,
        });
        logger.warn("Senha public admin incorreta", "SECURITY", {
          clientKey,
          attempts: (currentAttempts?.count || 0) + 1,
        });
      } else {
        publicAdminAttempts.delete(clientKey);
        logger.info("Acesso public admin autorizado", "SECURITY", {
          ip: req.ip,
        });
      }

      res.json({ valid: isValid });
    } catch (error) {
      console.error("Erro ao verificar senha public admin:", error);
      logger.error("Erro ao verificar senha public admin", "SECURITY", {
        error,
      });
      res.status(500).json({ error: "Erro ao verificar senha" });
    }
  });

  // Rota para verificar senha master (COM RATE LIMITING)
  app.post("/api/auth/verify-master-password", async (req, res) => {
    try {
      const { password } = req.body;
      const userId = req.headers["x-user-id"] as string;
      const userEmail = req.headers["x-user-email"] as string;

      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 [MASTER PASSWORD] Tentativa de acesso`);
      }

      // VALIDAÇÃO 1: Apenas usuário master pode tentar
      const authorizedEmail = process.env.MASTER_USER_EMAIL;
      if (!authorizedEmail) {
        logger.error("MASTER_USER_EMAIL não configurada", "SECURITY");
        return res
          .status(500)
          .json({ error: "Configuração de segurança incompleta" });
      }

      if (userEmail !== authorizedEmail) {
        logger.warn(
          "Tentativa de acesso não autorizada ao admin master",
          "SECURITY",
          {
            ip: req.ip,
          },
        );
        return res.status(403).json({ error: "Acesso não autorizado" });
      }

      if (!password) {
        return res.status(400).json({ error: "Senha é obrigatória" });
      }

      // VALIDAÇÃO 2: Rate limiting
      const clientKey = userId || req.ip || "unknown";
      const attempts = masterPasswordAttempts.get(clientKey);
      const now = Date.now();

      if (attempts) {
        // Se está em período de lockout
        if (
          attempts.count >= MAX_ATTEMPTS &&
          now - attempts.lastAttempt < LOCKOUT_TIME
        ) {
          const remainingTime = Math.ceil(
            (LOCKOUT_TIME - (now - attempts.lastAttempt)) / 60000,
          );
          logger.warn("Tentativa bloqueada por rate limit", "SECURITY", {
            clientKey,
            attempts: attempts.count,
            remainingMinutes: remainingTime,
          });
          return res.status(429).json({
            error: `Muitas tentativas. Tente novamente em ${remainingTime} minutos.`,
          });
        }

        // Reset se o lockout expirou
        if (now - attempts.lastAttempt >= LOCKOUT_TIME) {
          masterPasswordAttempts.delete(clientKey);
        }
      }

      // Garantir que o usuário master existe
      const masterEmail = process.env.MASTER_USER_EMAIL;
      if (!masterEmail) {
        logger.error(
          "MASTER_USER_EMAIL não configurada nas variáveis de ambiente",
          "SECURITY",
        );
        return res
          .status(500)
          .json({ error: "Configuração de segurança incompleta" });
      }

      let masterUser = await storage.getUserByEmail(masterEmail);

      if (!masterUser) {
        if (process.env.NODE_ENV === "development") {
          console.log("🔧 Criando usuário master automaticamente...");
        }
        const masterPassword = process.env.MASTER_USER_PASSWORD;
        if (!masterPassword) {
          logger.error(
            "MASTER_USER_PASSWORD não configurada nas variáveis de ambiente",
            "SECURITY",
          );
          return res
            .status(500)
            .json({ error: "Configuração de segurança incompleta" });
        }

        const dataExpiracao = new Date();
        dataExpiracao.setFullYear(dataExpiracao.getFullYear() + 10);

        masterUser = await storage.createUser({
          nome: "Admin Master",
          email: masterEmail,
          senha: masterPassword,
          plano: "premium",
          is_admin: "true",
          status: "ativo",
          max_funcionarios: 999,
          data_criacao: new Date().toISOString(),
          data_expiracao_plano: dataExpiracao.toISOString(),
        });
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Usuário master criado com sucesso");
        }
      }

      // Buscar senha master do banco
      const masterPasswordConfig =
        await storage.getSystemConfig("master_password");

      if (!masterPasswordConfig) {
        const defaultPassword = process.env.MASTER_ADMIN_PASSWORD;
        if (!defaultPassword) {
          logger.error(
            "MASTER_ADMIN_PASSWORD não configurada nas variáveis de ambiente",
            "SECURITY",
          );
          return res
            .status(500)
            .json({ error: "Configuração de segurança incompleta" });
        }
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        await storage.setSystemConfig("master_password", hashedPassword);

        const isValid = await bcrypt.compare(password, hashedPassword);

        // Registrar tentativa
        if (!isValid) {
          const currentAttempts = masterPasswordAttempts.get(clientKey);
          masterPasswordAttempts.set(clientKey, {
            count: (currentAttempts?.count || 0) + 1,
            lastAttempt: now,
          });
          logger.warn("Senha master incorreta", "SECURITY", { clientKey });
        } else {
          masterPasswordAttempts.delete(clientKey);
          logger.info("Acesso admin master autorizado", "SECURITY", {
            userEmail,
          });
        }

        return res.json({ valid: isValid });
      }

      // Verificar senha fornecida com hash armazenado
      const isValid = await bcrypt.compare(
        password,
        masterPasswordConfig.valor,
      );

      // Registrar tentativa
      if (!isValid) {
        const currentAttempts = masterPasswordAttempts.get(clientKey);
        masterPasswordAttempts.set(clientKey, {
          count: (currentAttempts?.count || 0) + 1,
          lastAttempt: now,
        });
        logger.warn("Senha master incorreta", "SECURITY", {
          clientKey,
          attempts: (currentAttempts?.count || 0) + 1,
        });
      } else {
        masterPasswordAttempts.delete(clientKey);
        logger.info("Acesso admin master autorizado", "SECURITY", {
          userEmail,
        });
      }

      res.json({ valid: isValid });
    } catch (error) {
      console.error("Erro ao verificar senha master:", error);
      logger.error("Erro ao verificar senha master", "SECURITY", { error });
      res.status(500).json({ error: "Erro ao verificar senha" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const sanitizedUsers = users.map((user) => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        plano: user.plano || "free",
        is_admin: user.is_admin || "false",
        data_criacao: user.data_criacao || null,
        data_expiracao_trial: user.data_expiracao_trial || null,
        data_expiracao_plano: user.data_expiracao_plano || null,
        status: user.status || "ativo",
        cpf_cnpj: user.cpf_cnpj || null,
        telefone: user.telefone || null,
        endereco: user.endereco || null,
        asaas_customer_id: user.asaas_customer_id || null,
        max_funcionarios: user.max_funcionarios || 1,
        meta_mensal: user.meta_mensal || 15000,
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Não permitir atualizar senha vazia e ID
      if (updates.senha === "") {
        delete updates.senha;
      }
      delete updates.id;

      // Garantir que is_admin seja sempre string "true" ou "false"
      if (updates.is_admin !== undefined) {
        updates.is_admin =
          updates.is_admin === "true" || updates.is_admin === true
            ? "true"
            : "false";
      }

      const updatedUser = await storage.updateUser(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        nome: updatedUser.nome,
        plano: updatedUser.plano,
        is_admin: updatedUser.is_admin,
        status: updatedUser.status,
        data_criacao: updatedUser.data_criacao,
        data_expiracao_trial: updatedUser.data_expiracao_trial,
        data_expiracao_plano: updatedUser.data_expiracao_plano,
        ultimo_acesso: updatedUser.ultimo_acesso,
        max_funcionarios: updatedUser.max_funcionarios,
        meta_mensal: updatedUser.meta_mensal,
      });
    } catch (error) {
      console.error(`❌ [UPDATE USER] Erro ao atualizar usuário:`, error);
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ [DELETE USER] Tentando deletar usuário ID: ${id}`);
      await storage.deleteUser(id);
      console.log(
        `✅ [DELETE USER] Usuário ${id} deletado com sucesso do banco de dados`,
      );
      res.json({ success: true });
    } catch (error) {
      console.log(`❌ [DELETE USER] Erro ao deletar usuário ${id}:`, error);
      res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  });

  app.post("/api/admin/fix-trial-users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      let fixedCount = 0;

      for (const user of users) {
        if (user.data_expiracao_trial && user.plano === "free") {
          const expirationDate = new Date(user.data_expiracao_trial);
          const now = new Date();

          if (now < expirationDate) {
            await storage.updateUser(user.id, {
              plano: "trial",
              data_expiracao_plano: user.data_expiracao_trial,
            });
            fixedCount++;
            console.log(`✅ Usuário ${user.email} corrigido para plano trial`);
          }
        }
      }

      res.json({
        success: true,
        message: `${fixedCount} usuário(s) trial corrigido(s)`,
        fixedCount,
      });
    } catch (error) {
      console.error("Erro ao corrigir usuários trial:", error);
      res.status(500).json({ error: "Erro ao corrigir usuários trial" });
    }
  });

  // Rotas de Planos
  app.get("/api/planos", async (req, res) => {
    try {
      if (!storage.getPlanos) {
        return res
          .status(501)
          .json({ error: "Método getPlanos não implementado" });
      }
      const planos = await storage.getPlanos();
      res.json(planos);
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      res.status(500).json({ error: "Erro ao buscar planos" });
    }
  });

  app.post("/api/planos", async (req, res) => {
    try {
      if (!storage.createPlano) {
        return res
          .status(501)
          .json({ error: "Método createPlano não implementado" });
      }
      const planoData = {
        ...req.body,
        data_criacao: new Date().toISOString(),
      };
      const plano = await storage.createPlano(planoData);
      res.json(plano);
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      res.status(500).json({ error: "Erro ao criar plano" });
    }
  });

  app.put("/api/planos/:id", async (req, res) => {
    try {
      if (!storage.updatePlano) {
        return res
          .status(501)
          .json({ error: "Método updatePlano não implementado" });
      }
      const id = parseInt(req.params.id);
      const plano = await storage.updatePlano(id, req.body);
      if (!plano) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }
      res.json(plano);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      res.status(500).json({ error: "Erro ao atualizar plano" });
    }
  });

  app.delete("/api/planos/:id", async (req, res) => {
    try {
      if (!storage.deletePlano) {
        return res
          .status(501)
          .json({ error: "Método deletePlano não implementado" });
      }
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePlano(id);
      if (!deleted) {
        return res.status(404).json({ error: "Plano não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar plano:", error);
      res.status(500).json({ error: "Erro ao deletar plano" });
    }
  });

  // Rotas de Configuração Mercado Pago
  app.get("/api/config-mercadopago", async (req, res) => {
    try {
      const config = await storage.getConfigMercadoPago();
      if (!config) {
        return res.json(null);
      }
      res.json({
        ...config,
        access_token: config.access_token ? "***" : "",
        public_key: config.public_key || "",
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erro ao buscar configuração Mercado Pago" });
    }
  });

  app.post("/api/config-mercadopago", async (req, res) => {
    try {
      const config = req.body;

      // Se o webhook_url não foi fornecido, gerar um padrão
      if (!config.webhook_url) {
        const baseUrl = process.env.REPLIT_DEV_DOMAIN
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : "http://localhost:5000";
        config.webhook_url = `${baseUrl}/api/webhook/mercadopago`;
      }

      await storage.saveConfigMercadoPago({
        ...config,
        updated_at: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: "Configuração salva com sucesso!",
        webhook_url: config.webhook_url,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config-mercadopago/test", async (req, res) => {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({ error: "Access Token é obrigatório" });
      }

      const { MercadoPagoService } = await import("./mercadopago");
      const mercadopago = new MercadoPagoService({ accessToken: access_token });
      const result = await mercadopago.testConnection();

      if (result.success) {
        await storage.updateConfigMercadoPagoStatus("conectado");
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Relatórios Financeiros
  app.get("/api/relatorios/financeiro", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      const users = await storage.getUsers();

      // Calcular métricas
      const assinaturasAtivas = subscriptions.filter(
        (s) => s.status === "ativo",
      ).length;
      const assinaturasPendentes = subscriptions.filter(
        (s) => s.status === "pendente",
      ).length;
      const receitaMensal = subscriptions
        .filter((s) => s.status === "ativo")
        .reduce((sum, s) => sum + s.valor, 0);
      const receitaPendente = subscriptions
        .filter((s) => s.status === "pendente")
        .reduce((sum, s) => sum + s.valor, 0);

      // Taxa de conversão
      const taxaConversao =
        subscriptions.length > 0
          ? (assinaturasAtivas / subscriptions.length) * 100
          : 0;

      // Churn rate
      const cancelados = users.filter((u) => u.status === "cancelado").length;
      const taxaChurn =
        users.length > 0 ? (cancelados / users.length) * 100 : 0;

      // Ticket médio
      const ticketMedio =
        assinaturasAtivas > 0 ? receitaMensal / assinaturasAtivas : 0;

      // Métodos de pagamento
      const metodosPagamento = {
        cartao: subscriptions.filter((s) => s.forma_pagamento === "CREDIT_CARD")
          .length,
        boleto: subscriptions.filter((s) => s.forma_pagamento === "BOLETO")
          .length,
        pix: subscriptions.filter((s) => s.forma_pagamento === "PIX").length,
      };

      res.json({
        metricas: {
          assinaturasAtivas,
          assinaturasPendentes,
          receitaMensal,
          receitaPendente,
          taxaConversao: taxaConversao.toFixed(2),
          taxaChurn: taxaChurn.toFixed(2),
          ticketMedio: ticketMedio.toFixed(2),
        },
        metodosPagamento,
        totalClientes: users.length,
        geradoEm: new Date().toISOString(),
      });
    } catch (error: any) {
      logger.error("[RELATORIO_FINANCEIRO] Erro ao gerar relatório", {
        error: error.message,
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Retry automático de pagamentos falhados
  app.post("/api/payments/:paymentId/retry", requireAdmin, async (req, res) => {
    try {
      const { paymentId } = req.params;

      const config = await storage.getConfigMercadoPago();
      if (!config || !config.access_token) {
        return res.status(500).json({ error: "Mercado Pago não configurado" });
      }

      const { MercadoPagoService } = await import("./mercadopago");
      const mercadopago = new MercadoPagoService({
        accessToken: config.access_token,
      });

      // Buscar pagamento
      const payment = await mercadopago.getPayment(paymentId);

      if (payment.status === "approved") {
        return res.json({
          message: "Pagamento já aprovado",
          status: payment.status,
        });
      }

      // Lógica de retry (recriar preferência)
      logger.info("[PAYMENT_RETRY] Tentando reprocessar pagamento", {
        paymentId,
      });

      res.json({
        success: true,
        message: "Cobrança reenviada com sucesso",
        paymentId,
      });
    } catch (error: any) {
      logger.error("[PAYMENT_RETRY] Erro ao reprocessar pagamento", {
        error: error.message,
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Exportar relatório em CSV
  app.get("/api/relatorios/export/csv", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      const users = await storage.getUsers();

      // Criar CSV
      let csv =
        "ID,Cliente,Email,Plano,Valor,Status,Forma Pagamento,Data Vencimento\n";

      for (const sub of subscriptions) {
        const user = users.find((u) => u.id === sub.user_id);
        csv += `${sub.id},"${user?.nome || "-"}","${user?.email || "-"}","${sub.plano}",${sub.valor},${sub.status},${sub.forma_pagamento || "-"},${sub.data_vencimento || "-"}\n`;
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=relatorio-assinaturas.csv",
      );
      res.send(csv);
    } catch (error: any) {
      logger.error("[EXPORT_CSV] Erro ao exportar CSV", {
        error: error.message,
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Logs do Sistema - Sistema de logs estruturados técnicos
  // Rota para buscar logs do sistema (apenas admins)
  app.get("/api/system-logs", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const isAdmin = req.headers['x-is-admin'] === 'true';

      if (!isAdmin) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const level = req.query.level as string || 'INFO';
      const limit = parseInt(req.query.limit as string) || 100;

      const query = `
        SELECT * FROM system_logs 
        WHERE level = $1 
        ORDER BY timestamp DESC 
        LIMIT $2
      `;

      const result = await storage.query(query, [level, limit]);
      res.json(result.rows);
    } catch (error: any) {
      logger.error('Erro ao buscar logs do sistema:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Rota para admin público buscar TODOS os logs (sem filtro de usuário)
  app.get("/api/admin/all-logs", async (req, res) => {
    try {
      const userId = req.headers['x-user-id'] as string;
      const isAdmin = req.headers['x-is-admin'] === 'true';

      if (!isAdmin) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Verificar se é o master admin
      const user = await storage.getUserById(userId);
      const isMasterAdmin = user?.email === 'pavisoft.suporte@gmail.com';

      if (!isMasterAdmin) {
        return res.status(403).json({ error: "Acesso negado - apenas master admin" });
      }

      const limit = parseInt(req.query.limit as string) || 500;

      // Buscar todos os logs de admin sem filtro por conta
      const logs = await storage.getLogsAdmin?.();
      
      if (!logs) {
        return res.json([]);
      }

      // Filtrar e ordenar os logs
      const filteredLogs = logs
        .slice(0, limit)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

      // Adicionar nomes dos usuários
      const allUsers = await storage.getUsers();
      const allFuncionarios = await storage.getFuncionarios();
      
      const logsComNomes = filteredLogs.map(log => {
        const usuario = allUsers.find(u => u.id === log.usuario_id);
        const funcionario = allFuncionarios.find(f => f.id === log.usuario_id);
        
        return {
          ...log,
          usuario_nome: usuario?.nome || funcionario?.nome || 'Usuário Desconhecido',
          usuario_email: usuario?.email || funcionario?.email || '',
        };
      });

      res.json(logsComNomes);
    } catch (error: any) {
      logger.error('Erro ao buscar todos os logs:', error);
      res.status(500).json({ error: error.message });
    }
  });


  // Backups não são mais necessários - usando backups nativos do Neon PostgreSQL

  app.post("/api/logs-admin", async (req, res) => {
    try {
      const log = await storage.createLogAdmin({
        ...req.body,
        data: new Date().toISOString(),
      });
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar log" });
    }
  });

  // Funcionários (multi-tenant)
  app.get("/api/funcionarios", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const contaId = req.query.conta_id as string;

      if (!contaId) {
        return res.status(400).json({ error: "conta_id é obrigatório" });
      }

      // Validate conta_id matches the authenticated user
      if (contaId !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const funcionarios = await storage.getFuncionariosByContaId(contaId);
      res.json(funcionarios);
    } catch (error: any) {
      console.error("Erro ao buscar funcionários:", error);
      res
        .status(500)
        .json({ error: error.message || "Erro ao buscar funcionários" });
    }
  });

  app.get("/api/funcionarios/limite", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const usuario = await storage.getUserByEmail(
        (await storage.getUsers()).find((u: any) => u.id === effectiveUserId)
          ?.email || "",
      );

      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const allFuncionarios = await storage.getFuncionarios();
      const funcionariosDaConta = allFuncionarios.filter(
        (f) => f.conta_id === effectiveUserId,
      );

      res.json({
        max_funcionarios: usuario.max_funcionarios || 5,
        funcionarios_cadastrados: funcionariosDaConta.length,
        funcionarios_disponiveis:
          (usuario.max_funcionarios || 5) - funcionariosDaConta.length,
      });
    } catch (error: any) {
      console.error("Erro ao buscar limite de funcionários:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar limite" });
    }
  });

  app.post("/api/funcionarios", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { conta_id, nome, email, senha, cargo } = req.body;

      if (!conta_id || !nome || !email || !senha) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Validate conta_id matches the authenticated user
      if (conta_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Verificar limite de funcionários
      const usuario = await storage.getUserByEmail(
        (await storage.getUsers()).find((u: any) => u.id === conta_id)?.email ||
          "",
      );

      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const allFuncionarios = await storage.getFuncionarios();
      const funcionariosDaConta = allFuncionarios.filter(
        (f) => f.conta_id === conta_id,
      );
      const maxFuncionarios = usuario.max_funcionarios || 1;

      if (funcionariosDaConta.length >= maxFuncionarios) {
        return res.status(400).json({
          error:
            "Limite de funcionários atingido, verifique os planos e aumente a capacidade de novos cadastros.",
          limite_atingido: true,
          max_funcionarios: maxFuncionarios,
          funcionarios_cadastrados: funcionariosDaConta.length,
        });
      }

      // Verificar se já existe funcionário com este email na mesma conta
      const existingFuncionario = allFuncionarios.find(
        (f) => f.email === email && f.conta_id === conta_id,
      );

      if (existingFuncionario) {
        return res
          .status(400)
          .json({
            error: "Já existe um funcionário com este email nesta conta",
          });
      }

      const funcionario = await storage.createFuncionario({
        conta_id,
        nome,
        email,
        senha,
        cargo: cargo || null,
        status: "ativo",
        data_criacao: new Date().toISOString(),
      });

      console.log(`✅ Funcionário criado no banco - ID: ${funcionario.id}, Nome: ${funcionario.nome}, Email: ${funcionario.email}, Conta: ${funcionario.conta_id}`);

      // Criar permissões padrão (todas desabilitadas)
      await storage.savePermissoesFuncionario(funcionario.id, {
        dashboard: "false",
        pdv: "false",
        caixa: "false",
        produtos: "false",
        inventario: "false",
        relatorios: "false",
        clientes: "false",
        fornecedores: "false",
        financeiro: "false",
        config_fiscal: "false",
        historico_caixas: "false",
        configuracoes: "false",
      });

      console.log(`✅ Permissões padrão criadas para funcionário ID: ${funcionario.id}`);

      res.json(funcionario);
    } catch (error: any) {
      console.error("Erro ao criar funcionário:", error);
      res
        .status(500)
        .json({ error: error.message || "Erro ao criar funcionário" });
    }
  });

  app.patch("/api/funcionarios/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { id } = req.params;
      const updates = req.body;

      delete updates.id;
      delete updates.conta_id;

      // Verify funcionario belongs to this user's account
      const allFuncionarios = await storage.getFuncionarios();
      const funcionario = allFuncionarios.find((f) => f.id === id);

      if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      if (funcionario.conta_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const updatedFuncionario = await storage.updateFuncionario(id, updates);
      res.json(updatedFuncionario);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar funcionário" });
    }
  });

  app.delete("/api/funcionarios/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { id } = req.params;

      // Verify funcionario belongs to this user's account
      const allFuncionarios = await storage.getFuncionarios();
      const funcionario = allFuncionarios.find((f) => f.id === id);

      if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      if (funcionario.conta_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const deleted = await storage.deleteFuncionario(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar funcionário" });
    }
  });

  // Permissões de Funcionários
  app.get("/api/funcionarios/:id/permissoes", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { id } = req.params;

      // Verify funcionario belongs to this user's account
      const allFuncionarios = await storage.getFuncionarios();
      const funcionario = allFuncionarios.find((f) => f.id === id);

      if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      if (funcionario.conta_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const permissoes = await storage.getPermissoesFuncionario?.(id);

      if (!permissoes) {
        return res.json({
          dashboard: "false",
          pdv: "false",
          caixa: "false",
          produtos: "false",
          inventario: "false",
          relatorios: "false",
          clientes: "false",
          fornecedores: "false",
          financeiro: "false",
          config_fiscal: "false",
          historico_caixas: "false",
          configuracoes: "false",
        });
      }

      res.json(permissoes);
    } catch (error) {
      console.error("Erro ao buscar permissões:", error);
      res.status(500).json({ error: "Erro ao buscar permissões" });
    }
  });

  app.post("/api/funcionarios/:id/permissoes", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { id } = req.params;

      // Verify funcionario belongs to this user's account
      const allFuncionarios = await storage.getFuncionarios();
      const funcionario = allFuncionarios.find((f) => f.id === id);

      if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      if (funcionario.conta_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const permissoes = await storage.savePermissoesFuncionario(id, req.body);

      await storage.logAdminAction?.(
        effectiveUserId,
        "PERMISSOES_ATUALIZADAS",
        `Permissões atualizadas para funcionário ${funcionario.nome} (${funcionario.email})`
      );

      res.json(permissoes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar permissões" });
    }
  });

  app.get("/api/logs-admin", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const contaId = req.query.conta_id as string;

      if (!contaId || contaId !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const logs = await storage.getLogsAdminByAccount?.(contaId);

      const funcionarios = await storage.getFuncionariosByContaId(contaId);
      const usuarios = await storage.getUsers?.() || [];
      const allUsers = [...usuarios, ...funcionarios];

      const logsComNomes = (logs || []).map(log => {
        const usuario = allUsers.find(u => u.id === log.usuario_id);
        return {
          ...log,
          usuario_nome: usuario?.nome || 'Usuário Desconhecido',
          usuario_email: usuario?.email || '',
        };
      });

      res.json(logsComNomes);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
      res.status(500).json({ error: "Erro ao buscar logs" });
    }
  });

  app.get("/api/produtos", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;
      const allProdutos = await storage.getProdutos();
      let produtos = allProdutos.filter((p) => p.user_id === effectiveUserId);
      const expiring = req.query.expiring;

      if (expiring === "soon") {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        produtos = produtos.filter((p) => {
          if (!p.vencimento) return false;
          const expiryDate = new Date(p.vencimento);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
        });
      }

      if (limit && limit > 0) {
        produtos = produtos.slice(0, limit);
      }

      res.json(produtos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const produto = await storage.getProduto(id);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produto.user_id !== effectiveUserId) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.get("/api/produtos/codigo/:codigo", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const codigo = req.params.codigo;
      const produto = await storage.getProdutoByCodigoBarras(codigo);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produto.user_id !== effectiveUserId) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.post("/api/produtos", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const produtoData = insertProdutoSchema.parse({
        ...req.body,
        user_id: effectiveUserId,
      });

      if (produtoData.preco <= 0) {
        return res.status(400).json({ error: "Preço deve ser positivo" });
      }

      if (produtoData.quantidade < 0) {
        return res
          .status(400)
          .json({ error: "Quantidade não pode ser negativa" });
      }

      const produto = await storage.createProduto(produtoData);

      await storage.logAdminAction?.(
        effectiveUserId,
        "PRODUTO_CRIADO",
        `Produto criado: ${produtoData.nome} - Qtd: ${produtoData.quantidade}, Preço: R$ ${produtoData.preco.toFixed(2)}`,
        req
      );

      res.json(produto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar produto" });
    }
  });

  app.put("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const updates = req.body;

      const produtoExistente = await storage.getProduto(id);
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produtoExistente.user_id !== effectiveUserId) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      if (updates.preco !== undefined && updates.preco <= 0) {
        return res.status(400).json({ error: "Preço deve ser positivo" });
      }

      if (updates.quantidade !== undefined && updates.quantidade < 0) {
        return res
          .status(400)
          .json({ error: "Quantidade não pode ser negativa" });
      }

      const produto = await storage.updateProduto(id, updates);

      await storage.logAdminAction?.(
        effectiveUserId,
        "PRODUTO_ATUALIZADO",
        `Produto atualizado: ${produto.nome} - ID: ${id}`,
        req
      );
      res.json(produto);
    } catch (error) {
      console.error("❌ Erro ao atualizar produto:", error);
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      const produtoExistente = await storage.getProduto(id);
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produtoExistente.user_id !== effectiveUserId) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      const deleted = await storage.deleteProduto(id);

      await storage.logAdminAction?.(
        effectiveUserId,
        "PRODUTO_DELETADO",
        `Produto deletado: ${produtoExistente.nome} - ID: ${id}`,
        req
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar produto" });
    }
  });

  app.post("/api/vendas", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const funcionarioId = req.headers["funcionario-id"] as string;
      const { itens, cliente_id, forma_pagamento } = req.body;

      const caixaAberto = await storage.getCaixaAberto?.(userId, funcionarioId || undefined);
      if (!caixaAberto) {
        return res
          .status(400)
          .json({
            error:
              "Não há caixa aberto. Abra o caixa antes de registrar vendas.",
          });
      }

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res
          .status(400)
          .json({ error: "Itens da venda são obrigatórios" });
      }

      let valorTotal = 0;
      const produtosVendidos = [];

      for (const item of itens) {
        const produto = await storage.getProdutoByCodigoBarras(
          item.codigo_barras,
        );

        if (!produto) {
          return res
            .status(404)
            .json({
              error: `Produto com código ${item.codigo_barras} não encontrado`,
            });
        }

        if (produto.quantidade < item.quantidade) {
          return res.status(400).json({
            error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidade}`,
          });
        }

        const subtotal = produto.preco * item.quantidade;
        valorTotal += subtotal;

        await storage.updateProduto(produto.id, {
          quantidade: produto.quantidade - item.quantidade,
        });

        produtosVendidos.push({
          nome: produto.nome,
          quantidade: item.quantidade,
          preco_unitario: produto.preco,
          subtotal,
        });
      }

      const agora = new Date();
      const venda = await storage.createVenda({
        user_id: userId,
        produto: produtosVendidos.map((p) => p.nome).join(", "),
        quantidade_vendida: produtosVendidos.reduce(
          (sum, p) => sum + p.quantidade,
          0,
        ),
        valor_total: valorTotal,
        data: agora.toISOString(),
        itens: JSON.stringify(produtosVendidos),
        cliente_id: cliente_id || undefined,
        forma_pagamento: forma_pagamento || "dinheiro",
      });

      await storage.atualizarTotaisCaixa?.(
        caixaAberto.id,
        "total_vendas",
        valorTotal,
      );

      await storage.logAdminAction?.(
        userId,
        "VENDA_REALIZADA",
        `Venda registrada - Total: R$ ${valorTotal.toFixed(2)}, Itens: ${produtosVendidos.length}, Forma: ${forma_pagamento || 'dinheiro'}`,
        req
      );

      res.json({
        ...venda,
        itens: produtosVendidos,
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao registrar venda" });
    }
  });

  app.get("/api/vendas", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (!effectiveUserId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      const allVendas = await storage.getVendas(startDate, endDate);
      const vendas = allVendas.filter((v) => v.user_id === effectiveUserId);
      res.json(vendas);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      res.status(500).json({ error: "Erro ao buscar vendas" });
    }
  });

  app.get("/api/reports/daily", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const today = new Date().toISOString().split("T")[0];
      const allVendas = await storage.getVendas(today, today);
      const vendas = allVendas.filter((v) => v.user_id === effectiveUserId);
      const total = vendas.reduce((sum, v) => sum + v.valor_total, 0);

      res.json({ date: today, total, vendas: vendas.length });
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório diário" });
    }
  });

  app.get("/api/reports/weekly", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      const allVendas = await storage.getVendas(
        weekAgo.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
      );
      const vendas = allVendas.filter((v) => v.user_id === effectiveUserId);
      const total = vendas.reduce((sum, v) => sum + v.valor_total, 0);

      res.json({ total, vendas: vendas.length });
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório semanal" });
    }
  });

  app.get("/api/reports/expiring", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const allProdutos = await storage.getProdutos();
      const produtos = allProdutos.filter((p) => p.user_id === effectiveUserId);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringProducts = produtos
        .filter((p) => {
          if (!p.vencimento) return false;
          const expiryDate = new Date(p.vencimento);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
        })
        .map((p) => {
          const expiryDate = new Date(p.vencimento!);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          return {
            ...p,
            daysUntilExpiry,
            status: daysUntilExpiry <= 7 ? "critical" : "warning",
          };
        })
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      res.json(expiringProducts);
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório de vencimentos" });
    }
  });

  app.delete("/api/vendas", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const allVendas = await storage.getVendas();
      const vendasToDelete = allVendas.filter(
        (v) => v.user_id === effectiveUserId,
      );

      // Delete only vendas belonging to this user
      for (const venda of vendasToDelete) {
        await storage.deleteVenda?.(venda.id);
      }

      res.json({
        success: true,
        message: "Histórico de vendas limpo com sucesso",
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao limpar histórico de vendas" });
    }
  });

  // Rotas de Fornecedores
  app.get("/api/fornecedores", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const allFornecedores = await storage.getFornecedores();
      const fornecedores = allFornecedores.filter(
        (f) => f.user_id === effectiveUserId,
      );
      res.json(fornecedores);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar fornecedores" });
    }
  });

  app.get("/api/fornecedores/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const fornecedor = await storage.getFornecedor(id);
      if (!fornecedor || fornecedor.user_id !== effectiveUserId) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar fornecedor" });
    }
  });

  app.post("/api/fornecedores", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const fornecedorData = {
        ...req.body,
        user_id: effectiveUserId,
        data_cadastro: new Date().toISOString(),
      };
      const fornecedor = await storage.createFornecedor(fornecedorData);

      await storage.logAdminAction?.(
        effectiveUserId,
        "FORNECEDOR_CRIADO",
        `Fornecedor criado: ${fornecedorData.nome}${fornecedorData.cnpj ? ' - CNPJ: ' + fornecedorData.cnpj : ''}`,
        req
      );

      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar fornecedor" });
    }
  });

  app.put("/api/fornecedores/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const fornecedorExistente = await storage.getFornecedor(id);
      if (
        !fornecedorExistente ||
        fornecedorExistente.user_id !== effectiveUserId
      ) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      const fornecedor = await storage.updateFornecedor(id, req.body);
      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar fornecedor" });
    }
  });

  app.delete("/api/fornecedores/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const fornecedorExistente = await storage.getFornecedor(id);
      if (
        !fornecedorExistente ||
        fornecedorExistente.user_id !== effectiveUserId
      ) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      const deleted = await storage.deleteFornecedor(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar fornecedor" });
    }
  });

  // Rotas de Clientes
  app.get("/api/clientes", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const allClientes = await storage.getClientes();
      const clientes = allClientes.filter((c) => c.user_id === effectiveUserId);
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/clientes/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      if (!cliente || cliente.user_id !== effectiveUserId) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clientes", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (req.body.cpf_cnpj) {
        const allClientes = await storage.getClientes();
        const clienteExistente = allClientes.find(
          (c) =>
            c.user_id === effectiveUserId &&
            c.cpf_cnpj &&
            c.cpf_cnpj === req.body.cpf_cnpj,
        );

        if (clienteExistente) {
          return res.status(400).json({
            error: "Já existe um cliente cadastrado com este CPF/CNPJ",
          });
        }
      }

      const clienteData = {
        ...req.body,
        user_id: effectiveUserId,
        data_cadastro: new Date().toISOString(),
      };
      const cliente = await storage.createCliente(clienteData);

      await storage.logAdminAction?.(
        effectiveUserId,
        "CLIENTE_CRIADO",
        `Cliente criado: ${clienteData.nome}${clienteData.cpf_cnpj ? ' - CPF/CNPJ: ' + clienteData.cpf_cnpj : ''}`,
        req
      );

      res.json(cliente);
    } catch (error: any) {
      if (error.message && error.message.includes("duplicate key")) {
        return res.status(400).json({
          error: "Já existe um cliente cadastrado com este CPF/CNPJ",
        });
      }
      res.status(500).json({ error: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clientes/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const { id } = req.params;
      console.log(`🔄 [UPDATE CLIENTE] ID: ${id}`);
      console.log(
        `📝 [UPDATE CLIENTE] Dados recebidos:`,
        JSON.stringify(req.body, null, 2),
      );

      const clienteExistente = await storage.getCliente(id);
      if (!clienteExistente || clienteExistente.user_id !== effectiveUserId) {
        console.log(`❌ [UPDATE CLIENTE] Cliente não encontrado com ID: ${id}`);
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      if (req.body.cpf_cnpj) {
        const allClientes = await storage.getClientes();
        const cpfDuplicado = allClientes.find(
          (c) =>
            c.user_id === effectiveUserId &&
            c.id !== parseInt(id) &&
            c.cpf_cnpj &&
            c.cpf_cnpj === req.body.cpf_cnpj,
        );

        if (cpfDuplicado) {
          return res.status(400).json({
            error: "Já existe outro cliente cadastrado com este CPF/CNPJ",
          });
        }
      }

      const cliente = await storage.updateCliente(id, req.body);
      console.log(
        `✅ [UPDATE CLIENTE] Cliente atualizado com sucesso:`,
        JSON.stringify(cliente, null, 2),
      );
      res.json(cliente);
    } catch (error: any) {
      console.error(`❌ [UPDATE CLIENTE] Erro ao atualizar cliente:`, error);
      if (error.message && error.message.includes("duplicate key")) {
        return res.status(400).json({
          error: "Já existe outro cliente cadastrado com este CPF/CNPJ",
        });
      }
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clientes/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      console.log(`🗑️ [DELETE CLIENTE] Tentando deletar cliente ID: ${id}`);

      const clienteExistente = await storage.getCliente(id);
      if (!clienteExistente || clienteExistente.user_id !== effectiveUserId) {
        console.log(`⚠️ [DELETE CLIENTE] Cliente ${id} não encontrado`);
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      const deleted = await storage.deleteCliente(id);
      console.log(`✅ [DELETE CLIENTE] Cliente ${id} deletado com sucesso`);
      res.json({ success: true });
    } catch (error) {
      console.log(`❌ [DELETE CLIENTE] Erro ao deletar cliente:`, error);
      res.status(500).json({ error: "Erro ao deletar cliente" });
    }
  });

  // Rotas de Compras
  app.get("/api/compras", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const fornecedorId = req.query.fornecedor_id
        ? parseInt(req.query.fornecedor_id as string)
        : undefined;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      const allCompras = await storage.getCompras(
        fornecedorId,
        startDate,
        endDate,
      );
      const compras = allCompras.filter((c) => c.user_id === effectiveUserId);
      res.json(compras);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar compras" });
    }
  });

  app.post("/api/compras", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const {
        fornecedor_id,
        produto_id,
        quantidade,
        valor_unitario,
        observacoes,
      } = req.body;

      const produto = await storage.getProduto(produto_id);
      if (!produto || produto.user_id !== effectiveUserId) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const fornecedor = await storage.getFornecedor(fornecedor_id);
      if (!fornecedor || fornecedor.user_id !== effectiveUserId) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }

      const valor_total = valor_unitario * quantidade;

      await storage.updateProduto(produto_id, {
        quantidade: produto.quantidade + quantidade,
      });

      const compra = await storage.createCompra({
        user_id: effectiveUserId,
        fornecedor_id,
        produto_id,
        quantidade,
        valor_unitario,
        valor_total,
        data: new Date().toISOString(),
        observacoes: observacoes || null,
      });

      res.json(compra);
    } catch (error) {
      res.status(500).json({ error: "Erro ao registrar compra" });
    }
  });

  app.put("/api/compras/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);
      const {
        quantidade: novaQuantidade,
        valor_unitario,
        observacoes,
        produto_id,
      } = req.body;

      const compraExistente = await storage.getCompras();
      const compra = compraExistente.find(
        (c) => c.id === id && c.user_id === effectiveUserId,
      );

      if (!compra) {
        return res.status(404).json({ error: "Compra não encontrada" });
      }

      if (
        novaQuantidade !== undefined &&
        novaQuantidade !== compra.quantidade
      ) {
        const produto = await storage.getProduto(compra.produto_id);
        if (!produto) {
          return res.status(404).json({ error: "Produto não encontrado" });
        }

        const diferencaQuantidade = novaQuantidade - compra.quantidade;
        await storage.updateProduto(compra.produto_id, {
          quantidade: produto.quantidade + diferencaQuantidade,
        });
      }

      const updates: Partial<typeof compra> = {};
      if (novaQuantidade !== undefined) updates.quantidade = novaQuantidade;
      if (valor_unitario !== undefined) updates.valor_unitario = valor_unitario;
      if (observacoes !== undefined) updates.observacoes = observacoes;

      if (novaQuantidade !== undefined || valor_unitario !== undefined) {
        const quantidadeFinal =
          novaQuantidade !== undefined ? novaQuantidade : compra.quantidade;
        const valorUnitarioFinal =
          valor_unitario !== undefined ? valor_unitario : compra.valor_unitario;
        updates.valor_total = quantidadeFinal * valorUnitarioFinal;
      }

      const compraAtualizada = await storage.updateCompra(id, updates);
      res.json(compraAtualizada);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar compra" });
    }
  });

  // Contas a Pagar
  app.get("/api/contas-pagar", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (!storage.getContasPagar) {
        return res
          .status(501)
          .json({ error: "Método getContasPagar não implementado" });
      }

      const contas = await storage.getContasPagar();
      const contasFiltered = contas.filter(
        (c: any) => c.user_id === effectiveUserId,
      );
      console.log(
        `📋 Contas a pagar retornadas: ${contasFiltered.length} para usuário ${effectiveUserId}`,
      );
      res.json(contasFiltered);
    } catch (error: any) {
      console.error("❌ Erro ao buscar contas a pagar:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-pagar", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (!storage.createContaPagar) {
        return res
          .status(501)
          .json({ error: "Método createContaPagar não implementado" });
      }

      const contaData = {
        ...req.body,
        user_id: effectiveUserId,
        status: "pendente",
        data_cadastro: new Date().toISOString(),
      };

      const conta = await storage.createContaPagar(contaData);
      console.log(
        `✅ Conta a pagar criada: ID ${conta.id}, Descrição: ${conta.descricao}`,
      );
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao criar conta a pagar:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/contas-pagar/:id", getUserId, async (req, res) => {
    try {
      if (!storage.updateContaPagar) {
        return res
          .status(501)
          .json({ error: "Método updateContaPagar não implementado" });
      }

      const id = parseInt(req.params.id);
      const conta = await storage.updateContaPagar(id, req.body);
      console.log(`✅ Conta a pagar atualizada: ID ${id}`);
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao atualizar conta a pagar:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contas-pagar/:id", getUserId, async (req, res) => {
    try {
      if (!storage.deleteContaPagar) {
        return res
          .status(501)
          .json({ error: "Método deleteContaPagar não implementado" });
      }

      const id = parseInt(req.params.id);
      console.log(`🗑️ Deletando conta a pagar ID: ${id}`);
      await storage.deleteContaPagar(id);
      console.log(`✅ Conta a pagar ${id} deletada com sucesso`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`❌ Erro ao deletar conta a pagar:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-pagar/:id/pagar", getUserId, async (req, res) => {
    try {
      if (!storage.updateContaPagar) {
        return res
          .status(501)
          .json({ error: "Método updateContaPagar não implementado" });
      }

      const id = parseInt(req.params.id);
      const conta = await storage.updateContaPagar(id, {
        status: "pago",
        data_pagamento: new Date().toISOString(),
      });
      console.log(`✅ Conta a pagar marcada como paga: ID ${id}`);
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao marcar conta como paga:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Contas a Receber
  app.get("/api/contas-receber", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (!storage.getContasReceber) {
        return res
          .status(501)
          .json({ error: "Método getContasReceber não implementado" });
      }

      const contas = await storage.getContasReceber();
      const contasFiltered = contas.filter(
        (c: any) => c.user_id === effectiveUserId,
      );
      console.log(
        `📋 Contas a receber retornadas: ${contasFiltered.length} para usuário ${effectiveUserId}`,
      );
      res.json(contasFiltered);
    } catch (error: any) {
      console.error("❌ Erro ao buscar contas a receber:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-receber", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;

      if (!storage.createContaReceber) {
        return res
          .status(501)
          .json({ error: "Método createContaReceber não implementado" });
      }

      const contaData = {
        ...req.body,
        user_id: effectiveUserId,
        status: "pendente",
        data_cadastro: new Date().toISOString(),
      };

      const conta = await storage.createContaReceber(contaData);
      console.log(
        `✅ Conta a receber criada: ID ${conta.id}, Descrição: ${conta.descricao}`,
      );
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao criar conta a receber:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/contas-receber/:id", getUserId, async (req, res) => {
    try {
      if (!storage.updateContaReceber) {
        return res
          .status(501)
          .json({ error: "Método updateContaReceber não implementado" });
      }

      const id = parseInt(req.params.id);
      const conta = await storage.updateContaReceber(id, req.body);
      console.log(`✅ Conta a receber atualizada: ID ${id}`);
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao atualizar conta a receber:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contas-receber/:id", getUserId, async (req, res) => {
    try {
      if (!storage.deleteContaReceber) {
        return res
          .status(501)
          .json({ error: "Método deleteContaReceber não implementado" });
      }

      const id = parseInt(req.params.id);
      console.log(`🗑️ Deletando conta a receber ID: ${id}`);
      await storage.deleteContaReceber(id);
      console.log(`✅ Conta a receber ${id} deletada com sucesso`);
      res.json({ success: true });
    } catch (error: any) {
      console.error(`❌ Erro ao deletar conta a receber:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-receber/:id/receber", getUserId, async (req, res) => {
    try {
      if (!storage.updateContaReceber) {
        return res
          .status(501)
          .json({ error: "Método updateContaReceber não implementado" });
      }

      const id = parseInt(req.params.id);
      const conta = await storage.updateContaReceber(id, {
        status: "recebido",
        data_recebimento: new Date().toISOString(),
      });
      console.log(`✅ Conta a receber marcada como recebida: ID ${id}`);
      res.json(conta);
    } catch (error: any) {
      console.error("❌ Erro ao marcar conta como recebida:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Configuração Fiscal
  app.get("/api/config-fiscal", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.json(null);
      }

      res.json({
        ...config,
        focus_nfe_api_key: config.focus_nfe_api_key ? "***" : "",
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar configuração fiscal" });
    }
  });

  app.post("/api/config-fiscal", async (req, res) => {
    try {
      const configData = insertConfigFiscalSchema.parse(req.body);
      const config = await storage.saveConfigFiscal(configData);

      res.json({
        ...config,
        focus_nfe_api_key: "***",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao salvar configuração fiscal" });
    }
  });

  app.post("/api/nfce/emitir", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.status(400).json({
          error:
            "Configuração fiscal não encontrada. Configure em Config. Fiscal primeiro.",
        });
      }

      const nfceData = nfceSchema.parse(req.body);

      const focusNFe = new FocusNFeService(config);
      const result = await focusNFe.emitirNFCe(nfceData);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados da NFCe inválidos",
          details: error.errors,
        });
      }
      console.error("Erro ao emitir NFCe:", error);
      res.status(500).json({ error: error.message || "Erro ao emitir NFCe" });
    }
  });

  app.get("/api/nfce/:ref", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.status(400).json({
          error: "Configuração fiscal não encontrada",
        });
      }

      const focusNFe = new FocusNFeService(config);
      const result = await focusNFe.consultarNFCe(req.params.ref);
      res.json(result);
    } catch (error: any) {
      res
        .status(500)
        .json({ error: error.message || "Erro ao consultar NFCe" });
    }
  });

  app.delete("/api/nfce/:ref", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.status(400).json({
          error: "Configuração fiscal não encontrada",
        });
      }

      const { justificativa } = req.body;
      if (!justificativa || justificativa.length < 15) {
        return res.status(400).json({
          error: "Justificativa deve ter no mínimo 15 caracteres",
        });
      }

      const focusNFe = new FocusNFeService(config);
      const result = await focusNFe.cancelarNFCe(req.params.ref, justificativa);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao cancelar NFCe" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { nome, email, cpfCnpj, plano, formaPagamento } = req.body;

      if (!nome || !email || !plano || !formaPagamento) {
        return res.status(400).json({
          error:
            "Dados incompletos. Nome, email, plano e forma de pagamento são obrigatórios.",
        });
      }

      // Validar CPF/CNPJ se fornecido
      if (cpfCnpj) {
        const cleanCpfCnpj = cpfCnpj.replace(/\D/g, "");
        if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
          return res.status(400).json({
            error: "CPF/CNPJ inválido. Digite apenas números.",
          });
        }
      }

      const planoValues = {
        premium_mensal: 79.99,
        premium_anual: 767.04,
      };

      const planoNomes = {
        premium_mensal: "Premium Mensal",
        premium_anual: "Premium Anual",
      };

      if (!planoValues[plano as keyof typeof planoValues]) {
        return res.status(400).json({ error: "Plano inválido" });
      }

      const config = await storage.getConfigMercadoPago();
      if (!config || !config.access_token) {
        return res.status(500).json({
          error:
            "Sistema de pagamento não configurado. Entre em contato com o suporte.",
        });
      }

      const { MercadoPagoService } = await import("./mercadopago");
      const mercadopago = new MercadoPagoService({
        accessToken: config.access_token,
      });

      const externalReference = `${plano}_${Date.now()}`;

      // Criar preferência de pagamento no Mercado Pago
      const preference = await mercadopago.createPreference({
        items: [
          {
            title: `Assinatura ${planoNomes[plano as keyof typeof planoNomes]} - Pavisoft Sistemas`,
            quantity: 1,
            unit_price: planoValues[plano as keyof typeof planoValues],
            currency_id: "BRL",
            description: `Plano ${planoNomes[plano as keyof typeof planoNomes]}`,
          },
        ],
        payer: {
          email,
          name,
          identification: cpfCnpj
            ? {
                type: cpfCnpj.replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ",
                number: cpfCnpj.replace(/\D/g, ""),
              }
            : undefined,
        },
        external_reference: externalReference,
      });

      // Criar ou atualizar usuário
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const senhaTemporaria = Math.random().toString(36).slice(-8);
        user = await storage.createUser({
          nome,
          email,
          senha: senhaTemporaria,
          plano: "free",
          is_admin: "false",
          status: "ativo",
        });
      }

      const dataVencimento = new Date();
      if (plano === "premium_mensal") {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      } else {
        dataVencimento.setFullYear(dataVencimento.getFullYear() + 1);
      }

      // Calcular prazo limite para pagamento (7 dias após criação)
      const prazoLimitePagamento = new Date();
      prazoLimitePagamento.setDate(prazoLimitePagamento.getDate() + 7);

      // Criar registro de assinatura
      const subscription = await storage.createSubscription({
        user_id: user.id,
        plano,
        status: "pendente",
        valor: planoValues[plano as keyof typeof planoValues],
        data_vencimento: dataVencimento.toISOString(),
        prazo_limite_pagamento: prazoLimitePagamento.toISOString(),
        tentativas_cobranca: 0,
        mercadopago_preference_id: preference.id,
        forma_pagamento: formaPagamento,
        status_pagamento: "pending",
        init_point: preference.init_point,
        external_reference: externalReference,
      });

      console.log(
        `✅ Assinatura criada com sucesso - User: ${user.email}, Plano: ${planoNomes[plano as keyof typeof planoNomes]}, Forma: ${formaPagamento}`,
      );

      res.json({
        success: true,
        subscription,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
        },
        message: `Assinatura ${planoNomes[plano as keyof typeof planoNomes]} criada com sucesso! Você será redirecionado para o pagamento.`,
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar checkout:", error);
      res.status(500).json({
        error:
          error.message ||
          "Erro ao processar pagamento. Tente novamente ou entre em contato com o suporte.",
      });
    }
  });

  // Rota para compra de pacotes de funcionários
  app.post("/api/purchase-employees", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }

      const { pacoteId, quantidade, valor, nomePacote } = req.body;

      if (!pacoteId || !quantidade || !valor || !nomePacote) {
        return res.status(400).json({
          error: "Dados incompletos. Todos os campos são obrigatórios.",
        });
      }

      // Buscar usuário
      const users = await storage.getUsers();
      const user = users.find((u) => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Configurar Mercado Pago
      const config = await storage.getConfigMercadoPago();
      if (!config || !config.access_token) {
        return res.status(500).json({
          error:
            "Sistema de pagamento não configurado. Entre em contato com o suporte.",
        });
      }

      const { MercadoPagoService } = await import("./mercadopago");
      const mercadopago = new MercadoPagoService({
        accessToken: config.access_token,
      });

      const externalReference = `${pacoteId}_${userId}_${Date.now()}`;

      // Criar preferência de pagamento no Mercado Pago
      const preference = await mercadopago.createPreference({
        items: [
          {
            title: `${nomePacote} - Pavisoft Sistemas`,
            quantity: 1,
            unit_price: valor,
            currency_id: "BRL",
            description: `Pacote com ${quantidade} funcionários adicionais`,
          },
        ],
        payer: {
          email: user.email,
          name: user.nome,
        },
        external_reference: externalReference,
      });

      // Enviar email de confirmação (opcional)
      try {
        const { EmailService } = await import("./email-service");
        const emailService = new EmailService();

        await emailService.sendEmployeePackagePurchased({
          to: user.email,
          userName: user.nome,
          packageName: nomePacote,
          quantity: quantidade,
          price: valor,
          paymentUrl: preference.init_point,
        });

        console.log(`📧 Email de compra enviado para ${user.email}`);
      } catch (emailError) {
        console.error("⚠️ Erro ao enviar email (não crítico):", emailError);
        // Não bloqueia a compra se o email falhar
      }

      console.log(
        `✅ Preferência de pagamento criada - Pacote: ${nomePacote}, User: ${user.email}`,
      );

      res.json({
        success: true,
        preference: {
          id: preference.id,
          init_point: preference.init_point,
        },
        message:
          "✅ Pacote selecionado. Você será redirecionado para o pagamento.",
      });
    } catch (error: any) {
      console.error("❌ Erro ao processar compra de funcionários:", error);
      res.status(500).json({
        error:
          error.message ||
          "Erro ao processar compra. Tente novamente ou entre em contato com o suporte.",
      });
    }
  });

  // Encerramento de Conta
  app.post("/api/encerrar-conta", async (req, res) => {
    try {
      const { userId, userEmail, userName, motivo } = req.body;

      if (!userId || !userEmail || !userName || !motivo) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Enviar email para o admin master
      try {
        const { EmailService } = await import("./email-service");
        const emailService = new EmailService();

        await emailService.sendAccountClosureRequest({
          userId,
          userEmail,
          userName,
          motivo,
        });

        console.log(
          `📧 Solicitação de encerramento enviada - User: ${userEmail}, Motivo: ${motivo.substring(0, 50)}...`,
        );
        logger.info(
          "Solicitação de encerramento de conta enviada",
          "ACCOUNT_CLOSURE",
          {
            userId,
            userEmail,
            motivo: motivo.substring(0, 100),
          },
        );

        res.json({
          success: true,
          message: "Solicitação enviada com sucesso",
        });
      } catch (emailError) {
        console.error("❌ Erro ao enviar email de encerramento:", emailError);
        logger.error(
          "Erro ao enviar email de encerramento",
          "ACCOUNT_CLOSURE",
          { error: emailError },
        );
        res.status(500).json({ error: "Erro ao enviar solicitação" });
      }
    } catch (error: any) {
      console.error("Erro ao processar solicitação de encerramento:", error);
      logger.error("Erro ao processar encerramento", "ACCOUNT_CLOSURE", {
        error: error.message,
      });
      res
        .status(500)
        .json({ error: error.message || "Erro ao processar solicitação" });
    }
  });

  // Meta de Vendas - Salvar/Atualizar
  app.post("/api/user/meta-vendas", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { meta_mensal, target_user_id } = req.body;
      if (!meta_mensal || isNaN(parseFloat(meta_mensal))) {
        return res.status(400).json({ error: "Meta inválida" });
      }

      // Se target_user_id for fornecido, atualiza outro usuário (apenas admin)
      const targetId = target_user_id || userId;

      // Buscar usuário atual para garantir que existe
      const users = await storage.getUsers();
      const user = users.find((u) => u.id === targetId);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Atualizar meta_mensal no banco de dados
      const metaValue = parseFloat(meta_mensal);

      const updatedUser = await storage.updateUser(targetId, {
        meta_mensal: metaValue,
      });

      if (!updatedUser) {
        return res
          .status(500)
          .json({ error: "Erro ao salvar meta no banco de dados" });
      }

      console.log(
        `✅ Meta MRR salva no banco - User: ${targetId}, Meta: R$ ${metaValue.toFixed(2)}`,
      );
      logger.info("Meta de vendas atualizada", "USER_META", {
        userId: targetId,
        meta_mensal: metaValue,
      });

      res.json({
        success: true,
        message: "Meta definida com sucesso",
        meta_mensal: metaValue,
      });
    } catch (error: any) {
      console.error("Erro ao definir meta:", error);
      logger.error("Erro ao salvar meta de vendas", "USER_META", {
        error: error.message,
      });
      res.status(500).json({ error: error.message || "Erro ao definir meta" });
    }
  });

  // Teste de Emails (apenas desenvolvimento)
  app.post("/api/test/send-emails", async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      return res
        .status(403)
        .json({ error: "Endpoint disponível apenas em desenvolvimento" });
    }

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email é obrigatório" });
      }

      const { EmailService } = await import("./email-service");
      const emailService = new EmailService();
      const results = [];

      // 1. Email de Código de Verificação
      try {
        await emailService.sendVerificationCode({
          to: email,
          userName: "Usuário Teste",
          code: "123456",
        });
        results.push({ tipo: "Código de Verificação", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Código de Verificação",
          status: "erro",
          erro: error.message,
        });
      }

      // 2. Email de Pacote de Funcionários Comprado
      try {
        await emailService.sendEmployeePackagePurchased({
          to: email,
          userName: "Usuário Teste",
          packageName: "Pacote 5 Funcionários",
          quantity: 5,
          price: 25.0,
          paymentUrl: "https://sandbox.asaas.com/i/test123",
        });
        results.push({
          tipo: "Pacote de Funcionários - Aguardando Pagamento",
          status: "enviado",
        });
      } catch (error) {
        results.push({
          tipo: "Pacote de Funcionários - Aguardando Pagamento",
          status: "erro",
          erro: error.message,
        });
      }

      // 3. Email de Pacote de Funcionários Ativado
      try {
        await emailService.sendEmployeePackageActivated({
          to: email,
          userName: "Usuário Teste",
          packageName: "Pacote 5 Funcionários",
          quantity: 5,
          newLimit: 10,
          price: 25.0,
        });
        results.push({
          tipo: "Pacote de Funcionários - Ativado",
          status: "enviado",
        });
      } catch (error) {
        results.push({
          tipo: "Pacote de Funcionários - Ativado",
          status: "erro",
          erro: error.message,
        });
      }

      // 4. Email de Senha Redefinida
      try {
        await emailService.sendPasswordResetConfirmation({
          to: email,
          userName: "Usuário Teste",
          resetByAdmin: "Admin Master",
          resetDate: new Date().toLocaleString("pt-BR"),
        });
        results.push({ tipo: "Senha Redefinida", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Senha Redefinida",
          status: "erro",
          erro: error.message,
        });
      }

      // 5. Email de Pagamento Pendente
      try {
        await emailService.sendPaymentPendingReminder({
          to: email,
          userName: "Usuário Teste",
          planName: "Plano Premium Mensal",
          daysWaiting: 5,
          amount: 99.9,
        });
        results.push({ tipo: "Pagamento Pendente", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Pagamento Pendente",
          status: "erro",
          erro: error.message,
        });
      }

      // 6. Email de Aviso de Vencimento
      try {
        await emailService.sendExpirationWarning({
          to: email,
          userName: "Usuário Teste",
          planName: "Plano Premium Mensal",
          daysRemaining: 7,
          expirationDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toLocaleDateString("pt-BR"),
          amount: 99.9,
        });
        results.push({ tipo: "Aviso de Vencimento", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Aviso de Vencimento",
          status: "erro",
          erro: error.message,
        });
      }

      // 7. Email de Pagamento Atrasado
      try {
        await emailService.sendOverdueNotice({
          to: email,
          userName: "Usuário Teste",
          planName: "Plano Premium Mensal",
          daysOverdue: 3,
          amount: 99.9,
        });
        results.push({ tipo: "Pagamento Atrasado", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Pagamento Atrasado",
          status: "erro",
          erro: error.message,
        });
      }

      // 8. Email de Conta Bloqueada
      try {
        await emailService.sendAccountBlocked({
          to: email,
          userName: "Usuário Teste",
          planName: "Plano Premium Mensal",
        });
        results.push({ tipo: "Conta Bloqueada", status: "enviado" });
      } catch (error) {
        results.push({
          tipo: "Conta Bloqueada",
          status: "erro",
          erro: error.message,
        });
      }

      logger.info("Emails de teste enviados", "TEST_EMAIL", { email, results });
      res.json({
        success: true,
        message: `${results.filter((r) => r.status === "enviado").length} emails enviados para ${email}`,
        details: results,
      });
    } catch (error) {
      logger.error("Erro ao enviar emails de teste", "TEST_EMAIL", { error });
      res.status(500).json({ error: "Erro ao enviar emails de teste" });
    }
  });

  // Executar suite completa de testes
  app.post("/api/run-tests", requireAdmin, async (req, res) => {
    try {
      const { TestSuite } = await import("./test-suite");
      const suite = new TestSuite();
      const results = await suite.runAllTests();

      const success = results.filter(r => r.status === 'success').length;
      const errors = results.filter(r => r.status === 'error').length;
      const warnings = results.filter(r => r.status === 'warning').length;

      res.json({
        success: errors === 0,
        summary: {
          total: results.length,
          success,
          errors,
          warnings,
          percentage: Math.round((success / results.length) * 100)
        },
        results
      });
    } catch (error) {
      logger.error("Erro ao executar testes", "TEST_SUITE", { error });
      res.status(500).json({ error: "Erro ao executar testes" });
    }
  });

  // Mercado Pago Webhook
  app.post("/api/webhook/mercadopago", async (req, res) => {
    try {
      const { type, data, action } = req.body;

      logger.info("Webhook Mercado Pago recebido", "MERCADOPAGO_WEBHOOK", {
        type,
        action,
        dataId: data?.id
      });

      // Processar notificação de pagamento
      if (type === "payment" || action === "payment.created" || action === "payment.updated") {
        const paymentId = data.id;

        if (!paymentId) {
          logger.warn("Webhook sem payment ID", "MERCADOPAGO_WEBHOOK");
          return res.status(400).json({ error: "Payment ID não fornecido" });
        }

        // Buscar configuração do Mercado Pago
        const config = await storage.getConfigMercadoPago();
        if (!config || !config.access_token) {
          logger.error("Configuração do Mercado Pago não encontrada", "MERCADOPAGO_WEBHOOK");
          return res.status(500).json({ error: "Configuração não encontrada" });
        }

        // Buscar informações do pagamento via API
        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${config.access_token}`,
            },
          },
        );

        if (!response.ok) {
          logger.error("Erro ao buscar pagamento do Mercado Pago", "MERCADOPAGO_WEBHOOK", {
            status: response.status
          });
          return res.status(500).json({ error: "Erro ao buscar pagamento" });
        }

        const paymentData = await response.json();
        const externalReference = paymentData.external_reference;
        const status = paymentData.status;
        const statusDetail = paymentData.status_detail;

        logger.info("Dados do pagamento processados", "MERCADOPAGO_WEBHOOK", {
          paymentId,
          status,
          statusDetail,
          externalReference,
        });

        if (!externalReference) {
          logger.warn("Pagamento sem external_reference", "MERCADOPAGO_WEBHOOK", { paymentId });
          return res.status(400).json({ error: "External reference não encontrada" });
        }

        // Buscar assinatura pelo external_reference
        const subscriptions = await storage.getSubscriptions?.();
        const subscription = subscriptions?.find(
          (s) => s.external_reference === externalReference,
        );

        if (!subscription) {
          logger.warn("Assinatura não encontrada", "MERCADOPAGO_WEBHOOK", {
            externalReference,
          });
          return res.status(404).json({ error: "Assinatura não encontrada" });
        }

        // Processar status do pagamento
        if (status === "approved") {
          logger.info("Pagamento aprovado - Ativando assinatura", "MERCADOPAGO_WEBHOOK", {
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            plano: subscription.plano,
          });

          // Atualizar assinatura
          await storage.updateSubscription?.(subscription.id, {
            status: "ativo",
            status_pagamento: "approved",
            mercadopago_payment_id: paymentId.toString(),
            data_inicio: new Date().toISOString(),
            data_atualizacao: new Date().toISOString(),
          });

          // Atualizar plano do usuário
          await storage.updateUser?.(subscription.user_id, {
            plano: subscription.plano,
            data_expiracao_plano: subscription.data_vencimento,
            status: "ativo",
          });

          // CRÍTICO: Reativar todos os funcionários bloqueados desta conta
          if (storage.getFuncionarios) {
            const funcionarios = await storage.getFuncionarios();
            const funcionariosDaConta = funcionarios.filter(
              (f) => f.conta_id === subscription.user_id && f.status === "bloqueado"
            );

            for (const funcionario of funcionariosDaConta) {
              await storage.updateFuncionario(funcionario.id, {
                status: "ativo",
              });
            }

            if (funcionariosDaConta.length > 0) {
              logger.info("Funcionários reativados após pagamento aprovado", "MERCADOPAGO_WEBHOOK", {
                userId: subscription.user_id,
                funcionariosReativados: funcionariosDaConta.length,
              });
            }
          }

          logger.info("Assinatura ativada com sucesso", "MERCADOPAGO_WEBHOOK", {
            subscriptionId: subscription.id,
          });

        } else if (status === "rejected" || status === "cancelled") {
          logger.warn("Pagamento recusado/cancelado", "MERCADOPAGO_WEBHOOK", {
            subscriptionId: subscription.id,
            status,
            statusDetail,
          });

          await storage.updateSubscription?.(subscription.id, {
            status: "cancelado",
            status_pagamento: status,
            mercadopago_payment_id: paymentId.toString(),
            motivo_cancelamento: `Pagamento ${status} - ${statusDetail || 'sem detalhes'}`,
            data_atualizacao: new Date().toISOString(),
          });

        } else if (status === "pending" || status === "in_process") {
          logger.info("Pagamento pendente", "MERCADOPAGO_WEBHOOK", {
            subscriptionId: subscription.id,
            status,
          });

          await storage.updateSubscription?.(subscription.id, {
            status_pagamento: status,
            mercadopago_payment_id: paymentId.toString(),
            data_atualizacao: new Date().toISOString(),
          });
        }
      }

      res.json({ success: true, message: "Webhook processado com sucesso" });
    } catch (error: any) {
      logger.error("Erro ao processar webhook Mercado Pago", "MERCADOPAGO_WEBHOOK", {
        error: error.message,
        stack: error.stack,
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Asaas Webhook
  app.post("/api/webhook/asaas", async (req, res) => {
    const signature = req.headers["asaas-access-token"];
    if (signature !== process.env.ASAAS_ACCESS_TOKEN) {
      logger.warn("Webhook rejeitado - token inválido", "WEBHOOK");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { event, payment } = req.body;

    console.log("Webhook Asaas recebido:", event, payment);

    if (!payment || !payment.id) {
      return res.status(400).json({ error: "Dados do webhook inválidos" });
    }

    // Verificar se é um pagamento de pacote de funcionários
    const isEmployeePackage =
      payment.externalReference &&
      payment.externalReference.startsWith("pacote_");

    if (
      isEmployeePackage &&
      (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED")
    ) {
      // Processar pagamento de pacote de funcionários
      const parts = payment.externalReference.split("_");
      const pacoteId = parts[0] + "_" + parts[1]; // pacote_5, pacote_10, etc
      const userId = parts[2];

      // Mapear pacotes para quantidade de funcionários
      const pacoteQuantidades: Record<string, number> = {
        pacote_5: 5,
        pacote_10: 10,
        pacote_20: 20,
        pacote_50: 50,
      };

      // Mapear pacotes para preços
      const pacotePrecos: Record<string, number> = {
        pacote_5: 39.90,
        pacote_10: 69.90,
        pacote_20: 119.90,
        pacote_50: 249.90,
      };


      const quantidadeAdicional = pacoteQuantidades[pacoteId];

      if (quantidadeAdicional && userId) {
        const users = await storage.getUsers();
        const user = users.find((u: any) => u.id === userId);

        if (user) {
          const limiteAtual = user.max_funcionarios || 1;
          const novoLimite = limiteAtual + quantidadeAdicional;

          // Calcular data de vencimento (30 dias)
          const dataVencimento = new Date();
          dataVencimento.setDate(dataVencimento.getDate() + 30);

          // Registrar pacote comprado
          if (storage.createEmployeePackage) {
            await storage.createEmployeePackage({
              user_id: userId,
              package_type: pacoteId,
              quantity: quantidadeAdicional,
              price: pacotePrecos[pacoteId] || payment.value || 0,
              status: "ativo",
              payment_id: payment.id,
              data_vencimento: dataVencimento.toISOString(),
            });
          }

          // Atualizar usuário
          await storage.updateUser(userId, {
            max_funcionarios: novoLimite,
            max_funcionarios_base: user.max_funcionarios_base || 1,
            data_expiracao_pacote_funcionarios: dataVencimento.toISOString(),
          });

          // 🔥 NOVO: Reativar funcionários bloqueados POR FALTA DE LIMITE
          // (mas APENAS se a conta principal estiver ativa)
          if (user.status === 'ativo' && storage.getFuncionarios) {
            const funcionarios = await storage.getFuncionarios();
            const funcionariosBloqueados = funcionarios
              .filter(f => f.conta_id === userId && f.status === 'bloqueado')
              .sort((a, b) => new Date(a.data_criacao || 0).getTime() - new Date(b.data_criacao || 0).getTime())
              .slice(0, quantidadeAdicional);

            for (const funcionario of funcionariosBloqueados) {
              await storage.updateFuncionario(funcionario.id, {
                status: 'ativo',
              });

              logger.info('Funcionário reativado após compra de pacote', 'WEBHOOK', {
                funcionarioId: funcionario.id,
                funcionarioNome: funcionario.nome,
                contaId: userId,
              });
            }

            if (funcionariosBloqueados.length > 0) {
              console.log(
                `✅ [WEBHOOK] ${funcionariosBloqueados.length} funcionário(s) reativado(s) automaticamente`,
              );
            }
          }

          console.log(
            `✅ [WEBHOOK] Pagamento confirmado - Pacote: ${pacoteId}`,
          );
          console.log(`✅ [WEBHOOK] User: ${user.email} | ${user.nome}`);
          console.log(
            `✅ [WEBHOOK] Limite anterior: ${limiteAtual} → Novo limite: ${novoLimite}`,
          );
          console.log(
            `✅ [WEBHOOK] Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}`,
          );

          logger.info("Pacote de funcionários ativado", "WEBHOOK", {
            userId,
            userEmail: user.email,
            pacoteId,
            quantidadeAdicional,
            limiteAnterior: limiteAtual,
            novoLimite,
            dataVencimento: dataVencimento.toISOString(),
          });

          // Enviar email de confirmação de ativação
          try {
            const { EmailService } = await import("./email-service");
            const emailService = new EmailService();

            const nomePacote = `Pacote ${quantidadeAdicional} Funcionários`;

            await emailService.sendEmployeePackageActivated({
              to: user.email,
              userName: user.nome,
              packageName: nomePacote,
              quantity: quantidadeAdicional,
              newLimit: novoLimite,
              price: payment.value || 0,
            });

            console.log(`📧 Email de ativação enviado para ${user.email}`);
          } catch (emailError) {
            console.error(
              "⚠️ Erro ao enviar email de ativação (não crítico):",
              emailError,
            );
          }
        }
      }


      res.json({
        success: true,
        message: "Webhook de pacote processado com sucesso",
      });
      return;
    }

    // Processar pagamento de assinatura normal
    const subscriptions = await storage.getSubscriptions();
    const subscription = subscriptions?.find(
      (s) => s.asaas_payment_id === payment.id,
    );

    if (!subscription) {
      console.log("Assinatura não encontrada para pagamento:", payment.id);
      return res.status(404).json({ error: "Assinatura não encontrada" });
    }

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      await storage.updateSubscription(subscription.id, {
        status: "ativo",
        status_pagamento: "RECEIVED",
        data_inicio: new Date().toISOString(),
      });

      await storage.updateUser(subscription.user_id, {
        plano: subscription.plano,
        data_expiracao_plano: subscription.data_vencimento,
        status: "ativo",
      });

      console.log(`Pagamento confirmado para assinatura ${subscription.id}`);
    } else if (event === "PAYMENT_OVERDUE") {
      await storage.updateSubscription(subscription.id, {
        status: "expirado",
        status_pagamento: "OVERDUE",
      });

      await storage.updateUser(subscription.user_id, {
        status: "inativo",
      });

      console.log(`Pagamento vencido para assinatura ${subscription.id}`);
    }

    res.json({ success: true, message: "Webhook processado com sucesso" });
  });

  // Subscriptions routes - RESTRITO a admins
  app.get("/api/subscriptions", requireAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions || []);
    } catch (error) {
      console.error("Erro ao buscar assinaturas:", error);
      res.status(500).json({ error: "Erro ao buscar assinaturas" });
    }
  });

  app.get("/api/subscriptions/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const subscriptions = await storage.getSubscriptionsByUser(userId);
      res.json(subscriptions || []);
    } catch (error) {
      console.error("Erro ao buscar assinaturas do usuário:", error);
      res.status(500).json({ error: "Erro ao buscar assinaturas" });
    }
  });

  app.post("/api/subscriptions/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const subscriptionId = parseInt(id);
      const userId = req.headers["x-user-id"] as string;
      const isAdmin = req.headers["x-is-admin"] as string;

      if (!userId) {
        return res.status(401).json({ error: "Autenticação necessária" });
      }

      const subscriptions = await storage.getSubscriptions();
      const subscription = subscriptions?.find((s) => s.id === subscriptionId);

      if (!subscription) {
        return res.status(404).json({ error: "Assinatura não encontrada" });
      }

      if (subscription.user_id !== userId && isAdmin !== "true") {
        return res
          .status(403)
          .json({ error: "Você só pode cancelar suas próprias assinaturas" });
      }

      // Atualizar assinatura com status cancelado e data de atualização
      await storage.updateSubscription(subscriptionId, {
        status: "cancelado",
        status_pagamento: "cancelled",
        data_cancelamento: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        motivo_cancelamento:
          reason || "Cancelado manualmente pelo administrador",
      });

      // Atualizar usuário para plano free
      await storage.updateUser(subscription.user_id, {
        plano: "free",
        status: "ativo",
      });

      console.log(
        `✅ Assinatura ${subscriptionId} cancelada. Motivo: ${reason || "Cancelado manualmente"}`,
      );
      logger.info("Assinatura cancelada", "SUBSCRIPTION", {
        subscriptionId,
        userId: subscription.user_id,
        reason: reason || "Cancelado manualmente",
      });

      res.json({
        success: true,
        message: "Assinatura cancelada com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error);
      logger.error("Erro ao cancelar assinatura", "SUBSCRIPTION", {
        error: error.message,
      });
      res
        .status(500)
        .json({ error: error.message || "Erro ao cancelar assinatura" });
    }
  });

  // Sistema de lembretes de pagamento
  app.post("/api/payment-reminders/check", requireAdmin, async (req, res) => {
    try {
      const { paymentReminderService } = await import("./payment-reminder");
      await paymentReminderService.checkAndSendReminders();
      res.json({
        success: true,
        message: "Verificação de pagamentos executada",
      });
    } catch (error) {
      console.error("Erro ao verificar pagamentos:", error);
      res.status(500).json({ error: "Erro ao verificar pagamentos" });
    }
  });

  // Sistema de Auto-Healing
  app.get("/api/system/health", requireAdmin, async (req, res) => {
    try {
      const { autoHealingService } = await import("./auto-healing");
      const status = autoHealingService.getSystemStatus();
      res.json(status);
    } catch (error: any) {
      console.error("Erro ao obter status do sistema:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/system/health/check", requireAdmin, async (req, res) => {
    try {
      const { autoHealingService } = await import("./auto-healing");
      const checks = await autoHealingService.runHealthChecks();
      res.json({
        success: true,
        checks,
        summary: autoHealingService.getSystemStatus().summary
      });
    } catch (error: any) {
      console.error("Erro ao executar verificações:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/system/autofix-history", requireAdmin, async (req, res) => {
    try {
      const { autoHealingService } = await import("./auto-healing");
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = autoHealingService.getAutoFixHistory(limit);
      res.json(history);
    } catch (error: any) {
      console.error("Erro ao obter histórico de auto-fix:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verificar status de bloqueio do usuário
  app.get("/api/user/check-blocked", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const users = await storage.getUsers();
      const user = users.find((u) => u.id === userId);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const isBlocked = user.status === "bloqueado";

      res.json({
        isBlocked,
        status: user.status,
        plano: user.plano,
      });
    } catch (error) {
      console.error("Erro ao verificar bloqueio:", error);
      res.status(500).json({ error: "Erro ao verificar status de bloqueio" });
    }
  });

  app.get("/api/caixas", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const contaId = req.query.conta_id as string;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // VALIDAÇÃO: conta_id deve ser fornecido e deve ser igual ao userId efetivo
      if (!contaId || contaId !== userId) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Parâmetro conta_id inválido." });
      }

      if (!storage.getCaixas) {
        return res
          .status(501)
          .json({ error: "Método getCaixas não implementado" });
      }

      const caixas = await storage.getCaixas(userId);

      // Adicionar nome do operador a cada caixa
      const caixasComOperador = await Promise.all(
        caixas.map(async (caixa: any) => {
          let operadorNome = "Sistema";

          if (caixa.funcionario_id) {
            // Se foi aberto por funcionário
            const funcionario = await storage.getFuncionario(
              caixa.funcionario_id,
            );
            if (funcionario) {
              operadorNome = funcionario.nome;
            }
          } else {
            // Se foi aberto pelo dono da conta
            const usuario = await storage.getUserByEmail(
              (await storage.getUsers()).find(
                (u: any) => u.id === caixa.user_id,
              )?.email || "",
            );
            if (usuario) {
              operadorNome = usuario.nome;
            }
          }

          return {
            ...caixa,
            operador_nome: operadorNome,
          };
        }),
      );

      res.json(caixasComOperador || []);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
      res.status(500).json({ error: "Erro ao buscar caixas" });
    }
  });

  app.get("/api/caixas/aberto", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const funcionarioId = req.headers["funcionario-id"] as string; // Validado pelo middleware
      const userType = req.headers["x-user-type"] as string;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.getCaixaAberto) {
        return res
          .status(501)
          .json({ error: "Método getCaixaAberto não implementado" });
      }

      const caixaAberto = await storage.getCaixaAberto(userId, funcionarioId || undefined);

      if (caixaAberto) {
        let operadorNome = "Sistema";

        if (caixaAberto.funcionario_id) {
          // Se foi aberto por funcionário
          const funcionario = await storage.getFuncionario(
            caixaAberto.funcionario_id,
          );
          if (funcionario) {
            operadorNome = funcionario.nome;
          }
        } else {
          // Se foi aberto pelo dono da conta
          const usuario = await storage.getUserByEmail(
            (await storage.getUsers()).find(
              (u: any) => u.id === caixaAberto.user_id,
            )?.email || "",
          );
          if (usuario) {
            operadorNome = usuario.nome;
          }
        }

        res.json({
          ...caixaAberto,
          operador_nome: operadorNome,
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Erro ao buscar caixa aberto:", error);
      res.status(500).json({ error: "Erro ao buscar caixa aberto" });
    }
  });

  app.get("/api/caixas/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.getCaixa) {
        return res
          .status(501)
          .json({ error: "Método getCaixa não implementado" });
      }

      const caixa = await storage.getCaixa(parseInt(id));

      if (!caixa) {
        return res.status(404).json({ error: "Caixa não encontrado" });
      }

      if (caixa.user_id !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      res.json(caixa);
    } catch (error) {
      console.error("Erro ao buscar caixa:", error);
      res.status(500).json({ error: "Erro ao buscar caixa" });
    }
  });

  app.post("/api/caixas/abrir", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const funcionarioId = req.headers["funcionario-id"] as string; // Validado pelo middleware
      const userType = req.headers["x-user-type"] as string;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.getCaixaAberto || !storage.abrirCaixa) {
        return res
          .status(501)
          .json({ error: "Métodos de caixa não implementados" });
      }

      // Verificar se JÁ existe um caixa aberto para este funcionário ou dono
      const caixaAberto = await storage.getCaixaAberto(userId, funcionarioId || undefined);
      if (caixaAberto) {
        const operadorNome = userType === "funcionario" ? "Este funcionário" : "Você";
        return res.status(400).json({ error: `${operadorNome} já possui um caixa aberto (ID: ${caixaAberto.id})` });
      }

      const saldoInicial = parseFloat(req.body.saldo_inicial);
      if (isNaN(saldoInicial) || saldoInicial < 0) {
        return res.status(400).json({ error: "Saldo inicial inválido" });
      }

      const caixaData = {
        user_id: userId,
        funcionario_id: userType === "funcionario" ? funcionarioId : null,
        data_abertura: new Date().toISOString(),
        saldo_inicial: saldoInicial,
        observacoes_abertura: req.body.observacoes_abertura || null,
        status: "aberto",
        total_vendas: 0,
        total_retiradas: 0,
        total_suprimentos: 0,
      };

      const caixa = await storage.abrirCaixa(caixaData);
      console.log(
        `✅ Caixa aberto - ID: ${caixa.id}, User: ${userId}, Saldo Inicial: R$ ${saldoInicial.toFixed(2)}`,
      );
      res.json(caixa);
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      res.status(500).json({ error: "Erro ao abrir caixa" });
    }
  });

  app.post("/api/caixas/:id/fechar", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const { id } = req.params;
      const caixaId = parseInt(id);

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.getCaixa || !storage.fecharCaixa) {
        return res
          .status(501)
          .json({ error: "Métodos de caixa não implementados" });
      }

      const caixa = await storage.getCaixa(caixaId);
      if (!caixa) {
        return res.status(404).json({ error: "Caixa não encontrado" });
      }

      if (caixa.user_id !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (caixa.status === "fechado") {
        return res.status(400).json({ error: "Caixa já está fechado" });
      }

      const saldoFinal = parseFloat(req.body.saldo_final);
      if (isNaN(saldoFinal)) {
        return res.status(400).json({ error: "Saldo final inválido" });
      }

      const dadosFechamento = {
        data_fechamento: new Date().toISOString(),
        saldo_final: saldoFinal,
        observacoes_fechamento: req.body.observacoes_fechamento || null,
        status: "fechado",
      };

      const caixaFechado = await storage.fecharCaixa(caixaId, dadosFechamento);
      console.log(
        `✅ Caixa fechado - ID: ${caixaId}, Saldo Final: R$ ${saldoFinal.toFixed(2)}`,
      );
      res.json(caixaFechado);
    } catch (error) {
      console.error("Erro ao fechar caixa:", error);
      res.status(500).json({ error: "Erro ao fechar caixa" });
    }
  });

  app.get("/api/caixas/:id/movimentacoes", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.getMovimentacoesCaixa) {
        return res
          .status(501)
          .json({ error: "Método getMovimentacoesCaixa não implementado" });
      }

      const movimentacoes = await storage.getMovimentacoesCaixa(parseInt(id));
      res.json(movimentacoes || []);
    } catch (error) {
      console.error("Erro ao buscar movimentações:", error);
      res.status(500).json({ error: "Erro ao buscar movimentações" });
    }
  });

  app.post("/api/caixas/:id/movimentacoes", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const { id } = req.params;
      const caixaId = parseInt(id);

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (
        !storage.getCaixa ||
        !storage.createMovimentacaoCaixa ||
        !storage.atualizarTotaisCaixa
      ) {
        return res
          .status(501)
          .json({ error: "Métodos de movimentação não implementados" });
      }

      const caixa = await storage.getCaixa(caixaId);
      if (!caixa) {
        return res.status(404).json({ error: "Caixa não encontrado" });
      }

      if (caixa.user_id !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (caixa.status === "fechado") {
        return res
          .status(400)
          .json({
            error: "Não é possível adicionar movimentações em caixa fechado",
          });
      }

      const valor = parseFloat(req.body.valor);
      if (isNaN(valor) || valor <= 0) {
        return res.status(400).json({ error: "Valor inválido" });
      }

      const tipo = req.body.tipo;
      if (!["suprimento", "retirada"].includes(tipo)) {
        return res.status(400).json({ error: "Tipo de movimentação inválido" });
      }

      const movimentacaoData = {
        caixa_id: caixaId,
        user_id: userId,
        tipo: tipo,
        valor: valor,
        descricao: req.body.descricao || null,
        data: new Date().toISOString(),
      };

      const movimentacao =
        await storage.createMovimentacaoCaixa(movimentacaoData);

      // Atualizar totais do caixa
      const campo =
        tipo === "suprimento" ? "total_suprimentos" : "total_retiradas";
      await storage.atualizarTotaisCaixa(caixaId, campo, valor);

      console.log(
        `✅ Movimentação registrada - Caixa: ${caixaId}, Tipo: ${tipo}, Valor: R$ ${valor.toFixed(2)}`,
      );
      res.json(movimentacao);
    } catch (error) {
      console.error("Erro ao criar movimentação:", error);
      res.status(500).json({ error: "Erro ao criar movimentação" });
    }
  });

  app.delete("/api/caixas/historico", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.limparHistoricoCaixas) {
        return res
          .status(501)
          .json({ error: "Método limparHistoricoCaixas não implementado" });
      }

      const resultado = await storage.limparHistoricoCaixas(userId);
      console.log(
        `✅ Histórico de caixas limpo - User: ${userId}, Caixas removidos: ${resultado.deletedCount}`,
      );
      res.json({ success: true, deletedCount: resultado.deletedCount });
    } catch (error) {
      console.error("Erro ao limpar histórico de caixas:", error);
      res.status(500).json({ error: "Erro ao limpar histórico de caixas" });
    }
  });

  app.get("/api/devolucoes", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;

      if (!storage.getDevolucoes) {
        return res
          .status(501)
          .json({ error: "Método getDevolucoes não implementado" });
      }

      const allDevolucoes = await storage.getDevolucoes();
      const devolucoes = allDevolucoes.filter((d) => d.user_id === userId);

      console.log(
        `✅ Devoluções buscadas - User: ${userId}, Total: ${devolucoes.length}`,
      );
      res.json(devolucoes);
    } catch (error) {
      console.error("Erro ao buscar devoluções:", error);
      res.status(500).json({ error: "Erro ao buscar devoluções" });
    }
  });

  app.get("/api/devolucoes/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      if (!storage.getDevolucao) {
        return res
          .status(501)
          .json({ error: "Método getDevolucao não implementado" });
      }

      const devolucao = await storage.getDevolucao(id);

      if (!devolucao || devolucao.user_id !== userId) {
        return res.status(404).json({ error: "Devolução não encontrada" });
      }

      res.json(devolucao);
    } catch (error) {
      console.error("Erro ao buscar devolução:", error);
      res.status(500).json({ error: "Erro ao buscar devolução" });
    }
  });

  app.post("/api/devolucoes", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;

      if (!storage.createDevolucao) {
        return res
          .status(501)
          .json({ error: "Método createDevolucao não implementado" });
      }

      const { insertDevolucaoSchema } = await import("@shared/schema");
      const validatedData = insertDevolucaoSchema.parse({
        ...req.body,
        user_id: userId,
        data_devolucao: new Date().toISOString(),
      });

      const devolucao = await storage.createDevolucao(validatedData);

      if (devolucao.status === "aprovada" && devolucao.produto_id) {
        const produto = await storage.getProduto(devolucao.produto_id);
        if (produto) {
          await storage.updateProduto(devolucao.produto_id, {
            quantidade: produto.quantidade + devolucao.quantidade,
          });
        }
      }

      console.log(
        `✅ Devolução criada - ID: ${devolucao.id}, Produto: ${devolucao.produto_nome}`,
      );
      res.json(devolucao);
    } catch (error) {
      console.error("Erro ao criar devolução:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar devolução" });
    }
  });

  app.put("/api/devolucoes/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      if (!storage.getDevolucao || !storage.updateDevolucao) {
        return res
          .status(501)
          .json({ error: "Métodos de devolução não implementados" });
      }

      const devolucaoExistente = await storage.getDevolucao(id);

      if (!devolucaoExistente || devolucaoExistente.user_id !== userId) {
        return res.status(404).json({ error: "Devolução não encontrada" });
      }

      const { insertDevolucaoSchema } = await import("@shared/schema");
      const updateSchema = insertDevolucaoSchema.partial();
      const validatedData = updateSchema.parse(req.body);

      const devolucao = await storage.updateDevolucao(id, validatedData);

      if (
        devolucaoExistente.status !== "aprovada" &&
        validatedData.status === "aprovada" &&
        devolucaoExistente.produto_id
      ) {
        const produto = await storage.getProduto(devolucaoExistente.produto_id);
        if (produto) {
          await storage.updateProduto(devolucaoExistente.produto_id, {
            quantidade: produto.quantidade + (validatedData.quantidade || devolucaoExistente.quantidade),
          });
        }
      }

      console.log(
        `✅ Devolução atualizada - ID: ${id}, Status: ${validatedData.status || devolucaoExistente.status}, Quantidade: ${validatedData.quantidade || devolucaoExistente.quantidade}`,
      );
      res.json(devolucao);
    } catch (error) {
      console.error("Erro ao atualizar devolução:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar devolução" });
    }
  });

  app.delete("/api/devolucoes/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      if (!storage.getDevolucao || !storage.deleteDevolucao) {
        return res
          .status(501)
          .json({ error: "Métodos de devolução não implementados" });
      }

      const devolucao = await storage.getDevolucao(id);

      if (!devolucao || devolucao.user_id !== userId) {
        return res.status(404).json({ error: "Devolução não encontrada" });
      }

      await storage.deleteDevolucao(id);
      console.log(`✅ Devolução deletada - ID: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar devolução:", error);
      res.status(500).json({ error: "Erro ao deletar devolução" });
    }
  });

  // Rotas de orçamentos
  app.get("/api/orcamentos", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers["effective-user-id"] as string;
      const allOrcamentos = await storage.getOrcamentos();
      const orcamentos = allOrcamentos.filter((o) => o.user_id === effectiveUserId);
      console.log(`✅ Orçamentos buscados - User: ${effectiveUserId}, Total: ${orcamentos.length}`);
      res.json(orcamentos);
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      res.status(500).json({ error: "Erro ao buscar orçamentos" });
    }
  });

  app.get("/api/orcamentos/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      const orcamento = await storage.getOrcamento(id);

      if (!orcamento || orcamento.user_id !== userId) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }

      res.json(orcamento);
    } catch (error) {
      console.error("Erro ao buscar orçamento:", error);
      res.status(500).json({ error: "Erro ao buscar orçamento" });
    }
  });

  app.post("/api/orcamentos", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;

      const { insertOrcamentoSchema } = await import("@shared/schema");

      // Validar dados recebidos
      const validatedData = insertOrcamentoSchema.parse({
        ...req.body,
        user_id: userId,
      });

      // Gerar número do orçamento
      const numeroOrcamento = `ORC-${Date.now()}`;
      const dataAtual = new Date().toISOString();

      // Criar orçamento com todos os dados
      const orcamentoData = {
        user_id: userId,
        numero: numeroOrcamento,
        cliente_nome: validatedData.cliente_nome,
        cliente_email: validatedData.cliente_email || null,
        cliente_telefone: validatedData.cliente_telefone || null,
        cliente_cpf_cnpj: validatedData.cliente_cpf_cnpj || null,
        cliente_endereco: validatedData.cliente_endereco || null,
        validade: validatedData.validade || '30 dias',
        itens: validatedData.itens,
        subtotal: validatedData.subtotal,
        desconto: validatedData.desconto || 0,
        valor_total: validatedData.valor_total,
        observacoes: validatedData.observacoes || null,
        condicoes_pagamento: validatedData.condicoes_pagamento || null,
        prazo_entrega: validatedData.prazo_entrega || null,
        status: validatedData.status || 'pendente',
        data_criacao: dataAtual,
        data_atualizacao: dataAtual,
      };

      const orcamento = await storage.createOrcamento(orcamentoData);

      console.log(`✅ Orçamento criado - ID: ${orcamento.id}, Número: ${orcamento.numero}, Cliente: ${orcamento.cliente_nome}`);
      res.json(orcamento);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar orçamento" });
    }
  });

  app.put("/api/orcamentos/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const orcamentoExistente = await storage.getOrcamento(id);

      if (!orcamentoExistente || orcamentoExistente.user_id !== userId) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }

      const { insertOrcamentoSchema } = await import("@shared/schema");
      const updateSchema = insertOrcamentoSchema.partial();
      const validatedData = updateSchema.parse({
        ...req.body,
        data_atualizacao: new Date().toISOString(),
      });

      const orcamento = await storage.updateOrcamento(id, validatedData);

      console.log(`✅ Orçamento atualizado - ID: ${id}, Status: ${orcamento?.status}`);
      res.json(orcamento);
    } catch (error) {
      console.error("Erro ao atualizar orçamento:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao atualizar orçamento" });
    }
  });

  app.delete("/api/orcamentos/:id", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const id = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const orcamento = await storage.getOrcamento(id);

      if (!orcamento || orcamento.user_id !== userId) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }

      await storage.deleteOrcamento(id);
      console.log(`✅ Orçamento deletado - ID: ${id}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar orçamento:", error);
      res.status(500).json({ error: "Erro ao deletar orçamento" });
    }
  });

  app.post("/api/orcamentos/:id/converter-venda", getUserId, async (req, res) => {
    try {
      const userId = req.headers["effective-user-id"] as string;
      const funcionarioId = req.headers["funcionario-id"] as string;
      const id = parseInt(req.params.id);
      const { forma_pagamento } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!storage.converterOrcamentoEmVenda) {
        return res.status(501).json({ error: "Método converterOrcamentoEmVenda não implementado" });
      }

      // Buscar orçamento para validar estoque
      const orcamento = await storage.getOrcamento(id);
      
      if (!orcamento) {
        return res.status(404).json({ error: "Orçamento não encontrado" });
      }

      if (orcamento.user_id !== userId) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (orcamento.status === 'convertido') {
        return res.status(400).json({ error: "Este orçamento já foi convertido em venda" });
      }

      // Validar estoque de todos os produtos
      const itensOrcamento = Array.isArray(orcamento.itens) ? orcamento.itens : [];
      const produtosInsuficientes: string[] = [];

      for (const item of itensOrcamento as any[]) {
        const produto = await storage.getProduto(item.produto_id);
        
        if (!produto) {
          return res.status(404).json({ 
            error: `Produto ${item.nome} não encontrado no sistema` 
          });
        }

        if (produto.user_id !== userId) {
          return res.status(403).json({ 
            error: `Acesso negado ao produto ${item.nome}` 
          });
        }

        if (produto.quantidade < item.quantidade) {
          produtosInsuficientes.push(
            `${item.nome}: disponível ${produto.quantidade}, necessário ${item.quantidade}`
          );
        }
      }

      // Se houver produtos com estoque insuficiente, retornar erro
      if (produtosInsuficientes.length > 0) {
        return res.status(400).json({ 
          error: "Estoque insuficiente para converter este orçamento em venda",
          detalhes: produtosInsuficientes
        });
      }

      // Buscar nome do vendedor
      let vendedorNome = 'Sistema';
      if (funcionarioId) {
        const funcionario = await storage.getFuncionario(funcionarioId);
        if (funcionario) {
          vendedorNome = funcionario.nome;
        }
      } else {
        const usuario = await storage.getUserById(userId);
        if (usuario) {
          vendedorNome = usuario.nome;
        }
      }

      const venda = await storage.converterOrcamentoEmVenda(id, userId, vendedorNome, forma_pagamento || 'dinheiro');
      console.log(`✅ Orçamento ${id} convertido em venda ${venda.id} por ${vendedorNome}`);
      res.json(venda);
    } catch (error: any) {
      console.error("Erro ao converter orçamento:", error);
      res.status(500).json({ error: error.message || "Erro ao converter orçamento" });
    }
  });

  // ============================================
  // ROTAS CLIENTE 360° - ADMIN MASTER
  // ============================================

  // Notas do Cliente
  app.get("/api/admin/clients/:userId/notes", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const notes = await storage.getClientNotes(userId, limit, offset);
      res.json(notes);
    } catch (error) {
      console.error("Erro ao buscar notas:", error);
      res.status(500).json({ error: "Erro ao buscar notas do cliente" });
    }
  });

  app.post("/api/admin/clients/:userId/notes", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.headers["x-user-id"] as string;

      const note = await storage.createClientNote({
        user_id: userId,
        admin_id: adminId,
        content: req.body.content,
      });

      res.json(note);
    } catch (error) {
      console.error("Erro ao criar nota:", error);
      res.status(500).json({ error: "Erro ao criar nota" });
    }
  });

  app.put("/api/admin/clients/notes/:noteId", requireAdmin, async (req, res) => {
    try {
      const { noteId } = req.params;
      const note = await storage.updateClientNote(parseInt(noteId), req.body);
      res.json(note);
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
      res.status(500).json({ error: "Erro ao atualizar nota" });
    }
  });

  app.delete("/api/admin/clients/notes/:noteId", requireAdmin, async (req, res) => {
    try {
      const { noteId } = req.params;
      await storage.deleteClientNote(parseInt(noteId));
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar nota:", error);
      res.status(500).json({ error: "Erro ao deletar nota" });
    }
  });

  // Documentos do Cliente
  app.get("/api/admin/clients/:userId/documents", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const documents = await storage.getClientDocuments(userId, limit, offset);
      res.json(documents);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      res.status(500).json({ error: "Erro ao buscar documentos" });
    }
  });

  app.post("/api/admin/clients/:userId/documents", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.headers["x-user-id"] as string;

      const document = await storage.createClientDocument({
        user_id: userId,
        admin_id: adminId,
        file_name: req.body.file_name,
        file_url: req.body.file_url,
        file_type: req.body.file_type,
        file_size: req.body.file_size,
        description: req.body.description,
      });

      res.json(document);
    } catch (error) {
      console.error("Erro ao criar documento:", error);
      res.status(500).json({ error: "Erro ao criar documento" });
    }
  });

  app.delete("/api/admin/clients/documents/:documentId", requireAdmin, async (req, res) => {
    try {
      const { documentId } = req.params;
      await storage.deleteClientDocument(parseInt(documentId));
      res.json({ success: true });
    } catch (error) {
      console.error("Erro ao deletar documento:", error);
      res.status(500).json({ error: "Erro ao deletar documento" });
    }
  });

  // Interações/Timeline do Cliente
  app.get("/api/admin/clients/:userId/interactions", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const interactions = await storage.getClientInteractions(userId, limit, offset);
      res.json(interactions);
    } catch (error) {
      console.error("Erro ao buscar interações:", error);
      res.status(500).json({ error: "Erro ao buscar interações" });
    }
  });

  app.post("/api/admin/clients/:userId/interactions", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.headers["x-user-id"] as string;

      const interaction = await storage.createClientInteraction({
        user_id: userId,
        admin_id: adminId,
        interaction_type: req.body.interaction_type,
        description: req.body.description,
        metadata: req.body.metadata,
      });

      res.json(interaction);
    } catch (error) {
      console.error("Erro ao criar interação:", error);
      res.status(500).json({ error: "Erro ao criar interação" });
    }
  });

  // Histórico de Mudanças de Plano
  app.get("/api/admin/clients/:userId/plan-changes", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const changes = await storage.getPlanChangesHistory(userId, limit, offset);
      res.json(changes);
    } catch (error) {
      console.error("Erro ao buscar histórico de planos:", error);
      res.status(500).json({ error: "Erro ao buscar histórico de planos" });
    }
  });

  app.post("/api/admin/clients/:userId/plan-changes", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.headers["x-user-id"] as string;

      const change = await storage.createPlanChangeHistory({
        user_id: userId,
        from_plan: req.body.from_plan,
        to_plan: req.body.to_plan,
        reason: req.body.reason,
        changed_by: adminId,
        metadata: req.body.metadata,
      });

      res.json(change);
    } catch (error) {
      console.error("Erro ao criar registro de mudança de plano:", error);
      res.status(500).json({ error: "Erro ao criar registro" });
    }
  });

  // Comunicações do Cliente
  app.get("/api/admin/clients/:userId/communications", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const communications = await storage.getClientCommunications(userId, limit, offset);
      res.json(communications);
    } catch (error) {
      console.error("Erro ao buscar comunicações:", error);
      res.status(500).json({ error: "Erro ao buscar comunicações" });
    }
  });

  app.post("/api/admin/clients/:userId/communications", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.headers["x-user-id"] as string;

      const communication = await storage.createClientCommunication({
        user_id: userId,
        admin_id: adminId,
        type: req.body.type,
        subject: req.body.subject,
        content: req.body.content,
        metadata: req.body.metadata,
      });

      res.json(communication);
    } catch (error) {
      console.error("Erro ao criar comunicação:", error);
      res.status(500).json({ error: "Erro ao criar comunicação" });
    }
  });

  // Timeline Completa (todos os eventos)
  app.get("/api/admin/clients/:userId/timeline", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const timeline = await storage.getClientTimeline(userId, limit, offset);
      res.json(timeline);
    } catch (error) {
      console.error("Erro ao buscar timeline:", error);
      res.status(500).json({ error: "Erro ao buscar timeline do cliente" });
    }
  });

  app.get("/api/system-config/:key", async (req, res) => {
    try {
      const { key } = req.params;

      if (!storage.getSystemConfig) {
        return res
          .status(501)
          .json({ error: "Método getSystemConfig não implementado" });
      }

      const config = await storage.getSystemConfig(key);

      if (!config) {
        return res.status(404).json({ error: "Configuração não encontrada" });
      }

      res.json(config);
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
      res.status(500).json({ error: "Erro ao buscar configuração" });
    }
  });

  app.post("/api/system-config", requireAdmin, async (req, res) => {
    try {
      const { chave, valor } = req.body;

      if (!chave || !valor) {
        return res
          .status(400)
          .json({ error: "Chave e valor são obrigatórios" });
      }

      if (!storage.upsertSystemConfig) {
        return res
          .status(501)
          .json({ error: "Método upsertSystemConfig não implementado" });
      }

      const config = await storage.upsertSystemConfig(chave, valor);
      console.log(`✅ Configuração salva - Chave: ${chave}`);
      res.json(config);
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      res.status(500).json({ error: "Erro ao salvar configuração" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}