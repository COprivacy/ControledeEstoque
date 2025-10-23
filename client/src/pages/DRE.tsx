import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function DRE() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">DRE Simplificado</h1>
        <p className="text-muted-foreground mt-1">Demonstração do Resultado do Exercício</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-receita-total">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-despesas-totais">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="text-resultado-liquido">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demonstração do Resultado</CardTitle>
          <CardDescription>Estrutura simplificada do DRE</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Receita Bruta</span>
              <span className="font-mono" data-testid="text-receita-bruta">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Deduções</span>
              <span className="font-mono text-red-600" data-testid="text-deducoes">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Receita Líquida</span>
              <span className="font-mono" data-testid="text-receita-liquida">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Custo das Vendas</span>
              <span className="font-mono text-red-600" data-testid="text-custo-vendas">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Lucro Bruto</span>
              <span className="font-mono" data-testid="text-lucro-bruto">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Despesas Operacionais</span>
              <span className="font-mono text-red-600" data-testid="text-despesas-operacionais">R$ 0,00</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="font-bold text-lg">Resultado Líquido</span>
              <span className="font-mono font-bold text-lg" data-testid="text-dre-resultado-final">R$ 0,00</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
