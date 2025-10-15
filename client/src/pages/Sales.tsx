import { Button } from "@/components/ui/button";
import SalesTable from "@/components/SalesTable";
import { Plus, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function Sales() {
  const [, setLocation] = useLocation();
  
  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["/api/vendas"],
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
            <p className="text-sm text-muted-foreground">Histórico de todas as vendas</p>
          </div>
          <Badge className="bg-yellow-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <Button onClick={() => setLocation("/vendas/registrar")} data-testid="button-register-sale">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Venda
        </Button>
      </div>

      <SalesTable sales={sales} />
    </div>
  );
}
