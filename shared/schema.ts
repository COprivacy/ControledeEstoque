import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  senha: text("senha").notNull(),
  nome: text("nome").notNull(),
  plano: text("plano").notNull().default("free"),
  is_admin: text("is_admin").notNull().default("false"),
  data_criacao: text("data_criacao"),
  data_expiracao_trial: text("data_expiracao_trial"),
  data_expiracao_plano: text("data_expiracao_plano"),
  ultimo_acesso: text("ultimo_acesso"),
  status: text("status").notNull().default("ativo"),
  asaas_customer_id: text("asaas_customer_id"),
  conta_id: text("conta_id"),
  permissoes: text("permissoes"),
});

export const produtos = pgTable("produtos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
  cnpj: text("cnpj").notNull(),
  razao_social: text("razao_social").notNull(),
  focus_nfe_api_key: text("focus_nfe_api_key").notNull(),
  ambiente: text("ambiente").notNull().default("homologacao"),
  updated_at: text("updated_at").notNull(),
});

export const contasPagar = pgTable("contas_pagar", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
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
  descricao: text("descricao").notNull(),
  valor: real("valor").notNull(),
  data_vencimento: text("data_vencimento").notNull(),
  data_recebimento: text("data_recebimento"),
  categoria: text("categoria"),
  status: text("status").default("pendente"), // pendente, recebido
  data_cadastro: text("data_cadastro").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
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

export const configAsaas = pgTable("config_asaas", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  api_key: text("api_key").notNull(),
  ambiente: text("ambiente").notNull().default("sandbox"),
  webhook_url: text("webhook_url"),
  account_id: text("account_id"),
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

export const insertPlanoSchema = createInsertSchema(planos).omit({
  id: true,
  data_criacao: true,
});

export const insertConfigAsaasSchema = createInsertSchema(configAsaas).omit({
  id: true,
  updated_at: true,
});

export const insertLogAdminSchema = createInsertSchema(logsAdmin).omit({
  id: true,
});

export const insertContasPagarSchema = createInsertSchema(contasPagar).omit({
  id: true,
  data_cadastro: true,
});

export const insertContasReceberSchema = createInsertSchema(contasReceber).omit({
  id: true,
  data_cadastro: true,
});

export type InsertPlano = z.infer<typeof insertPlanoSchema>;
export type Plano = typeof planos.$inferSelect;
export type InsertConfigAsaas = z.infer<typeof insertConfigAsaasSchema>;
export type ConfigAsaas = typeof configAsaas.$inferSelect;
export type InsertLogAdmin = z.infer<typeof insertLogAdminSchema>;
export type LogAdmin = typeof logsAdmin.$inferSelect;

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