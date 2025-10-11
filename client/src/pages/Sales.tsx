import { useState } from "react";
import { Button } from "@/components/ui/button";
import SalesTable from "@/components/SalesTable";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function Sales() {
  const [, setLocation] = useLocation();
  
  const [sales] = useState([
    { id: 1, produto: "Arroz 5kg", quantidade_vendida: 2, valor_total: 51.00, data: "2025-01-10T10:30:00" },
    { id: 2, produto: "Feijão 1kg", quantidade_vendida: 5, valor_total: 44.50, data: "2025-01-10T14:15:00" },
    { id: 3, produto: "Óleo de Soja 900ml", quantidade_vendida: 3, valor_total: 22.50, data: "2025-01-09T16:45:00" },
    { id: 4, produto: "Macarrão 500g", quantidade_vendida: 10, valor_total: 45.00, data: "2025-01-09T09:20:00" },
    { id: 5, produto: "Açúcar 1kg", quantidade_vendida: 4, valor_total: 23.60, data: "2025-01-08T11:00:00" },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-sm text-muted-foreground">Histórico de todas as vendas</p>
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
