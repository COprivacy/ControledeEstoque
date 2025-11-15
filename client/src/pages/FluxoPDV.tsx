
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Bar, BarChart } from "recharts";
import { useMemo } from "react";

export default function FluxoPDV() {
  const { data: contasPagar = [] } = useQuery({
    queryKey: ["/api/contas-pagar"],
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["/api/contas-receber"],
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["/api/vendas"],
  });

  // Calcular entradas e saídas projetadas (próximos 30 dias)
  const hoje = new Date();
  const proximos30Dias = new Date();
  proximos30Dias.setDate(hoje.getDate() + 30);

  const entradaProjetada = useMemo(() => {
    return contasReceber
      .filter((c: any) => {
        if (c.status === 'recebido') return false;
        if (!c.data_vencimento) return false;
        const vencimento = new Date(c.data_vencimento);
        return vencimento >= hoje && vencimento <= proximos30Dias;
      })
      .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
  }, [contasReceber]);

  const saidaProjetada = useMemo(() => {
    return contasPagar
      .filter((c: any) => {
        if (c.status === 'pago') return false;
        if (!c.data_vencimento) return false;
        const vencimento = new Date(c.data_vencimento);
        return vencimento >= hoje && vencimento <= proximos30Dias;
      })
      .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);
  }, [contasPagar]);

  const saldoProjetado = entradaProjetada - saidaProjetada;

  // Gráfico de fluxo semanal (próximas 4 semanas)
  const chartData = useMemo(() => {
    const semanas = Array.from({ length: 4 }, (_, i) => {
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() + (i * 7));
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);

      const entradaSemana = contasReceber
        .filter((c: any) => {
          if (c.status === 'recebido') return false;
          if (!c.data_vencimento) return false;
          const vencimento = new Date(c.data_vencimento);
          return vencimento >= inicioSemana && vencimento <= fimSemana;
        })
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      const saidaSemana = contasPagar
        .filter((c: any) => {
          if (c.status === 'pago') return false;
          if (!c.data_vencimento) return false;
          const vencimento = new Date(c.data_vencimento);
          return vencimento >= inicioSemana && vencimento <= fimSemana;
        })
        .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

      return {
        semana: `Semana ${i + 1}`,
        entrada: Number(entradaSemana.toFixed(2)),
        saida: Number(saidaSemana.toFixed(2)),
        saldo: Number((entradaSemana - saidaSemana).toFixed(2)),
      };
    });

    return semanas;
  }, [contasPagar, contasReceber]);

  // Contas vencidas
  const contasVencidas = useMemo(() => {
    const pagarVencidas = contasPagar.filter((c: any) => {
      if (c.status === 'pago') return false;
      if (!c.data_vencimento) return false;
      return new Date(c.data_vencimento) < hoje;
    }).length;

    const receberVencidas = contasReceber.filter((c: any) => {
      if (c.status === 'recebido') return false;
      if (!c.data_vencimento) return false;
      return new Date(c.data_vencimento) < hoje;
    }).length;

    return { pagar: pagarVencidas, receber: receberVencidas };
  }, [contasPagar, contasReceber]);

  const temDados = chartData.some(d => d.entrada > 0 || d.saida > 0);

  // Análise por categoria de despesa
  const despesasPorCategoria = useMemo(() => {
    const categorias: Record<string, number> = {};
    
    contasPagar
      .filter((c: any) => c.status === 'pendente')
      .forEach((c: any) => {
        const cat = c.categoria || 'Outras';
        categorias[cat] = (categorias[cat] || 0) + (c.valor || 0);
      });

    return Object.entries(categorias)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [contasPagar]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Fluxo de Caixa Projetado</h1>
        <p className="text-muted-foreground mt-1">Análise de fluxo de caixa baseado em contas a pagar e receber</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrada Projetada</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-entrada-projetada">
              R$ {entradaProjetada.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saída Projetada</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-saida-projetada">
              R$ {saidaProjetada.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-blue-600' : 'text-red-600'}`} data-testid="text-saldo-projetado">
              R$ {saldoProjetado.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Contas Vencidas */}
      {(contasVencidas.pagar > 0 || contasVencidas.receber > 0) && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-orange-800 dark:text-orange-300 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Atenção: Contas Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contasVencidas.pagar > 0 && (
              <p className="text-sm text-orange-700 dark:text-orange-400">
                • {contasVencidas.pagar} conta(s) a pagar vencida(s)
              </p>
            )}
            {contasVencidas.receber > 0 && (
              <p className="text-sm text-orange-700 dark:text-orange-400">
                • {contasVencidas.receber} conta(s) a receber vencida(s)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Fluxo de Caixa Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Semanal</CardTitle>
          <CardDescription>Projeção para as próximas 4 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          {!temDados ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Dados insuficientes para gerar o gráfico</p>
              <p className="text-sm mt-2">Adicione contas a pagar e a receber para visualizar o fluxo projetado</p>
            </div>
          ) : (
            <LineChart width={800} height={300} data={chartData} className="mx-auto">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="entrada" stroke="#10b981" name="Entrada" strokeWidth={2} />
              <Line type="monotone" dataKey="saida" stroke="#ef4444" name="Saída" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" strokeWidth={2} />
            </LineChart>
          )}
        </CardContent>
      </Card>

      {/* Despesas por Categoria */}
      {despesasPorCategoria.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Despesas Pendentes por Categoria</CardTitle>
            <CardDescription>Top 5 categorias de despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart width={800} height={250} data={despesasPorCategoria} layout="horizontal" className="mx-auto">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="category" dataKey="name" />
              <YAxis type="number" />
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </CardContent>
        </Card>
      )}

      {/* Resumo Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Contas a Receber (Pendentes)</span>
              <span className="font-mono text-green-600">
                R$ {contasReceber.filter((c: any) => c.status === 'pendente').reduce((sum: number, c: any) => sum + (c.valor || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Contas a Pagar (Pendentes)</span>
              <span className="font-mono text-red-600">
                R$ {contasPagar.filter((c: any) => c.status === 'pendente').reduce((sum: number, c: any) => sum + (c.valor || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="font-semibold">Total de Vendas (Mês Atual)</span>
              <span className="font-mono text-blue-600">
                R$ {vendas.filter((v: any) => {
                  if (!v.data) return false;
                  const vendaDate = new Date(v.data);
                  return vendaDate.getMonth() === hoje.getMonth() && vendaDate.getFullYear() === hoje.getFullYear();
                }).reduce((sum: number, v: any) => sum + (v.valor_total || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
