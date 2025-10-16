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
      <Card className="relative overflow-hidden border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background transition-all hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Produtos</CardTitle>
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300" data-testid="text-total-products">{totalProdutos}</p>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Itens cadastrados</p>
        </CardContent>
      </Card>

      <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${
        produtosBaixoEstoque > 0 
          ? "border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-background" 
          : "border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-background"
      }`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${
            produtosBaixoEstoque > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
          }`}>
            Baixo Estoque
          </CardTitle>
          <div className={`p-2 rounded-full ${
            produtosBaixoEstoque > 0 
              ? 'bg-orange-100 dark:bg-orange-900' 
              : 'bg-green-100 dark:bg-green-900'
          }`}>
            <AlertTriangle className={`h-4 w-4 ${
              produtosBaixoEstoque > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
            }`} />
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-bold ${
            produtosBaixoEstoque > 0 ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'
          }`} data-testid="text-low-stock-count">
            {produtosBaixoEstoque}
          </p>
          <p className={`text-xs mt-1 ${
            produtosBaixoEstoque > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-green-500 dark:text-green-400'
          }`}>
            {produtosBaixoEstoque > 0 ? 'Produtos em alerta' : 'Estoque normal'}
          </p>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-background transition-all hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Vendas Hoje</CardTitle>
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300" data-testid="text-sales-today">
            R$ {vendasHoje.toFixed(2)}
          </p>
          <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Faturamento do dia</p>
        </CardContent>
      </Card>
    </div>
  );
}