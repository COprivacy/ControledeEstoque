import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
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
  systemConfig,
  devolucoes,
  orcamentos,
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
  type Devolucao,
  type InsertDevolucao,
  type Orcamento,
  type InsertOrcamento,
} from '@shared/schema';
import type { IStorage } from './storage';
import { randomUUID } from 'crypto';
import ws from 'ws';
import { logger } from './logger';


neonConfig.webSocketConstructor = ws;

// Log de debug (sem expor a senha)
const dbUrl = process.env.DATABASE_URL!;
const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
console.log(`🔌 Conectando ao PostgreSQL: ${maskedUrl}`);

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export class PostgresStorage implements IStorage {
  private db;

  constructor() {
    this.db = drizzle(pool);
    console.log('✅ PostgreSQL conectado com sucesso');

    // Testar conexão e seed de dados
    this.testConnection();
    this.seedInitialData();
  }

  private async testConnection() {
    try {
      const result = await this.db.select().from(users).limit(1);
      logger.info('[DB] Teste de conexão bem-sucedido', {
        usuariosEncontrados: result.length
      });
    } catch (error: any) {
      logger.error('[DB] Erro no teste de conexão:', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  private async seedInitialData() {
    try {
      const existingUsers = await this.db.select().from(users);

      // Apenas logar quantos usuários existem, não criar nenhum automaticamente
      console.log(`📊 Usuários existentes no banco: ${existingUsers.length}`);

      if (existingUsers.length === 0) {
        console.log('ℹ️  Banco vazio. Use o script seed-database.ts para criar usuários iniciais se necessário.');
      }

    } catch (error: any) {
      logger.error('[DB] Erro ao verificar dados:', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUserById(userId: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return result[0];
    } catch (error: any) {
      logger.error('[DB] Erro ao buscar usuário por ID:', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      logger.info('[DB] Buscando usuário por email:', { email });

      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      logger.info('[DB] Resultado da busca:', {
        encontrado: result.length > 0,
        usuario: result[0] ? { id: result[0].id, email: result[0].email, nome: result[0].nome } : null
      });

      return result[0];
    } catch (error: any) {
      logger.error('[DB] Erro ao buscar usuário por email:', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = {
      ...insertUser,
      id: randomUUID(),
      data_criacao: new Date().toISOString(),
    };
    const result = await this.db.insert(users).values(newUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    try {
      // Remover campos undefined do objeto updates
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(cleanUpdates).length === 0) {
        return await this.getUserById(id);
      }

      const result = await this.db
        .update(users)
        .set(cleanUpdates)
        .where(eq(users.id, id))
        .returning();

      return result[0];
    } catch (error: any) {
      logger.error('[DB] Erro ao atualizar usuário:', {
        userId: id,
        updates,
        error: error.message
      });
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async getProdutos(): Promise<Produto[]> {
    return await this.db.select().from(produtos);
  }

  async getProduto(id: number): Promise<Produto | undefined> {
    const result = await this.db.select().from(produtos).where(eq(produtos.id, id)).limit(1);
    return result[0];
  }

  async getProdutoByCodigoBarras(codigo: string): Promise<Produto | undefined> {
    const result = await this.db.select().from(produtos).where(eq(produtos.codigo_barras, codigo)).limit(1);
    return result[0];
  }

  async createProduto(insertProduto: InsertProduto): Promise<Produto> {
    const result = await this.db.insert(produtos).values(insertProduto).returning();
    return result[0];
  }

  async updateProduto(id: number, updates: Partial<Produto>): Promise<Produto | undefined> {
    const result = await this.db.update(produtos).set(updates).where(eq(produtos.id, id)).returning();
    return result[0];
  }

  async deleteProduto(id: number): Promise<boolean> {
    const result = await this.db.delete(produtos).where(eq(produtos.id, id)).returning();
    return result.length > 0;
  }

  async getVendas(startDate?: string, endDate?: string): Promise<Venda[]> {
    if (startDate && endDate) {
      return await this.db.select().from(vendas).where(
        and(
          gte(vendas.data, startDate),
          lte(vendas.data, endDate)
        )
      );
    }
    return await this.db.select().from(vendas);
  }

  async createVenda(insertVenda: InsertVenda): Promise<Venda> {
    const result = await this.db.insert(vendas).values(insertVenda).returning();
    return result[0];
  }

  async clearVendas(): Promise<void> {
    await this.db.delete(vendas);
  }

  async getFornecedores(): Promise<Fornecedor[]> {
    return await this.db.select().from(fornecedores);
  }

  async getFornecedor(id: number): Promise<Fornecedor | undefined> {
    const result = await this.db.select().from(fornecedores).where(eq(fornecedores.id, id)).limit(1);
    return result[0];
  }

  async createFornecedor(insertFornecedor: InsertFornecedor): Promise<Fornecedor> {
    const newFornecedor = {
      ...insertFornecedor,
      data_cadastro: new Date().toISOString(),
    };
    const result = await this.db.insert(fornecedores).values(newFornecedor).returning();
    return result[0];
  }

  async updateFornecedor(id: number, updates: Partial<Fornecedor>): Promise<Fornecedor | undefined> {
    const result = await this.db.update(fornecedores).set(updates).where(eq(fornecedores.id, id)).returning();
    return result[0];
  }

  async deleteFornecedor(id: number): Promise<boolean> {
    const result = await this.db.delete(fornecedores).where(eq(fornecedores.id, id)).returning();
    return result.length > 0;
  }

  async getClientes(): Promise<Cliente[]> {
    return await this.db.select().from(clientes);
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const result = await this.db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    return result[0];
  }

  async createCliente(insertCliente: InsertCliente): Promise<Cliente> {
    const newCliente = {
      ...insertCliente,
      data_cadastro: insertCliente.data_cadastro || new Date().toISOString(),
    };
    const result = await this.db.insert(clientes).values(newCliente).returning();
    return result[0];
  }

  async updateCliente(id: number, updates: Partial<Cliente>): Promise<Cliente | undefined> {
    const result = await this.db.update(clientes).set(updates).where(eq(clientes.id, id)).returning();
    return result[0];
  }

  async deleteCliente(id: number): Promise<boolean> {
    const result = await this.db.delete(clientes).where(eq(clientes.id, id)).returning();
    return result.length > 0;
  }

  async getCompras(fornecedorId?: number, startDate?: string, endDate?: string): Promise<Compra[]> {
    let query = this.db.select().from(compras);

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
    const result = await this.db.insert(compras).values(insertCompra).returning();
    return result[0];
  }

  async updateCompra(id: number, updates: Partial<Compra>): Promise<Compra | undefined> {
    const result = await this.db.update(compras).set(updates).where(eq(compras.id, id)).returning();
    return result[0];
  }

  async getConfigFiscal(): Promise<ConfigFiscal | undefined> {
    const result = await this.db.select().from(configFiscal).limit(1);
    return result[0];
  }

  async saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal> {
    const existing = await this.getConfigFiscal();

    if (existing) {
      const result = await this.db.update(configFiscal)
        .set({
          ...insertConfig,
          updated_at: new Date().toISOString(),
        })
        .where(eq(configFiscal.id, existing.id))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(configFiscal).values({
      ...insertConfig,
      updated_at: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async getPlanos(): Promise<Plano[]> {
    return await this.db.select().from(planos).orderBy(desc(planos.id));
  }

  async createPlano(plano: InsertPlano): Promise<Plano> {
    const result = await this.db.insert(planos).values({
      ...plano,
      data_criacao: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updatePlano(id: number, updates: Partial<Plano>): Promise<Plano | undefined> {
    const result = await this.db.update(planos).set(updates).where(eq(planos.id, id)).returning();
    return result[0];
  }

  async deletePlano(id: number): Promise<boolean> {
    const result = await this.db.delete(planos).where(eq(planos.id, id)).returning();
    return result.length > 0;
  }

  async getConfigMercadoPago(): Promise<ConfigMercadoPago | null> {
    const result = await this.db.select().from(configMercadoPago).limit(1);
    return result[0] || null;
  }

  async saveConfigMercadoPago(config: InsertConfigMercadoPago): Promise<ConfigMercadoPago> {
    const existing = await this.getConfigMercadoPago();

    if (existing) {
      const result = await this.db.update(configMercadoPago)
        .set({
          ...config,
          updated_at: new Date().toISOString(),
        })
        .where(eq(configMercadoPago.id, existing.id))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(configMercadoPago).values({
      ...config,
      updated_at: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateConfigMercadoPagoStatus(status: string): Promise<void> {
    const existing = await this.getConfigMercadoPago();
    if (existing) {
      await this.db.update(configMercadoPago)
        .set({
          status_conexao: status,
          ultima_sincronizacao: new Date().toISOString(),
        })
        .where(eq(configMercadoPago.id, existing.id));
    }
  }

  async getLogsAdmin(): Promise<LogAdmin[]> {
    return await this.db.select().from(logsAdmin).orderBy(desc(logsAdmin.id));
  }

  async createLogAdmin(log: InsertLogAdmin): Promise<LogAdmin> {
    const result = await this.db.insert(logsAdmin).values({
      ...log,
      data: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async getSubscriptions(): Promise<Subscription[]> {
    return await this.db.select().from(subscriptions).orderBy(desc(subscriptions.id));
  }

  async getSubscription(id: number): Promise<Subscription | undefined> {
    const result = await this.db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
    return result[0];
  }

  async getSubscriptionsByUser(userId: string): Promise<Subscription[]> {
    return await this.db.select().from(subscriptions).where(eq(subscriptions.user_id, userId));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const result = await this.db.insert(subscriptions).values({
      ...subscription,
      data_criacao: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const result = await this.db.update(subscriptions)
      .set({
        ...updates,
        data_atualizacao: new Date().toISOString(),
      })
      .where(eq(subscriptions.id, id))
      .returning();
    return result[0];
  }

  async getFuncionarios(): Promise<Funcionario[]> {
    return await this.db.select().from(funcionarios);
  }

  async getFuncionariosByContaId(contaId: string): Promise<Funcionario[]> {
    return await this.db.select().from(funcionarios).where(eq(funcionarios.conta_id, contaId));
  }

  async getFuncionario(id: string): Promise<Funcionario | undefined> {
    const result = await this.db.select().from(funcionarios).where(eq(funcionarios.id, id)).limit(1);
    return result[0];
  }

  async getFuncionarioByEmail(email: string): Promise<Funcionario | undefined> {
    const result = await this.db.select().from(funcionarios).where(eq(funcionarios.email, email)).limit(1);
    return result[0];
  }

  async createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario> {
    const newFunc = {
      ...funcionario,
      id: funcionario.id || randomUUID(),
      data_criacao: new Date().toISOString(),
    };

    console.log(`📝 [DB] Inserindo funcionário no banco:`, {
      id: newFunc.id,
      nome: newFunc.nome,
      email: newFunc.email,
      conta_id: newFunc.conta_id,
      status: newFunc.status
    });

    const result = await this.db.insert(funcionarios).values(newFunc).returning();

    console.log(`✅ [DB] Funcionário inserido com sucesso - ID: ${result[0].id}`);

    return result[0];
  }

  async updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined> {
    const result = await this.db.update(funcionarios).set(updates).where(eq(funcionarios.id, id)).returning();
    return result[0];
  }

  async deleteFuncionario(id: string): Promise<boolean> {
    const result = await this.db.delete(funcionarios).where(eq(funcionarios.id, id)).returning();
    return result.length > 0;
  }

  async getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined> {
    const result = await this.db.select().from(permissoesFuncionarios)
      .where(eq(permissoesFuncionarios.funcionario_id, funcionarioId))
      .limit(1);
    return result[0];
  }

  async savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario> {
    const existing = await this.getPermissoesFuncionario(funcionarioId);

    if (existing) {
      const result = await this.db.update(permissoesFuncionarios)
        .set(permissoes)
        .where(eq(permissoesFuncionarios.funcionario_id, funcionarioId))
        .returning();
      return result[0];
    }

    const result = await this.db.insert(permissoesFuncionarios).values({
      funcionario_id: funcionarioId,
      ...permissoes,
    } as any).returning();
    return result[0];
  }

  async getContasPagar(): Promise<ContasPagar[]> {
    return await this.db.select().from(contasPagar).orderBy(desc(contasPagar.id));
  }

  async createContaPagar(conta: InsertContasPagar): Promise<ContasPagar> {
    const result = await this.db.insert(contasPagar).values({
      ...conta,
      data_cadastro: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateContaPagar(id: number, updates: Partial<ContasPagar>): Promise<ContasPagar | undefined> {
    const result = await this.db.update(contasPagar).set(updates).where(eq(contasPagar.id, id)).returning();
    return result[0];
  }

  async deleteContaPagar(id: number): Promise<boolean> {
    const result = await this.db.delete(contasPagar).where(eq(contasPagar.id, id)).returning();
    return result.length > 0;
  }

  async getContasReceber(): Promise<ContasReceber[]> {
    return await this.db.select().from(contasReceber).orderBy(desc(contasReceber.id));
  }

  async createContaReceber(conta: InsertContasReceber): Promise<ContasReceber> {
    const result = await this.db.insert(contasReceber).values({
      ...conta,
      data_cadastro: new Date().toISOString(),
    }).returning();
    return result[0];
  }

  async updateContaReceber(id: number, updates: Partial<ContasReceber>): Promise<ContasReceber | undefined> {
    const result = await this.db.update(contasReceber).set(updates).where(eq(contasReceber.id, id)).returning();
    return result[0];
  }

  async deleteContaReceber(id: number): Promise<boolean> {
    const result = await this.db.delete(contasReceber).where(eq(contasReceber.id, id)).returning();
    return result.length > 0;
  }

  async getCaixas(userId: string): Promise<Caixa[]> {
    return await this.db.select().from(caixas).where(eq(caixas.user_id, userId)).orderBy(desc(caixas.id));
  }

  async getCaixaAberto(userId: string, funcionarioId?: string): Promise<Caixa | undefined> {
    // Se for funcionário, busca o caixa específico dele
    if (funcionarioId) {
      const result = await this.db.select().from(caixas)
        .where(and(
          eq(caixas.user_id, userId),
          eq(caixas.funcionario_id, funcionarioId),
          eq(caixas.status, 'aberto')
        ))
        .limit(1);
      return result[0];
    }

    // Se for dono da conta, busca caixa sem funcionário_id
    const result = await this.db.select().from(caixas)
      .where(and(
        eq(caixas.user_id, userId),
        sql`${caixas.funcionario_id} IS NULL`,
        eq(caixas.status, 'aberto')
      ))
      .limit(1);
    return result[0];
  }

  async getCaixa(id: number): Promise<Caixa | undefined> {
    const result = await this.db.select().from(caixas).where(eq(caixas.id, id)).limit(1);
    return result[0];
  }

  async abrirCaixa(caixa: InsertCaixa): Promise<Caixa> {
    const result = await this.db.insert(caixas).values(caixa).returning();
    return result[0];
  }

  async fecharCaixa(id: number, dados: Partial<Caixa>): Promise<Caixa | undefined> {
    const result = await this.db.update(caixas)
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

    const result = await this.db.update(caixas)
      .set(updates)
      .where(eq(caixas.id, id))
      .returning();
    return result[0];
  }

  async getMovimentacoesCaixa(caixaId: number): Promise<MovimentacaoCaixa[]> {
    return await this.db.select().from(movimentacoesCaixa)
      .where(eq(movimentacoesCaixa.caixa_id, caixaId))
      .orderBy(desc(movimentacoesCaixa.id));
  }

  async createMovimentacaoCaixa(movimentacao: InsertMovimentacaoCaixa): Promise<MovimentacaoCaixa> {
    const result = await this.db.insert(movimentacoesCaixa).values(movimentacao).returning();
    return result[0];
  }

  async limparHistoricoCaixas(userId: string): Promise<{ deletedCount: number }> {
    // Deletar todas as movimentações dos caixas fechados do usuário
    await this.db.delete(movimentacoesCaixa).where(
      eq(movimentacoesCaixa.caixa_id,
        this.db.select({ id: caixas.id })
          .from(caixas)
          .where(and(eq(caixas.user_id, userId), eq(caixas.status, 'fechado')))
          .limit(1) as any
      )
    );

    // Deletar todos os caixas fechados do usuário
    const result = await this.db.delete(caixas)
      .where(and(eq(caixas.user_id, userId), eq(caixas.status, 'fechado')))
      .returning();

    return { deletedCount: result.length };
  }

  async getSystemConfig(chave: string): Promise<{ chave: string; valor: string; updated_at: string } | undefined> {
    const result = await this.db.select().from(systemConfig).where(eq(systemConfig.chave, chave));
    return result[0];
  }

  async setSystemConfig(chave: string, valor: string): Promise<void> {
    const existing = await this.getSystemConfig(chave);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.update(systemConfig)
        .set({ valor, updated_at: now })
        .where(eq(systemConfig.chave, chave));
    } else {
      await this.db.insert(systemConfig).values({
        chave,
        valor,
        updated_at: now
      });
    }
  }

  async upsertSystemConfig(chave: string, valor: string): Promise<{ chave: string; valor: string; updated_at: string }> {
    const existing = await this.getSystemConfig(chave);
    const now = new Date().toISOString();

    if (existing) {
      await this.db.update(systemConfig)
        .set({ valor, updated_at: now })
        .where(eq(systemConfig.chave, chave));
    } else {
      await this.db.insert(systemConfig).values({
        chave,
        valor,
        updated_at: now
      });
    }

    const result = await this.getSystemConfig(chave);
    if (!result) {
      throw new Error('Erro ao salvar configuração');
    }
    return result;
  }

  async getDevolucoes(): Promise<Devolucao[]> {
    return await this.db.select().from(devolucoes).orderBy(desc(devolucoes.id));
  }

  async getDevolucao(id: number): Promise<Devolucao | undefined> {
    const result = await this.db.select().from(devolucoes).where(eq(devolucoes.id, id));
    return result[0];
  }

  async createDevolucao(devolucao: InsertDevolucao): Promise<Devolucao> {
    const result = await this.db.insert(devolucoes).values(devolucao).returning();
    return result[0];
  }

  async updateDevolucao(id: number, updates: Partial<Devolucao>): Promise<Devolucao | undefined> {
    const result = await this.db.update(devolucoes)
      .set(updates)
      .where(eq(devolucoes.id, id))
      .returning();
    return result[0];
  }

  async deleteDevolucao(id: number): Promise<boolean> {
    const result = await this.db.delete(devolucoes)
      .where(eq(devolucoes.id, id))
      .returning();
    return result.length > 0;
  }

  // Métodos de Orçamentos
  async getOrcamentos(): Promise<Orcamento[]> {
    const result = await this.db
      .select()
      .from(orcamentos)
      .orderBy(desc(orcamentos.data_criacao));
    return result;
  }

  async getOrcamento(id: number): Promise<Orcamento | undefined> {
    const result = await this.db
      .select()
      .from(orcamentos)
      .where(eq(orcamentos.id, id))
      .limit(1);
    return result[0];
  }

  async createOrcamento(data: any): Promise<Orcamento> {
    const dataAtual = new Date().toISOString();
    const [orcamento] = await this.db
      .insert(orcamentos)
      .values({
        user_id: data.user_id,
        numero: data.numero,
        data_criacao: data.data_criacao || dataAtual,
        data_atualizacao: data.data_atualizacao || dataAtual,
        validade: data.validade || null,
        cliente_id: data.cliente_id || null,
        cliente_nome: data.cliente_nome,
        cliente_email: data.cliente_email || null,
        cliente_telefone: data.cliente_telefone || null,
        cliente_cpf_cnpj: data.cliente_cpf_cnpj || null,
        cliente_endereco: data.cliente_endereco || null,
        status: data.status || 'pendente',
        itens: data.itens,
        subtotal: data.subtotal,
        desconto: data.desconto || 0,
        valor_total: data.valor_total,
        observacoes: data.observacoes || null,
        condicoes_pagamento: data.condicoes_pagamento || null,
        prazo_entrega: data.prazo_entrega || null,
        vendedor: data.vendedor || null,
        venda_id: data.venda_id || null,
      })
      .returning();

    return orcamento;
  }

  async updateOrcamento(id: number, data: any): Promise<Orcamento> {
    const [orcamento] = await this.db
      .update(orcamentos)
      .set({
        validade: data.validade,
        cliente_id: data.cliente_id,
        cliente_nome: data.cliente_nome,
        cliente_email: data.cliente_email,
        cliente_telefone: data.cliente_telefone,
        cliente_cpf_cnpj: data.cliente_cpf_cnpj,
        cliente_endereco: data.cliente_endereco,
        status: data.status,
        itens: data.itens,
        subtotal: data.subtotal,
        desconto: data.desconto,
        valor_total: data.valor_total,
        observacoes: data.observacoes,
        condicoes_pagamento: data.condicoes_pagamento,
        prazo_entrega: data.prazo_entrega,
        data_atualizacao: new Date().toISOString(),
      })
      .where(eq(orcamentos.id, id))
      .returning();

    return orcamento;
  }

  async deleteOrcamento(id: number): Promise<void> {
    await this.db
      .delete(orcamentos)
      .where(eq(orcamentos.id, id));
  }

  async converterOrcamentoEmVenda(id: number, userId: string, vendedorNome?: string): Promise<Venda> {
    const orcamento = await this.getOrcamento(id);

    if (!orcamento) {
      throw new Error("Orçamento não encontrado");
    }

    if (orcamento.user_id !== userId) {
      throw new Error("Acesso negado");
    }

    if (orcamento.status === 'convertido') {
      throw new Error("Este orçamento já foi convertido em venda");
    }

    // Criar venda baseada no orçamento
    const itensOrcamento = Array.isArray(orcamento.itens) ? orcamento.itens : [];
    
    const [venda] = await this.db
      .insert(vendas)
      .values({
        user_id: userId,
        data: new Date().toISOString(),
        valor_total: orcamento.valor_total,
        forma_pagamento: 'dinheiro',
        itens: JSON.stringify(itensOrcamento),
        cliente_id: orcamento.cliente_id || undefined,
        produto: itensOrcamento.map((i: any) => i.nome).join(', '),
        quantidade_vendida: itensOrcamento.reduce((sum: number, i: any) => sum + i.quantidade, 0),
        orcamento_id: id,
        vendedor: vendedorNome || orcamento.vendedor || 'Sistema',
      })
      .returning();

    // Atualizar produtos (reduzir estoque)
    for (const item of itensOrcamento as any[]) {
      const produto = await this.getProduto(item.produto_id);
      if (produto && produto.user_id === userId) {
        await this.updateProduto(item.produto_id, {
          quantidade: produto.quantidade - item.quantidade,
        });
      }
    }

    // Marcar orçamento como convertido
    await this.db
      .update(orcamentos)
      .set({
        status: 'convertido',
        data_atualizacao: new Date().toISOString(),
        venda_id: venda.id,
      })
      .where(eq(orcamentos.id, id));

    return venda;
  }
}