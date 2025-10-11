import { 
  type User, 
  type InsertUser,
  type Produto,
  type InsertProduto,
  type Venda,
  type InsertVenda 
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private produtos: Map<number, Produto>;
  private vendas: Map<number, Venda>;
  private nextProdutoId: number;
  private nextVendaId: number;

  constructor() {
    this.users = new Map();
    this.produtos = new Map();
    this.vendas = new Map();
    this.nextProdutoId = 1;
    this.nextVendaId = 1;
    
    this.seedData();
  }

  private seedData() {
    const users: InsertUser[] = [
      { email: "loja1@gmail.com", senha: "loja123", nome: "Loja 1" },
      { email: "loja2@gmail.com", senha: "loja456", nome: "Loja 2" },
    ];
    users.forEach(user => this.createUser(user));

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
    produtos.forEach(produto => this.createProduto(produto));
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
    return produto;
  }

  async updateProduto(id: number, updates: Partial<InsertProduto>): Promise<Produto | undefined> {
    const produto = this.produtos.get(id);
    if (!produto) return undefined;
    
    const updatedProduto = { ...produto, ...updates };
    this.produtos.set(id, updatedProduto);
    return updatedProduto;
  }

  async deleteProduto(id: number): Promise<boolean> {
    return this.produtos.delete(id);
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
    return venda;
  }
}

export const storage = new MemStorage();
