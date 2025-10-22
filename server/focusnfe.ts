import type { ConfigFiscal } from "@shared/schema";

export interface NFEItem {
  numero_item: number;
  codigo_produto: string;
  descricao: string;
  cfop: string;
  unidade_comercial: string;
  quantidade_comercial: number;
  valor_unitario_comercial: number;
  valor_bruto: number;
  icms_origem: string;
  icms_situacao_tributaria: string;
}

export interface NFEData {
  natureza_operacao: string;
  tipo_documento: string;
  finalidade_emissao: string;
  cnpj_emitente: string;
  nome_destinatario?: string;
  cpf_destinatario?: string;
  cnpj_destinatario?: string;
  telefone_destinatario?: string;
  logradouro_destinatario?: string;
  numero_destinatario?: string;
  bairro_destinatario?: string;
  municipio_destinatario?: string;
  uf_destinatario?: string;
  cep_destinatario?: string;
  items: NFEItem[];
  valor_total: number;
}

export class FocusNFeService {
  private baseUrl: string;
  private apiToken: string;
  private ambiente: string;

  constructor(config: ConfigFiscal) {
    this.ambiente = config.ambiente;
    this.baseUrl = config.ambiente === "producao" 
      ? "https://api.focusnfe.com.br/v2" 
      : "https://homologacao.focusnfe.com.br/v2";
    this.apiToken = config.focus_nfe_api_key;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.apiToken + ":").toString("base64")}`;
  }

  async emitirNFCe(data: NFEData): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/nfce`, {
        method: "POST",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.mensagem || 
          result.erros?.[0]?.mensagem || 
          "Erro ao emitir NFCe"
        );
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao emitir NFCe:", error);
      throw new Error(error.message || "Erro ao comunicar com Focus NFe");
    }
  }

  async consultarNFCe(ref: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/nfce/${ref}`, {
        method: "GET",
        headers: {
          "Authorization": this.getAuthHeader(),
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.mensagem || "Erro ao consultar NFCe");
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao consultar NFCe:", error);
      throw new Error(error.message || "Erro ao comunicar com Focus NFe");
    }
  }

  async cancelarNFCe(ref: string, justificativa: string): Promise<any> {
    if (!justificativa || justificativa.length < 15) {
      throw new Error("Justificativa deve ter no mínimo 15 caracteres");
    }

    try {
      const response = await fetch(`${this.baseUrl}/nfce/${ref}`, {
        method: "DELETE",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ justificativa }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.mensagem || "Erro ao cancelar NFCe");
      }

      return result;
    } catch (error: any) {
      console.error("Erro ao cancelar NFCe:", error);
      throw new Error(error.message || "Erro ao comunicar com Focus NFe");
    }
  }
}
