
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DRE() {
  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/vendas");
        return response.json();
      } catch (error) {
        console.error("Erro ao buscar vendas:", error);
        return [];
      }
    },
  });

  const { data: contasPagar = [] } = useQuery({
    queryKey: ["/api/contas-pagar"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/contas-pagar");
        return response.json();
      } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error);
        return [];
      }
    },
  });

  // Receita Total = Total de Vendas
  const receitaTotal = vendas.reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);

  // Despesas = Contas pagas
  const despesasTotais = contasPagar
    .filter((c: any) => c.status === "pago")
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  // Resultado Líquido = Receita - Despesas
  const resultadoLiquido = receitaTotal - despesasTotais;

  // Simulação de estrutura DRE
  const receitaBruta = receitaTotal;
  const deducoes = receitaTotal * 0.10; // 10% de deduções simuladas (impostos sobre vendas)
  const receitaLiquida = receitaBruta - deducoes;
  const custoVendas = receitaBruta * 0.60; // 60% como custo das vendas (CMV)
  const lucroBruto = receitaLiquida - custoVendas;
  const despesasOperacionais = despesasTotais;
  const resultadoFinal = lucroBruto - despesasOperacionais;

  // Análise de tendência com dados reais
  const last3Months = Array.from({ length: 3 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (2 - i));
    const monthNum = date.getMonth();
    const yearNum = date.getFullYear();
    
    const receitaMes = vendas
      .filter((v: any) => {
        if (!v.data) return false;
        const vendaDate = new Date(v.data);
        return vendaDate.getMonth() === monthNum && vendaDate.getFullYear() === yearNum;
      })
      .reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0);
    
    const despesasMes = contasPagar
      .filter((c: any) => {
        if (!c.data_pagamento || c.status !== 'pago') return false;
        const pagamentoDate = new Date(c.data_pagamento);
        return pagamentoDate.getMonth() === monthNum && pagamentoDate.getFullYear() === yearNum;
      })
      .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
    
    return {
      mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
      receita: Number(receitaMes.toFixed(2)),
      despesas: Number(despesasMes.toFixed(2)),
    };
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">DRE Completo</h1>
        <p className="text-muted-foreground mt-1">Demonstração do Resultado do Exercício com Análises</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-receita-total">
              R$ {receitaTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-despesas-totais">
              R$ {despesasTotais.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resultadoLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`} data-testid="text-resultado-liquido">
              R$ {resultadoLiquido.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Período atual</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência Trimestral</CardTitle>
          <CardDescription>Evolução de receitas e despesas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last3Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={2} name="Receita" />
                <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} name="Despesas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demonstração do Resultado</CardTitle>
          <CardDescription>Estrutura completa do DRE</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Receita Bruta</span>
              <span className="font-mono" data-testid="text-receita-bruta">
                R$ {receitaBruta.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Deduções (10%)</span>
              <span className="font-mono text-red-600" data-testid="text-deducoes">
                R$ {deducoes.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Receita Líquida</span>
              <span className="font-mono" data-testid="text-receita-liquida">
                R$ {receitaLiquida.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Custo das Vendas (60%)</span>
              <span className="font-mono text-red-600" data-testid="text-custo-vendas">
                R$ {custoVendas.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Lucro Bruto</span>
              <span className="font-mono" data-testid="text-lucro-bruto">
                R$ {lucroBruto.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-muted-foreground pl-4">(-) Despesas Operacionais</span>
              <span className="font-mono text-red-600" data-testid="text-despesas-operacionais">
                R$ {despesasOperacionais.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="font-bold text-lg">Resultado Líquido</span>
              <span className={`font-mono font-bold text-lg ${resultadoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-dre-resultado-final">
                R$ {resultadoFinal.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
