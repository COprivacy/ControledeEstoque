import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertProdutoSchema,
  insertVendaSchema,
  insertConfigFiscalSchema
} from "@shared/schema";
import { nfceSchema } from "@shared/nfce-schema";
import { FocusNFeService } from "./focusnfe";
import { z } from "zod";

// Middleware para verificar se o usuário é admin
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const isAdmin = req.headers['x-is-admin'] as string;

  if (!userId || isAdmin !== "true") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar este recurso." });
  }

  next();
}

// Middleware para extrair e validar user_id (lida com funcionários)
function getUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const userType = req.headers['x-user-type'] as string;
  const contaId = req.headers['x-conta-id'] as string;

  if (!userId) {
    return res.status(401).json({ error: "Autenticação necessária. Header x-user-id não fornecido." });
  }

  // Se for funcionário, usa o conta_id (ID do dono da conta) como user_id efetivo
  // Caso contrário, usa o próprio userId
  if (userType === "funcionario" && contaId) {
    req.headers['effective-user-id'] = contaId;
  } else {
    req.headers['effective-user-id'] = userId;
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Middleware para desabilitar cache em todas as rotas da API
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
        data_criacao: dataCriacao,
        data_expiracao_trial: dataExpiracao.toISOString(),
        data_expiracao_plano: dataExpiracao.toISOString(),
        status: "ativo"
      };

      const user = await storage.createUser(userWithTrial);
      res.json({
        id: user.id,
        email: user.email,
        nome: user.nome,
        data_criacao: user.data_criacao,
        data_expiracao_trial: user.data_expiracao_trial
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;

      console.log(`🔐 Tentativa de login - Email: ${email}`);

      if (!email || !senha) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      // Primeiro tenta autenticar como usuário principal
      const user = await storage.getUserByEmail(email);
      
      console.log(`📋 Usuário encontrado:`, user ? `Sim (${user.email})` : 'Não');
      
      if (user) {
        console.log(`🔑 Comparando senhas - Recebida: "${senha}" | Armazenada: "${user.senha}"`);
        console.log(`🔑 Tipo da senha recebida: ${typeof senha} | Tipo da senha armazenada: ${typeof user.senha}`);
        console.log(`🔑 Senhas são iguais? ${user.senha === senha}`);
        console.log(`🔑 Dados completos do usuário:`, JSON.stringify(user, null, 2));
      } else {
        console.log(`❌ Email não encontrado no banco: ${email}`);
      }

      if (user && user.senha === senha) {
        console.log(`✅ Login bem-sucedido para usuário: ${user.email}`);
        return res.json({
          id: user.id,
          email: user.email,
          nome: user.nome,
          plano: user.plano,
          is_admin: user.is_admin,
          data_expiracao_trial: user.data_expiracao_trial,
          data_expiracao_plano: user.data_expiracao_plano,
          permissoes: user.permissoes,
          tipo: "usuario"
        });
      }

      // Se não encontrou, tenta autenticar como funcionário
      try {
        const funcionarios = await storage.getFuncionarios();
        const funcionario = funcionarios.find(f => f.email === email && f.senha === senha);

        if (funcionario) {
          console.log(`✅ Login bem-sucedido para funcionário: ${funcionario.email}`);
          return res.json({
            id: funcionario.id,
            email: funcionario.email,
            nome: funcionario.nome,
            plano: "free",
            is_admin: "false",
            tipo: "funcionario",
            conta_id: funcionario.conta_id,
            cargo: "Funcionário"
          });
        }
      } catch (funcError) {
        console.log("Nenhum funcionário encontrado, continuando...");
      }

      console.log(`❌ Falha de login para: ${email}`);
      return res.status(401).json({ error: "Email ou senha inválidos" });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        plano: user.plano || "free",
        is_admin: user.is_admin || "false",
        data_criacao: user.data_criacao || null,
        data_expiracao_trial: user.data_expiracao_trial || null
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

      delete updates.senha;
      delete updates.id;

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
        ultimo_acesso: updatedUser.ultimo_acesso
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ [DELETE USER] Tentando deletar usuário ID: ${id}`);
      await storage.deleteUser(id);
      console.log(`✅ [DELETE USER] Usuário ${id} deletado com sucesso do banco de dados`);
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
        if (user.data_expiracao_trial && user.plano === 'free') {
          const expirationDate = new Date(user.data_expiracao_trial);
          const now = new Date();
          
          if (now < expirationDate) {
            await storage.updateUser(user.id, {
              plano: "trial",
              data_expiracao_plano: user.data_expiracao_trial
            });
            fixedCount++;
            console.log(`✅ Usuário ${user.email} corrigido para plano trial`);
          }
        }
      }

      res.json({ 
        success: true, 
        message: `${fixedCount} usuário(s) trial corrigido(s)`,
        fixedCount 
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
        return res.status(501).json({ error: "Método getPlanos não implementado" });
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
        return res.status(501).json({ error: "Método createPlano não implementado" });
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
        return res.status(501).json({ error: "Método updatePlano não implementado" });
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
        return res.status(501).json({ error: "Método deletePlano não implementado" });
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

  // Rotas de Configuração Asaas
  app.get("/api/config-asaas", async (req, res) => {
    try {
      const config = await storage.getConfigAsaas();
      if (!config) {
        return res.json(null);
      }
      res.json({
        ...config,
        api_key: config.api_key ? '***' : ''
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar configuração Asaas" });
    }
  });

  app.post("/api/config-asaas", async (req, res) => {
    try {
      const configData = {
        ...req.body,
        updated_at: new Date().toISOString()
      };
      const config = await storage.saveConfigAsaas(configData);
      res.json({
        ...config,
        api_key: '***'
      });
    } catch (error) {
      console.error("Erro ao salvar config Asaas:", error);
      res.status(500).json({ error: "Erro ao salvar configuração Asaas" });
    }
  });

  app.post("/api/config-asaas/test", async (req, res) => {
    try {
      const { api_key, ambiente } = req.body;

      if (!api_key) {
        return res.status(400).json({ error: "API Key é obrigatória" });
      }

      const { AsaasService } = await import('./asaas');
      const asaas = new AsaasService({ apiKey: api_key, ambiente });
      const result = await asaas.testConnection();

      if (result.success) {
        await storage.updateConfigAsaasStatus('conectado');
      }

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Logs Admin
  app.get("/api/logs-admin", async (req, res) => {
    try {
      const logs = await storage.getLogsAdmin();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar logs" });
    }
  });

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
  app.get("/api/funcionarios", async (req, res) => {
    try {
      const contaId = req.query.conta_id as string;
      if (!contaId) {
        return res.status(400).json({ error: "conta_id é obrigatório" });
      }
      const allFuncionarios = await storage.getFuncionarios();
      const funcionarios = allFuncionarios.filter(f => f.conta_id === contaId);
      res.json(funcionarios);
    } catch (error: any) {
      console.error("Erro ao buscar funcionários:", error);
      res.status(500).json({ error: error.message || "Erro ao buscar funcionários" });
    }
  });

  app.post("/api/funcionarios", async (req, res) => {
    try {
      const { conta_id, nome, email, senha, cargo } = req.body;

      if (!conta_id || !nome || !email || !senha) {
        return res.status(400).json({ error: "Dados incompletos" });
      }

      // Verificar se já existe funcionário com este email na mesma conta
      const allFuncionarios = await storage.getFuncionarios();
      const existingFuncionario = allFuncionarios.find(
        f => f.email === email && f.conta_id === conta_id
      );

      if (existingFuncionario) {
        return res.status(400).json({ error: "Já existe um funcionário com este email nesta conta" });
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

      // Criar permissões padrão (todas desabilitadas)
      await storage.savePermissoesFuncionario(funcionario.id, {
        pdv: "false",
        produtos: "false",
        inventario: "false",
        relatorios: "false",
        clientes: "false",
        fornecedores: "false",
        financeiro: "false",
        config_fiscal: "false",
      });

      res.json(funcionario);
    } catch (error: any) {
      console.error("Erro ao criar funcionário:", error);
      res.status(500).json({ error: error.message || "Erro ao criar funcionário" });
    }
  });

  app.patch("/api/funcionarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      delete updates.id;
      delete updates.conta_id;

      const funcionario = await storage.updateFuncionario(id, updates);

      if (!funcionario) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      res.json(funcionario);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar funcionário" });
    }
  });

  app.delete("/api/funcionarios/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFuncionario(id);

      if (!deleted) {
        return res.status(404).json({ error: "Funcionário não encontrado" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar funcionário" });
    }
  });

  // Permissões de Funcionários
  app.get("/api/funcionarios/:id/permissoes", async (req, res) => {
    try {
      const { id } = req.params;
      const permissoes = await storage.getPermissoesFuncionario(id);

      if (!permissoes) {
        return res.json({
          pdv: "false",
          produtos: "false",
          inventario: "false",
          relatorios: "false",
          clientes: "false",
          fornecedores: "false",
          financeiro: "false",
          config_fiscal: "false",
        });
      }

      res.json(permissoes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar permissões" });
    }
  });

  app.post("/api/funcionarios/:id/permissoes", async (req, res) => {
    try {
      const { id } = req.params;
      const permissoes = await storage.savePermissoesFuncionario(id, req.body);
      res.json(permissoes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao salvar permissões" });
    }
  });

  app.get("/api/produtos", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const allProdutos = await storage.getProdutos();
      const produtos = allProdutos.filter(p => p.user_id === effectiveUserId);
      const expiring = req.query.expiring;

      if (expiring === 'soon') {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const expiringProducts = produtos.filter(p => {
          if (!p.vencimento) return false;
          const expiryDate = new Date(p.vencimento);
          return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
        });

        return res.json(expiringProducts);
      }

      res.json(produtos);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produtos" });
    }
  });

  app.get("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const id = parseInt(req.params.id);
      const produto = await storage.getProduto(id);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produto.user_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.get("/api/produtos/codigo/:codigo", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const codigo = req.params.codigo;
      const produto = await storage.getProdutoByCodigoBarras(codigo);

      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produto.user_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.post("/api/produtos", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const produtoData = insertProdutoSchema.parse({
        ...req.body,
        user_id: effectiveUserId
      });

      if (produtoData.preco <= 0) {
        return res.status(400).json({ error: "Preço deve ser positivo" });
      }

      if (produtoData.quantidade < 0) {
        return res.status(400).json({ error: "Quantidade não pode ser negativa" });
      }

      const produto = await storage.createProduto(produtoData);
      res.json(produto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar produto" });
    }
  });

  app.put("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const id = parseInt(req.params.id);
      const updates = req.body;

      const produtoExistente = await storage.getProduto(id);
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produtoExistente.user_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      if (updates.preco !== undefined && updates.preco <= 0) {
        return res.status(400).json({ error: "Preço deve ser positivo" });
      }

      if (updates.quantidade !== undefined && updates.quantidade < 0) {
        return res.status(400).json({ error: "Quantidade não pode ser negativa" });
      }

      const produto = await storage.updateProduto(id, updates);
      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/produtos/:id", getUserId, async (req, res) => {
    try {
      const effectiveUserId = req.headers['effective-user-id'] as string;
      const id = parseInt(req.params.id);

      const produtoExistente = await storage.getProduto(id);
      if (!produtoExistente) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (produtoExistente.user_id !== effectiveUserId) {
        return res.status(403).json({ error: "Acesso negado. Este produto não pertence a você." });
      }

      const deleted = await storage.deleteProduto(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar produto" });
    }
  });

  app.post("/api/vendas", async (req, res) => {
    try {
      const { itens, cliente_id, forma_pagamento } = req.body;

      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: "Itens da venda são obrigatórios" });
      }

      let valorTotal = 0;
      const produtosVendidos = [];

      for (const item of itens) {
        const produto = await storage.getProdutoByCodigoBarras(item.codigo_barras);

        if (!produto) {
          return res.status(404).json({ error: `Produto com código ${item.codigo_barras} não encontrado` });
        }

        if (produto.quantidade < item.quantidade) {
          return res.status(400).json({
            error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.quantidade}`
          });
        }

        const subtotal = produto.preco * item.quantidade;
        valorTotal += subtotal;

        await storage.updateProduto(produto.id, {
          quantidade: produto.quantidade - item.quantidade
        });

        produtosVendidos.push({
          nome: produto.nome,
          quantidade: item.quantidade,
          preco_unitario: produto.preco,
          subtotal
        });
      }

      const agora = new Date();
      const venda = await storage.createVenda({
        produto: produtosVendidos.map(p => p.nome).join(", "),
        quantidade_vendida: produtosVendidos.reduce((sum, p) => sum + p.quantidade, 0),
        valor_total: valorTotal,
        data: agora.toISOString(),
        itens: JSON.stringify(produtosVendidos),
        cliente_id: cliente_id || undefined,
        forma_pagamento: forma_pagamento || 'dinheiro'
      });

      res.json({
        ...venda,
        itens: produtosVendidos
      });
    } catch (error) {
      res.status(500).json({ error: "Erro ao registrar venda" });
    }
  });

  app.get("/api/vendas", async (req, res) => {
    try {
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      const vendas = await storage.getVendas(startDate, endDate);
      res.json(vendas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar vendas" });
    }
  });

  app.get("/api/reports/daily", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const vendas = await storage.getVendas(today, today);
      const total = vendas.reduce((sum, v) => sum + v.valor_total, 0);

      res.json({ date: today, total, vendas: vendas.length });
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório diário" });
    }
  });

  app.get("/api/reports/weekly", async (req, res) => {
    try {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      const vendas = await storage.getVendas(
        weekAgo.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      );
      const total = vendas.reduce((sum, v) => sum + v.valor_total, 0);

      res.json({ total, vendas: vendas.length });
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório semanal" });
    }
  });

  app.get("/api/reports/expiring", async (req, res) => {
    try {
      const produtos = await storage.getProdutos();
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringProducts = produtos.filter(p => {
        if (!p.vencimento) return false;
        const expiryDate = new Date(p.vencimento);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
      }).map(p => {
        const expiryDate = new Date(p.vencimento!);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...p,
          daysUntilExpiry,
          status: daysUntilExpiry <= 7 ? 'critical' : 'warning'
        };
      }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      res.json(expiringProducts);
    } catch (error) {
      res.status(500).json({ error: "Erro ao gerar relatório de vencimentos" });
    }
  });

  app.delete("/api/vendas", async (req, res) => {
    try {
      await storage.clearVendas();
      res.json({ success: true, message: "Histórico de vendas limpo com sucesso" });
    } catch (error) {
      res.status(500).json({ error: "Erro ao limpar histórico de vendas" });
    }
  });

  // Rotas de Fornecedores
  app.get("/api/fornecedores", async (req, res) => {
    try {
      const fornecedores = await storage.getFornecedores();
      res.json(fornecedores);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar fornecedores" });
    }
  });

  app.get("/api/fornecedores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fornecedor = await storage.getFornecedor(id);
      if (!fornecedor) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar fornecedor" });
    }
  });

  app.post("/api/fornecedores", async (req, res) => {
    try {
      const fornecedorData = {
        ...req.body,
        data_cadastro: new Date().toISOString(),
      };
      const fornecedor = await storage.createFornecedor(fornecedorData);
      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar fornecedor" });
    }
  });

  app.put("/api/fornecedores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const fornecedor = await storage.updateFornecedor(id, req.body);
      if (!fornecedor) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      res.json(fornecedor);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar fornecedor" });
    }
  });

  app.delete("/api/fornecedores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFornecedor(id);
      if (!deleted) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar fornecedor" });
    }
  });

  // Rotas de Clientes
  app.get("/api/clientes", async (req, res) => {
    try {
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clientes", async (req, res) => {
    try {
      const clienteData = {
        ...req.body,
        data_cadastro: new Date().toISOString(),
      };
      const cliente = await storage.createCliente(clienteData);
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔄 [UPDATE CLIENTE] ID: ${id}`);
      console.log(`📝 [UPDATE CLIENTE] Dados recebidos:`, JSON.stringify(req.body, null, 2));
      
      const cliente = await storage.updateCliente(id, req.body);
      
      if (!cliente) {
        console.log(`❌ [UPDATE CLIENTE] Cliente não encontrado com ID: ${id}`);
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      
      console.log(`✅ [UPDATE CLIENTE] Cliente atualizado com sucesso:`, JSON.stringify(cliente, null, 2));
      res.json(cliente);
    } catch (error) {
      console.error(`❌ [UPDATE CLIENTE] Erro ao atualizar cliente:`, error);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ [DELETE CLIENTE] Tentando deletar cliente ID: ${id}`);
      const deleted = await storage.deleteCliente(id);
      if (!deleted) {
        console.log(`⚠️ [DELETE CLIENTE] Cliente ${id} não encontrado`);
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      console.log(`✅ [DELETE CLIENTE] Cliente ${id} deletado com sucesso`);
      res.json({ success: true });
    } catch (error) {
      console.log(`❌ [DELETE CLIENTE] Erro ao deletar cliente ${id}:`, error);
      res.status(500).json({ error: "Erro ao deletar cliente" });
    }
  });

  // Rotas de Compras
  app.get("/api/compras", async (req, res) => {
    try {
      const fornecedorId = req.query.fornecedor_id ? parseInt(req.query.fornecedor_id as string) : undefined;
      const startDate = req.query.start_date as string;
      const endDate = req.query.end_date as string;

      const compras = await storage.getCompras(fornecedorId, startDate, endDate);
      res.json(compras);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar compras" });
    }
  });

  app.post("/api/compras", async (req, res) => {
    try {
      const { fornecedor_id, produto_id, quantidade, valor_unitario, observacoes } = req.body;

      const produto = await storage.getProduto(produto_id);
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const fornecedor = await storage.getFornecedor(fornecedor_id);
      if (!fornecedor) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }

      const valor_total = valor_unitario * quantidade;

      await storage.updateProduto(produto_id, {
        quantidade: produto.quantidade + quantidade
      });

      const compra = await storage.createCompra({
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

  app.put("/api/compras/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantidade: novaQuantidade, valor_unitario, observacoes, produto_id } = req.body;

      const compraExistente = await storage.getCompras();
      const compra = compraExistente.find(c => c.id === id);

      if (!compra) {
        return res.status(404).json({ error: "Compra não encontrada" });
      }

      if (novaQuantidade !== undefined && novaQuantidade !== compra.quantidade) {
        const produto = await storage.getProduto(compra.produto_id);
        if (!produto) {
          return res.status(404).json({ error: "Produto não encontrado" });
        }

        const diferencaQuantidade = novaQuantidade - compra.quantidade;
        await storage.updateProduto(compra.produto_id, {
          quantidade: produto.quantidade + diferencaQuantidade
        });
      }

      const updates: Partial<typeof compra> = {};
      if (novaQuantidade !== undefined) updates.quantidade = novaQuantidade;
      if (valor_unitario !== undefined) updates.valor_unitario = valor_unitario;
      if (observacoes !== undefined) updates.observacoes = observacoes;

      if (novaQuantidade !== undefined || valor_unitario !== undefined) {
        const quantidadeFinal = novaQuantidade !== undefined ? novaQuantidade : compra.quantidade;
        const valorUnitarioFinal = valor_unitario !== undefined ? valor_unitario : compra.valor_unitario;
        updates.valor_total = quantidadeFinal * valorUnitarioFinal;
      }

      const compraAtualizada = await storage.updateCompra(id, updates);
      res.json(compraAtualizada);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar compra" });
    }
  });

  // Contas a Pagar
  app.get("/api/contas-pagar", async (req, res) => {
    try {
      const contas = await storage.getContasPagar();
      res.json(contas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-pagar", async (req, res) => {
    try {
      const conta = await storage.createContaPagar({
        ...req.body,
        status: "pendente",
        data_cadastro: new Date().toISOString(),
      });
      res.json(conta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/contas-pagar/:id", async (req, res) => {
    try {
      const conta = await storage.updateContaPagar(parseInt(req.params.id), req.body);
      res.json(conta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contas-pagar/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ Deletando conta a pagar ID: ${id}`);
      await storage.deleteContaPagar(id);
      console.log(`✅ Conta a pagar ${id} deletada com sucesso`);
      res.json({ success: true });
    } catch (error: any) {
      console.log(`❌ Erro ao deletar conta a pagar:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-pagar/:id/pagar", async (req, res) => {
    try {
      const conta = await storage.updateContaPagar(parseInt(req.params.id), {
        status: "pago",
        data_pagamento: new Date().toISOString(),
      });
      res.json(conta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contas a Receber
  app.get("/api/contas-receber", async (req, res) => {
    try {
      const contas = await storage.getContasReceber();
      res.json(contas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-receber", async (req, res) => {
    try {
      const conta = await storage.createContaReceber({
        ...req.body,
        status: "pendente",
        data_cadastro: new Date().toISOString(),
      });
      res.json(conta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/contas-receber/:id", async (req, res) => {
    try {
      const conta = await storage.updateContaReceber(parseInt(req.params.id), req.body);
      res.json(conta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/contas-receber/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ Deletando conta a receber ID: ${id}`);
      await storage.deleteContaReceber(id);
      console.log(`✅ Conta a receber ${id} deletada com sucesso`);
      res.json({ success: true });
    } catch (error: any) {
      console.log(`❌ Erro ao deletar conta a receber:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contas-receber/:id/receber", async (req, res) => {
    try {
      const conta = await storage.updateContaReceber(parseInt(req.params.id), {
        status: "recebido",
        data_recebimento: new Date().toISOString(),
      });
      res.json(conta);
    } catch (error: any) {
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
        focus_nfe_api_key: config.focus_nfe_api_key ? '***' : ''
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
        focus_nfe_api_key: '***'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao salvar configuração fiscal" });
    }
  });

  app.post("/api/nfce/emitir", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.status(400).json({
          error: "Configuração fiscal não encontrada. Configure em Config. Fiscal primeiro."
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
          details: error.errors
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
          error: "Configuração fiscal não encontrada"
        });
      }

      const focusNFe = new FocusNFeService(config);
      const result = await focusNFe.consultarNFCe(req.params.ref);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao consultar NFCe" });
    }
  });

  app.delete("/api/nfce/:ref", async (req, res) => {
    try {
      const config = await storage.getConfigFiscal();

      if (!config) {
        return res.status(400).json({
          error: "Configuração fiscal não encontrada"
        });
      }

      const { justificativa } = req.body;
      if (!justificativa || justificativa.length < 15) {
        return res.status(400).json({
          error: "Justificativa deve ter no mínimo 15 caracteres"
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

      // Validação de dados
      if (!nome || !email || !plano || !formaPagamento) {
        return res.status(400).json({ error: "Dados incompletos. Por favor, preencha todos os campos." });
      }

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email inválido" });
      }

      const planoValues = {
        premium_mensal: 79.99,
        premium_anual: 767.04
      };

      const planoNomes = {
        premium_mensal: "Premium Mensal",
        premium_anual: "Premium Anual"
      };

      if (!planoValues[plano as keyof typeof planoValues]) {
        return res.status(400).json({ error: "Plano inválido" });
      }

      const config = await storage.getConfigAsaas();
      if (!config || !config.api_key) {
        return res.status(500).json({
          error: "Sistema de pagamento não configurado. Entre em contato com o suporte."
        });
      }

      const { AsaasService } = await import('./asaas');
      const asaas = new AsaasService({
        apiKey: config.api_key,
        ambiente: config.ambiente as 'sandbox' | 'production'
      });

      // Criar ou atualizar cliente no Asaas
      const asaasCustomer = await asaas.createCustomer({
        name: nome,
        email,
        cpfCnpj
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      // Criar cobrança
      const payment = await asaas.createPayment({
        customer: asaasCustomer.id,
        billingType: formaPagamento,
        value: planoValues[plano as keyof typeof planoValues],
        dueDate: dueDate.toISOString().split('T')[0],
        description: `Assinatura ${planoNomes[plano as keyof typeof planoNomes]} - Pavisoft Sistemas`,
        externalReference: `${plano}_${Date.now()}`
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
          asaas_customer_id: asaasCustomer.id,
        });
      } else {
        await storage.updateUser(user.id, {
          asaas_customer_id: asaasCustomer.id
        });
      }

      const dataVencimento = new Date();
      if (plano === 'premium_mensal') {
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      } else {
        dataVencimento.setFullYear(dataVencimento.getFullYear() + 1);
      }

      // Criar registro de assinatura
      const subscription = await storage.createSubscription({
        user_id: user.id,
        plano,
        status: "pendente",
        valor: planoValues[plano as keyof typeof planoValues],
        data_vencimento: dataVencimento.toISOString(),
        asaas_payment_id: payment.id,
        forma_pagamento: formaPagamento,
        status_pagamento: payment.status,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
        pix_qrcode: payment.encodedImage,
      });

      console.log(`✅ Assinatura criada com sucesso - User: ${user.email}, Plano: ${planoNomes[plano as keyof typeof planoNomes]}, Pagamento: ${formaPagamento}`);

      res.json({
        success: true,
        subscription,
        payment: {
          id: payment.id,
          status: payment.status,
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
          pixQrCode: payment.encodedImage,
        },
        message: `Assinatura ${planoNomes[plano as keyof typeof planoNomes]} criada com sucesso! Realize o pagamento para ativar.`
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar checkout:", error);
      res.status(500).json({
        error: error.message || "Erro ao processar pagamento. Tente novamente ou entre em contato com o suporte."
      });
    }
  });

  app.post("/api/webhook/asaas", async (req, res) => {
    try {
      // Verificação de segurança: validar token do webhook
      const webhookToken = req.headers['asaas-access-token'];
      const config = await storage.getConfigAsaas();

      if (!config || !webhookToken || webhookToken !== config.api_key) {
        console.warn("Tentativa de webhook não autorizada");
        return res.status(401).json({ error: "Não autorizado" });
      }

      const { event, payment } = req.body;

      console.log("Webhook Asaas recebido:", event, payment);

      if (!payment || !payment.id) {
        return res.status(400).json({ error: "Dados do webhook inválidos" });
      }

      const subscriptions = await storage.getSubscriptions();
      const subscription = subscriptions?.find(s => s.asaas_payment_id === payment.id);

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
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({ error: "Erro ao processar webhook" });
    }
  });

  // Subscriptions routes - público para painel de admin
  app.get("/api/subscriptions", async (req, res) => {
    try {
      // Permite acesso público para o painel de admin
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

  const httpServer = createServer(app);
  return httpServer;
}