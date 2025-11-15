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
  type Devolucao,
  type InsertDevolucao,
  type Orcamento,
  type InsertOrcamento,
  type ClientNote,
  type InsertClientNote,
  type ClientDocument,
  type InsertClientDocument,
  type ClientInteraction,
  type InsertClientInteraction,
  type PlanChangeHistory,
  type InsertPlanChangeHistory,
  type ClientCommunication,
  type InsertClientCommunication
} from "@shared/schema";

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
  deleteVenda?(id: number): Promise<boolean>;
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
  getConfigMercadoPago?(): Promise<ConfigMercadoPago | null>;
  saveConfigMercadoPago?(config: InsertConfigMercadoPago): Promise<ConfigMercadoPago>;
  updateConfigMercadoPagoStatus?(status: string): Promise<void>;
  getLogsAdmin?(): Promise<LogAdmin[]>;
  getLogsAdminByAccount?(contaId: string): Promise<LogAdmin[]>;
  createLogAdmin?(log: InsertLogAdmin): Promise<LogAdmin>;
  logAdminAction?(actorId: string, action: string, details?: string, context?: { ip?: string; userAgent?: string; contaId?: string }): Promise<void>;

  // Métodos para Subscriptions
  getSubscriptions?(): Promise<Subscription[]>;
  getSubscription?(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByUser?(userId: string): Promise<Subscription[]>;
  createSubscription?(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription?(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;

  // Métodos para Funcionários e Permissões
  getFuncionarios(): Promise<Funcionario[]>;
  getFuncionariosByContaId(contaId: string): Promise<Funcionario[]>;
  getFuncionario(id: string): Promise<Funcionario | undefined>;
  getFuncionarioByEmail(email: string): Promise<Funcionario | undefined>;
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
  getCaixaAberto?(userId: string, funcionarioId?: string): Promise<any | undefined>;
  getCaixa?(id: number): Promise<any | undefined>;
  abrirCaixa?(caixa: any): Promise<any>;
  fecharCaixa?(id: number, dados: any): Promise<any | undefined>;
  atualizarTotaisCaixa?(id: number, campo: 'total_vendas' | 'total_suprimentos' | 'total_retiradas', valor: number): Promise<any | undefined>;
  getMovimentacoesCaixa?(caixaId: number): Promise<any[]>;
  createMovimentacaoCaixa?(movimentacao: any): Promise<any>;
  limparHistoricoCaixas?(userId: string): Promise<{ deletedCount: number }>;

  // Métodos para Configurações do Sistema
  getSystemConfig?(chave: string): Promise<{ chave: string; valor: string; updated_at: string } | undefined>;
  setSystemConfig?(chave: string, valor: string): Promise<void>;
  upsertSystemConfig?(chave: string, valor: string): Promise<{ chave: string; valor: string; updated_at: string }>;

  // Métodos para Devoluções
  getDevolucoes?(): Promise<Devolucao[]>;
  getDevolucao?(id: number): Promise<Devolucao | undefined>;
  createDevolucao?(devolucao: InsertDevolucao): Promise<Devolucao>;
  updateDevolucao?(id: number, updates: Partial<Devolucao>): Promise<Devolucao | undefined>;
  deleteDevolucao?(id: number): Promise<boolean>;

  // Métodos para Orçamentos
  getOrcamentos?(): Promise<Orcamento[]>;
  getOrcamento?(id: number): Promise<Orcamento | undefined>;
  createOrcamento?(orcamento: InsertOrcamento): Promise<Orcamento>;
  updateOrcamento?(id: number, updates: Partial<Orcamento>): Promise<Orcamento | undefined>;
  deleteOrcamento?(id: number): Promise<boolean>;

  // ============================================
  // MÉTODOS PARA GESTÃO DE CLIENTE 360°
  // ============================================
  
  // Client Notes - Notas sobre clientes
  getClientNotes(userId: string, limit?: number, offset?: number): Promise<ClientNote[]>;
  createClientNote(note: InsertClientNote): Promise<ClientNote>;
  updateClientNote(id: number, updates: Partial<ClientNote>): Promise<ClientNote | undefined>;
  deleteClientNote(id: number): Promise<boolean>;
  
  // Client Documents - Documentos/anexos
  getClientDocuments(userId: string, limit?: number, offset?: number): Promise<ClientDocument[]>;
  createClientDocument(document: InsertClientDocument): Promise<ClientDocument>;
  deleteClientDocument(id: number): Promise<boolean>;
  
  // Client Interactions - Timeline de interações
  getClientInteractions(userId: string, limit?: number, offset?: number): Promise<ClientInteraction[]>;
  createClientInteraction(interaction: InsertClientInteraction): Promise<ClientInteraction>;
  
  // Plan Changes History - Histórico de mudanças de plano
  getPlanChangesHistory(userId: string, limit?: number, offset?: number): Promise<PlanChangeHistory[]>;
  createPlanChangeHistory(change: InsertPlanChangeHistory): Promise<PlanChangeHistory>;
  
  // Client Communications - Comunicações enviadas
  getClientCommunications(userId: string, limit?: number, offset?: number): Promise<ClientCommunication[]>;
  createClientCommunication(communication: InsertClientCommunication): Promise<ClientCommunication>;
  
  // Timeline Unificada - Agrega todos os eventos do cliente
  getClientTimeline(userId: string, limit?: number, offset?: number): Promise<any[]>;
  
  // Employee Packages - Pacotes de funcionários
  createEmployeePackage?(data: any): Promise<any>;
  getEmployeePackages?(userId: string): Promise<any[]>;
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
  abstract getFuncionarios(): Promise<Funcionario[]>;
  abstract getFuncionariosByContaId(contaId: string): Promise<Funcionario[]>;
  abstract getFuncionario(id: string): Promise<Funcionario | undefined>;
  abstract createFuncionario(funcionario: InsertFuncionario): Promise<Funcionario>;
  abstract updateFuncionario(id: string, updates: Partial<Funcionario>): Promise<Funcionario | undefined>;
  abstract deleteFuncionario(id: string): Promise<boolean>;
  abstract getPermissoesFuncionario(funcionarioId: string): Promise<PermissaoFuncionario | undefined>;
  abstract savePermissoesFuncionario(funcionarioId: string, permissoes: Partial<PermissaoFuncionario>): Promise<PermissaoFuncionario>;

  abstract getConfigFiscal(): Promise<ConfigFiscal | undefined>;
  abstract saveConfigFiscal(insertConfig: InsertConfigFiscal): Promise<ConfigFiscal>;
}

// MemStorage removido - usar apenas PostgresStorage
// A classe MemStorage foi descontinuada após migração para PostgreSQL

import { PostgresStorage } from './postgres-storage';

export const storage = new PostgresStorage();