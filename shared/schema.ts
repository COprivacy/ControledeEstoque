import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { timestamp, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  senha: text("senha").notNull(),
  nome: text("nome").notNull(),
  plano: text("plano").default("free"),
  is_admin: text("is_admin").default("false"),
  data_criacao: text("data_criacao"),
  data_expiracao_trial: text("data_expiracao_trial"),
  data_expiracao_plano: text("data_expiracao_plano"),
  status: text("status").default("ativo"),
  cpf_cnpj: text("cpf_cnpj"),
  telefone: text("telefone"),
  endereco: text("endereco"),
  asaas_customer_id: text("asaas_customer_id"),
  permissoes: text("permissoes"),
  ultimo_acesso: text("ultimo_acesso"),
  max_funcionarios: integer("max_funcionarios").default(1),
  meta_mensal: real("meta_mensal").default(15000),
});

export const produtos = pgTable("produtos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(),
  preco: real("preco").notNull(),
  quantidade: integer("quantidade").notNull(),
  estoque_minimo: integer("estoque_minimo").notNull(),
  codigo_barras: text("codigo_barras"),
  vencimento: text("vencimento"),
});

export const vendas = pgTable("vendas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  produto: text("produto").notNull(),
  quantidade_vendida: integer("quantidade_vendida").notNull().default(0),
  valor_total: real("valor_total").notNull().default(0),
  data: text("data").notNull(),
  itens: text("itens"),
  cliente_id: integer("cliente_id"),
  forma_pagamento: text("forma_pagamento"),
});

export const fornecedores = pgTable("fornecedores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  nome: text("nome").notNull(),
  cnpj: text("cnpj"),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  observacoes: text("observacoes"),
  data_cadastro: text("data_cadastro").notNull(),
});

export const clientes = pgTable("clientes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  nome: text("nome").notNull(),
  cpf_cnpj: text("cpf_cnpj"),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  observacoes: text("observacoes"),
  percentual_desconto: real("percentual_desconto"),
  data_cadastro: text("data_cadastro").notNull(),
});

export const compras = pgTable("compras", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  fornecedor_id: integer("fornecedor_id").notNull(),
  produto_id: integer("produto_id").notNull(),
  quantidade: integer("quantidade").notNull(),
  valor_unitario: real("valor_unitario").notNull(),
  valor_total: real("valor_total").notNull(),
  data: text("data").notNull(),
  observacoes: text("observacoes"),
});

export const configFiscal = pgTable("config_fiscal", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  cnpj: text("cnpj").notNull(),
  razao_social: text("razao_social").notNull(),
  focus_nfe_api_key: text("focus_nfe_api_key").notNull(),
  ambiente: text("ambiente").notNull().default("homologacao"),
  updated_at: text("updated_at").notNull(),
});

export const contasPagar = pgTable("contas_pagar", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  descricao: text("descricao").notNull(),
  valor: real("valor").notNull(),
  data_vencimento: text("data_vencimento").notNull(),
  data_pagamento: text("data_pagamento"),
  categoria: text("categoria"),
  status: text("status").default("pendente"), // pendente, pago
  data_cadastro: text("data_cadastro").notNull(),
});

export const contasReceber = pgTable("contas_receber", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  descricao: text("descricao").notNull(),
  valor: real("valor").notNull(),
  data_vencimento: text("data_vencimento").notNull(),
  data_recebimento: text("data_recebimento"),
  categoria: text("categoria"),
  status: text("status").default("pendente"), // pendente, recebido
  data_cadastro: text("data_cadastro").notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chave: text("chave").notNull().unique(),
  valor: text("valor").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  data_criacao: true,
}).extend({
  meta_mensal: z.number().optional(),
});

export const insertProdutoSchema = createInsertSchema(produtos).omit({
  id: true,
}).extend({
  preco: z.coerce.number().positive(),
  quantidade: z.coerce.number().int().min(0),
  estoque_minimo: z.coerce.number().int().min(0),
});

export const insertVendaSchema = createInsertSchema(vendas).omit({
  id: true,
}).extend({
  quantidade_vendida: z.coerce.number().int().positive(),
  valor_total: z.coerce.number().positive(),
});

