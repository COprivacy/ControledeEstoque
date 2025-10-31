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
  type InsertConfigFiscal,
  type Funcionario,
  type InsertFuncionario,
  type PermissaoFuncionario,
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
  private funcionarios: Map<string, Funcionario> = new Map();
  private permissoesFuncionarios: Map<string, PermissaoFuncionario[]> = new Map();

  private nextUserId = 1;
  private nextProdutoId = 1;
  private nextVendaId = 1;
  private nextFornecedorId = 1;
  private nextClienteId = 1;
  private nextCompraId = 1;
  private nextFuncionarioId = 1;

  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, 'database.db');
    this.db = new Database(dbPath || defaultPath);
    this.initializeTables();
    this.loadData();
    this.seedData().catch(err => console.error('Erro ao fazer seed de dados:', err));
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
    `);

    // Migração: Adicionar colunas faltantes se não existirem
    const columns = this.db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const columnNames = columns.map(c => c.name);

    if (!columnNames.includes('plano')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN plano TEXT NOT NULL DEFAULT 'free'`);
    }
    if (!columnNames.includes('is_admin')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN is_admin TEXT NOT NULL DEFAULT 'false'`);
    }
    if (!columnNames.includes('data_criacao')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN data_criacao TEXT`);
    }
    if (!columnNames.includes('data_expiracao_trial')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN data_expiracao_trial TEXT`);
    }
    if (!columnNames.includes('data_expiracao_plano')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN data_expiracao_plano TEXT`);
    }
    if (!columnNames.includes('ultimo_acesso')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN ultimo_acesso TEXT`);
    }
    if (!columnNames.includes('status')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ativo'`);
    }
    if (!columnNames.includes('asaas_customer_id')) {
      this.db.exec(`ALTER TABLE users ADD COLUMN asaas_customer_id TEXT`);
    }

    this.db.exec(`

      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
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
        user_id TEXT NOT NULL,
        produto TEXT NOT NULL,
        quantidade_vendida INTEGER NOT NULL,
        valor_total REAL NOT NULL,
        data TEXT NOT NULL,
        itens TEXT,
        cliente_id INTEGER,
        forma_pagamento TEXT
      );

      CREATE TABLE IF NOT EXISTS fornecedores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
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
        user_id TEXT NOT NULL,
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
        user_id TEXT NOT NULL,
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
        user_id TEXT NOT NULL,
        cnpj TEXT NOT NULL,
        razao_social TEXT NOT NULL,
        focus_nfe_api_key TEXT NOT NULL,
        ambiente TEXT NOT NULL DEFAULT 'homologacao',
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contas_pagar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
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
        user_id TEXT NOT NULL,
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

      CREATE TABLE IF NOT EXISTS funcionarios (
        id TEXT PRIMARY KEY,
        conta_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        senha TEXT NOT NULL,
        cargo TEXT,
        status TEXT DEFAULT 'ativo',
        data_criacao TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS permissoes_funcionarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        funcionario_id TEXT NOT NULL,
        pdv TEXT DEFAULT 'false',
        produtos TEXT DEFAULT 'false',
        inventario TEXT DEFAULT 'false',
        relatorios TEXT DEFAULT 'false',
        clientes TEXT DEFAULT 'false',
        fornecedores TEXT DEFAULT 'false',
        financeiro TEXT DEFAULT 'false',
        config_fiscal TEXT DEFAULT 'false',
        FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        plano TEXT NOT NULL,
        status TEXT NOT NULL,
        valor REAL NOT NULL,
        data_inicio TEXT,
        data_vencimento TEXT,
        asaas_payment_id TEXT,
        forma_pagamento TEXT,
        status_pagamento TEXT,
        invoice_url TEXT,
        bank_slip_url TEXT,
        pix_qrcode TEXT,
        data_cancelamento TEXT,
        motivo_cancelamento TEXT,
        data_criacao TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS caixas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        funcionario_id TEXT,
        data_abertura TEXT NOT NULL,
        data_fechamento TEXT,
        saldo_inicial REAL NOT NULL DEFAULT 0,
        saldo_final REAL,
        total_vendas REAL NOT NULL DEFAULT 0,
        total_retiradas REAL NOT NULL DEFAULT 0,
        total_suprimentos REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'aberto',
        observacoes_abertura TEXT,
        observacoes_fechamento TEXT
      );

      CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caixa_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        descricao TEXT,
        data TEXT NOT NULL,
        FOREIGN KEY (caixa_id) REFERENCES caixas(id)
      );
    `);
  }

  private async seedData() {
    // SEMPRE tentar carregar o usuário admin do users.json
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const usersJsonPath = path.join(__dirname, 'users.json');
      const usersData = await fs.readFile(usersJsonPath, 'utf-8');
      const usersFromFile = JSON.parse(usersData) as User[];

      if (usersFromFile.length > 0) {
        for (const user of usersFromFile) {
          // Verificar se o usuário já existe
          const existingUser = this.db.prepare('SELECT * FROM users WHERE email = ?').get(user.email);

          if (existingUser) {
            // Atualizar usuário existente
            const updateStmt = this.db.prepare(`
              UPDATE users SET 
                senha = ?,
                nome = ?,
                plano = ?,
                is_admin = ?,
                data_criacao = ?,
                data_expiracao_trial = ?,
                data_expiracao_plano = ?,
                status = ?
              WHERE email = ?
            `);
            updateStmt.run(
              user.senha,
              user.nome,
              user.plano || 'free',
              user.is_admin || 'false',
              user.data_criacao || new Date().toISOString(),
              user.data_expiracao_trial || null,
              user.data_expiracao_plano || null,
              user.status || 'ativo',
              user.email
            );
            console.log(`✅ Usuário atualizado: ${user.email}`);
          } else {
            // Inserir novo usuário
            const insertUser = this.db.prepare(`
              INSERT INTO users (id, email, senha, nome, plano, is_admin, data_criacao, data_expiracao_trial, data_expiracao_plano, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            insertUser.run(
              user.id,
              user.email,
              user.senha,
              user.nome,
              user.plano || 'free',
              user.is_admin || 'false',
              user.data_criacao || new Date().toISOString(),
              user.data_expiracao_trial || null,
              user.data_expiracao_plano || null,
              user.status || 'ativo'
            );
            console.log(`✅ Usuário criado: ${user.email}`);
          }
          this.users.set(user.id, user);
        }
        console.log(`✅ ${usersFromFile.length} usuário(s) processado(s) do arquivo users.json`);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar users.json:', error);
    }

    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    if (userCount.count === 0) {

      // Se não encontrou arquivo ou está vazio, usar dados padrão
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
      const storageData = this.db.prepare('SELECT data FROM storage WHERE key = ? LIMIT 1').get('storage');
      if (!storageData) return;

      const data = JSON.parse(storageData.data);

      this.nextUserId = data.nextUserId || 1;
      this.nextProdutoId = data.nextProdutoId || 1;
      this.nextVendaId = data.nextVendaId || 1;
      this.nextFornecedorId = data.nextFornecedorId || 1;
      this.nextClienteId = data.nextClienteId || 1;
      this.nextCompraId = data.nextCompraId || 1;
      this.nextFuncionarioId = data.nextFuncionarioId || 1;

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
      if (data.funcionarios) {
        data.funcionarios.forEach((f: Funcionario) => this.funcionarios.set(f.id, f));
      }
      if (data.permissoesFuncionarios) {
        Object.keys(data.permissoesFuncionarios).forEach(key => {
          this.permissoesFuncionarios.set(key, data.permissoesFuncionarios[key]);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  private async persistData() {
    const data = {
      nextUserId: this.nextUserId,
      nextProdutoId: this.nextProdutoId,
      nextVendaId: this.nextVendaId,
      nextFornecedorId: this.nextFornecedorId,
      nextClienteId: this.nextClienteId,
      nextCompraId: this.nextCompraId,
      nextFuncionarioId: this.nextFuncionarioId,
      users: Array.from(this.users.values()),
      produtos: Array.from(this.produtos.values()),
      vendas: Array.from(this.vendas.values()),
      fornecedores: Array.from(this.fornecedores.values()),
      clientes: Array.from(this.clientes.values()),
      compras: Array.from(this.compras.values()),
      funcionarios: Array.from(this.funcionarios.values()),
      permissoesFuncionarios: Object.fromEntries(this.permissoesFuncionarios),
    };

    this.db.exec('CREATE TABLE IF NOT EXISTS storage (key TEXT PRIMARY KEY, data TEXT)');
    this.db.prepare('INSERT OR REPLACE INTO storage (key, data) VALUES (?, ?)').run('storage', JSON.stringify(data));
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Primeiro tenta buscar no banco de dados SQLite
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const userFromDb = stmt.get(email) as User | undefined;

    if (userFromDb) {
      return userFromDb;
    }

    // Se não encontrar, busca no Map em memória
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
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, senha, nome, plano, is_admin, data_criacao, data_expiracao_trial, data_expiracao_plano, ultimo_acesso, status, asaas_customer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      newUser.email,
      newUser.senha,
      newUser.nome,
      newUser.plano || 'free',
      newUser.is_admin || 'false',
      newUser.data_criacao || new Date().toISOString(),
      newUser.data_expiracao_trial || null,
      newUser.data_expiracao_plano || null,
      newUser.ultimo_acesso || null,
      newUser.status || 'ativo',
      newUser.asaas_customer_id || null
    );
    await this.persistData();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const stmt = this.db.prepare(`
      UPDATE users SET 
        nome = COALESCE(?, nome),
        email = COALESCE(?, email),
        plano = COALESCE(?, plano),
        is_admin = COALESCE(?, is_admin),
        status = COALESCE(?, status),
        data_expiracao_plano = COALESCE(?, data_expiracao_plano),
        ultimo_acesso = COALESCE(?, ultimo_acesso)
      WHERE id = ?
    `);

    stmt.run(
      updates.nome || null,
      updates.email || null,
      updates.plano || null,
      updates.is_admin || null,
      updates.status || null,
      updates.data_expiracao_plano || null,
      updates.ultimo_acesso || null,
      id
    );

    const updatedUser = await this.getUserById(id);

    // Atualiza também o Map em memória
    if (updatedUser) {
      this.users.set(id, updatedUser);
    }

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
    // Também remove do Map em memória
    this.users.delete(id);
    await this.persistData();
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
      INSERT INTO contas_pagar (user_id, descricao, valor, data_vencimento, categoria, status, data_cadastro)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.user_id,
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
      INSERT INTO contas_receber (user_id, descricao, valor, data_vencimento, categoria, status, data_cadastro)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.user_id,
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

  // Subscriptions
  async getSubscriptions(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions ORDER BY data_criacao DESC');
    return stmt.all() || [];
  }

  async getSubscription(id: number): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?');
    return stmt.get(id) || null;
  }

  async getSubscriptionsByUser(userId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY data_criacao DESC');
    return stmt.all(userId) || [];
  }

  async createSubscription(data: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO subscriptions (user_id, plano, status, valor, data_inicio, data_vencimento, asaas_payment_id, forma_pagamento, status_pagamento, invoice_url, bank_slip_url, pix_qrcode, data_criacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.user_id,
      data.plano,
      data.status,
      data.valor,
      data.data_inicio || null,
      data.data_vencimento || null,
      data.asaas_payment_id || null,
      data.forma_pagamento || null,
      data.status_pagamento || null,
      data.invoice_url || null,
      data.bank_slip_url || null,
      data.pix_qrcode || null,
      data.data_criacao || new Date().toISOString()
    );
    return { ...data, id: Number(info.lastInsertRowid) };
  }

  async updateSubscription(id: number, updates: any): Promise<any> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const stmt = this.db.prepare(`UPDATE subscriptions SET ${fields} WHERE id = ?`);
    stmt.run(...values, id);
    return this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
  }

  // Planos
  async getPlanos(): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM planos WHERE ativo = \'true\' ORDER BY preco ASC');
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
      data.ativo || "true",
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
  async getConfigAsaas(): Promise<any | null> {
    const stmt = this.db.prepare('SELECT * FROM config_asaas ORDER BY id DESC LIMIT 1');
    return stmt.get() || null;
  }

  async saveConfigAsaas(data: any): Promise<any> {
    try {
      const existing = await this.getConfigAsaas();
      const updatedAt = data.updated_at || new Date().toISOString();

      if (existing) {
        const stmt = this.db.prepare(`
          UPDATE config_asaas SET 
            api_key = ?,
            ambiente = ?,
            webhook_url = ?,
            account_id = ?,
            updated_at = ?
          WHERE id = ?
        `);
        stmt.run(
          data.api_key,
          data.ambiente,
          data.webhook_url || null,
          data.account_id || null,
          updatedAt,
          existing.id
        );
        return { ...data, id: existing.id, updated_at: updatedAt };
      } else {
        const stmt = this.db.prepare(`
          INSERT INTO config_asaas (api_key, ambiente, webhook_url, account_id, status_conexao, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
          data.api_key,
          data.ambiente,
          data.webhook_url || null,
          data.account_id || null,
          "desconectado",
          updatedAt
        );
        return { ...data, id: Number(info.lastInsertRowid), status_conexao: "desconectado", updated_at: updatedAt };
      }
    } catch (error) {
      console.error("Erro no saveConfigAsaas:", error);
      throw new Error(`Erro ao salvar configuração Asaas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async updateConfigAsaasStatus(status: string): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE config_asaas 
      SET status_conexao = ?, ultima_sincronizacao = ?
      WHERE id = (SELECT id FROM config_asaas ORDER BY id DESC LIMIT 1)
    `);
    stmt.run(status, new Date().toISOString());
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

  // Funcionarios
  async getFuncionarios(): Promise<Funcionario[]> {
    return Array.from(this.funcionarios.values());
  }

  async getFuncionariosByContaId(contaId: string): Promise<Funcionario[]> {
    return Array.from(this.funcionarios.values()).filter(f => f.conta_id === contaId);
  }

  async getFuncionario(id: string): Promise<Funcionario | undefined> {
    return this.funcionarios.get(id);
  }

  async createFuncionario(insertFuncionario: InsertFuncionario): Promise<Funcionario> {
    const id = randomUUID();
    const newFuncionario: Funcionario = { ...insertFuncionario, id };
    this.funcionarios.set(id, newFuncionario);
    await this.persistData();
    return newFuncionario;
  }

  async updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined> {
    const funcionario = this.funcionarios.get(id);
    if (!funcionario) return undefined;

    const updatedFuncionario = { ...funcionario, ...updates };
    this.funcionarios.set(id, updatedFuncionario);
    await this.persistData();
    return updatedFuncionario;
  }

  async deleteFuncionario(id: string): Promise<boolean> {
    const deleted = this.funcionarios.delete(id);
    if (deleted) {
      this.permissoesFuncionarios.delete(id);
      await this.persistData();
    }
    return deleted;
  }

  // Permissões Funcionários
  async getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined> {
    const permissoes = this.permissoesFuncionarios.get(funcionarioId);
    return permissoes && permissoes.length > 0 ? permissoes[0] : undefined;
  }

  async savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario> {
    const existingPermissoes = this.permissoesFuncionarios.get(funcionarioId) || [];

    if (existingPermissoes.length > 0) {
      // Atualizar permissões existentes
      const updated = {
        ...existingPermissoes[0],
        ...permissoes,
      };
      this.permissoesFuncionarios.set(funcionarioId, [updated]);
      await this.persistData();
      return updated;
    } else {
      // Criar novas permissões
      const newPermissao: PermissaoFuncionario = {
        id: Date.now(),
        funcionario_id: funcionarioId,
        dashboard: permissoes.dashboard || "false",
        pdv: permissoes.pdv || "false",
        produtos: permissoes.produtos || "false",
        inventario: permissoes.inventario || "false",
        relatorios: permissoes.relatorios || "false",
        clientes: permissoes.clientes || "false",
        fornecedores: permissoes.fornecedores || "false",
        financeiro: permissoes.financeiro || "false",
        config_fiscal: permissoes.config_fiscal || "false",
        configuracoes: permissoes.configuracoes || "false",
      };
      this.permissoesFuncionarios.set(funcionarioId, [newPermissao]);
      await this.persistData();
      return newPermissao;
    }
  }

  async addPermissaoFuncionario(funcionarioId: string, permissao: PermissaoFuncionario): Promise<void> {
    const permissoes = this.permissoesFuncionarios.get(funcionarioId) || [];
    permissoes.push(permissao);
    this.permissoesFuncionarios.set(funcionarioId, permissoes);
    await this.persistData();
  }

  async removePermissaoFuncionario(funcionarioId: string, permissaoId: number): Promise<boolean> {
    const permissoes = this.permissoesFuncionarios.get(funcionarioId);
    if (!permissoes) return false;

    const initialLength = permissoes.length;
    const updatedPermissoes = permissoes.filter(p => p.id !== permissaoId);
    this.permissoesFuncionarios.set(funcionarioId, updatedPermissoes);

    if (updatedPermissoes.length < initialLength) {
      await this.persistData();
      return true;
    }
    return false;
  }

  async getCaixas(userId: string): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM caixas WHERE user_id = ? ORDER BY data_abertura DESC');
    return stmt.all(userId);
  }

  async getCaixaAberto(userId: string): Promise<any | undefined> {
    const stmt = this.db.prepare('SELECT * FROM caixas WHERE user_id = ? AND status = ? ORDER BY data_abertura DESC LIMIT 1');
    const result = stmt.get(userId, 'aberto');
    return result as any;
  }

  async getCaixa(id: number): Promise<any | undefined> {
    const stmt = this.db.prepare('SELECT * FROM caixas WHERE id = ?');
    const result = stmt.get(id);
    return result as any;
  }

  async abrirCaixa(caixaData: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO caixas (
        user_id, funcionario_id, data_abertura, saldo_inicial,
        observacoes_abertura, status, total_vendas, total_retiradas, total_suprimentos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      caixaData.user_id,
      caixaData.funcionario_id || null,
      caixaData.data_abertura,
      caixaData.saldo_inicial,
      caixaData.observacoes_abertura || null,
      caixaData.status,
      caixaData.total_vendas,
      caixaData.total_retiradas,
      caixaData.total_suprimentos
    );
    return { ...caixaData, id: Number(info.lastInsertRowid) };
  }

  async fecharCaixa(id: number, dados: any): Promise<any | undefined> {
    const stmt = this.db.prepare(`
      UPDATE caixas 
      SET data_fechamento = ?, saldo_final = ?, observacoes_fechamento = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      dados.data_fechamento,
      dados.saldo_final,
      dados.observacoes_fechamento || null,
      dados.status,
      id
    );
    return this.getCaixa(id);
  }

  async atualizarTotaisCaixa(id: number, campo: 'total_vendas' | 'total_suprimentos' | 'total_retiradas', valor: number): Promise<any | undefined> {
    const stmt = this.db.prepare(`
      UPDATE caixas 
      SET ${campo} = ${campo} + ?
      WHERE id = ?
    `);
    stmt.run(valor, id);
    return this.getCaixa(id);
  }

  async getMovimentacoesCaixa(caixaId: number): Promise<any[]> {
    const stmt = this.db.prepare('SELECT * FROM movimentacoes_caixa WHERE caixa_id = ? ORDER BY data DESC');
    return stmt.all(caixaId);
  }

  async createMovimentacaoCaixa(movimentacaoData: any): Promise<any> {
    const stmt = this.db.prepare(`
      INSERT INTO movimentacoes_caixa (caixa_id, user_id, tipo, valor, descricao, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      movimentacaoData.caixa_id,
      movimentacaoData.user_id,
      movimentacaoData.tipo,
      movimentacaoData.valor,
      movimentacaoData.descricao || null,
      movimentacaoData.data
    );

    const campo = movimentacaoData.tipo === 'suprimento' ? 'total_suprimentos' : 'total_retiradas';
    await this.atualizarTotaisCaixa(movimentacaoData.caixa_id, campo, movimentacaoData.valor);

    return { ...movimentacaoData, id: Number(info.lastInsertRowid) };
  }
}