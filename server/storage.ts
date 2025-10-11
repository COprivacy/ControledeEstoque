import {
  type User,
  type InsertUser,
  type Produto,
  type InsertProduto,
  type Venda,
  type InsertVenda
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProdutos(): Promise<Produto[]>;
  getProduto(id: number): Promise<Produto | undefined>;
  getProdutoByCodigoBarras(codigoBarras: string): Promise<Produto | undefined>;
  createProduto(produto: InsertProduto): Promise<Produto>;
  updateProduto(id: number, produto: Partial<InsertProduto>): Promise<Produto | undefined>;
  deleteProduto(id: number): Promise<boolean>;

  getVendas(startDate?: string, endDate?: string): Promise<Venda[]>;
  createVenda(venda: InsertVenda): Promise<Venda>;
  clearVendas(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private produtos: Map<number, Produto>;
  private vendas: Map<number, Venda>;
  private nextProdutoId: number;
  private nextVendaId: number;

  // Mock file paths for demonstration
  private usersFile = path.join(__dirname, 'users.json');
  private produtosFile = path.join(__dirname, 'produtos.json');
  private vendasFile = path.join(__dirname, 'vendas.json');

  constructor() {
    this.users = new Map();
    this.produtos = new Map();
    this.vendas = new Map();
    this.nextProdutoId = 1;
    this.nextVendaId = 1;

    // Initialize storage by loading data from mock files or seeding if files don't exist
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      const usersData = await fs.readFile(this.usersFile, 'utf-8');
      const usersFromFile = JSON.parse(usersData) as User[];
      usersFromFile.forEach(user => this.users.set(user.id, user));
      this.nextProdutoId = usersFromFile.length > 0 ? Math.max(...usersFromFile.map(u => u.id.length)) + 1 : 1; // Simple ID increment logic for mock

    } catch (error) {
      console.warn("Users file not found or empty, seeding initial users.");
      await this.seedData(); // Seed if files are not found
    }

    try {
      const produtosData = await fs.readFile(this.produtosFile, 'utf-8');
      const produtosFromFile = JSON.parse(produtosData) as Produto[];
      produtosFromFile.forEach(produto => this.produtos.set(produto.id, produto));
      this.nextProdutoId = produtosFromFile.length > 0 ? Math.max(...produtosFromFile.map(p => p.id)) + 1 : 1;
    } catch (error) {
      console.warn("Produtos file not found or empty, seeding initial produtos.");
      await this.seedData();
    }

    try {
      const vendasData = await fs.readFile(this.vendasFile, 'utf-8');
      const vendasFromFile = JSON.parse(vendasData) as Venda[];
      vendasFromFile.forEach(venda => this.vendas.set(venda.id, venda));
      this.nextVendaId = vendasFromFile.length > 0 ? Math.max(...vendasFromFile.map(v => v.id)) + 1 : 1;
    } catch (error) {
      console.warn("Vendas file not found or empty, seeding initial vendas.");
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
  }

  private async persistData() {
    await fs.writeFile(this.usersFile, JSON.stringify(Array.from(this.users.values()), null, 2));
    await fs.writeFile(this.produtosFile, JSON.stringify(Array.from(this.produtos.values()), null, 2));
    await fs.writeFile(this.vendasFile, JSON.stringify(Array.from(this.vendas.values()), null, 2));
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
    // In a real app, you'd fetch from a DB. Here we return the in-memory map.
    // For the dashboard issue, ensure this is not returning mock data.
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
}

export const storage = new MemStorage();