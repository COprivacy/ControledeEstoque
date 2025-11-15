
import * as XLSX from "xlsx";

export interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string }>;
  total: number;
}

export class ImportExportService {
  // Exportar com múltiplas planilhas
  static exportFullReport(data: {
    produtos: any[];
    vendas: any[];
    clientes: any[];
    fornecedores: any[];
  }) {
    const wb = XLSX.utils.book_new();

    // Planilha de Produtos
    const wsProdutos = XLSX.utils.json_to_sheet(data.produtos);
    XLSX.utils.book_append_sheet(wb, wsProdutos, "Produtos");

    // Planilha de Vendas
    const wsVendas = XLSX.utils.json_to_sheet(data.vendas);
    XLSX.utils.book_append_sheet(wb, wsVendas, "Vendas");

    // Planilha de Clientes
    const wsClientes = XLSX.utils.json_to_sheet(data.clientes);
    XLSX.utils.book_append_sheet(wb, wsClientes, "Clientes");

    // Planilha de Fornecedores
    const wsFornecedores = XLSX.utils.json_to_sheet(data.fornecedores);
    XLSX.utils.book_append_sheet(wb, wsFornecedores, "Fornecedores");

    const fileName = `SmartEstoque_Completo_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return fileName;
  }

  // Importar produtos em massa
  static async importProdutos(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const result: ImportResult = {
            success: 0,
            errors: [],
            total: jsonData.length,
          };

          jsonData.forEach((row: any, index: number) => {
            try {
              // Validar campos obrigatórios
              if (!row.nome || !row.preco || !row.quantidade) {
                result.errors.push({
                  row: index + 2, // +2 pois linha 1 é header
                  error: 'Campos obrigatórios faltando (nome, preco, quantidade)',
                });
                return;
              }

              // Validar tipos
              if (isNaN(Number(row.preco)) || isNaN(Number(row.quantidade))) {
                result.errors.push({
                  row: index + 2,
                  error: 'Preço e quantidade devem ser números',
                });
                return;
              }

              result.success++;
            } catch (error: any) {
              result.errors.push({
                row: index + 2,
                error: error.message,
              });
            }
          });

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Gerar template para importação
  static downloadTemplate(type: 'produtos' | 'clientes' | 'fornecedores') {
    const templates = {
      produtos: [
        {
          nome: 'Produto Exemplo',
          categoria: 'Categoria',
          preco: 10.50,
          quantidade: 100,
          estoque_minimo: 10,
          codigo_barras: '1234567890123',
          vencimento: '2025-12-31',
        },
      ],
      clientes: [
        {
          nome: 'Cliente Exemplo',
          cpf_cnpj: '123.456.789-00',
          telefone: '(11) 98765-4321',
          email: 'cliente@example.com',
          endereco: 'Rua Exemplo, 123',
        },
      ],
      fornecedores: [
        {
          nome: 'Fornecedor Exemplo',
          cnpj: '12.345.678/0001-90',
          telefone: '(11) 3456-7890',
          email: 'fornecedor@example.com',
          endereco: 'Av. Exemplo, 456',
        },
      ],
    };

    const ws = XLSX.utils.json_to_sheet(templates[type]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

    const fileName = `Template_${type.charAt(0).toUpperCase() + type.slice(1)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
