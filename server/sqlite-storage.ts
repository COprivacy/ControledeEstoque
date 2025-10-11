
import Database from 'better-sqlite3';
import {
  type User,
  type InsertUser,
  type Produto,
  type InsertProduto,
  type Venda,
  type InsertVenda
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

  constructor(dbPath?: string) {
    const defaultPath = path.join(__dirname, 'database.db');
    this.db = new Database(dbPath || defaultPath);
    this.initializeTables();
    this.seedData();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL,
        nome TEXT NOT NULL
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
        itens TEXT
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
        insertProduto.run(
          produto.nome,
          produto.categoria,
          produto.preco,
          produto.quantidade,
          produto.estoque_minimo,
          produto.codigo_barras || null,
          produto.vencimento || null
        );
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    this.db.prepare('INSERT INTO users (id, email, senha, nome) VALUES (?, ?, ?, ?)')
      .run(id, insertUser.email, insertUser.senha, insertUser.nome);
    return { ...insertUser, id };
  }

  async getProdutos(): Promise<Produto[]> {
    return this.db.prepare('SELECT * FROM produtos').all() as Produto[];
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    return this.db.prepare('SELECT * FROM produtos WHERE id = ?').get(id) as Produto | undefined;
  }

  async getProdutoByCodigoBarras(codigoBarras: string): Promise<Produto | undefined> {
    return this.db.prepare('SELECT * FROM produtos WHERE codigo_barras = ?').get(codigoBarras) as Produto | undefined;
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    const result = this.db.prepare(
      'INSERT INTO produtos (nome, categoria, preco, quantidade, estoque_minimo, codigo_barras, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      insertProduto.nome,
      insertProduto.categoria,
      insertProduto.preco,
      insertProduto.quantidade,
      insertProduto.estoque_minimo,
      insertProduto.codigo_barras || null,
      insertProduto.vencimento || null
    );
    return { ...insertProduto, id: result.lastInsertRowid as number };
  }

  async updateProduto(id: number, updates: Partial<InsertProduto>): Promise<Produto | undefined> {
    const produto = await this.getProduto(id);
    if (!produto) return undefined;

    const updatedProduto = { ...produto, ...updates };
    this.db.prepare(
      'UPDATE produtos SET nome = ?, categoria = ?, preco = ?, quantidade = ?, estoque_minimo = ?, codigo_barras = ?, vencimento = ? WHERE id = ?'
    ).run(
      updatedProduto.nome,
      updatedProduto.categoria,
      updatedProduto.preco,
      updatedProduto.quantidade,
      updatedProduto.estoque_minimo,
      updatedProduto.codigo_barras || null,
      updatedProduto.vencimento || null,
      id
    );
    return updatedProduto;
  }

  async deleteProduto(id: number): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async getVendas(startDate?: string, endDate?: string): Promise<Venda[]> {
    let query = 'SELECT * FROM vendas WHERE 1=1';
    const params: any[] = [];

    if (startDate) {
      query += ' AND data >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND data <= ?';
      params.push(endDate);
    }

    return this.db.prepare(query).all(...params) as Venda[];
  }

  async createVenda(insertVenda: InsertVenda): Promise<Venda> {
    const result = this.db.prepare(
      'INSERT INTO vendas (produto, quantidade_vendida, valor_total, data, itens) VALUES (?, ?, ?, ?, ?)'
    ).run(
      insertVenda.produto,
      insertVenda.quantidade_vendida,
      insertVenda.valor_total,
      insertVenda.data,
      insertVenda.itens || null
    );
    return { ...insertVenda, id: result.lastInsertRowid as number };
  }

  async clearVendas(): Promise<void> {
    this.db.prepare('DELETE FROM vendas').run();
  }

  close() {
    this.db.close();
  }
}
