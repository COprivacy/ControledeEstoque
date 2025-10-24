
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function FluxoPDV() {
  const { data: contasPagar = [] } = useQuery({
    queryKey: ["/api/contas-pagar"],
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["/api/contas-receber"],
  });

  const hoje = new Date();
  const proximos30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  const entradaProjetada = contasReceber
    .filter((c: any) => {
      const dataVenc = new Date(c.data_vencimento);
      return c.status === "pendente" && dataVenc >= hoje && dataVenc <= proximos30Dias;
    })
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const saidaProjetada = contasPagar
    .filter((c: any) => {
      const dataVenc = new Date(c.data_vencimento);
      return c.status === "pendente" && dataVenc >= hoje && dataVenc <= proximos30Dias;
    })
    .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

  const saldoProjetado = entradaProjetada - saidaProjetada;

  // Gerar dados do gráfico por semana
  const chartData = [];
  for (let i = 0; i < 4; i++) {
    const semanaInicio = new Date(hoje.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const semanaFim = new Date(semanaInicio.getTime() + 7 * 24 * 60 * 60 * 1000);

    const entradaSemana = contasReceber
      .filter((c: any) => {
        const dataVenc = new Date(c.data_vencimento);
        return c.status === "pendente" && dataVenc >= semanaInicio && dataVenc < semanaFim;
      })
      .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

    const saidaSemana = contasPagar
      .filter((c: any) => {
        const dataVenc = new Date(c.data_vencimento);
        return c.status === "pendente" && dataVenc >= semanaInicio && dataVenc < semanaFim;
      })
      .reduce((sum: number, c: any) => sum + (c.valor || 0), 0);

    chartData.push({
      semana: `Semana ${i + 1}`,
      entrada: entradaSemana,
      saida: saidaSemana,
      saldo: entradaSemana - saidaSemana,
    });
  }

  const temDados = contasPagar.length > 0 || contasReceber.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">Fluxo de Caixa Projetado</h1>
        <p className="text-muted-foreground mt-1">Análise de fluxo de caixa projetado baseado em contas a pagar e receber</p>
      </div>

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
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-blue-600' : 'text-red-600'}`} data-testid="text-saldo-projetado">
              R$ {saldoProjetado.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Fluxo de Caixa</CardTitle>
          <CardDescription>Visualização do fluxo de caixa projetado</CardDescription>
        </CardHeader>
        <CardContent>
          {!temDados ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Dados insuficientes para gerar o gráfico</p>
              <p className="text-sm mt-2">Adicione contas a pagar e a receber para visualizar o fluxo projetado</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis />
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="entrada" stroke="#10b981" name="Entrada" strokeWidth={2} />
                <Line type="monotone" dataKey="saida" stroke="#ef4444" name="Saída" strokeWidth={2} />
                <Line type="monotone" dataKey="saldo" stroke="#3b82f6" name="Saldo" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
