import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ReportsCard from "@/components/ReportsCard";
import SalesTable from "@/components/SalesTable";
import ExpiringProductsReport from "@/components/ExpiringProductsReport";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
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

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const dailyTotal = vendas
    .filter((v: any) => v.data?.startsWith(today))
    .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  const weeklyTotal = vendas
    .filter((v: any) => v.data >= weekAgo)
    .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  const handleFilter = async (startDate: string, endDate: string) => {
    queryClient.invalidateQueries({ queryKey: ["/api/vendas"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise de vendas e desempenho</p>
      </div>

      <ReportsCard
        dailyTotal={dailyTotal}
        weeklyTotal={weeklyTotal}
        onFilter={handleFilter}
      />

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