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
  type InsertCompra
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
}

export abstract class Storage {
  abstract getUsers(): Promise<User[]>;
  abstract getUserByEmail(email: string): Promise<User | undefined>;
  abstract createUser(insertUser: InsertUser): Promise<User>;

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
}

export class MemStorage implements Storage { // Changed to implement Storage interface
  private users: Map<string, User>;
  private produtos: Map<number, Produto>;
  private vendas: Map<number, Venda>;
  private nextProdutoId: number;
  private nextVendaId: number;

  // Mock file paths for demonstration
  private usersFile = path.join(__dirname, 'users.json');
  private produtosFile = path.join(__dirname, 'produtos.json');
  private vendasFile = path.join(__dirname, 'vendas.json');

  // New maps for suppliers, customers, and purchases
  private fornecedores: Map<number, Fornecedor>;
  private clientes: Map<number, Cliente>;
  private compras: Map<number, Compra>;
  private nextFornecedorId: number;
  private nextClienteId: number;
  private nextCompraId: number;

  constructor() {
    this.users = new Map();
    this.produtos = new Map();
    this.vendas = new Map();
    this.nextProdutoId = 1;
    this.nextVendaId = 1;

    // Initialize new maps
    this.fornecedores = new Map();
    this.clientes = new Map();
    this.compras = new Map();
    this.nextFornecedorId = 1;
    this.nextClienteId = 1;
    this.nextCompraId = 1;

    // Initialize storage by loading data from mock files or seeding if files don't exist
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      const usersData = await fs.readFile(this.usersFile, 'utf-8');
      const usersFromFile = JSON.parse(usersData) as User[];
      usersFromFile.forEach(user => this.users.set(user.id, user));
      // Adjust nextProdutoId based on the max existing ID for users if seeding
      // This logic might need refinement depending on how IDs are generated across all types
      const maxUserId = usersFromFile.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0);
      this.nextProdutoId = Math.max(this.nextProdutoId, maxUserId + 1);

    } catch (error) {
      console.warn("Users file not found or empty, attempting to seed data.");
      await this.seedData(); // Seed if files are not found
    }

    try {
      const produtosData = await fs.readFile(this.produtosFile, 'utf-8');
      const produtosFromFile = JSON.parse(produtosData) as Produto[];
      produtosFromFile.forEach(produto => this.produtos.set(produto.id, produto));
      this.nextProdutoId = produtosFromFile.length > 0 ? Math.max(...produtosFromFile.map(p => p.id)) + 1 : this.nextProdutoId;
    } catch (error) {
      console.warn("Produtos file not found or empty, attempting to seed data.");
      await this.seedData();
    }

    try {
      const vendasData = await fs.readFile(this.vendasFile, 'utf-8');
      const vendasFromFile = JSON.parse(vendasData) as Venda[];
      vendasFromFile.forEach(venda => this.vendas.set(venda.id, venda));
      this.nextVendaId = vendasFromFile.length > 0 ? Math.max(...vendasFromFile.map(v => v.id)) + 1 : 1;
    } catch (error) {
      console.warn("Vendas file not found or empty, attempting to seed data.");
      await this.seedData();
    }

    // Initialize data for Fornecedores, Clientes, and Compras
    try {
      const fornecedoresData = await fs.readFile(this.usersFile.replace('users.json', 'fornecedores.json'), 'utf-8');
      const fornecedoresFromFile = JSON.parse(fornecedoresData) as Fornecedor[];
      fornecedoresFromFile.forEach(fornecedor => this.fornecedores.set(fornecedor.id, fornecedor));
      this.nextFornecedorId = fornecedoresFromFile.length > 0 ? Math.max(...fornecedoresFromFile.map(f => f.id)) + 1 : 1;
    } catch (error) {
      console.warn("Fornecedores file not found or empty, attempting to seed data.");
      await this.seedData();
    }

    try {
      const clientesData = await fs.readFile(this.usersFile.replace('users.json', 'clientes.json'), 'utf-8');
      const clientesFromFile = JSON.parse(clientesData) as Cliente[];
      clientesFromFile.forEach(cliente => this.clientes.set(cliente.id, cliente));
      this.nextClienteId = clientesFromFile.length > 0 ? Math.max(...clientesFromFile.map(c => c.id)) + 1 : 1;
    } catch (error) {
      console.warn("Clientes file not found or empty, attempting to seed data.");
      await this.seedData();
    }

    try {
      const comprasData = await fs.readFile(this.usersFile.replace('users.json', 'compras.json'), 'utf-8');
      const comprasFromFile = JSON.parse(comprasData) as Compra[];
      comprasFromFile.forEach(compra => this.compras.set(compra.id, compra));
      this.nextCompraId = comprasFromFile.length > 0 ? Math.max(...comprasFromFile.map(c => c.id)) + 1 : 1;
    } catch (error) {
      console.warn("Compras file not found or empty, attempting to seed data.");
      await this.seedData();
    }
  }

  private async seedData() {
    const users: InsertUser[] = [
      { email: "loja1@gmail.com", senha: "loja123", nome: "Loja 1" },
      { email: "loja2@gmail.com", senha: "loja456", nome: "Loja 2" },
    ];
    for (const user of users) {
      await this.createUser(user);
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
    for (const produto of produtos) {
      await this.createProduto(produto);
    }

    // Seed some initial sales data for testing
    const initialVendas: InsertVenda[] = [
      {
        produtoId: 1,
        quantidade: 2,
        total: 51.00,
        data: "2023-10-26T10:00:00Z",
        userId: Array.from(this.users.values())[0].id
      },
      {
        produtoId: 2,
        quantidade: 1,
        total: 8.90,
        data: "2023-10-25T11:30:00Z",
        userId: Array.from(this.users.values())[1].id
      }
    ];
    for (const venda of initialVendas) {
      await this.createVenda(venda);
    }

    // Seed initial data for Fornecedores, Clientes, and Compras
    const initialFornecedores: InsertFornecedor[] = [
      { nome: "Fornecedor A", cnpj: "11.111.111/0001-11", email: "fornecedor.a@email.com", telefone: "(11) 1111-1111", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
      { nome: "Fornecedor B", cnpj: "22.222.222/0001-22", email: "fornecedor.b@email.com", telefone: "(22) 2222-2222", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
    ];
    for (const fornecedor of initialFornecedores) {
      await this.createFornecedor(fornecedor);
    }

    const initialClientes: InsertCliente[] = [
      { nome: "Cliente X", cpf_cnpj: "111.111.111-11", email: "cliente.x@email.com", telefone: "(11) 1111-1111", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
      { nome: "Cliente Y", cpf_cnpj: "222.222.222-22", email: "cliente.y@email.com", telefone: "(22) 2222-2222", endereco: null, observacoes: null, data_cadastro: new Date().toISOString() },
    ];
    for (const cliente of initialClientes) {
      await this.createCliente(cliente);
    }

    const initialCompras: InsertCompra[] = [
      {
        fornecedor_id: 1,
        produto_id: 1,
        quantidade: 10,
        valor_unitario: 20.00,
        valor_total: 200.00,
        data: "2023-10-20T09:00:00Z",
        observacoes: null
      },
      {
        fornecedor_id: 2,
        produto_id: 3,
        quantidade: 5,
        valor_unitario: 6.00,
        valor_total: 30.00,
        data: "2023-10-21T14:00:00Z",
        observacoes: null
      }
    ];
    for (const compra of initialCompras) {
      await this.createCompra(compra);
    }
  }

  private async persistData() {
    await fs.writeFile(this.usersFile, JSON.stringify(Array.from(this.users.values()), null, 2));
    await fs.writeFile(this.produtosFile, JSON.stringify(Array.from(this.produtos.values()), null, 2));
    await fs.writeFile(this.vendasFile, JSON.stringify(Array.from(this.vendas.values()), null, 2));

    // Persist data for Fornecedores, Clientes, and Compras
    await fs.writeFile(this.usersFile.replace('users.json', 'fornecedores.json'), JSON.stringify(Array.from(this.fornecedores.values()), null, 2));
    await fs.writeFile(this.usersFile.replace('users.json', 'clientes.json'), JSON.stringify(Array.from(this.clientes.values()), null, 2));
    await fs.writeFile(this.usersFile.replace('users.json', 'compras.json'), JSON.stringify(Array.from(this.compras.values()), null, 2));
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    await this.persistData();
    return user;
  }

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
}

import { SQLiteStorage } from './sqlite-storage';

export const storage = new SQLiteStorage();