import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Package, DollarSign, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Produto, Venda } from "@shared/schema";

export default function Inventory() {
  const [viewType, setViewType] = useState<"semanal" | "mensal">("mensal");
  const { toast } = useToast();

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Produto[]>({
    queryKey: ["/api/produtos"],
  });

  const today = new Date();
  const startDate = viewType === "semanal" 
    ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  const { data: vendas = [], isLoading: loadingVendas, error: errorVendas } = useQuery<Venda[]>({
    queryKey: ["/api/vendas", { start_date: startDate, end_date: endDate }],
    queryFn: async () => {
      const response = await fetch(`/api/vendas?start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) throw new Error("Erro ao buscar vendas");
      const data = await response.json();
      return data;
    },
    retry: 2,
    staleTime: 30000,
  });

  const totalProdutos = produtos.length;
  const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
  const totalSaidas = vendas.reduce((sum, v) => sum + (v.quantidade_vendida || 0), 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    const customization = localStorage.getItem("customization");
    let storeName = "Controle de Estoque Premium";
    
    if (customization) {
      try {
        const config = JSON.parse(customization);
        storeName = config.storeName || storeName;
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      }
    }
    
    let yPosition = 20;
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(storeName, 15, yPosition);
    yPosition += 10;
    
    doc.setFontSize(16);
    doc.text(`Relatório de Inventário - ${viewType === "semanal" ? "Semanal" : "Mensal"}`, 15, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`, 15, yPosition);
    yPosition += 15;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo do Estoque:", 15, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Produtos: ${totalProdutos}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Valor Total em Estoque: R$ ${valorTotalEstoque.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Saídas no Período: ${totalSaidas} unidades`, 15, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Inventário Completo - Para Contagem:", 15, yPosition);
    yPosition += 5;
    
    const tableData = produtos.map((produto) => [
      produto.nome,
      produto.categoria,
      produto.quantidade.toString(),
      `R$ ${produto.preco.toFixed(2)}`,
      `R$ ${(produto.preco * produto.quantidade).toFixed(2)}`,
      produto.codigo_barras || 'N/A',
      '', // Coluna para contagem manual
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Categoria', 'Qtd Sistema', 'Preço Unit.', 'Valor Total', 'Cód. Barras', 'Contagem Real']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 30 },
        6: { cellWidth: 25, halign: 'center', fillColor: [240, 240, 240] },
      },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 100;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Nota: Use a coluna 'Contagem Real' para registrar a quantidade física durante o inventário.", 15, finalY + 10);
    
    doc.save(`Inventario_${viewType}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Relatório gerado!",
      description: `Relatório ${viewType} baixado com sucesso`,
    });
  };

  if (loadingProdutos || loadingVendas) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando dados do inventário...</div>
      </div>
    );
  }

  if (errorVendas) {
    toast({
      title: "Erro de conectividade",
      description: "Não foi possível carregar os dados de vendas. Tente novamente.",
      variant: "destructive",
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
            Inventário
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Visualize e gerencie o inventário do seu estoque
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={viewType === "semanal" ? "default" : "outline"}
          onClick={() => setViewType("semanal")}
          data-testid="button-view-semanal"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Visão Semanal
        </Button>
        <Button
          variant={viewType === "mensal" ? "default" : "outline"}
          onClick={() => setViewType("mensal")}
          data-testid="button-view-mensal"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Visão Mensal
        </Button>
        <Button
          variant="secondary"
          onClick={handleDownloadPDF}
          className="ml-auto"
          data-testid="button-download-pdf"
        >
          <Download className="h-4 w-4 mr-2" />
          Baixar Relatório {viewType === "semanal" ? "Semanal" : "Mensal"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-produtos-estoque" className="border-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos em Estoque
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent" data-testid="text-produtos-total">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">
              Total de itens cadastrados
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-valor-total" className="border-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total em Estoque
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent" data-testid="text-valor-total">R$ {valorTotalEstoque.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total calculado
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-produtos-baixo-estoque" className="border-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Baixo Estoque
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent" data-testid="text-baixo-estoque">
              {produtos.filter(p => p.quantidade <= p.estoque_minimo).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Necessitam reposição
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-saidas" className="border-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Saídas ({viewType === "semanal" ? "7 dias" : "mês"})
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400 rotate-180" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent" data-testid="text-saidas">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground">
              Unidades vendidas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-lista-produtos">
        <CardHeader>
          <CardTitle>Lista Completa de Produtos</CardTitle>
          <CardDescription>
            Use esta lista para conferir o inventário físico e identificar divergências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Preço Unitário</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Código de Barras</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => {
                    const isBaixoEstoque = produto.quantidade <= produto.estoque_minimo;
                    return (
                      <TableRow key={produto.id} data-testid={`row-produto-${produto.id}`}>
                        <TableCell className="font-medium">{produto.nome}</TableCell>
                        <TableCell>{produto.categoria}</TableCell>
                        <TableCell className="text-center font-semibold">{produto.quantidade}</TableCell>
                        <TableCell className="text-right">R$ {produto.preco.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {(produto.preco * produto.quantidade).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {produto.codigo_barras || 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          {isBaixoEstoque ? (
                            <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                              Baixo Estoque
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              OK
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Como usar o relatório para contagem</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Clique em "Baixar Relatório" para gerar o PDF com todos os produtos</li>
            <li>Imprima o relatório ou use um dispositivo móvel</li>
            <li>Durante a contagem física, anote a quantidade real na coluna "Contagem Real"</li>
            <li>Compare os valores da "Qtd Sistema" com sua contagem manual</li>
            <li>Corrija as divergências no sistema através da página de Produtos</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
