import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PDVScanner from "@/components/PDVScanner";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Crown, FileText, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ConfigFiscal } from "@shared/schema";

export default function PDV() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showNFDialog, setShowNFDialog] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isEmittingNF, setIsEmittingNF] = useState(false);

  const { data: configFiscal } = useQuery<ConfigFiscal | null>({
    queryKey: ["/api/config-fiscal"],
  });

  const fetchProduct = async (barcode: string) => {
    try {
      const response = await fetch(`/api/produtos/codigo/${barcode}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  const emitirNFCe = async (sale: any) => {
    // Verificar se há configuração fiscal
    if (!configFiscal || !configFiscal.focus_nfe_api_key) {
      toast({
        variant: "destructive",
        title: "❌ Configuração Fiscal não encontrada",
        description: "Configure em Config. Fiscal para emitir notas fiscais.",
      });
      setShowNFDialog(false);
      return;
    }

    setIsEmittingNF(true);
    try {
      // Buscar dados completos dos produtos
      const produtos = await Promise.all(
        sale.itens.map(async (item: any) => {
          const barcode = item.codigo_barras || item.nome;
          const response = await fetch(`/api/produtos/codigo/${barcode}`);
          return response.ok ? await response.json() : null;
        })
      );

      // Validar se todos os produtos foram encontrados
      const produtosNaoEncontrados = produtos.filter(p => !p);
      if (produtosNaoEncontrados.length > 0) {
        throw new Error("Alguns produtos não foram encontrados no sistema");
      }

      const nfceData = {
        natureza_operacao: "Venda de mercadoria",
        tipo_documento: "1",
        finalidade_emissao: "1",
        cnpj_emitente: configFiscal?.cnpj?.replace(/\D/g, ''),
        nome_destinatario: "CONSUMIDOR",
        items: sale.itens.map((item: any, index: number) => {
          const produto = produtos[index];
          const subtotal = item.subtotal || (produto.preco * item.quantidade);
          return {
            numero_item: index + 1,
            codigo_produto: produto.codigo_barras || produto.id.toString(),
            descricao: produto.nome,
            cfop: "5102",
            unidade_comercial: "UN",
            quantidade_comercial: item.quantidade,
            valor_unitario_comercial: produto.preco,
            valor_bruto: subtotal,
            icms_origem: "0",
            icms_situacao_tributaria: "102",
          };
        }),
        valor_total: sale.valorTotal,
      };

      const response = await fetch("/api/nfce/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nfceData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao emitir NFCe");
      }

      const result = await response.json();
      
      toast({
        title: "✅ Nota Fiscal emitida com sucesso!",
        description: configFiscal?.ambiente === 'homologacao' 
          ? '(Ambiente de Homologação - Nota de teste)' 
          : 'NFCe válida fiscalmente',
      });

      console.log("NFCe emitida:", result);
    } catch (error: any) {
      console.error("Erro ao emitir NFCe:", error);
      toast({
        variant: "destructive",
        title: "❌ Erro ao emitir NFCe",
        description: error.message || "Verifique a configuração fiscal e tente novamente.",
      });
    } finally {
      setIsEmittingNF(false);
      setShowNFDialog(false);
    }
  };

  const handleSaleComplete = async (sale: any) => {
    try {
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao registrar venda');
      }

      const result = await response.json();
      
      toast({
        title: "Venda registrada com sucesso!",
        description: `Total: R$ ${sale.valorTotal.toFixed(2)}`,
      });

      console.log("Venda registrada:", result);

      // Sempre perguntar sobre emissão de NFCe
      setLastSale({ ...sale, vendaId: result.id });
      setShowNFDialog(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar venda",
        description: error.message,
      });
    }
  };

  const handleProductNotFound = (barcode: string) => {
    toast({
      variant: "destructive",
      title: "Produto não encontrado",
      description: `Código de barras: ${barcode}`,
    });
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
              PDV - Ponto de Venda
            </h1>
            <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">
              Escaneie os produtos para adicionar ao carrinho
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-in zoom-in duration-500">
            <Crown className="h-3 w-3 mr-1 animate-pulse" />
            Premium
          </Badge>
        </div>

        <div className="backdrop-blur-sm bg-card/80 rounded-lg border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500 p-6 animate-in slide-in-from-bottom duration-700">
          <PDVScanner
            onSaleComplete={handleSaleComplete}
            onProductNotFound={handleProductNotFound}
            onFetchProduct={fetchProduct}
          />
        </div>
      </div>

      <AlertDialog open={showNFDialog} onOpenChange={setShowNFDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Emitir Nota Fiscal?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Venda registrada com sucesso!</p>
              <p className="font-medium">
                Deseja emitir uma Nota Fiscal (NFCe) para esta venda?
              </p>
              {!configFiscal || !configFiscal.focus_nfe_api_key ? (
                <p className="text-sm text-red-600 dark:text-red-500 font-medium">
                  ⚠️ Configure a emissão fiscal em "Config. Fiscal" primeiro
                </p>
              ) : configFiscal?.ambiente === 'homologacao' ? (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Ambiente de Homologação - Nota para testes
                </p>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isEmittingNF} data-testid="button-cancel-nf">
              Não, apenas venda
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => lastSale && emitirNFCe(lastSale)}
              disabled={isEmittingNF}
              data-testid="button-emit-nf"
            >
              {isEmittingNF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Emitindo...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Sim, emitir NF
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
