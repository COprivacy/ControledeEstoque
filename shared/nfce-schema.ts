import { z } from "zod";

export const nfceItemSchema = z.object({
  numero_item: z.number().positive(),
  codigo_produto: z.string().min(1),
  descricao: z.string().min(1),
  cfop: z.string().length(4),
  unidade_comercial: z.string().min(1),
  quantidade_comercial: z.number().positive(),
  valor_unitario_comercial: z.number().positive(),
  valor_bruto: z.number().positive(),
  icms_origem: z.string(),
  icms_situacao_tributaria: z.string(),
});

export const nfceSchema = z.object({
  natureza_operacao: z.string().min(1),
  tipo_documento: z.string(),
  finalidade_emissao: z.string(),
  cnpj_emitente: z.string().min(14),
  nome_destinatario: z.string().optional(),
  cpf_destinatario: z.string().optional(),
  cnpj_destinatario: z.string().optional(),
  items: z.array(nfceItemSchema).min(1),
  valor_total: z.number().positive(),
});

export type NFCeData = z.infer<typeof nfceSchema>;
export type NFCeItem = z.infer<typeof nfceItemSchema>;
