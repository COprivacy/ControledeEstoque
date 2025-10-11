import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalProdutos?: number;
  produtosBaixoEstoque?: number;
  vendasHoje?: number;
}

export default function StatsCards({ 
  totalProdutos = 0, 
  produtosBaixoEstoque = 0, 
  vendasHoje = 0 
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold" data-testid="text-total-products">{totalProdutos}</p>
        </CardContent>
      </Card>

      <Card className={produtosBaixoEstoque > 0 ? "border-destructive" : ""}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Baixo Estoque</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${produtosBaixoEstoque > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${produtosBaixoEstoque > 0 ? 'text-destructive' : ''}`} data-testid="text-low-stock-count">
            {produtosBaixoEstoque}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Vendas Hoje</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold" data-testid="text-sales-today">R$ {vendasHoje.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