export const insertFornecedorSchema = createInsertSchema(fornecedores).omit({
  id: true,
});

export const insertClienteSchema = createInsertSchema(clientes).omit({
  id: true,
}).extend({
  data_cadastro: z.string().optional(),
});

export const insertCompraSchema = createInsertSchema(compras).omit({
  id: true,
}).extend({
  quantidade: z.coerce.number().int().positive(),
  valor_unitario: z.coerce.number().positive(),
  valor_total: z.coerce.number().positive(),
  fornecedor_id: z.number().int().positive(),
  produto_id: z.number().int().positive(),
});

export const insertConfigFiscalSchema = createInsertSchema(configFiscal).omit({
  id: true,
  updated_at: true,
}).extend({
  cnpj: z.string().min(14, "CNPJ inválido"),
  razao_social: z.string().min(1, "Razão social é obrigatória"),
  focus_nfe_api_key: z.string().min(1, "Chave API é obrigatória"),
  ambiente: z.enum(["homologacao", "producao"]).default("homologacao"),
});

export const planos = pgTable("planos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  nome: text("nome").notNull(),
  preco: real("preco").notNull(),
  duracao_dias: integer("duracao_dias").notNull(),
  descricao: text("descricao"),
  ativo: text("ativo").notNull().default("true"),
  data_criacao: text("data_criacao").notNull(),
});

export const configMercadoPago = pgTable("config_mercadopago", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  access_token: text("access_token").notNull(),
  public_key: text("public_key"),
  webhook_url: text("webhook_url"),
  ultima_sincronizacao: text("ultima_sincronizacao"),
  status_conexao: text("status_conexao").default("desconectado"),
  updated_at: text("updated_at").notNull(),
});

export const logsAdmin = pgTable("logs_admin", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  usuario_id: text("usuario_id").notNull(),
  acao: text("acao").notNull(),
  detalhes: text("detalhes"),
  data: text("data").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  plano: text("plano").notNull(),
  status: text("status").notNull().default("pendente"),
  valor: real("valor").notNull().default(0),
  data_inicio: text("data_inicio"),
  data_vencimento: text("data_vencimento"),
  mercadopago_payment_id: text("mercadopago_payment_id"),
  mercadopago_preference_id: text("mercadopago_preference_id"),
  forma_pagamento: text("forma_pagamento"),
  status_pagamento: text("status_pagamento"),
  init_point: text("init_point"),
  external_reference: text("external_reference"),
  prazo_limite_pagamento: text("prazo_limite_pagamento"),
  tentativas_cobranca: integer("tentativas_cobranca").default(0),
  motivo_cancelamento: text("motivo_cancelamento"),
  data_criacao: text("data_criacao").notNull(),
  data_atualizacao: text("data_atualizacao"),
});

export const insertPlanoSchema = createInsertSchema(planos).omit({
  id: true,
  data_criacao: true,
});
export type Plano = typeof planos.$inferSelect;
export type InsertPlano = z.infer<typeof insertPlanoSchema>;

export const insertConfigMercadoPagoSchema = createInsertSchema(configMercadoPago).omit({
  id: true,
  updated_at: true,
});
export type ConfigMercadoPago = typeof configMercadoPago.$inferSelect;
export type InsertConfigMercadoPago = z.infer<typeof insertConfigMercadoPagoSchema>;

export const insertLogAdminSchema = createInsertSchema(logsAdmin).omit({
  id: true,
});
export type LogAdmin = typeof logsAdmin.$inferSelect;
export type InsertLogAdmin = z.infer<typeof insertLogAdminSchema>;

export const insertContasPagarSchema = createInsertSchema(contasPagar).omit({
  id: true,
  data_cadastro: true,
});

