import Database from 'better-sqlite3';
import {
  type User,
  type InsertUser,
  type Produto,
  type InsertProduto,
  type Venda,
  type InsertVenda,
  type Fornecedor,
  type InsertFornecedor,
  type Cliente,
  type InsertCliente,
  type Compra,
  type InsertCompra,
  type ConfigFiscal,
  type InsertConfigFiscal
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { IStorage } from './storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  private users: Map<string, User> = new Map();
  private produtos: Map<number, Produto> = new Map();
  private vendas: Map<number, Venda> = new Map();
  private fornecedores: Map<number, Fornecedor> = new Map();
  private clientes: Map<number, Cliente> = new Map();
  private compras: Map<number, Compra> = new Map();

  private nextUserId = 1;
  private nextProdutoId = 1;
  private nextVendaId = 1;
  private nextFornecedorId = 1;
  private nextClienteId = 1;
  private nextCompraId = 1;

  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, 'database.db');
    this.db = new Database(dbPath || defaultPath);
    this.initializeTables();
    this.loadData();
    this.seedData();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL,
        plano TEXT NOT NULL DEFAULT 'free',
        is_admin TEXT NOT NULL DEFAULT 'false',
        data_criacao TEXT,
        data_expiracao_trial TEXT,
        data_expiracao_plano TEXT,
        ultimo_acesso TEXT,
        status TEXT NOT NULL DEFAULT 'ativo',
        asaas_customer_id TEXT
      );

      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        categoria TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade INTEGER NOT NULL,
        estoque_minimo INTEGER NOT NULL,
        codigo_barras TEXT,
        vencimento TEXT
      );

      CREATE TABLE IF NOT EXISTS vendas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto TEXT NOT NULL,
        quantidade_vendida INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        data TEXT NOT NULL,
        itens TEXT,
        cliente_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cnpj TEXT,
        telefone TEXT,
        email TEXT,
        endereco TEXT,
        observacoes TEXT,
        data_cadastro TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        cpf_cnpj TEXT,
        telefone TEXT,
        email TEXT,
        endereco TEXT,
        observacoes TEXT,
        percentual_desconto REAL,
        data_cadastro TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fornecedor_id INTEGER NOT NULL,
        produto_id INTEGER NOT NULL,
        quantidade INTEGER NOT NULL,
        valor_unitario REAL NOT NULL,
        valor_total REAL NOT NULL,
        data TEXT NOT NULL,
        observacoes TEXT
      );

      CREATE TABLE IF NOT EXISTS config_fiscal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cnpj TEXT NOT NULL,
        razao_social TEXT NOT NULL,
        focus_nfe_api_key TEXT NOT NULL,
        ambiente TEXT NOT NULL DEFAULT 'homologacao',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contas_pagar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        categoria TEXT,
        status TEXT DEFAULT 'pendente',
        data_cadastro TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contas_receber (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        descricao TEXT NOT NULL,
        valor REAL NOT NULL,
        data_vencimento TEXT NOT NULL,
        data_recebimento TEXT,
        categoria TEXT,
        status TEXT DEFAULT 'pendente',
        data_cadastro TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS storage (
        key TEXT PRIMARY KEY,
        data TEXT
      );

      CREATE TABLE IF NOT EXISTS planos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        duracao_dias INTEGER NOT NULL,
        descricao TEXT,
        ativo TEXT NOT NULL DEFAULT 'true',
        data_criacao TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS config_asaas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key TEXT NOT NULL,
        ambiente TEXT NOT NULL DEFAULT 'sandbox',
        webhook_url TEXT,
        account_id TEXT,
        ultima_sincronizacao TEXT,
        status_conexao TEXT DEFAULT 'desconectado',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs_admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id TEXT NOT NULL,
        acao TEXT NOT NULL,
        detalhes TEXT,
        data TEXT NOT NULL
      );
    `);
  }

  private seedData() {
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {
      const users: InsertUser[] = [
        { email: "loja1@gmail.com", senha: "loja123", nome: "Loja 1" },
        { email: "loja2@gmail.com", senha: "loja456", nome: "Loja 2" },
      ];

      const insertUser = this.db.prepare('INSERT INTO users (id, email, senha, nome) VALUES (?, ?, ?, ?)');
      for (const user of users) {
        const id = randomUUID();
        insertUser.run(id, user.email, user.senha, user.nome);
        this.users.set(id, { ...user, id });
      }

      const produtos: InsertProduto[] = [
        {
          nome: "Arroz 5kg",
          categoria: "Alimentos",
          preco: 25.50,
          quantidade: 50,
          estoque_minimo: 10,
          codigo_barras: "7891234567890",
          vencimento: "2025-12-01"
        },
        {
          nome: "Feijão 1kg",
          categoria: "Alimentos",
          preco: 8.90,
          quantidade: 5,
          estoque_minimo: 10,
          codigo_barras: "7891234567891",
          vencimento: "2025-10-18"
        },
        {
          nome: "Óleo de Soja 900ml",
          categoria: "Alimentos",
          preco: 7.50,
          quantidade: 30,
          estoque_minimo: 15,
          codigo_barras: "7891234567892",
          vencimento: "2026-03-15"
        },
      ];

      const insertProduto = this.db.prepare(
        'INSERT INTO produtos (nome, categoria, preco, quantidade, estoque_minimo, codigo_barras, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const produto of produtos) {
        const result = insertProduto.run(
          produto.nome,
          produto.categoria,
          produto.preco,
          produto.quantidade,
          produto.estoque_minimo,
          produto.codigo_barras || null,
          produto.vencimento || null
        );
        this.produtos.set(result.lastInsertRowid as number, { ...produto, id: result.lastInsertRowid as number });
      }

      this.persistData();
    }
  }

  private async loadData() {
    try {
      const data = JSON.parse(this.db.prepare('SELECT data FROM storage LIMIT 1').get()?.data || '{}');

      this.nextUserId = data.nextUserId || 1;
      this.nextProdutoId = data.nextProdutoId || 1;
      this.nextVendaId = data.nextVendaId || 1;
      this.nextFornecedorId = data.nextFornecedorId || 1;
      this.nextClienteId = data.nextClienteId || 1;
      this.nextCompraId = data.nextCompraId || 1;

      if (data.users) {
        data.users.forEach((u: User) => this.users.set(u.id, u));
      }
      if (data.produtos) {
        data.produtos.forEach((p: Produto) => this.produtos.set(p.id, p));
      }
      if (data.vendas) {
        data.vendas.forEach((v: Venda) => this.vendas.set(v.id, v));
      }
      if (data.fornecedores) {
        data.fornecedores.forEach((f: Fornecedor) => this.fornecedores.set(f.id, f));
      }
      if (data.clientes) {
        data.clientes.forEach((c: Cliente) => this.clientes.set(c.id, c));
      }
      if (data.compras) {
        data.compras.forEach((c: Compra) => this.compras.set(c.id, c));
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  private async persistData() {
    const data = {
      users: Array.from(this.users.values()),
      produtos: Array.from(this.produtos.values()),
      vendas: Array.from(this.vendas.values()),
      fornecedores: Array.from(this.fornecedores.values()),
      clientes: Array.from(this.clientes.values()),
      compras: Array.from(this.compras.values()),
      nextUserId: this.nextUserId,
      nextProdutoId: this.nextProdutoId,
      nextVendaId: this.nextVendaId,
      nextFornecedorId: this.nextFornecedorId,
      nextClienteId: this.nextClienteId,
      nextCompraId: this.nextCompraId,
    };
    const jsonData = JSON.stringify(data);
    this.db.prepare('CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, data TEXT)').run();
    this.db.prepare('INSERT OR REPLACE INTO storage (key, data) VALUES (?, ?)').run('storage', jsonData);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const newUser: User = { ...insertUser, id };
    this.users.set(id, newUser);
    await this.persistData();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) {
      return undefined;
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    await this.persistData();
    return updatedUser;
  }

  async getProdutos(): Promise<Produto[]> {
    return Array.from(this.produtos.values());
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    return this.produtos.get(id);
  }

  async getProdutoByCodigoBarras(codigoBarras: string): Promise<Produto | undefined> {
    for (const produto of this.produtos.values()) {
      if (produto.codigo_barras === codigoBarras) {
        return produto;
      }
    }
    return undefined;
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    const id = this.nextProdutoId++;
    const newProduto: Produto = { ...insertProduto, id };
    this.produtos.set(id, newProduto);
    await this.persistData();
    return newProduto;
  }

  async updateProduto(id: number, updates: Partial<InsertProduto>): Promise<Produto | undefined> {
    const produto = this.produtos.get(id);
    if (!produto) return undefined;

    const updatedProduto = { ...produto, ...updates };
    this.produtos.set(id, updatedProduto);
    await this.persistData();
    return updatedProduto;
  }

  async deleteProduto(id: number): Promise<boolean> {
    const deleted = this.produtos.delete(id);
    if (deleted) await this.persistData();
    return deleted;
  }

  async getVendas(startDate?: string, endDate?: string): Promise<Venda[]> {
    let vendas = Array.from(this.vendas.values());

    if (startDate) {
      vendas = vendas.filter(v => v.data >= startDate);
    }
    if (endDate) {
      vendas = vendas.filter(v => v.data <= endDate);
    }
    return vendas;
  }

  async createVenda(insertVenda: InsertVenda): Promise<Venda> {
    const id = this.nextVendaId++;
    const newVenda: Venda = { ...insertVenda, id };
    this.vendas.set(id, newVenda);
    await this.persistData();
    return newVenda;
  }

  async clearVendas(): Promise<void> {
    this.vendas.clear();
    await this.persistData();
  }

  async getFornecedores(): Promise<Fornecedor[]> {
    return Array.from(this.fornecedores.values());
  }

  async getFornecedor(id: number): Promise<Fornecedor | undefined> {
    return this.fornecedores.get(id);
  }

  async createFornecedor(insertFornecedor: InsertFornecedor): Promise<Fornecedor> {
    const id = this.nextFornecedorId++;
    const fornecedor: Fornecedor = { ...insertFornecedor, id };
    this.fornecedores.set(id, fornecedor);
    await this.persistData();
    return fornecedor;
  }

  async updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined> {
    const fornecedor = this.fornecedores.get(id);
    if (!fornecedor) return undefined;
    const updated = { ...fornecedor, ...updates };
    this.fornecedores.set(id, updated);
    await this.persistData();
    return updated;
  }

  async deleteFornecedor(id: number): Promise<boolean> {
    const deleted = this.fornecedores.delete(id);
    if (deleted) await this.persistData();
    return deleted;
  }

  async getClientes(): Promise<Cliente[]> {
    return Array.from(this.clientes.values());
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    return this.clientes.get(id);
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const id = this.nextClienteId++;
    const cliente: Cliente = { ...insertCliente, id };
    this.clientes.set(id, cliente);
    await this.persistData();
    return cliente;
  }

  async updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente | undefined> {
    const cliente = this.clientes.get(id);
    if (!cliente) return undefined;
    const updated = { ...cliente, ...updates };
    this.clientes.set(id, updated);
    await this.persistData();
    return updated;
  }

  async deleteCliente(id: number): Promise<boolean> {
    const deleted = this.clientes.delete(id);
    if (deleted) await this.persistData();
    return deleted;
  }

  async getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]> {
    let compras = Array.from(this.compras.values());

    if (fornecedorId !== undefined) {
      compras = compras.filter(c => c.fornecedor_id === fornecedorId);
    }
    if (startDate) {
      compras = compras.filter(c => c.data >= startDate);
    }
    if (endDate) {
      compras = compras.filter(c => c.data <= endDate);
    }

    return compras;
  }

  async createCompra(insertCompra: InsertCompra): Promise<Compra> {
    const id = this.nextCompraId++;
    const compra: Compra = { ...insertCompra, id };
    this.compras.set(id, compra);
    await this.persistData();
    return compra;
  }

  async updateCompra(id: number, updates: Partial<Compra>): Promise<Compra | undefined> {
    const compra = this.compras.get(id);
    if (!compra) return undefined;

    const updatedCompra = { ...compra, ...updates };
    this.compras.set(id, updatedCompra);
    await this.persistData();
    return updatedCompra;
  }

  async getConfigFiscal(): Promise<ConfigFiscal | undefined> {
    const stmt = this.db.prepare('SELECT * FROM config_fiscal ORDER BY id DESC LIMIT 1');
    const config = stmt.get() as ConfigFiscal | undefined;
    return config;
  }

  async saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal> {
    const updated_at = new Date().toISOString();
    const config: Omit<ConfigFiscal, 'id'> = { ...insertConfig, updated_at };
    
    const existingConfig = await this.getConfigFiscal();
    
    if (existingConfig) {
      const stmt = this.db.prepare(`
        UPDATE config_fiscal 
        SET cnpj = ?, razao_social = ?, focus_nfe_api_key = ?, ambiente = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        config.cnpj, 
        config.razao_social, 
        config.focus_nfe_api_key, 
        config.ambiente, 
        config.updated_at,
        existingConfig.id
      );
      return { ...config, id: existingConfig.id };
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO config_fiscal (cnpj, razao_social, focus_nfe_api_key, ambiente, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        config.cnpj, 
        config.razao_social, 
        config.focus_nfe_api_key, 
        config.ambiente, 
        config.updated_at
      );
      return { ...config, id: Number(info.lastInsertRowid) };
    }
  }

  async getContasPagar(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM contas_pagar ORDER BY data_vencimento ASC');
    return stmt.all();
  }

  async createContaPagar(data: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO contas_pagar (descricao, valor, data_vencimento, categoria, status, data_cadastro)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.descricao,
      data.valor,
      data.data_vencimento,
      data.categoria || null,
      data.status || 'pendente',
      data.data_cadastro
    );
    return { ...data, id: Number(info.lastInsertRowid) };
  }

  async updateContaPagar(id: number, updates: any): Promise<any> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE contas_pagar SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    const result = this.db.prepare('SELECT * FROM contas_pagar WHERE id = ?').get(id);
    return result;
  }

  async deleteContaPagar(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM contas_pagar WHERE id = ?');
    stmt.run(id);
  }

  async getContasReceber(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM contas_receber ORDER BY data_vencimento ASC');
    return stmt.all();
  }

  async createContaReceber(data: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO contas_receber (descricao, valor, data_vencimento, categoria, status, data_cadastro)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.descricao,
      data.valor,
      data.data_vencimento,
      data.categoria || null,
      data.status || 'pendente',
      data.data_cadastro
    );
    return { ...data, id: Number(info.lastInsertRowid) };
  }

  async updateContaReceber(id: number, updates: any): Promise<any> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE contas_receber SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    const result = this.db.prepare('SELECT * FROM contas_receber WHERE id = ?').get(id);
    return result;
  }

  async deleteContaReceber(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM contas_receber WHERE id = ?');
    stmt.run(id);
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) await this.persistData();
    return deleted;
  }

  // Planos
  async getPlanos(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM planos ORDER BY preco ASC');
    return stmt.all();
  }

  async createPlano(data: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO planos (nome, preco, duracao_dias, descricao, ativo, data_criacao)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.nome,
      data.preco,
      data.duracao_dias,
      data.descricao || null,
      data.ativo || 'true',
      data.data_criacao
    );
    return { ...data, id: Number(info.lastInsertRowid) };
  }

  async updatePlano(id: number, updates: any): Promise<any> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE planos SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    return this.db.prepare('SELECT * FROM planos WHERE id = ?').get(id);
  }

  async deletePlano(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM planos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Config Asaas
  async getConfigAsaas(): Promise<any> {
    const stmt = this.db.prepare('SELECT * FROM config_asaas ORDER BY id DESC LIMIT 1');
    return stmt.get();
  }

  async saveConfigAsaas(data: any): Promise<any> {
    const updated_at = new Date().toISOString();
    const existing = await this.getConfigAsaas();
    
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE config_asaas 
        SET api_key = ?, ambiente = ?, webhook_url = ?, account_id = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(
        data.api_key,
        data.ambiente || 'sandbox',
        data.webhook_url || null,
        data.account_id || null,
        updated_at,
        existing.id
      );
      return { ...data, id: existing.id, updated_at };
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO config_asaas (api_key, ambiente, webhook_url, account_id, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        data.api_key,
        data.ambiente || 'sandbox',
        data.webhook_url || null,
        data.account_id || null,
        updated_at
      );
      return { ...data, id: Number(info.lastInsertRowid), updated_at };
    }
  }

  async updateConfigAsaasStatus(status: string, sincronizacao: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE config_asaas 
      SET status_conexao = ?, ultima_sincronizacao = ?
      WHERE id = (SELECT id FROM config_asaas ORDER BY id DESC LIMIT 1)
    `);
    stmt.run(status, sincronizacao);
  }

  // Logs Admin
  async getLogsAdmin(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM logs_admin ORDER BY data DESC LIMIT 100');
    return stmt.all();
  }

  async createLogAdmin(data: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO logs_admin (usuario_id, acao, detalhes, data)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.usuario_id,
      data.acao,
      data.detalhes || null,
      data.data
    );
    return { ...data, id: Number(info.lastInsertRowid) };
  }
}