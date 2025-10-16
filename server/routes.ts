import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProdutoSchema, insertVendaSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ id: user.id, email: user.email, nome: user.nome });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Erro ao criar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, senha } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.senha !== senha) {
        return res.status(401).json({ error: "Email ou senha inválidos" });
      }
      
      res.json({ id: user.id, email: user.email, nome: user.nome });
    } catch (error) {
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.get("/api/produtos", async (req, res) => {
    try {
      const produtos = await storage.getProdutos();
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

  app.get("/api/produtos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const produto = await storage.getProduto(id);
      
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.get("/api/produtos/codigo/:codigo", async (req, res) => {
    try {
      const codigo = req.params.codigo;
      const produto = await storage.getProdutoByCodigoBarras(codigo);
      
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar produto" });
    }
  });

  app.post("/api/produtos", async (req, res) => {
    try {
      const produtoData = insertProdutoSchema.parse(req.body);
      
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

  app.put("/api/produtos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.preco !== undefined && updates.preco <= 0) {
        return res.status(400).json({ error: "Preço deve ser positivo" });
      }
      
      if (updates.quantidade !== undefined && updates.quantidade < 0) {
        return res.status(400).json({ error: "Quantidade não pode ser negativa" });
      }
      
      const produto = await storage.updateProduto(id, updates);
      
      if (!produto) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      res.json(produto);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/produtos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProduto(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar produto" });
    }
  });

  app.post("/api/vendas", async (req, res) => {
    try {
      const { itens, cliente_id } = req.body;
      
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
        cliente_id: cliente_id || undefined
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
      const cliente = await storage.updateCliente(id, req.body);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clientes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCliente(id);
      if (!deleted) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json({ success: true });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
