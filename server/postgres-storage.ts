import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  users,
  produtos,
  vendas,
  fornecedores,
  clientes,
  compras,
  configFiscal,
  planos,
  configMercadoPago,
  logsAdmin,
  subscriptions,
  funcionarios,
  permissoesFuncionarios,
  contasPagar,
  contasReceber,
  caixas,
  movimentacoesCaixa,
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
  type ConfigMercadoPago,
  type InsertConfigMercadoPago,
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
  type InsertMovimentacaoCaixa,
  type ContasPagar,
  type InsertContasPagar,
  type ContasReceber,
  type InsertContasReceber,
} from '@shared/schema';
import type { IStorage } from './storage';
import { randomUUID } from 'crypto';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

// Log de debug (sem expor a senha)
const dbUrl = process.env.DATABASE_URL!;
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
console.log(`🔌 Conectando ao PostgreSQL: ${maskedUrl}`);

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

export class PostgresStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = {
      ...insertUser,
      id: randomUUID(),
      data_criacao: new Date().toISOString(),
    };
    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getProdutos(): Promise<Produto[]> {
    return await db.select().from(produtos);
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    const result = await db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
    return result[0];
  }

  async getProdutoByCodigoBarras(codigo: string): Promise<Produto | undefined> {
    const result = await db.select().from(produtos).where(eq(produtos.codigo_barras, codigo)).limit(1);
    return result[0];
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    const result = await db.insert(produtos).values(insertProduto).returning();
    return result[0];
  }

  async updateProduto(id: number, updates: Partial<Produto>): Promise<Produto | undefined> {
    const result = await db.update(produtos).set(updates).where(eq(produtos.id, id)).returning();
    return result[0];
  }

  async deleteProduto(id: number): Promise<boolean> {
    const result = await db.delete(produtos).where(eq(produtos.id, id)).returning();
    return result.length > 0;
  }

  async getVendas(startDate?: string, endDate?: string): Promise<Venda[]> {
    if (startDate && endDate) {
      return await db.select().from(vendas).where(
        and(
          gte(vendas.data, startDate),
          lte(vendas.data, endDate)
        )
      );
    }
    return await db.select().from(vendas);
  }

  async createVenda(insertVenda: InsertVenda): Promise<Venda> {
    const result = await db.insert(vendas).values(insertVenda).returning();
    return result[0];
  }

  async clearVendas(): Promise<void> {
    await db.delete(vendas);
  }

  async getFornecedores(): Promise<Fornecedor[]> {
    return await db.select().from(fornecedores);
  }

  async getFornecedor(id: number): Promise<Fornecedor | undefined> {
    const result = await db.select().from(fornecedores).where(eq(fornecedores.id, id)).limit(1);
    return result[0];
  }

  async createFornecedor(insertFornecedor: InsertFornecedor): Promise<Fornecedor> {
    const newFornecedor = {
      ...insertFornecedor,
      data_cadastro: new Date().toISOString(),
    };
    const result = await db.insert(fornecedores).values(newFornecedor).returning();
    return result[0];
  }

  async updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined> {
    const result = await db.update(fornecedores).set(updates).where(eq(fornecedores.id, id)).returning();
    return result[0];
  }

  async deleteFornecedor(id: number): Promise<boolean> {
    const result = await db.delete(fornecedores).where(eq(fornecedores.id, id)).returning();
    return result.length > 0;
  }

  async getClientes(): Promise<Cliente[]> {
    return await db.select().from(clientes);
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    return result[0];
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const newCliente = {
      ...insertCliente,
      data_cadastro: insertCliente.data_cadastro || new Date().toISOString(),
    };
    const result = await db.insert(clientes).values(newCliente).returning();
    return result[0];
  }

  async updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente | undefined> {
    const result = await db.update(clientes).set(updates).where(eq(clientes.id, id)).returning();
    return result[0];
  }

  async deleteCliente(id: number): Promise<boolean> {
    const result = await db.delete(clientes).where(eq(clientes.id, id)).returning();
    return result.length > 0;
  }

  async getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]> {
    let query = db.select().from(compras);
    
    if (fornecedorId && startDate && endDate) {
      return await query.where(
        and(
          eq(compras.fornecedor_id, fornecedorId),
          gte(compras.data, startDate),
          lte(compras.data, endDate)
        )
      );
    } else if (fornecedorId) {
      return await query.where(eq(compras.fornecedor_id, fornecedorId));
    } else if (startDate && endDate) {
      return await query.where(
        and(
          gte(compras.data, startDate),
          lte(compras.data, endDate)
        )
      );
    }
    
    return await query;
  }

  async createCompra(insertCompra: InsertCompra): Promise<Compra> {
    const result = await db.insert(compras).values(insertCompra).returning();
    return result[0];
  }

  async updateCompra(id: number, updates: Partial<Compra>): Promise<Compra | undefined> {
    const result = await db.update(compras).set(updates).where(eq(compras.id, id)).returning();
    return result[0];
  }

  async getConfigFiscal(): Promise<ConfigFiscal | undefined> {
    const result = await db.select().from(configFiscal).limit(1);
    return result[0];
  }

  async saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal> {
    const existing = await this.getConfigFiscal();
    
    if (existing) {
      const result = await db.update(configFiscal)
        .set({
          ...insertConfig,
          updated_at: new Date().toISOString(),
        })
        .where(eq(configFiscal.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(configFiscal).values({
      ...insertConfig,
      updated_at: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async getPlanos(): Promise<Plano[]> {
    return await db.select().from(planos).orderBy(desc(planos.id));
  }

  async createPlano(plano: InsertPlano): Promise<Plano> {
    const result = await db.insert(planos).values({
      ...plano,
      data_criacao: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updatePlano(id: number, updates: Partial<Plano>): Promise<Plano | undefined> {
    const result = await db.update(planos).set(updates).where(eq(planos.id, id)).returning();
    return result[0];
  }

  async deletePlano(id: number): Promise<boolean> {
    const result = await db.delete(planos).where(eq(planos.id, id)).returning();
    return result.length > 0;
  }

  async getConfigMercadoPago(): Promise<ConfigMercadoPago | null> {
    const result = await db.select().from(configMercadoPago).limit(1);
    return result[0] || null;
  }

  async saveConfigMercadoPago(config: InsertConfigMercadoPago): Promise<ConfigMercadoPago> {
    const existing = await this.getConfigMercadoPago();
    
    if (existing) {
      const result = await db.update(configMercadoPago)
        .set({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .where(eq(configMercadoPago.id, existing.id))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(configMercadoPago).values({
      ...config,
      updated_at: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateConfigMercadoPagoStatus(status: string): Promise<void> {
    const existing = await this.getConfigMercadoPago();
    if (existing) {
      await db.update(configMercadoPago)
        .set({
          status_conexao: status,
          ultima_sincronizacao: new Date().toISOString(),
        })
        .where(eq(configMercadoPago.id, existing.id));
    }
  }

  async getLogsAdmin(): Promise<LogAdmin[]> {
    return await db.select().from(logsAdmin).orderBy(desc(logsAdmin.id));
  }

  async createLogAdmin(log: InsertLogAdmin): Promise<LogAdmin> {
    const result = await db.insert(logsAdmin).values({
      ...log,
      data: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.id));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.user_id, userId));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await db.insert(subscriptions).values({
      ...subscription,
      data_criacao: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await db.update(subscriptions)
      .set({
        ...updates,
        data_atualizacao: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async getFuncionarios(): Promise<Funcionario[]> {
    return await db.select().from(funcionarios);
  }

  async getFuncionariosByContaId(contaId: string): Promise<Funcionario[]> {
    return await db.select().from(funcionarios).where(eq(funcionarios.conta_id, contaId));
  }

  async getFuncionario(id: string): Promise<Funcionario | undefined> {
    const result = await db.select().from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
    return result[0];
  }

  async createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario> {
    const newFunc = {
      ...funcionario,
      id: funcionario.id || randomUUID(),
      data_criacao: new Date().toISOString(),
    };
    const result = await db.insert(funcionarios).values(newFunc).returning();
    return result[0];
  }

  async updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined> {
    const result = await db.update(funcionarios).set(updates).where(eq(funcionarios.id, id)).returning();
    return result[0];
  }

  async deleteFuncionario(id: string): Promise<boolean> {
    const result = await db.delete(funcionarios).where(eq(funcionarios.id, id)).returning();
    return result.length > 0;
  }

  async getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined> {
    const result = await db.select().from(permissoesFuncionarios)
      .where(eq(permissoesFuncionarios.funcionario_id, funcionarioId))
      .limit(1);
    return result[0];
  }

  async savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario> {
    const existing = await this.getPermissoesFuncionario(funcionarioId);
    
    if (existing) {
      const result = await db.update(permissoesFuncionarios)
        .set(permissoes)
        .where(eq(permissoesFuncionarios.funcionario_id, funcionarioId))
        .returning();
      return result[0];
    }
    
    const result = await db.insert(permissoesFuncionarios).values({
      funcionario_id: funcionarioId,
      ...permissoes,
    } as any).returning();
    return result[0];
  }

  async getContasPagar(): Promise<ContasPagar[]> {
    return await db.select().from(contasPagar).orderBy(desc(contasPagar.id));
  }

  async createContaPagar(conta: InsertContasPagar): Promise<ContasPagar> {
    const result = await db.insert(contasPagar).values({
      ...conta,
      data_cadastro: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateContaPagar(id: number, updates: Partial<ContasPagar>): Promise<ContasPagar | undefined> {
    const result = await db.update(contasPagar).set(updates).where(eq(contasPagar.id, id)).returning();
    return result[0];
  }

  async deleteContaPagar(id: number): Promise<boolean> {
    const result = await db.delete(contasPagar).where(eq(contasPagar.id, id)).returning();
    return result.length > 0;
  }

  async getContasReceber(): Promise<ContasReceber[]> {
    return await db.select().from(contasReceber).orderBy(desc(contasReceber.id));
  }

  async createContaReceber(conta: InsertContasReceber): Promise<ContasReceber> {
    const result = await db.insert(contasReceber).values({
      ...conta,
      data_cadastro: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateContaReceber(id: number, updates: Partial<ContasReceber>): Promise<ContasReceber | undefined> {
    const result = await db.update(contasReceber).set(updates).where(eq(contasReceber.id, id)).returning();
    return result[0];
  }

  async deleteContaReceber(id: number): Promise<boolean> {
    const result = await db.delete(contasReceber).where(eq(contasReceber.id, id)).returning();
    return result.length > 0;
  }

  async getCaixas(userId: string): Promise<Caixa[]> {
    return await db.select().from(caixas).where(eq(caixas.user_id, userId)).orderBy(desc(caixas.id));
  }

  async getCaixaAberto(userId: string): Promise<Caixa | undefined> {
    const result = await db.select().from(caixas)
      .where(and(eq(caixas.user_id, userId), eq(caixas.status, 'aberto')))
      .limit(1);
    return result[0];
  }

  async getCaixa(id: number): Promise<Caixa | undefined> {
    const result = await db.select().from(caixas).where(eq(caixas.id, id)).limit(1);
    return result[0];
  }

  async abrirCaixa(caixa: InsertCaixa): Promise<Caixa> {
    const result = await db.insert(caixas).values(caixa).returning();
    return result[0];
  }

  async fecharCaixa(id: number, dados: Partial<Caixa>): Promise<Caixa | undefined> {
    const result = await db.update(caixas)
      .set({
        ...dados,
        data_fechamento: new Date().toISOString(),
        status: 'fechado',
      })
      .where(eq(caixas.id, id))
      .returning();
    return result[0];
  }

  async atualizarTotaisCaixa(id: number, campo: 'total_vendas' | 'total_suprimentos' | 'total_retiradas', valor: number): Promise<Caixa | undefined> {
    const caixa = await this.getCaixa(id);
    if (!caixa) return undefined;

    const updates: Partial<Caixa> = {
      [campo]: (caixa[campo] || 0) + valor,
    };

    const result = await db.update(caixas)
      .set(updates)
      .where(eq(caixas.id, id))
      .returning();
    return result[0];
  }

  async getMovimentacoesCaixa(caixaId: number): Promise<MovimentacaoCaixa[]> {
    return await db.select().from(movimentacoesCaixa)
      .where(eq(movimentacoesCaixa.caixa_id, caixaId))
      .orderBy(desc(movimentacoesCaixa.id));
  }

  async createMovimentacaoCaixa(movimentacao: InsertMovimentacaoCaixa): Promise<MovimentacaoCaixa> {
    const result = await db.insert(movimentacoesCaixa).values(movimentacao).returning();
    return result[0];
  }

  async limparHistoricoCaixas(userId: string): Promise<{ deletedCount: number }> {
    // Deletar todas as movimentações dos caixas fechados do usuário
    await db.delete(movimentacoesCaixa).where(
      eq(movimentacoesCaixa.caixa_id, 
        db.select({ id: caixas.id })
          .from(caixas)
          .where(and(eq(caixas.user_id, userId), eq(caixas.status, 'fechado')))
          .limit(1) as any
      )
    );

    // Deletar todos os caixas fechados do usuário
    const result = await db.delete(caixas)
      .where(and(eq(caixas.user_id, userId), eq(caixas.status, 'fechado')))
      .returning();

    return { deletedCount: result.length };
  }
}
