import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PDVScanner from "@/components/PDVScanner";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Crown, FileText, Loader2, ExternalLink, Copy, CheckCircle, Receipt, Printer } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigFiscal } from "@shared/schema";

export default function PDV() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showNFDialog, setShowNFDialog] = useState(false);
  const [showManualNFDialog, setShowManualNFDialog] = useState(false);
  const [showCupomNaoFiscal, setShowCupomNaoFiscal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const [isEmittingNF, setIsEmittingNF] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: configFiscal } = useQuery<ConfigFiscal | null>({
    queryKey: ["/api/config-fiscal"],
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "✅ Copiado!",
      description: `${fieldName} copiado para a área de transferência`,
    });
  };

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
        body: JSON.stringify({
          ...sale,
          forma_pagamento: sale.forma_pagamento || 'dinheiro'
        })
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
      console.log("Itens da venda:", result.itens || sale.itens);

      // Sempre perguntar sobre emissão de NFCe
      // Usar os itens retornados pelo backend que têm a estrutura correta
      setLastSale({ 
        ...sale, 
        vendaId: result.id,
        itens: result.itens || sale.itens 
      });
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

  // Função para lidar com as opções de emissão de NF
  const handleEmissaoNF = (opcao: 'nao' | 'cupom' | 'manual' | 'automatica') => {
    setShowNFDialog(false);
    switch (opcao) {
      case 'nao':
        // Não faz nada, apenas fecha o diálogo
        break;
      case 'cupom':
        setShowCupomNaoFiscal(true);
        break;
      case 'manual':
        setShowManualNFDialog(true);
        break;
      case 'automatica':
        if (lastSale) {
          emitirNFCe(lastSale);
        }
        break;
      default:
        break;
    }
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
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <span>Emitir Nota Fiscal?</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Venda registrada com sucesso!
                </span>
              </div>
            </AlertDialogTitle>
            
            {!configFiscal || !configFiscal.focus_nfe_api_key ? (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3">
                <p className="text-sm text-red-600 dark:text-red-500 font-medium flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Configure a emissão fiscal em "Config. Fiscal" primeiro
                </p>
              </div>
            ) : configFiscal?.ambiente === 'homologacao' ? (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-500 font-medium flex items-center gap-2">
                  <span className="text-lg">ℹ️</span>
                  Ambiente de Homologação - Nota para testes
                </p>
              </div>
            ) : null}
          </AlertDialogHeader>
          
          <div className="grid gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => handleEmissaoNF('nao')}
              className="w-full justify-start h-auto py-4 px-5 hover:bg-muted/50 transition-all group"
              disabled={isEmittingNF}
              data-testid="button-cancel-nf"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-500 mr-4 group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-semibold text-base">Não, apenas venda</span>
                <span className="text-xs text-muted-foreground font-normal">Registrar venda sem emitir documento fiscal</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleEmissaoNF('cupom')}
              className="w-full justify-start h-auto py-4 px-5 hover:bg-muted/50 transition-all group"
              disabled={isEmittingNF}
              data-testid="button-cupom-nao-fiscal"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-500 mr-4 group-hover:scale-110 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-semibold text-base">Cupom Não-Fiscal</span>
                <span className="text-xs text-muted-foreground font-normal">Gerar comprovante sem valor fiscal</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleEmissaoNF('manual')}
              className="w-full justify-start h-auto py-4 px-5 hover:bg-muted/50 transition-all group"
              disabled={isEmittingNF}
              data-testid="button-manual-nf"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-500 mr-4 group-hover:scale-110 transition-transform">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start gap-0.5 text-left">
                <span className="font-semibold text-base">Emissão Manual (Sefaz)</span>
                <span className="text-xs text-muted-foreground font-normal">Abrir dados para emitir no portal da Secretaria da Fazenda</span>
              </div>
            </Button>
            
            <Button
              onClick={() => handleEmissaoNF('automatica')}
              className="w-full justify-start h-auto py-4 px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all group shadow-lg hover:shadow-xl"
              disabled={isEmittingNF}
              data-testid="button-emit-nf"
            >
              {isEmittingNF ? (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 mr-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="font-semibold text-base">Emitindo...</span>
                    <span className="text-xs opacity-90 font-normal">Aguarde o processamento</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 mr-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="font-semibold text-base">Emissão Automática</span>
                    <span className="text-xs opacity-90 font-normal">Emitir NFCe automaticamente via Focus NFe</span>
                  </div>
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showManualNFDialog} onOpenChange={setShowManualNFDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ExternalLink className="h-6 w-6 text-primary" />
              Emissão Manual de Nota Fiscal Avulsa - Sefaz
            </DialogTitle>
            <DialogDescription>
              Dados da venda para emissão manual no portal da Secretaria da Fazenda
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
                <CardTitle className="text-base">📋 Passo 1: Acesse o Portal da Sefaz</CardTitle>
                <CardDescription>
                  Entre no site da Secretaria da Fazenda do seu estado
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <p className="text-sm">Exemplos de portais por estado:</p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• MA: <a href="https://www.sefaz.ma.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">sefaz.ma.gov.br</a></li>
                    <li>• SP: <a href="https://www.fazenda.sp.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fazenda.sp.gov.br</a></li>
                    <li>• MG: <a href="https://www.fazenda.mg.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fazenda.mg.gov.br</a></li>
                    <li>• RJ: <a href="https://www.fazenda.rj.gov.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fazenda.rj.gov.br</a></li>
                    <li>• Outros estados: Busque "Sefaz [seu estado] nota fiscal avulsa"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-green-50 dark:bg-green-950/20">
                <CardTitle className="text-base">📝 Passo 2: Dados para Preenchimento</CardTitle>
                <CardDescription>
                  Copie os dados abaixo e preencha no formulário da Sefaz
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {lastSale && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold">Valor Total da Nota</Label>
                        <div className="flex gap-2">
                          <Input
                            value={`R$ ${lastSale.valorTotal.toFixed(2)}`}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(lastSale.valorTotal.toFixed(2), "Valor Total")}
                          >
                            {copiedField === "Valor Total" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {configFiscal?.cnpj && (
                        <div className="space-y-2">
                          <Label className="font-semibold">CNPJ Emitente</Label>
                          <div className="flex gap-2">
                            <Input
                              value={configFiscal.cnpj}
                              readOnly
                              className="font-mono"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(configFiscal.cnpj!, "CNPJ")}
                            >
                              {copiedField === "CNPJ" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {configFiscal?.razao_social && (
                        <div className="space-y-2">
                          <Label className="font-semibold">Razão Social</Label>
                          <div className="flex gap-2">
                            <Input
                              value={configFiscal.razao_social}
                              readOnly
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(configFiscal.razao_social!, "Razão Social")}
                            >
                              {copiedField === "Razão Social" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="font-semibold">Data da Venda</Label>
                        <div className="flex gap-2">
                          <Input
                            value={new Date().toLocaleDateString('pt-BR')}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => copyToClipboard(new Date().toLocaleDateString('pt-BR'), "Data")}
                          >
                            {copiedField === "Data" ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-semibold">Produtos/Serviços - Informações Detalhadas</Label>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 grid grid-cols-12 gap-2 p-2 text-xs font-semibold border-b">
                          <div className="col-span-1">#</div>
                          <div className="col-span-1">Cód.</div>
                          <div className="col-span-4">Produto</div>
                          <div className="col-span-2 text-center">Qtd</div>
                          <div className="col-span-2 text-right">Vl. Unit.</div>
                          <div className="col-span-2 text-right">Subtotal</div>
                        </div>
                        {lastSale.itens.map((item: any, index: number) => {
                          // Debug: verificar estrutura do item
                          console.log('Item da venda:', item);

                          // Buscar valores corretos considerando diferentes estruturas
                          const preco_unit = Number(item.preco_unitario || item.preco || 0);
                          const qtd = Number(item.quantidade || 1);
                          const subtotal = Number(item.subtotal || (preco_unit * qtd) || 0);
                          const codigo = item.codigo_barras || item.codigo || `PROD${index + 1}`;
                          const nome_produto = item.nome || item.produto || 'Produto sem nome';

                          return (
                            <div key={index} className="grid grid-cols-12 gap-2 p-2 text-sm border-b last:border-b-0 hover:bg-muted/30">
                              <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                              <div className="col-span-1 text-xs font-mono">{codigo.substring(0, 8)}</div>
                              <div className="col-span-4 font-medium">{nome_produto}</div>
                              <div className="col-span-2 text-center">{qtd}</div>
                              <div className="col-span-2 text-right">R$ {preco_unit.toFixed(2)}</div>
                              <div className="col-span-2 text-right font-semibold">R$ {subtotal.toFixed(2)}</div>
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const texto = lastSale.itens
                            .map((item: any, index: number) => {
                              console.log('Gerando texto para item:', item);
                              const preco_unit = Number(item.preco_unitario || item.preco || 0);
                              const qtd = Number(item.quantidade || 1);
                              const subtotal = Number(item.subtotal || (preco_unit * qtd) || 0);
                              const codigo = item.codigo_barras || item.codigo || `PROD${index + 1}`;
                              const nome_produto = item.nome || item.produto || 'Produto sem nome';
                              return `${index + 1}. Código: ${codigo}\n   Produto: ${nome_produto}\n   Quantidade: ${qtd}\n   Valor Unitário: R$ ${preco_unit.toFixed(2)}\n   Subtotal: R$ ${subtotal.toFixed(2)}`;
                            })
                            .join('\n\n');
                          const textoCompleto = `=== ITENS DA NOTA FISCAL ===\n\n${texto}\n\n=== TOTAL DA NOTA ===\nR$ ${lastSale.valorTotal.toFixed(2)}`;
                          copyToClipboard(textoCompleto, "Lista Detalhada de Produtos");
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Lista Detalhada
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-purple-50 dark:bg-purple-950/20">
                <CardTitle className="text-base">✅ Passo 3: Após a Emissão</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="text-sm space-y-2">
                  <li>• Faça o download do XML e PDF da nota emitida</li>
                  <li>• Envie o XML/PDF para o cliente por e-mail</li>
                  <li>• Guarde uma cópia para seus registros fiscais</li>
                  <li>• A nota fica registrada automaticamente no portal da Sefaz</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowManualNFDialog(false)}
              >
                Fechar
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowManualNFDialog(false);
                  toast({
                    title: "✅ Dados prontos!",
                    description: "Acesse o portal da Sefaz e preencha com os dados copiados",
                  });
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Entendi, vou emitir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCupomNaoFiscal} onOpenChange={setShowCupomNaoFiscal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Cupom Não-Fiscal
            </DialogTitle>
            <DialogDescription>
              Comprovante de venda sem valor fiscal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {lastSale && (
              <>
                <div className="bg-white dark:bg-gray-900 p-6 rounded border-2 border-dashed border-gray-300 dark:border-gray-700 font-mono text-sm">
                  <div className="text-center border-b-2 border-dashed border-gray-300 dark:border-gray-700 pb-3 mb-3">
                    <p className="font-bold text-base">CUPOM NÃO-FISCAL</p>
                    {configFiscal?.razao_social && (
                      <p className="text-xs mt-2">{configFiscal.razao_social}</p>
                    )}
                    {configFiscal?.cnpj && (
                      <p className="text-xs">CNPJ: {configFiscal.cnpj}</p>
                    )}
                    <p className="text-xs mt-2">{new Date().toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="font-bold border-b border-gray-300 dark:border-gray-700 pb-1">ITENS:</p>
                    {lastSale.itens.map((item: any, index: number) => {
                      const preco_unit = Number(item.preco_unitario || item.preco || 0);
                      const qtd = Number(item.quantidade || 1);
                      const subtotal = Number(item.subtotal || (preco_unit * qtd) || 0);
                      const nome_produto = item.nome || item.produto || 'Produto';

                      return (
                        <div key={index} className="space-y-0.5">
                          <p className="truncate">{index + 1}. {nome_produto}</p>
                          <p className="text-xs pl-3">
                            {qtd} x R$ {preco_unit.toFixed(2)} = R$ {subtotal.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>SUBTOTAL:</span>
                      <span>R$ {lastSale.valorTotal.toFixed(2)}</span>
                    </div>
                    {lastSale.desconto > 0 && (
                      <div className="flex justify-between text-xs">
                        <span>Desconto:</span>
                        <span>- R$ {lastSale.desconto.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base border-t border-gray-300 dark:border-gray-700 pt-1 mt-1">
                      <span>TOTAL:</span>
                      <span>R$ {lastSale.valorTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center border-t-2 border-dashed border-gray-300 dark:border-gray-700 mt-3 pt-3 text-xs">
                    <p className="font-bold">⚠️ DOCUMENTO SEM VALOR FISCAL</p>
                    <p className="mt-1">Este cupom não substitui nota fiscal</p>
                    <p className="mt-2">Obrigado pela preferência!</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const cupomTexto = `
═══════════════════════════════════
    CUPOM NÃO-FISCAL
${configFiscal?.razao_social || 'Estabelecimento'}
${configFiscal?.cnpj ? `CNPJ: ${configFiscal.cnpj}` : ''}
${new Date().toLocaleString('pt-BR')}
═══════════════════════════════════

ITENS:
${lastSale.itens.map((item: any, index: number) => {
  const preco_unit = Number(item.preco_unitario || item.preco || 0);
  const qtd = Number(item.quantidade || 1);
  const subtotal = Number(item.subtotal || (preco_unit * qtd) || 0);
  const nome_produto = item.nome || item.produto || 'Produto';
  return `${index + 1}. ${nome_produto}\n   ${qtd} x R$ ${preco_unit.toFixed(2)} = R$ ${subtotal.toFixed(2)}`;
}).join('\n\n')}

───────────────────────────────────
TOTAL: R$ ${lastSale.valorTotal.toFixed(2)}
═══════════════════════════════════

⚠️ DOCUMENTO SEM VALOR FISCAL
Este cupom não substitui nota fiscal

Obrigado pela preferência!
═══════════════════════════════════
                      `.trim();

                      copyToClipboard(cupomTexto, "Cupom Não-Fiscal");
                    }}
                    data-testid="button-copiar-cupom"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      window.print();
                      toast({
                        title: "Imprimir Cupom",
                        description: "Abrindo diálogo de impressão...",
                      });
                    }}
                    data-testid="button-imprimir-cupom"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setShowCupomNaoFiscal(false);
                      toast({
                        title: "✅ Cupom gerado!",
                        description: "Cupom não-fiscal disponível",
                      });
                    }}
                    data-testid="button-fechar-cupom"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    OK
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}