export const insertContasReceberSchema = createInsertSchema(contasReceber).omit({
  id: true,
  data_cadastro: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  data_criacao: true,
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Funcionários (multi-tenant)
export const funcionarios = pgTable("funcionarios", {
  id: text("id").primaryKey(),
  conta_id: text("conta_id").notNull(), // ID do usuário dono da conta
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  senha: text("senha").notNull(),
  cargo: text("cargo"),
  status: text("status").notNull().default("ativo"),
  data_criacao: text("data_criacao"),
});

export const insertFuncionarioSchema = createInsertSchema(funcionarios);
export type Funcionario = typeof funcionarios.$inferSelect;
export type InsertFuncionario = z.infer<typeof insertFuncionarioSchema>;

// Permissões dos funcionários
export const permissoesFuncionarios = pgTable("permissoes_funcionarios", {
  id: serial("id").primaryKey(),
  funcionario_id: text("funcionario_id").notNull(),
  dashboard: text("dashboard").notNull().default("false"),
  pdv: text("pdv").notNull().default("false"),
  caixa: text("caixa").notNull().default("false"),
  produtos: text("produtos").notNull().default("false"),
  inventario: text("inventario").notNull().default("false"),
  relatorios: text("relatorios").notNull().default("false"),
  clientes: text("clientes").notNull().default("false"),
  fornecedores: text("fornecedores").notNull().default("false"),
  financeiro: text("financeiro").notNull().default("false"),
  config_fiscal: text("config_fiscal").notNull().default("false"),
  historico_caixas: text("historico_caixas").notNull().default("false"),
  configuracoes: text("configuracoes").notNull().default("false"),
  devolucoes: text("devolucoes").notNull().default("false"),
  contas_pagar: text("contas_pagar").notNull().default("false"),
  contas_receber: text("contas_receber").notNull().default("false"),
  orcamentos: text("orcamentos").notNull().default("false"),
});

export const insertPermissaoFuncionarioSchema = createInsertSchema(permissoesFuncionarios);
export type PermissaoFuncionario = typeof permissoesFuncionarios.$inferSelect;
export type InsertPermissaoFuncionario = z.infer<typeof insertPermissaoFuncionarioSchema>;

export const caixas = pgTable("caixas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  funcionario_id: text("funcionario_id"),
  data_abertura: text("data_abertura").notNull(),
  data_fechamento: text("data_fechamento"),
  saldo_inicial: real("saldo_inicial").notNull().default(0),
  saldo_final: real("saldo_final"),
  total_vendas: real("total_vendas").notNull().default(0),
  total_retiradas: real("total_retiradas").notNull().default(0),
  total_suprimentos: real("total_suprimentos").notNull().default(0),
  status: text("status").notNull().default("aberto"),
  observacoes_abertura: text("observacoes_abertura"),
  observacoes_fechamento: text("observacoes_fechamento"),
});

export const movimentacoesCaixa = pgTable("movimentacoes_caixa", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  caixa_id: integer("caixa_id").notNull(),
  user_id: text("user_id").notNull(),
  tipo: text("tipo").notNull(),
  valor: real("valor").notNull(),
  descricao: text("descricao"),
  data: text("data").notNull(),
});

export const devolucoes = pgTable("devolucoes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user_id: text("user_id").notNull(),
  venda_id: integer("venda_id"),
  produto_id: integer("produto_id").notNull(),
  produto_nome: text("produto_nome").notNull(),
  quantidade: integer("quantidade").notNull(),
  valor_total: real("valor_total").notNull(),
  motivo: text("motivo").notNull(),
  status: text("status").notNull().default("pendente"),
  data_devolucao: text("data_devolucao").notNull(),
  observacoes: text("observacoes"),
  cliente_nome: text("cliente_nome"),
});

export const insertCaixaSchema = createInsertSchema(caixas).omit({
  id: true,
}).extend({
  saldo_inicial: z.coerce.number().min(0),
});

export const insertMovimentacaoCaixaSchema = createInsertSchema(movimentacoesCaixa).omit({
  id: true,
}).extend({
  valor: z.coerce.number().positive(),
  tipo: z.enum(["suprimento", "retirada"]),
});

export const insertDevolucaoSchema = createInsertSchema(devolucoes).omit({
  id: true,
}).extend({
  quantidade: z.coerce.number().int().positive(),
  valor_total: z.coerce.number().positive(),
  status: z.enum(["pendente", "aprovada", "rejeitada"]).default("pendente"),
});

