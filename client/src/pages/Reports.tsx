import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ReportsCard from "@/components/ReportsCard";
import SalesTable from "@/components/SalesTable";
import ExpiringProductsReport from "@/components/ExpiringProductsReport";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateTime } from "@/lib/dateUtils";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Buscar configurações personalizadas
    const customization = localStorage.getItem("customization");
    let storeName = "Controle de Estoque Simples";
    let storeLogo = "";
    
    if (customization) {
      try {
        const config = JSON.parse(customization);
        storeName = config.storeName || storeName;
        storeLogo = config.logo || "";
      } catch (e) {
        console.error("Erro ao carregar configurações:", e);
      }
    }
    
    // Cabeçalho com logo (se disponível)
    let yPosition = 20;
    
    if (storeLogo) {
      try {
        doc.addImage(storeLogo, "PNG", 15, yPosition, 30, 30);
        yPosition += 35;
      } catch (e) {
        console.error("Erro ao adicionar logo:", e);
      }
    }
    
    // Nome da empresa
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(storeName, storeLogo ? 50 : 15, storeLogo ? 35 : yPosition);
    yPosition = storeLogo ? 55 : yPosition + 10;
    
    // Título do relatório
    doc.setFontSize(16);
    doc.text("Relatório de Vendas", 15, yPosition);
    yPosition += 10;
    
    // Data de geração
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${formatDateTime(new Date().toISOString())}`, 15, yPosition);
    yPosition += 15;
    
    // Resumo
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo:", 15, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Vendas Hoje: R$ ${dailyTotal.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Vendas da Semana: R$ ${weeklyTotal.toFixed(2)}`, 15, yPosition);
    yPosition += 6;
    doc.text(`Total de Vendas: ${vendas.length}`, 15, yPosition);
    yPosition += 10;
    
    // Tabela de vendas
    const tableData = vendas.map((venda: any) => {
      let formaPagamento = 'Dinheiro';
      if (venda.forma_pagamento === 'cartao_credito') formaPagamento = 'Cartão Crédito';
      else if (venda.forma_pagamento === 'cartao_debito') formaPagamento = 'Cartão Débito';
      else if (venda.forma_pagamento === 'pix') formaPagamento = 'PIX';
      
      return [
        venda.produto || 'N/A',
        venda.quantidade_vendida || 0,
        `R$ ${(venda.valor_total || 0).toFixed(2)}`,
        formaPagamento,
        venda.data ? formatDateTime(venda.data) : 'N/A'
      ];
    });
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Produto', 'Quantidade', 'Valor Total', 'Pagamento', 'Data']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }
      }
    });
    
    // Total geral
    const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const totalGeral = vendas.reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);
    doc.text(`Total Geral: R$ ${totalGeral.toFixed(2)}`, 15, finalY + 10);
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Salvar PDF
    const dataAtual = new Date().toISOString().split('T')[0];
    doc.save(`relatorio-vendas-${dataAtual}.pdf`);
    
    toast({
      title: "Relatório exportado!",
      description: "O PDF foi baixado com sucesso",
    });
  };

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas", startDate, endDate],
    queryFn: async () => {
      let url = "/api/vendas";
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar vendas");
      return response.json();
    },
  });

  const { data: expiringProducts = [] } = useQuery({
    queryKey: ["/api/reports/expiring"],
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/vendas", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erro ao limpar histórico");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendas"] });
      toast({
        title: "Histórico limpo!",
        description: "Todas as vendas foram removidas do histórico",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o histórico",
        variant: "destructive",
      });
    },
  });

  const handleClearHistory = () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico de vendas? Esta ação não pode ser desfeita.")) {
      clearHistoryMutation.mutate();
    }
  };

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Se há filtro ativo, mostrar apenas o total do período filtrado
  const dailyTotal = (startDate && endDate) 
    ? 0 // Não mostrar total diário quando há filtro customizado
    : vendas
        .filter((v: any) => {
          if (!v.data) return false;
          const vendaDate = new Date(v.data).toISOString().split('T')[0];
          return vendaDate === today;
        })
        .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  const weeklyTotal = (startDate && endDate)
    ? 0 // Não mostrar total semanal quando há filtro customizado
    : vendas
        .filter((v: any) => {
          if (!v.data) return false;
          const vendaDate = new Date(v.data).toISOString().split('T')[0];
          return vendaDate >= weekAgo && vendaDate <= today;
        })
        .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  const monthlyTotal = (startDate && endDate)
    ? vendas.reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0) // Mostrar total do período filtrado
    : vendas
        .filter((v: any) => {
          if (!v.data) return false;
          const vendaDate = new Date(v.data).toISOString().split('T')[0];
          return vendaDate >= monthAgo && vendaDate <= today;
        })
        .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  const handleFilter = (filterStartDate: string, filterEndDate: string) => {
    setStartDate(filterStartDate);
    setEndDate(filterEndDate);
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-700">
            Relatórios
          </h1>
          <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">
            Análise de vendas e desempenho em tempo real
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-in zoom-in duration-500">
          <Crown className="h-3 w-3 mr-1 animate-pulse" />
          Premium
        </Badge>
      </div>

      <div className="relative animate-in slide-in-from-right duration-700">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPDF}
          className="absolute -top-2 right-0 z-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 hover:from-green-600 hover:to-emerald-700 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        
        <div className="backdrop-blur-sm bg-card/80 rounded-lg border-2 border-primary/10 shadow-xl hover:shadow-2xl transition-all duration-500">
          <ReportsCard
            dailyTotal={dailyTotal}
            weeklyTotal={weeklyTotal}
            monthlyTotal={monthlyTotal}
            onFilter={handleFilter}
            onClearFilter={handleClearFilter}
          />
        </div>
      </div>

      <ExpiringProductsReport products={expiringProducts} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Vendas</h2>
        {vendas.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleClearHistory}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Histórico
          </Button>
        )}
      </div>

      <SalesTable sales={vendas} />
    </div>
  );
}