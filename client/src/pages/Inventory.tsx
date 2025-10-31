import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Package, DollarSign, TrendingUp, ClipboardList, RefreshCw, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Produto, Venda } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

type ContagemDivergencia = {
  produto_id: number;
  produto_nome: string;
  categoria: string;
  qtd_sistema: number;
  qtd_contada: number;
  diferenca: number;
  valor_unitario: number;
  valor_divergencia: number;
  data_contagem: string;
};

export default function Inventory() {
  const [viewType, setViewType] = useState<"semanal" | "mensal">("mensal");
  const [rotativeDialogOpen, setRotativeDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [contagemRotativa, setContagemRotativa] = useState<{[key: number]: string}>({});
  const [divergencias, setDivergencias] = useState<ContagemDivergencia[]>([]);
  const [showDivergenciasDialog, setShowDivergenciasDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await fetch(`/api/vendas?start_date=${startDate}&end_date=${endDate}`, {
        headers: {
          "x-user-id": user.id || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar vendas");
      const data = await response.json();
      return data;
    },
    retry: 2,
    staleTime: 30000,
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, quantidade }: { id: number; quantidade: number }) => {
      const produto = produtos.find(p => p.id === id);
      if (!produto) throw new Error("Produto não encontrado");

      const response = await fetch(`/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...produto, quantidade }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar produto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto atualizado!",
        description: "Quantidade ajustada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o produto",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/produtos/${id}`, undefined);
      if (!response.ok) throw new Error("Erro ao deletar produto");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({
        title: "Produto deletado!",
        description: "Produto removido do inventário com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deletar produto",
        description: error.message || "Verifique sua conexão ou permissões e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const categorias = Array.from(new Set(produtos.map(p => p.categoria)));

  const produtosFiltrados = selectedCategory === "all" 
    ? produtos 
    : produtos.filter(p => p.categoria === selectedCategory);

  const totalProdutos = produtos.length;
  const valorTotalEstoque = produtos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0);
  const totalSaidas = vendas.reduce((sum, v) => sum + (v.quantidade_vendida || 0), 0);

  // Produtos vencidos e a vencer
  const produtosVencimento = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vencidos = produtos.filter(p => {
      if (!p.vencimento) return false;
      const dataVencimento = new Date(p.vencimento);
      dataVencimento.setHours(0, 0, 0, 0);
      return dataVencimento < hoje;
    });

    const aVencer30Dias = produtos.filter(p => {
      if (!p.vencimento) return false;
      const dataVencimento = new Date(p.vencimento);
      dataVencimento.setHours(0, 0, 0, 0);
      const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes > 0 && diasRestantes <= 30;
    });

    return { vencidos, aVencer30Dias };
  }, [produtos]);

  const handleContagemRotativaChange = (produtoId: number, value: string) => {
    setContagemRotativa(prev => ({
      ...prev,
      [produtoId]: value
    }));
  };

  const handleAjustarEstoque = (produtoId: number) => {
    const novaQuantidade = parseInt(contagemRotativa[produtoId] || "0");
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
      toast({
        title: "Valor inválido",
        description: "Digite uma quantidade válida",
        variant: "destructive",
      });
      return;
    }

    const produto = produtos.find(p => p.id === produtoId);
    if (!produto) return;

    const diferenca = novaQuantidade - produto.quantidade;
    
    // Registrar divergência se houver
    if (diferenca !== 0) {
      const novaDivergencia: ContagemDivergencia = {
        produto_id: produto.id,
        produto_nome: produto.nome,
        categoria: produto.categoria,
        qtd_sistema: produto.quantidade,
        qtd_contada: novaQuantidade,
        diferenca: diferenca,
        valor_unitario: produto.preco,
        valor_divergencia: diferenca * produto.preco,
        data_contagem: new Date().toISOString(),
      };

      setDivergencias(prev => [...prev, novaDivergencia]);
    }

    updateProductMutation.mutate({ id: produtoId, quantidade: novaQuantidade });
    setContagemRotativa(prev => {
      const newState = { ...prev };
      delete newState[produtoId];
      return newState;
    });
  };

  const handleDownloadDivergenciasPDF = () => {
    if (divergencias.length === 0) {
      toast({
        title: "Nenhuma divergência registrada",
        description: "Faça contagens para gerar o relatório",
        variant: "destructive",
      });
      return;
    }

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
    doc.text("Relatório de Divergências de Inventário", 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Total de divergências: ${divergencias.length}`, 15, yPosition);
    yPosition += 10;

    // Calcular totais
    const totalPrejuizo = divergencias
      .filter(d => d.diferenca < 0)
      .reduce((sum, d) => sum + Math.abs(d.valor_divergencia), 0);
    
    const totalGanho = divergencias
      .filter(d => d.diferenca > 0)
      .reduce((sum, d) => sum + d.valor_divergencia, 0);

    const saldoFinal = totalGanho - totalPrejuizo;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro:", 15, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 38, 38); // Vermelho
    doc.text(`Perdas (produtos faltando): R$ ${totalPrejuizo.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    doc.setTextColor(34, 197, 94); // Verde
    doc.text(`Ganhos (produtos sobrando): R$ ${totalGanho.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Saldo: R$ ${saldoFinal.toFixed(2)} ${saldoFinal < 0 ? '(PREJUÍZO)' : '(SUPERÁVIT)'}`, 15, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.text("Detalhamento das Divergências:", 15, yPosition);
    yPosition += 5;

    const tableData = divergencias.map((div) => [
      div.produto_nome,
      div.categoria,
      div.qtd_sistema.toString(),
      div.qtd_contada.toString(),
      div.diferenca.toString(),
      `R$ ${div.valor_unitario.toFixed(2)}`,
      `R$ ${div.valor_divergencia.toFixed(2)}`,
      new Date(div.data_contagem).toLocaleDateString('pt-BR'),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Categoria', 'Qtd Sistema', 'Qtd Contada', 'Diferença', 'Valor Unit.', 'Valor Div.', 'Data']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center', textColor: [220, 38, 38] },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 22 },
      },
    });

    doc.save(`Relatorio_Divergencias_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Relatório gerado!",
      description: "Relatório de divergências baixado com sucesso",
    });
  };

  const handleDownloadVencimentosPDF = () => {
    if (produtosVencimento.vencidos.length === 0 && produtosVencimento.aVencer30Dias.length === 0) {
      toast({
        title: "Nenhum produto vencido ou a vencer",
        description: "Todos os produtos estão dentro do prazo de validade",
      });
      return;
    }

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
    doc.text("Relatório de Produtos Vencidos e a Vencer", 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, yPosition);
    yPosition += 15;

    // Produtos Vencidos
    if (produtosVencimento.vencidos.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠️ Produtos Vencidos (${produtosVencimento.vencidos.length})`, 15, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 5;

      const vencidosData = produtosVencimento.vencidos.map(p => {
        const diasVencidos = Math.floor((new Date().getTime() - new Date(p.vencimento!).getTime()) / (1000 * 60 * 60 * 24));
        return [
          p.nome,
          p.categoria,
          p.quantidade.toString(),
          new Date(p.vencimento!).toLocaleDateString('pt-BR'),
          `${diasVencidos} dias`,
          `R$ ${(p.preco * p.quantidade).toFixed(2)}`,
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Produto', 'Categoria', 'Quantidade', 'Vencimento', 'Vencido há', 'Valor Total']],
        body: vencidosData,
        theme: 'grid',
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: 255,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Produtos a Vencer
    if (produtosVencimento.aVencer30Dias.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(234, 179, 8);
      doc.text(`⏰ Produtos a Vencer (próximos 30 dias) - ${produtosVencimento.aVencer30Dias.length}`, 15, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 5;

      const aVencerData = produtosVencimento.aVencer30Dias.map(p => {
        const diasRestantes = Math.ceil((new Date(p.vencimento!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return [
          p.nome,
          p.categoria,
          p.quantidade.toString(),
          new Date(p.vencimento!).toLocaleDateString('pt-BR'),
          `${diasRestantes} dias`,
          `R$ ${(p.preco * p.quantidade).toFixed(2)}`,
        ];
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Produto', 'Categoria', 'Quantidade', 'Vencimento', 'Dias restantes', 'Valor Total']],
        body: aVencerData,
        theme: 'grid',
        headStyles: {
          fillColor: [234, 179, 8],
          textColor: 255,
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
      });
    }

    doc.save(`Relatorio_Vencimentos_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Relatório gerado!",
      description: "Relatório de vencimentos baixado com sucesso",
    });
  };

  const handleDownloadRotativePDF = () => {
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
    doc.text("Inventário Rotativo - Contagem Parcial", 15, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 15, yPosition);
    yPosition += 5;
    doc.text(`Categoria: ${selectedCategory === "all" ? "Todas" : selectedCategory}`, 15, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Produtos para Contagem:", 15, yPosition);
    yPosition += 5;

    const tableData = produtosFiltrados.map((produto) => [
      produto.nome,
      produto.categoria,
      produto.quantidade.toString(),
      `R$ ${produto.preco.toFixed(2)}`,
      produto.codigo_barras || 'N/A',
      '', // Coluna para contagem
      '', // Coluna para diferença
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Categoria', 'Qtd Sistema', 'Preço', 'Cód. Barras', 'Contagem', 'Diferença']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 30 },
        5: { cellWidth: 22, halign: 'center', fillColor: [240, 240, 240] },
        6: { cellWidth: 22, halign: 'center', fillColor: [255, 250, 205] },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 100;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Instruções: Conte fisicamente os produtos e anote na coluna 'Contagem'. Calcule a diferença e ajuste no sistema.", 15, finalY + 10);

    doc.save(`Inventario_Rotativo_${selectedCategory}_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Relatório gerado!",
      description: "Relatório de inventário rotativo baixado com sucesso",
    });
  };

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
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Erro ao carregar dados. Por favor, recarregue a página.</div>
      </div>
    );
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

      <Tabs defaultValue="completo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="completo" data-testid="tab-inventario-completo">
            <ClipboardList className="h-4 w-4 mr-2" />
            Inventário Completo
          </TabsTrigger>
          <TabsTrigger value="rotativo" data-testid="tab-inventario-rotativo">
            <RefreshCw className="h-4 w-4 mr-2" />
            Inventário Rotativo
          </TabsTrigger>
          <TabsTrigger value="divergencias" data-testid="tab-divergencias">
            <FileText className="h-4 w-4 mr-2" />
            Análise de Contagem
          </TabsTrigger>
          <TabsTrigger value="vencimentos" data-testid="tab-vencimentos">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Vencimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completo" className="space-y-6 mt-6">
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
            <Button
              variant="secondary"
              onClick={handleDownloadDivergenciasPDF}
              disabled={divergencias.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório de Divergências
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
                      <TableHead className="text-center">Qtd Sistema</TableHead>
                      <TableHead className="text-center">Contagem Real</TableHead>
                      <TableHead className="text-center">Diferença</TableHead>
                      <TableHead className="text-right">Preço Unitário</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Código de Barras</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-muted-foreground">
                          Nenhum produto cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtos.map((produto) => {
                        const isBaixoEstoque = produto.quantidade <= produto.estoque_minimo;
                        const contagemValue = contagemRotativa[produto.id] || "";
                        const contagem = parseInt(contagemValue) || 0;
                        const diferenca = contagem - produto.quantidade;
                        
                        return (
                          <TableRow key={produto.id} data-testid={`row-produto-${produto.id}`}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.categoria}</TableCell>
                            <TableCell className="text-center font-semibold">{produto.quantidade}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={contagemValue}
                                onChange={(e) => handleContagemRotativaChange(produto.id, e.target.value)}
                                placeholder="0"
                                className="w-20 mx-auto text-center"
                                data-testid={`input-contagem-completo-${produto.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {contagemValue && (
                                <span className={`font-semibold ${diferenca > 0 ? 'text-green-600' : diferenca < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {diferenca > 0 ? '+' : ''}{diferenca}
                                </span>
                              )}
                            </TableCell>
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
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => handleAjustarEstoque(produto.id)}
                                disabled={!contagemValue || updateProductMutation.isPending}
                                data-testid={`button-ajustar-completo-${produto.id}`}
                              >
                                Ajustar
                              </Button>
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
              <CardTitle className="text-blue-900">Como usar a contagem completa</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Digite a quantidade contada fisicamente na coluna "Contagem Real"</li>
                <li>A diferença será calculada automaticamente (verde = sobra, vermelho = falta)</li>
                <li>Clique em "Ajustar" para atualizar o estoque no sistema</li>
                <li>As divergências serão registradas automaticamente na aba "Análise de Contagem"</li>
                <li>Use "Baixar Relatório" para gerar um PDF impresso para contagem física</li>
                <li>Acesse "Relatório de Divergências" para ver o impacto financeiro das diferenças</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rotativo" className="space-y-6 mt-6">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Label htmlFor="categoria-filter">Filtrar por Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="categoria-filter" data-testid="select-categoria-rotativo">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={handleDownloadRotativePDF}
              className="mt-6"
              data-testid="button-download-rotativo-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório Rotativo
            </Button>
          </div>

          <Card className="bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                O que é Inventário Rotativo?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-800 mb-3">
                O inventário rotativo permite fazer contagens parciais periódicas, focando em categorias específicas ou grupos de produtos. 
                Isso facilita a gestão do estoque sem precisar parar as operações para um inventário completo.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                <li>Selecione uma categoria específica para contar</li>
                <li>Realize a contagem física dos produtos</li>
                <li>Digite a quantidade contada e ajuste o estoque imediatamente</li>
                <li>Repita o processo periodicamente para diferentes categorias</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-contagem-rotativa">
            <CardHeader>
              <CardTitle>
                Contagem - {selectedCategory === "all" ? "Todas as Categorias" : selectedCategory}
              </CardTitle>
              <CardDescription>
                {produtosFiltrados.length} produto(s) nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Qtd Sistema</TableHead>
                      <TableHead className="text-center">Contagem Real</TableHead>
                      <TableHead className="text-center">Diferença</TableHead>
                      <TableHead className="text-center">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum produto nesta categoria
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtosFiltrados.map((produto) => {
                        const contagemValue = contagemRotativa[produto.id] || "";
                        const contagem = parseInt(contagemValue) || 0;
                        const diferenca = contagem - produto.quantidade;

                        return (
                          <TableRow key={produto.id} data-testid={`row-rotativo-${produto.id}`}>
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.categoria}</TableCell>
                            <TableCell className="text-center font-semibold">{produto.quantidade}</TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={contagemValue}
                                onChange={(e) => handleContagemRotativaChange(produto.id, e.target.value)}
                                placeholder="0"
                                className="w-20 mx-auto text-center"
                                data-testid={`input-contagem-${produto.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              {contagemValue && (
                                <span className={`font-semibold ${diferenca > 0 ? 'text-green-600' : diferenca < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {diferenca > 0 ? '+' : ''}{diferenca}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => handleAjustarEstoque(produto.id)}
                                disabled={!contagemValue || updateProductMutation.isPending}
                                data-testid={`button-ajustar-${produto.id}`}
                              >
                                Ajustar
                              </Button>
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
        </TabsContent>

        <TabsContent value="divergencias" className="space-y-6 mt-6">
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary"
              onClick={handleDownloadDivergenciasPDF}
              disabled={divergencias.length === 0}
              data-testid="button-download-divergencias-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório de Divergências
            </Button>
            {divergencias.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setDivergencias([])}
              >
                Limpar Histórico
              </Button>
            )}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Análise de Contagem e Divergências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-3">
                Este relatório registra todas as divergências encontradas entre o estoque no sistema e as contagens físicas realizadas.
                Use-o para identificar perdas, ganhos e calcular prejuízos.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>Diferenças negativas indicam produtos faltando (possível prejuízo)</li>
                <li>Diferenças positivas indicam produtos sobrando</li>
                <li>O relatório calcula automaticamente o impacto financeiro</li>
                <li>Todas as contagens são registradas com data e hora</li>
              </ul>
            </CardContent>
          </Card>

          {divergencias.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma divergência registrada ainda. Faça contagens no Inventário Rotativo para ver os resultados aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-red-900">
                      Prejuízo Total (Faltando)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      R$ {divergencias
                        .filter(d => d.diferenca < 0)
                        .reduce((sum, d) => sum + Math.abs(d.valor_divergencia), 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-green-900">
                      Ganho Total (Sobrando)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {divergencias
                        .filter(d => d.diferenca > 0)
                        .reduce((sum, d) => sum + d.valor_divergencia, 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">
                      Saldo Final
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      divergencias.reduce((sum, d) => sum + d.valor_divergencia, 0) < 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      R$ {divergencias
                        .reduce((sum, d) => sum + d.valor_divergencia, 0)
                        .toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Divergências</CardTitle>
                  <CardDescription>
                    {divergencias.length} divergência(s) registrada(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead className="text-center">Qtd Sistema</TableHead>
                          <TableHead className="text-center">Qtd Contada</TableHead>
                          <TableHead className="text-center">Diferença</TableHead>
                          <TableHead className="text-right">Valor Unit.</TableHead>
                          <TableHead className="text-right">Impacto Financeiro</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {divergencias.map((div, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{div.produto_nome}</TableCell>
                            <TableCell>{div.categoria}</TableCell>
                            <TableCell className="text-center">{div.qtd_sistema}</TableCell>
                            <TableCell className="text-center">{div.qtd_contada}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={div.diferenca < 0 ? "destructive" : "default"}>
                                {div.diferenca > 0 ? '+' : ''}{div.diferenca}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">R$ {div.valor_unitario.toFixed(2)}</TableCell>
                            <TableCell className={`text-right font-semibold ${
                              div.diferenca < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {div.diferenca > 0 ? '+' : ''}R$ {div.valor_divergencia.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(div.data_contagem).toLocaleDateString('pt-BR')} {new Date(div.data_contagem).toLocaleTimeString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="vencimentos" className="space-y-6 mt-6">
          <div className="flex gap-2 items-center">
            <Button
              variant="secondary"
              onClick={handleDownloadVencimentosPDF}
              disabled={produtosVencimento.vencidos.length === 0 && produtosVencimento.aVencer30Dias.length === 0}
              data-testid="button-download-vencimentos-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório de Vencimentos
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Produtos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {produtosVencimento.vencidos.length}
                </div>
                <p className="text-xs text-red-700 mt-1">
                  Valor: R$ {produtosVencimento.vencidos.reduce((sum, p) => sum + (p.preco * p.quantidade), 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  A Vencer (30 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {produtosVencimento.aVencer30Dias.length}
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Valor: R$ {produtosVencimento.aVencer30Dias.reduce((sum, p) => sum + (p.preco * p.quantidade), 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-900">
                  Produtos OK
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {produtos.length - produtosVencimento.vencidos.length - produtosVencimento.aVencer30Dias.length}
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Dentro do prazo
                </p>
              </CardContent>
            </Card>
          </div>

          {produtosVencimento.vencidos.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Produtos Vencidos - AÇÃO IMEDIATA NECESSÁRIA
                </CardTitle>
                <CardDescription className="text-red-700">
                  Estes produtos já passaram da data de validade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-red-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead>Data Vencimento</TableHead>
                        <TableHead>Vencido há</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosVencimento.vencidos.map((produto) => {
                        const diasVencidos = Math.floor((new Date().getTime() - new Date(produto.vencimento!).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={produto.id} className="bg-red-50">
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.categoria}</TableCell>
                            <TableCell className="text-center">{produto.quantidade}</TableCell>
                            <TableCell>{new Date(produto.vencimento!).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                {diasVencidos} dias
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-red-600">
                              R$ {(produto.preco * produto.quantidade).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {produtosVencimento.aVencer30Dias.length > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Produtos a Vencer (próximos 30 dias)
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  Priorize a venda destes produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-yellow-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                        <TableHead>Data Vencimento</TableHead>
                        <TableHead>Dias Restantes</TableHead>
                        <TableHead className="text-right">Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosVencimento.aVencer30Dias.map((produto) => {
                        const diasRestantes = Math.ceil((new Date(produto.vencimento!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <TableRow key={produto.id} className="bg-yellow-50">
                            <TableCell className="font-medium">{produto.nome}</TableCell>
                            <TableCell>{produto.categoria}</TableCell>
                            <TableCell className="text-center">{produto.quantidade}</TableCell>
                            <TableCell>{new Date(produto.vencimento!).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>
                              <Badge variant={diasRestantes <= 7 ? "destructive" : "default"} className="bg-yellow-500">
                                {diasRestantes} dias
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-yellow-600">
                              R$ {(produto.preco * produto.quantidade).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {produtosVencimento.vencidos.length === 0 && produtosVencimento.aVencer30Dias.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  Parabéns! Nenhum produto vencido ou próximo do vencimento
                </h3>
                <p className="text-muted-foreground">
                  Todos os produtos estão dentro do prazo de validade.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}