export type InsertDevolucao = typeof devolucoes.$inferInsert;
export type Devolucao = typeof devolucoes.$inferSelect;

// Tabela de Orçamentos
export const orcamentos = pgTable("orcamentos", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(),
  numero: text("numero").notNull(),
  cliente_id: integer("cliente_id"),
  cliente_nome: text("cliente_nome").notNull(),
  cliente_email: text("cliente_email"),
  cliente_telefone: text("cliente_telefone"),
  cliente_cpf_cnpj: text("cliente_cpf_cnpj"),
  cliente_endereco: text("cliente_endereco"),
  itens: jsonb("itens").notNull(),
  subtotal: real("subtotal").notNull(),
  desconto: real("desconto").notNull().default(0),
  valor_total: real("valor_total").notNull(),
  observacoes: text("observacoes"),
  condicoes_pagamento: text("condicoes_pagamento"),
  prazo_entrega: text("prazo_entrega"),
  validade: text("validade").notNull(),
  status: text("status").notNull(),
  data_criacao: text("data_criacao").notNull(),
  data_atualizacao: text("data_atualizacao"),
  vendedor: text("vendedor"),
  venda_id: integer("venda_id"),
});

export const insertOrcamentoSchema = createInsertSchema(orcamentos).omit({
  id: true,
  numero: true,
  data_criacao: true,
  data_atualizacao: true,
}).extend({
  user_id: z.string().optional(),
  cliente_nome: z.string().min(1, "Nome do cliente é obrigatório"),
  cliente_email: z.string().email().optional().or(z.literal("")),
  cliente_telefone: z.string().optional(),
  cliente_cpf_cnpj: z.string().optional(),
  cliente_endereco: z.string().optional(),
  validade: z.string().optional(),
  status: z.string().optional(),
  subtotal: z.coerce.number().min(0),
  desconto: z.coerce.number().min(0).default(0),
  valor_total: z.coerce.number().min(0),
  observacoes: z.string().optional(),
  condicoes_pagamento: z.string().optional(),
  prazo_entrega: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.number(),
    nome: z.string(),
    preco: z.number(),
    quantidade: z.number(),
  })).min(1, "Adicione pelo menos um item"),
});

export type InsertOrcamento = z.infer<typeof insertOrcamentoSchema>;
export type Orcamento = typeof orcamentos.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduto = z.infer<typeof insertProdutoSchema>;
export type Produto = typeof produtos.$inferSelect;
export type InsertVenda = z.infer<typeof insertVendaSchema>;
export type Venda = typeof vendas.$inferSelect;
export type InsertFornecedor = z.infer<typeof insertFornecedorSchema>;
export type Fornecedor = typeof fornecedores.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertCompra = z.infer<typeof insertCompraSchema>;
export type Compra = typeof compras.$inferSelect;
export type InsertConfigFiscal = z.infer<typeof insertConfigFiscalSchema>;
export type ConfigFiscal = typeof configFiscal.$inferSelect;
export type InsertContasPagar = z.infer<typeof insertContasPagarSchema>;
export type ContasPagar = typeof contasPagar.$inferSelect;
export type InsertContasReceber = z.infer<typeof insertContasReceberSchema>;
export type ContasReceber = typeof contasReceber.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;

export function hasPermission(user: User, permission: string): boolean {
  // Admin sempre tem todas as permissões
  if (user.is_admin === 'true') return true; // Corrigido para comparar com string 'true'

  // Usuários em trial ou premium têm acesso completo
  if (isPremium(user)) return true;

  // Verifica se o usuário tem a permissão específica
  const userPermissions = user.permissoes || [];
  return userPermissions.includes(permission);
}

export function isPremium(user: User): boolean {
  if (user.plano === 'premium') return true;

  // Verifica se está em trial ativo (7 dias grátis com acesso completo)
  if (user.data_expiracao_trial) {
    const now = new Date();
    const expirationDate = new Date(user.data_expiracao_trial);
    return now < expirationDate;
  }

  return false;
}