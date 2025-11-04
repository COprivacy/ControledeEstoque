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
  type Plano,
  type InsertPlano,
  type ConfigAsaas,
  type InsertConfigAsaas,
  type LogAdmin,
  type InsertLogAdmin,
  type Funcionario,
  type InsertFuncionario,
  type PermissaoFuncionario,
  type Subscription,
  type InsertSubscription,
  type Caixa,
  type InsertCaixa,
  type MovimentacaoCaixa,
  type InsertMovimentacaoCaixa
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface IStorage {
  getUsers?(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser?(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser?(id: string): Promise<void>;
  getProdutos(): Promise<Produto[]>;
  getProduto(id: number): Promise<Produto | undefined>;
  getProdutoByCodigoBarras(codigo: string): Promise<Produto | undefined>;
  createProduto(insertProduto: InsertProduto): Promise<Produto>;
  updateProduto(id: number, updates: Partial<Produto>): Promise<Produto | undefined>;
  deleteProduto(id: number): Promise<boolean>;
  getVendas(startDate?: string, endDate?: string): Promise<Venda[]>;
  createVenda(insertVenda: InsertVenda): Promise<Venda>;
  clearVendas(): Promise<void>;
  getFornecedores(): Promise<Fornecedor[]>;
  getFornecedor(id: number): Promise<Fornecedor | undefined>;
  createFornecedor(insertFornecedor: InsertFornecedor): Promise<Fornecedor>;
  updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined>;
  deleteFornecedor(id: number): Promise<boolean>;
  getClientes(): Promise<Cliente[]>;
  getCliente(id: number): Promise<Cliente | undefined>;
  createCliente(insertCliente: InsertCliente): Promise<Cliente>;
  updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente | undefined>;
  deleteCliente(id: number): Promise<boolean>;
  getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]>;
  createCompra(insertCompra: InsertCompra): Promise<Compra>;
  updateCompra(id: number, updates: Partial<Compra>): Promise<Compra | undefined>;
  getConfigFiscal(): Promise<ConfigFiscal | undefined>;
  saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal>;
  getPlanos?(): Promise<Plano[]>;
  createPlano?(plano: InsertPlano): Promise<Plano>;
  updatePlano?(id: number, updates: Partial<Plano>): Promise<Plano | undefined>;
  deletePlano?(id: number): Promise<boolean>;
  getConfigAsaas?(): Promise<ConfigAsaas | null>;
  saveConfigAsaas?(config: InsertConfigAsaas): Promise<ConfigAsaas>;
  updateConfigAsaasStatus?(status: string): Promise<void>;
  getLogsAdmin?(): Promise<LogAdmin[]>;
  createLogAdmin?(log: InsertLogAdmin): Promise<LogAdmin>;

  // Métodos para Subscriptions
  getSubscriptions?(): Promise<Subscription[]>;
  getSubscription?(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByUser?(userId: string): Promise<Subscription[]>;
  createSubscription?(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription?(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Métodos para Funcionários e Permissões
  getFuncionarios(contaId: string): Promise<Funcionario[]>;
  getFuncionario(id: string): Promise<Funcionario | undefined>;
  createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario>;
  updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined>;
  deleteFuncionario(id: string): Promise<boolean>;
  getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined>;
  savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario>;

  // Métodos para Contas a Pagar/Receber
  getContasPagar?(): Promise<any[]>;
  createContaPagar?(conta: any): Promise<any>;
  updateContaPagar?(id: number, updates: any): Promise<any>;
  deleteContaPagar?(id: number): Promise<boolean>;
  getContasReceber?(): Promise<any[]>;
  createContaReceber?(conta: any): Promise<any>;
  updateContaReceber?(id: number, updates: any): Promise<any>;
  deleteContaReceber?(id: number): Promise<boolean>;

  // Métodos para Caixa
  getCaixas?(userId: string): Promise<any[]>;
  getCaixaAberto?(userId: string): Promise<any | undefined>;
  getCaixa?(id: number): Promise<any | undefined>;
  abrirCaixa?(caixa: any): Promise<any>;
  fecharCaixa?(id: number, dados: any): Promise<any | undefined>;
  atualizarTotaisCaixa?(id: number, campo: 'total_vendas' | 'total_suprimentos' | 'total_retiradas', valor: number): Promise<any | undefined>;
  getMovimentacoesCaixa?(caixaId: number): Promise<any[]>;
  createMovimentacaoCaixa?(movimentacao: any): Promise<any>;
}

export abstract class Storage {
  abstract getUsers(): Promise<User[]>;
  abstract getUserByEmail(email: string): Promise<User | undefined>;
  abstract createUser(insertUser: InsertUser): Promise<User>;
  abstract updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  abstract getProdutos(): Promise<Produto[]>;
  abstract getProduto(id: number): Promise<Produto | undefined>;
  abstract getProdutoByCodigoBarras(codigo: string): Promise<Produto | undefined>;
  abstract createProduto(insertProduto: InsertProduto): Promise<Produto>;
  abstract updateProduto(id: number, updates: Partial<Produto>): Promise<Produto | undefined>;
  abstract deleteProduto(id: number): Promise<boolean>;

  abstract getVendas(startDate?: string, endDate?: string): Promise<Venda[]>;
  abstract createVenda(insertVenda: InsertVenda): Promise<Venda>;
  abstract clearVendas(): Promise<void>;

  abstract getFornecedores(): Promise<Fornecedor[]>;
  abstract getFornecedor(id: number): Promise<Fornecedor | undefined>;
  abstract createFornecedor(insertFornecedor: InsertFornecedor): Promise<Fornecedor>;
  abstract updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined>;
  abstract deleteFornecedor(id: number): Promise<boolean>;

  abstract getClientes(): Promise<Cliente[]>;
  abstract getCliente(id: number): Promise<Cliente | undefined>;
  abstract createCliente(insertCliente: InsertCliente): Promise<Cliente>;
  abstract updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente | undefined>;
  abstract deleteCliente(id: number): Promise<boolean>;

  abstract getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]>;
  abstract createCompra(insertCompra: InsertCompra): Promise<Compra>;
  abstract updateCompra(id: number, updates: Partial<Compra>): Promise<Compra | undefined>;

  // Métodos abstratos para Funcionários e Permissões
  abstract getFuncionarios(contaId: string): Promise<Funcionario[]>;
  abstract getFuncionario(id: string): Promise<Funcionario | undefined>;
  abstract createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario>;
  abstract updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined>;
  abstract deleteFuncionario(id: string): Promise<boolean>;
  abstract getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined>;
  abstract savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario>;

  abstract getConfigFiscal(): Promise<ConfigFiscal | undefined>;
  abstract saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal>;
}

export class MemStorage implements Storage { // Changed to implement Storage interface
  private users: Map<string, User>;
  private produtos: Map<number, Produto>;
  private vendas: Map<number, Venda>;
  private fornecedores: Map<number, Fornecedor>;
  private clientes: Map<number, Cliente>;
  private compras: Map<number, Compra>;
  private nextProdutoId: number;
  private nextVendaId: number;
  private nextFornecedorId: number;
  private nextClienteId: number;
  private nextCompraId: number;
  private logsAdmin: LogAdmin[] = [];
  private subscriptions: Map<number, Subscription>;
  private nextSubscriptionId: number;

  private usersPath: string;
  private produtosPath: string;
  private vendasPath: string;
  private fornecedoresPath: string;
  private clientesPath: string;
  private comprasPath: string;
  private contasPagarPath: string;
  private contasReceberPath: string;
  private configFiscalPath: string;
  private planosPath: string;
  private configAsaasPath: string;
  private logsAdminPath: string;
  private funcionariosPath: string;
  private permissoesPath: string;
  private subscriptionsPath: string;

  private funcionarios: Funcionario[] = [];
  private permissoesFuncionarios: PermissaoFuncionario[] = [];

  constructor(dataDir: string = __dirname) {
    this.users = new Map();
    this.produtos = new Map();
    this.vendas = new Map();
    this.fornecedores = new Map();
    this.clientes = new Map();
    this.compras = new Map();
    this.subscriptions = new Map();
    this.nextProdutoId = 1;
    this.nextVendaId = 1;
    this.nextFornecedorId = 1;
    this.nextClienteId = 1;
    this.nextCompraId = 1;
    this.nextSubscriptionId = 1;

    this.usersPath = path.join(dataDir, 'users.json');
    this.produtosPath = path.join(dataDir, 'produtos.json');
    this.vendasPath = path.join(dataDir, 'vendas.json');
    this.fornecedoresPath = path.join(dataDir, 'fornecedores.json');
    this.clientesPath = path.join(dataDir, 'clientes.json');
    this.comprasPath = path.join(dataDir, 'compras.json');
    this.contasPagarPath = path.join(dataDir, 'contas_pagar.json');
    this.contasReceberPath = path.join(dataDir, 'contas_receber.json');
    this.configFiscalPath = path.join(dataDir, 'config_fiscal.json');
    this.planosPath = path.join(dataDir, 'planos.json');
    this.configAsaasPath = path.join(dataDir, 'config_asaas.json');
    this.logsAdminPath = path.join(dataDir, 'logs_admin.json');
    this.funcionariosPath = path.join(dataDir, 'funcionarios.json');
    this.permissoesPath = path.join(dataDir, 'permissoes_funcionarios.json');
    this.subscriptionsPath = path.join(dataDir, 'subscriptions.json');
    this.init();
  }

  private async init() {
    await this.loadData();
    await this.seedDataIfNeeded();
  }

  private async loadData() {
    try {
      const usersData = await fs.readFile(this.usersPath, 'utf-8');
      const usersFromFile = JSON.parse(usersData) as User[];
      usersFromFile.forEach(user => this.users.set(user.id, user));
      this.nextProdutoId = usersFromFile.length > 0 ? Math.max(...usersFromFile.map(u => parseInt(u.id) || 0)) + 1 : 1; // Ensure next ID is greater than any existing user ID if they were numeric
    } catch (error) {
      console.warn(`Users file not found or empty: ${this.usersPath}. Initializing with empty data.`);
      this.users = new Map();
      this.nextProdutoId = 1;
    }

    try {
      const produtosData = await fs.readFile(this.produtosPath, 'utf-8');
      const produtosFromFile = JSON.parse(produtosData) as Produto[];
      produtosFromFile.forEach(produto => this.produtos.set(produto.id, produto));
      this.nextProdutoId = produtosFromFile.length > 0 ? Math.max(...produtosFromFile.map(p => p.id)) + 1 : this.nextProdutoId;
    } catch (error) {
      console.warn(`Produtos file not found or empty: ${this.produtosPath}. Initializing with empty data.`);
      this.produtos = new Map();
      this.nextProdutoId = 1;
    }

    try {
      const vendasData = await fs.readFile(this.vendasPath, 'utf-8');
      const vendasFromFile = JSON.parse(vendasData) as Venda[];
      vendasFromFile.forEach(venda => this.vendas.set(venda.id, venda));
      this.nextVendaId = vendasFromFile.length > 0 ? Math.max(...vendasFromFile.map(v => v.id)) + 1 : 1;
    } catch (error) {
      console.warn(`Vendas file not found or empty: ${this.vendasPath}. Initializing with empty data.`);
      this.vendas = new Map();
      this.nextVendaId = 1;
    }

    // Initialize data for Fornecedores, Clientes, and Compras
    try {
      const fornecedoresData = await fs.readFile(this.fornecedoresPath, 'utf-8');
      const fornecedoresFromFile = JSON.parse(fornecedoresData) as Fornecedor[];
      fornecedoresFromFile.forEach(fornecedor => this.fornecedores.set(fornecedor.id, fornecedor));
      this.nextFornecedorId = fornecedoresFromFile.length > 0 ? Math.max(...fornecedoresFromFile.map(f => f.id)) + 1 : 1;
    } catch (error) {
      console.warn(`Fornecedores file not found or empty: ${this.fornecedoresPath}. Initializing with empty data.`);
      this.fornecedores = new Map();
      this.nextFornecedorId = 1;
    }

    try {
      const clientesData = await fs.readFile(this.clientesPath, 'utf-8');
      const clientesFromFile = JSON.parse(clientesData) as Cliente[];
      clientesFromFile.forEach(cliente => this.clientes.set(cliente.id, cliente));
      this.nextClienteId = clientesFromFile.length > 0 ? Math.max(...clientesFromFile.map(c => c.id)) + 1 : 1;
    } catch (error) {
      console.warn(`Clientes file not found or empty: ${this.clientesPath}. Initializing with empty data.`);
      this.clientes = new Map();
      this.nextClienteId = 1;
    }

    try {
      const comprasData = await fs.readFile(this.comprasPath, 'utf-8');
      const comprasFromFile = JSON.parse(comprasData) as Compra[];
      comprasFromFile.forEach(compra => this.compras.set(compra.id, compra));
      this.nextCompraId = comprasFromFile.length > 0 ? Math.max(...comprasFromFile.map(c => c.id)) + 1 : 1;
    } catch (error) {
      console.warn(`Compras file not found or empty: ${this.comprasPath}. Initializing with empty data.`);
      this.compras = new Map();
      this.nextCompraId = 1;
    }

    // Load logs
    try {
      const logsData = await fs.readFile(this.logsAdminPath, 'utf-8');
      this.logsAdmin = JSON.parse(logsData);
    } catch {
      console.warn(`LogsAdmin file not found or empty: ${this.logsAdminPath}. Initializing with empty data.`);
      this.logsAdmin = [];
      await this.saveLogsAdmin();
    }

    try {
      const funcionariosData = await fs.readFile(this.funcionariosPath, 'utf-8');
      this.funcionarios = JSON.parse(funcionariosData);
    } catch {
      console.warn(`Funcionarios file not found or empty: ${this.funcionariosPath}. Initializing with empty data.`);
      this.funcionarios = [];
      await this.saveFuncionarios();
    }

    try {
      const permissoesData = await fs.readFile(this.permissoesPath, 'utf-8');
      this.permissoesFuncionarios = JSON.parse(permissoesData);
    } catch {
      console.warn(`PermissoesFuncionarios file not found or empty: ${this.permissoesPath}. Initializing with empty data.`);
      this.permissoesFuncionarios = [];
      await this.savePermissoesFuncionarios();
    }
  }

  private async seedDataIfNeeded() {
    if (this.users.size === 0) {
      console.log("Seeding initial user data...");
      const initialUsers: InsertUser[] = [
        { email: "demo@example.com", senha: "demo123", nome: "Loja Demo 1", plano: "free", is_admin: "true", data_criacao: new Date().toISOString(), status: "ativo", max_funcionarios: 5 },
        { email: "demo2@example.com", senha: "demo123", nome: "Loja Demo 2", plano: "free", is_admin: "true", data_criacao: new Date().toISOString(), status: "ativo", max_funcionarios: 5 },
      ];
      for (const user of initialUsers) {
        await this.createUser(user);
      }
    }

    if (this.produtos.size === 0) {
      console.log("Seeding initial product data...");
      const userId1 = Array.from(this.users.values())[0]?.id;

      if (userId1) {
        const produtos: InsertProduto[] = [
          { user_id: userId1, nome: "Arroz 5kg", categoria: "Alimentos", preco: 25.50, quantidade: 50, estoque_minimo: 10, codigo_barras: "7891234567890", vencimento: "2025-12-01" },
          { user_id: userId1, nome: "Feijão 1kg", categoria: "Alimentos", preco: 8.90, quantidade: 5, estoque_minimo: 10, codigo_barras: "7891234567891", vencimento: "2025-10-18" },
          { user_id: userId1, nome: "Óleo de Soja 900ml", categoria: "Alimentos", preco: 7.50, quantidade: 30, estoque_minimo: 15, codigo_barras: "7891234567892", vencimento: "2026-03-15" },
        ];
        for (const produto of produtos) {
          await this.createProduto(produto);
        }
      }
    }

    if (this.vendas.size === 0) {
      console.log("Seeding initial sales data...");
      const userId1 = Array.from(this.users.values())[0].id;
      const userId2 = Array.from(this.users.values())[1].id;
      const initialVendas: InsertVenda[] = [
        { produtoId: 1, quantidade: 2, total: 51.00, data: "2023-10-26T10:00:00Z", userId: userId1 },
        { produtoId: 2, quantidade: 1, total: 8.90, data: "2023-10-25T11:30:00Z", userId: userId2 }
      ];
      for (const venda of initialVendas) {
        await this.createVenda(venda);
      }
    }

    // Seed initial data for Fornecedores, Clientes, and Compras if they don't exist
    if (this.fornecedores.size === 0) {
      console.log("Seeding initial supplier data...");
      const userId1 = Array.from(this.users.values())[0]?.id;

      if (userId1) {
        const initialFornecedores: InsertFornecedor[] = [
          { user_id: userId1, nome: "Fornecedor A", cnpj: "11.111.111/0001-11", email: "fornecedor.a@email.com", telefone: "(11) 1111-1111", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
          { user_id: userId1, nome: "Fornecedor B", cnpj: "22.222.222/0001-22", email: "fornecedor.b@email.com", telefone: "(22) 2222-2222", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
        ];
        for (const fornecedor of initialFornecedores) {
          await this.createFornecedor(fornecedor);
        }
      }
    }

    if (this.clientes.size === 0) {
      console.log("Seeding initial customer data...");
      const userId1 = Array.from(this.users.values())[0]?.id;

      if (userId1) {
        const initialClientes: InsertCliente[] = [
          { user_id: userId1, nome: "Cliente X", cpf_cnpj: "111.111.111-11", email: "cliente.x@email.com", telefone: "(11) 1111-1111", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
          { user_id: userId1, nome: "Cliente Y", cpf_cnpj: "222.222.222-22", email: "cliente.y@email.com", telefone: "(22) 2222-2222", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
        ];
        for (const cliente of initialClientes) {
          await this.createCliente(cliente);
        }
      }
    }

    if (this.compras.size === 0) {
      console.log("Seeding initial purchase data...");
      const userId1 = Array.from(this.users.values())[0]?.id;

      if (userId1) {
        const initialCompras: InsertCompra[] = [
          { user_id: userId1, fornecedor_id: 1, produto_id: 1, quantidade: 10, valor_unitario: 20.00, valor_total: 200.00, data: "2023-10-20T09:00:00Z", observacoes: null },
          { user_id: userId1, fornecedor_id: 2, produto_id: 3, quantidade: 5, valor_unitario: 6.00, valor_total: 30.00, data: "2023-10-21T14:00:00Z", observacoes: null }
        ];
        for (const compra of initialCompras) {
          await this.createCompra(compra);
        }
      }
    }

    // Seed initial data for Funcionários and Permissões if they don't exist
    if (this.funcionarios.length === 0) {
      console.log("Seeding initial employee data...");
      const user1Id = Array.from(this.users.values())[0].id;
      const user2Id = Array.from(this.users.values())[1].id;

      const initialFuncionarios: InsertFuncionario[] = [
        { id: randomUUID(), conta_id: user1Id, nome: "Funcionario A", email: "func.a@loja1.com", cargo: "Gerente", status: "ativo", data_criacao: new Date().toISOString() },
        { id: randomUUID(), conta_id: user1Id, nome: "Funcionario B", email: "func.b@loja1.com", cargo: "Vendedor", status: "inativo", data_criacao: new Date().toISOString() },
        { id: randomUUID(), conta_id: user2Id, nome: "Funcionario C", email: "func.c@loja2.com", cargo: "Estoquista", status: "ativo", data_criacao: new Date().toISOString() },
      ];
      for (const funcionario of initialFuncionarios) {
        await this.createFuncionario(funcionario);
      }

      // Seed initial permissions based on created employees
      const funcA = this.funcionarios.find(f => f.email === "func.a@loja1.com");
      const funcB = this.funcionarios.find(f => f.email === "func.b@loja1.com");
      const funcC = this.funcionarios.find(f => f.email === "func.c@loja2.com");

      if (funcA) await this.savePermissoesFuncionario(funcA.id, { pdv: "true", produtos: "true", relatorios: "true" });
      if (funcB) await this.savePermissoesFuncionario(funcB.id, { pdv: "true", produtos: "false" });
      if (funcC) await this.savePermissoesFuncionario(funcC.id, { inventario: "true", produtos: "true" });
    }
  }

  private async persistData() {
    await fs.writeFile(this.usersPath, JSON.stringify(Array.from(this.users.values()), null, 2));
    await fs.writeFile(this.produtosPath, JSON.stringify(Array.from(this.produtos.values()), null, 2));
    await fs.writeFile(this.vendasPath, JSON.stringify(Array.from(this.vendas.values()), null, 2));

    // Persist data for Fornecedores, Clientes, and Compras
    await fs.writeFile(this.fornecedoresPath, JSON.stringify(Array.from(this.fornecedores.values()), null, 2));
    await fs.writeFile(this.clientesPath, JSON.stringify(Array.from(this.clientes.values()), null, 2));
    await fs.writeFile(this.comprasPath, JSON.stringify(Array.from(this.compras.values()), null, 2));

    // Persist logs
    await this.saveLogsAdmin();

    // Persist funcionarios and permissoes
    await this.saveFuncionarios();
    await this.savePermissoesFuncionarios();
  }

  private async saveLogsAdmin() {
    await fs.writeFile(this.logsAdminPath, JSON.stringify(this.logsAdmin, null, 2));
  }

  // Implementations for Users (already present, but ensuring consistency)
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, plano: insertUser.plano || "free", is_admin: insertUser.is_admin || "false", max_funcionarios: insertUser.max_funcionarios || 5 };
    this.users.set(id, user);
    await this.persistData();
    return user;
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

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    await this.persistData();
  }

  // Implementations for Produtos
  async getProdutos(): Promise<Produto[]> {
    return Array.from(this.produtos.values());
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    return this.produtos.get(id);
  }

  async getProdutoByCodigoBarras(codigoBarras: string): Promise<Produto | undefined> {
    return Array.from(this.produtos.values()).find(
      (produto) => produto.codigo_barras === codigoBarras
    );
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    const id = this.nextProdutoId++;
    const produto: Produto = { ...insertProduto, id };
    this.produtos.set(id, produto);
    await this.persistData();
    return produto;
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
    if (deleted) {
      await this.persistData();
    }
    return deleted;
  }

  // Implementations for Vendas
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
    const venda: Venda = { ...insertVenda, id };
    this.vendas.set(id, venda);
    await this.persistData();
    return venda;
  }

  async clearVendas(): Promise<void> {
    this.vendas.clear();
    await this.persistData();
  }

  // Implementations for Fornecedores
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

    const updatedFornecedor = { ...fornecedor, ...updates };
    this.fornecedores.set(id, updatedFornecedor);
    await this.persistData();
    return updatedFornecedor;
  }

  async deleteFornecedor(id: number): Promise<boolean> {
    const deleted = this.fornecedores.delete(id);
    if (deleted) {
      await this.persistData();
    }
    return deleted;
  }

  // Implementations for Clientes
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

    const updatedCliente = { ...cliente, ...updates };
    this.clientes.set(id, updatedCliente);
    await this.persistData();
    return updatedCliente;
  }

  async deleteCliente(id: number): Promise<boolean> {
    const deleted = this.clientes.delete(id);
    if (deleted) {
      await this.persistData();
    }
    return deleted;
  }

  // Implementations for Compras
  async getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]> {
    let compras = Array.from(this.compras.values());

    if (fornecedorId) {
      compras = compras.filter(c => c.fornecedorId === fornecedorId);
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

  // Implementations for LogsAdmin
  async getLogsAdmin(): Promise<LogAdmin[]> {
    return this.logsAdmin;
  }

  async createLogAdmin(log: InsertLogAdmin): Promise<LogAdmin> {
    const newLog: LogAdmin = { ...log, id: this.logsAdmin.length + 1, timestamp: new Date().toISOString() };
    this.logsAdmin.push(newLog);
    await this.saveLogsAdmin();
    return newLog;
  }

  async deleteLogAdmin(id: number): Promise<boolean> {
    const index = this.logsAdmin.findIndex(log => log.id === id);
    if (index === -1) return false;
    this.logsAdmin.splice(index, 1);
    await this.saveLogsAdmin();
    return true;
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values());
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }

  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(s => s.user_id === userId);
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const newSubscription: Subscription = {
      ...subscription,
      id: this.nextSubscriptionId++,
      data_criacao: new Date().toISOString(),
    };
    this.subscriptions.set(newSubscription.id, newSubscription);
    await this.saveSubscriptions();
    return newSubscription;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) return undefined;
    const updatedSubscription = { ...subscription, ...updates, data_atualizacao: new Date().toISOString() };
    this.subscriptions.set(id, updatedSubscription);
    await this.saveSubscriptions();
    return updatedSubscription;
  }

  private async saveSubscriptions() {
    try {
      const subscriptionsArray = Array.from(this.subscriptions.values());
      await fs.writeFile(this.subscriptionsPath, JSON.stringify(subscriptionsArray, null, 2));
    } catch (error) {
      console.error('Error saving subscriptions:', error);
    }
  }

  // Funcionários
  async getFuncionarios(contaId: string): Promise<Funcionario[]> {
    return this.funcionarios.filter(f => f.conta_id === contaId);
  }

  async getFuncionario(id: string): Promise<Funcionario | undefined> {
    return this.funcionarios.find(f => f.id === id);
  }

  async createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario> {
    const newFuncionario: Funcionario = {
      ...funcionario,
      id: funcionario.id || randomUUID(),
      status: funcionario.status || "ativo",
      data_criacao: funcionario.data_criacao || new Date().toISOString(),
    };
    this.funcionarios.push(newFuncionario);
    await this.saveFuncionarios();
    return newFuncionario;
  }

  async updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined> {
    const index = this.funcionarios.findIndex(f => f.id === id);
    if (index === -1) return undefined;

    this.funcionarios[index] = { ...this.funcionarios[index], ...updates };
    await this.saveFuncionarios();
    return this.funcionarios[index];
  }

  async deleteFuncionario(id: string): Promise<boolean> {
    const index = this.funcionarios.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.funcionarios.splice(index, 1);
    await this.saveFuncionarios();

    // Remover permissões associadas
    const permIndex = this.permissoesFuncionarios.findIndex(p => p.funcionario_id === id);
    if (permIndex !== -1) {
      this.permissoesFuncionarios.splice(permIndex, 1);
      await this.savePermissoesFuncionarios();
    }

    return true;
  }

  // Permissões
  async getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined> {
    return this.permissoesFuncionarios.find(p => p.funcionario_id === funcionarioId);
  }

  async savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario> {
    const index = this.permissoesFuncionarios.findIndex(p => p.funcionario_id === funcionarioId);

    if (index === -1) {
      const newPermissao: PermissaoFuncionario = {
        id: this.permissoesFuncionarios.length + 1,
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
      this.permissoesFuncionarios.push(newPermissao);
      await this.savePermissoesFuncionarios();
      return newPermissao;
    }

    this.permissoesFuncionarios[index] = {
      ...this.permissoesFuncionarios[index],
      ...permissoes
    };
    await this.savePermissoesFuncionarios();
    return this.permissoesFuncionarios[index];
  }

  private async saveFuncionarios() {
    await fs.writeFile(
      this.funcionariosPath,
      JSON.stringify(this.funcionarios, null, 2)
    );
  }

  private async savePermissoesFuncionarios() {
    await fs.writeFile(
      this.permissoesPath,
      JSON.stringify(this.permissoesFuncionarios, null, 2)
    );
  }

  // Contas a Pagar
  private contasPagar: any[] = [];
  private nextContaPagarId: number = 1;

  async getContasPagar(): Promise<any[]> {
    try {
      const data = await fs.readFile(this.contasPagarPath, 'utf-8');
      this.contasPagar = JSON.parse(data);
      return this.contasPagar;
    } catch {
      return this.contasPagar;
    }
  }

  async createContaPagar(conta: any): Promise<any> {
    const novaConta = {
      ...conta,
      id: this.nextContaPagarId++,
    };
    this.contasPagar.push(novaConta);
    await fs.writeFile(this.contasPagarPath, JSON.stringify(this.contasPagar, null, 2));
    return novaConta;
  }

  async updateContaPagar(id: number, updates: any): Promise<any> {
    const index = this.contasPagar.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.contasPagar[index] = { ...this.contasPagar[index], ...updates };
    await fs.writeFile(this.contasPagarPath, JSON.stringify(this.contasPagar, null, 2));
    return this.contasPagar[index];
  }

  async deleteContaPagar(id: number): Promise<boolean> {
    const index = this.contasPagar.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.contasPagar.splice(index, 1);
    await fs.writeFile(this.contasPagarPath, JSON.stringify(this.contasPagar, null, 2));
    return true;
  }

  // Contas a Receber
  private contasReceber: any[] = [];
  private nextContaReceberId: number = 1;

  async getContasReceber(): Promise<any[]> {
    try {
      const data = await fs.readFile(this.contasReceberPath, 'utf-8');
      this.contasReceber = JSON.parse(data);
      return this.contasReceber;
    } catch {
      return this.contasReceber;
    }
  }

  async createContaReceber(conta: any): Promise<any> {
    const novaConta = {
      ...conta,
      id: this.nextContaReceberId++,
    };
    this.contasReceber.push(novaConta);
    await fs.writeFile(this.contasReceberPath, JSON.stringify(this.contasReceber, null, 2));
    return novaConta;
  }

  async updateContaReceber(id: number, updates: any): Promise<any> {
    const index = this.contasReceber.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.contasReceber[index] = { ...this.contasReceber[index], ...updates };
    await fs.writeFile(this.contasReceberPath, JSON.stringify(this.contasReceber, null, 2));
    return this.contasReceber[index];
  }

  async deleteContaReceber(id: number): Promise<boolean> {
    const index = this.contasReceber.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.contasReceber.splice(index, 1);
    await fs.writeFile(this.contasReceberPath, JSON.stringify(this.contasReceber, null, 2));
    return true;
  }

  // Config Fiscal
  private configFiscal?: ConfigFiscal;

  async getConfigFiscal(): Promise<ConfigFiscal | undefined> {
    try {
      const data = await fs.readFile(this.configFiscalPath, 'utf-8');
      this.configFiscal = JSON.parse(data);
      return this.configFiscal;
    } catch {
      return undefined;
    }
  }

  async saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal> {
    const config: ConfigFiscal = {
      ...insertConfig,
      id: 1,
      updated_at: new Date().toISOString(),
    };
    this.configFiscal = config;
    await fs.writeFile(this.configFiscalPath, JSON.stringify(config, null, 2));
    return config;
  }
}

import { PostgresStorage } from './postgres-storage';

export const storage = new PostgresStorage();